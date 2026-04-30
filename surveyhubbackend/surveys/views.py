from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes as drf_permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.models import User, Group
from django.db.models import Q, Count
from django.utils import timezone
from datetime import timedelta
from .models import Survey, Question, Response as SurveyResponse, Notification, Webhook
from .serializers import (
    SurveySerializer, SurveyCreateSerializer,
    QuestionSerializer, ResponseSerializer, UserSerializer,
)


class IsOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.creator == request.user


class SurveyListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return SurveyCreateSerializer
        return SurveySerializer

    def get_queryset(self):
        qs = Survey.objects.filter(creator=self.request.user)
        search = self.request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(description__icontains=search))
        return qs

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)


class SurveyDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return SurveyCreateSerializer
        return SurveySerializer

    def get_queryset(self):
        return Survey.objects.filter(creator=self.request.user)


class PublicSurveyDetailView(generics.RetrieveAPIView):
    """Read-only public view used by the survey-response page."""
    serializer_class = SurveySerializer
    permission_classes = [permissions.AllowAny]
    queryset = Survey.objects.filter(is_active=True)


class QuestionListCreateView(generics.ListCreateAPIView):
    serializer_class = QuestionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Question.objects.filter(survey_id=self.kwargs['survey_pk'])

    def perform_create(self, serializer):
        serializer.save(survey_id=self.kwargs['survey_pk'])


class QuestionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = QuestionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Question.objects.filter(survey_id=self.kwargs['survey_pk'])


class ResponseCreateView(generics.CreateAPIView):
    serializer_class = ResponseSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        survey_id = self.kwargs['survey_pk']
        x_forwarded_for = self.request.META.get('HTTP_X_FORWARDED_FOR')
        ip = x_forwarded_for.split(',')[0] if x_forwarded_for else self.request.META.get('REMOTE_ADDR')
        serializer.save(survey_id=survey_id, ip_address=ip)


class ResponseListView(generics.ListAPIView):
    serializer_class = ResponseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SurveyResponse.objects.filter(survey_id=self.kwargs['survey_pk'])


@api_view(['POST'])
@drf_permission_classes([permissions.AllowAny])
def register(request):
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')

    if not username or not email or not password:
        return Response({'error': 'Please provide username, email, and password'},
                        status=status.HTTP_400_BAD_REQUEST)
    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)
    if User.objects.filter(email=email).exists():
        return Response({'error': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(username=username, email=email, password=password)
    refresh = RefreshToken.for_user(user)
    return Response({
        'user': UserSerializer(user).data,
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@drf_permission_classes([permissions.AllowAny])
def login(request):
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        return Response({'error': 'Please provide username and password'},
                        status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(username=username, password=password)
    if not user:
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

    refresh = RefreshToken.for_user(user)
    return Response({
        'user': UserSerializer(user).data,
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    })


@api_view(['POST'])
def logout(request):
    return Response({'message': 'Logged out successfully'})


@api_view(['GET', 'PATCH'])
def user_profile(request):
    if not request.user.is_authenticated:
        return Response({'error': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
    if request.method == 'PATCH':
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    return Response(UserSerializer(request.user).data)


@api_view(['GET'])
def admin_stats(request):
    if not request.user.is_authenticated or not request.user.is_staff:
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    surveys = Survey.objects.select_related('creator').prefetch_related('questions').all()
    users = User.objects.all()
    return Response({
        'surveys': SurveySerializer(surveys, many=True).data,
        'users': UserSerializer(users, many=True).data,
        'total_surveys': surveys.count(),
        'total_users': users.count(),
        'total_responses': SurveyResponse.objects.count(),
    })


@api_view(['POST'])
def change_password(request):
    if not request.user.is_authenticated:
        return Response({'error': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
    old_password = request.data.get('old_password')
    new_password = request.data.get('new_password')
    if not old_password or not new_password:
        return Response({'error': 'Both old and new passwords required'}, status=status.HTTP_400_BAD_REQUEST)
    if not request.user.check_password(old_password):
        return Response({'error': 'Current password is incorrect'}, status=status.HTTP_400_BAD_REQUEST)
    request.user.set_password(new_password)
    request.user.save()
    return Response({'message': 'Password changed successfully'})


@api_view(['GET'])
def advanced_report(request):
    """Cross-survey aggregates for the authenticated user's surveys."""
    if not request.user.is_authenticated:
        return Response({'error': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)

    surveys = Survey.objects.filter(creator=request.user).annotate(
        num_responses=Count('responses')
    ).order_by('-created_at')

    now = timezone.now()
    last_30 = now - timedelta(days=30)
    last_7 = now - timedelta(days=7)

    total_responses = SurveyResponse.objects.filter(survey__creator=request.user).count()
    recent_30 = SurveyResponse.objects.filter(survey__creator=request.user, submitted_at__gte=last_30).count()
    recent_7 = SurveyResponse.objects.filter(survey__creator=request.user, submitted_at__gte=last_7).count()

    daily = (
        SurveyResponse.objects
        .filter(survey__creator=request.user, submitted_at__gte=last_30)
        .extra(select={'day': "date(submitted_at)"})
        .values('day')
        .annotate(count=Count('id'))
        .order_by('day')
    )

    breakdown = [
        {
            'id': s.id,
            'title': s.title,
            'is_active': s.is_active,
            'response_count': s.num_responses,
            'question_count': s.questions.count(),
            'created_at': s.created_at,
        }
        for s in surveys
    ]

    return Response({
        'total_surveys': surveys.count(),
        'active_surveys': surveys.filter(is_active=True).count(),
        'total_responses': total_responses,
        'responses_last_7_days': recent_7,
        'responses_last_30_days': recent_30,
        'daily_responses': list(daily),
        'survey_breakdown': breakdown,
    })


@api_view(['GET'])
def engagement_metrics(request):
    if not request.user.is_authenticated:
        return Response({'error': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)

    surveys = Survey.objects.filter(creator=request.user).prefetch_related('responses', 'questions')
    metrics = []
    for s in surveys:
        responses = s.responses.all()
        total = responses.count()
        # Completion time in seconds (only for responses that have started_at)
        timed = [
            (r.submitted_at - r.started_at).total_seconds()
            for r in responses
            if r.started_at and r.submitted_at and r.submitted_at > r.started_at
        ]
        avg_time = round(sum(timed) / len(timed)) if timed else None
        metrics.append({
            'id': s.id,
            'title': s.title,
            'is_active': s.is_active,
            'question_count': s.questions.count(),
            'total_responses': total,
            'avg_completion_seconds': avg_time,
        })

    total_responses = sum(m['total_responses'] for m in metrics)
    surveyed = [m for m in metrics if m['total_responses'] > 0]
    avg_response_rate = (
        round(sum(m['total_responses'] for m in surveyed) / len(surveyed))
        if surveyed else 0
    )

    return Response({
        'total_surveys': len(metrics),
        'total_responses': total_responses,
        'avg_responses_per_survey': avg_response_rate,
        'surveys': metrics,
    })


@api_view(['GET'])
def notification_list(request):
    if not request.user.is_authenticated:
        return Response({'error': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
    notifications = Notification.objects.filter(user=request.user).select_related('survey')
    data = [
        {
            'id': n.id,
            'message': n.message,
            'is_read': n.is_read,
            'created_at': n.created_at,
            'survey_id': n.survey_id,
            'survey_title': n.survey.title if n.survey else None,
        }
        for n in notifications
    ]
    unread_count = sum(1 for n in data if not n['is_read'])
    return Response({'notifications': data, 'unread_count': unread_count})


@api_view(['PATCH'])
def notification_mark_read(request, pk):
    if not request.user.is_authenticated:
        return Response({'error': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
    try:
        n = Notification.objects.get(pk=pk, user=request.user)
    except Notification.DoesNotExist:
        return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
    n.is_read = True
    n.save()
    return Response({'id': n.id, 'is_read': True})


@api_view(['POST'])
def notification_mark_all_read(request):
    if not request.user.is_authenticated:
        return Response({'error': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
    Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
    return Response({'message': 'All notifications marked as read'})


@api_view(['GET', 'POST'])
def role_list_create(request):
    if not request.user.is_authenticated or not request.user.is_staff:
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    if request.method == 'POST':
        name = request.data.get('name', '').strip()
        if not name:
            return Response({'error': 'Role name is required'}, status=status.HTTP_400_BAD_REQUEST)
        if Group.objects.filter(name=name).exists():
            return Response({'error': 'Role already exists'}, status=status.HTTP_400_BAD_REQUEST)
        group = Group.objects.create(name=name)
        return Response({'id': group.id, 'name': group.name}, status=status.HTTP_201_CREATED)
    groups = Group.objects.prefetch_related('user_set').all()
    return Response([
        {'id': g.id, 'name': g.name, 'member_count': g.user_set.count()}
        for g in groups
    ])


@api_view(['DELETE'])
def role_delete(request, pk):
    if not request.user.is_authenticated or not request.user.is_staff:
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    try:
        Group.objects.get(pk=pk).delete()
    except Group.DoesNotExist:
        return Response({'error': 'Role not found'}, status=status.HTTP_404_NOT_FOUND)
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
def role_members(request, pk):
    if not request.user.is_authenticated or not request.user.is_staff:
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    try:
        group = Group.objects.get(pk=pk)
    except Group.DoesNotExist:
        return Response({'error': 'Role not found'}, status=status.HTTP_404_NOT_FOUND)
    return Response(UserSerializer(group.user_set.all(), many=True).data)


@api_view(['POST', 'DELETE'])
def role_assign_user(request, pk):
    if not request.user.is_authenticated or not request.user.is_staff:
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    try:
        group = Group.objects.get(pk=pk)
    except Group.DoesNotExist:
        return Response({'error': 'Role not found'}, status=status.HTTP_404_NOT_FOUND)
    user_id = request.data.get('user_id')
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    if request.method == 'POST':
        group.user_set.add(user)
    else:
        group.user_set.remove(user)
    return Response({'id': group.id, 'name': group.name, 'member_count': group.user_set.count()})


@api_view(['PATCH'])
def admin_toggle_user(request, pk):
    if not request.user.is_authenticated or not request.user.is_staff:
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    try:
        user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    field = request.data.get('field')
    if field == 'is_active':
        user.is_active = not user.is_active
    elif field == 'is_staff':
        user.is_staff = not user.is_staff
    else:
        return Response({'error': 'Invalid field'}, status=status.HTTP_400_BAD_REQUEST)
    user.save()
    return Response(UserSerializer(user).data)


# ── AI endpoints ──────────────────────────────────────────────────────────────

@api_view(['POST'])
def ai_generate_survey(request):
    """Generate survey questions from a topic using Gemini."""
    if not request.user.is_authenticated:
        return Response({'error': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)

    topic = request.data.get('topic', '').strip()
    num_questions = min(int(request.data.get('num_questions', 5)), 15)
    if not topic:
        return Response({'error': 'Topic is required'}, status=status.HTTP_400_BAD_REQUEST)

    from .ai_client import call_gemini

    prompt = f"""You are a survey design expert. Generate {num_questions} survey questions for the topic: "{topic}".

Return ONLY valid JSON (no markdown, no explanation) in this exact format:
{{
  "title": "Survey title here",
  "description": "Brief survey description",
  "questions": [
    {{
      "question_text": "Question text here",
      "question_type": "text|multiple_choice|rating|yes_no",
      "required": true,
      "choices": ["Choice A", "Choice B"]
    }}
  ]
}}

Rules:
- Mix question types: use at least one rating, one yes_no, and one multiple_choice
- Only include "choices" for multiple_choice questions; omit for other types
- Make questions specific and actionable for the topic
- required is a boolean"""

    result = call_gemini(prompt, caller="ai_generate_survey")

    if 'error' in result:
        msg = {
            'quota_exhausted': 'AI quota exceeded. Please try again later.',
            'timeout': 'AI request timed out. Please try again.',
        }.get(result['error'], 'AI service unavailable. Please try again.')
        return Response({'error': msg}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    return Response(result)


@api_view(['POST'])
def ai_recommendations(request):
    """Analyse survey responses and return actionable insights using Gemini."""
    if not request.user.is_authenticated:
        return Response({'error': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)

    survey_id = request.data.get('survey_id')
    if not survey_id:
        return Response({'error': 'survey_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        survey = Survey.objects.get(pk=survey_id, creator=request.user)
    except Survey.DoesNotExist:
        return Response({'error': 'Survey not found'}, status=status.HTTP_404_NOT_FOUND)

    responses = SurveyResponse.objects.filter(survey=survey).prefetch_related('answers__question')
    if not responses.exists():
        return Response({'error': 'No responses to analyse yet.'}, status=status.HTTP_400_BAD_REQUEST)

    # Build a compact summary of answers for the prompt
    summary_lines = [f'Survey: "{survey.title}"', f'Total responses: {responses.count()}', '']
    for question in survey.questions.all():
        answers = [a.answer_text for r in responses for a in r.answers.filter(question=question) if a.answer_text]
        if not answers:
            continue
        summary_lines.append(f'Q: {question.question_text} ({question.question_type})')
        if question.question_type == 'text':
            summary_lines.append(f'Sample answers: {"; ".join(answers[:10])}')
        else:
            from collections import Counter
            counts = Counter(answers)
            summary_lines.append('Distribution: ' + ', '.join(f'{k}: {v}' for k, v in counts.most_common()))
        summary_lines.append('')

    from .ai_client import call_gemini

    prompt = f"""You are a survey analytics expert. Analyse the following survey data and return actionable insights.

{chr(10).join(summary_lines)}

Return ONLY valid JSON (no markdown):
{{
  "summary": "2-3 sentence executive summary",
  "sentiment": "positive|neutral|negative",
  "key_findings": ["finding 1", "finding 2", "finding 3"],
  "recommendations": [
    {{"title": "Recommendation title", "detail": "Actionable detail"}}
  ],
  "follow_up_questions": ["Question to ask in a follow-up survey"]
}}"""

    result = call_gemini(prompt, caller="ai_recommendations")

    if 'error' in result:
        msg = {
            'quota_exhausted': 'AI quota exceeded. Please try again later.',
            'timeout': 'AI request timed out.',
        }.get(result['error'], 'AI service unavailable.')
        return Response({'error': msg}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    return Response(result)


@api_view(['POST'])
def ai_chat(request):
    """Conversational survey builder — takes chat history, returns next AI message + optional question draft."""
    if not request.user.is_authenticated:
        return Response({'error': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)

    messages = request.data.get('messages', [])
    if not isinstance(messages, list):
        return Response({'error': 'messages must be a list'}, status=status.HTTP_400_BAD_REQUEST)

    # Build conversation context
    history = '\n'.join(
        f"{'User' if m.get('role') == 'user' else 'Assistant'}: {m.get('content', '')}"
        for m in messages[-10:]
    )

    from .ai_client import call_gemini

    prompt = f"""You are a helpful survey creation assistant. Your job is to help users design a survey through conversation.
Ask clarifying questions about their goals, audience, and what they want to measure. Once you have enough information, suggest specific questions.

Conversation so far:
{history}

Respond in JSON only (no markdown):
{{
  "message": "Your conversational response here",
  "suggested_questions": [
    {{
      "question_text": "...",
      "question_type": "text|multiple_choice|rating|yes_no",
      "required": true,
      "choices": ["A", "B"]
    }}
  ],
  "ready_to_create": false
}}

Rules:
- suggested_questions: only include when you have enough context to propose concrete questions (otherwise empty array)
- ready_to_create: set true only when you have proposed a full set of 3+ questions and the user seems satisfied
- choices: only for multiple_choice questions
- Keep message conversational and under 100 words"""

    result = call_gemini(prompt, caller="ai_chat")

    if 'error' in result:
        msg = {
            'quota_exhausted': 'AI quota exceeded.',
            'timeout': 'AI timed out.',
        }.get(result['error'], 'AI unavailable.')
        return Response({'error': msg}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    return Response(result)


# ── Webhook endpoints ──────────────────────────────────────────────────────────

def _serialize_webhook(hook):
    return {
        'id': hook.id,
        'url': hook.url,
        'survey_id': hook.survey_id,
        'survey_title': hook.survey.title if hook.survey else None,
        'is_active': hook.is_active,
        'secret': hook.secret,
        'created_at': hook.created_at,
        'last_triggered_at': hook.last_triggered_at,
        'last_status': hook.last_status,
    }


@api_view(['GET', 'POST'])
def webhook_list_create(request):
    if not request.user.is_authenticated:
        return Response({'error': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)

    if request.method == 'POST':
        url = request.data.get('url', '').strip()
        if not url:
            return Response({'error': 'url is required'}, status=status.HTTP_400_BAD_REQUEST)
        survey_id = request.data.get('survey_id') or None
        survey = None
        if survey_id:
            try:
                survey = Survey.objects.get(pk=survey_id, creator=request.user)
            except Survey.DoesNotExist:
                return Response({'error': 'Survey not found'}, status=status.HTTP_404_NOT_FOUND)
        hook = Webhook.objects.create(
            owner=request.user,
            url=url,
            survey=survey,
            secret=request.data.get('secret', ''),
            is_active=True,
        )
        return Response(_serialize_webhook(hook), status=status.HTTP_201_CREATED)

    hooks = Webhook.objects.filter(owner=request.user).select_related('survey')
    return Response([_serialize_webhook(h) for h in hooks])


@api_view(['PATCH', 'DELETE'])
def webhook_detail(request, pk):
    if not request.user.is_authenticated:
        return Response({'error': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
    try:
        hook = Webhook.objects.get(pk=pk, owner=request.user)
    except Webhook.DoesNotExist:
        return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'DELETE':
        hook.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    if 'is_active' in request.data:
        hook.is_active = bool(request.data['is_active'])
    if 'url' in request.data:
        hook.url = request.data['url'].strip()
    if 'secret' in request.data:
        hook.secret = request.data['secret']
    hook.save()
    return Response(_serialize_webhook(hook))

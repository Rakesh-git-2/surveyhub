from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Survey, Question, Choice, Response, Answer

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'is_active', 'is_staff')
        read_only_fields = ('id', 'is_active', 'is_staff')

class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ('id', 'choice_text', 'order')
        read_only_fields = ('id',)

class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True, required=False)

    class Meta:
        model = Question
        fields = ('id', 'question_text', 'question_type', 'required', 'order', 'choices')
        read_only_fields = ('id',)

    def create(self, validated_data):
        choices_data = validated_data.pop('choices', [])
        question = Question.objects.create(**validated_data)
        for choice_data in choices_data:
            Choice.objects.create(question=question, **choice_data)
        return question

    def update(self, instance, validated_data):
        choices_data = validated_data.pop('choices', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if choices_data is not None:
            instance.choices.all().delete()
            for choice_data in choices_data:
                Choice.objects.create(question=instance, **choice_data)
        return instance

class AnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Answer
        fields = ('id', 'question', 'answer_text')
        read_only_fields = ('id',)

class SurveySerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    creator = UserSerializer(read_only=True)
    response_count = serializers.IntegerField(source='responses.count', read_only=True)

    class Meta:
        model = Survey
        fields = ('id', 'title', 'description', 'creator', 'created_at', 'updated_at', 'is_active', 'allow_anonymous', 'questions', 'response_count')
        read_only_fields = ('id', 'created_at', 'updated_at', 'creator')

class SurveyCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Survey
        fields = ('id', 'title', 'description', 'is_active', 'allow_anonymous')
        read_only_fields = ('id',)

class ResponseSerializer(serializers.ModelSerializer):
    answers = AnswerSerializer(many=True)

    class Meta:
        model = Response
        fields = ('id', 'survey', 'respondent', 'respondent_identifier', 'started_at', 'submitted_at', 'ip_address', 'answers')
        read_only_fields = ('id', 'survey', 'respondent', 'submitted_at', 'ip_address')

    def create(self, validated_data):
        answers_data = validated_data.pop('answers')
        response = Response.objects.create(**validated_data)
        for answer_data in answers_data:
            Answer.objects.create(response=response, **answer_data)
        return response
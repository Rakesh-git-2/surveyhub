from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Survey, Question, Notification, Webhook


def auth_headers(user):
    token = RefreshToken.for_user(user).access_token
    return {'HTTP_AUTHORIZATION': f'Bearer {token}'}


def make_user(username='testuser', password='pass1234', **kwargs):
    return User.objects.create_user(username=username, password=password, email=f'{username}@example.com', **kwargs)


def make_survey(creator, **kwargs):
    defaults = {'title': 'Test Survey', 'is_active': True, 'allow_anonymous': False}
    defaults.update(kwargs)
    return Survey.objects.create(creator=creator, **defaults)


# ── Auth ──────────────────────────────────────────────────────────────────────

class RegisterTests(APITestCase):
    url = '/api/auth/register/'

    def test_register_success(self):
        r = self.client.post(self.url, {'username': 'alice', 'email': 'alice@example.com', 'password': 'secret123'})
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        self.assertIn('access', r.data)
        self.assertIn('refresh', r.data)

    def test_register_duplicate_username(self):
        make_user('alice')
        r = self.client.post(self.url, {'username': 'alice', 'email': 'other@example.com', 'password': 'secret123'})
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_missing_fields(self):
        r = self.client.post(self.url, {'username': 'alice'})
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)


class LoginTests(APITestCase):
    url = '/api/auth/login/'

    def setUp(self):
        self.user = make_user('alice', 'secret123')

    def test_login_success(self):
        r = self.client.post(self.url, {'username': 'alice', 'password': 'secret123'})
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertIn('access', r.data)

    def test_login_wrong_password(self):
        r = self.client.post(self.url, {'username': 'alice', 'password': 'wrong'})
        self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_missing_fields(self):
        r = self.client.post(self.url, {'username': 'alice'})
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)


class UserProfileTests(APITestCase):
    url = '/api/auth/user/'

    def setUp(self):
        self.user = make_user('alice')
        self.headers = auth_headers(self.user)

    def test_get_profile(self):
        r = self.client.get(self.url, **self.headers)
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.data['username'], 'alice')

    def test_patch_profile(self):
        r = self.client.patch(self.url, {'first_name': 'Alice'}, content_type='application/json', **self.headers)
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.data['first_name'], 'Alice')

    def test_unauthenticated(self):
        r = self.client.get(self.url)
        self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)


# ── Surveys ───────────────────────────────────────────────────────────────────

class SurveyListCreateTests(APITestCase):
    url = '/api/surveys/'

    def setUp(self):
        self.user = make_user('alice')
        self.other = make_user('bob')
        self.headers = auth_headers(self.user)

    def test_create_survey(self):
        r = self.client.post(self.url, {'title': 'My Survey', 'is_active': True, 'allow_anonymous': False}, **self.headers)
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        self.assertEqual(r.data['title'], 'My Survey')

    def test_list_own_surveys_only(self):
        make_survey(self.user, title='Mine')
        make_survey(self.other, title='Theirs')
        r = self.client.get(self.url, **self.headers)
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        titles = [s['title'] for s in r.data['results']]
        self.assertIn('Mine', titles)
        self.assertNotIn('Theirs', titles)

    def test_search(self):
        make_survey(self.user, title='Employee Satisfaction')
        make_survey(self.user, title='Product Feedback')
        r = self.client.get(self.url + '?search=employee', **self.headers)
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(len(r.data['results']), 1)
        self.assertEqual(r.data['results'][0]['title'], 'Employee Satisfaction')

    def test_unauthenticated(self):
        r = self.client.get(self.url)
        self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)


class SurveyDetailTests(APITestCase):
    def setUp(self):
        self.user = make_user('alice')
        self.other = make_user('bob')
        self.survey = make_survey(self.user)
        self.headers = auth_headers(self.user)

    def test_get_own_survey(self):
        r = self.client.get(f'/api/surveys/{self.survey.id}/', **self.headers)
        self.assertEqual(r.status_code, status.HTTP_200_OK)

    def test_cannot_get_other_survey(self):
        other_survey = make_survey(self.other)
        r = self.client.get(f'/api/surveys/{other_survey.id}/', **self.headers)
        self.assertEqual(r.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_survey(self):
        r = self.client.patch(
            f'/api/surveys/{self.survey.id}/',
            {'title': 'Updated'},
            content_type='application/json',
            **self.headers,
        )
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.data['title'], 'Updated')

    def test_delete_survey(self):
        r = self.client.delete(f'/api/surveys/{self.survey.id}/', **self.headers)
        self.assertEqual(r.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Survey.objects.filter(pk=self.survey.id).exists())


class PublicSurveyDetailTests(APITestCase):
    def setUp(self):
        self.user = make_user('alice')
        self.survey = make_survey(self.user, is_active=True)

    def test_public_active_survey(self):
        r = self.client.get(f'/api/surveys/{self.survey.id}/public/')
        self.assertEqual(r.status_code, status.HTTP_200_OK)

    def test_public_inactive_survey_404(self):
        self.survey.is_active = False
        self.survey.save()
        r = self.client.get(f'/api/surveys/{self.survey.id}/public/')
        self.assertEqual(r.status_code, status.HTTP_404_NOT_FOUND)


# ── Questions ─────────────────────────────────────────────────────────────────

class QuestionTests(APITestCase):
    def setUp(self):
        self.user = make_user('alice')
        self.survey = make_survey(self.user)
        self.headers = auth_headers(self.user)
        self.url = f'/api/surveys/{self.survey.id}/questions/'

    def test_create_text_question(self):
        r = self.client.post(self.url, {'question_text': 'How are you?', 'question_type': 'text', 'required': True, 'order': 1}, **self.headers)
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)

    def test_create_multiple_choice_question(self):
        payload = {
            'question_text': 'Favourite colour?',
            'question_type': 'multiple_choice',
            'required': True,
            'order': 1,
            'choices': [{'choice_text': 'Red', 'order': 1}, {'choice_text': 'Blue', 'order': 2}],
        }
        r = self.client.post(self.url, payload, format='json', **self.headers)
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(r.data['choices']), 2)

    def test_list_questions(self):
        Question.objects.create(survey=self.survey, question_text='Q1', question_type='text', required=True, order=1)
        r = self.client.get(self.url, **self.headers)
        self.assertEqual(r.status_code, status.HTTP_200_OK)

    def test_delete_question(self):
        q = Question.objects.create(survey=self.survey, question_text='Q1', question_type='text', required=True, order=1)
        r = self.client.delete(f'{self.url}{q.id}/', **self.headers)
        self.assertEqual(r.status_code, status.HTTP_204_NO_CONTENT)


# ── Responses ─────────────────────────────────────────────────────────────────

class ResponseTests(APITestCase):
    def setUp(self):
        self.owner = make_user('alice')
        self.survey = make_survey(self.owner, allow_anonymous=True)
        self.q = Question.objects.create(
            survey=self.survey, question_text='Rating?', question_type='rating', required=True, order=1
        )

    def test_submit_anonymous_response(self):
        payload = {'answers': [{'question': self.q.id, 'answer_text': '5'}]}
        r = self.client.post(f'/api/surveys/{self.survey.id}/responses/', payload, format='json')
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)

    def test_response_creates_notification(self):
        payload = {'answers': [{'question': self.q.id, 'answer_text': '4'}]}
        self.client.post(f'/api/surveys/{self.survey.id}/responses/', payload, format='json')
        self.assertTrue(Notification.objects.filter(user=self.owner, survey=self.survey).exists())

    def test_list_responses_requires_auth(self):
        r = self.client.get(f'/api/surveys/{self.survey.id}/responses/list/')
        self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_responses_authenticated(self):
        headers = auth_headers(self.owner)
        r = self.client.get(f'/api/surveys/{self.survey.id}/responses/list/', **headers)
        self.assertEqual(r.status_code, status.HTTP_200_OK)


# ── Notifications ─────────────────────────────────────────────────────────────

class NotificationTests(APITestCase):
    def setUp(self):
        self.user = make_user('alice')
        self.survey = make_survey(self.user)
        self.headers = auth_headers(self.user)
        self.n = Notification.objects.create(user=self.user, survey=self.survey, message='New response')

    def test_list_notifications(self):
        r = self.client.get('/api/notifications/', **self.headers)
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.data['unread_count'], 1)

    def test_mark_read(self):
        r = self.client.patch(f'/api/notifications/{self.n.id}/read/', **self.headers)
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertTrue(r.data['is_read'])

    def test_mark_all_read(self):
        r = self.client.post('/api/notifications/read-all/', **self.headers)
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.n.refresh_from_db()
        self.assertTrue(self.n.is_read)


# ── Admin ─────────────────────────────────────────────────────────────────────

class AdminStatsTests(APITestCase):
    url = '/api/admin/stats/'

    def setUp(self):
        self.staff = make_user('admin', is_staff=True)
        self.regular = make_user('bob')

    def test_staff_access(self):
        r = self.client.get(self.url, **auth_headers(self.staff))
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertIn('total_surveys', r.data)

    def test_non_staff_denied(self):
        r = self.client.get(self.url, **auth_headers(self.regular))
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)


class AdminToggleUserTests(APITestCase):
    def setUp(self):
        self.staff = make_user('admin', is_staff=True)
        self.target = make_user('bob')

    def test_toggle_is_active(self):
        r = self.client.patch(
            f'/api/admin/users/{self.target.id}/toggle/',
            {'field': 'is_active'},
            content_type='application/json',
            **auth_headers(self.staff),
        )
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.target.refresh_from_db()
        self.assertFalse(self.target.is_active)


# ── Advanced Reporting ────────────────────────────────────────────────────────

class AdvancedReportTests(APITestCase):
    url = '/api/admin/advanced-report/'

    def setUp(self):
        self.user = make_user('alice')
        self.headers = auth_headers(self.user)
        make_survey(self.user)

    def test_returns_aggregates(self):
        r = self.client.get(self.url, **self.headers)
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        for key in ('total_surveys', 'total_responses', 'responses_last_7_days', 'survey_breakdown'):
            self.assertIn(key, r.data)


# ── Webhooks ──────────────────────────────────────────────────────────────────

class WebhookTests(APITestCase):
    url = '/api/webhooks/'

    def setUp(self):
        self.user = make_user('alice')
        self.other = make_user('bob')
        self.survey = make_survey(self.user)
        self.headers = auth_headers(self.user)

    def test_create_global_webhook(self):
        r = self.client.post(self.url, {'url': 'https://example.com/hook'}, **self.headers)
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(r.data['survey_id'])

    def test_create_survey_specific_webhook(self):
        r = self.client.post(
            self.url,
            {'url': 'https://example.com/hook', 'survey_id': self.survey.id},
            **self.headers,
        )
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        self.assertEqual(r.data['survey_id'], self.survey.id)

    def test_cannot_attach_to_other_users_survey(self):
        other_survey = make_survey(self.other)
        r = self.client.post(
            self.url,
            {'url': 'https://example.com/hook', 'survey_id': other_survey.id},
            **self.headers,
        )
        self.assertEqual(r.status_code, status.HTTP_404_NOT_FOUND)

    def test_list_own_webhooks_only(self):
        Webhook.objects.create(owner=self.user, url='https://mine.com/hook')
        Webhook.objects.create(owner=self.other, url='https://theirs.com/hook')
        r = self.client.get(self.url, **self.headers)
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        urls = [h['url'] for h in r.data]
        self.assertIn('https://mine.com/hook', urls)
        self.assertNotIn('https://theirs.com/hook', urls)

    def test_toggle_active(self):
        hook = Webhook.objects.create(owner=self.user, url='https://example.com/hook', is_active=True)
        r = self.client.patch(
            f'/api/webhooks/{hook.id}/',
            {'is_active': False},
            content_type='application/json',
            **self.headers,
        )
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertFalse(r.data['is_active'])

    def test_delete_webhook(self):
        hook = Webhook.objects.create(owner=self.user, url='https://example.com/hook')
        r = self.client.delete(f'/api/webhooks/{hook.id}/', **self.headers)
        self.assertEqual(r.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Webhook.objects.filter(pk=hook.id).exists())

    def test_cannot_delete_other_users_webhook(self):
        hook = Webhook.objects.create(owner=self.other, url='https://theirs.com/hook')
        r = self.client.delete(f'/api/webhooks/{hook.id}/', **self.headers)
        self.assertEqual(r.status_code, status.HTTP_404_NOT_FOUND)

    def test_unauthenticated(self):
        r = self.client.get(self.url)
        self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)

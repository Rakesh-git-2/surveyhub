from django.urls import path
from . import views

app_name = 'surveys'

urlpatterns = [
    # Authentication endpoints
    path('auth/register/', views.register, name='register'),
    path('auth/login/', views.login, name='login'),
    path('auth/logout/', views.logout, name='logout'),
    path('auth/user/', views.user_profile, name='user-profile'),
    path('auth/change-password/', views.change_password, name='change-password'),
    path('admin/stats/', views.admin_stats, name='admin-stats'),
    path('admin/advanced-report/', views.advanced_report, name='advanced-report'),
    path('admin/engagement-metrics/', views.engagement_metrics, name='engagement-metrics'),

    # AI endpoints
    path('ai/generate-survey/', views.ai_generate_survey, name='ai-generate-survey'),
    path('ai/recommendations/', views.ai_recommendations, name='ai-recommendations'),
    path('ai/chat/', views.ai_chat, name='ai-chat'),

    # Notifications
    path('notifications/', views.notification_list, name='notification-list'),
    path('notifications/<int:pk>/read/', views.notification_mark_read, name='notification-read'),
    path('notifications/read-all/', views.notification_mark_all_read, name='notification-read-all'),

    # Survey endpoints
    path('surveys/', views.SurveyListCreateView.as_view(), name='survey-list-create'),
    path('surveys/<int:pk>/', views.SurveyDetailView.as_view(), name='survey-detail'),

    # Question endpoints (nested under surveys)
    path('surveys/<int:survey_pk>/questions/', views.QuestionListCreateView.as_view(), name='question-list-create'),
    path('surveys/<int:survey_pk>/questions/<int:pk>/', views.QuestionDetailView.as_view(), name='question-detail'),

    # Public read-only survey detail (used by survey-response page, no auth required)
    path('surveys/<int:pk>/public/', views.PublicSurveyDetailView.as_view(), name='survey-public'),

    # Response endpoints
    path('surveys/<int:survey_pk>/responses/', views.ResponseCreateView.as_view(), name='response-create'),
    path('surveys/<int:survey_pk>/responses/list/', views.ResponseListView.as_view(), name='response-list'),

    # Admin user management
    path('admin/users/<int:pk>/toggle/', views.admin_toggle_user, name='admin-toggle-user'),

    # Webhook integrations
    path('webhooks/', views.webhook_list_create, name='webhook-list-create'),
    path('webhooks/<int:pk>/', views.webhook_detail, name='webhook-detail'),

    # Role (Group) management
    path('admin/roles/', views.role_list_create, name='role-list-create'),
    path('admin/roles/<int:pk>/', views.role_delete, name='role-delete'),
    path('admin/roles/<int:pk>/members/', views.role_members, name='role-members'),
    path('admin/roles/<int:pk>/assign/', views.role_assign_user, name='role-assign-user'),
]
import hashlib
import hmac
import json
import threading
import urllib.request

from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Response as SurveyResponse, Notification, Webhook
from django.utils import timezone


@receiver(post_save, sender=SurveyResponse)
def notify_survey_creator(sender, instance, created, **kwargs):
    if not created:
        return
    survey = instance.survey
    creator = survey.creator
    respondent = instance.respondent.username if instance.respondent else (instance.respondent_identifier or 'Anonymous')
    Notification.objects.create(
        user=creator,
        survey=survey,
        message=f'New response from {respondent} on "{survey.title}"',
    )


@receiver(post_save, sender=SurveyResponse)
def fire_webhooks(sender, instance, created, **kwargs):
    if not created:
        return
    survey = instance.survey

    hooks = Webhook.objects.filter(
        owner=survey.creator,
        is_active=True,
    ).filter(
        # survey-specific or global (survey=None)
        **{'survey': survey} if False else {}  # evaluated below
    )
    # Manual filter: match survey-specific OR global hooks
    hooks = Webhook.objects.filter(
        owner=survey.creator,
        is_active=True,
    ).filter(
        survey=survey
    ) | Webhook.objects.filter(
        owner=survey.creator,
        is_active=True,
        survey__isnull=True,
    )

    if not hooks.exists():
        return

    payload = {
        'event': 'response.created',
        'survey_id': survey.id,
        'survey_title': survey.title,
        'response_id': instance.id,
        'submitted_at': instance.submitted_at.isoformat(),
        'respondent': instance.respondent.username if instance.respondent else None,
    }
    payload_bytes = json.dumps(payload).encode('utf-8')

    def deliver(hook):
        headers = {
            'Content-Type': 'application/json',
            'X-SurveyHub-Event': 'response.created',
        }
        if hook.secret:
            sig = hmac.new(hook.secret.encode(), payload_bytes, hashlib.sha256).hexdigest()
            headers['X-SurveyHub-Signature'] = f'sha256={sig}'

        try:
            req = urllib.request.Request(hook.url, data=payload_bytes, headers=headers, method='POST')
            with urllib.request.urlopen(req, timeout=10) as resp:
                http_status = resp.status
        except Exception:
            http_status = 0

        Webhook.objects.filter(pk=hook.pk).update(
            last_triggered_at=timezone.now(),
            last_status=http_status,
        )

    for hook in hooks:
        threading.Thread(target=deliver, args=(hook,), daemon=True).start()

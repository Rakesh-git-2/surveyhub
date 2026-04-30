from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Survey(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    creator = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    allow_anonymous = models.BooleanField(default=False)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['-created_at']

class Question(models.Model):
    QUESTION_TYPES = [
        ('text', 'Text'),
        ('multiple_choice', 'Multiple Choice'),
        ('rating', 'Rating Scale'),
        ('yes_no', 'Yes/No'),
    ]

    survey = models.ForeignKey(Survey, on_delete=models.CASCADE, related_name='questions')
    question_text = models.CharField(max_length=500)
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPES)
    required = models.BooleanField(default=False)
    order = models.PositiveIntegerField()

    def __str__(self):
        return f"{self.survey.title} - {self.question_text}"

    class Meta:
        ordering = ['order']

class Choice(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='choices')
    choice_text = models.CharField(max_length=200)
    order = models.PositiveIntegerField()

    def __str__(self):
        return self.choice_text

    class Meta:
        ordering = ['order']

class Response(models.Model):
    survey = models.ForeignKey(Survey, on_delete=models.CASCADE, related_name='responses')
    respondent = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    respondent_identifier = models.CharField(max_length=100, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    submitted_at = models.DateTimeField(default=timezone.now)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    def __str__(self):
        if self.respondent:
            return f"Response by {self.respondent.username} to {self.survey.title}"
        else:
            return f"Anonymous response to {self.survey.title}"

    class Meta:
        ordering = ['-submitted_at']
        verbose_name = "Survey Response"
        verbose_name_plural = "Survey Responses"

class Answer(models.Model):
    response = models.ForeignKey(Response, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    answer_text = models.TextField(blank=True)

    def __str__(self):
        return f"Answer to {self.question.question_text}"


class Webhook(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='webhooks')
    url = models.URLField(max_length=500)
    survey = models.ForeignKey(Survey, on_delete=models.CASCADE, null=True, blank=True, related_name='webhooks')
    is_active = models.BooleanField(default=True)
    secret = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    last_triggered_at = models.DateTimeField(null=True, blank=True)
    last_status = models.PositiveSmallIntegerField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        target = self.survey.title if self.survey else 'all surveys'
        return f"Webhook for {self.owner.username} → {self.url} ({target})"


class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    message = models.CharField(max_length=500)
    survey = models.ForeignKey(Survey, on_delete=models.CASCADE, null=True, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification for {self.user.username}: {self.message}"
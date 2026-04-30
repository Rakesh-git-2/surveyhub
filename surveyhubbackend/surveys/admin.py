from django.contrib import admin
from .models import Survey, Question, Choice, Response, Answer

class ChoiceInline(admin.TabularInline):
    model = Choice
    extra = 3

class QuestionInline(admin.StackedInline):
    model = Question
    extra = 1
    inlines = [ChoiceInline]

@admin.register(Survey)
class SurveyAdmin(admin.ModelAdmin):
    list_display = ('title', 'creator', 'created_at', 'is_active')
    list_filter = ('is_active', 'created_at', 'creator')
    search_fields = ('title', 'description')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('question_text', 'survey', 'question_type', 'required', 'order')
    list_filter = ('question_type', 'required', 'survey')
    search_fields = ('question_text',)
    inlines = [ChoiceInline]

@admin.register(Choice)
class ChoiceAdmin(admin.ModelAdmin):
    list_display = ('choice_text', 'question', 'order')
    list_filter = ('question__survey', 'question')

@admin.register(Response)
class ResponseAdmin(admin.ModelAdmin):
    list_display = ('survey', 'respondent', 'submitted_at')
    list_filter = ('survey', 'submitted_at')
    readonly_fields = ('submitted_at',)

@admin.register(Answer)
class AnswerAdmin(admin.ModelAdmin):
    list_display = ('question', 'response', 'answer_text')
    list_filter = ('question__survey', 'response__survey')
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'users', views.UserViewSet)
router.register(r'profiles', views.UserProfileViewSet)
router.register(r'sessions', views.TherapySessionViewSet)
router.register(r'messages', views.MessageViewSet)
router.register(r'goals', views.GoalViewSet)
router.register(r'mood-logs', views.MoodLogViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('sessions/<int:session_id>/send_message/', views.send_message, name='send_message'),
    path('sessions/<int:session_id>/end/', views.end_session, name='end_session'),
    path('sessions/<int:session_id>/check_status/', views.check_session_status_view, name='check_session_status'),
    path('analyze_patterns/', views.analyze_patterns, name='analyze_patterns'),
    path('recommendations/<str:recommendation_id>/feedback/', views.feedback_recommendation, name='feedback_recommendation'),
] 
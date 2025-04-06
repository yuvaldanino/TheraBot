from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth.models import User
from .models import UserProfile, TherapySession, Message, Goal, MoodLog
from .serializers import (
    UserSerializer, UserProfileSerializer, TherapySessionSerializer,
    MessageSerializer, GoalSerializer, MoodLogSerializer
)
from .tasks import analyze_session, generate_therapist_response, check_session_status, generate_session_summary, analyze_long_term_patterns
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

# Create your views here.

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return User.objects.filter(id=self.request.user.id)

class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserProfile.objects.filter(user=self.request.user)

    @action(detail=False, methods=['post'])
    def check_in(self, request):
        profile = self.get_queryset().first()
        if profile:
            profile.last_check_in = timezone.now()
            profile.save()
            return Response({'status': 'check-in recorded'})
        return Response({'error': 'profile not found'}, status=status.HTTP_404_NOT_FOUND)

class TherapySessionViewSet(viewsets.ModelViewSet):
    queryset = TherapySession.objects.all()
    serializer_class = TherapySessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return TherapySession.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        session = self.get_object()
        content = request.data.get('content')
        
        if not content:
            return Response({'error': 'content is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Save user message
        user_message = Message.objects.create(
            session=session,
            role='user',
            content=content
        )

        # Generate and save therapist response
        therapist_response = generate_therapist_response.delay(
            session_id=session.id,
            user_message=content
        )

        return Response({
            'user_message': MessageSerializer(user_message).data,
            'therapist_response_task_id': therapist_response.id
        })

    @action(detail=True, methods=['post'])
    def analyze(self, request, pk=None):
        session = self.get_object()
        analysis_task = analyze_session.delay(session_id=session.id)
        return Response({'analysis_task_id': analysis_task.id})

class GoalViewSet(viewsets.ModelViewSet):
    queryset = Goal.objects.all()
    serializer_class = GoalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Goal.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class MoodLogViewSet(viewsets.ModelViewSet):
    queryset = MoodLog.objects.all()
    serializer_class = MoodLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return MoodLog.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Message.objects.all()

    def get_queryset(self):
        return Message.objects.filter(session__user=self.request.user)

    def perform_create(self, serializer):
        session = serializer.validated_data['session']
        if session.user != self.request.user:
            raise PermissionDenied("You can only create messages in your own sessions")
        serializer.save()

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_message(request, session_id):
    try:
        session = TherapySession.objects.get(id=session_id)
        content = request.data.get('content')
        role = request.data.get('role', 'user')
        
        # Create user message
        user_message = Message.objects.create(
            session=session,
            role=role,
            content=content
        )
        
        # Update session activity and message count
        session.update_activity()
        session.increment_message_count()
        
        # Trigger therapist response
        task = generate_therapist_response.delay(session_id, content)
        
        # Check if session should be summarized
        check_session_status.delay(session_id)
        
        return Response({
            'user_message': {
                'id': user_message.id,
                'session': user_message.session.id,
                'role': user_message.role,
                'content': user_message.content,
                'created_at': user_message.created_at
            },
            'therapist_response_task_id': task.id
        })
        
    except TherapySession.DoesNotExist:
        return Response({'error': 'Session not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def end_session(request, session_id):
    try:
        session = TherapySession.objects.get(id=session_id)
        
        if not session.is_active:
            return Response({'error': 'Session already ended'}, status=400)
            
        session.end_session()
        generate_session_summary.delay(session_id)
        
        return Response({'status': 'session ended'})
        
    except TherapySession.DoesNotExist:
        return Response({'error': 'Session not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_session_status_view(request, session_id):
    try:
        check_session_status.delay(session_id)
        return Response({'status': 'check initiated'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def analyze_patterns(request):
    try:
        # Get user's profile
        user_profile = UserProfile.objects.get(user=request.user)
        
        # Trigger pattern analysis
        task = analyze_long_term_patterns.delay(request.user.id)
        
        return Response({
            'status': 'pattern analysis initiated',
            'task_id': task.id
        })
        
    except UserProfile.DoesNotExist:
        return Response({'error': 'User profile not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def feedback_recommendation(request, recommendation_id):
    try:
        feedback = request.data.get('feedback')  # 'positive' or 'negative'
        if feedback not in ['positive', 'negative']:
            return Response({'error': 'Invalid feedback value'}, status=400)
            
        user_profile = UserProfile.objects.get(user=request.user)
        
        # Initialize recommendation_feedback if it doesn't exist
        if not user_profile.recommendation_feedback:
            user_profile.recommendation_feedback = {'recommendations': []}
        
        # Update or add feedback
        recommendation_found = False
        for rec in user_profile.recommendation_feedback['recommendations']:
            if rec.get('id') == recommendation_id:
                rec['feedback'] = feedback
                rec['timestamp'] = timezone.now().isoformat()
                recommendation_found = True
                break
        
        if not recommendation_found:
            # If recommendation not found, add it
            user_profile.recommendation_feedback['recommendations'].append({
                'id': recommendation_id,
                'feedback': feedback,
                'timestamp': timezone.now().isoformat()
            })
        
        user_profile.save()
        
        # If negative feedback, trigger new recommendation analysis
        if feedback == 'negative':
            analyze_long_term_patterns.delay(request.user.id)
        
        return Response({
            'status': 'feedback recorded',
            'feedback': feedback
        })
        
    except UserProfile.DoesNotExist:
        return Response({'error': 'User profile not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

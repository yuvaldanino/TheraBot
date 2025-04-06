from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, TherapySession, Message, Goal, MoodLog

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name')
        read_only_fields = ('id',)

class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = UserProfile
        fields = ('id', 'user', 'emotional_profile', 'last_check_in', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ('id', 'session', 'role', 'content', 'created_at')
        read_only_fields = ('id', 'created_at')

class TherapySessionSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = TherapySession
        fields = ('id', 'user', 'title', 'summary', 'emotional_analysis', 'messages', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')

class GoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Goal
        fields = ('id', 'user', 'title', 'description', 'status', 'target_date', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')

class MoodLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = MoodLog
        fields = ('id', 'user', 'mood', 'note', 'created_at')
        read_only_fields = ('id', 'created_at') 
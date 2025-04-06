import os
import logging
from celery import shared_task
from django.utils import timezone
from openai import OpenAI
from .models import TherapySession, Message, UserProfile
from datetime import datetime, timedelta
import uuid

logger = logging.getLogger(__name__)

@shared_task
def generate_therapist_response(session_id, user_message):
    # Initialize OpenAI client
    client = OpenAI()
    
    logger.info(f"Generating response for session {session_id}")
    
    try:
        session = TherapySession.objects.get(id=session_id)
        user_profile = UserProfile.objects.get(user=session.user)
        
        # Get conversation history
        messages = Message.objects.filter(session=session).order_by('created_at')
        conversation_history = [
            {"role": msg.role, "content": msg.content}
            for msg in messages
        ]
        
        # Add system message with user's emotional profile
        system_message = {
            "role": "system",
            "content": f"""You are an empathetic AI therapist. The user's emotional profile shows: {user_profile.emotional_profile}
            Previous conversation context: {session.summary if session.summary else 'No previous context'}
            Respond in a therapeutic manner, showing understanding and providing gentle guidance."""
        }
        
        # Prepare messages for API call
        api_messages = [system_message] + conversation_history + [{"role": "user", "content": user_message}]
        
        logger.info("Calling OpenAI API")
        # Generate response using OpenAI
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=api_messages,
            temperature=0.7,
            max_tokens=500
        )
        
        therapist_response = response.choices[0].message.content
        logger.info("Got response from OpenAI")
        
        # Save therapist response
        Message.objects.create(
            session=session,
            role='assistant',
            content=therapist_response
        )
        logger.info("Saved therapist response")
        
        return therapist_response
        
    except Exception as e:
        logger.error(f"Error generating therapist response: {str(e)}", exc_info=True)
        return None

@shared_task
def analyze_session(session_id):
    # Initialize OpenAI client
    client = OpenAI()
    
    try:
        session = TherapySession.objects.get(id=session_id)
        user_profile = UserProfile.objects.get(user=session.user)
        
        # Get all messages from the session
        messages = Message.objects.filter(session=session).order_by('created_at')
        conversation = "\n".join([f"{msg.role}: {msg.content}" for msg in messages])
        
        # Analyze conversation using OpenAI
        analysis_prompt = f"""Analyze this therapy session and provide a detailed analysis in the following JSON format:
        {{
            "summary": "A concise summary of the main topics and progress in the session",
            "emotional_themes": {{
                "primary_emotions": ["list of main emotions detected"],
                "intensity_levels": {{
                    "anxiety": 1-10,
                    "stress": 1-10,
                    "depression": 1-10,
                    "hope": 1-10
                }},
                "emotional_progression": "Description of how emotions changed during the session"
            }},
            "concerns": [
                "List of specific concerns or issues identified"
            ],
            "progress": {{
                "insights_gained": ["Key realizations or insights"],
                "coping_strategies": ["Strategies discussed or learned"],
                "next_steps": ["Suggested next steps or homework"]
            }}
        }}

        Conversation:
        {conversation}"""
        
        logger.info(f"Analyzing session {session_id}")
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": analysis_prompt}],
            temperature=0.3,
            max_tokens=1000
        )
        
        analysis = response.choices[0].message.content
        logger.info("Successfully received analysis from OpenAI")
        
        try:
            # Parse the JSON response
            import json
            analysis_data = json.loads(analysis)
            
            # Update session with analysis
            session.summary = analysis_data.get("summary", "")
            session.emotional_analysis = analysis_data
            session.save()
            
            # Update user's emotional profile
            current_profile = user_profile.emotional_profile or {}
            current_profile.update({
                'last_session_analysis': analysis_data,
                'last_updated': timezone.now().isoformat(),
                'emotional_history': current_profile.get('emotional_history', []) + [{
                    'timestamp': timezone.now().isoformat(),
                    'themes': analysis_data.get('emotional_themes', {}),
                    'session_id': session_id
                }]
            })
            user_profile.emotional_profile = current_profile
            user_profile.save()
            
            logger.info(f"Successfully updated session {session_id} and user profile with analysis")
            return analysis_data
            
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing analysis JSON: {str(e)}")
            return None
            
    except Exception as e:
        logger.error(f"Error analyzing session: {str(e)}", exc_info=True)
        return None 

@shared_task
def generate_session_summary(session_id):
    # Initialize OpenAI client
    client = OpenAI()
    
    try:
        session = TherapySession.objects.get(id=session_id)
        messages = Message.objects.filter(session=session).order_by('created_at')
        
        # Prepare conversation for analysis
        conversation = "\n".join([
            f"{msg.role} ({msg.created_at.strftime('%H:%M')}): {msg.content}"
            for msg in messages
        ])
        
        # Generate summary using OpenAI
        summary_prompt = f"""Create a detailed summary of this therapy session in the following JSON format:
        {{
            "session_summary": {{
                "topics_discussed": [
                    {{
                        "topic": "Main topic discussed",
                        "time": "Time discussed",
                        "key_points": ["List of key points"],
                        "techniques_suggested": ["List of techniques or exercises suggested"]
                    }}
                ],
                "homework_assigned": [
                    "List of homework or exercises assigned"
                ],
                "follow_up_topics": [
                    "Topics to discuss in next session"
                ],
                "progress_made": [
                    "List of progress indicators"
                ]
            }}
        }}

        Conversation:
        {conversation}"""
        
        logger.info(f"Generating summary for session {session_id}")
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": summary_prompt}],
            temperature=0.3,
            max_tokens=1000
        )
        
        summary = response.choices[0].message.content
        logger.info("Successfully received summary from OpenAI")
        
        try:
            # Parse the JSON response
            import json
            summary_data = json.loads(summary)
            
            # Update session with summary
            session.summary = json.dumps(summary_data, indent=2)
            session.save()
            
            logger.info(f"Successfully updated session {session_id} with summary")
            return summary_data
            
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing summary JSON: {str(e)}")
            return None
            
    except Exception as e:
        logger.error(f"Error generating session summary: {str(e)}", exc_info=True)
        return None

@shared_task
def end_session(session_id):
    try:
        session = TherapySession.objects.get(id=session_id)
        if not session.ended_at:
            session.ended_at = timezone.now()
            session.is_active = False
            session.save()
            
            # Generate final summary
            generate_session_summary.delay(session_id)
            
            # Trigger long-term pattern analysis
            analyze_long_term_patterns.delay(session.user.id)
            
            logger.info(f"Session {session_id} ended successfully")
            return True
        return False
    except Exception as e:
        logger.error(f"Error ending session {session_id}: {str(e)}")
        return False

@shared_task
def check_session_status(session_id):
    try:
        session = TherapySession.objects.get(id=session_id)
        
        # Check if session should be ended
        if session.is_active and session.last_activity:
            time_since_last_activity = timezone.now() - session.last_activity
            if time_since_last_activity > timedelta(hours=24):
                end_session.delay(session_id)
                logger.info(f"Session {session_id} marked for ending due to inactivity")
                return True
                
        # If session has enough messages, trigger pattern analysis
        if session.message_count >= 10:
            analyze_long_term_patterns.delay(session.user.id)
            logger.info(f"Triggered pattern analysis for session {session_id}")
            
        return False
    except Exception as e:
        logger.error(f"Error checking session status {session_id}: {str(e)}")
        return False

@shared_task
def check_all_active_sessions():
    active_sessions = TherapySession.objects.filter(is_active=True)
    for session in active_sessions:
        check_session_status.delay(session.id)

@shared_task
def analyze_long_term_patterns(user_id):
    """
    Analyzes patterns across multiple sessions for a user to identify long-term trends,
    recurring themes, and progress over time.
    """
    client = OpenAI()
    
    try:
        # Get user profile and all their sessions
        user_profile = UserProfile.objects.get(user_id=user_id)
        sessions = TherapySession.objects.filter(user_id=user_id).order_by('created_at')
        
        # Prepare session data for analysis
        sessions_data = []
        for session in sessions:
            if session.emotional_analysis:
                sessions_data.append({
                    'session_id': session.id,
                    'date': session.created_at.isoformat(),
                    'summary': session.summary,
                    'emotional_analysis': session.emotional_analysis
                })
        
        if not sessions_data:
            logger.info(f"No session data found for user {user_id}")
            return None
            
        # Create analysis prompt
        analysis_prompt = f"""Analyze the following therapy sessions and identify long-term patterns, trends, and progress.
        Provide the analysis in the following JSON format:
        {{
            "long_term_patterns": {{
                "recurring_themes": [
                    {{
                        "theme": "Theme name",
                        "frequency": "How often it appears",
                        "sessions": ["List of session IDs where this theme appears"],
                        "progression": "How this theme has evolved over time"
                    }}
                ],
                "emotional_trends": {{
                    "overall_progression": "Description of emotional journey",
                    "key_emotions": [
                        {{
                            "emotion": "Emotion name",
                            "trend": "Increasing/Decreasing/Stable",
                            "triggers": ["Common triggers identified"],
                            "coping_effectiveness": "How well user copes with this emotion"
                        }}
                    ]
                }},
                "progress_indicators": [
                    {{
                        "area": "Area of improvement",
                        "description": "Description of progress",
                        "evidence": ["Specific examples from sessions"],
                        "current_status": "Current state"
                    }}
                ],
                "recommendations": [
                    {{
                        "id": "unique_recommendation_id",
                        "focus_area": "Area to focus on",
                        "reason": "Why this is important",
                        "suggested_approaches": ["Specific approaches to try"]
                    }}
                ]
            }},
            "therapeutic_insights": {{
                "strengths": ["User's therapeutic strengths"],
                "challenges": ["Ongoing challenges"],
                "breakthrough_moments": ["Key moments of insight or progress"],
                "areas_for_growth": ["Areas needing more attention"]
            }}
        }}

        Sessions Data:
        {sessions_data}"""
        
        logger.info(f"Analyzing long-term patterns for user {user_id}")
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": analysis_prompt}],
            temperature=0.3,
            max_tokens=1500
        )
        
        analysis = response.choices[0].message.content
        
        try:
            # Parse the JSON response
            import json
            pattern_analysis = json.loads(analysis)
            
            # Add unique IDs to recommendations if not present
            for rec in pattern_analysis['long_term_patterns']['recommendations']:
                if 'id' not in rec:
                    rec['id'] = str(uuid.uuid4())
            
            # Update user profile with long-term analysis
            current_profile = user_profile.emotional_profile or {}
            current_profile.update({
                'long_term_analysis': pattern_analysis,
                'last_pattern_analysis': timezone.now().isoformat(),
                'pattern_history': current_profile.get('pattern_history', []) + [{
                    'timestamp': timezone.now().isoformat(),
                    'analysis': pattern_analysis
                }]
            })
            user_profile.emotional_profile = current_profile
            user_profile.save()
            
            logger.info(f"Successfully updated user {user_id} profile with long-term pattern analysis")
            return pattern_analysis
            
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing pattern analysis JSON: {str(e)}")
            return None
            
    except Exception as e:
        logger.error(f"Error analyzing long-term patterns: {str(e)}", exc_info=True)
        return None 
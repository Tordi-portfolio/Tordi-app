from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer

User = get_user_model()

TYPING_TTL_SECONDS = 4


def _typing_cache_key(conversation_id, user_id):
    return f'tordi:typing:{conversation_id}:{user_id}'


class ConversationListView(APIView):
    def get(self, request):
        request.user.touch()
        conversations = request.user.conversations.all().order_by('-created_at')
        return Response(ConversationSerializer(conversations, many=True, context={'request': request}).data)


class StartConversationView(APIView):
    def post(self, request, user_id):
        other = get_object_or_404(User, id=user_id)
        conversation = (
            Conversation.objects.filter(participants=request.user).filter(participants=other).first()
        )
        if not conversation:
            conversation = Conversation.objects.create()
            conversation.participants.add(request.user, other)
        return Response(ConversationSerializer(conversation, context={'request': request}).data)


class ConversationDetailView(APIView):
    """Initial page load for a room: conversation info + full message history."""

    def get(self, request, conversation_id):
        conversation = get_object_or_404(Conversation, id=conversation_id, participants=request.user)
        request.user.touch()
        conversation.messages.exclude(sender=request.user).filter(is_read=False).update(is_read=True)
        messages = conversation.messages.select_related('sender').all()
        return Response({
            'conversation': ConversationSerializer(conversation, context={'request': request}).data,
            'messages': MessageSerializer(messages, many=True, context={'request': request}).data,
        })


class PollMessagesView(APIView):
    """GET ?after=<id> -> new messages + peer typing/online status."""

    def get(self, request, conversation_id):
        conversation = get_object_or_404(Conversation, id=conversation_id, participants=request.user)
        request.user.touch()

        try:
            after_id = int(request.query_params.get('after', 0))
        except (TypeError, ValueError):
            after_id = 0

        new_messages = conversation.messages.filter(id__gt=after_id).select_related('sender')
        new_messages.exclude(sender=request.user).filter(is_read=False).update(is_read=True)

        other = conversation.other_participant(request.user)
        peer_typing = False
        peer = None
        if other:
            peer_typing = bool(cache.get(_typing_cache_key(conversation.id, other.id), False))
            from accounts.serializers import UserSerializer
            peer = UserSerializer(other, context={'request': request}).data

        return Response({
            'messages': MessageSerializer(new_messages, many=True, context={'request': request}).data,
            'peer_typing': peer_typing,
            'peer': peer,
        })


class SendMessageView(APIView):
    def post(self, request, conversation_id):
        conversation = get_object_or_404(Conversation, id=conversation_id, participants=request.user)
        text = (request.data.get('text') or '').strip()
        if not text:
            return Response({'error': 'Message is empty.'}, status=status.HTTP_400_BAD_REQUEST)
        message = Message.objects.create(conversation=conversation, sender=request.user, text=text)
        return Response(MessageSerializer(message, context={'request': request}).data)


class UploadAttachmentView(APIView):
    def post(self, request, conversation_id):
        conversation = get_object_or_404(Conversation, id=conversation_id, participants=request.user)
        uploaded_file = request.FILES.get('attachment')
        caption = (request.data.get('caption') or '').strip()

        if not uploaded_file:
            return Response({'error': 'No file provided.'}, status=status.HTTP_400_BAD_REQUEST)
        if uploaded_file.size > 25 * 1024 * 1024:
            return Response({'error': 'File is too large (25MB max).'}, status=status.HTTP_400_BAD_REQUEST)

        message = Message.objects.create(
            conversation=conversation, sender=request.user, text=caption, attachment=uploaded_file,
        )
        return Response(MessageSerializer(message, context={'request': request}).data)


class SetTypingView(APIView):
    def post(self, request, conversation_id):
        get_object_or_404(Conversation, id=conversation_id, participants=request.user)
        cache.set(_typing_cache_key(conversation_id, request.user.id), True, TYPING_TTL_SECONDS)
        return Response({'status': 'ok'})

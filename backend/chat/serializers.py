from rest_framework import serializers

from accounts.serializers import UserSerializer

from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    sender_id = serializers.IntegerField(source='sender.id', read_only=True)
    sender_name = serializers.SerializerMethodField()
    attachment_url = serializers.SerializerMethodField()
    attachment_kind = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ['id', 'text', 'sender_id', 'sender_name', 'timestamp', 'attachment_url', 'attachment_kind']

    def get_sender_name(self, obj):
        return obj.sender.display_name()

    def get_attachment_url(self, obj):
        if not obj.attachment:
            return None
        request = self.context.get('request')
        url = obj.attachment.url
        return request.build_absolute_uri(url) if request else url

    def get_attachment_kind(self, obj):
        return obj.attachment_kind()


class ConversationSerializer(serializers.ModelSerializer):
    other = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ['id', 'other', 'last_message', 'created_at']

    def get_other(self, obj):
        user = self.context['request'].user
        other = obj.other_participant(user)
        return UserSerializer(other, context=self.context).data if other else None

    def get_last_message(self, obj):
        last = obj.last_message()
        return MessageSerializer(last, context=self.context).data if last else None

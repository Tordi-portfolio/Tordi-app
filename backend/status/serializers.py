from rest_framework import serializers

from accounts.serializers import UserSerializer

from .models import Status


class StatusSerializer(serializers.ModelSerializer):
    media_url = serializers.SerializerMethodField()
    media_kind = serializers.SerializerMethodField()
    viewer_count = serializers.SerializerMethodField()
    viewed_by_me = serializers.SerializerMethodField()

    class Meta:
        model = Status
        fields = [
            'id', 'text', 'media_url', 'media_kind', 'background_color',
            'created_at', 'expires_at', 'viewer_count', 'viewed_by_me',
        ]

    def get_media_url(self, obj):
        if not obj.media:
            return None
        request = self.context.get('request')
        url = obj.media.url
        return request.build_absolute_uri(url) if request else url

    def get_media_kind(self, obj):
        return obj.media_kind()

    def get_viewer_count(self, obj):
        return obj.views.count()

    def get_viewed_by_me(self, obj):
        request = self.context.get('request')
        if not request:
            return False
        return obj.views.filter(viewer=request.user).exists()


class StatusFeedOwnerSerializer(serializers.Serializer):
    """A contact with at least one active status, for the inbox status strip."""

    def to_representation(self, instance):
        data = UserSerializer(instance, context=self.context).data
        data['has_unseen_status'] = instance.has_unseen_status
        return data

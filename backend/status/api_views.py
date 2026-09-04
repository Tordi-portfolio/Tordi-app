import random
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status as http_status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Status, StatusView
from .serializers import StatusFeedOwnerSerializer, StatusSerializer
from .utils import can_view_status, my_active_status_count, visible_status_owners

User = get_user_model()

STATUS_COLORS = ['#5B4FE9', '#17C3B2', '#F97316', '#EC4899', '#0EA5E9', '#8B5CF6', '#EF4444']


class StatusFeedView(APIView):
    """Contacts with active statuses, for the inbox strip — plus my own count."""

    def get(self, request):
        owners = visible_status_owners(request.user)
        return Response({
            'contacts': StatusFeedOwnerSerializer(owners, many=True, context={'request': request}).data,
            'my_status_count': my_active_status_count(request.user),
        })


class MyStatusListView(APIView):
    def get(self, request):
        statuses = request.user.statuses.filter(expires_at__gt=timezone.now()).order_by('created_at')
        return Response(StatusSerializer(statuses, many=True, context={'request': request}).data)


class CreateStatusView(APIView):
    def post(self, request):
        text = (request.data.get('text') or '').strip()
        media = request.FILES.get('media')

        if not text and not media:
            return Response({'error': 'Add text or a photo/video first.'}, status=http_status.HTTP_400_BAD_REQUEST)
        if media and media.size > 25 * 1024 * 1024:
            return Response({'error': 'File is too large (25MB max).'}, status=http_status.HTTP_400_BAD_REQUEST)

        new_status = Status.objects.create(
            user=request.user,
            text=text,
            media=media,
            background_color=random.choice(STATUS_COLORS),
            expires_at=timezone.now() + timedelta(hours=24),
        )
        return Response(StatusSerializer(new_status, context={'request': request}).data)


class DeleteStatusView(APIView):
    def post(self, request, status_id):
        get_object_or_404(Status, id=status_id, user=request.user).delete()
        return Response({'status': 'ok'})


class ViewOwnerStatusView(APIView):
    """GET a contact's (or your own) active statuses, story-viewer style."""

    def get(self, request, user_id):
        owner = get_object_or_404(User, id=user_id)
        if not can_view_status(owner, request.user):
            return Response({'error': "You don't have access to this person's status."}, status=http_status.HTTP_403_FORBIDDEN)

        statuses = owner.statuses.filter(expires_at__gt=timezone.now()).order_by('created_at')
        return Response({
            'owner': {
                'id': owner.id,
                'display_name': owner.display_name(),
                'avatar_url': request.build_absolute_uri(owner.avatar.url) if owner.avatar else None,
            },
            'statuses': StatusSerializer(statuses, many=True, context={'request': request}).data,
        })


class MarkStatusViewedView(APIView):
    def post(self, request, status_id):
        target = get_object_or_404(Status, id=status_id, expires_at__gt=timezone.now())
        if not can_view_status(target.user, request.user):
            return Response({'error': 'Not allowed.'}, status=http_status.HTTP_403_FORBIDDEN)
        if target.user_id != request.user.id:
            StatusView.objects.get_or_create(status=target, viewer=request.user)
        return Response({'status': 'ok'})

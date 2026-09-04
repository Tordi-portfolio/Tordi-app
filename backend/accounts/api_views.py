from django.contrib.auth import authenticate, get_user_model
from django.db.models import Q
from django.utils import timezone
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Contact
from .serializers import (
    ContactSerializer, EmailUpdateSerializer, LoginSerializer,
    ProfileUpdateSerializer, RegisterSerializer, UserSerializer,
)

User = get_user_model()


class RegisterView(APIView):
    """POST {phone_number, password} -> creates the account and logs in immediately."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = User.objects.create_user(
            phone_number=serializer.validated_data['phone_number'],
            password=serializer.validated_data['password'],
        )
        user.last_seen = timezone.now()
        user.save(update_fields=['last_seen'])

        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': UserSerializer(user, context={'request': request}).data,
            'needs_profile': True,
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """POST {phone_number, password} -> token + user, or 400 on bad credentials."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        phone_number = serializer.validated_data['phone_number'].strip().replace(' ', '')
        password = serializer.validated_data['password']

        user = authenticate(request, phone_number=phone_number, password=password)
        if not user:
            return Response({'error': 'Incorrect phone number or password.'}, status=status.HTTP_400_BAD_REQUEST)

        user.last_seen = timezone.now()
        user.save(update_fields=['last_seen'])

        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': UserSerializer(user, context={'request': request}).data,
            'needs_profile': not bool(user.full_name),
        })


class LogoutView(APIView):
    def post(self, request):
        request.user.last_seen = timezone.now()
        request.user.save(update_fields=['last_seen'])
        Token.objects.filter(user=request.user).delete()
        return Response({'status': 'ok'})


class MeView(APIView):
    def get(self, request):
        request.user.touch()
        return Response(UserSerializer(request.user, context={'request': request}).data)

    def patch(self, request):
        serializer = ProfileUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user, context={'request': request}).data)


class UpdateEmailView(APIView):
    """Link/change email from the dashboard. No verification step."""

    def patch(self, request):
        serializer = EmailUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user, context={'request': request}).data)


class SearchUsersView(APIView):
    def get(self, request):
        query = request.query_params.get('q', '').strip()
        if not query:
            return Response([])

        results = User.objects.filter(
            Q(phone_number__icontains=query) | Q(full_name__icontains=query)
        ).exclude(id=request.user.id)[:20]

        contact_ids = set(
            Contact.objects.filter(owner=request.user, contact__in=results).values_list('contact_id', flat=True)
        )

        data = UserSerializer(results, many=True, context={'request': request}).data
        for item in data:
            item['is_contact'] = item['id'] in contact_ids
        return Response(data)


class ContactsListView(APIView):
    def get(self, request):
        contacts = Contact.objects.filter(owner=request.user).select_related('contact')
        return Response(ContactSerializer(contacts, many=True, context={'request': request}).data)


class AddContactView(APIView):
    def post(self, request, user_id):
        if user_id == request.user.id:
            return Response({'error': "You can't add yourself."}, status=status.HTTP_400_BAD_REQUEST)
        target = User.objects.filter(id=user_id).first()
        if not target:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        Contact.objects.get_or_create(owner=request.user, contact=target)
        return Response({'status': 'ok'})


class RemoveContactView(APIView):
    def post(self, request, contact_id):
        Contact.objects.filter(id=contact_id, owner=request.user).delete()
        return Response({'status': 'ok'})

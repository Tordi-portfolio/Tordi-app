from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import Contact

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    display_name = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()
    is_online = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'phone_number', 'email', 'full_name', 'about',
            'avatar_url', 'display_name', 'is_online', 'last_seen',
        ]

    def get_display_name(self, obj):
        return obj.display_name()

    def get_avatar_url(self, obj):
        if not obj.avatar:
            return None
        request = self.context.get('request')
        url = obj.avatar.url
        return request.build_absolute_uri(url) if request else url

    def get_is_online(self, obj):
        return obj.is_recently_active()


class RegisterSerializer(serializers.Serializer):
    phone_number = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate_phone_number(self, value):
        value = value.strip().replace(' ', '')
        if not value.startswith('+'):
            raise serializers.ValidationError('Include the country code, e.g. +234...')
        if User.objects.filter(phone_number=value).exists():
            raise serializers.ValidationError('An account with this phone number already exists.')
        return value

    def validate_password(self, value):
        validate_password(value)
        return value


class LoginSerializer(serializers.Serializer):
    phone_number = serializers.CharField()
    password = serializers.CharField(write_only=True)


class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['full_name', 'about', 'avatar']


class EmailUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['email']

    def validate_email(self, value):
        return (value or '').strip().lower()


class ContactSerializer(serializers.ModelSerializer):
    contact = UserSerializer(read_only=True)

    class Meta:
        model = Contact
        fields = ['id', 'contact', 'created_at']

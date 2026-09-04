from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    def create_user(self, phone_number, password=None, **extra_fields):
        if not phone_number:
            raise ValueError('Phone number is required')
        user = self.model(phone_number=phone_number, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, phone_number, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(phone_number, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    phone_number = models.CharField(max_length=20, unique=True)

    # Optional — linked later from Settings, once the user is already
    # logged in. No verification step; it's just a contact field for now.
    email = models.EmailField(blank=True, default='')

    full_name = models.CharField(max_length=150, blank=True)
    about = models.CharField(max_length=255, blank=True, default='Hey there! I am using Tordi.')
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    last_seen = models.DateTimeField(null=True, blank=True)
    date_joined = models.DateTimeField(auto_now_add=True)

    ONLINE_THRESHOLD_SECONDS = 20

    USERNAME_FIELD = 'phone_number'
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self):
        return self.full_name or self.phone_number

    def display_name(self):
        return self.full_name or self.phone_number

    def is_recently_active(self):
        if not self.last_seen:
            return False
        return (timezone.now() - self.last_seen).total_seconds() < self.ONLINE_THRESHOLD_SECONDS

    def touch(self):
        self.last_seen = timezone.now()
        self.save(update_fields=['last_seen'])


class Contact(models.Model):
    owner = models.ForeignKey(User, related_name='my_contacts', on_delete=models.CASCADE)
    contact = models.ForeignKey(User, related_name='added_by', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('owner', 'contact')
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.owner} -> {self.contact}'

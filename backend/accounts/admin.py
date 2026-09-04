from django.contrib import admin

from .models import Contact, User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('phone_number', 'email', 'full_name', 'is_staff', 'last_seen', 'date_joined')
    search_fields = ('phone_number', 'email', 'full_name')
    ordering = ('-date_joined',)


@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ('owner', 'contact', 'created_at')

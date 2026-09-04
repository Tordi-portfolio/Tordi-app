from django.conf import settings
from django.db import models


class Conversation(models.Model):
    participants = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='conversations')
    created_at = models.DateTimeField(auto_now_add=True)

    def other_participant(self, user):
        return self.participants.exclude(id=user.id).first()

    def last_message(self):
        return self.messages.order_by('-timestamp').first()

    def __str__(self):
        return f'Conversation {self.id}'


class Message(models.Model):
    IMAGE_EXTENSIONS = ('.png', '.jpg', '.jpeg', '.gif', '.webp', '.heic')
    VIDEO_EXTENSIONS = ('.mp4', '.webm', '.mov', '.ogg', '.mkv')

    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_messages')
    text = models.TextField(blank=True)
    attachment = models.FileField(upload_to='attachments/', blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ['timestamp']

    def attachment_kind(self):
        if not self.attachment:
            return None
        name = self.attachment.name.lower()
        if name.endswith(self.IMAGE_EXTENSIONS):
            return 'image'
        if name.endswith(self.VIDEO_EXTENSIONS):
            return 'video'
        return 'file'

    def __str__(self):
        return f'{self.sender}: {self.text[:30]}'

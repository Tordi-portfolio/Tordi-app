from django.urls import path

from . import api_views

urlpatterns = [
    path('conversations/', api_views.ConversationListView.as_view(), name='conversation_list'),
    path('conversations/start/<int:user_id>/', api_views.StartConversationView.as_view(), name='start_conversation'),
    path('conversations/<int:conversation_id>/', api_views.ConversationDetailView.as_view(), name='conversation_detail'),
    path('conversations/<int:conversation_id>/poll/', api_views.PollMessagesView.as_view(), name='poll_messages'),
    path('conversations/<int:conversation_id>/send/', api_views.SendMessageView.as_view(), name='send_message'),
    path('conversations/<int:conversation_id>/upload/', api_views.UploadAttachmentView.as_view(), name='upload_attachment'),
    path('conversations/<int:conversation_id>/typing/', api_views.SetTypingView.as_view(), name='set_typing'),
]

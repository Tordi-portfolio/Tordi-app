from django.urls import path

from . import api_views

urlpatterns = [
    path('feed/', api_views.StatusFeedView.as_view(), name='status_feed'),
    path('mine/', api_views.MyStatusListView.as_view(), name='my_status_list'),
    path('create/', api_views.CreateStatusView.as_view(), name='create_status'),
    path('<int:status_id>/delete/', api_views.DeleteStatusView.as_view(), name='delete_status'),
    path('<int:status_id>/viewed/', api_views.MarkStatusViewedView.as_view(), name='mark_status_viewed'),
    path('<int:user_id>/', api_views.ViewOwnerStatusView.as_view(), name='view_status'),
]

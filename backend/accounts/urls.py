from django.urls import path

from . import api_views

urlpatterns = [
    path('register/', api_views.RegisterView.as_view(), name='register'),
    path('login/', api_views.LoginView.as_view(), name='login'),
    path('logout/', api_views.LogoutView.as_view(), name='logout'),
    path('me/', api_views.MeView.as_view(), name='me'),
    path('me/email/', api_views.UpdateEmailView.as_view(), name='update_email'),
    path('search/', api_views.SearchUsersView.as_view(), name='search_users'),
    path('contacts/', api_views.ContactsListView.as_view(), name='contacts_list'),
    path('contacts/add/<int:user_id>/', api_views.AddContactView.as_view(), name='add_contact'),
    path('contacts/remove/<int:contact_id>/', api_views.RemoveContactView.as_view(), name='remove_contact'),
]

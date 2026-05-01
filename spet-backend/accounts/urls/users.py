# ============================================================
# SPET — accounts/urls/users.py
# Routes gestion utilisateurs
# ============================================================

from django.urls import path
from accounts.views import (
    UserListCreateView,
    UserDetailView,
    TeachersListView,
    ValidateProfileView,
    ToggleActiveView,
)

urlpatterns = [
    path('',                              UserListCreateView.as_view(), name='user-list-create'),
    path('<uuid:id>/',                    UserDetailView.as_view(),     name='user-detail'),
    path('teachers/',                     TeachersListView.as_view(),   name='teacher-list'),
    path('<uuid:id>/validate-profile/',   ValidateProfileView.as_view(), name='validate-profile'),
    path('<uuid:id>/toggle-active/',      ToggleActiveView.as_view(),   name='toggle-active'),
]

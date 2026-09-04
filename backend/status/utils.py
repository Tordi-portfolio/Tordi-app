from django.contrib.auth import get_user_model
from django.utils import timezone

from accounts.models import Contact

from .models import Status, StatusView

User = get_user_model()


def can_view_status(owner, viewer):
    if owner.id == viewer.id:
        return True
    return Contact.objects.filter(owner=owner, contact=viewer).exists()


def visible_status_owners(viewer):
    """Contacts of `viewer` (people who added viewer) with active statuses,
    each annotated with .has_unseen_status."""
    now = timezone.now()
    owner_ids = Contact.objects.filter(contact=viewer).values_list('owner_id', flat=True)
    owners = User.objects.filter(id__in=owner_ids, statuses__expires_at__gt=now).distinct()

    result = []
    for owner in owners:
        statuses = list(owner.statuses.filter(expires_at__gt=now))
        if not statuses:
            continue
        seen_ids = set(
            StatusView.objects.filter(status__in=statuses, viewer=viewer).values_list('status_id', flat=True)
        )
        owner.has_unseen_status = any(s.id not in seen_ids for s in statuses)
        result.append(owner)
    return result


def my_active_status_count(user):
    return user.statuses.filter(expires_at__gt=timezone.now()).count()

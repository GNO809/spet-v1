from rest_framework import serializers
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model  = AuditLog
        fields = [
            'id', 'timestamp', 'action', 'module', 'severity',
            'user_display', 'ip_address', 'detail', 'target',
        ]
        read_only_fields = fields

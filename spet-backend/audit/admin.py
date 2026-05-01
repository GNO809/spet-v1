from django.contrib import admin
from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display  = ('timestamp', 'action', 'module', 'severity', 'user_display', 'ip_address', 'detail')
    list_filter   = ('action', 'module', 'severity')
    search_fields = ('detail', 'user_display', 'ip_address', 'target')
    readonly_fields = ('timestamp', 'action', 'module', 'severity',
                       'user_display', 'ip_address', 'detail', 'target')
    ordering = ('-timestamp',)

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

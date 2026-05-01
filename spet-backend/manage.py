#!/usr/bin/env python
"""SPET — Django management utility."""
import os
import sys


def main():
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'spet.settings.development')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Impossible d'importer Django. Vérifiez que Django est installé "
            "et que le virtualenv est activé."
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()

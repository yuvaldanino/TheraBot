# Generated by Django 5.2 on 2025-04-05 23:04

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="therapysession",
            name="ended_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="therapysession",
            name="is_active",
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name="therapysession",
            name="last_activity",
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AddField(
            model_name="therapysession",
            name="message_count",
            field=models.IntegerField(default=0),
        ),
    ]

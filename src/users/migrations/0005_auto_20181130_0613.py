# Generated by Django 2.1.2 on 2018-11-30 06:13

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0004_auto_20181130_0513'),
    ]

    operations = [
        migrations.DeleteModel(
            name='User',
        ),
        migrations.AddField(
            model_name='command',
            name='content',
            field=models.TextField(default=''),
        ),
    ]

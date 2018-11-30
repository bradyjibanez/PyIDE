from django.db import models

class Script(models.Model):
	title			= models.CharField(max_length = 100)
	content			= models.TextField(default = "")


class Command(models.Model):
	title			= models.CharField(max_length = 100)
	content			= models.TextField(default = "")
from django.db import models

class User(models.Model):
	name 			= models.CharField(max_length = 100)
	password	 	= models.TextField(default = "")

class Script(models.Model):
	name			= models.CharField(max_length = 100)

class Command(models.Model):
	name			= models.CharField(max_length = 100)
from django.shortcuts import render
from django.http import HttpResponse, HttpResponseRedirect
from .forms import codemirror_window, TestForm

def get_user_info(request):
	if request.method == 'POST':
		form = NameForm(request.POST)
		if form.is_valid():
			userName = form.cleaned_data['userName']
			password = form.cleaned_data['password']
			user = User.objects.create(name=userName, password=password)
			user.save()
			return render(request, "login.html", {})
	else:
		form = NameForm()
	return render(request, 'register.html', {'form': form})	

def user_detail_view(request):
	obj = User.objects.get(id=1)
	context = {
	#	'name': obj.name,
	#	'password': obj.password
		'object': obj
	}
	return render(request, "user/register.html", {})

def home(request):
	form = TestForm
	return render(request, "base.html", {'form': form})
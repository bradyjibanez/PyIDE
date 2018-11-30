from django.shortcuts import render
from django.http import HttpResponse, HttpResponseRedirect
from django.contrib.auth import login, authenticate
from django.contrib.auth.forms import UserCreationForm
from django.shortcuts import render, redirect
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

def signup(request):
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            form.save()
            username = form.cleaned_data.get('username')
            raw_password = form.cleaned_data.get('password1')
            user = authenticate(username=username, password=raw_password)
            login(request, user)
            return redirect('home')
    else:
        form = UserCreationForm()
    return render(request, 'signup.html', {'form': form})


#def get_scripts(request):
#	if request.method == 'POST':
#    	if request.POST.get("signup-submit"):
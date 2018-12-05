from django.urls import path, include
from django.conf.urls import url
from . import views

urlpatterns = [
	path('', views.home, name='home'),
	path('', views.editor, name='editor'),
	url(r'^(?P<ID>.*)/$', view.editor
	url(r'^(?P<package>.*)/(?P<file>.*)/(?P<ID>.*)/$', views.editor, name='editor'),
	url(r'^run/', views.run_python, name='run'),
#	path('admin/', admin.site.urls),
#	path('accounts/', include('django.contrib.auth.urls')),
#	path('', TemplateView.as_view(template_name='home.html'), name='home'),
]

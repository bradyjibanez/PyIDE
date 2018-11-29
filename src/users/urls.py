from django.urls import path, include
from . import views

urlpatterns = [
	path('', views.home, name='home'),
#	path('admin/', admin.site.urls),
#	path('accounts/', include('django.contrib.auth.urls')),
#	path('', TemplateView.as_view(template_name='home.html'), name='home'),
]
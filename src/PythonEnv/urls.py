from django.contrib import admin
from django.urls import path, include
from django.views.debug import default_urlconf
from django.views.generic.base import TemplateView
from django.conf.urls import include, url


urlpatterns = [
    path('admin/', admin.site.urls),
    path('accounts/', include('django.contrib.auth.urls')),
    path('', TemplateView.as_view(template_name='home.html')),
    url(r'^editor/$', TemplateView.as_view(template_name="editor.html"), name='editor'),
    url(r'^test/$', TemplateView.as_view(template_name="test.html"), name="test"),
    url(r'^app/', include('users.urls')),
]

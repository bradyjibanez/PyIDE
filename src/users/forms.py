from django import forms
from codemirror import CodeMirrorTextarea
#from codemirror.widgets import CodeMirrorTextarea

codemirror_window = CodeMirrorTextarea(
	mode="python",
	theme="cobalt",
	config={
		'fixedGutter': True
	},
)

document = forms.CharField(widget=codemirror_window)

class TestForm(forms.Form):
	test = forms.CharField(widget=CodeMirrorTextarea(mode='python'))
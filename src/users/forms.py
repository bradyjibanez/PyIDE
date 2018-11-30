from django import forms
from djangocodemirror.frields import CodeMirrorField
#from codemirror import CodeMirrorTextarea
#from codemirror.widgets import CodeMirrorTextarea

codemirror_window = CodeMirrorTextarea(
	mode="python",
	theme="cobalt",
	config={
		'fixedGutter': True
	},
)

document = forms.CharField(widget=codemirror_window)

class SampleForm(forms.Form):
	test = CodeMirrorField(label="Test", required=True, config_name="restructredtext")
from django import forms

TAMANHO_MAXIMO_TEXTO = 100_000


class ListaForm(forms.Form):
    """Texto colado pelo professor: lista do SUAP ou um nome por linha."""

    texto = forms.CharField(
        label='Nomes dos alunos',
        required=False,
        max_length=TAMANHO_MAXIMO_TEXTO,
        error_messages={'max_length': 'O texto colado é grande demais.'},
        widget=forms.Textarea(attrs={
            'class': 'entrada entrada-lista',
            'rows': 10,
            'spellcheck': 'false',
            'placeholder': 'Cole aqui a lista copiada do SUAP ou um nome por linha.',
        }),
    )

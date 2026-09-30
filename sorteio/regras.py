class RegraNegocioError(Exception):
    """Violação de uma regra de negócio do sorteio (docs/regras-de-negocio.md).

    A mensagem é exibida diretamente ao professor, por isso deve ser clara e em
    Português do Brasil.
    """

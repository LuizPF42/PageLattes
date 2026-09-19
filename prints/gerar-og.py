# Gera o og.png da raiz: a imagem 1200x630 do card que aparece quando alguém compartilha um site
# feito no PageLattes (og:image). É uma imagem só, igual para todos os sites gerados, porque a foto
# de cada pessoa fica embutida no index.html como data URI e nenhuma rede social aceita data: no
# og:image — para usar a foto certa seria preciso publicar um segundo arquivo.
#
# A composição repete o cabeçalho do construtor: o logo ao lado de "PageLattes", em Segoe UI bold,
# que é o que o `system-ui` do css/construtor.css vira no Windows. As cores são as do próprio logo
# (#f6f8fa sobre #0d1117, o par claro/escuro do GitHub).
#
# Sai uma imagem por idioma do site gerado (og.png e og-en.png): muda só a frase de baixo.
#
# Uso, dentro desta pasta:
#   python gerar-og.py

import os
from PIL import Image, ImageDraw, ImageFont

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LARGURA, ALTURA = 1200, 630
FUNDO = (13, 17, 23)        # #0d1117
TINTA = (246, 248, 250)     # #f6f8fa, a mesma do logo-escuro.png
SUAVE = (139, 148, 158)     # #8b949e

LOGO = 150
NOME = 'PageLattes'
LINHAS = {
    'og.png': 'Seu Currículo Lattes vira um site pessoal',
    'og-en.png': 'Your Lattes CV becomes a personal website',
}

FONTES = os.path.join(os.environ.get('SystemRoot', r'C:\Windows'), 'Fonts')
negrito = ImageFont.truetype(os.path.join(FONTES, 'segoeuib.ttf'), 88)
comum = ImageFont.truetype(os.path.join(FONTES, 'segoeui.ttf'), 34)


def largura(texto, fonte):
    return fonte.getbbox(texto)[2] - fonte.getbbox(texto)[0]


logo = Image.open(os.path.join(RAIZ, 'logo-escuro.png')).convert('RGBA').resize((LOGO, LOGO), Image.LANCZOS)

for arquivo, linha in LINHAS.items():
    cartao = Image.new('RGB', (LARGURA, ALTURA), FUNDO)
    desenho = ImageDraw.Draw(cartao)

    # Logo e nome lado a lado, como no cabeçalho do construtor.
    espaco = 30
    x = (LARGURA - (LOGO + espaco + largura(NOME, negrito))) // 2
    y = 262
    cartao.paste(logo, (x, y - LOGO // 2), logo)
    caixa = negrito.getbbox(NOME)
    desenho.text((x + LOGO + espaco - caixa[0], y - (caixa[3] + caixa[1]) // 2), NOME, font=negrito, fill=TINTA)

    # A frase de baixo explica do que se trata, para o card não ser só uma marca solta.
    desenho.text(((LARGURA - largura(linha, comum)) // 2, 410), linha, font=comum, fill=SUAVE)

    destino = os.path.join(RAIZ, arquivo)
    cartao.save(destino, optimize=True)
    print(destino, cartao.size)

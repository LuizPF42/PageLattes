# To-do

## SEO e descoberta pelo Google

### No site do construtor (`index.html` da raiz)

- [ ] Criar `robots.txt` básico (liberando tudo, sem `Disallow`).
- [ ] Preencher `<meta name="description">` (hoje só existe `<title>` fixo).

### No site gerado para cada pessoa (`js/site.js`)

- [x] `<title>` com "Nome — o que a pessoa faz", em vez de só o nome.
- [x] `<link rel="canonical">` e `og:url` com o endereço publicado, deduzido
      do nome de usuário da etapa Publicar. Sem usuário preenchido, saem as
      duas de fora: canonical errada é pior que canonical nenhuma.
- [x] Dado estruturado JSON-LD (`schema.org/Person`): `name`, `url`,
      `description` e `sameAs` com os links que a pessoa já colocou no
      próprio site. O e-mail fica de fora: já está na página para quem lê, e
      no JSON-LD só facilitaria a coleta automática de endereços.
- [x] `og:image` (com `twitter:card`), apontando para uma imagem 1200×630
      igual para todos os sites gerados, servida pelo GitHub Pages do próprio
      PageLattes (`og.png`, e `og-en.png` para o site em inglês; quem as gera
      é `prints/gerar-og.py`). A ideia original era usar a foto do perfil,
      mas ela fica embutida no `index.html` como *data URI*, e rede social
      nenhuma baixa um endereço `data:` — para o card sair com a foto certa
      seria preciso publicar um segundo arquivo junto do `index.html`, o que
      quebra o "um arquivo só". Reavaliar se um dia a etapa Publicar passar a
      enviar mais de um arquivo.
- [ ] `schema.org/Person`: acrescentar `jobTitle` e `affiliation` a partir do
      vínculo atual da Atuação Profissional. Ficou de fora por ora porque
      quem tem mais de um vínculo atual exigiria escolher um, e escolher
      errado é pior que não dizer.
- [ ] Produções: quando o registro do Lattes trouxer DOI, transformar a
      referência num link direto para a publicação ("onde aparece"), em vez
      de só texto.
- [ ] Produções: botão "copiar citação", gerando a referência em ABNT (e
      possivelmente outros formatos) a partir dos dados já extraídos do
      Lattes.
- [ ] Produções: agrupar por ano, em ordem decrescente. Não é uma melhoria de
      SEO, mas resolve um problema real de navegação em currículos com
      muitas produções.

### Considerado e descartado por ora

- [ ] ~~Selos de citação em tempo real (Altmetric, Dimensions, Google
      Scholar) via DOI~~: dependem de serviço externo e de a produção ter
      DOI, o que boa parte dos registros do Lattes (capítulo de livro,
      trabalho em evento) não tem. Reavaliar só se isso mudar.
- [ ] ~~`sitemap.xml` para o site gerado~~: baixo valor hoje, porque cada
      site é uma página só e o Google acha página única sem sitemap. Vale
      reconsiderar se o PageLattes passar a gerar mais de uma página por
      perfil.

## Fora do código

Nenhuma metatag faz o Google **achar** um site novo. O que faz é:

- registrar o endereço no Google Search Console e pedir a indexação;
- ter links apontando para ele — o campo de página do próprio Lattes, o
  ORCID, o LinkedIn, o perfil do GitHub, a página do departamento.

Vale dizer isso a quem usa, talvez na etapa Publicar, depois que o site
estiver no ar.

## Sabido e não resolvido

- **O layout em abas esconde quase tudo.** É o padrão, e o CSS das abas
  (`:target`) deixa só a primeira visível. O buscador indexa conteúdo
  escondido por CSS, mas costuma pesar menos e não o usa como trecho do
  resultado — ou seja, a lista de produções, que é o que faria alguém achar
  a pessoa por um artigo, é justamente a parte que menos conta. Quem
  priorizar busca pode escolher "Página única" na Aparência; talvez valha
  dizer isso ao lado da opção.
- **O site em dois idiomas mora numa URL só**, com uma das versões escondida
  por CSS. A versão em inglês dificilmente aparece sozinha numa busca em
  inglês. Resolver exigiria gerar dois arquivos, o que vai contra a premissa
  do projeto.

## Créditos

Ideias de metadado (`og:image` com fallback, `robots.txt` + `sitemap.xml`,
JSON-LD `Person`, link de citação) vieram da inspeção do tema Jekyll
[al-folio](https://github.com/alshedivat/al-folio) e de sua aplicação em
<https://github.com/bdcdo/bdcdo.github.io>.

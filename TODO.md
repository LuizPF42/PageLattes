# To-do

## SEO e descoberta pelo Google

### No site do construtor (`index.html` da raiz)

- [ ] Criar `robots.txt` básico (liberando tudo, sem `Disallow`).
- [ ] Preencher `<meta name="description">` (hoje só existe `<title>` fixo).

### No site gerado para cada pessoa (`js/site.js`)

- [ ] `og:image` com fallback: usar a foto do perfil quando existir e, se não
      existir, cair numa imagem padrão do PageLattes. Hoje não há `og:image`
      nenhum, então o card de compartilhamento em redes sociais sai sem
      imagem.
- [ ] `<link rel="canonical">` apontando para a URL publicada do site.
- [ ] Dado estruturado JSON-LD (`schema.org/Person`): `name`, `url`,
      `description` e `sameAs` com os links que a pessoa já colocou no
      próprio site (ORCID, GitHub, LinkedIn etc.). Ajuda o Google a entender
      que a página é sobre uma pessoa e a relacioná-la aos outros perfis
      dela.
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

## Créditos

Ideias de metadado (`og:image` com fallback, `robots.txt` + `sitemap.xml`,
JSON-LD `Person`, link de citação) vieram da inspeção do tema Jekyll
[al-folio](https://github.com/alshedivat/al-folio) e de sua aplicação em
<https://github.com/bdcdo/bdcdo.github.io>.

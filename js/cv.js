/*
 * O currículo em formato neutro, no padrão que se usa fora do Brasil (EUA, Reino Unido, Europa): uma
 * coluna estreita com as datas à esquerda, o conteúdo à direita, títulos de seção em maiúsculas, Times
 * em preto sobre branco. Sai de duas formas, a partir do mesmo modelo: em HTML, na aba "CV" do site,
 * e em PDF (A4), para baixar. O PDF é gerado no construtor e vai dentro do index.html como endereço
 * data:, então o site continua sendo um arquivo só.
 *
 * O conteúdo é o mesmo do site: só o que a pessoa manteve, no idioma de cada versão (dados() de
 * site.js). Nada é traduzido aqui além dos rótulos fixos.
 */
(function (raiz, fabrica) {
  const I18n = raiz.I18n || (typeof require === 'function' ? require('./i18n.js') : null);
  const Pdf = raiz.Pdf || (typeof require === 'function' ? require('./pdf.js') : null);
  // site.js usa este módulo e este módulo usa os utilitários de texto de site.js: cada um pega o
  // outro só na hora de usar, quando os dois já estão carregados.
  const Site = () => raiz.Site || (typeof require === 'function' ? require('./site.js') : null);
  const api = fabrica(I18n, Pdf, Site);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else raiz.Cv = api;
})(typeof self !== 'undefined' ? self : this, function (I18n, Pdf, Site) {
  'use strict';

  const _ = I18n._;

  I18n.registrar({
    // a aba e o botão
    'Currículo': 'Curriculum vitae',
    'O mesmo conteúdo deste site, num currículo em formato neutro, pronto para imprimir ou enviar.':
      'The same content as this site, in a neutral CV format, ready to print or send.',
    'Baixar em PDF': 'Download PDF',
    'PDF, A4, {n} páginas': 'PDF, A4, {n} pages',
    'PDF, A4, 1 página': 'PDF, A4, 1 page',
    'PDF, {kb} KB': 'PDF, {kb} KB',
    'PDF, {n} páginas': 'PDF, {n} pages',
    'PDF, 1 página': 'PDF, 1 page',
    'O currículo completo, em PDF.': 'The full CV, as a PDF.',
    'Envie o seu PDF na etapa Aparência do construtor.': 'Upload your PDF in the Appearance step of the builder.',
    // cabeçalho
    'Nome': 'Name',
    'Site': 'Website',
    // blocos
    'Perfil': 'Personal profile',
    'Interesses de pesquisa': 'Research interests',
    'Experiência profissional': 'Professional experience',
    'Ensino': 'Teaching',
    'Publicações': 'Publications',
    'Apresentações e eventos': 'Presentations and events',
    'Produção técnica e artística': 'Technical and artistic output',
    'Bancas e comissões': 'Committees',
    'Prêmios e distinções': 'Awards and honours',
    'Atividades editoriais e de avaliação': 'Editorial and review activities',
    'Outras informações': 'Other information',
    // formação
    'Tese: {titulo}': 'Thesis: {titulo}',
    'Dissertação: {titulo}': 'Thesis: {titulo}',
    'Trabalho: {titulo}': 'Thesis: {titulo}',
  });

  // Seções do site -> blocos do currículo, nesta ordem (a ordem de um currículo acadêmico, que não é
  // a do Lattes). Cada seção vai para o primeiro bloco que a aceita; dentro do bloco, na ordem das
  // expressões e, empatando, na do Lattes. `juntar`: os itens das seções do bloco formam uma lista
  // só, sem subtítulo (pós-doutorado e formação, por exemplo).
  const BLOCOS = [
    { titulo: 'Formação', secoes: [/^FormacaoAcademicaPosDoutorado$/, /^FormacaoAcademica/], juntar: true },
    { titulo: 'Experiência profissional', secoes: [/^AtuacaoProfissional$/], juntar: true },
    { titulo: 'Ensino', secoes: [/^AtividadesEnsino$/, /^ProjetosEnsino$/, /^Ensino:/] },
    { titulo: 'Pesquisa', secoes: [/^LinhaPesquisa$/, /^ProjetosPesquisa$/, /^ProjetosExtensao$/, /^ProjetosDesenvolvimento$/, /^OutrosProjetos$/] },
    { titulo: 'Publicações', secoes: [/^ProducoesCientificas:(Artigos|Livros|Capítulos|Textos em jornais|Trabalhos completos|Resumos|Outras produções bibliográficas)/i] },
    { titulo: 'Apresentações e eventos', secoes: [/^ProducoesCientificas:(Apresenta|Entrevistas)/i, /^Eventos:/] },
    { titulo: 'Produção técnica e artística', secoes: [/^ProducoesCientificas:/] },
    { titulo: 'Orientações', secoes: [/^Orientacoes:/] },
    { titulo: 'Bancas e comissões', secoes: [/^Bancas:/] },
    { titulo: 'Prêmios e distinções', secoes: [/^PremiosTitulos$/], juntar: true },
    { titulo: 'Atividades editoriais e de avaliação', secoes: [/^(MembroCorpoEditorial|RevisorPeriodico|RevisorProjetoFomento|MembroComiteAssessoramento)$/] },
    { titulo: 'Formação complementar', secoes: [/^FormacaoComplementar$/], juntar: true },
    { titulo: 'Idiomas', secoes: [/^Idiomas$/], juntar: true },
    { titulo: 'Outras informações', secoes: [/(?:)/] }, // o resto
  ];

  // ---------- dados do site -> modelo do currículo ----------

  // Um parágrafo é uma lista de trechos { t: texto, b: negrito, i: itálico, url }. Com `marcador`, sai
  // como item de lista (•); com `justificar`, justificado (só a apresentação).
  // Roda no idioma da versão do site (I18n.com), como o resto da geração.
  function modelo(d) {
    const S = Site();
    const nome = (d.nome || '').trim() || _('Seu Nome');
    // Contatos: o e-mail, o endereço do próprio site (quando a etapa Publicar já sabe qual é) e os perfis.
    const semProtocolo = u => u.replace(/^mailto:/i, '').replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');
    const contato = (rotulo, url) => ({ rotulo, paragrafos: [[{ t: semProtocolo(url), url }]] });
    const links = (d.links || []).filter(l => l.url && l.url !== '#'); // "#": os links da prévia de exemplo
    const email = links.filter(l => l.rotulo === 'E-mail');
    const contatos = email.map(l => contato(_(l.rotulo), l.url))
      .concat(d.url ? [contato(_('Site'), d.url)] : [])
      .concat(links.filter(l => l.rotulo !== 'E-mail').map(l => contato(_(l.rotulo), l.url)));

    const blocos = [];
    const bio = String(d.bio || '').split(/\n+/).map(t => t.trim()).filter(Boolean);
    if (bio.length) blocos.push({ titulo: _('Perfil'), texto: bio.map(p => ({ trechos: comLinks(p), justificar: true })) });
    if (d.interesses && d.interesses.length) blocos.push({ titulo: _('Interesses de pesquisa'), texto: [{ trechos: [{ t: d.interesses.join('; ') }] }] });

    // Cada seção no seu bloco, guardando a posição da expressão que a aceitou.
    const porBloco = BLOCOS.map(() => []);
    (d.secoes || []).forEach((s, ordem) => {
      if (!s.itens || !s.itens.length) return;
      const id = s.id || '';
      let b = BLOCOS.findIndex(x => x.secoes.some(re => re.test(id)));
      if (b < 0) b = BLOCOS.length - 1;
      porBloco[b].push({ s, ordem, prioridade: BLOCOS[b].secoes.findIndex(re => re.test(id)) });
    });
    porBloco.forEach((lista, b) => {
      if (!lista.length) return;
      const bloco = BLOCOS[b];
      lista.sort((x, y) => x.prioridade - y.prioridade || x.ordem - y.ordem);
      const titulo = _(bloco.titulo);
      // Seção sozinha com o mesmo nome do bloco ("Outras informações relevantes" em "Outras
      // informações") dispensa o subtítulo.
      const so = lista.length === 1 ? _(lista[0].s.titulo).toLowerCase() : '';
      const unica = so && (so.startsWith(titulo.toLowerCase()) || titulo.toLowerCase().startsWith(so));
      const partes = bloco.juntar
        ? [{ titulo: '', entradas: lista.flatMap(x => x.s.itens.map(it => entrada(x.s, it, d.nome, S))) }]
        : lista.map(x => ({ titulo: unica ? '' : _(x.s.titulo), entradas: x.s.itens.map(it => entrada(x.s, it, d.nome, S)) }));
      blocos.push({ titulo, partes });
    });

    const arquivoBase = nome.replace(/[\\/:*?"<>|]+/g, '').trim();
    return {
      idioma: I18n.idioma(),
      lang: I18n.lang(I18n.idioma()),
      nome,
      subtitulo: (d.subtitulo || '').trim(),
      contatos,
      blocos,
      titulo: `${nome} — ${_('Currículo')}`,
      // "Nome - Currículo.pdf" e "Nome - CV.pdf": no site em dois idiomas, os arquivos não se confundem.
      // O PDF que a pessoa enviou pode estar em qualquer língua: sai como "Nome - CV.pdf".
      arquivo: `${arquivoBase} - ${I18n.idioma() === 'en' ? 'CV' : 'Currículo'}.pdf`,
      arquivoProprio: `${arquivoBase} - CV.pdf`,
      rotulos: { nome: _('Nome'), umaPagina: _('PDF, A4, 1 página'), paginas: _('PDF, A4, {n} páginas') },
    };
  }

  // Uma linha do currículo: o período na coluna da esquerda e, à direita, o item em parágrafos.
  // Produções são referências (a do Lattes, inteira, com o nome da pessoa em negrito); o resto é
  // título em negrito, detalhe (instituição, papel) e os complementos de cada tipo de seção.
  function entrada(s, it, nomePessoa, S) {
    const quando = String(it.periodo || '').replace(/\s*-\s*/g, ' – ').trim();
    const paragrafos = [];
    const link = it.link ? S.urlSegura(it.link) : '';
    const id = s.id || '';
    if (s.tipo === 'producao' && !it.detalhe) {
      const ref = S.aspas(it.titulo || '');
      const trechos = comNegrito(ref, it.negrito);
      if (link) trechos.push({ t: ' ' }, { t: link, url: link });
      paragrafos.push({ trechos });
      return { quando, paragrafos };
    }
    const titulo = S.aspas(S.capsParaTitulo(it.titulo || ''));
    const detalhe = it.detalhe ? (it.integrantes ? _(it.detalhe) : S.capsParaTitulo(it.detalhe)) : '';
    if (/^Idiomas$/.test(id)) {
      paragrafos.push({ trechos: [{ t: titulo, b: true }].concat(detalhe ? [{ t: ': ' + detalhe }] : []) });
      return { quando, paragrafos };
    }
    const extras = [];
    if (/^FormacaoAcademica/.test(id)) {
      if (it.obs) {
        const rotulo = /^Doutorado|^PhD/i.test(it.titulo || '') ? 'Tese: {titulo}' : /^Mestrado|^Master/i.test(it.titulo || '') ? 'Dissertação: {titulo}' : 'Trabalho: {titulo}';
        const [antes, depois] = _(rotulo).split('{titulo}');
        extras.push({ marcador: true, trechos: [{ t: antes }, { t: S.aspas(it.obs), i: true }, { t: depois || '' }] });
      }
      if (it.orientador) extras.push({ marcador: true, trechos: [{ t: _('Orientação: {nome}', { nome: it.orientador }) }] });
      if (it.coorientador) extras.push({ marcador: true, trechos: [{ t: _('Coorientação: {nome}', { nome: it.coorientador }) }] });
      if (it.bolsa) extras.push({ marcador: true, trechos: [{ t: _('Bolsista: {nome}', { nome: it.bolsa }) }] });
    } else if (it.obs) {
      // "Outras informações" do vínculo é texto corrido; o curso das disciplinas e o resto, complemento.
      extras.push({ trechos: [{ t: it.obs, i: !/^AtuacaoProfissional$/.test(id) }] });
    }
    if (it.financiadores) {
      const nomes = it.financiadores.split(/\s\/\s/).map(f => { const sep = f.lastIndexOf(' - '); return (sep > 0 ? f.slice(0, sep) : f).trim(); }).filter(Boolean);
      if (nomes.length) extras.push({ trechos: [{ t: `${_('Financiamento')}: ${nomes.join(', ')}` }] });
    }
    if (link) extras.push({ trechos: [{ t: link, url: link }] });
    // Item de uma linha só (prêmio, área) fica sem negrito, como numa lista simples.
    const sozinho = !detalhe && !extras.length;
    paragrafos.push({ trechos: comNegrito(titulo, it.negrito, !sozinho) });
    if (detalhe) paragrafos.push({ trechos: [{ t: detalhe }] });
    return { quando, paragrafos: paragrafos.concat(extras) };
  }

  // "SILVA, A.; COSTA, B. Título..." com "SILVA, A." em negrito. `tudo`: o texto inteiro em negrito.
  function comNegrito(texto, negrito, tudo = false) {
    if (tudo) return [{ t: texto, b: true }];
    const i = negrito ? texto.indexOf(negrito) : -1;
    if (i < 0) return [{ t: texto }];
    return [{ t: texto.slice(0, i) }, { t: negrito, b: true }, { t: texto.slice(i + negrito.length) }].filter(x => x.t);
  }

  // A apresentação guarda links como [trecho](endereço): no currículo, o trecho vira link.
  const LINK_TEXTO = /\[([^\]\n]+)\]\(((?:https?:\/\/|mailto:)[^)\s]+)\)/g;
  function comLinks(texto) {
    const out = [];
    let pos = 0;
    let m;
    LINK_TEXTO.lastIndex = 0;
    while ((m = LINK_TEXTO.exec(texto))) {
      if (m.index > pos) out.push({ t: texto.slice(pos, m.index) });
      out.push({ t: m[1], url: m[2] });
      pos = m.index + m[0].length;
    }
    if (pos < texto.length) out.push({ t: texto.slice(pos) });
    return out;
  }

  // ---------- modelo -> HTML (a aba do site) ----------

  // `pdf`: { href, paginas, bytes } do arquivo; na prévia do construtor, vem sem href e o botão só
  // marca o idioma (o construtor baixa o PDF na hora do clique). `papel`: false no site em página
  // única, onde fica só o botão (o currículo inteiro repetiria a página).
  // `proprio`: o PDF é o que a pessoa enviou, e não há papel (não sabemos o que tem dentro). Num site
  // em dois idiomas com um PDF só, a versão em inglês não repete o arquivo: `emprestado` ("pt") diz de
  // qual versão o script do botão PT/EN copia o endereço (sem JavaScript, só a versão em português
  // aparece). `previa` sem arquivo: o lembrete de enviar o PDF, em vez do botão.
  function html(m, { pdf = null, papel = true, proprio = false, emprestado = '', previa = false } = {}) {
    const kb = pdf && pdf.bytes ? Math.max(1, Math.round(pdf.bytes / 1024)) : 0;
    // O PDF próprio pode não ser A4: só o número de páginas (ou o tamanho, quando não deu para contar).
    const paginas = !pdf || !pdf.paginas ? ''
      : proprio ? (pdf.paginas === 1 ? _('PDF, 1 página') : _('PDF, {n} páginas', { n: pdf.paginas }))
      : pdf.paginas === 1 ? m.rotulos.umaPagina : m.rotulos.paginas.replace('{n}', pdf.paginas);
    const info = paginas || (kb ? _('PDF, {kb} KB', { kb }) : '');
    // Sem o arquivo, nada de `download`: com href="#", o navegador baixaria a própria página como PDF.
    const href = emprestado ? `href="#" data-cv-de="${esc(emprestado)}"`
      : pdf && pdf.href ? `href="${esc(pdf.href)}" download="${esc(proprio ? m.arquivoProprio : m.arquivo)}"` : 'href="#"';
    const botao = proprio && !pdf
      ? (previa ? `<span class="cv-info">${esc(_('Envie o seu PDF na etapa Aparência do construtor.'))}</span>` : '')
      : `<a class="cv-baixar" ${href} target="_self" data-cv="${esc(m.idioma)}"${proprio ? ' data-proprio' : ''}>${esc(_('Baixar em PDF'))}</a>${info ? `<span class="cv-info">${esc(info)}</span>` : ''}`;
    const sobre = proprio ? _('O currículo completo, em PDF.') : _('O mesmo conteúdo deste site, num currículo em formato neutro, pronto para imprimir ou enviar.');
    return `
  <section class="cv">
    <h2>${esc(_('Currículo'))}</h2>
    <p class="cv-acoes"><span class="cv-sobre">${esc(sobre)}</span>${botao}</p>
    ${papel && !proprio ? papelHtml(m) : ''}
  </section>`;
  }

  function papelHtml(m) {
    const linha = (quando, corpo, classe = '') => `<div class="cv-linha${classe}"><span class="cv-quando">${esc(quando)}</span><div class="cv-corpo">${corpo}</div></div>`;
    const cabecalho = [
      linha(m.rotulos.nome, `<p class="cv-nome">${esc(m.nome)}</p>${m.subtitulo ? `<p>${esc(m.subtitulo)}</p>` : ''}`),
      ...m.contatos.map(c => linha(c.rotulo, c.paragrafos.map(p => `<p>${trechosHtml(p)}</p>`).join(''))),
    ].join('');
    const paragrafo = p => p.marcador ? `<li>${trechosHtml(p.trechos)}</li>` : `<p${p.justificar ? ' class="cv-justificado"' : ''}>${trechosHtml(p.trechos)}</p>`;
    // Itens de lista seguidos viram uma <ul> só.
    const corpo = ps => {
      let s = '';
      let lista = false;
      for (const p of ps) {
        if (p.marcador && !lista) { s += '<ul>'; lista = true; }
        if (!p.marcador && lista) { s += '</ul>'; lista = false; }
        s += paragrafo(p);
      }
      return s + (lista ? '</ul>' : '');
    };
    const blocos = m.blocos.map(b => `
      <div class="cv-bloco">
        <h3>${esc(b.titulo)}</h3>
        ${b.texto ? linha('', corpo(b.texto)) : b.partes.map(p => `
        ${p.titulo ? `<h4>${esc(p.titulo)}</h4>` : ''}
        ${p.entradas.map(e => linha(e.quando, corpo(e.paragrafos))).join('')}`).join('')}
      </div>`).join('');
    return `<article class="cv-papel" lang="${esc(m.lang)}" aria-label="${esc(m.titulo)}"><div class="cv-cabecalho">${cabecalho}</div>${blocos}</article>`;
  }

  function trechosHtml(trechos) {
    return trechos.map(r => {
      let h = esc(r.t);
      if (r.i) h = `<em>${h}</em>`;
      if (r.b) h = `<strong>${h}</strong>`;
      if (r.url) h = `<a href="${esc(r.url)}">${h}</a>`;
      return h;
    }).join('');
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // O papel fica branco e em Times mesmo no modo escuro e com outras fontes: é a cara do PDF.
  const CSS = `
.cv-acoes{display:flex;flex-wrap:wrap;align-items:center;gap:.6rem 1rem;max-width:46em;margin:0 0 1.75rem;color:var(--suave);font-size:.95rem}
.cv-sobre{flex:1 1 18rem}
a.cv-baixar{display:inline-block;padding:.45rem 1.05rem;border-radius:999px;background:var(--acento);color:var(--sobre-acento);font-size:.9rem;font-weight:600;text-decoration:none}
a.cv-baixar:hover{text-decoration:underline}
.cv-info{font-size:.82rem}
.cv-papel{max-width:52rem;padding:clamp(1.25rem,5vw,3.5rem) clamp(1rem,5vw,3.25rem);border-radius:2px;background:#fff;color:#111;box-shadow:0 1px 2px rgba(0,0,0,.14),0 10px 30px rgba(0,0,0,.08);font:15px/1.38 "Times New Roman",Times,"Liberation Serif","Nimbus Roman",serif;color-scheme:light}
.cv-papel a{color:inherit;text-decoration:underline;text-decoration-color:#999}
.cv-papel p,.cv-papel ul{margin:0}
.cv-papel ul{padding-left:1.05em}
.cv-papel li{padding-left:.1em}
.cv-papel h3{margin:1.5em 0 .4em;font:inherit;text-transform:uppercase;letter-spacing:.02em}
.cv-papel h4{margin:.9em 0 .3em calc(7.25em + 1.1em);font:inherit;font-style:italic}
.cv-papel h3+h4{margin-top:.3em}
.cv-linha{display:grid;grid-template-columns:7.25em minmax(0,1fr);column-gap:1.1em;margin-bottom:.45em}
.cv-quando{font-variant-numeric:tabular-nums}
.cv-corpo>*+*{margin-top:.1em}
.cv-cabecalho .cv-linha{margin-bottom:.1em}
.cv-nome{font-weight:700}
.cv-justificado{text-align:justify}
@media (max-width:600px){
  .cv-papel{font-size:14px}
  .cv-linha{grid-template-columns:1fr}
  .cv-quando:empty{display:none}
  .cv-papel h4{margin-left:0}
  .cv-justificado{text-align:start}
}
@media print{
  .cv-acoes{display:none}
  .cv-papel{max-width:none;padding:0;box-shadow:none;font-size:11pt}
  .cv-linha,.cv-papel h3,.cv-papel h4{break-inside:avoid}
  .cv-papel h3,.cv-papel h4{break-after:avoid}
}`;

  // ---------- modelo -> PDF ----------

  // Medidas em pontos, numa A4. As duas colunas seguem o modelo de currículo que inspirou o formato:
  // as datas a partir da margem esquerda e o texto a partir de COL.
  const M = { esq: 50, col: 150, dir: 545, topo: 56, baixo: 841.89 - 60, corpo: 11, entrelinha: 13.6, marcador: 11 };

  // Devolve { bytes, paginas }. `comprimir`: ver Pdf.gerar.
  async function pdf(m, { comprimir = null } = {}) {
    const paginas = [];
    let pg = null;
    let y = 0;
    const nova = () => { pg = Pdf.novaPagina(); paginas.push(pg); y = M.topo; };
    const cabe = h => y + h <= M.baixo;
    nova();

    const fonte = r => (r.b && r.i ? 'BI' : r.b ? 'B' : r.i ? 'I' : 'R');
    // Linha visual: { x, pedacos, largura, espacos, justificar, marcador }.
    const quebrar = (trechos, largura, tamanho = M.corpo) => {
      const tokens = [];
      for (const r of trechos) {
        for (const parte of String(r.t).split(/(\s+)/)) {
          if (!parte) continue;
          const espaco = /^\s+$/.test(parte);
          tokens.push({ t: espaco ? ' ' : parte, f: fonte(r), url: r.url, espaco });
        }
      }
      const linhas = [];
      let atual = [];
      let w = 0;
      const fechar = () => {
        while (atual.length && atual[atual.length - 1].espaco) atual.pop();
        if (atual.length) linhas.push(atual);
        atual = [];
        w = 0;
      };
      for (const tk of tokens) {
        const tw = Pdf.largura(tk.t, tk.f, tamanho);
        if (tk.espaco) { if (atual.length) { atual.push(tk); w += tw; } continue; }
        if (atual.length && w + tw > largura) fechar();
        if (tw <= largura) { atual.push(tk); w += tw; continue; }
        // Palavra maior que a linha inteira (um endereço longo): quebra por caractere.
        let pedaco = '';
        for (const c of tk.t) {
          if (Pdf.largura(pedaco + c, tk.f, tamanho) > largura - w && (pedaco || atual.length)) {
            if (pedaco) atual.push({ t: pedaco, f: tk.f, url: tk.url });
            fechar();
            pedaco = '';
          }
          pedaco += c;
        }
        if (pedaco) { atual.push({ t: pedaco, f: tk.f, url: tk.url }); w += Pdf.largura(pedaco, tk.f, tamanho); }
      }
      fechar();
      return linhas.map(toks => {
        // Junta os tokens seguidos de mesma fonte e mesmo link num pedaço só.
        const pedacos = [];
        for (const tk of toks) {
          const ult = pedacos[pedacos.length - 1];
          if (ult && ult.f === tk.f && ult.url === tk.url) ult.t += tk.t;
          else pedacos.push({ t: tk.t, f: tk.f, url: tk.url });
        }
        return {
          pedacos,
          largura: toks.reduce((s, tk) => s + Pdf.largura(tk.t, tk.f, tamanho), 0),
          espacos: toks.filter(tk => tk.espaco).length,
        };
      });
    };

    // Os parágrafos da coluna da direita em linhas visuais, com o recuo do marcador e o espaço entre eles.
    const coluna = paragrafos => {
      const out = [];
      paragrafos.forEach((p, i) => {
        const x = M.col + (p.marcador ? M.marcador : 0);
        const linhas = quebrar(p.trechos, M.dir - x);
        linhas.forEach((l, j) => out.push(Object.assign(l, {
          x,
          antes: j === 0 && i > 0 ? 1.2 : 0,
          marcador: p.marcador && j === 0,
          justificar: p.justificar && j < linhas.length - 1,
        })));
      });
      return out;
    };

    const desenhar = (l, x) => {
      const espacamento = l.justificar && l.espacos ? (M.dir - x - l.largura) / l.espacos : 0;
      pg.linha(x, y + M.corpo * 0.8, l.pedacos, M.corpo, { espacamento });
      if (l.marcador) pg.linha(M.col + 1, y + M.corpo * 0.8, [{ t: '•', f: 'R' }], M.corpo);
    };

    // Uma entrada: o período à esquerda e o conteúdo à direita, linha a linha; quebra de página no
    // meio só quando a entrada é comprida (as curtas vão inteiras para a página seguinte).
    const escreverEntrada = (quando, paragrafos) => {
      const esquerda = quando ? quebrar([{ t: quando }], M.col - M.esq - 8) : [];
      const direita = coluna(paragrafos);
      const n = Math.max(esquerda.length, direita.length);
      const altura = n * M.entrelinha + direita.reduce((s, l) => s + l.antes, 0);
      if (!cabe(altura) && altura <= 6 * M.entrelinha) nova();
      for (let i = 0; i < n; i++) {
        const d = direita[i];
        if (d && d.antes) y += d.antes;
        if (!cabe(M.entrelinha)) nova();
        if (esquerda[i]) desenhar(esquerda[i], M.esq);
        if (d) desenhar(d, d.x);
        y += M.entrelinha;
      }
    };

    const titulo = (texto, { italico = false, recuo = M.esq } = {}) => {
      desenhar(quebrar([{ t: texto, i: italico }], M.dir - recuo)[0], recuo);
      y += M.entrelinha;
    };

    // Cabeçalho: nome em negrito e, abaixo, a linha do subtítulo e os contatos, como no modelo.
    const base = y + 13 * 0.8; // o rótulo e o nome (maior) na mesma linha de base
    pg.linha(M.esq, base, [{ t: m.rotulos.nome, f: 'R' }], M.corpo);
    for (const l of quebrar([{ t: m.nome, b: true }], M.dir - M.col, 13)) {
      pg.linha(M.col, y + 13 * 0.8, l.pedacos, 13);
      y += 15.5;
    }
    if (m.subtitulo) escreverEntrada('', [{ trechos: [{ t: m.subtitulo }] }]);
    for (const c of m.contatos) escreverEntrada(c.rotulo, c.paragrafos.map(trechos => ({ trechos })));

    for (const b of m.blocos) {
      y += 15;
      // O título do bloco não fica sozinho no pé da página: precisa caber com duas linhas do conteúdo.
      if (!cabe(M.entrelinha * 3 + 10)) nova();
      titulo(b.titulo.toLocaleUpperCase(m.lang));
      y += 3;
      if (b.texto) { escreverEntrada('', b.texto); continue; }
      b.partes.forEach((p, i) => {
        if (p.titulo) {
          y += i > 0 ? 7 : 1;
          if (!cabe(M.entrelinha * 3)) nova();
          titulo(p.titulo, { italico: true, recuo: M.col });
          y += 2;
        }
        p.entradas.forEach((e, j) => {
          if (j > 0) y += 4.5;
          escreverEntrada(e.quando, e.paragrafos);
        });
      });
    }

    // Rodapé: número da página e total, em cinza.
    paginas.forEach((p, i) => {
      if (paginas.length < 2) return;
      const texto = `${i + 1}/${paginas.length}`;
      p.linha(M.dir - Pdf.largura(texto, 'R', 9), Pdf.A4.altura - 34, [{ t: texto, f: 'R' }], 9, { cinza: 0.45 });
    });

    const bytes = await Pdf.gerar(paginas, { titulo: m.titulo, autor: m.nome, idioma: m.lang }, comprimir);
    return { bytes, paginas: paginas.length };
  }

  // O PDF de uma versão do site (um idioma), pronto para ir no index.html como endereço data:.
  async function arquivo(d, idioma) {
    const m = I18n.com(idioma, () => modelo(d));
    const r = await pdf(m, { comprimir: Pdf.compressorNativo() });
    return { href: 'data:application/pdf;base64,' + Pdf.base64(r.bytes), nome: m.arquivo, paginas: r.paginas, bytes: r.bytes };
  }

  return { modelo, html, pdf, arquivo, CSS };
});

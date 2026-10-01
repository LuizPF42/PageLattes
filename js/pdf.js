/*
 * Um gerador de PDF mínimo, para o currículo em formato neutro (ver cv.js).
 *
 * Só o que o currículo precisa: páginas A4, texto nas quatro Times padrão do PDF (que todo leitor de
 * PDF já tem, então nada de fonte embutida), links clicáveis e cinza no rodapé. Sem dependências: o
 * site final continua sendo um arquivo só, com o PDF dentro dele como endereço data:.
 *
 * As fontes padrão usam a codificação WinAnsi (a mesma do Windows-1252), que cobre o português e as
 * línguas da Europa ocidental. O que ficar fora dela perde o acento ("ł" -> "l") ou vira "?".
 */
(function (raiz, fabrica) {
  const api = fabrica();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else raiz.Pdf = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const A4 = { largura: 595.28, altura: 841.89 };

  // Larguras (em milésimos do corpo) dos caracteres 32 a 255 em WinAnsi, das métricas AFM da Adobe
  // para as fontes padrão. Dois dígitos em base 36 por caractere.
  const LARGURAS = {
    R: '6y99bcdwdwn5lm509999dwfo6y996y7qdwdwdwdwdwdwdwdwdwdw7q7qfofofoccplk2ijijk2gzfgk2k299atk2gzopk2k2fgk2ijfggzk2k2q8' +
      'k2k2gz997q99d1dw99ccdwccdwcc99dwdw7q7qdw7qlmdwdwdwdw99at7qdwdwk2dwdwccdc5kdcf100dw0099dwccrsdwdw99rsfg99op00gz00' +
      '009999cccc9qdwrs99r8at99k200cck26y99dwdwdwdw5kdw99l47odwfo99l499b4fo8c8c99dwcl6y998c8mdwkukukucck2k2k2k2k2k2opij' +
      'gzgzgzgz99999999k2k2k2k2k2k2k2fok2k2k2k2k2k2fgdwccccccccccccijcccccccccc7q7q7q7qdwdwdwdwdwdwdwfodwdwdwdwdwdwdwdw',
    B: '6y99ffdwdwrsn57q9999dwfu6y996y7qdwdwdwdwdwdwdwdwdwdw9999fufufudwpuk2ijk2k2ijgzlmlmatdwlmijq8k2lmgzlmk2fgijk2k2rs' +
      'k2k2ij997q99g5dw99dwfgccfgcc99dwfg7q99fg7qn5fgdwfgfgccat99fgdwk2dwdwccay64ayeg00dw0099dwdwrsdwdw99rsfg99rs00ij00' +
      '009999dwdw9qdwrs99rsat99k200cck26y99dwdwdwdw64dw99kr8cdwfu99kr99b4fu8c8c99fgf06y998c96dwkukukudwk2k2k2k2k2k2rsk2' +
      'ijijijijatatatatk2k2lmlmlmlmlmfulmk2k2k2k2k2gzfgdwdwdwdwdwdwk2cccccccccc7q7q7q7qdwfgdwdwdwdwdwfudwfgfgfgfgdwfgdw',
    I: '6y99bodwdwn5lm5y9999dwir6y996y7qdwdwdwdwdwdwdwdwdwdw9999iririrdwpkgzgzijk2gzgzk2k299ccijfgn5ijk2gzk2gzdwfgk2gzn5' +
      'gzfgfgat7qatbqdw99dwdwccdwcc7qdwdw7q7qcc7qk2dwdwdwdwatat7qdwccijccccatb47nb4f100dw0099dwfgopdwdw99rsdw99q800fg00' +
      '009999fgfg9qdwop99r8at99ij00atfg6yatdwdwdwdw7ndw99l47odwir99l499b4ir8c8c99dwej6y998c8mdwkukukudwgzgzgzgzgzgzopij' +
      'gzgzgzgz99999999k2ijk2k2k2k2k2irk2k2k2k2k2fggzdwdwdwdwdwdwdwijcccccccccc7q7q7q7qdwdwdwdwdwdwdwirdwdwdwdwdwccdwcc',
    BI: '6yatffdwdwn5lm7q9999dwfu6y996y7qdwdwdwdwdwdwdwdwdwdw9999fufufudwn4ijijijk2ijijk2lmatdwijgzopk2k2gzk2ijfggzk2ijop' +
      'ijgzgz997q99fudw99dwdwccdwcc99dwfg7q7qdw7qlmfgdwdwdwatat7qfgccijdwccat9o649ofu00dw0099dwdwrsdwdw99rsfg99q800gz00' +
      '009999dwdw9qdwrs99rsat99k200atgz6yatdwdwdwdw64dw99kr7edwgu99kr99b4fu8c8c99g0dw6y998c8cdwkukukudwijijijijijijq8ij' +
      'ijijijijatatatatk2k2k2k2k2k2k2fuk2k2k2k2k2gzgzdwdwdwdwdwdwdwk2cccccccccc7q7q7q7qdwfgdwdwdwdwdwfudwfgfgfgfgccdwcc',
  };
  const FONTES = { R: 'Times-Roman', B: 'Times-Bold', I: 'Times-Italic', BI: 'Times-BoldItalic' };
  const METRICAS = {};
  for (const [f, s] of Object.entries(LARGURAS)) {
    METRICAS[f] = [];
    for (let i = 0; i < s.length; i += 2) METRICAS[f].push(parseInt(s.slice(i, i + 2), 36));
  }

  // De 0x80 a 0x9F, o WinAnsi tem pontuação tipográfica no lugar dos códigos de controle do Latin-1.
  const WINANSI = {
    0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84, 0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87, 0x02c6: 0x88,
    0x2030: 0x89, 0x0160: 0x8a, 0x2039: 0x8b, 0x0152: 0x8c, 0x017d: 0x8e, 0x2018: 0x91, 0x2019: 0x92, 0x201c: 0x93,
    0x201d: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97, 0x02dc: 0x98, 0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b,
    0x0153: 0x9c, 0x017e: 0x9e, 0x0178: 0x9f,
  };
  // Sinais comuns que o WinAnsi não tem, trocados pelo equivalente mais próximo.
  const TROCAS = { '‐': '-', '‑': '-', '‒': '–', '−': '-', '―': '—', '′': "'", '″': '"',
    '→': '->', '←': '<-', '≤': '<=', '≥': '>=', '≈': '~', ' ': ' ', ' ': ' ', ' ': ' ', ' ': ' ' };

  function codigo(c) {
    const n = c.codePointAt(0);
    if (n >= 32 && n < 127) return n;
    if (n >= 0xa0 && n <= 0xff) return n;
    return WINANSI[n] || 0;
  }

  // Texto em códigos WinAnsi (um número por caractere). Caracteres invisíveis somem.
  function codificar(texto) {
    const out = [];
    for (const c of String(texto == null ? '' : texto).replace(/[­​-‍﻿]/g, '')) {
      if (c === '\n' || c === '\t' || c === '\r') { out.push(32); continue; }
      let n = codigo(c);
      if (!n) {
        const troca = TROCAS[c] != null ? TROCAS[c] : c.normalize('NFD').replace(/[̀-ͯ]/g, '');
        const codigos = [...troca].map(codigo);
        if (troca && codigos.every(Boolean)) { out.push(...codigos); continue; }
        n = 63; // "?"
      }
      out.push(n);
    }
    return out;
  }

  // Largura em pontos de um texto já codificado (ou de uma string), numa fonte e num corpo.
  function largura(texto, fonte = 'R', tamanho = 11) {
    const cods = typeof texto === 'string' ? codificar(texto) : texto;
    const m = METRICAS[fonte] || METRICAS.R;
    let soma = 0;
    for (const n of cods) soma += m[n - 32] || 0;
    return soma * tamanho / 1000;
  }

  // Uma string de PDF, entre parênteses: só ASCII, com o resto em octal (\351 é "é").
  function stringPdf(cods) {
    let s = '(';
    for (const n of cods) {
      if (n === 40 || n === 41 || n === 92) s += '\\' + String.fromCharCode(n);
      else if (n < 32 || n > 126) s += '\\' + n.toString(8).padStart(3, '0');
      else s += String.fromCharCode(n);
    }
    return s + ')';
  }

  // Texto de metadado (título, autor) em UTF-16, que aceita qualquer caractere.
  function textoUnicode(s) {
    let h = '<FEFF';
    for (const c of String(s || '')) {
      const n = c.codePointAt(0);
      if (n > 0xffff) {
        const v = n - 0x10000;
        h += (0xd800 + (v >> 10)).toString(16).padStart(4, '0') + (0xdc00 + (v & 0x3ff)).toString(16).padStart(4, '0');
      } else h += n.toString(16).padStart(4, '0');
    }
    return h.toUpperCase() + '>';
  }

  function num(n) {
    return String(Math.round(n * 100) / 100);
  }

  // ---------- documento ----------

  // Uma página guarda os comandos de desenho e os links. As coordenadas que entram aqui contam de
  // cima para baixo (y = distância do topo da página), como na leitura; a conversão para o PDF, que
  // conta de baixo para cima, é feita aqui dentro.
  function novaPagina(tamanho = A4) {
    const ops = [];
    const links = [];
    return {
      largura: tamanho.largura,
      altura: tamanho.altura,
      // `pedacos`: [{ t: texto, f: 'R'|'B'|'I'|'BI', url }], todos no mesmo corpo e na mesma linha.
      // `espacamento`: pontos a mais em cada espaço (para justificar). `cinza`: 0 (preto) a 1.
      linha(x, y, pedacos, tamanho2 = 11, { espacamento = 0, cinza = 0 } = {}) {
        const base = tamanho.altura - y;
        ops.push('BT');
        if (cinza) ops.push(`${num(cinza)} g`);
        if (espacamento) ops.push(`${num(espacamento)} Tw`);
        ops.push(`1 0 0 1 ${num(x)} ${num(base)} Tm`);
        let cursor = x;
        let fonteAtual = '';
        for (const p of pedacos) {
          const cods = codificar(p.t);
          if (!cods.length) continue;
          if (p.f !== fonteAtual) { ops.push(`/${p.f} ${num(tamanho2)} Tf`); fonteAtual = p.f; }
          ops.push(`${stringPdf(cods)} Tj`);
          const espacos = cods.filter(n => n === 32).length;
          const w = largura(cods, p.f, tamanho2) + espacos * espacamento;
          if (p.url) links.push({ x: cursor, y: base - tamanho2 * 0.22, w, h: tamanho2 * 0.98, url: p.url });
          cursor += w;
        }
        if (espacamento) ops.push('0 Tw');
        if (cinza) ops.push('0 g');
        ops.push('ET');
        return cursor - x;
      },
      ops,
      links,
    };
  }

  // Monta o arquivo. `info`: { titulo, autor, idioma }. Os fluxos de conteúdo podem ser comprimidos
  // por `comprimir` (Uint8Array -> Promise<Uint8Array>, formato zlib); sem ela, ficam como texto.
  async function gerar(paginas, info = {}, comprimir = null) {
    const objetos = []; // conteúdo de cada objeto, na ordem dos números (1, 2, 3...)
    const reservar = () => { objetos.push(null); return objetos.length; };
    const catalogo = reservar();
    const arvore = reservar();
    const fontes = {};
    for (const [f, nome] of Object.entries(FONTES)) {
      fontes[f] = reservar();
      objetos[fontes[f] - 1] = `<< /Type /Font /Subtype /Type1 /BaseFont /${nome} /Encoding /WinAnsiEncoding >>`;
    }
    const recursos = `<< /Font << ${Object.entries(fontes).map(([f, n]) => `/${f} ${n} 0 R`).join(' ')} >> >>`;
    const filhos = [];
    for (const p of paginas) {
      const conteudo = reservar();
      let corpo = new TextEncoder().encode(p.ops.join('\n'));
      let filtro = '';
      if (comprimir) {
        try { corpo = await comprimir(corpo); filtro = ' /Filter /FlateDecode'; } catch (e) { /* fica sem compressão */ }
      }
      objetos[conteudo - 1] = [`<< /Length ${corpo.length}${filtro} >>\nstream\n`, corpo, '\nendstream'];
      const anotacoes = p.links.map(l => {
        const n = reservar();
        objetos[n - 1] = `<< /Type /Annot /Subtype /Link /Rect [${[l.x, l.y, l.x + l.w, l.y + l.h].map(num).join(' ')}] /Border [0 0 0] /A << /S /URI /URI ${stringPdf(codificar(encodeURI(decodeURISafe(l.url))))} >> >>`;
        return `${n} 0 R`;
      });
      const pagina = reservar();
      objetos[pagina - 1] = `<< /Type /Page /Parent ${arvore} 0 R /MediaBox [0 0 ${num(p.largura)} ${num(p.altura)}] /Resources ${recursos} /Contents ${conteudo} 0 R${anotacoes.length ? ` /Annots [${anotacoes.join(' ')}]` : ''} >>`;
      filhos.push(`${pagina} 0 R`);
    }
    objetos[arvore - 1] = `<< /Type /Pages /Kids [${filhos.join(' ')}] /Count ${filhos.length} >>`;
    objetos[catalogo - 1] = `<< /Type /Catalog /Pages ${arvore} 0 R${info.idioma ? ` /Lang ${stringPdf(codificar(info.idioma))}` : ''} >>`;
    const agora = new Date();
    const data = `D:${agora.getUTCFullYear()}${[agora.getUTCMonth() + 1, agora.getUTCDate(), agora.getUTCHours(), agora.getUTCMinutes(), agora.getUTCSeconds()].map(n => String(n).padStart(2, '0')).join('')}Z`;
    const infoN = reservar();
    objetos[infoN - 1] = `<< /Title ${textoUnicode(info.titulo)} /Author ${textoUnicode(info.autor)} /Creator (PageLattes) /Producer (PageLattes) /CreationDate (${data}) >>`;

    // Arquivo: cabeçalho, objetos, tabela de posições (xref) e trailer.
    const partes = [];
    let tamanho = 0;
    const escrever = x => {
      const b = typeof x === 'string' ? new TextEncoder().encode(x) : x;
      partes.push(b);
      tamanho += b.length;
    };
    escrever('%PDF-1.4\n');
    escrever(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a])); // comentário com bytes altos: avisa que há conteúdo binário
    const posicoes = [];
    objetos.forEach((o, i) => {
      posicoes.push(tamanho);
      escrever(`${i + 1} 0 obj\n`);
      (Array.isArray(o) ? o : [o]).forEach(escrever);
      escrever('\nendobj\n');
    });
    const xref = tamanho;
    escrever(`xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n${posicoes.map(p => String(p).padStart(10, '0') + ' 00000 n \n').join('')}`);
    escrever(`trailer\n<< /Size ${objetos.length + 1} /Root ${catalogo} 0 R /Info ${infoN} 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
    const saida = new Uint8Array(tamanho);
    let pos = 0;
    for (const b of partes) { saida.set(b, pos); pos += b.length; }
    return saida;
  }

  function decodeURISafe(u) {
    try { return decodeURI(u); } catch (e) { return u; }
  }

  // zlib pelo próprio navegador (CompressionStream "deflate" é o formato que o PDF chama de Flate).
  // Sem suporte, devolve null e o PDF sai sem compressão, só maior.
  function compressorNativo() {
    if (typeof CompressionStream !== 'function' || typeof Response !== 'function') return null;
    return async bytes => {
      const fluxo = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate'));
      return new Uint8Array(await new Response(fluxo).arrayBuffer());
    };
  }

  function base64(bytes) {
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return typeof btoa === 'function' ? btoa(s) : Buffer.from(bytes).toString('base64');
  }

  return { A4, codificar, largura, novaPagina, gerar, compressorNativo, base64 };
});

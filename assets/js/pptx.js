/* Lector y verificador de presentaciones de PowerPoint (.pptx, .ppsx, .pptm) en el navegador.
   Un .pptx es un paquete ZIP de archivos XML (Open XML / PresentationML). Se descomprime con JSZip
   y se leen: orden de diapositivas, secciones, diseños, tema (colores y fuentes), formas, texto
   (tamaño, fuente y color efectivos, con herencia del diseño y del patrón), imágenes e iconos SVG,
   recortes, texto alternativo, objetos decorativos, tablas, gráficos, SmartArt, video y audio,
   hipervínculos, transiciones, animaciones (con trayectorias), notas del orador e intervalos,
   y la configuración de la presentación (exposición en quiosco, repetir, usar intervalos). */
(function () {
  'use strict';
  const LT = window.LT;

  /* ---------------------------------------------------------- XML */
  const todos = (el, n) => (el ? Array.from(el.getElementsByTagNameNS('*', n)) : []);
  const uno = (el, n) => (el ? el.getElementsByTagNameNS('*', n)[0] || null : null);
  const hijos = (el, n) => (el ? Array.from(el.children).filter((c) => c.localName === n) : []);
  const hijo = (el, n) => (el ? Array.from(el.children).find((c) => c.localName === n) || null : null);
  const at = (el, n) => (el ? el.getAttribute(n) : null);
  const atNS = (el, local) => { if (!el) return null; for (const a of Array.from(el.attributes)) if (a.localName === local) return a.value; return null; };
  const parse = (txt) => new DOMParser().parseFromString(txt, 'application/xml');
  function rutaRel(base, objetivo) {
    if (objetivo.startsWith('/')) return objetivo.slice(1);
    const partes = base.split('/');
    partes.pop();
    for (const p of objetivo.split('/')) { if (p === '..') partes.pop(); else if (p !== '.') partes.push(p); }
    return partes.join('/');
  }
  const relsDe = (ruta) => { const p = ruta.split('/'); const f = p.pop(); return p.join('/') + '/_rels/' + f + '.rels'; };

  /* ------------------------------------------------------- colores */
  function hex2rgb(h) { return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  function rgb2hex(r) { return r.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join(''); }
  function rgbHsl([r, g, b]) {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    let hh = 0, s = 0; const l = (mx + mn) / 2;
    if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); hh = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; hh /= 6; }
    return [hh, s, l];
  }
  function hslRgb([hh, s, l]) {
    if (!s) return [l * 255, l * 255, l * 255];
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    const f = (t) => { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; };
    return [f(hh + 1 / 3) * 255, f(hh) * 255, f(hh - 1 / 3) * 255];
  }
  /* Color de un elemento de relleno (srgbClr, schemeClr, sysClr, prstClr) con lumMod/lumOff/tint/shade */
  function colorDe(el, ctx) {
    if (!el) return null;
    const c = Array.from(el.children).find((x) => /Clr$/.test(x.localName));
    if (!c) return null;
    let hex = null;
    if (c.localName === 'srgbClr') hex = at(c, 'val');
    else if (c.localName === 'sysClr') hex = at(c, 'lastClr') || (at(c, 'val') === 'window' ? 'FFFFFF' : '000000');
    else if (c.localName === 'prstClr') hex = ({ black: '000000', white: 'FFFFFF', red: 'FF0000', blue: '0000FF', green: '008000', yellow: 'FFFF00', gray: '808080' })[at(c, 'val')] || null;
    else if (c.localName === 'schemeClr') { const v = at(c, 'val'); hex = v === 'phClr' ? (ctx && ctx.phClr) : esquema(ctx, v); }
    if (!hex) return null;
    let rgb = hex2rgb(hex);
    let hsl = rgbHsl(rgb);
    for (const m of Array.from(c.children)) {
      const v = +at(m, 'val') / 100000;
      if (m.localName === 'lumMod') hsl[2] *= v;
      else if (m.localName === 'lumOff') hsl[2] += v;
      else if (m.localName === 'tint') { rgb = hslRgb(hsl); rgb = rgb.map((x) => x + (255 - x) * (1 - v)); hsl = rgbHsl(rgb); }
      else if (m.localName === 'shade') { rgb = hslRgb(hsl); rgb = rgb.map((x) => x * v); hsl = rgbHsl(rgb); }
    }
    hsl[2] = Math.max(0, Math.min(1, hsl[2]));
    return rgb2hex(hslRgb(hsl)).toUpperCase();
  }
  function esquema(ctx, nombre) {
    if (!ctx || !ctx.tema) return null;
    const mapa = Object.assign({}, ctx.clrMap || {}, ctx.clrMapOvr || {});
    const real = mapa[nombre] || nombre;
    return ctx.tema.esquema[real] || ctx.tema.esquema[nombre] || null;
  }
  function luminancia(hex) {
    const [r, g, b] = hex2rgb(hex).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  function contraste(a, b) { const la = luminancia(a), lb = luminancia(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); }

  /* ---------------------------------------------------------- tema */
  function leerTema(doc) {
    const t = doc.documentElement;
    const cs = uno(t, 'clrScheme');
    const esq = {};
    if (cs) for (const c of Array.from(cs.children)) { const x = c.firstElementChild; if (x) esq[c.localName] = x.localName === 'sysClr' ? (at(x, 'lastClr') || (at(x, 'val') === 'window' ? 'FFFFFF' : '000000')) : at(x, 'val'); }
    const fs = uno(t, 'fontScheme');
    const mayor = uno(uno(fs, 'majorFont'), 'latin'), menor = uno(uno(fs, 'minorFont'), 'latin');
    const fam = uno(t, 'themeFamily');
    return { nombre: at(t, 'name') || '', colores: at(cs, 'name') || '', fuentesNombre: at(fs, 'name') || '', esquema: esq, fuentes: { titulo: at(mayor, 'typeface') || '', cuerpo: at(menor, 'typeface') || '' }, bgFill: Array.from((uno(t, 'bgFillStyleLst') || { children: [] }).children), familia: fam ? { nombre: at(fam, 'name'), id: at(fam, 'id'), vid: at(fam, 'vid') } : null };
  }

  /* ======================================================= lectura */
  async function leer(archivo, nombre) {
    if (!window.JSZip) throw new Error('No se cargó JSZip.');
    let zip;
    try { zip = await window.JSZip.loadAsync(archivo); }
    catch (e) { throw new Error('El archivo no es una presentación de PowerPoint válida (.pptx). Si es .ppt (PowerPoint 97-2003), ábrelo y guárdalo como Presentación de PowerPoint (.pptx).'); }
    const cache = {};
    const xml = async (ruta) => {
      if (cache[ruta] !== undefined) return cache[ruta];
      const f = zip.file(ruta);
      cache[ruta] = f ? parse(await f.async('string')) : null;
      return cache[ruta];
    };
    const rels = async (ruta) => {
      const d = await xml(relsDe(ruta));
      const m = {};
      if (d) for (const r of todos(d, 'Relationship')) m[at(r, 'Id')] = { tipo: (at(r, 'Type') || '').split('/').pop(), destino: at(r, 'TargetMode') === 'External' ? at(r, 'Target') : rutaRel(ruta, at(r, 'Target')), externo: at(r, 'TargetMode') === 'External', target: at(r, 'Target') };
      return m;
    };
    const pres = await xml('ppt/presentation.xml');
    if (!pres) throw new Error('No encontré ppt/presentation.xml: el archivo no parece ser una presentación de PowerPoint.');
    const presRels = await rels('ppt/presentation.xml');
    const ext = (nombre || '').split('.').pop().toLowerCase();
    const P = { nombre, extension: ext, diapositivas: [], secciones: [], temas: [], medios: [], macros: !!zip.file('ppt/vbaProject.bin') };
    const sz = uno(pres, 'sldSz');
    P.tamano = { cx: +at(sz, 'cx') || 12192000, cy: +at(sz, 'cy') || 6858000 };
    P.panoramica = Math.abs(P.tamano.cx / P.tamano.cy - 16 / 9) < 0.02;
    // estilo de texto predeterminado de la presentación
    P.defaultTextStyle = uno(pres, 'defaultTextStyle');
    // propiedades del documento
    const core = await xml('docProps/core.xml');
    P.titulo = core ? ((uno(core, 'title') || {}).textContent || '').trim() : '';
    // medios incrustados
    zip.forEach((ruta) => { if (/^ppt\/media\//.test(ruta)) P.medios.push(ruta); });

    // patrones y temas
    const patrones = {};
    const leerPatron = async (ruta) => {
      if (patrones[ruta]) return patrones[ruta];
      const d = await xml(ruta);
      const r = await rels(ruta);
      const temaRuta = Object.values(r).find((x) => x.tipo === 'theme');
      const tdoc = temaRuta ? await xml(temaRuta.destino) : null;
      const tema = tdoc ? leerTema(tdoc) : { nombre: '', esquema: {}, fuentes: {}, bgFill: [] };
      const cm = uno(d, 'clrMap');
      const clrMap = {};
      if (cm) for (const a of Array.from(cm.attributes)) clrMap[a.name] = a.value;
      patrones[ruta] = { ruta, doc: d, tema, clrMap, txStyles: uno(d, 'txStyles'), formas: phDe(d), fondo: hijo(uno(d, 'cSld'), 'bg') };
      if (!P.temas.some((t) => t.nombre === tema.nombre && t.colores === tema.colores)) P.temas.push(tema);
      return patrones[ruta];
    };
    const disenos = {};
    const leerDiseno = async (ruta) => {
      if (disenos[ruta]) return disenos[ruta];
      const d = await xml(ruta);
      const r = await rels(ruta);
      const mr = Object.values(r).find((x) => x.tipo === 'slideMaster');
      const patron = mr ? await leerPatron(mr.destino) : null;
      const raiz = d.documentElement;
      disenos[ruta] = { ruta, doc: d, nombre: at(uno(d, 'cSld'), 'name') || '', tipo: at(raiz, 'type') || 'cust', patron, formas: phDe(d), fondo: hijo(uno(d, 'cSld'), 'bg'), clrMapOvr: mapaOvr(d) };
      return disenos[ruta];
    };

    // orden de diapositivas
    const ridDe = (el) => { const a = Array.from(el.attributes).find((x) => x.localName === 'id' && /relationships/.test(x.namespaceURI || '')); return a ? a.value : null; };
    const ids = todos(uno(pres, 'sldIdLst'), 'sldId').map((s) => ({ id: at(s, 'id'), rid: ridDe(s) }));
    const porId = {};
    let n = 0;
    for (const s of ids) {
      const rel = presRels[s.rid];
      if (!rel) continue;
      n++;
      const ruta = rel.destino;
      const d = await xml(ruta);
      const r = await rels(ruta);
      const lr = Object.values(r).find((x) => x.tipo === 'slideLayout');
      const diseno = lr ? await leerDiseno(lr.destino) : null;
      const nr = Object.values(r).find((x) => x.tipo === 'notesSlide');
      const notasDoc = nr ? await xml(nr.destino) : null;
      const D = { n, id: s.id, archivo: ruta, oculta: at(d.documentElement, 'show') === '0', diseno: diseno ? { nombre: diseno.nombre, tipo: diseno.tipo } : { nombre: '', tipo: '' } };
      const ctx = { tema: diseno && diseno.patron ? diseno.patron.tema : { esquema: {} }, clrMap: diseno && diseno.patron ? diseno.patron.clrMap : {}, clrMapOvr: Object.assign({}, diseno ? diseno.clrMapOvr : {}, mapaOvr(d)), diseno, patron: diseno && diseno.patron, P };
      D.fondo = fondoDe(d, diseno, ctx);
      D.formas = [];
      const arbol = uno(uno(d, 'cSld'), 'spTree');
      await leerFormas(arbol, D.formas, { ruta, rels: r, ctx, xml, rels2: rels, zip }, null);
      D.titulo = (D.formas.find((f) => f.ph && /title/i.test(f.ph.type || '')) || {}).texto || '';
      D.texto = D.formas.map((f) => f.textoTodo || '').join(' ').replace(/\s+/g, ' ').trim();
      D.notas = notasDoc ? todos(notasDoc, 'sp').filter((sp) => { const ph = uno(uno(sp, 'nvSpPr'), 'ph'); return ph && at(ph, 'type') === 'body'; }).map((sp) => textoDe(uno(sp, 'txBody'))).join('\n').trim() : '';
      D.transicion = leerTransicion(d, r);
      D.animaciones = leerAnimaciones(d, D.formas);
      D.medios = D.formas.flatMap((f) => (f.media ? [Object.assign({ forma: f }, f.media)] : []));
      leerMediosTiempo(d, D);
      P.diapositivas.push(D);
      porId[s.id] = D;
    }
    P.porArchivo = {};
    P.diapositivas.forEach((D) => { P.porArchivo[D.archivo] = D; });
    // destinos de los vínculos a diapositivas
    for (const D of P.diapositivas) for (const f of todasLasFormas(D.formas)) for (const v of f.vinculos) if (v.tipo === 'diapositiva' && v.ruta) { const t = P.porArchivo[v.ruta]; v.n = t ? t.n : null; v.tituloDestino = t ? t.titulo : ''; }
    // secciones (extensión p14:sectionLst)
    for (const sec of todos(pres, 'section')) {
      if (sec.parentNode.localName !== 'sectionLst') continue;
      P.secciones.push({ nombre: at(sec, 'name') || '', diapositivas: todos(sec, 'sldId').map((x) => (porId[at(x, 'id')] || {}).n).filter(Boolean) });
    }
    P.diapositivas.forEach((D) => { const s = P.secciones.find((x) => x.diapositivas.includes(D.n)); D.seccion = s ? s.nombre : null; });
    // tema aplicado (el del patrón de la primera diapositiva)
    const primero = P.diapositivas[0];
    const d0 = primero && Object.values(disenos).find((x) => x.nombre === primero.diseno.nombre);
    P.tema = d0 && d0.patron ? d0.patron.tema : P.temas[0] || { nombre: '', esquema: {}, fuentes: {} };
    // configuración de la presentación
    const props = await xml('ppt/presProps.xml');
    const sp = props ? uno(props, 'showPr') : null;
    P.config = {
      repetir: at(sp, 'loop') === '1' || at(sp, 'loop') === 'true',
      usarIntervalos: !(at(sp, 'useTimings') === '0' || at(sp, 'useTimings') === 'false'),
      tipo: sp && hijo(sp, 'kiosk') ? 'quiosco' : sp && hijo(sp, 'browse') ? 'individual' : 'orador',
      sinAnimacion: at(sp, 'showAnimation') === '0',
      narracion: at(sp, 'showNarration') === '1',
    };
    if (sp && hijo(sp, 'kiosk')) { const k = hijo(sp, 'kiosk'); P.config.reiniciar = +at(k, 'restart') || null; }
    return P;
  }

  function mapaOvr(d) {
    const o = uno(d, 'overrideClrMapping');
    const m = {};
    if (o) for (const a of Array.from(o.attributes)) m[a.name] = a.value;
    return m;
  }
  /* Marcadores de posición de un diseño o patrón: [{type, idx, el}] */
  function phDe(d) {
    if (!d) return [];
    return todos(d, 'sp').map((sp) => { const ph = uno(sp, 'ph'); return ph ? { type: at(ph, 'type') || 'obj', idx: at(ph, 'idx'), el: sp } : null; }).filter(Boolean);
  }
  function fondoDe(d, diseno, ctx) {
    const cands = [hijo(uno(d, 'cSld'), 'bg'), diseno && diseno.fondo, diseno && diseno.patron && diseno.patron.fondo];
    for (const bg of cands) {
      if (!bg) continue;
      const pr = hijo(bg, 'bgPr');
      if (pr) {
        const sf = hijo(pr, 'solidFill');
        if (sf) return { tipo: 'solido', color: colorDe(sf, ctx) };
        if (hijo(pr, 'gradFill')) { const gs = todos(hijo(pr, 'gradFill'), 'gs'); return { tipo: 'degradado', color: gs.length ? colorDe(gs[0], ctx) : null }; }
        if (hijo(pr, 'blipFill')) return { tipo: 'imagen', color: null };
        return { tipo: 'otro', color: null };
      }
      const ref = hijo(bg, 'bgRef');
      if (ref) {
        const idx = +at(ref, 'idx');
        const phClr = colorDe(ref, ctx);
        const lista = ctx.tema.bgFill || [];
        const relleno = idx >= 1001 ? lista[idx - 1001] : null;
        if (!relleno || relleno.localName === 'solidFill') return { tipo: 'solido', color: relleno ? colorDe(relleno, Object.assign({}, ctx, { phClr })) || phClr : phClr };
        if (relleno.localName === 'gradFill') { const gs = todos(relleno, 'gs'); return { tipo: 'degradado', color: gs.length ? colorDe(gs[0], Object.assign({}, ctx, { phClr })) : phClr }; }
        return { tipo: 'imagen', color: null };
      }
    }
    return { tipo: 'solido', color: esquema(ctx, 'bg1') || 'FFFFFF' };
  }

  /* ------------------------------------------------------- formas */
  function textoDe(txBody) {
    if (!txBody) return '';
    return hijos(txBody, 'p').map((p) => Array.from(p.getElementsByTagNameNS('*', 't')).map((t) => t.textContent).join('')).join('\n').trim();
  }
  function todasLasFormas(lista) { const out = []; const rec = (l) => l.forEach((f) => { out.push(f); if (f.hijos) rec(f.hijos); }); rec(lista); return out; }

  async function leerFormas(arbol, out, A, grupo) {
    if (!arbol) return;
    for (const el of Array.from(arbol.children)) {
      const t = el.localName;
      if (t === 'AlternateContent') { const ch = hijo(el, 'Choice') || hijo(el, 'Fallback'); if (ch) await leerFormas(ch, out, A, grupo); continue; }
      if (!['sp', 'pic', 'graphicFrame', 'grpSp', 'cxnSp', 'contentPart'].includes(t)) continue;
      const nv = Array.from(el.children).find((c) => /^nv/.test(c.localName));
      const cNvPr = nv ? hijo(nv, 'cNvPr') : null;
      const nvPr = nv ? hijo(nv, 'nvPr') : null;
      const ph = nvPr ? hijo(nvPr, 'ph') : null;
      const xfrm = uno(el, 'xfrm');
      const off = hijo(xfrm, 'off'), extn = hijo(xfrm, 'ext');
      const f = {
        tipo: t, id: at(cNvPr, 'id'), nombre: at(cNvPr, 'name') || '', descr: (at(cNvPr, 'descr') || '').trim(), tituloAlt: at(cNvPr, 'title') || '',
        decorativo: !!todos(cNvPr, 'decorative').find((x) => at(x, 'val') === '1' || at(x, 'val') === 'true'),
        oculta: at(cNvPr, 'hidden') === '1',
        ph: ph ? { type: at(ph, 'type') || 'obj', idx: at(ph, 'idx') } : null,
        x: +at(off, 'x') || 0, y: +at(off, 'y') || 0, cx: +at(extn, 'cx') || 0, cy: +at(extn, 'cy') || 0,
        geometria: at(uno(el, 'prstGeom'), 'prst'), grupo, vinculos: [], parrafos: [], texto: '',
      };
      // hipervínculos (de la forma y del texto)
      for (const hl of todos(el, 'hlinkClick')) {
        const rid = Array.from(hl.attributes).find((a) => a.localName === 'id');
        const accion = at(hl, 'action') || '';
        const rel = rid && rid.value ? A.rels[rid.value] : null;
        if (/ppaction:\/\/media/.test(accion)) continue;
        if (/hlinkshowjump/.test(accion)) f.vinculos.push({ tipo: 'diapositiva', especial: (/jump=(\w+)/.exec(accion) || [])[1] || '', accion });
        else if (/hlinksldjump/.test(accion)) f.vinculos.push({ tipo: 'diapositiva', ruta: rel ? rel.destino : null, accion });
        else if (rel && rel.externo) f.vinculos.push({ tipo: /^mailto:/i.test(rel.target) ? 'correo' : 'url', destino: rel.target });
        else if (accion) f.vinculos.push({ tipo: 'accion', accion });
      }
      if (t === 'sp' || t === 'cxnSp') {
        const tx = hijo(el, 'txBody');
        if (tx) leerTexto(f, tx, el, A);
        const spPr = hijo(el, 'spPr');
        const sf = hijo(spPr, 'solidFill');
        f.relleno = sf ? colorDe(sf, A.ctx) : null;
        if (!sf && !hijo(spPr, 'noFill')) { const fr = uno(hijo(el, 'style'), 'fillRef'); if (fr && at(fr, 'idx') !== '0') f.relleno = colorDe(fr, A.ctx); }
        f.cuadroTexto = !!(nv && uno(nv, 'cNvSpPr') && at(uno(nv, 'cNvSpPr'), 'txBox') === '1');
      }
      if (t === 'pic') {
        const blip = uno(el, 'blip');
        const svg = uno(el, 'svgBlip');
        const sr = uno(el, 'srcRect');
        f.imagen = { svg: !!svg, recorte: sr && ['l', 't', 'r', 'b'].some((k) => +at(sr, k)) ? { l: +at(sr, 'l') || 0, t: +at(sr, 't') || 0, r: +at(sr, 'r') || 0, b: +at(sr, 'b') || 0 } : null, forma: f.geometria };
        const rid = blip && Array.from(blip.attributes).find((a) => a.localName === 'embed');
        f.imagen.ruta = rid && A.rels[rid.value] ? A.rels[rid.value].destino : null;
        const tam = f.imagen.ruta ? await tamanoImagen(A.zip, f.imagen.ruta) : null;
        if (tam) { f.imagen.ancho = tam.w; f.imagen.alto = tam.h; }
        if (svg) { const r2 = Array.from(svg.attributes).find((a) => a.localName === 'embed'); f.imagen.rutaSvg = r2 && A.rels[r2.value] ? A.rels[r2.value].destino : null; }
        const vf = uno(nvPr, 'videoFile'), af = uno(nvPr, 'audioFile'), media = uno(nvPr, 'media');
        if (vf || af || media) {
          const rm = media && Array.from(media.attributes).find((a) => a.localName === 'embed');
          const rl = (vf || af) && Array.from((vf || af).attributes).find((a) => a.localName === 'link');
          const ruta = (rm && A.rels[rm.value]) ? A.rels[rm.value].destino : (rl && A.rels[rl.value]) ? A.rels[rl.value].destino : '';
          f.media = { tipo: vf ? 'video' : 'audio', ruta, externo: !!(rl && A.rels[rl.value] && A.rels[rl.value].externo), recorte: media ? (() => { const tr = uno(media, 'trim'); return tr ? { ini: +at(tr, 'st') || 0, fin: +at(tr, 'end') || 0 } : null; })() : null };
        }
      }
      if (t === 'graphicFrame') {
        const gd = uno(el, 'graphicData');
        const uri = at(gd, 'uri') || '';
        if (/table/.test(uri)) {
          const tbl = uno(gd, 'tbl');
          const filas = hijos(tbl, 'tr').map((tr) => hijos(tr, 'tc').map((tc) => textoDe(uno(tc, 'txBody'))));
          const tblPr = uno(tbl, 'tblPr');
          f.tabla = { filas: filas.length, columnas: hijos(uno(tbl, 'tblGrid'), 'gridCol').length, celdas: filas, encabezado: at(tblPr, 'firstRow') === '1', bandas: at(tblPr, 'bandRow') === '1' };
          f.textoTodo = filas.map((r) => r.join(' ')).join(' ');
        } else if (/chart/.test(uri)) {
          const c = uno(gd, 'chart');
          const rid = c && Array.from(c.attributes).find((a) => a.localName === 'id');
          const rel = rid ? A.rels[rid.value] : null;
          f.grafico = rel ? await leerGrafico(await A.xml(rel.destino)) : { tipos: [] };
        } else if (/diagram/.test(uri)) {
          const ri = uno(gd, 'relIds');
          const g = (n2) => { const a = ri && Array.from(ri.attributes).find((x) => x.localName === n2); return a && A.rels[a.value] ? A.rels[a.value].destino : null; };
          const datos = g('dm') ? await A.xml(g('dm')) : null;
          const diseno = g('lo') ? await A.xml(g('lo')) : null;
          const ld = diseno ? diseno.documentElement : null;
          f.smartart = {
            layout: at(ld, 'uniqueId') || '', nombre: (uno(ld, 'title') && at(uno(ld, 'title'), 'val')) || '',
            categorias: todos(ld, 'cat').map((x) => at(x, 'type')),
            textos: datos ? todos(datos, 'pt').filter((pt) => !at(pt, 'type') || at(pt, 'type') === 'node').map((pt) => textoDe(uno(pt, 't'))).filter(Boolean) : [],
          };
          f.textoTodo = f.smartart.textos.join(' ');
        } else if (/ole/i.test(uri)) f.ole = true;
      }
      if (t === 'grpSp') { f.hijos = []; await leerFormas(el, f.hijos, A, f); }
      out.push(f);
    }
  }

  /* Tamaño en píxeles de una imagen PNG o JPEG del paquete */
  async function tamanoImagen(zip, ruta) {
    const f = zip && zip.file(ruta);
    if (!f) return null;
    const b = await f.async('uint8array');
    if (b[0] === 0x89 && b[1] === 0x50) return { w: (b[16] << 24 | b[17] << 16 | b[18] << 8 | b[19]) >>> 0, h: (b[20] << 24 | b[21] << 16 | b[22] << 8 | b[23]) >>> 0 };
    if (b[0] === 0xff && b[1] === 0xd8) {
      let i = 2;
      while (i < b.length - 9) {
        if (b[i] !== 0xff) { i++; continue; }
        const m = b[i + 1];
        const L = b[i + 2] << 8 | b[i + 3];
        if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { w: b[i + 7] << 8 | b[i + 8], h: b[i + 5] << 8 | b[i + 6] };
        i += 2 + L;
      }
    }
    return null;
  }
  /* ¿La imagen está deformada? Compara la proporción mostrada con la original (tras el recorte) */
  function deformada(f) {
    const im = f.imagen;
    if (!im || !im.ancho || !im.alto || !f.cx || !f.cy) return false;
    const r = im.recorte || { l: 0, t: 0, r: 0, b: 0 };
    const w = im.ancho * (1 - (r.l + r.r) / 100000), hh = im.alto * (1 - (r.t + r.b) / 100000);
    return Math.abs((f.cx / f.cy) / (w / hh) - 1) > 0.04;
  }

  /* Texto con tamaño, fuente y color efectivos (herencia: forma → diseño → patrón → estilos del patrón) */
  function leerTexto(f, tx, sp, A) {
    const ctx = A.ctx;
    const esTitulo = f.ph && /title/i.test(f.ph.type);
    const bodyPr = hijo(tx, 'bodyPr');
    const na = hijo(bodyPr, 'normAutofit');
    f.escalaAuto = na && at(na, 'fontScale') ? +at(na, 'fontScale') / 100000 : 1;
    f.autoajuste = na ? 'reducir' : hijo(bodyPr, 'spAutoFit') ? 'ajustarForma' : hijo(bodyPr, 'noAutofit') ? 'no' : null;
    // cadenas de estilos heredados por nivel
    const cadena = [];
    cadena.push(hijo(tx, 'lstStyle'));
    if (f.ph && ctx.diseno) {
      const lph = buscarPh(ctx.diseno.formas, f.ph);
      if (lph) cadena.push(uno(uno(lph.el, 'txBody'), 'lstStyle'));
      if (ctx.patron) { const mph = buscarPh(ctx.patron.formas, { type: tipoPatron(f.ph.type, lph), idx: null }); if (mph) cadena.push(uno(uno(mph.el, 'txBody'), 'lstStyle')); }
    }
    const txs = ctx.patron && ctx.patron.txStyles;
    const estiloPatron = txs ? hijo(txs, esTitulo ? 'titleStyle' : f.ph ? 'bodyStyle' : 'otherStyle') : null;
    cadena.push(estiloPatron);
    if (!f.ph && ctx.P.defaultTextStyle) cadena.push(ctx.P.defaultTextStyle);
    const nivelPr = (lst, lvl) => (lst ? hijo(lst, 'lvl' + (lvl + 1) + 'pPr') : null);
    const heredar = (lvl, prop) => {
      for (const lst of cadena) {
        const pp = nivelPr(lst, lvl);
        const d = hijo(pp, 'defRPr');
        if (!d) continue;
        if (prop === 'sz' && at(d, 'sz')) return +at(d, 'sz') / 100;
        if (prop === 'b' && at(d, 'b') != null) return at(d, 'b') === '1';
        if (prop === 'latin') { const l = hijo(d, 'latin'); if (l) return at(l, 'typeface'); }
        if (prop === 'color') { const sf = hijo(d, 'solidFill'); if (sf) return colorDe(sf, ctx); }
      }
      return null;
    };
    const fuenteReal = (tf) => (tf === '+mj-lt' ? ctx.tema.fuentes.titulo : tf === '+mn-lt' ? ctx.tema.fuentes.cuerpo : tf);
    const textos = [];
    for (const p of hijos(tx, 'p')) {
      const pPr = hijo(p, 'pPr');
      const lvl = +at(pPr, 'lvl') || 0;
      const runs = [];
      for (const r of Array.from(p.children).filter((c) => c.localName === 'r' || c.localName === 'fld')) {
        const rPr = hijo(r, 'rPr');
        const t = (uno(r, 't') || {}).textContent || '';
        if (!t) continue;
        const sz = at(rPr, 'sz') ? +at(rPr, 'sz') / 100 : heredar(lvl, 'sz') || 18;
        const lat = hijo(rPr, 'latin');
        const tf = fuenteReal((lat && at(lat, 'typeface')) || heredar(lvl, 'latin') || (esTitulo ? '+mj-lt' : '+mn-lt'));
        const sf = hijo(rPr, 'solidFill');
        const color = sf ? colorDe(sf, ctx) : (heredar(lvl, 'color') || esquema(ctx, 'tx1'));
        runs.push({ texto: t, tam: Math.round(sz * f.escalaAuto * 10) / 10, tamNominal: sz, fuente: tf || '', color, colorExplicito: !!sf, negrita: at(rPr, 'b') != null ? at(rPr, 'b') === '1' : !!heredar(lvl, 'b'), cursiva: at(rPr, 'i') === '1', subrayado: !!at(rPr, 'u') && at(rPr, 'u') !== 'none' });
      }
      const texto = runs.map((x) => x.texto).join('');
      f.parrafos.push({ nivel: lvl, texto, runs, vineta: !!(hijo(pPr, 'buChar') || hijo(pPr, 'buAutoNum')) || (!!f.ph && !esTitulo && !hijo(pPr, 'buNone')) });
      if (texto.trim()) textos.push(texto);
    }
    f.texto = textos.join('\n').trim();
    f.textoTodo = f.texto;
  }
  function tipoPatron(t, lph) {
    if (/title/i.test(t)) return 'title';
    if (t === 'dt' || t === 'ftr' || t === 'sldNum') return t;
    void lph;
    return 'body';
  }
  function buscarPh(lista, ph) {
    if (!lista) return null;
    if (ph.idx != null) { const x = lista.find((l) => l.idx === ph.idx); if (x) return x; }
    const tipo = ph.type === 'ctrTitle' ? ['ctrTitle', 'title'] : ph.type === 'subTitle' ? ['subTitle', 'body'] : [ph.type];
    for (const t of tipo) { const x = lista.find((l) => l.type === t); if (x) return x; }
    return null;
  }

  /* ----------------------------------------------------- gráficos */
  async function leerGrafico(doc) {
    if (!doc) return { tipos: [] };
    const pa = uno(doc, 'plotArea');
    const tipos = [];
    let series = 0;
    let valores = [];
    for (const c of Array.from(pa ? pa.children : [])) {
      const n = c.localName;
      if (!/Chart$/.test(n)) continue;
      let tipo = n.replace(/Chart$/, '').replace(/3D$/, '');
      if (tipo === 'bar') tipo = at(hijo(c, 'barDir'), 'val') === 'bar' ? 'barras' : 'columnas';
      else tipo = ({ line: 'lineas', pie: 'circular', doughnut: 'anillo', area: 'area', scatter: 'dispersion', radar: 'radial' })[tipo] || tipo;
      tipos.push(tipo);
      series += hijos(c, 'ser').length;
      for (const ser of hijos(c, 'ser')) {
        const v = todos(hijo(ser, 'val'), 'pt').map((pt) => parseFloat((uno(pt, 'v') || {}).textContent)).filter((n) => isFinite(n));
        if (v.length > valores.length) valores = v;
      }
    }
    const ch = uno(doc, 'chart');
    const tituloEl = hijo(ch, 'title');
    const borrado = at(hijo(ch, 'autoTitleDeleted'), 'val') === '1';
    const tituloTxt = tituloEl ? Array.from(tituloEl.getElementsByTagNameNS('*', 't')).map((t) => t.textContent).join('').trim() : '';
    const ejes = todos(pa, 'valAx').concat(todos(pa, 'catAx'), todos(pa, 'dateAx'));
    return {
      tipos, series, valores, puntos: valores.length, tieneTitulo: !!tituloEl && !borrado, titulo: tituloTxt,
      etiquetas: todos(pa, 'dLbls').some((d) => at(hijo(d, 'showVal'), 'val') === '1' || at(hijo(d, 'showPercent'), 'val') === '1'),
      leyenda: !!uno(ch, 'legend'), ejesConTitulo: ejes.filter((e) => hijo(e, 'title')).length,
    };
  }

  /* --------------------------------------------------- transiciones */
  const NOMBRES_TRANS = { fade: 'Desvanecer', push: 'Empuje', wipe: 'Barrido', split: 'Dividir', reveal: 'Mostrar', cut: 'Corte', randomBar: 'Barras aleatorias', circle: 'Forma', diamond: 'Forma', plus: 'Forma', cover: 'Cubrir', pull: 'Revelar', zoom: 'Zoom', morph: 'Transformación', vortex: 'Vórtice', curtains: 'Cortinas', flip: 'Voltear', gallery: 'Galería', prism: 'Cubo', doors: 'Puertas', window: 'Ventana', ferris: 'Noria', flash: 'Flash', shred: 'Triturar', ripple: 'Ondulación', honeycomb: 'Panal', glitter: 'Brillo', switch: 'Cambiar', vortex2: 'Vórtice', wind: 'Viento', prestige: 'Prestigio', fracture: 'Fracturar', crush: 'Aplastar', peelOff: 'Despegar', pageCurlDouble: 'Enrollar página', airplane: 'Avión', origami: 'Origami', dissolve: 'Disolver', checker: 'Cuadros bicolores', blinds: 'Persianas', wheel: 'Reloj', warp: 'Zoom', conveyor: 'Cinta transportadora', pan: 'Panorámica', reveal2: 'Revelar', random: 'Aleatorio', strips: 'Franjas', newsflash: 'Destello', fallOver: 'Caer', drape: 'Tender', crush2: 'Triturar' };
  function leerTransicion(d, rels) {
    // en un mc:AlternateContent se prefiere la versión moderna (Choice)
    const dentroDe = (el, local) => { for (let x = el.parentNode; x && x.nodeType === 1; x = x.parentNode) if (x.localName === local) return true; return false; };
    const lista = todos(d, 'transition');
    const tr = lista.find((t) => !dentroDe(t, 'Fallback')) || lista[0] || null;
    if (!tr) return null;
    const ef = Array.from(tr.children).find((c) => !['sndAc', 'extLst'].includes(c.localName));
    const durAttr = Array.from(tr.attributes).find((a) => a.localName === 'dur');
    const spd = at(tr, 'spd');
    const advTm = at(tr, 'advTm');
    const snd = uno(tr, 'snd');
    let sonido = null;
    if (snd) { const r = Array.from(snd.attributes).find((a) => a.localName === 'embed'); sonido = at(snd, 'name') || (r && rels[r.value] ? rels[r.value].destino : 'sonido'); }
    let efecto = ef ? ef.localName : null;
    if (efecto === 'prstTrans') efecto = at(ef, 'prst') || efecto;
    return {
      efecto, nombre: efecto ? NOMBRES_TRANS[efecto] || efecto : null,
      opcion: ef ? Array.from(ef.attributes).map((a) => a.name + '=' + a.value).join(' ') : '',
      duracion: durAttr ? +durAttr.value / 1000 : spd === 'slow' ? 1 : spd === 'med' ? 0.75 : spd === 'fast' ? 0.5 : null,
      alHacerClic: at(tr, 'advClick') !== '0' && at(tr, 'advClick') !== 'false',
      despues: advTm != null ? +advTm / 1000 : null,
      sonido,
    };
  }

  /* ---------------------------------------------------- animaciones */
  function leerAnimaciones(d, formas) {
    const timing = uno(d, 'timing');
    if (!timing) return [];
    const out = [];
    const nombres = {};
    todasLasFormas(formas).forEach((f) => { nombres[f.id] = f.nombre; });
    let grupoClic = 0;
    const main = todos(timing, 'cTn').find((c) => at(c, 'nodeType') === 'mainSeq');
    for (const c of todos(timing, 'cTn')) {
      const clase = at(c, 'presetClass');
      if (!clase) continue;
      const nodo = at(c, 'nodeType') || '';
      const tgt = uno(c, 'spTgt');
      const spid = at(tgt, 'spid');
      const durs = todos(c, 'cTn').map((x) => at(x, 'dur')).filter((x) => x && /^\d+$/.test(x)).map(Number);
      const cond = uno(hijo(c, 'stCondLst'), 'cond');
      const motion = uno(c, 'animMotion');
      const enMain = main ? main.contains(c) : true;
      if (nodo === 'clickEffect') grupoClic++;
      const a = { spid, objeto: nombres[spid] || '', clase, presetID: +at(c, 'presetID') || 0, presetSubtype: +at(c, 'presetSubtype') || 0, nodo, inicio: nodo === 'clickEffect' ? 'clic' : nodo === 'withEffect' ? 'con' : nodo === 'afterEffect' ? 'despues' : nodo, duracion: durs.length ? Math.max(...durs) / 1000 : 0, retraso: cond && /^\d+$/.test(at(cond, 'delay') || '') ? +at(cond, 'delay') / 1000 : 0, ruta: motion ? at(motion, 'path') : null, interactiva: !enMain, grupo: grupoClic };
      if (a.ruta) {
        const nums = (a.ruta.match(/-?\d*\.?\d+(e-?\d+)?/gi) || []).map(Number);
        if (nums.length >= 2) { a.finRuta = { x: nums[nums.length - 2], y: nums[nums.length - 1] }; }
      }
      out.push(a);
    }
    return out;
  }
  /* Opciones de reproducción de video y audio (nodos de medios del tiempo) */
  function leerMediosTiempo(d, D) {
    const timing = uno(d, 'timing');
    for (const m of D.medios) {
      const id = m.forma.id;
      const nodo = timing ? todos(timing, 'cMediaNode').find((x) => at(uno(x, 'spTgt'), 'spid') === id) : null;
      const ctn = nodo ? hijo(nodo, 'cTn') : null;
      const padre = nodo ? nodo.parentNode : null;
      m.repetir = !!ctn && at(ctn, 'repeatCount') === 'indefinite';
      m.ocultar = !!nodo && at(nodo, 'showWhenStopped') === '0';
      m.todasDiapositivas = !!nodo && +(at(nodo, 'numSld') || 1) > 1;
      m.pantallaCompleta = !!padre && at(padre, 'fullScrn') === '1';
      m.volumen = nodo && at(nodo, 'vol') != null ? +at(nodo, 'vol') / 1000 : null;
      const play = D.animaciones.find((a) => a.spid === id && a.clase === 'mediacall' && a.presetID === 1);
      m.inicio = play ? (play.interactiva ? 'clic' : play.nodo === 'clickEffect' ? 'secuencia' : 'auto') : 'clic';
      m.rebobinar = !!nodo && !!ctn && at(ctn, 'fill') === 'remove';
    }
  }

  /* Variante predeterminada (primera) de los temas de Office con variantes: id de la familia → vid */
  const VARIANTE_BASE = {
    '{C0C680CD-088A-49FC-A102-D699147F32B2}': '{CFBC31BA-B70F-4F30-BCAA-4F3011E16C4D}', '{BBFCD31E-59A1-489D-B089-A3EAD7CAE12E}': '{F5E91637-A7B6-4E27-B710-77DA7014EE1E}',
    '{3577F8C9-A904-41D8-97D2-FD898F53F20E}': '{682D6EBE-8D36-4FF2-9DB3-F3D8D7B6715D}', '{FC33163D-4339-46B1-8EED-24C834239D99}': '{B8502691-933B-45FE-8764-BA278511EF27}',
    '{B8441ADB-2E43-4AF7-B97A-BD870242C6A8}': '{292E63A9-BB86-4E3D-B92A-7223C6510D2E}', '{62F939B6-93AF-4DB8-9C6B-D6C7DFDC589F}': '{4A3C46E8-61CC-4603-A589-7422A47A8E4A}',
    '{2E142A2C-CD16-42D6-873A-C26D2A0506FA}': '{1BDDFF52-6CD6-40A5-AB3C-68EB2F1E4D0A}', '{28CDC826-8792-45C0-861B-85EB3ADEDA33}': '{7DAC20F1-423D-49E2-BD0B-50532748BAD0}',
    '{5F128B03-DCCA-4EEB-AB3B-CF2899314A46}': '{3F1AAB62-24C6-49D2-8E01-B56FAC9A3DCD}', '{0507925B-6AC9-4358-8E18-C330545D08F8}': '{13FEC7C6-62A9-40C4-99D2-581AACACAA2F}',
    '{7CB32D59-10C0-40DD-B7BD-2E94284A981C}': '{24B1A44C-C006-48B2-A4D7-E5549B3D8CD4}',
  };
  /* ¿Se eligió una variante distinta de la primera? true / false / null (tema sin variantes conocidas) */
  function varianteCambiada(P) {
    const f = P.tema && P.tema.familia;
    if (!f || !f.id || !VARIANTE_BASE[f.id.toUpperCase()]) return null;
    return (f.vid || '').toUpperCase() !== VARIANTE_BASE[f.id.toUpperCase()];
  }

  /* ======================================================= revisión */
  const A = {
    diapo(P, n) { return P.diapositivas[n - 1] || null; },
    /* Diapositiva por su título (y si ninguna coincide, por su texto) */
    buscar(P, re) { return P.diapositivas.find((d) => re.test(d.titulo || '')) || P.diapositivas.find((d) => re.test(d.texto || '')) || null; },
    formas(d) { return todasLasFormas(d.formas); },
    imagenes(d) { return todasLasFormas(d.formas).filter((f) => f.tipo === 'pic' && !f.media); },
    iconos(d) { return todasLasFormas(d.formas).filter((f) => f.tipo === 'pic' && f.imagen && f.imagen.svg); },
    textos(d) { return todasLasFormas(d.formas).filter((f) => f.parrafos && f.parrafos.some((p) => p.texto.trim())); },
    runs(d, filtro) { return A.textos(d).filter(filtro || (() => true)).flatMap((f) => f.parrafos.flatMap((p) => p.runs.map((r) => Object.assign({ forma: f, nivel: p.nivel }, r)))); },
    titulo(d) { return todasLasFormas(d.formas).find((f) => f.ph && /title/i.test(f.ph.type)) || null; },
    /* Tamaño mínimo efectivo del texto del título y del resto */
    tamTitulo(d) { const t = A.titulo(d); const r = t ? t.parrafos.flatMap((p) => p.runs) : []; return r.length ? Math.min(...r.map((x) => x.tam)) : null; },
    tamCuerpo(d) { const r = A.runs(d, (f) => !(f.ph && /title/i.test(f.ph.type))); return r.length ? Math.min(...r.map((x) => x.tam)) : null; },
    fuentes(P) { const s = new Set(); P.diapositivas.forEach((d) => A.runs(d).forEach((r) => { if (r.fuente) s.add(r.fuente); })); return Array.from(s); },
    palabras(d) { return A.textos(d).filter((f) => !(f.ph && /title/i.test(f.ph.type))).map((f) => f.texto).join(' ').split(/\s+/).filter(Boolean).length; },
    vinetas(d) { return A.textos(d).filter((f) => !(f.ph && /title/i.test(f.ph.type))).reduce((s, f) => s + f.parrafos.filter((p) => p.texto.trim()).length, 0); },
    /* Contraste mínimo (texto con color conocido sobre el fondo de la diapositiva o de su forma) */
    contrasteMin(d) {
      let min = 21, peor = null;
      for (const f of A.textos(d)) {
        const fondo = f.relleno || (d.fondo && d.fondo.color);
        if (!fondo) continue;
        for (const p of f.parrafos) for (const r of p.runs) { if (!r.color || !r.texto.trim()) continue; const c = contraste(r.color, fondo); if (c < min) { min = c; peor = { forma: f, run: r, fondo, contraste: c }; } }
      }
      return peor ? Object.assign({ min }, peor) : { min: 21 };
    },
    contraste, cerca: (a, b, tol) => Math.abs(a - b) <= (tol == null ? 0.051 : tol),
    deformada, varianteCambiada,
    sinAlt(d) { return todasLasFormas(d.formas).filter((f) => (f.tipo === 'pic' || f.grafico || f.smartart) && !f.media && !f.decorativo && !f.descr); },
    vinculos(P) { return P.diapositivas.flatMap((d) => todasLasFormas(d.formas).flatMap((f) => f.vinculos.map((v) => Object.assign({ diapo: d.n, forma: f }, v)))); },
  };

  function revisar(P, pruebas, nivel) {
    return pruebas.map((p) => {
      let r;
      try { r = p.fn(P, A, nivel); } catch (e) { console.error(e); r = 'No se pudo revisar: ' + (e.message || e); }
      return r === true ? { ok: true, titulo: p.titulo } : { ok: false, titulo: p.titulo, mensaje: (p.titulo ? p.titulo + ': ' : '') + r };
    });
  }

  LT.pptx = { leer, revisar, A, contraste, colorDe, todasLasFormas };
})();

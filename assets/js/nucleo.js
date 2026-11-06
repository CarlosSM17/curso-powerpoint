/* Núcleo de la plataforma: utilidades DOM, referencias de celda, interfaz y progreso.
   Todo vive en el espacio de nombres global LT. */
(function () {
  'use strict';
  const LT = (window.LT = window.LT || {});

  /* ---------------------------------------------------------------- DOM */
  function h(tag, props, ...hijos) {
    const el = document.createElement(tag);
    if (props) {
      for (const [k, v] of Object.entries(props)) {
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
        else if (k === 'html') el.innerHTML = v;
        else if (k === 'dataset') Object.assign(el.dataset, v);
        else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else if (v === true) el.setAttribute(k, '');
        else el.setAttribute(k, v);
      }
    }
    agregar(el, hijos);
    return el;
  }
  function agregar(el, hijos) {
    for (const hijo of hijos) {
      if (hijo == null || hijo === false) continue;
      if (Array.isArray(hijo)) agregar(el, hijo);
      else if (hijo instanceof Node) el.appendChild(hijo);
      else el.appendChild(document.createTextNode(String(hijo)));
    }
  }
  const $ = (sel, raiz) => (raiz || document).querySelector(sel);
  const $$ = (sel, raiz) => Array.from((raiz || document).querySelectorAll(sel));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  let _uid = 0;
  const uid = (p) => (p || 'lt') + '-' + (++_uid);

  function descargar(nombre, contenido, tipo) {
    const blob = contenido instanceof Blob ? contenido : new Blob([contenido], { type: tipo || 'application/octet-stream' });
    const a = h('a', { href: URL.createObjectURL(blob), download: nombre });
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  function formatoMiles(n, dec) {
    return Number(n).toLocaleString('es-MX', { minimumFractionDigits: dec || 0, maximumFractionDigits: dec || 0 });
  }

  LT.u = { h, $, $$, esc, clamp, uid, descargar, formatoMiles };

  /* ------------------------------------------------------- Referencias */
  function colLetra(c) { // 0 -> A
    let s = '';
    c += 1;
    while (c > 0) { const m = (c - 1) % 26; s = String.fromCharCode(65 + m) + s; c = Math.floor((c - 1) / 26); }
    return s;
  }
  function colIndice(letras) {
    let n = 0;
    for (const ch of letras.toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64);
    return n - 1;
  }
  function dir(r, c) { return colLetra(c) + (r + 1); }
  function parseCelda(txt) {
    const m = /^\$?([A-Za-z]{1,3})\$?(\d+)$/.exec(String(txt).trim());
    if (!m) return null;
    return { r: parseInt(m[2], 10) - 1, c: colIndice(m[1]) };
  }
  /* Rango "A1:C3", "B2", "Hoja!A1:B2". Devuelve {hoja, r1, c1, r2, c2} */
  function parseRango(txt) {
    let s = String(txt).trim();
    let hoja = null;
    const ex = s.lastIndexOf('!');
    if (ex >= 0) { hoja = s.slice(0, ex).replace(/^'(.*)'$/, '$1').replace(/''/g, "'"); s = s.slice(ex + 1); }
    const partes = s.split(':');
    const a = parseCelda(partes[0]);
    const b = partes[1] ? parseCelda(partes[1]) : a;
    if (!a || !b) return null;
    return { hoja, r1: Math.min(a.r, b.r), c1: Math.min(a.c, b.c), r2: Math.max(a.r, b.r), c2: Math.max(a.c, b.c) };
  }
  function textoRango(rg) {
    const a = dir(rg.r1, rg.c1), b = dir(rg.r2, rg.c2);
    return a === b ? a : a + ':' + b;
  }
  /* Itera las celdas de una lista de rangos separados por coma: "D2:D21,F4" */
  function celdasDe(lista) {
    const out = [];
    for (const parte of String(lista).split(',')) {
      const rg = parseRango(parte);
      if (!rg) continue;
      for (let r = rg.r1; r <= rg.r2; r++) for (let c = rg.c1; c <= rg.c2; c++) out.push({ r, c, hoja: rg.hoja, dir: dir(r, c) });
    }
    return out;
  }

  const ID_PREV = /[A-Za-z0-9_.\]À-ɏ@#]/;
  const RE_CELDA = /^(\$?)([A-Za-z]{1,3})(\$?)([0-9]{1,7})(?![A-Za-z0-9_(.À-ɏ\[])/;
  const RE_COLS = /^(\$?)([A-Za-z]{1,3}):(\$?)([A-Za-z]{1,3})(?![A-Za-z0-9_(.À-ɏ])/;
  const RE_ID = /^[A-Za-z_À-ɏ\\][A-Za-z0-9_.À-ɏ]*/;

  /* Recorre una fórmula y llama a fn con cada token: {tipo:'texto'|'celda'|'cols'|'id'|'otro', txt, m} */
  function recorrerFormula(f, fn) {
    let i = 0;
    while (i < f.length) {
      const ch = f[i];
      if (ch === '"' || ch === "'") {
        let j = i + 1;
        while (j < f.length) { if (f[j] === ch) { if (f[j + 1] === ch) { j += 2; continue; } break; } j++; }
        fn({ tipo: ch === '"' ? 'cadena' : 'hojaCitada', txt: f.slice(i, j + 1), i });
        i = j + 1;
        continue;
      }
      const prev = i > 0 ? f[i - 1] : '';
      const resto = f.slice(i);
      if (!ID_PREV.test(prev)) {
        let m = RE_CELDA.exec(resto);
        if (m) { fn({ tipo: 'celda', txt: m[0], m, i }); i += m[0].length; continue; }
        m = RE_COLS.exec(resto);
        if (m) { fn({ tipo: 'cols', txt: m[0], m, i }); i += m[0].length; continue; }
      }
      const mi = RE_ID.exec(resto);
      if (mi && !ID_PREV.test(prev)) { fn({ tipo: 'id', txt: mi[0], i }); i += mi[0].length; continue; }
      fn({ tipo: 'otro', txt: ch, i });
      i++;
    }
  }

  /* Desplaza las referencias relativas de una fórmula (al copiar o rellenar) */
  function desplazarFormula(f, dr, dc) {
    if (!dr && !dc) return f;
    let out = '';
    recorrerFormula(f, (t) => {
      if (t.tipo === 'celda') {
        const [, dc$, col, dr$, fila] = t.m;
        let c = colIndice(col), r = parseInt(fila, 10) - 1;
        if (!dc$) c += dc;
        if (!dr$) r += dr;
        if (c < 0 || r < 0 || c > 16383 || r > 1048575) { out += '#¡REF!'; return; }
        out += dc$ + colLetra(c) + dr$ + (r + 1);
      } else if (t.tipo === 'cols') {
        const [, a$, a, b$, b] = t.m;
        let ca = colIndice(a), cb = colIndice(b);
        if (!a$) ca += dc;
        if (!b$) cb += dc;
        if (ca < 0 || cb < 0) { out += '#¡REF!'; return; }
        out += a$ + colLetra(ca) + ':' + b$ + colLetra(cb);
      } else out += t.txt;
    });
    return out;
  }

  /* Lista de referencias en una fórmula (para resaltar). Une "A1:B5" en un solo rango. */
  function referenciasEn(f) {
    const toks = [];
    recorrerFormula(f, (t) => toks.push(t));
    const out = [];
    for (let k = 0; k < toks.length; k++) {
      const t = toks[k];
      if (t.tipo !== 'celda') continue;
      let hoja = null, inicio = t.i;
      const p1 = toks[k - 1], p2 = toks[k - 2];
      if (p1 && p1.txt === '!' && p2 && (p2.tipo === 'id' || p2.tipo === 'hojaCitada')) {
        hoja = p2.tipo === 'hojaCitada' ? p2.txt.slice(1, -1).replace(/''/g, "'") : p2.txt;
        inicio = p2.i;
      }
      const a = parseCelda(t.txt);
      let rg = { r1: a.r, c1: a.c, r2: a.r, c2: a.c };
      let fin = t.i + t.txt.length;
      const s1 = toks[k + 1], s2 = toks[k + 2];
      if (s1 && s1.txt === ':' && s2 && s2.tipo === 'celda') {
        const b = parseCelda(s2.txt);
        rg = { r1: Math.min(a.r, b.r), c1: Math.min(a.c, b.c), r2: Math.max(a.r, b.r), c2: Math.max(a.c, b.c) };
        fin = s2.i + s2.txt.length;
        k += 2;
      }
      out.push({ hoja, inicio, fin, ...rg, texto: f.slice(inicio, fin) });
    }
    return out;
  }

  /* Normaliza una fórmula escrita: mayúsculas en referencias y nombres de función */
  function normalizarFormula(f) {
    let out = '';
    const toks = [];
    recorrerFormula(f, (t) => toks.push(t));
    toks.forEach((t, k) => {
      if (t.tipo === 'celda' || t.tipo === 'cols') out += t.txt.toUpperCase();
      else if (t.tipo === 'id' && toks[k + 1] && toks[k + 1].txt === '(') out += t.txt.toUpperCase();
      else if (t.tipo === 'id' && /^(verdadero|falso)$/i.test(t.txt)) out += t.txt.toUpperCase();
      else out += t.txt;
    });
    return out;
  }

  /* Alterna el anclaje ($) de la referencia que está en la posición del cursor (tecla F4) */
  function alternarAnclaje(f, pos) {
    const refs = [];
    recorrerFormula(f, (t) => { if (t.tipo === 'celda') refs.push(t); });
    // referencia que contiene el cursor o la inmediatamente anterior
    let objetivo = null;
    for (const t of refs) {
      if (pos >= t.i && pos <= t.i + t.txt.length) objetivo = t;
    }
    if (!objetivo) {
      for (const t of refs) if (t.i + t.txt.length <= pos) objetivo = t;
    }
    if (!objetivo) return null;
    // si forma parte de un rango A1:B2, se alternan ambos extremos
    const grupo = [objetivo];
    const idx = refs.indexOf(objetivo);
    const sig = refs[idx + 1], ant = refs[idx - 1];
    if (sig && f[objetivo.i + objetivo.txt.length] === ':' && sig.i === objetivo.i + objetivo.txt.length + 1) grupo.push(sig);
    else if (ant && f[ant.i + ant.txt.length] === ':' && objetivo.i === ant.i + ant.txt.length + 1) grupo.unshift(ant);
    const ciclo = (m) => {
      const [, c$, col, r$, fila] = m;
      if (!c$ && !r$) return '$' + col + '$' + fila;
      if (c$ && r$) return col + '$' + fila;
      if (!c$ && r$) return '$' + col + fila;
      return col + fila;
    };
    let nuevo = f, delta = 0;
    for (const t of grupo) {
      const rep = ciclo(t.m);
      nuevo = nuevo.slice(0, t.i + delta) + rep + nuevo.slice(t.i + delta + t.txt.length);
      delta += rep.length - t.txt.length;
    }
    const ultimo = grupo[grupo.length - 1];
    return { texto: nuevo, cursor: ultimo.i + ultimo.txt.length + delta };
  }

  LT.refs = { colLetra, colIndice, dir, parseCelda, parseRango, textoRango, celdasDe, recorrerFormula, desplazarFormula, referenciasEn, normalizarFormula, alternarAnclaje };

  /* -------------------------------------------------------- Interfaz */
  function toast(msg, tipo) {
    let cont = $('.toasts');
    if (!cont) { cont = h('div', { class: 'toasts', role: 'status', 'aria-live': 'polite' }); document.body.appendChild(cont); }
    const t = h('div', { class: 'toast ' + (tipo || '') }, msg);
    cont.appendChild(t);
    setTimeout(() => t.classList.add('sale'), 3200);
    setTimeout(() => t.remove(), 3700);
  }

  /* Ventana modal sencilla. botones: [{texto, valor, primario}] -> Promise(valor) */
  function modal(opts) {
    return new Promise((resolver) => {
      const anterior = document.activeElement;
      const fondo = h('div', { class: 'modal-fondo' });
      const caja = h('div', { class: 'modal ' + (opts.clase || ''), role: 'dialog', 'aria-modal': 'true', 'aria-label': opts.titulo || 'Diálogo' });
      const cerrar = (v) => {
        fondo.remove();
        document.removeEventListener('keydown', teclas, true);
        if (anterior && anterior.focus) anterior.focus();
        resolver(v);
      };
      const teclas = (e) => {
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); cerrar(null); }
        if (e.key === 'Enter' && opts.enterAcepta !== false && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'BUTTON') {
          const prim = (opts.botones || []).find((b) => b.primario);
          if (prim) { e.preventDefault(); e.stopPropagation(); cerrar(typeof prim.valor === 'function' ? prim.valor() : prim.valor); }
        }
      };
      if (opts.titulo) caja.appendChild(h('div', { class: 'modal-titulo' }, opts.titulo, h('button', { class: 'modal-x', 'aria-label': 'Cerrar', onclick: () => cerrar(null) }, '×')));
      const cuerpo = h('div', { class: 'modal-cuerpo' });
      if (typeof opts.cuerpo === 'string') cuerpo.innerHTML = opts.cuerpo;
      else if (opts.cuerpo) cuerpo.appendChild(opts.cuerpo);
      caja.appendChild(cuerpo);
      const pie = h('div', { class: 'modal-pie' });
      for (const b of opts.botones || [{ texto: 'Aceptar', valor: true, primario: true }]) {
        pie.appendChild(h('button', { class: 'btn ' + (b.primario ? 'primario' : ''), onclick: () => cerrar(typeof b.valor === 'function' ? b.valor() : b.valor) }, b.texto));
      }
      caja.appendChild(pie);
      fondo.appendChild(caja);
      fondo.addEventListener('mousedown', (e) => { if (e.target === fondo && opts.cerrarFuera !== false) cerrar(null); });
      document.body.appendChild(fondo);
      document.addEventListener('keydown', teclas, true);
      const foco = caja.querySelector('input,select,textarea') || pie.querySelector('.primario') || pie.querySelector('button');
      if (foco) setTimeout(() => foco.focus(), 30);
      if (opts.alAbrir) opts.alAbrir(caja, cerrar);
    });
  }
  function aviso(titulo, texto) {
    return modal({ titulo, cuerpo: h('p', null, texto), botones: [{ texto: 'Aceptar', valor: true, primario: true }] });
  }

  LT.ui = { toast, modal, aviso };

  /* ---------------------------------------------------------- Progreso */
  const CLAVE = 'pptSalud.progreso.v1';
  function vacio() {
    return { version: 2, participante: { nombre: '', grupo: '' }, modulos: {}, ubicacion: {}, integradores: {}, creado: new Date().toISOString() };
  }
  let cache = null;
  function cargar() {
    if (cache) return cache;
    try { cache = JSON.parse(localStorage.getItem(CLAVE)) || vacio(); } catch (e) { cache = vacio(); }
    if (!cache.modulos) cache.modulos = {};
    if (!cache.ubicacion) cache.ubicacion = {};
    if (!cache.integradores) cache.integradores = {};
    return cache;
  }
  function guardar() {
    try { localStorage.setItem(CLAVE, JSON.stringify(cache)); } catch (e) { /* almacenamiento no disponible */ }
    document.dispatchEvent(new CustomEvent('lt-progreso'));
  }
  function modulo(id) {
    const p = cargar();
    if (!p.modulos[id]) p.modulos[id] = { ejemplo: false, micro: {}, reto: null, lab: null, donde: false, intentos: 0 };
    return p.modulos[id];
  }
  function actualizarModulo(id, fn) {
    const m = modulo(id);
    fn(m);
    m.actualizado = new Date().toISOString();
    guardar();
  }
  function estadoModulo(id) {
    const m = cargar().modulos[id];
    if (!m) return { reto: false, lab: false, superado: false, avance: 0 };
    const def = LT.CURSO && LT.CURSO.modulo(id);
    const nMicro = def ? def.micro : 3;
    const microOk = Object.values(m.micro || {}).filter(Boolean).length;
    const reto = !!(m.reto && m.reto.ok);
    const lab = !!(m.lab && m.lab.ok);
    const partes = [m.ejemplo ? 1 : 0, Math.min(1, microOk / Math.max(1, nMicro)), reto ? 1 : 0, lab ? 1 : 0, m.donde ? 1 : 0];
    const avance = (partes[0] * 10 + partes[1] * 20 + partes[2] * 35 + partes[3] * 25 + partes[4] * 10);
    return { reto, lab, superado: reto, estrella: reto && lab, avance: Math.round(avance), nivelReto: m.reto && m.reto.nivel };
  }
  function participante(datos) {
    const p = cargar();
    if (datos) { Object.assign(p.participante, datos); guardar(); }
    return p.participante;
  }
  function reiniciar() { cache = vacio(); guardar(); }

  /* Huella sencilla para detectar ediciones manuales del reporte */
  function huella(txt) {
    let h1 = 0x811c9dc5;
    for (let i = 0; i < txt.length; i++) { h1 ^= txt.charCodeAt(i); h1 = Math.imul(h1, 16777619) >>> 0; }
    return h1.toString(16).padStart(8, '0');
  }
  function reporte() {
    const p = cargar();
    const datos = JSON.stringify({ ...p, exportado: new Date().toISOString() });
    return JSON.stringify({ tipo: 'reporte-powerpoint-salud', version: 1, datos, huella: huella(datos + 'powerpoint-salud') }, null, 1);
  }
  function leerReporte(texto) {
    const obj = JSON.parse(texto);
    if (obj.tipo !== 'reporte-powerpoint-salud') throw new Error('No es un reporte de la plataforma.');
    const integro = huella(obj.datos + 'powerpoint-salud') === obj.huella;
    return { datos: JSON.parse(obj.datos), integro };
  }
  function importar(texto) {
    const r = leerReporte(texto);
    cache = r.datos;
    guardar();
    return r;
  }

  LT.progreso = { cargar, guardar, modulo, actualizarModulo, estadoModulo, participante, reiniciar, reporte, leerReporte, importar };

  /* ------------------------------------------------------ Fechas */
  const BASE = Date.UTC(1899, 11, 30);
  LT.fechas = {
    aSerial(y, m, d) { return Math.round((Date.UTC(y, m - 1, d) - BASE) / 86400000); },
    deISO(iso) { const [y, m, d] = iso.split('-').map(Number); return LT.fechas.aSerial(y, m, d); },
    deSerial(n) { const d = new Date(BASE + Math.floor(n) * 86400000); return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(), dow: d.getUTCDay() }; },
    texto(n) { const f = LT.fechas.deSerial(n); return String(f.d).padStart(2, '0') + '/' + String(f.m).padStart(2, '0') + '/' + f.y; },
  };
})();

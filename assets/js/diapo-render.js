/* Dibujo de diapositivas del simulador (editor, miniaturas, presentación y vista del moderador).
   Una diapositiva es un div de 960 × 540 unidades que se escala con transform. */
(function () {
  'use strict';
  const LT = window.LT;
  const { h, esc } = LT.u;
  const K = LT.DIAPO;

  const PILAS = {
    'Calibri': 'Calibri, Carlito, "Segoe UI", Arial, sans-serif',
    'Calibri Light': '"Calibri Light", Calibri, Carlito, "Segoe UI Light", "Segoe UI", Arial, sans-serif',
    'Arial': 'Arial, "Helvetica Neue", Helvetica, sans-serif',
    'Segoe UI': '"Segoe UI", system-ui, -apple-system, Roboto, Arial, sans-serif',
    'Segoe UI Semibold': '"Segoe UI Semibold", "Segoe UI", system-ui, Arial, sans-serif',
    'Segoe UI Black': '"Segoe UI Black", "Arial Black", "Segoe UI", sans-serif',
    'Georgia': 'Georgia, "Times New Roman", serif',
    'Times New Roman': '"Times New Roman", Times, serif',
    'Trebuchet MS': '"Trebuchet MS", "Segoe UI", Arial, sans-serif',
    'Verdana': 'Verdana, Geneva, sans-serif',
    'Comic Sans MS': '"Comic Sans MS", "Comic Neue", "Chalkboard SE", cursive',
    'Brush Script MT': '"Brush Script MT", "Segoe Script", cursive',
    'Impact': 'Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif',
    'Courier New': '"Courier New", Courier, monospace',
  };
  const FUENTES = Object.keys(PILAS);
  const PESO = { 'Segoe UI Semibold': 600, 'Segoe UI Black': 900, 'Calibri Light': 300 };

  /* ------------------------------------------------------------- tema y color */
  function variante(p) { const t = K.tema(p.tema); return t.variantes[p.variante || 0] || t.variantes[0]; }
  function color(p, c) {
    if (!c) return null;
    if (c[0] === '#') return c;
    const v = variante(p);
    const k = String(c).replace(/^tema:/, '');
    if (/^acento[1-6]$/.test(k)) return v.acentos[+k.slice(6) - 1];
    if (k === 'blanco') return '#ffffff';
    if (k === 'contraAcento') return '#ffffff';
    return v[k] || c;
  }
  function fuente(p, f) {
    const t = K.tema(p.tema);
    if (!f || f === 'tema:cuerpo') return t.fuentes.cuerpo;
    if (f === 'tema:titulo') return t.fuentes.titulo;
    return f;
  }
  function pila(f) { return PILAS[f] || ('"' + f + '", ' + PILAS['Segoe UI']); }
  function fondoDiapo(p, d) { return color(p, d.fondo) || variante(p).fondo; }

  /* Marcador de posición del diseño para un rol */
  function marcador(d, ph) { return ph ? (K.diseno(d.diseno).ph.find((x) => x.ph === ph) || null) : null; }

  /* Estilo efectivo de texto de un objeto (lo que hereda del tema y del diseño más lo propio) */
  function estilo(p, d, o) {
    const m = marcador(d, o.ph);
    const esForma = o.tipo === 'forma';
    const base = {
      fuente: m && m.ph === 'titulo' ? 'tema:titulo' : 'tema:cuerpo',
      tam: m ? m.tam : (esForma ? 18 : 18),
      color: esForma ? 'tema:contraAcento' : m && m.ph === 'titulo' ? 'tema:titulo' : m && m.color ? 'tema:' + m.color : 'tema:texto',
      negrita: !!(m && m.negrita), cursiva: false, subrayado: false,
      alinear: esForma ? 'centro' : (m && m.alinear) || 'izquierda',
      valign: esForma ? 'medio' : (m && m.valign) || 'arriba',
      vinetas: !!(m && m.vinetas),
    };
    const e = Object.assign(base, o.estilo || {});
    e.fuenteReal = fuente(p, e.fuente);
    e.colorReal = color(p, e.color) || '#000000';
    return e;
  }

  /* Fondo real detrás de un objeto (para medir contraste) */
  function fondoDetras(p, d, o) {
    if ((o.tipo === 'forma' || o.tipo === 'texto') && o.relleno) return color(p, o.relleno);
    if (o.tipo === 'forma') return color(p, o.relleno || 'tema:acento1');
    // ¿hay una forma rellena debajo que lo cubra por completo?
    const i = d.objetos.indexOf(o);
    for (let k = i - 1; k >= 0; k--) {
      const b = d.objetos[k];
      if ((b.tipo === 'forma' || (b.tipo === 'texto' && b.relleno)) && b.x <= o.x + 2 && b.y <= o.y + 2 && b.x + b.w >= o.x + o.w - 2 && b.y + b.h >= o.y + o.h - 2) return color(p, b.relleno || 'tema:acento1');
    }
    for (const r of K.tema(p.tema).deco(variante(p), d.diseno)) {
      if (!r.forma && r.x <= o.x && r.y <= o.y && r.x + r.w >= o.x + o.w && r.y + r.h >= o.y + o.h) return r.color;
    }
    return fondoDiapo(p, d);
  }
  function contrasteDe(p, d, o) { return K.contraste(estilo(p, d, o).colorReal, fondoDetras(p, d, o)); }

  /* Texto: párrafos («\n»); los que empiezan con tabulador o dos espacios son de segundo nivel */
  function parrafos(txt) {
    return String(txt || '').split('\n').map((l) => ({ nivel: /^(\t| {2})/.test(l) ? 2 : 1, texto: l.replace(/^(\t| {2})+/, '') }));
  }
  function bloqueTexto(p, d, o, opts) {
    const e = estilo(p, d, o);
    const vacio = !String(o.texto || '').trim();
    const cont = h('div', { class: 'dp-texto va-' + e.valign, style: { fontFamily: pila(e.fuenteReal), fontWeight: e.negrita ? 700 : (PESO[e.fuenteReal] || 400), fontStyle: e.cursiva ? 'italic' : 'normal', textDecoration: e.subrayado ? 'underline' : 'none', color: e.colorReal, fontSize: e.tam + 'px', textAlign: { izquierda: 'left', centro: 'center', derecha: 'right', justificar: 'justify' }[e.alinear] || 'left' } });
    if (vacio) {
      if (opts.modo === 'editor' && o.ph) cont.appendChild(h('div', { class: 'dp-indicacion' }, K.IND[o.ph.replace(/\d$/, '')] || K.IND.texto));
      return cont;
    }
    const interior = h('div', { class: 'dp-texto-in' });
    for (const par of parrafos(o.texto)) {
      const pe = h('p', { class: (e.vinetas ? 'vineta' : '') + (par.nivel === 2 ? ' n2' : '') }, par.texto || ' ');
      if (e.vinetas) pe.style.setProperty('--color-vineta', color(p, 'tema:acento1'));
      if (par.nivel === 2) pe.style.fontSize = Math.round(e.tam * 0.85) + 'px';
      interior.appendChild(pe);
    }
    cont.appendChild(interior);
    return cont;
  }

  /* ------------------------------------------------------------------ objetos */
  function cajaObjeto(o, extra) {
    return h('div', Object.assign({ class: 'dp-obj dp-' + o.tipo + (o.vinculo ? ' con-vinculo' : ''), 'data-id': o.id, style: { left: o.x + 'px', top: o.y + 'px', width: o.w + 'px', height: o.h + 'px' } }, extra || {}));
  }
  const NS = 'http://www.w3.org/2000/svg';
  function svgEl(tag, attrs) { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs || {})) if (v != null) e.setAttribute(k, v); return e; }

  function objeto(p, d, o, opts) {
    opts = opts || {};
    const el = cajaObjeto(o);
    switch (o.tipo) {
      case 'texto': {
        if (o.relleno) el.style.background = color(p, o.relleno);
        if (o.borde) el.style.boxShadow = 'inset 0 0 0 2px ' + color(p, o.borde);
        if (o.ph && opts.modo === 'editor' && !String(o.texto || '').trim()) el.classList.add('ph-vacio');
        el.appendChild(bloqueTexto(p, d, o, opts));
        break;
      }
      case 'forma': {
        const svg = svgEl('svg', { viewBox: '-2 -2 ' + (o.w + 4) + ' ' + (o.h + 4), width: '100%', height: '100%', preserveAspectRatio: 'none', class: 'dp-forma-svg' });
        svg.appendChild(svgEl('path', { d: K.rutaForma(o.forma, o.w, o.h), fill: color(p, o.relleno || 'tema:acento1'), stroke: o.borde ? color(p, o.borde) : 'none', 'stroke-width': o.borde ? 2 : 0 }));
        el.appendChild(svg);
        if (String(o.texto || '').trim()) el.appendChild(bloqueTexto(p, d, o, opts));
        break;
      }
      case 'imagen': {
        const img = K.imagen(o.src);
        const ratioNat = img ? img.ancho / img.alto : 4 / 3;
        const esperado = o.recorte && o.recorte.ratio ? o.recorte.ratio : ratioNat;
        const im = h('img', { src: img ? img.src : '', alt: o.decorativo ? '' : (o.alt || ''), draggable: 'false', style: { objectFit: o.recorte ? 'cover' : 'fill' } });
        const marco = h('div', { class: 'dp-img-marco' + (o.recorte && o.recorte.forma ? ' forma-' + o.recorte.forma : '') }, im);
        if (o.borde) marco.style.boxShadow = '0 0 0 3px ' + color(p, o.borde);
        if (o.sombra) marco.style.filter = 'drop-shadow(0 6px 10px rgba(0,0,0,.28))';
        el.appendChild(marco);
        el.dataset.deformada = Math.abs((o.w / o.h) / esperado - 1) > 0.04 ? '1' : '0';
        break;
      }
      case 'icono': {
        el.innerHTML = K.iconoSVG(o.icono, color(p, o.color || 'tema:acento1'), o.grosor);
        if (o.relleno) { el.style.background = color(p, o.relleno); el.style.borderRadius = '50%'; el.style.padding = Math.round(o.w * 0.16) + 'px'; }
        break;
      }
      case 'smartart': el.appendChild(smartart(p, d, o)); break;
      case 'tabla': el.appendChild(tabla(p, d, o)); break;
      case 'grafico': {
        const c = h('div', { class: 'dp-graf' });
        el.appendChild(c);
        const v = variante(p);
        const datos = o.datos || {};
        const dibujar = () => LT.graficos.dibujar(c, { ancho: Math.round(o.w), alto: Math.round(o.h), tipo: o.subtipo || 'columnas', categorias: datos.categorias || [], series: datos.series || [], titulo: o.mostrarTitulo === false ? '' : (o.titulo || ''), leyenda: o.leyenda !== false, etiquetas: !!o.etiquetas, formato: datos.formato, ejeY: o.ejeY || '', colores: v.acentos, fondo: 'none', colorTexto: v.texto, colorTexto2: v.texto2 });
        try { dibujar(); } catch (e) { c.textContent = 'Gráfico'; }
        if (opts.modo === 'mini') c.querySelectorAll('.graf-tip').forEach((t) => t.remove());
        break;
      }
      case 'video': {
        const m = LT.DIAPO.MEDIOS.video.find((x) => x.id === o.src) || LT.DIAPO.MEDIOS.video[0];
        const poster = LT.pagina ? LT.pagina.url('assets/media/' + m.poster) : '';
        if (opts.modo === 'show') {
          const v = h('video', { src: LT.pagina.url('assets/media/' + m.archivo), poster, playsinline: true, preload: 'metadata', 'aria-label': o.alt || m.nombre });
          v.muted = !!opts.silencio;
          if ((o.opciones || {}).repetir) v.loop = true;
          el.appendChild(v);
          el.appendChild(h('div', { class: 'dp-play', 'aria-hidden': 'true' }, '▶'));
        } else {
          el.appendChild(h('div', { class: 'dp-video-poster', style: { backgroundImage: 'url("' + poster + '")' } }, h('div', { class: 'dp-play' }, '▶'), h('div', { class: 'dp-video-barra' }, h('span'), m.nombre.replace(/^Video: /, ''))));
        }
        break;
      }
      case 'audio': {
        el.innerHTML = '<svg viewBox="0 0 48 48" width="100%" height="100%"><path d="M8 18h8l11-9v30l-11-9H8z" fill="' + color(p, 'tema:acento1') + '"/><path d="M32 17a10 10 0 0 1 0 14M36 12a17 17 0 0 1 0 24" stroke="' + color(p, 'tema:acento1') + '" stroke-width="3" fill="none" stroke-linecap="round"/></svg>';
        break;
      }
      default: break;
    }
    if (o.alt && o.tipo !== 'imagen') el.setAttribute('aria-label', o.alt);
    return el;
  }

  /* ---------------------------------------------------------------- SmartArt */
  function smartart(p, d, o) {
    const cont = h('div', { class: 'dp-smart' });
    const items = (o.elementos || []).filter((x) => String(x).trim());
    const n = Math.max(1, items.length);
    const v = variante(p);
    const W = o.w, H = o.h;
    const col = (i) => o.colores === 'multicolor' ? v.acentos[i % 6] : color(p, o.relleno || 'tema:acento1');
    const tam = (o.estilo && o.estilo.tam) || Math.max(12, Math.min(24, Math.round(Math.min(W / n / 5.5, H / 5))));
    const fuenteCss = pila(fuente(p, (o.estilo && o.estilo.fuente) || 'tema:cuerpo'));
    const caja = (x, y, w, hh, txt, i, forma) => {
      const b = h('div', { class: 'dp-smart-caja' + (forma ? ' ' + forma : ''), style: { left: x + 'px', top: y + 'px', width: w + 'px', height: hh + 'px', background: col(i), fontSize: tam + 'px', fontFamily: fuenteCss } }, h('span', null, txt));
      cont.appendChild(b);
      return b;
    };
    const svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, width: '100%', height: '100%', class: 'dp-smart-svg' });
    const flecha = (x1, y1, x2, y2) => {
      const a = Math.atan2(y2 - y1, x2 - x1), L = Math.hypot(x2 - x1, y2 - y1);
      const g = svgEl('g', { transform: 'translate(' + x1 + ' ' + y1 + ') rotate(' + (a * 180 / Math.PI) + ')' });
      const t = Math.min(16, L * 0.45);
      g.appendChild(svgEl('path', { d: 'M0 -' + t * 0.35 + 'H' + (L - t) + 'V-' + t * 0.75 + 'L' + L + ' 0L' + (L - t) + ' ' + t * 0.75 + 'V' + t * 0.35 + 'H0Z', fill: color(p, 'tema:acento1'), opacity: 0.45 }));
      svg.appendChild(g);
    };
    const tipo = o.diseno;
    if (tipo === 'procesoBasico' || tipo === 'procesoCheuron') {
      const gap = tipo === 'procesoBasico' ? Math.min(46, W / n * 0.25) : -W / n * 0.08;
      const w = (W - gap * (n - 1)) / n, hh = Math.min(H, w * 0.62);
      items.forEach((t, i) => {
        const x = i * (w + gap), y = (H - hh) / 2;
        caja(x, y, w, hh, t, i, tipo === 'procesoCheuron' ? 'cheuron' : '');
        if (tipo === 'procesoBasico' && i < n - 1) flecha(x + w + gap * 0.18, H / 2, x + w + gap * 0.82, H / 2);
      });
    } else if (tipo === 'cicloBasico' || tipo === 'cicloContinuo') {
      const R = Math.min(W, H) / 2 - Math.min(W, H) * 0.16, cx = W / 2, cy = H / 2;
      const s = Math.min(Math.min(W, H) * 0.3, 2 * R * Math.sin(Math.PI / n) * 0.9);
      if (tipo === 'cicloContinuo') svg.appendChild(svgEl('circle', { cx, cy, r: R, fill: 'none', stroke: color(p, 'tema:acento1'), 'stroke-width': Math.max(6, s * 0.12), opacity: 0.35 }));
      items.forEach((t, i) => {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
        caja(cx + R * Math.cos(a) - s / 2, cy + R * Math.sin(a) - s / 2, s, s, t, i, 'circulo');
        if (tipo === 'cicloBasico') {
          const a1 = a + (Math.PI / n) * 0.55, a2 = a + (2 * Math.PI / n) - (Math.PI / n) * 0.55;
          const m = (a1 + a2) / 2;
          flecha(cx + R * Math.cos(a1), cy + R * Math.sin(a1), cx + R * Math.cos(m) + (R * Math.cos(a2) - R * Math.cos(a1)) * 0.25, cy + R * Math.sin(m) + (R * Math.sin(a2) - R * Math.sin(a1)) * 0.25);
        }
      });
    } else if (tipo === 'organigrama' || tipo === 'jerarquia') {
      const arriba = items[0] || '', resto = items.slice(1);
      const m = Math.max(1, resto.length);
      const hh = Math.min(H * 0.32, 90), gap = 18;
      const w = Math.min(220, (W - gap * (m - 1)) / m);
      const x0 = (W - (w * m + gap * (m - 1))) / 2;
      caja((W - Math.min(260, W * 0.4)) / 2, 0, Math.min(260, W * 0.4), hh, arriba, 0, tipo === 'jerarquia' ? 'redondeada' : '');
      const yb = H - hh;
      const ln = (x1, y1, x2, y2) => svg.appendChild(svgEl('path', { d: 'M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2, stroke: color(p, 'tema:texto2'), 'stroke-width': 2, fill: 'none' }));
      if (resto.length) { ln(W / 2, hh, W / 2, (hh + yb) / 2); ln(x0 + w / 2, (hh + yb) / 2, x0 + (m - 1) * (w + gap) + w / 2, (hh + yb) / 2); }
      resto.forEach((t, i) => { const x = x0 + i * (w + gap); ln(x + w / 2, (hh + yb) / 2, x + w / 2, yb); caja(x, yb, w, hh, t, i + 1, tipo === 'jerarquia' ? 'redondeada' : ''); });
    } else if (tipo === 'venn') {
      const r = Math.min(H / 2, W / (n + 1)) * 0.95, cx = W / 2, cy = H / 2;
      items.forEach((t, i) => {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / n, dd = n > 1 ? r * 0.55 : 0;
        const b = caja(cx + dd * Math.cos(a) - r, cy + dd * Math.sin(a) - r, 2 * r, 2 * r, t, i, 'circulo venn');
        b.style.opacity = 0.72;
      });
    } else if (tipo === 'piramide') {
      const hh = H / n;
      items.forEach((t, i) => {
        const w1 = W * (i / n), w2 = W * ((i + 1) / n);
        const b = caja((W - w2) / 2, i * hh, w2, hh - 3, t, i, 'trapecio');
        b.style.clipPath = 'polygon(' + ((w2 - w1) / 2 / w2 * 100) + '% 0,' + (100 - (w2 - w1) / 2 / w2 * 100) + '% 0,100% 100%,0 100%)';
      });
    } else if (tipo === 'listaVertical') {
      const gap = 8, hh = (H - gap * (n - 1)) / n;
      items.forEach((t, i) => caja(0, i * (hh + gap), W, hh, t, i, 'barra'));
    } else { // listaBloques
      const cols = n <= 3 ? n : Math.ceil(n / 2), filas = Math.ceil(n / cols), gap = 12;
      const w = (W - gap * (cols - 1)) / cols, hh = (H - gap * (filas - 1)) / filas;
      items.forEach((t, i) => caja((i % cols) * (w + gap), Math.floor(i / cols) * (hh + gap), w, hh, t, i));
    }
    cont.insertBefore(svg, cont.firstChild);
    return cont;
  }

  /* -------------------------------------------------------------------- tabla */
  function tabla(p, d, o) {
    const v = variante(p);
    const a1 = color(p, o.relleno || 'tema:acento1');
    const tam = (o.estilo && o.estilo.tam) || 16;
    const t = h('table', { class: 'dp-tabla', style: { fontSize: tam + 'px', fontFamily: pila(fuente(p, 'tema:cuerpo')), color: v.texto } });
    (o.filas || []).forEach((fila, r) => {
      const tr = h('tr');
      fila.forEach((c) => {
        const enc = r === 0 && o.encabezado !== false;
        const td = h(enc ? 'th' : 'td', null, String(c == null ? '' : c));
        if (enc) { td.style.background = a1; td.style.color = '#fff'; }
        else if (o.bandas !== false && r % 2 === 1) td.style.background = mezclar(a1, v.fondo, 0.18);
        else td.style.background = mezclar(a1, v.fondo, 0.07);
        tr.appendChild(td);
      });
      t.appendChild(tr);
    });
    return h('div', { class: 'dp-tabla-cont' }, t);
  }
  function mezclar(a, b, k) {
    const A = K.hexRgb(a) || [0, 0, 0], B = K.hexRgb(b) || [255, 255, 255];
    return '#' + A.map((x, i) => Math.round(x * k + B[i] * (1 - k)).toString(16).padStart(2, '0')).join('');
  }

  /* --------------------------------------------------------------- diapositiva */
  // opts: { modo: 'editor'|'mini'|'show', silencio }
  function diapositiva(p, d, opts) {
    opts = opts || {};
    const v = variante(p);
    const t = K.tema(p.tema);
    const raiz = h('div', { class: 'dp-diapo modo-' + (opts.modo || 'editor'), 'data-diapo': d.id, style: { background: fondoDiapo(p, d), color: v.texto, fontFamily: pila(t.fuentes.cuerpo) } });
    for (const r of t.deco(v, d.diseno)) raiz.appendChild(h('div', { class: 'dp-deco', 'aria-hidden': 'true', style: { left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px', background: r.color, opacity: r.opacidad == null ? 1 : r.opacidad, borderRadius: r.forma === 'elipse' ? '50%' : '0' } }));
    for (const o of d.objetos) {
      if (opts.modo === 'show' && o.ph && !String(o.texto || '').trim() && o.tipo === 'texto') continue;
      if (opts.modo === 'show' && o.tipo === 'audio' && (o.opciones || {}).ocultar) continue;
      raiz.appendChild(objeto(p, d, o, opts));
    }
    return raiz;
  }
  /* Diapositiva escalada dentro de un marco del ancho dado */
  function escalada(p, d, ancho, opts) {
    const marco = h('div', { class: 'dp-marco', style: { width: ancho + 'px', height: Math.round(ancho * K.ALTO / K.ANCHO) + 'px' } });
    const s = diapositiva(p, d, opts);
    s.style.transform = 'scale(' + (ancho / K.ANCHO) + ')';
    marco.appendChild(s);
    return marco;
  }

  /* ------------------------------------------------------ secuencia de animación */
  // Agrupa las animaciones de una diapositiva en pasos (cada «Al hacer clic» abre un paso) y calcula
  // el inicio de cada efecto dentro de su paso, en segundos.
  function pasos(d) {
    const out = [];
    let actual = null;
    (d.animaciones || []).forEach((a, i) => {
      const dur = a.duracion == null ? (K.animacion(a.efecto) || {}).dur || 0.5 : a.duracion;
      const ret = a.retraso || 0;
      if (!actual || a.inicio === 'clic') { actual = { auto: !out.length && a.inicio !== 'clic', items: [], fin: 0 }; out.push(actual); }
      const previo = actual.items[actual.items.length - 1];
      // «Con la anterior» arranca cuando arrancó la anterior; «Después de la anterior», cuando termina el paso
      let ini;
      if (!previo) ini = ret;
      else if (a.inicio === 'con') ini = previo.ini - previo.ret + ret;
      else ini = actual.fin + ret;
      const it = { anim: a, indice: i, ini, dur, ret, fin: ini + dur };
      actual.items.push(it);
      actual.fin = Math.max(actual.fin, it.fin);
    });
    return out;
  }
  /* Número de clic que muestra el panel de animación para cada animación (0 = automática) */
  function numerosClic(d) {
    const m = {};
    let n = 0;
    pasos(d).forEach((g) => { if (!g.auto) n++; g.items.forEach((it) => { m[it.anim.id] = g.auto ? 0 : n; }); });
    return m;
  }

  /* Texto visible de una diapositiva y título */
  function tituloDe(d) { const t = d.objetos.find((o) => o.ph === 'titulo'); return t ? String(t.texto || '').trim() : ''; }
  function textoDe(d) { return d.objetos.map((o) => [o.texto || '', (o.elementos || []).join(' ')].join(' ')).join(' ').replace(/\s+/g, ' ').trim(); }

  LT.DiapoRender = { PILAS, FUENTES, variante, color, fuente, pila, estilo, fondoDetras, contrasteDe, parrafos, objeto, diapositiva, escalada, pasos, numerosClic, tituloDe, textoDe, marcador, mezclar, fondoDiapo };
})();

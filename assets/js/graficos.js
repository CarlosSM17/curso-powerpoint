/* Gráficos en SVG para el simulador (módulos 6 y 14) y minigráficos.
   Paleta categórica validada (orden fijo, nunca cíclico), marcas delgadas,
   leyenda con 2 o más series y tooltips al pasar el cursor. */
(function () {
  'use strict';
  const LT = window.LT;
  const { h } = LT.u;
  const NS = 'http://www.w3.org/2000/svg';
  const SERIES = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'];
  const TXT0 = '#2a211c', TXT20 = '#5d5148', REJILLA = '#e8e2da', EJE = '#b9ada0', SUPERFICIE0 = '#ffffff';
  let TXT = TXT0, TXT2 = TXT20, SUPERFICIE = SUPERFICIE0;

  function el(tag, attrs, texto) {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs || {})) if (v != null) e.setAttribute(k, v);
    if (texto != null) e.textContent = texto;
    return e;
  }
  function pasoBonito(rango, n) {
    const bruto = rango / Math.max(1, n);
    const mag = Math.pow(10, Math.floor(Math.log10(bruto || 1)));
    const f = bruto / mag;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * mag;
  }
  function escala(min, max) {
    min = Math.min(0, min); max = Math.max(0, max);
    if (min === max) max = min + 1;
    const paso = pasoBonito(max - min, 5);
    const a = Math.floor(min / paso) * paso, b = Math.ceil(max / paso) * paso;
    const ticks = [];
    for (let v = a; v <= b + paso / 2; v += paso) ticks.push(Math.round(v * 1e9) / 1e9);
    return { min: a, max: b, ticks };
  }
  const fmt = (v, f) => LT.formato.formatear(v, f || (Math.abs(v) >= 1000 ? '#,##0' : 'General')).texto;
  const corto = (v, f) => {
    if (f && /%/.test(f)) return fmt(v, f);
    const a = Math.abs(v);
    if (a >= 1e6) return (f && f.includes('$') ? '$' : '') + (v / 1e6).toFixed(1).replace(/\.0$/, '') + ' M';
    if (a >= 1e4) return (f && f.includes('$') ? '$' : '') + Math.round(v / 1000) + ' k';
    return fmt(v, f);
  };
  function recortar(t, n) { t = String(t); return t.length > n ? t.slice(0, n - 1) + '…' : t; }

  /* Barra con extremo redondeado (4 px) del lado del dato, anclada a la base */
  function barra(x, y, w, hh, horizontal, negativo) {
    const r = Math.min(4, (horizontal ? hh : w) / 2, (horizontal ? w : hh));
    if (r <= 0.5 || (horizontal ? w : hh) < 1) return 'M' + x + ' ' + y + 'h' + w + 'v' + hh + 'h' + -w + 'z';
    if (!horizontal && !negativo) return 'M' + x + ' ' + (y + hh) + 'V' + (y + r) + 'Q' + x + ' ' + y + ' ' + (x + r) + ' ' + y + 'H' + (x + w - r) + 'Q' + (x + w) + ' ' + y + ' ' + (x + w) + ' ' + (y + r) + 'V' + (y + hh) + 'z';
    if (!horizontal && negativo) return 'M' + x + ' ' + y + 'V' + (y + hh - r) + 'Q' + x + ' ' + (y + hh) + ' ' + (x + r) + ' ' + (y + hh) + 'H' + (x + w - r) + 'Q' + (x + w) + ' ' + (y + hh) + ' ' + (x + w) + ' ' + (y + hh - r) + 'V' + y + 'z';
    return 'M' + x + ' ' + y + 'H' + (x + w - r) + 'Q' + (x + w) + ' ' + y + ' ' + (x + w) + ' ' + (y + r) + 'V' + (y + hh - r) + 'Q' + (x + w) + ' ' + (y + hh) + ' ' + (x + w - r) + ' ' + (y + hh) + 'H' + x + 'z';
  }

  /* Dibuja un gráfico dentro de un contenedor (con tooltip). Devuelve el SVG. */
  function dibujar(cont, o) {
    const PAL = o.colores || SERIES;
    const TXT = o.colorTexto || TXT0, TXT2 = o.colorTexto2 || TXT20, SUPERFICIE = o.fondo || SUPERFICIE0;
    cont.innerHTML = '';
    cont.style.position = 'relative';
    const W = o.ancho || 640, H = o.alto || 340;
    const svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': (o.titulo || 'Gráfico') + '. ' + (o.series || []).map((s) => s.nombre).join(', ') });
    svg.appendChild(el('rect', { x: 0, y: 0, width: W, height: H, fill: SUPERFICIE }));
    const tip = h('div', { class: 'graf-tip', style: { position: 'absolute', pointerEvents: 'none', display: 'none', background: '#fff', border: '1px solid #d6c7b5', borderRadius: '8px', padding: '6px 9px', font: '12px var(--fuente)', boxShadow: '0 6px 18px rgba(0,0,0,.15)', zIndex: 5, whiteSpace: 'nowrap', color: TXT } });
    cont.append(svg, tip);
    const mostrarTip = (ev, html) => {
      tip.innerHTML = html;
      tip.style.display = 'block';
      const r = cont.getBoundingClientRect();
      let x = ev.clientX - r.left + 12, y = ev.clientY - r.top + 12;
      if (x + tip.offsetWidth > r.width) x = ev.clientX - r.left - tip.offsetWidth - 12;
      tip.style.left = x + 'px'; tip.style.top = y + 'px';
    };
    const ocultarTip = () => { tip.style.display = 'none'; };
    const series = (o.series || []).filter((s) => s && s.valores);
    const cats = o.categorias || [];
    let top = 14;
    if (o.titulo) { svg.appendChild(el('text', { x: W / 2, y: 24, 'text-anchor': 'middle', 'font-size': 16, 'font-weight': 600, fill: TXT }, recortar(o.titulo, 70))); top = 40; }
    const conLeyenda = series.length >= 2 && o.leyenda !== false || (o.tipo === 'circular' && o.leyenda !== false);
    if (!series.length || !cats.length) {
      svg.appendChild(el('text', { x: W / 2, y: H / 2, 'text-anchor': 'middle', 'font-size': 14, fill: TXT2 }, 'Elige datos para ver el gráfico'));
      return svg;
    }
    // leyenda arriba, en una fila
    if (conLeyenda) {
      const nombres = o.tipo === 'circular' ? cats : series.map((s) => s.nombre);
      let x = 0;
      const g = el('g');
      nombres.forEach((n, i) => {
        const t = recortar(n, 18);
        g.appendChild(el('rect', { x, y: top - 9, width: 10, height: 10, rx: 2, fill: PAL[i % PAL.length] }));
        g.appendChild(el('text', { x: x + 14, y: top, 'font-size': 12, fill: TXT2 }, t));
        x += 22 + t.length * 6.6;
      });
      const ancho = x;
      g.setAttribute('transform', 'translate(' + Math.max(8, (W - ancho) / 2) + ',0)');
      if (ancho > W - 16) g.setAttribute('transform', 'translate(8,0) scale(' + ((W - 16) / ancho).toFixed(3) + ')');
      svg.appendChild(g);
      top += 18;
    }
    if (o.tipo === 'circular') { dibujarCircular(svg, o, cats, series[0], W, H, top, mostrarTip, ocultarTip); return svg; }
    const horizontal = o.tipo === 'barras';
    const todos = series.flatMap((s) => s.valores.filter((v) => typeof v === 'number'));
    const sc = escala(Math.min(...todos), Math.max(...todos));
    const etiquetaMax = Math.max(...sc.ticks.map((t) => corto(t, o.formato).length));
    const catMax = Math.max(...cats.map((c) => String(c).length));
    const izq = horizontal ? Math.min(150, 14 + Math.min(catMax, 22) * 6.6) : 18 + etiquetaMax * 7 + (o.ejeY ? 16 : 0);
    const rotar = !horizontal && cats.length * Math.min(catMax, 14) * 6.6 > W - izq - 20;
    const abajo = horizontal ? 30 + (o.ejeX ? 16 : 0) : (rotar ? 16 + Math.min(catMax, 14) * 5 : 28) + (o.ejeX ? 18 : 0);
    const der = 18;
    const pw = W - izq - der, ph = H - top - abajo;
    const g = el('g', { transform: 'translate(' + izq + ',' + top + ')' });
    svg.appendChild(g);
    const val = (v) => (horizontal ? ((v - sc.min) / (sc.max - sc.min)) * pw : ph - ((v - sc.min) / (sc.max - sc.min)) * ph);
    // rejilla y eje de valores
    for (const t of sc.ticks) {
      const p = val(t);
      if (horizontal) {
        g.appendChild(el('line', { x1: p, x2: p, y1: 0, y2: ph, stroke: t === 0 ? EJE : REJILLA, 'stroke-width': 1 }));
        g.appendChild(el('text', { x: p, y: ph + 16, 'text-anchor': 'middle', 'font-size': 11, fill: TXT2 }, corto(t, o.formato)));
      } else {
        g.appendChild(el('line', { x1: 0, x2: pw, y1: p, y2: p, stroke: t === 0 ? EJE : REJILLA, 'stroke-width': 1 }));
        g.appendChild(el('text', { x: -8, y: p + 4, 'text-anchor': 'end', 'font-size': 11, fill: TXT2 }, corto(t, o.formato)));
      }
    }
    if (o.ejeY) svg.appendChild(el('text', { x: 14, y: top + ph / 2, 'text-anchor': 'middle', 'font-size': 12, fill: TXT2, transform: 'rotate(-90 14 ' + (top + ph / 2) + ')' }, o.ejeY));
    if (o.ejeX) svg.appendChild(el('text', { x: izq + pw / 2, y: H - 6, 'text-anchor': 'middle', 'font-size': 12, fill: TXT2 }, o.ejeX));
    const n = cats.length;
    const banda = (horizontal ? ph : pw) / n;
    // etiquetas de categoría
    cats.forEach((c, i) => {
      const centro = banda * (i + 0.5);
      if (horizontal) g.appendChild(el('text', { x: -8, y: centro + 4, 'text-anchor': 'end', 'font-size': 11.5, fill: TXT2 }, recortar(c, 22)));
      else if (rotar) g.appendChild(el('text', { x: centro, y: ph + 12, 'text-anchor': 'end', 'font-size': 11, fill: TXT2, transform: 'rotate(-40 ' + centro + ' ' + (ph + 12) + ')' }, recortar(c, 14)));
      else g.appendChild(el('text', { x: centro, y: ph + 17, 'text-anchor': 'middle', 'font-size': 11.5, fill: TXT2 }, recortar(c, 14)));
    });
    const base = val(Math.max(sc.min, 0));
    if (o.tipo === 'columnas' || o.tipo === 'barras') {
      const ns = series.length;
      const grupo = banda * 0.72;
      const ancho = Math.max(2, (grupo - (ns - 1) * 2) / ns);
      series.forEach((s, si) => {
        s.valores.forEach((v, i) => {
          if (typeof v !== 'number') return;
          const ini = banda * i + (banda - grupo) / 2 + si * (ancho + 2);
          const p = val(v);
          let d;
          if (horizontal) d = barra(Math.min(base, p), ini, Math.abs(p - base), ancho, true);
          else d = barra(ini, Math.min(base, p), ancho, Math.abs(p - base), false, v < 0);
          const marca = el('path', { d, fill: PAL[si % PAL.length] });
          g.appendChild(marca);
          // zona de captura mayor que la marca
          const zona = horizontal ? el('rect', { x: 0, y: ini - 1, width: pw, height: ancho + 2, fill: 'transparent' }) : el('rect', { x: ini - 1, y: 0, width: ancho + 2, height: ph, fill: 'transparent' });
          zona.addEventListener('mousemove', (ev) => { marca.setAttribute('opacity', '.8'); mostrarTip(ev, '<b>' + LT.u.esc(cats[i]) + '</b><br>' + (ns > 1 ? LT.u.esc(s.nombre) + ': ' : '') + LT.u.esc(fmt(v, o.formato))); });
          zona.addEventListener('mouseleave', () => { marca.removeAttribute('opacity'); ocultarTip(); });
          g.appendChild(zona);
          if (o.etiquetas) {
            if (horizontal) g.appendChild(el('text', { x: p + 4, y: ini + ancho / 2 + 4, 'font-size': 10.5, fill: TXT }, corto(v, o.formato)));
            else g.appendChild(el('text', { x: ini + ancho / 2, y: p - 4, 'text-anchor': 'middle', 'font-size': 10.5, fill: TXT }, corto(v, o.formato)));
          }
        });
      });
    } else {
      // líneas y área
      const x = (i) => banda * (i + 0.5);
      series.forEach((s, si) => {
        const color = PAL[si % PAL.length];
        const pts = s.valores.map((v, i) => (typeof v === 'number' ? [x(i), val(v)] : null)).filter(Boolean);
        if (!pts.length) return;
        const dLinea = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('');
        if (o.tipo === 'area') g.appendChild(el('path', { d: dLinea + 'L' + pts[pts.length - 1][0] + ' ' + base + 'L' + pts[0][0] + ' ' + base + 'z', fill: color, 'fill-opacity': series.length > 1 ? 0.18 : 0.25 }));
        g.appendChild(el('path', { d: dLinea, fill: 'none', stroke: color, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
        if (pts.length <= 24) pts.forEach((p) => g.appendChild(el('circle', { cx: p[0], cy: p[1], r: 4, fill: color, stroke: SUPERFICIE, 'stroke-width': 2 })));
        if (o.etiquetas) s.valores.forEach((v, i) => { if (typeof v === 'number') g.appendChild(el('text', { x: x(i), y: val(v) - 9, 'text-anchor': 'middle', 'font-size': 10.5, fill: TXT }, corto(v, o.formato))); });
        // etiqueta directa al final de la línea (hasta 4 series)
        if (series.length >= 2 && series.length <= 4) {
          const ult = pts[pts.length - 1];
          const t = el('text', { x: Math.min(ult[0] + 6, pw - 2), y: ult[1] - 8, 'font-size': 11, fill: TXT2, 'text-anchor': ult[0] + 60 > pw ? 'end' : 'start' }, recortar(s.nombre, 14));
          g.appendChild(t);
        }
      });
      // cruz y tooltip por categoría
      const guia = el('line', { y1: 0, y2: ph, stroke: EJE, 'stroke-width': 1, 'stroke-dasharray': '3 3', visibility: 'hidden' });
      g.appendChild(guia);
      const zona = el('rect', { x: 0, y: 0, width: pw, height: ph, fill: 'transparent' });
      zona.addEventListener('mousemove', (ev) => {
        const r = svg.getBoundingClientRect();
        const escalaX = W / r.width;
        const px = (ev.clientX - r.left) * escalaX - izq;
        const i = Math.max(0, Math.min(n - 1, Math.floor(px / banda)));
        guia.setAttribute('x1', x(i)); guia.setAttribute('x2', x(i)); guia.setAttribute('visibility', 'visible');
        mostrarTip(ev, '<b>' + LT.u.esc(cats[i]) + '</b>' + series.map((s, si) => '<br><span style="display:inline-block;width:9px;height:9px;border-radius:2px;background:' + PAL[si % PAL.length] + ';margin-right:5px"></span>' + LT.u.esc(s.nombre) + ': ' + LT.u.esc(typeof s.valores[i] === 'number' ? fmt(s.valores[i], o.formato) : '—')).join(''));
      });
      zona.addEventListener('mouseleave', () => { guia.setAttribute('visibility', 'hidden'); ocultarTip(); });
      g.appendChild(zona);
    }
    // eje base
    if (horizontal) g.appendChild(el('line', { x1: base, x2: base, y1: 0, y2: ph, stroke: EJE }));
    else g.appendChild(el('line', { x1: 0, x2: pw, y1: base, y2: base, stroke: EJE }));
    return svg;
  }

  function dibujarCircular(svg, o, cats, serie, W, H, top, mostrarTip, ocultarTip) {
    const vals = serie.valores.map((v) => (typeof v === 'number' && v > 0 ? v : 0));
    const total = vals.reduce((a, b) => a + b, 0) || 1;
    const cx = W / 2, cy = top + (H - top) / 2, r = Math.min(W * 0.32, (H - top) / 2 - 18);
    let ang = -Math.PI / 2;
    vals.forEach((v, i) => {
      if (!v) return;
      const a2 = ang + (v / total) * Math.PI * 2;
      const grande = a2 - ang > Math.PI ? 1 : 0;
      const p1 = [cx + r * Math.cos(ang), cy + r * Math.sin(ang)], p2 = [cx + r * Math.cos(a2), cy + r * Math.sin(a2)];
      const d = vals.filter(Boolean).length === 1 ? 'M' + (cx - r) + ' ' + cy + 'a' + r + ' ' + r + ' 0 1 0 ' + 2 * r + ' 0a' + r + ' ' + r + ' 0 1 0 ' + -2 * r + ' 0' : 'M' + cx + ' ' + cy + 'L' + p1[0] + ' ' + p1[1] + 'A' + r + ' ' + r + ' 0 ' + grande + ' 1 ' + p2[0] + ' ' + p2[1] + 'z';
      const tajada = el('path', { d, fill: PAL[i % PAL.length], stroke: SUPERFICIE, 'stroke-width': 2 });
      tajada.addEventListener('mousemove', (ev) => mostrarTip(ev, '<b>' + LT.u.esc(cats[i]) + '</b><br>' + LT.u.esc(fmt(v, o.formato)) + ' (' + Math.round((v / total) * 100) + ' %)'));
      tajada.addEventListener('mouseleave', ocultarTip);
      svg.appendChild(tajada);
      const medio = (ang + a2) / 2;
      if (v / total >= 0.06 && (o.etiquetas || cats.length <= 6)) {
        const lx = cx + (r + 14) * Math.cos(medio), ly = cy + (r + 14) * Math.sin(medio);
        svg.appendChild(el('text', { x: lx, y: ly + 4, 'text-anchor': Math.cos(medio) >= 0 ? 'start' : 'end', 'font-size': 11, fill: TXT }, Math.round((v / total) * 100) + ' %'));
      }
      ang = a2;
    });
  }

  /* Minigráfico (para celdas): línea, columna o ganancia/pérdida */
  function minigrafico(valores, tipo, opc) {
    opc = opc || {};
    const W = opc.ancho || 90, H = opc.alto || 22;
    const svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, role: 'img', 'aria-label': 'Minigráfico de ' + (tipo || 'línea') });
    const nums = valores.map((v) => (typeof v === 'number' ? v : 0));
    const min = Math.min(...nums), max = Math.max(...nums);
    const n = nums.length;
    const y = (v) => (max === min ? H / 2 : H - 2 - ((v - min) / (max - min)) * (H - 4));
    if (tipo === 'columna' || tipo === 'ganancia') {
      const w = W / n;
      nums.forEach((v, i) => {
        let yy, hh, color = SERIES[0];
        if (tipo === 'ganancia') { color = v >= 0 ? SERIES[0] : SERIES[7]; yy = v >= 0 ? 2 : H / 2; hh = H / 2 - 2; }
        else { const base = Math.min(0, min); const esc = (max - base) || 1; hh = Math.max(1, ((v - base) / esc) * (H - 3)); yy = H - hh; if (v === max && opc.marcarMax !== false) color = SERIES[1]; }
        svg.appendChild(el('rect', { x: i * w + 1, y: yy, width: Math.max(1, w - 2), height: hh, fill: color, rx: 1 }));
      });
    } else {
      const x = (i) => 2 + (i / Math.max(1, n - 1)) * (W - 4);
      svg.appendChild(el('path', { d: nums.map((v, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1)).join(''), fill: 'none', stroke: SERIES[0], 'stroke-width': 1.5, 'stroke-linejoin': 'round' }));
      const imax = nums.indexOf(max);
      svg.appendChild(el('circle', { cx: x(imax), cy: y(max), r: 2.5, fill: SERIES[1] }));
    }
    return svg;
  }

  /* -------------------------------------------- constructor de gráficos */
  const TIPOS = [
    ['columnas', 'Columnas', 'M5 20V11M10 20V6M15 20v-9M20 20V8'],
    ['barras', 'Barras', 'M4 5h9M4 10h15M4 15h7M4 20h12'],
    ['lineas', 'Líneas', 'M3 17l5-6 4 3 4-7 5 4'],
    ['area', 'Área', 'M3 19l5-7 4 3 4-6 5 4v6z'],
    ['circular', 'Circular', 'M12 3a9 9 0 1 0 9 9h-9z M14 3.3A9 9 0 0 1 20.7 10H14z'],
  ];
  /* conjuntos: [{id, nombre, categorias, series:[{nombre, valores}], formato}] */
  function Constructor(cont, opts) {
    const estado = Object.assign({ conjunto: opts.conjuntos[0].id, series: null, tipo: null, titulo: '', ejeX: '', ejeY: '', etiquetas: false, leyenda: true }, opts.estadoInicial || {});
    const conj = () => opts.conjuntos.find((c) => c.id === estado.conjunto);
    if (!estado.series) estado.series = conj().series.map((s) => s.nombre);
    cont.innerHTML = '';
    const izq = h('div', { class: 'widget', style: { padding: '14px' } });
    const der = h('div', { class: 'graf-cont' });
    cont.appendChild(h('div', { class: 'graf-constructor' }, izq, der));
    const selConj = h('select', { style: { width: '100%', padding: '7px', borderRadius: '8px', border: '1px solid var(--linea-2)' } });
    opts.conjuntos.forEach((c) => selConj.appendChild(h('option', { value: c.id }, c.nombre)));
    selConj.value = estado.conjunto;
    const seriesBox = h('div');
    const tiposBox = h('div', { class: 'graf-opciones', role: 'radiogroup', 'aria-label': 'Tipo de gráfico' });
    const titulo = h('input', { type: 'text', value: estado.titulo, placeholder: 'Título del gráfico', style: { width: '100%', padding: '7px 9px', borderRadius: '8px', border: '1px solid var(--linea-2)' } });
    const ejeX = h('input', { type: 'text', value: estado.ejeX, placeholder: 'Título del eje horizontal', style: { width: '100%', padding: '6px 9px', borderRadius: '8px', border: '1px solid var(--linea-2)', marginTop: '6px' } });
    const ejeY = h('input', { type: 'text', value: estado.ejeY, placeholder: 'Título del eje vertical', style: { width: '100%', padding: '6px 9px', borderRadius: '8px', border: '1px solid var(--linea-2)', marginTop: '6px' } });
    const etiq = h('input', { type: 'checkbox', checked: estado.etiquetas ? true : null });
    const tabla = h('div', { style: { marginTop: '10px' } });
    izq.append(
      h('label', { style: { fontWeight: 600, fontSize: '.86rem' } }, '1. Datos de origen'), selConj, seriesBox,
      h('div', { style: { fontWeight: 600, fontSize: '.86rem', marginTop: '12px' } }, '2. Tipo de gráfico'), tiposBox,
      h('div', { style: { fontWeight: 600, fontSize: '.86rem', marginTop: '6px' } }, '3. Elementos del gráfico'), titulo, ejeX, ejeY,
      h('label', { style: { display: 'flex', gap: '6px', alignItems: 'center', fontSize: '.88rem', marginTop: '8px' } }, etiq, 'Etiquetas de datos'));
    der.appendChild(h('div', { class: 'graf-lienzo' }));
    der.appendChild(tabla);
    const dibujarSeries = () => {
      seriesBox.innerHTML = '';
      seriesBox.appendChild(h('div', { style: { fontSize: '.82rem', color: 'var(--tinta-2)', margin: '6px 0 2px' } }, 'Series (columnas de datos) que se grafican:'));
      conj().series.forEach((s) => {
        const cb = h('input', { type: 'checkbox', checked: estado.series.includes(s.nombre) ? true : null });
        cb.addEventListener('change', () => { estado.series = conj().series.map((x) => x.nombre).filter((n) => (n === s.nombre ? cb.checked : estado.series.includes(n))); actualizar(); });
        seriesBox.appendChild(h('label', { style: { display: 'flex', gap: '6px', alignItems: 'center', fontSize: '.88rem' } }, cb, s.nombre));
      });
    };
    const dibujarTipos = () => {
      tiposBox.innerHTML = '';
      for (const [id, nombre, d] of TIPOS) {
        tiposBox.appendChild(h('button', { type: 'button', class: 'graf-tipo' + (estado.tipo === id ? ' activo' : ''), role: 'radio', 'aria-checked': estado.tipo === id ? 'true' : 'false', onclick: () => { estado.tipo = id; dibujarTipos(); actualizar(); } },
          h('span', { html: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#217346" stroke-width="2" stroke-linecap="round"><path d="' + d + '"/></svg>' }), nombre));
      }
    };
    const dibujarTabla = () => {
      const c = conj();
      tabla.innerHTML = '';
      const t = h('table', { class: 'tabla-sitio', style: { fontSize: '.82rem' } });
      t.appendChild(h('thead', null, h('tr', null, h('th', null, ''), c.series.map((s) => h('th', null, s.nombre)))));
      const tb = h('tbody');
      c.categorias.forEach((cat, i) => tb.appendChild(h('tr', null, h('th', { style: { fontWeight: 400 } }, cat), c.series.map((s) => h('td', { style: { textAlign: 'right' } }, fmt(s.valores[i], c.formato))))));
      t.appendChild(tb);
      tabla.appendChild(h('details', null, h('summary', { style: { cursor: 'pointer', fontSize: '.86rem', color: 'var(--tinta-2)' } }, 'Ver la tabla de datos'), h('div', { class: 'tabla-scroll', style: { maxHeight: '240px', overflow: 'auto', marginTop: '6px' } }, t)));
    };
    const actualizar = () => {
      estado.titulo = titulo.value; estado.ejeX = ejeX.value; estado.ejeY = ejeY.value; estado.etiquetas = etiq.checked;
      const c = conj();
      const ser = c.series.filter((s) => estado.series.includes(s.nombre));
      dibujar(der.querySelector('.graf-lienzo'), { tipo: estado.tipo || 'columnas', categorias: c.categorias, series: estado.tipo === 'circular' ? ser.slice(0, 1) : ser, titulo: estado.titulo, ejeX: estado.ejeX, ejeY: estado.ejeY, etiquetas: estado.etiquetas, formato: c.formato });
      if (!estado.tipo) der.querySelector('.graf-lienzo').prepend(h('div', { class: 'aviso-caja info', style: { margin: '0 0 8px' } }, 'Vista previa como columnas: elige el tipo de gráfico que mejor responda la pregunta.'));
      if (opts.alCambiar) opts.alCambiar(Object.assign({}, estado, { series: estado.series.slice() }));
    };
    selConj.addEventListener('change', () => { estado.conjunto = selConj.value; estado.series = conj().series.map((s) => s.nombre); dibujarSeries(); dibujarTabla(); actualizar(); });
    [titulo, ejeX, ejeY].forEach((x) => x.addEventListener('input', actualizar));
    etiq.addEventListener('change', actualizar);
    dibujarSeries(); dibujarTipos(); dibujarTabla(); actualizar();
    return { estado: () => Object.assign({}, estado, { series: estado.series.slice() }), conjunto: conj };
  }

  LT.graficos = { dibujar, minigrafico, Constructor, SERIES, TIPOS: TIPOS.map((t) => t[0]) };
})();

/* Utilidades compartidas por los módulos del curso de PowerPoint: demostraciones en vivo,
   medidor de contraste, miniaturas de ejemplo y ayudas para revisar presentaciones del simulador. */
(function () {
  'use strict';
  const LT = window.LT;
  const { h } = LT.u;
  const K = LT.DIAPO;
  const R = LT.DiapoRender;
  const S = LT.DiapoShow;

  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ ]+/g, ' ').replace(/\s+/g, ' ').trim();
  const porClave = (p, clave) => p.diapositivas.find((d) => d.clave === clave) || null;
  const obj = (d, nombre) => (d ? d.objetos.find((o) => o.clave === nombre || o.nombre === nombre) || null : null);
  const texto = (o) => String((o && o.texto) || '').trim();
  const centro = (o) => ({ x: o.x + o.w / 2, y: o.y + o.h / 2 });
  const dentro = (o) => o.x >= -2 && o.y >= -2 && o.x + o.w <= K.ANCHO + 2 && o.y + o.h <= K.ALTO + 2;

  /* Fila de miniaturas con su etiqueta: lista de [presentación, índice, etiqueta] */
  function miniaturas(cont, items, ancho) {
    const fila = h('div', { class: 'mini-fila' });
    for (const [p, i, et, clase] of items) fila.appendChild(h('figure', { class: 'mini-fig ' + (clase || '') }, R.escalada(p, p.diapositivas[i], ancho || 220, { modo: 'mini' }), h('figcaption', { html: et })));
    cont.appendChild(fila);
    return fila;
  }

  /* Escenario de demostración con su botón de reproducir */
  function escenario(cont, ancho) {
    const caja = h('div', { class: 'demo-escena' });
    cont.appendChild(caja);
    const esc = new S.Escenario(caja, null, { silencio: true });
    esc.medir(ancho, ancho * K.ALTO / K.ANCHO);
    caja.style.height = Math.round(ancho * K.ALTO / K.ANCHO) + 'px';
    return esc;
  }
  function capaInicial(esc, p, d) {
    esc.p = p;
    esc.el.innerHTML = '';
    const c = esc.capaDe(d);
    esc.el.appendChild(c);
    esc.capa = c;
    return c;
  }

  /* Demostración: transición (entre diapositivas) contra animación (dentro de una diapositiva) */
  function demoTransicionAnimacion(cont) {
    const p = LT.Diapo.construir({
      tema: 'clinico', variante: 1,
      diapositivas: [
        { diseno: 'titulo', titulo: 'Diapositiva 1', subtitulo: 'Termina aquí' },
        { diseno: 'tituloObjetos', titulo: 'Diapositiva 2', cuerpo: 'Entra completa con la transición', transicion: { efecto: 'empujar', opcion: 'Desde la derecha', duracion: 1 } },
        { diseno: 'soloTitulo', titulo: 'Una sola diapositiva', objetos: [{ clave: 'a', tipo: 'icono', icono: 'jeringa', x: 120, y: 200, w: 120, h: 120 }, { clave: 'b', tipo: 'forma', forma: 'redondeado', texto: 'Vacúnate cada año', x: 380, y: 210, w: 420, h: 100, estilo: { tam: 28 } }],
          animaciones: [{ objeto: 'a', efecto: 'zoom', inicio: 'con', duracion: 0.6 }, { objeto: 'b', efecto: 'barrido', inicio: 'despues', opcion: 'Desde la izquierda', duracion: 0.8 }, { objeto: 'a', efecto: 'lineas', inicio: 'despues', opcion: 'Derecha', duracion: 1.2, trayectoria: { tipo: 'linea', dx: 0, dy: 90 } }, { objeto: 'b', efecto: 'impulso', inicio: 'despues', duracion: 0.6 }] },
      ],
    });
    const fila = h('div', { class: 'demo-dos' });
    const c1 = h('div', { class: 'demo-caja' }, h('h4', null, 'Transición'), h('p', { class: 'instr' }, 'Efecto que ocurre al pasar de una diapositiva a otra. Se configura en la pestaña Transiciones y se aplica a la diapositiva que entra.'));
    const c2 = h('div', { class: 'demo-caja' }, h('h4', null, 'Animación'), h('p', { class: 'instr' }, 'Efecto aplicado a un elemento dentro de una diapositiva (un icono, un texto, una forma). Se configura en la pestaña Animaciones.'));
    fila.append(c1, c2);
    cont.appendChild(fila);
    setTimeout(() => {
      const w = Math.min(420, c1.clientWidth - 24);
      const e1 = escenario(c1, w), e2 = escenario(c2, w);
      capaInicial(e1, p, p.diapositivas[0]);
      const cap2 = capaInicial(e2, p, p.diapositivas[2]);
      void cap2;
      const b1 = h('button', { class: 'btn primario chico', onclick: () => { capaInicial(e1, p, p.diapositivas[0]); setTimeout(() => { const n = e1.capaDe(p.diapositivas[1]); e1.transicion(e1.capa, n, p.diapositivas[1].transicion).then(() => { e1.capa = n; }); }, 400); } }, '▶ Reproducir la transición');
      const b2 = h('button', { class: 'btn primario chico', onclick: () => { e2.limpiar(); const c = capaInicial(e2, p, p.diapositivas[2]); e2.preparar(c, p.diapositivas[2]); const g = R.pasos(p.diapositivas[2]); g.reduce((pr, x) => pr.then(() => e2.ejecutar(c, p.diapositivas[2], x)), Promise.resolve()); } }, '▶ Reproducir las animaciones');
      c1.append(h('div', { class: 'grupo-btn', style: { marginTop: '8px' } }, b1));
      c2.append(h('div', { class: 'grupo-btn', style: { marginTop: '8px' } }, b2));
    }, 0);
  }

  /* Medidor de contraste (WCAG): texto sobre fondo */
  function medidorContraste(cont, opc) {
    opc = opc || {};
    let texto = opc.texto || '#bfbfbf', fondo = opc.fondo || '#ffffff', tam = 24;
    const muestra = h('div', { class: 'contraste-muestra' });
    const res = h('div', { class: 'contraste-res', 'aria-live': 'polite' });
    const it = h('input', { type: 'color', value: texto, 'aria-label': 'Color del texto' });
    const ifo = h('input', { type: 'color', value: fondo, 'aria-label': 'Color del fondo' });
    const sel = h('select', { 'aria-label': 'Tamaño del texto' }, h('option', { value: 18 }, 'Texto de 18 pt'), h('option', { value: 24, selected: true }, 'Texto de 24 pt o más (grande)'));
    const presets = [['#bfbfbf', '#ffffff', 'Gris claro sobre blanco'], ['#ffff00', '#ffffff', 'Amarillo sobre blanco'], ['#ffffff', '#0b3d66', 'Blanco sobre azul oscuro'], ['#262626', '#f2f2f2', 'Casi negro sobre gris claro'], ['#ff0000', '#00b050', 'Rojo sobre verde'], ['#c43e1c', '#ffffff', 'Terracota sobre blanco']];
    const dibujar = () => {
      const c = K.contraste(texto, fondo);
      const minimo = tam >= 24 ? 3 : 4.5;
      muestra.style.background = fondo;
      muestra.style.color = texto;
      muestra.style.fontSize = (tam >= 24 ? 30 : 20) + 'px';
      muestra.textContent = 'Toma tu presión cada año';
      res.innerHTML = '';
      res.append(h('b', { class: c >= minimo ? 'ok' : 'mal' }, c.toFixed(2) + ':1 ' + (c >= 7 ? '· Excelente' : c >= minimo ? '· Suficiente' : '· Insuficiente')), h('span', null, ' Mínimo recomendado para este tamaño: ' + minimo + ':1 (WCAG 2.2 AA).'));
      it.value = texto; ifo.value = fondo;
    };
    it.addEventListener('input', () => { texto = it.value; dibujar(); });
    ifo.addEventListener('input', () => { fondo = ifo.value; dibujar(); });
    sel.addEventListener('change', () => { tam = +sel.value; dibujar(); });
    cont.append(h('div', { class: 'contraste' }, muestra, h('div', { class: 'contraste-ctrl' }, h('label', null, it, ' Texto'), h('label', null, ifo, ' Fondo'), sel), res,
      h('div', { class: 'grupo-btn' }, presets.map(([t, f, n]) => h('button', { class: 'btn chico', onclick: () => { texto = t; fondo = f; dibujar(); } }, h('span', { class: 'contraste-chip', style: { background: f, color: t } }, 'Aa'), n)))));
    dibujar();
  }

  /* Catálogo de efectos con vista previa (transiciones o animaciones) */
  function catalogo(cont, tipo) {
    const ancho = 300;
    const p = LT.Diapo.construir({ tema: 'clinico', variante: 0, diapositivas: [
      { diseno: 'titulo', titulo: 'Antes', subtitulo: 'Diapositiva anterior' },
      { diseno: 'soloTitulo', titulo: 'Después', objetos: [{ clave: 'x', tipo: 'icono', icono: 'virus', x: 420, y: 200, w: 120, h: 120, color: 'tema:acento2' }] },
    ] });
    const lista = h('div', { class: 'catalogo-lista' });
    const info = h('p', { class: 'instr' });
    const caja = h('div', { class: 'catalogo-vista' });
    cont.append(h('div', { class: 'catalogo' }, lista, h('div', null, caja, info)));
    let esc = null;
    setTimeout(() => { esc = escenario(caja, ancho); capaInicial(esc, p, tipo === 'transiciones' ? p.diapositivas[0] : p.diapositivas[1]); }, 0);
    const reproducir = (ef, opcion) => {
      if (!esc) return;
      esc.limpiar();
      if (tipo === 'transiciones') {
        const def = K.transicion(ef);
        info.innerHTML = '<b>' + def.nombre + '</b> · ' + def.grupo + (def.opciones ? ' · Opciones de efectos: ' + def.opciones.join(', ') : '') + ' · Duración predeterminada: ' + def.dur + ' s';
        const viejo = capaInicial(esc, p, p.diapositivas[0]);
        const nueva = esc.capaDe(p.diapositivas[1]);
        setTimeout(() => esc.transicion(viejo, nueva, { efecto: ef, opcion, duracion: def.dur }).then(() => { esc.capa = nueva; }), 250);
      } else {
        const def = K.animacion(ef);
        info.innerHTML = '<b>' + K.CAT[def.cat] + ': ' + def.nombre + '</b>' + (def.opciones ? ' · Opciones de efectos: ' + def.opciones.join(', ') : '') + ' · Duración predeterminada: ' + def.dur + ' s';
        const d = JSON.parse(JSON.stringify(p.diapositivas[1]));
        d.animaciones = [{ id: 'z', objeto: d.objetos.find((o) => o.clave === 'x').id, efecto: ef, cat: def.cat, opcion, inicio: 'clic', duracion: Math.max(0.4, def.dur), retraso: 0, trayectoria: def.cat === 'trayectoria' ? K.trayectoriaInicial(ef, opcion) : undefined }];
        const c = capaInicial(esc, p, d);
        esc.preparar(c, d);
        setTimeout(() => esc.ejecutar(c, d, R.pasos(d)[0]).then(() => { if (def.cat === 'salida') setTimeout(() => capaInicial(esc, p, p.diapositivas[1]), 600); }), 250);
      }
    };
    const grupos = {};
    const items = tipo === 'transiciones' ? K.TRANSICIONES.filter((x) => x.id !== 'ninguna').map((x) => [x.grupo, x.id, x.nombre, x.opciones]) : K.ANIMACIONES.map((x) => [K.CAT[x.cat], x.id, x.nombre, x.opciones, x.cat]);
    for (const [g, id, nombre, ops, cat] of items) {
      if (!grupos[g]) { grupos[g] = h('div', { class: 'catalogo-grupo' }, h('b', { style: cat ? { color: K.COLOR_CAT[cat] } : null }, g)); lista.appendChild(grupos[g]); }
      grupos[g].appendChild(h('button', { class: 'btn chico', onclick: () => reproducir(id, (ops || [])[0]) }, nombre));
    }
  }

  /* Revisor de pruebas para los retos: devuelve add(ok, titulo, mensaje) con add.lista */
  const revisor = () => LT.modulo.revisor();

  LT.ppt = { norm, porClave, obj, texto, centro, dentro, miniaturas, escenario, capaInicial, demoTransicionAnimacion, medidorContraste, catalogo, revisor, R, K };
})();

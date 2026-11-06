/* Cinta de opciones del simulador de PowerPoint y sus cuadros de diálogo (insertar imágenes, iconos,
   SmartArt, tablas, gráficos, video, audio y vínculos; configurar la presentación). */
(function () {
  'use strict';
  const LT = window.LT;
  const { h } = LT.u;
  const K = LT.DIAPO;
  const R = LT.DiapoRender;

  const PESTANAS = { inicio: 'Inicio', insertar: 'Insertar', diseno: 'Diseño', transiciones: 'Transiciones', animaciones: 'Animaciones', presentacion: 'Presentación con diapositivas', revisar: 'Revisar', vista: 'Vista' };
  const ic = (n, t) => h('span', { class: 'dp-ic', html: LT.iconoSVG(n, t || 22) });

  function grande(icono, texto, fn, opc) {
    opc = opc || {};
    const b = h('button', { class: 'dp-cmd grande' + (opc.activo ? ' activo' : ''), title: opc.titulo || texto, 'aria-label': opc.titulo || texto, disabled: opc.desactivado ? true : null, 'aria-haspopup': opc.menu ? 'true' : null }, ic(icono, 26), h('span', null, texto + (opc.menu ? ' ▾' : '')));
    b.addEventListener('click', (e) => fn(e.currentTarget));
    return b;
  }
  function chico(icono, texto, fn, opc) {
    opc = opc || {};
    const b = h('button', { class: 'dp-cmd chico' + (opc.activo ? ' activo' : ''), title: opc.titulo || texto, 'aria-label': opc.titulo || texto, disabled: opc.desactivado ? true : null, 'aria-pressed': opc.alternar ? (opc.activo ? 'true' : 'false') : null }, icono ? ic(icono, 16) : null, texto ? h('span', null, texto + (opc.menu ? ' ▾' : '')) : null);
    b.addEventListener('click', (e) => fn(e.currentTarget));
    return b;
  }
  function grupo(nombre, ...hijos) { return h('div', { class: 'dp-grupo' }, h('div', { class: 'dp-grupo-cmds' }, hijos), h('div', { class: 'dp-grupo-nombre' }, nombre)); }
  function columna(...hijos) { return h('div', { class: 'dp-col' }, hijos); }
  function check(texto, valor, fn, opc) {
    opc = opc || {};
    return h('label', { class: 'dp-chk', title: opc.titulo || texto }, h('input', { type: 'checkbox', checked: valor ? true : null, disabled: opc.desactivado ? true : null, onchange: (e) => fn(e.target.checked) }), texto);
  }

  /* --------------------------------------------------------------- cinta */
  function construir(ed) {
    const raiz = h('div', { class: 'dp-cinta-in' });
    const pest = h('div', { class: 'dp-pestanas', role: 'tablist', 'aria-label': 'Cinta de opciones' },
      h('div', { class: 'dp-rapido' },
        h('button', { class: 'dp-cmd chico', title: 'Deshacer (Ctrl+Z)', 'aria-label': 'Deshacer', disabled: ed.historia.length ? null : true, onclick: () => ed.deshacer() }, ic('deshacer', 16)),
        h('button', { class: 'dp-cmd chico', title: 'Rehacer (Ctrl+Y)', 'aria-label': 'Rehacer', disabled: ed.futuro.length ? null : true, onclick: () => ed.rehacer() }, ic('rehacer', 16)),
        h('button', { class: 'dp-cmd chico', title: 'Desde el principio (F5)', 'aria-label': 'Presentar desde el principio', onclick: () => ed.presentar({ desde: 0 }) }, ic('play', 16))));
    for (const id of ed.herramientas) {
      pest.appendChild(h('button', { class: 'dp-pest' + (ed.pestana === id ? ' activa' : ''), role: 'tab', 'aria-selected': ed.pestana === id ? 'true' : 'false', 'data-pestana': id, onclick: () => { ed.pestana = id; ed.cerrarMenu(); ed.render(); } }, PESTANAS[id]));
    }
    const cuerpo = h('div', { class: 'dp-grupos', role: 'tabpanel', 'aria-label': PESTANAS[ed.pestana] });
    const f = { inicio, insertar, diseno, transiciones, animaciones, presentacion, revisar, vista }[ed.pestana];
    if (f) f(ed).forEach((g) => cuerpo.appendChild(g));
    raiz.append(pest, cuerpo);
    return raiz;
  }

  /* ---------------------------------------------------------------- Inicio */
  function menuDisenos(ed, ancla, alElegir, titulo) {
    ed.menu(ancla, (m, cerrar) => {
      m.appendChild(h('div', { class: 'dp-menu-tit' }, titulo || 'Tema: ' + K.tema(ed.p.tema).nombre));
      const g = h('div', { class: 'dp-galeria-disenos' });
      for (const d of K.DISENOS) {
        const mini = h('div', { class: 'dp-esquema', style: { background: R.variante(ed.p).fondo } }, d.ph.map((ph) => h('i', { class: ph.ph === 'titulo' ? 'tit' : '', style: { left: ph.x / 9.6 + '%', top: ph.y / 5.4 + '%', width: ph.w / 9.6 + '%', height: ph.h / 5.4 + '%' } })));
        g.appendChild(h('button', { class: 'dp-tile-diseno' + (ed.d && ed.d.diseno === d.id && titulo ? ' sel' : ''), title: d.nombre, onclick: () => { cerrar(); alElegir(d.id); } }, mini, h('span', null, d.nombre)));
      }
      m.appendChild(g);
      if (!titulo) m.appendChild(h('button', { class: 'dp-menu-item', onclick: () => { cerrar(); ed.duplicarDiapositiva(); } }, 'Duplicar diapositivas seleccionadas'));
    }, 'ancho');
  }
  function menuSeccion(ed, ancla) {
    const s = ed.d && ed.d.seccion;
    ed.menuSimple(ancla, [
      { texto: 'Agregar sección', accion: () => ed.agregarSeccion() },
      { texto: 'Cambiar nombre de sección', desactivado: !s, accion: () => ed.renombrarSeccion(s) },
      { texto: 'Quitar sección', desactivado: !s, accion: () => ed.quitarSeccion(s) },
    ]);
  }
  function menuOrganizar(ed, ancla) {
    const n = ed.sel.length;
    ed.menuSimple(ancla, [
      { texto: 'Traer al frente', desactivado: !n, accion: () => ed.ordenar('frente') },
      { texto: 'Enviar al fondo', desactivado: !n, accion: () => ed.ordenar('fondo') },
      { texto: 'Traer adelante', desactivado: !n, accion: () => ed.ordenar('adelante') },
      { texto: 'Enviar atrás', desactivado: !n, accion: () => ed.ordenar('atras') },
      null,
      { texto: 'Alinear a la izquierda', desactivado: !n, accion: () => ed.alinear('izq') },
      { texto: 'Alinear verticalmente', desactivado: !n, accion: () => ed.alinear('centro') },
      { texto: 'Alinear a la derecha', desactivado: !n, accion: () => ed.alinear('der') },
      { texto: 'Alinear en la parte superior', desactivado: !n, accion: () => ed.alinear('arriba') },
      { texto: 'Alinear al medio', desactivado: !n, accion: () => ed.alinear('medio') },
      { texto: 'Alinear en la parte inferior', desactivado: !n, accion: () => ed.alinear('abajo') },
      null,
      { texto: 'Distribuir horizontalmente', desactivado: n < 3, accion: () => ed.alinear('distH') },
      { texto: 'Distribuir verticalmente', desactivado: n < 3, accion: () => ed.alinear('distV') },
    ]);
  }
  function menuColor(ed, ancla, actual, fn, sinColor) {
    ed.menu(ancla, (m, cerrar) => { m.appendChild(ed.paleta(actual, (v) => { cerrar(); fn(v); }, { sinColor })); });
  }
  function inicio(ed) {
    const o = ed.objSel()[0];
    const conTexto = o && ['texto', 'forma', 'smartart', 'tabla'].includes(o.tipo);
    const e = conTexto ? R.estilo(ed.p, ed.d, o) : null;
    const tema = K.tema(ed.p.tema);
    const fuente = h('select', { class: 'dp-sel-fuente', 'aria-label': 'Fuente', disabled: conTexto ? null : true, onchange: (ev) => ed.estiloTexto('fuente', ev.target.value) }, conTexto ? null : h('option', { value: '' }, ''),
      h('option', { value: 'tema:titulo', selected: e && e.fuente === 'tema:titulo' ? true : null }, tema.fuentes.titulo + ' (Títulos)'),
      h('option', { value: 'tema:cuerpo', selected: e && e.fuente === 'tema:cuerpo' ? true : null }, tema.fuentes.cuerpo + ' (Cuerpo)'),
      R.FUENTES.map((x) => h('option', { value: x, selected: e && e.fuente === x ? true : null }, x)));
    const tams = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 44, 48, 54, 60, 66, 72, 80, 88, 96];
    if (e && !tams.includes(e.tam)) tams.push(e.tam);
    tams.sort((a, b) => a - b);
    const tam = h('select', { class: 'dp-sel-tam', 'aria-label': 'Tamaño de fuente', disabled: conTexto ? null : true, onchange: (ev) => ed.estiloTexto('tam', parseFloat(ev.target.value)) }, conTexto ? null : h('option', { value: '' }, ''), tams.map((t) => h('option', { value: t, selected: e && e.tam === t ? true : null }, String(t))));
    return [
      grupo('Diapositivas',
        grande('nuevaDiapo', 'Nueva diapositiva', (b) => menuDisenos(ed, b, (id) => ed.nuevaDiapositiva(id)), { menu: true, titulo: 'Nueva diapositiva (Ctrl+M)' }),
        columna(chico('diseno', 'Diseño', (b) => menuDisenos(ed, b, (id) => ed.cambiarDiseno(id), 'Diseño de la diapositiva'), { menu: true }),
          chico('reiniciar', 'Restablecer', () => ed.restablecerDiapositiva(), { titulo: 'Restablecer la posición, el tamaño y el formato de los marcadores' }),
          chico('seccion', 'Sección', (b) => menuSeccion(ed, b), { menu: true }))),
      grupo('Fuente',
        columna(h('div', { class: 'dp-fila-cinta' }, fuente, tam, chico(null, 'A⁺', () => ed.estiloTexto('tamMas'), { titulo: 'Aumentar tamaño de fuente', desactivado: !conTexto }), chico(null, 'A⁻', () => ed.estiloTexto('tamMenos'), { titulo: 'Disminuir tamaño de fuente', desactivado: !conTexto })),
          h('div', { class: 'dp-fila-cinta' },
            chico(null, 'N', () => ed.estiloTexto('negrita', 'alternar'), { titulo: 'Negrita', alternar: true, activo: e && e.negrita, desactivado: !conTexto }),
            chico(null, 'K', () => ed.estiloTexto('cursiva', 'alternar'), { titulo: 'Cursiva', alternar: true, activo: e && e.cursiva, desactivado: !conTexto }),
            chico(null, 'S', () => ed.estiloTexto('subrayado', 'alternar'), { titulo: 'Subrayado', alternar: true, activo: e && e.subrayado, desactivado: !conTexto }),
            chico('fuente', 'Color', (b) => menuColor(ed, b, o && (o.estilo || {}).color, (v) => ed.estiloTexto('color', v)), { titulo: 'Color de fuente', menu: true, desactivado: !conTexto })))),
      grupo('Párrafo',
        columna(h('div', { class: 'dp-fila-cinta' },
          chico(null, '•≡', () => ed.estiloTexto('vinetas', 'alternar'), { titulo: 'Viñetas', alternar: true, activo: e && e.vinetas, desactivado: !conTexto }),
          chico('alIzq', '', () => ed.estiloTexto('alinear', 'izquierda'), { titulo: 'Alinear a la izquierda', activo: e && e.alinear === 'izquierda', desactivado: !conTexto }),
          chico('alCen', '', () => ed.estiloTexto('alinear', 'centro'), { titulo: 'Centrar', activo: e && e.alinear === 'centro', desactivado: !conTexto }),
          chico('alDer', '', () => ed.estiloTexto('alinear', 'derecha'), { titulo: 'Alinear a la derecha', activo: e && e.alinear === 'derecha', desactivado: !conTexto })),
          chico('smartart', 'Convertir a SmartArt', (b) => ed.menuSimple(b, K.SMARTART.map((x) => ({ texto: x.cat + ' · ' + x.nombre, accion: () => ed.convertirSmartArt(x.id) }))), { menu: true, desactivado: !(o && o.tipo === 'texto' && String(o.texto || '').trim()) }))),
      grupo('Dibujo',
        grande('forma', 'Formas', (b) => menuFormas(ed, b), { menu: true }),
        columna(chico('ordenar', 'Organizar', (b) => menuOrganizar(ed, b), { menu: true }),
          chico('relleno', 'Relleno de forma', (b) => menuColor(ed, b, o && o.relleno, (v) => ed.propiedad('relleno', v || undefined, (x) => ['forma', 'texto', 'smartart', 'tabla', 'icono'].includes(x.tipo)), 'Sin relleno'), { menu: true, desactivado: !o }),
          chico('bordes', 'Contorno de forma', (b) => menuColor(ed, b, o && o.borde, (v) => ed.propiedad('borde', v || undefined, (x) => ['forma', 'texto', 'imagen'].includes(x.tipo)), 'Sin contorno'), { menu: true, desactivado: !o }))),
    ];
  }

  /* -------------------------------------------------------------- Insertar */
  function menuFormas(ed, ancla) {
    ed.menu(ancla, (m, cerrar) => {
      m.appendChild(h('div', { class: 'dp-menu-tit' }, 'Formas básicas'));
      const g = h('div', { class: 'dp-galeria-formas' });
      for (const f of K.FORMAS) {
        const svg = '<svg viewBox="-2 -2 44 34" width="40" height="30"><path d="' + K.rutaForma(f.id, 40, 30) + '" fill="#d9e3ef" stroke="#4a6a8a" stroke-width="1.5"/></svg>';
        g.appendChild(h('button', { class: 'dp-tile-forma', title: f.nombre, 'aria-label': f.nombre, html: svg, onclick: () => { cerrar(); const cuadrada = ['elipse', 'estrella', 'corazon', 'triangulo'].includes(f.id); ed.insertar({ tipo: 'forma', forma: f.id, w: cuadrada ? 150 : 220, h: cuadrada ? 150 : 110, texto: '' }); } }));
      }
      m.appendChild(g);
    });
  }
  function menuTabla(ed, ancla) {
    ed.menu(ancla, (m, cerrar) => {
      const et = h('div', { class: 'dp-menu-tit' }, 'Insertar tabla');
      const g = h('div', { class: 'dp-tabla-picker', role: 'grid' });
      const celdas = [];
      for (let r = 0; r < 8; r++) for (let c = 0; c < 10; c++) {
        const b = h('button', { class: 'dp-tp', 'aria-label': (c + 1) + ' × ' + (r + 1), 'data-r': r, 'data-c': c });
        b.addEventListener('mouseenter', () => { celdas.forEach((x) => x.classList.toggle('on', +x.dataset.r <= r && +x.dataset.c <= c)); et.textContent = 'Tabla de ' + (c + 1) + ' × ' + (r + 1); });
        b.addEventListener('focus', () => b.dispatchEvent(new Event('mouseenter')));
        b.addEventListener('click', () => { cerrar(); insertarTabla(ed, r + 1, c + 1); });
        celdas.push(b);
        g.appendChild(b);
      }
      m.append(et, g, h('button', { class: 'dp-menu-item', onclick: async () => { cerrar(); const filas = h('input', { type: 'number', min: 1, max: 20, value: 3, 'aria-label': 'Número de filas' }); const cols = h('input', { type: 'number', min: 1, max: 10, value: 3, 'aria-label': 'Número de columnas' }); const ok = await LT.ui.modal({ titulo: 'Insertar tabla', cuerpo: h('div', { class: 'dp-dialogo-grid' }, h('label', null, 'Número de columnas', cols), h('label', null, 'Número de filas', filas)), botones: [{ texto: 'Cancelar', valor: false }, { texto: 'Aceptar', primario: true, valor: true }] }); if (ok) insertarTabla(ed, Math.max(1, +filas.value || 3), Math.max(1, +cols.value || 3)); } }, 'Insertar tabla…'));
    });
  }
  function insertarTabla(ed, filas, cols) {
    const datos = [];
    for (let r = 0; r < filas; r++) datos.push(new Array(cols).fill(''));
    ed.insertar({ tipo: 'tabla', filas: datos, w: 828, h: Math.min(350, 44 * filas), x: 66, y: 140, encabezado: true, bandas: true }, { enMarcador: true, ajustarAlto: Math.min(350, 44 * filas) });
  }
  function dialogoImagenes(ed) {
    let elegida = null;
    const g = h('div', { class: 'dp-galeria-imagenes' });
    const botones = [];
    for (const im of K.IMAGENES) {
      const b = h('button', { class: 'dp-tile-img', title: im.nombre, onclick: () => { elegida = im; botones.forEach((x) => x.classList.toggle('sel', x === b)); } }, h('img', { src: im.src, alt: '' }), h('span', null, im.nombre));
      b.addEventListener('dblclick', () => { elegida = im; document.querySelector('.modal .modal-pie .btn.primario').click(); });
      botones.push(b);
      g.appendChild(b);
    }
    LT.ui.modal({ titulo: 'Insertar imagen · Imágenes de archivo de la clínica', clase: 'modal-ancho', cuerpo: h('div', null, h('p', { class: 'dp-nota' }, 'En PowerPoint: Insertar › Imágenes › Este dispositivo (o Imágenes de archivo). Elige una ilustración:'), g), botones: [{ texto: 'Cancelar', valor: false }, { texto: 'Insertar', primario: true, valor: true }] }).then((ok) => {
      if (!ok || !elegida) return;
      const w = 400;
      ed.insertar({ tipo: 'imagen', src: elegida.id, w, h: Math.round(w * elegida.alto / elegida.ancho), alt: '' });
      ed.panel = 'formato'; ed.render();
    });
  }
  function dialogoIconos(ed) {
    const elegidos = new Set();
    const g = h('div', { class: 'dp-galeria-iconos' });
    const buscar = h('input', { type: 'search', placeholder: 'Buscar iconos (vacuna, agua, corazón…)', 'aria-label': 'Buscar iconos' });
    const contador = h('span', { class: 'dp-nota' }, '0 seleccionados');
    const dibujar = () => {
      g.innerHTML = '';
      const q = buscar.value.trim().toLowerCase();
      for (const [id, nombre] of K.ICONOS) {
        if (q && !(nombre.toLowerCase().includes(q) || id.includes(q))) continue;
        const b = h('button', { class: 'dp-tile-icono' + (elegidos.has(id) ? ' sel' : ''), title: nombre, 'aria-pressed': elegidos.has(id) ? 'true' : 'false', html: K.iconoSVG(id, '#333') + '<span>' + nombre + '</span>', onclick: () => { if (elegidos.has(id)) elegidos.delete(id); else elegidos.add(id); contador.textContent = elegidos.size + ' seleccionados'; dibujar(); } });
        g.appendChild(b);
      }
    };
    buscar.addEventListener('input', dibujar);
    dibujar();
    LT.ui.modal({ titulo: 'Insertar iconos', clase: 'modal-ancho', enterAcepta: false, cuerpo: h('div', null, h('div', { class: 'dp-fila' }, buscar, contador), g), botones: [{ texto: 'Cancelar', valor: false }, { texto: 'Insertar', primario: true, valor: true }] }).then((ok) => {
      if (!ok || !elegidos.size) return;
      const lista = Array.from(elegidos);
      const t = 96;
      ed.cambiar(() => {
        const ids = [];
        // como en PowerPoint: los iconos llegan escalonados al centro; después se acomodan y alinean
        lista.forEach((id, i) => {
          const o = { id: 'tmp', tipo: 'icono', icono: id, w: t, h: t, x: Math.round((K.ANCHO - t) / 2 + (i - (lista.length - 1) / 2) * 34), y: Math.round((K.ALTO - t) / 2 + (i - (lista.length - 1) / 2) * 26), color: 'tema:acento1', alt: '' };
          o.id = 'o' + (ed.p.sigId++);
          o.nombre = LT.Diapo.nombreLibre(ed.d, 'Icono');
          ed.d.objetos.push(o);
          ids.push(o.id);
        });
        ed.sel = ids;
      });
    });
  }
  function dialogoSmartArt(ed) {
    let cat = 'Todos', elegido = K.SMARTART[2];
    const cats = ['Todos', ...Array.from(new Set(K.SMARTART.map((s) => s.cat)))];
    const izq = h('div', { class: 'dp-sa-cats', role: 'listbox', 'aria-label': 'Categorías' });
    const centro = h('div', { class: 'dp-sa-tiles' });
    const der = h('div', { class: 'dp-sa-desc' });
    const pre = (s) => {
      const p = { tema: ed.p.tema, variante: ed.p.variante, diapositivas: [] };
      const o = { id: 'x', tipo: 'smartart', diseno: s.id, elementos: s.cat === 'Jerarquía' ? ['Dirección', 'Área A', 'Área B'] : ['Uno', 'Dos', 'Tres'], x: 0, y: 0, w: 300, h: 170 };
      const el = R.objeto(p, { objetos: [o], diseno: 'blanco' }, o, { modo: 'mini' });
      el.style.position = 'relative'; el.style.left = '0'; el.style.top = '0';
      return h('div', { class: 'dp-sa-prev', style: { background: R.variante(ed.p).fondo } }, el);
    };
    const dibujar = () => {
      izq.innerHTML = ''; centro.innerHTML = ''; der.innerHTML = '';
      for (const c of cats) izq.appendChild(h('button', { class: c === cat ? 'sel' : '', role: 'option', 'aria-selected': c === cat ? 'true' : 'false', onclick: () => { cat = c; dibujar(); } }, c));
      for (const s of K.SMARTART.filter((x) => cat === 'Todos' || x.cat === cat)) centro.appendChild(h('button', { class: 'dp-sa-tile' + (s === elegido ? ' sel' : ''), title: s.nombre, onclick: () => { elegido = s; dibujar(); } }, s.nombre, h('small', null, s.cat)));
      der.append(pre(elegido), h('b', null, elegido.nombre), h('p', null, elegido.desc));
    };
    dibujar();
    LT.ui.modal({ titulo: 'Elegir un gráfico SmartArt', clase: 'modal-ancho', cuerpo: h('div', { class: 'dp-sa' }, izq, centro, der), botones: [{ texto: 'Cancelar', valor: false }, { texto: 'Aceptar', primario: true, valor: true }] }).then((ok) => {
      if (!ok) return;
      ed.insertar({ tipo: 'smartart', diseno: elegido.id, elementos: ['[Texto]', '[Texto]', '[Texto]'], x: 66, y: 150, w: 828, h: 320, colores: 'mono' }, { enMarcador: true });
      ed.panel = 'formato'; ed.render();
    });
  }
  const TIPOS_GRAF = [['columnas', 'Columna', 'Comparar categorías'], ['barras', 'Barra', 'Comparar categorías con nombres largos'], ['lineas', 'Línea', 'Cambio en el tiempo'], ['circular', 'Circular', 'Partes de un todo (pocas)']];
  function dialogoGrafico(ed) {
    const datos = (ed.opts.datosGrafico && ed.opts.datosGrafico.length) ? ed.opts.datosGrafico : [{ id: 'ejemplo', nombre: 'Datos de ejemplo', categorias: ['Categoría 1', 'Categoría 2', 'Categoría 3', 'Categoría 4'], series: [{ nombre: 'Serie 1', valores: [4.3, 2.5, 3.5, 4.5] }, { nombre: 'Serie 2', valores: [2.4, 4.4, 1.8, 2.8] }] }];
    let tipo = 'columnas', ds = datos[0];
    const tipos = h('div', { class: 'dp-sa-cats', role: 'listbox', 'aria-label': 'Tipos de gráfico' });
    const lista = h('select', { 'aria-label': 'Datos', onchange: (e) => { ds = datos.find((x) => x.id === e.target.value); dibujar(); } }, datos.map((x) => h('option', { value: x.id }, x.nombre)));
    const prev = h('div', { class: 'dp-graf-prev' });
    const dibujar = () => {
      tipos.innerHTML = '';
      for (const [v, n, d] of TIPOS_GRAF) tipos.appendChild(h('button', { class: v === tipo ? 'sel' : '', role: 'option', 'aria-selected': v === tipo ? 'true' : 'false', title: d, onclick: () => { tipo = v; dibujar(); } }, n, h('small', null, d)));
      LT.graficos.dibujar(prev, { ancho: 420, alto: 250, tipo, categorias: ds.categorias, series: ds.series, titulo: 'Título del gráfico', formato: ds.formato, colores: R.variante(ed.p).acentos });
    };
    dibujar();
    LT.ui.modal({ titulo: 'Insertar gráfico', clase: 'modal-ancho', cuerpo: h('div', { class: 'dp-sa' }, tipos, h('div', null, h('label', { class: 'dp-campo' }, h('span', null, 'Datos (en PowerPoint se escriben en una hoja de Excel)'), lista), prev)), botones: [{ texto: 'Cancelar', valor: false }, { texto: 'Aceptar', primario: true, valor: true }] }).then((ok) => {
      if (!ok) return;
      ed.insertar({ tipo: 'grafico', subtipo: tipo, datos: JSON.parse(JSON.stringify(ds)), titulo: 'Título del gráfico', x: 66, y: 140, w: 828, h: 350, leyenda: true }, { enMarcador: true });
      ed.panel = 'formato'; ed.render();
    });
  }
  function menuVideo(ed, ancla) {
    ed.menu(ancla, (m, cerrar) => {
      m.appendChild(h('div', { class: 'dp-menu-tit' }, 'Insertar video desde · Este dispositivo…'));
      for (const v of K.MEDIOS.video) m.appendChild(h('button', { class: 'dp-menu-item', onclick: () => { cerrar(); ed.insertar({ tipo: 'video', src: v.id, w: 480, h: 270, opciones: { inicio: 'secuencia' }, alt: '' }); ed.panel = 'formato'; ed.render(); } }, '🎬 ' + v.archivo + ' (' + v.dur + ' s)'));
    });
  }
  function menuAudio(ed, ancla) {
    ed.menu(ancla, (m, cerrar) => {
      m.appendChild(h('div', { class: 'dp-menu-tit' }, 'Audio en Mi PC…'));
      for (const a of K.MEDIOS.audio) m.appendChild(h('button', { class: 'dp-menu-item', onclick: () => { cerrar(); ed.insertar({ tipo: 'audio', src: a.id, w: 48, h: 48, opciones: { inicio: 'secuencia' } }); ed.panel = 'formato'; ed.render(); } }, '🎵 ' + a.archivo + ' (' + a.dur + ' s)'));
    });
  }
  function textoVinculo(ed, v) {
    if (!v) return '';
    if (v.tipo === 'url') return 'Vínculo a la página: ' + v.url;
    const esp = { primera: 'Primera diapositiva', ultima: 'Última diapositiva', siguiente: 'Diapositiva siguiente', anterior: 'Diapositiva anterior' }[v.destino];
    if (esp) return 'Vínculo a: ' + esp;
    const i = ed.p.diapositivas.findIndex((d) => d.id === v.destino);
    return i >= 0 ? 'Vínculo a la diapositiva ' + (i + 1) + ': ' + (R.tituloDe(ed.p.diapositivas[i]) || '(sin título)') : 'Vínculo a una diapositiva que ya no existe';
  }
  function dialogoVinculo(ed) {
    const o = ed.objSel()[0];
    if (!o) { ed.toast('Selecciona primero el objeto o cuadro de texto que será el vínculo.'); return; }
    const actual = o.vinculo || {};
    let modo = actual.tipo === 'diapositiva' ? 'lugar' : 'web';
    const url = h('input', { type: 'url', value: actual.tipo === 'url' ? actual.url : 'https://', 'aria-label': 'Dirección', style: { width: '100%' } });
    const info = h('input', { type: 'text', value: actual.info || '', 'aria-label': 'Info en pantalla', style: { width: '100%' } });
    const lugares = [['primera', 'Primera diapositiva'], ['ultima', 'Última diapositiva'], ['siguiente', 'Diapositiva siguiente'], ['anterior', 'Diapositiva anterior']].concat(ed.p.diapositivas.map((d, i) => [d.id, (i + 1) + '. ' + (R.tituloDe(d) || '(sin título)')]));
    const lista = h('select', { size: 8, 'aria-label': 'Seleccione un lugar de este documento', style: { width: '100%' } }, lugares.map(([v, n]) => h('option', { value: v, selected: actual.destino === v ? true : null }, n)));
    const panelWeb = h('div', null, h('label', { class: 'dp-campo' }, h('span', null, 'Dirección'), url));
    const panelLugar = h('div', null, h('label', { class: 'dp-campo' }, h('span', null, 'Seleccione un lugar de este documento'), lista));
    const tabs = h('div', { class: 'dp-vinc-tabs' });
    const mostrar = () => {
      tabs.querySelectorAll('button').forEach((b) => b.classList.toggle('sel', b.dataset.m === modo));
      panelWeb.style.display = modo === 'web' ? '' : 'none';
      panelLugar.style.display = modo === 'lugar' ? '' : 'none';
    };
    tabs.append(h('button', { 'data-m': 'web', onclick: () => { modo = 'web'; mostrar(); } }, '🌐 Archivo o página web existente'), h('button', { 'data-m': 'lugar', onclick: () => { modo = 'lugar'; mostrar(); } }, '📑 Lugar de este documento'));
    mostrar();
    LT.ui.modal({ titulo: 'Insertar vínculo', clase: 'modal-ancho', enterAcepta: false, cuerpo: h('div', { class: 'dp-vinc' }, h('p', { class: 'dp-nota' }, 'Objeto: ' + o.nombre), tabs, panelWeb, panelLugar, h('label', { class: 'dp-campo' }, h('span', null, 'Info en pantalla (opcional)'), info)), botones: [{ texto: 'Cancelar', valor: false }, o.vinculo ? { texto: 'Quitar vínculo', valor: 'quitar' } : null, { texto: 'Aceptar', primario: true, valor: true }].filter(Boolean) }).then((r) => {
      if (r === 'quitar') { ed.propiedad('vinculo', undefined); return; }
      if (!r) return;
      if (modo === 'web') {
        const u = url.value.trim();
        if (!/^https?:\/\/[^\s.]+\.[^\s]+/i.test(u) && !/^mailto:/i.test(u)) { ed.toast('Escribe una dirección completa, por ejemplo https://www.gob.mx/salud', 'error'); return; }
        ed.propiedad('vinculo', { tipo: 'url', url: u, info: info.value.trim() || undefined });
      } else {
        if (!lista.value) { ed.toast('Elige la diapositiva de destino.', 'error'); return; }
        ed.propiedad('vinculo', { tipo: 'diapositiva', destino: lista.value, info: info.value.trim() || undefined });
      }
    });
  }
  function insertar(ed) {
    const o = ed.objSel()[0];
    return [
      grupo('Diapositivas', grande('nuevaDiapo', 'Nueva diapositiva', (b) => menuDisenos(ed, b, (id) => ed.nuevaDiapositiva(id)), { menu: true })),
      grupo('Tablas', grande('tablaIns', 'Tabla', (b) => menuTabla(ed, b), { menu: true })),
      grupo('Imágenes', grande('imagen', 'Imágenes', () => dialogoImagenes(ed))),
      grupo('Ilustraciones', grande('forma', 'Formas', (b) => menuFormas(ed, b), { menu: true }), grande('icono', 'Iconos', () => dialogoIconos(ed)), grande('smartart', 'SmartArt', () => dialogoSmartArt(ed)), grande('grafico', 'Gráfico', () => dialogoGrafico(ed))),
      grupo('Vínculos', grande('vinculo', 'Vínculo', () => dialogoVinculo(ed), { desactivado: !o, titulo: o ? 'Insertar vínculo (Ctrl+Alt+K)' : 'Selecciona primero un objeto para convertirlo en vínculo' })),
      grupo('Texto', grande('cuadroTexto', 'Cuadro de texto', () => { const n = ed.insertar({ tipo: 'texto', texto: 'Texto', w: 360, h: 60, estilo: { tam: 20 } }); setTimeout(() => ed.editarTexto(n), 30); })),
      grupo('Multimedia', grande('video', 'Video', (b) => menuVideo(ed, b), { menu: true }), grande('audio', 'Audio', (b) => menuAudio(ed, b), { menu: true })),
    ];
  }

  /* ---------------------------------------------------------------- Diseño */
  function miniTema(t, v, sel) {
    const deco = t.deco(v, 'tituloObjetos').slice(0, 2).map((r) => h('i', { style: { left: r.x / 9.6 + '%', top: r.y / 5.4 + '%', width: r.w / 9.6 + '%', height: r.h / 5.4 + '%', background: r.color, borderRadius: r.forma === 'elipse' ? '50%' : '0', opacity: r.opacidad == null ? 1 : r.opacidad } }));
    return h('div', { class: 'dp-mini-tema' + (sel ? ' sel' : ''), style: { background: v.fondo, color: v.titulo } }, deco, h('b', { style: { fontFamily: R.pila(t.fuentes.titulo) } }, 'Aa'), h('span', { class: 'dp-mini-tema-ac' }, v.acentos.slice(0, 4).map((c) => h('i', { style: { background: c } }))));
  }
  function diseno(ed) {
    const temas = h('div', { class: 'dp-galeria-cinta temas', role: 'listbox', 'aria-label': 'Temas' });
    for (const t of K.TEMAS) temas.appendChild(h('button', { class: 'dp-tile-tema', role: 'option', 'aria-selected': ed.p.tema === t.id ? 'true' : 'false', title: t.nombre, onclick: () => ed.aplicarTema(t.id) }, miniTema(t, t.variantes[0], ed.p.tema === t.id), h('span', null, t.nombre)));
    const t = K.tema(ed.p.tema);
    const vars = h('div', { class: 'dp-galeria-cinta variantes', role: 'listbox', 'aria-label': 'Variantes' });
    t.variantes.forEach((v, i) => vars.appendChild(h('button', { class: 'dp-tile-tema', role: 'option', 'aria-selected': (ed.p.variante || 0) === i ? 'true' : 'false', title: v.nombre, onclick: () => ed.aplicarVariante(i) }, miniTema(t, v, (ed.p.variante || 0) === i), h('span', null, v.nombre))));
    return [
      grupo('Temas', temas),
      grupo('Variantes', vars),
      grupo('Personalizar', columna(chico('relleno', 'Formato del fondo', () => { ed.sel = []; ed.panel = 'formato'; ed.render(); }), h('span', { class: 'dp-nota-cinta' }, 'Diapositiva 16:9'))),
    ];
  }

  /* ---------------------------------------------------------- Transiciones */
  function iconoTransicion(id) {
    const m = { ninguna: '∅', transformacion: '◐', desvanecer: '◌', empujar: '⇨', barrido: '▷', dividir: '⇹', revelar: '◑', cortar: '▮', forma: '◯', descubrir: '⇤', cubrir: '⇥', cortinas: '⧘', voltear: '↻', galeria: '▤', cubo: '⬚', zoom: '⊕', vortice: '✺' };
    return m[id] || '★';
  }
  function transiciones(ed) {
    const t = ed.d.transicion || { efecto: 'ninguna' };
    const def = K.transicion(t.efecto);
    const gal = h('div', { class: 'dp-galeria-cinta efectos', role: 'listbox', 'aria-label': 'Transición a esta diapositiva' });
    let grupoPrev = null;
    for (const x of K.TRANSICIONES) {
      if (x.grupo !== grupoPrev) { gal.appendChild(h('span', { class: 'dp-gal-sep' }, x.grupo)); grupoPrev = x.grupo; }
      gal.appendChild(h('button', { class: 'dp-tile-efecto' + (t.efecto === x.id ? ' sel' : ''), role: 'option', 'aria-selected': t.efecto === x.id ? 'true' : 'false', title: x.nombre + (x.grupo === 'Llamativo' ? ' (llamativa: úsala con moderación)' : ''), 'data-efecto': x.id, onclick: () => ed.transicion({ efecto: x.id }) }, h('span', { class: 'dp-ef-ic' }, iconoTransicion(x.id)), h('span', null, x.nombre)));
    }
    const dur = h('input', { type: 'number', min: 0.01, max: 59, step: 0.25, value: t.efecto === 'ninguna' ? '' : (t.duracion == null ? def.dur : t.duracion), disabled: t.efecto === 'ninguna' ? true : null, 'aria-label': 'Duración de la transición en segundos', onchange: (e) => ed.transicion({ duracion: Math.max(0.01, parseFloat(e.target.value) || def.dur) }) });
    const desp = h('input', { type: 'number', min: 0, max: 3600, step: 0.5, value: t.despues == null ? '' : t.despues, placeholder: '00.00', 'aria-label': 'Avanzar después de (segundos)', onchange: (e) => { const v = e.target.value === '' ? null : Math.max(0, parseFloat(e.target.value) || 0); ed.transicion({ despues: v }); } });
    const sonido = h('select', { 'aria-label': 'Sonido de la transición', onchange: (e) => ed.transicion({ sonido: e.target.value === '[Sin sonido]' ? null : e.target.value }) }, K.SONIDOS.map((s) => h('option', { value: s, selected: (t.sonido || '[Sin sonido]') === s ? true : null }, s)));
    return [
      grupo('Vista previa', grande('ojo', 'Vista previa', () => ed.vistaPreviaTransicion())),
      grupo('Transición a esta diapositiva', gal, grande('estilos', 'Opciones de efectos', (b) => ed.menuSimple(b, (def.opciones || []).map((op) => ({ texto: (t.opcion === op ? '✓ ' : '') + op, accion: () => ed.transicion({ opcion: op }) }))), { menu: true, desactivado: !(def.opciones || []).length })),
      grupo('Intervalos',
        columna(h('label', { class: 'dp-fila-cinta' }, 'Sonido:', sonido), h('label', { class: 'dp-fila-cinta' }, 'Duración (s):', dur), chico('copiar', 'Aplicar a todas', () => { ed.transicion(null, true); ed.toast('Se aplicó la misma transición a todas las diapositivas.'); }, { titulo: 'Aplicar la transición, la duración y el avance de esta diapositiva a todas' })),
        columna(h('div', { class: 'dp-et-cinta' }, 'Avanzar a la diapositiva'), check('Al hacer clic con el mouse', t.alHacerClic !== false, (v) => ed.transicion({ alHacerClic: v })), h('label', { class: 'dp-fila-cinta' }, h('input', { type: 'checkbox', checked: t.despues != null ? true : null, 'aria-label': 'Activar avance automático', onchange: (e) => ed.transicion({ despues: e.target.checked ? 5 : null }) }), 'Después de (s):', desp))),
    ];
  }

  /* ----------------------------------------------------------- Animaciones */
  function iconoAnim(a) {
    const m = { aparecer: '✷', desvanecer: '◌', desplazar: '⇧', flotar: '⇡', dividir: '⇹', barrido: '▷', zoom: '⊕', crecer: '↻', rebote: '⤵', impulso: '◉', pulsoColor: '◍', balancin: '⤨', girar: '⟳', aumentar: '⇱', transparencia: '◇', desaparecer: '✷', desvanecerSalida: '◌', desplazarSalida: '⇩', flotarSalida: '⇣', zoomSalida: '⊖', reducir: '↺', lineas: '│', arcos: '⌒', giros: '↱', formas: '○', bucles: '∞' };
    return m[a.id] || '★';
  }
  function galeriaAnim(ed, accion, seleccionado, enMenu) {
    const gal = h('div', { class: 'dp-galeria-cinta efectos anim' + (enMenu ? ' en-menu' : ''), role: 'listbox', 'aria-label': 'Animaciones' });
    gal.appendChild(h('button', { class: 'dp-tile-efecto' + (!seleccionado ? ' sel' : ''), title: 'Ninguna', 'data-efecto': 'ninguna', onclick: () => accion('ninguna') }, h('span', { class: 'dp-ef-ic' }, '∅'), h('span', null, 'Ninguna')));
    let cat = null;
    for (const a of K.ANIMACIONES) {
      if (a.cat !== cat) { cat = a.cat; gal.appendChild(h('span', { class: 'dp-gal-sep', style: { color: K.COLOR_CAT[a.cat] } }, K.CAT[a.cat])); }
      gal.appendChild(h('button', { class: 'dp-tile-efecto' + (seleccionado === a.id ? ' sel' : ''), role: 'option', 'aria-selected': seleccionado === a.id ? 'true' : 'false', title: K.CAT[a.cat] + ': ' + a.nombre, 'data-efecto': a.id, onclick: () => accion(a.id) }, h('span', { class: 'dp-ef-ic', style: { color: K.COLOR_CAT[a.cat] } }, iconoAnim(a)), h('span', null, a.nombre)));
    }
    return gal;
  }
  function animaciones(ed) {
    const objetivo = ed.animacionesObjetivo();
    const a = objetivo[0];
    const def = a ? K.animacion(a.efecto) : null;
    const hay = !!ed.sel.length;
    const ini = h('select', { 'aria-label': 'Inicio', disabled: a ? null : true, onchange: (e) => ed.propAnim('inicio', e.target.value) }, K.INICIOS.map(([v, n]) => h('option', { value: v, selected: a && a.inicio === v ? true : null }, n)));
    const dur = h('input', { type: 'number', min: 0, max: 59, step: 0.25, value: a ? a.duracion : '', disabled: a ? null : true, 'aria-label': 'Duración en segundos', onchange: (e) => ed.propAnim('duracion', Math.max(0, parseFloat(e.target.value) || 0)) });
    const ret = h('input', { type: 'number', min: 0, max: 59, step: 0.25, value: a ? a.retraso || 0 : '', disabled: a ? null : true, 'aria-label': 'Retraso en segundos', onchange: (e) => ed.propAnim('retraso', Math.max(0, parseFloat(e.target.value) || 0)) });
    return [
      grupo('Vista previa', grande('ojo', 'Vista previa', () => ed.vistaPreviaAnimacion())),
      grupo('Animación', galeriaAnim(ed, (id) => ed.animar(id, false), a ? a.efecto : null), grande('estilos', 'Opciones de efectos', (b) => ed.menuSimple(b, ((def && def.opciones) || []).map((op) => ({ texto: (a.opcion === op ? '✓ ' : '') + op, accion: () => ed.propAnim('opcion', op) }))), { menu: true, desactivado: !(def && def.opciones && def.opciones.length) })),
      grupo('Animación avanzada',
        grande('animacion', 'Agregar animación', (b) => { if (!hay) { ed.toast('Selecciona primero un objeto.'); return; } ed.menu(b, (m, cerrar) => { m.appendChild(h('div', { class: 'dp-menu-tit' }, 'Agregar otro efecto al objeto seleccionado')); m.appendChild(galeriaAnim(ed, (id) => { cerrar(); if (id !== 'ninguna') ed.animar(id, true); }, null, true)); }, 'ancho'); }, { menu: true, desactivado: !hay }),
        grande('panelAnim', 'Panel de animación', () => { ed.panel = ed.panel === 'animacion' ? 'formato' : 'animacion'; ed.render(); }, { activo: ed.panel === 'animacion' })),
      grupo('Intervalos',
        columna(h('label', { class: 'dp-fila-cinta' }, 'Inicio:', ini), h('label', { class: 'dp-fila-cinta' }, 'Duración (s):', dur), h('label', { class: 'dp-fila-cinta' }, 'Retraso (s):', ret)),
        columna(h('div', { class: 'dp-et-cinta' }, 'Reordenar animación'), chico(null, '▲ Mover antes', () => ed.moverAnim(-1), { desactivado: objetivo.length !== 1 }), chico(null, '▼ Mover después', () => ed.moverAnim(1), { desactivado: objetivo.length !== 1 }))),
    ];
  }

  /* ------------------------------------------------------- Presentación */
  function dialogoConfigurar(ed) {
    const c = Object.assign({}, ed.p.config);
    const radio = (nombre, valor, texto, actual) => h('label', { class: 'dp-radio' }, h('input', { type: 'radio', name: nombre, value: valor, checked: actual === valor ? true : null }), texto);
    const cuerpo = h('form', { class: 'dp-config' },
      h('fieldset', null, h('legend', null, 'Tipo de presentación'),
        radio('tipo', 'orador', 'Presentado por un orador (pantalla completa)', c.tipo),
        radio('tipo', 'individual', 'Examinada de forma individual (ventana)', c.tipo),
        radio('tipo', 'quiosco', 'Examinada en exposición (pantalla completa)', c.tipo)),
      h('fieldset', null, h('legend', null, 'Opciones de presentación'),
        h('label', { class: 'dp-check' }, h('input', { type: 'checkbox', name: 'repetir', checked: c.repetir || c.tipo === 'quiosco' ? true : null, disabled: c.tipo === 'quiosco' ? true : null }), "Repetir el ciclo hasta presionar 'Esc'"),
        h('label', { class: 'dp-check' }, h('input', { type: 'checkbox', name: 'sinAnimacion', checked: c.sinAnimacion ? true : null }), 'Sin animación')),
      h('fieldset', null, h('legend', null, 'Avance de diapositivas'),
        radio('avance', 'manual', 'Manual', c.avance),
        radio('avance', 'intervalos', 'Usar los intervalos de diapositiva guardados', c.avance)),
      h('fieldset', null, h('legend', null, 'Varios monitores'),
        h('label', { class: 'dp-check' }, h('input', { type: 'checkbox', name: 'moderador', checked: c.moderador ? true : null }), 'Usar vista del moderador')));
    cuerpo.addEventListener('change', () => {
      const q = cuerpo.querySelector('input[name=tipo]:checked').value;
      const rep = cuerpo.querySelector('input[name=repetir]');
      rep.disabled = q === 'quiosco';
      if (q === 'quiosco') rep.checked = true;
    });
    LT.ui.modal({ titulo: 'Configurar presentación', cuerpo, botones: [{ texto: 'Cancelar', valor: false }, { texto: 'Aceptar', primario: true, valor: true }] }).then((ok) => {
      if (!ok) return;
      const v = (n) => cuerpo.querySelector('input[name=' + n + ']:checked').value;
      const ch = (n) => cuerpo.querySelector('input[name=' + n + ']').checked;
      ed.cambiar(() => {
        ed.p.config.tipo = v('tipo');
        ed.p.config.repetir = ed.p.config.tipo === 'quiosco' ? true : ch('repetir');
        ed.p.config.sinAnimacion = ch('sinAnimacion');
        ed.p.config.avance = v('avance');
        ed.p.config.moderador = ch('moderador');
      });
      if (ed.p.config.tipo === 'quiosco') {
        const sin = ed.p.diapositivas.filter((d) => !d.oculta && !(d.transicion && d.transicion.despues != null)).length;
        if (sin || ed.p.config.avance !== 'intervalos') ed.toast('En exposición el público no puede hacer clic: cada diapositiva necesita un intervalo («Después de» o Ensayar intervalos) y «Usar los intervalos».', 'aviso');
      }
    });
  }
  function presentacion(ed) {
    const c = ed.p.config;
    return [
      grupo('Iniciar presentación con diapositivas',
        grande('play', 'Desde el principio', () => ed.presentar({ desde: 0 }), { titulo: 'Desde el principio (F5)' }),
        grande('playActual', 'Desde la diapositiva actual', () => ed.presentar({ desde: ed.idx }), { titulo: 'Desde la diapositiva actual (Mayús+F5)' })),
      grupo('Configurar',
        grande('configurar', 'Configuración de la presentación', () => dialogoConfigurar(ed), { titulo: 'Configuración de la presentación con diapositivas' }),
        grande('ocultar', 'Ocultar diapositiva', () => ed.ocultarDiapositiva(), { activo: ed.d.oculta }),
        grande('ensayar', 'Ensayar intervalos', () => ed.presentar({ desde: 0, ensayo: true })),
        columna(check('Reproducir narraciones', false, () => {}, { desactivado: true, titulo: 'El simulador no graba narraciones' }), check('Usar intervalos', c.avance === 'intervalos', (v) => ed.cambiar(() => { ed.p.config.avance = v ? 'intervalos' : 'manual'; })), check('Mostrar controles multimedia', true, () => {}, { desactivado: true }))),
      grupo('Monitores', grande('moderador', 'Vista del moderador', () => ed.presentar({ desde: ed.idx, moderador: true }), { titulo: 'Presentar con la vista del moderador (Alt+F5)', desactivado: !c.moderador || c.tipo === 'quiosco' }), columna(check('Usar vista del moderador', c.moderador, (v) => ed.cambiar(() => { ed.p.config.moderador = v; })), h('span', { class: 'dp-nota-cinta' }, 'Con un solo monitor, Alt+F5 abre la vista del moderador.'))),
    ];
  }

  /* ------------------------------------------------------- Revisar y Vista */
  function revisar(ed) {
    return [grupo('Accesibilidad', grande('accesibilidad', 'Comprobar accesibilidad', () => { ed.registrar('accesibilidad'); ed.panel = 'accesibilidad'; ed.render(); }, { activo: ed.panel === 'accesibilidad' }))];
  }
  function vista(ed) {
    return [
      grupo('Vistas de presentación', grande('normal', 'Normal', () => { ed.vista = 'normal'; ed.render(); }, { activo: ed.vista === 'normal' }), grande('clasificador', 'Clasificador de diapositivas', () => { ed.vista = 'clasificador'; ed.render(); }, { activo: ed.vista === 'clasificador' })),
      grupo('Mostrar', columna(check('Notas', ed.notasVisibles, (v) => { ed.notasVisibles = v; ed.render(); }), check('Panel de formato', !!ed.panel, (v) => { ed.panel = v ? 'formato' : null; ed.render(); }))),
    ];
  }

  LT.DiapoCinta = { construir, PESTANAS, dialogoVinculo, textoVinculo, dialogoConfigurar, dialogoImagenes, dialogoIconos, dialogoSmartArt, dialogoGrafico, insertarTabla, iconoTransicion, iconoAnim };
})();

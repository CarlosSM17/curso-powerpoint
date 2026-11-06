/* Simulador de PowerPoint (LT.Diapo): modelo de la presentación y editor en el navegador.
   La cinta de opciones vive en diapo-cinta.js y la presentación con diapositivas en diapo-show.js.

   Uso:  const ed = new LT.Diapo(contenedor, { presentacion, herramientas: ['inicio', 'insertar', …], alto });
         ed.p           presentación actual (modelo)
         ed.on('cambio', fn)
         ed.registro    acciones observables (presentaciones, vista del moderador, ensayos…) */
(function () {
  'use strict';
  const LT = window.LT;
  const { h, clamp } = LT.u;
  const K = LT.DIAPO;
  const R = LT.DiapoRender;
  const clonar = (x) => JSON.parse(JSON.stringify(x));

  /* ================================================================ modelo */
  const CONFIG = { tipo: 'orador', repetir: false, avance: 'intervalos', moderador: true, sinAnimacion: false };
  const NOMBRE_PH = { titulo: 'Título', subtitulo: 'Subtítulo', cuerpo: 'Marcador de contenido', cuerpo2: 'Marcador de contenido', texto: 'Marcador de texto', enc1: 'Marcador de texto', enc2: 'Marcador de texto' };
  const NOMBRE_TIPO = { texto: 'CuadroTexto', imagen: 'Imagen', icono: 'Icono', smartart: 'Diagrama', tabla: 'Tabla', grafico: 'Gráfico', video: 'Video', audio: 'Audio' };

  function nuevoId(p, pref) { p.sigId = p.sigId || 1; return pref + (p.sigId++); }
  function nombreLibre(d, base) {
    let n = d.objetos.length + 1;
    const usados = new Set(d.objetos.map((o) => o.nombre));
    while (usados.has(base + ' ' + n)) n++;
    return base + ' ' + n;
  }
  function baseNombre(o) {
    if (o.ph) return NOMBRE_PH[o.ph] || 'Marcador';
    if (o.tipo === 'forma') return (K.FORMAS.find((f) => f.id === o.forma) || K.FORMAS[0]).nombre;
    return NOMBRE_TIPO[o.tipo] || 'Objeto';
  }
  function placeholder(p, def, texto) {
    return { id: nuevoId(p, 'o'), tipo: 'texto', ph: def.ph, x: def.x, y: def.y, w: def.w, h: def.h, texto: texto || '' };
  }
  function crearDiapo(p, diseno, textos) {
    const def = K.diseno(diseno);
    const d = { id: nuevoId(p, 'd'), diseno: def.id, objetos: [], animaciones: [], transicion: null, notas: '', oculta: false, seccion: null };
    for (const ph of def.ph) { const o = placeholder(p, ph, (textos || {})[ph.ph]); d.objetos.push(o); o.nombre = nombreLibre(d, baseNombre(o)); }
    return d;
  }
  /* Cambia el diseño conservando el texto de los marcadores con el mismo papel */
  function aplicarDiseno(p, d, diseno) {
    const def = K.diseno(diseno);
    const viejos = d.objetos.filter((o) => o.ph);
    const libres = d.objetos.filter((o) => !o.ph);
    const nuevos = [];
    const sobrantes = [];
    const usados = new Set();
    // 1) mismo papel; 2) los marcadores de texto restantes toman el texto que sobró, en orden
    const asignado = {};
    for (const ph of def.ph) { const o = viejos.find((v) => !usados.has(v) && v.ph === ph.ph); if (o) { usados.add(o); asignado[ph.ph] = o; } }
    for (const ph of def.ph) {
      if (asignado[ph.ph] || ph.ph === 'titulo' || /^enc/.test(ph.ph)) continue;
      const o = viejos.find((v) => !usados.has(v) && v.ph !== 'titulo' && String(v.texto || '').trim());
      if (o) { usados.add(o); asignado[ph.ph] = o; }
    }
    for (const ph of def.ph) {
      const o = asignado[ph.ph];
      if (o) { o.ph = ph.ph; Object.assign(o, { x: ph.x, y: ph.y, w: ph.w, h: ph.h }); nuevos.push(o); }
      else nuevos.push(placeholder(p, ph, ''));
    }
    // el texto que no cabe en el nuevo diseño se conserva como cuadro de texto (como hace PowerPoint)
    for (const v of viejos) if (!usados.has(v) && String(v.texto || '').trim()) { delete v.ph; v.estilo = Object.assign({ tam: 18 }, v.estilo || {}); sobrantes.push(v); }
    d.objetos = nuevos.concat(libres, sobrantes);
    d.diseno = def.id;
    d.objetos.forEach((o) => { if (!o.nombre) o.nombre = nombreLibre(d, baseNombre(o)); });
    const ids = new Set(d.objetos.map((o) => o.id));
    d.animaciones = (d.animaciones || []).filter((a) => ids.has(a.objeto));
  }

  function normalizar(p) {
    p.tema = p.tema || 'office';
    p.variante = p.variante || 0;
    p.diapositivas = p.diapositivas || [];
    p.secciones = p.secciones || [];
    p.config = Object.assign({}, CONFIG, p.config || {});
    p.sigId = p.sigId || 1;
    const ids = new Set();
    for (const d of p.diapositivas) {
      if (!d.id || ids.has(d.id)) d.id = nuevoId(p, 'd');
      ids.add(d.id);
      d.objetos = d.objetos || [];
      d.animaciones = d.animaciones || [];
      if (d.notas == null) d.notas = '';
      for (const o of d.objetos) {
        if (!o.id || ids.has(o.id)) o.id = nuevoId(p, 'o');
        ids.add(o.id);
        if (!o.nombre) o.nombre = nombreLibre(d, baseNombre(o));
      }
      const objs = new Set(d.objetos.map((o) => o.id));
      d.animaciones = d.animaciones.filter((a) => objs.has(a.objeto));
      for (const a of d.animaciones) { if (!a.id || ids.has(a.id)) a.id = nuevoId(p, 'a'); ids.add(a.id); if (!a.inicio) a.inicio = 'clic'; }
    }
    // secciones contiguas y sin vacías
    const vistas = [];
    let previa = null;
    for (const d of p.diapositivas) {
      if (d.seccion && !p.secciones.some((s) => s.id === d.seccion)) d.seccion = null;
      if (p.secciones.length && !d.seccion) d.seccion = previa || (p.secciones[0] && p.secciones[0].id);
      if (d.seccion && vistas.includes(d.seccion) && d.seccion !== previa) d.seccion = previa;
      if (d.seccion && !vistas.includes(d.seccion)) vistas.push(d.seccion);
      previa = d.seccion;
    }
    p.secciones = vistas.map((id) => p.secciones.find((s) => s.id === id)).filter(Boolean);
    if (!p.secciones.length) p.diapositivas.forEach((d) => { d.seccion = null; });
    return p;
  }

  /* Construye una presentación a partir de una especificación compacta (para los retos):
     { tema, variante, secciones: [['Nombre', índice], …], config,
       diapositivas: [{ diseno, titulo, subtitulo, cuerpo, cuerpo2, enc1, enc2, texto, objetos: [{clave, …}],
                        notas, transicion, animaciones: [{objeto: clave, efecto, inicio, duracion, retraso, opcion}] }] } */
  function construir(spec) {
    const p = { titulo: spec.titulo || 'Presentación', tema: spec.tema || 'office', variante: spec.variante || 0, diapositivas: [], secciones: [], config: Object.assign({}, CONFIG, spec.config || {}), sigId: 1 };
    for (const s of spec.diapositivas || []) {
      const d = crearDiapo(p, s.diseno || 'tituloObjetos', s);
      for (const o of d.objetos) o.clave = o.ph;
      for (const [k, v] of Object.entries(s.estilos || {})) { const o = d.objetos.find((x) => x.ph === k); if (o) o.estilo = Object.assign({}, v); }
      for (const [k, v] of Object.entries(s.cajas || {})) { const o = d.objetos.find((x) => x.ph === k); if (o) Object.assign(o, v); }
      for (const extra of s.objetos || []) {
        const o = Object.assign({ id: nuevoId(p, 'o') }, clonar(extra));
        if (o.tipo === 'imagen' && !o.h) { const im = K.imagen(o.src); o.h = Math.round(o.w * (im ? im.alto / im.ancho : 0.75)); }
        if (!o.nombre) o.nombre = nombreLibre(d, baseNombre(o));
        d.objetos.push(o);
      }
      d.notas = s.notas || '';
      d.oculta = !!s.oculta;
      if (s.clave) d.clave = s.clave;
      if (s.fondo) d.fondo = s.fondo;
      if (s.transicion) d.transicion = Object.assign({ efecto: 'ninguna', opcion: null, duracion: null, alHacerClic: true, despues: null, sonido: null }, s.transicion);
      for (const a of s.animaciones || []) {
        const o = d.objetos.find((x) => x.clave === a.objeto || x.nombre === a.objeto || x.ph === a.objeto);
        if (!o) continue;
        const def = K.animacion(a.efecto) || K.ANIMACIONES[1];
        const an = { id: nuevoId(p, 'a'), objeto: o.id, efecto: def.id, cat: def.cat, opcion: a.opcion || (def.opciones || [])[0] || null, inicio: a.inicio || 'clic', duracion: a.duracion == null ? def.dur : a.duracion, retraso: a.retraso || 0 };
        if (def.cat === 'trayectoria') an.trayectoria = Object.assign(K.trayectoriaInicial(def.id, an.opcion), a.trayectoria || {});
        d.animaciones.push(an);
      }
      p.diapositivas.push(d);
    }
    for (const [nombre, desde] of spec.secciones || []) {
      const sec = { id: nuevoId(p, 's'), nombre };
      p.secciones.push(sec);
      p.diapositivas.forEach((d, i) => { if (i >= desde) d.seccion = sec.id; });
    }
    return normalizar(p);
  }

  /* Secciones con sus diapositivas: [{id, nombre, indices:[…]}] (null = sin secciones) */
  function secciones(p) {
    if (!p.secciones.length) return null;
    return p.secciones.map((s) => ({ id: s.id, nombre: s.nombre, indices: p.diapositivas.map((d, i) => (d.seccion === s.id ? i : -1)).filter((i) => i >= 0) }));
  }

  /* ---------------------------------------------------------- accesibilidad */
  function accesibilidad(p) {
    const out = [];
    const titulos = {};
    p.diapositivas.forEach((d, i) => {
      const n = i + 1;
      const t = R.tituloDe(d);
      if (!t) out.push({ tipo: 'error', diapo: i, texto: 'Diapositiva ' + n + ': falta el título.', ayuda: 'Cada diapositiva necesita un título único: los lectores de pantalla lo usan para navegar.' });
      else { if (titulos[t.toLowerCase()] != null) out.push({ tipo: 'aviso', diapo: i, texto: 'Diapositiva ' + n + ': el título «' + t + '» se repite en la diapositiva ' + (titulos[t.toLowerCase()] + 1) + '.', ayuda: 'Usa títulos distintos o agrega «(continuación)».' }); titulos[t.toLowerCase()] = i; }
      for (const o of d.objetos) {
        if (['imagen', 'icono', 'smartart', 'grafico', 'video', 'tabla'].includes(o.tipo) && o.tipo !== 'tabla' && !o.decorativo && !String(o.alt || '').trim()) out.push({ tipo: 'error', diapo: i, objeto: o.id, texto: 'Diapositiva ' + n + ': «' + o.nombre + '» no tiene texto alternativo.', ayuda: 'Describe lo que comunica o márcalo como decorativo.' });
        if ((o.tipo === 'texto' || o.tipo === 'forma') && String(o.texto || '').trim()) {
          const c = R.contrasteDe(p, d, o);
          const e = R.estilo(p, d, o);
          const minimo = e.tam >= 24 || (e.negrita && e.tam >= 18.5) ? 3 : 4.5;
          if (c < minimo) out.push({ tipo: 'error', diapo: i, objeto: o.id, texto: 'Diapositiva ' + n + ': el texto de «' + o.nombre + '» tiene poco contraste (' + c.toFixed(1) + ':1).', ayuda: 'Para texto de este tamaño se recomienda al menos ' + minimo + ':1.' });
        }
        if (imagenDeformada(o)) out.push({ tipo: 'aviso', diapo: i, objeto: o.id, texto: 'Diapositiva ' + n + ': la imagen «' + o.nombre + '» está deformada.' });
        if (o.tipo === 'video' && !(o.opciones || {}).subtitulos) out.push({ tipo: 'aviso', diapo: i, objeto: o.id, texto: 'Diapositiva ' + n + ': el video no tiene subtítulos ni descripción en las notas.', ayuda: 'Agrega en las notas una descripción breve o subtítulos.' });
      }
    });
    return out;
  }
  function imagenDeformada(o) {
    if (o.tipo !== 'imagen') return false;
    const im = K.imagen(o.src);
    const esperado = o.recorte && o.recorte.ratio ? o.recorte.ratio : (im ? im.ancho / im.alto : 4 / 3);
    return Math.abs((o.w / o.h) / esperado - 1) > 0.04;
  }

  /* ================================================================ editor */
  const HERRAMIENTAS = ['inicio', 'insertar', 'diseno', 'transiciones', 'animaciones', 'presentacion', 'revisar', 'vista'];

  class Diapo {
    constructor(cont, opts) {
      opts = opts || {};
      this.opts = opts;
      this.cont = cont;
      this.herramientas = opts.herramientas === 'todas' || !opts.herramientas ? HERRAMIENTAS.slice() : opts.herramientas;
      this.inicial = clonar(opts.presentacion && opts.presentacion.diapositivas && opts.presentacion.diapositivas[0] && opts.presentacion.diapositivas[0].objetos ? opts.presentacion : construir(opts.presentacion || { diapositivas: [{ diseno: 'titulo' }] }));
      this.p = normalizar(clonar(this.inicial));
      this.idx = 0;
      this.sel = [];
      this.selAnim = null;
      this.vista = 'normal';
      this.panel = opts.panel || 'formato';
      this.notasVisibles = opts.notas !== false;
      this.pestana = opts.pestana && this.herramientas.includes(opts.pestana) ? opts.pestana : this.herramientas[0];
      this.historia = [];
      this.futuro = [];
      this.oyentes = {};
      this.registro = { presentaciones: 0, desdeInicio: 0, moderador: 0, maxDiapoModerador: 0, notasVistas: {}, ensayos: 0, ensayosGuardados: 0, accesibilidad: 0, vistaPreviaTransicion: 0, vistaPreviaAnimacion: 0, quiosco: 0, vinculosProbados: {} };
      this.recuperarBorrador();
      this.armar();
      this.render();
    }

    /* ---------------------------------------------------------- utilidades */
    on(ev, fn) { (this.oyentes[ev] = this.oyentes[ev] || []).push(fn); }
    emitir(ev, x) { (this.oyentes[ev] || []).forEach((fn) => { try { fn(x); } catch (e) { console.error(e); } }); }
    get d() { return this.p.diapositivas[this.idx]; }
    objeto(id, d) { return (d || this.d).objetos.find((o) => o.id === id) || null; }
    objSel() { return this.sel.map((id) => this.objeto(id)).filter(Boolean); }
    toast(m, t) { LT.ui.toast(m, t); }
    registrar(k, v) { if (typeof v === 'undefined') this.registro[k] = (this.registro[k] || 0) + 1; else this.registro[k] = v; this.emitir('registro', k); }

    cambiar(fn, opc) {
      opc = opc || {};
      if (!opc.sinHistoria) { this.historia.push(JSON.stringify(this.p)); if (this.historia.length > 80) this.historia.shift(); this.futuro = []; }
      fn();
      normalizar(this.p);
      this.idx = clamp(this.idx, 0, Math.max(0, this.p.diapositivas.length - 1));
      this.sel = this.sel.filter((id) => this.objeto(id));
      if (this.selAnim && !(this.d && this.d.animaciones.some((a) => a.id === this.selAnim))) this.selAnim = null;
      this.render();
      this.guardarBorrador();
      this.emitir('cambio', this.p);
    }
    deshacer() { if (!this.historia.length) return; this.futuro.push(JSON.stringify(this.p)); this.p = JSON.parse(this.historia.pop()); this.cambiar(() => {}, { sinHistoria: true }); }
    rehacer() { if (!this.futuro.length) return; this.historia.push(JSON.stringify(this.p)); this.p = JSON.parse(this.futuro.pop()); this.cambiar(() => {}, { sinHistoria: true }); }
    restablecer() { this.p = normalizar(clonar(this.inicial)); this.historia = []; this.futuro = []; this.idx = 0; this.sel = []; this.selAnim = null; try { if (this.opts.claveBorrador) localStorage.removeItem(this.opts.claveBorrador); } catch (e) { /* */ } this.render(); this.emitir('cambio', this.p); }
    guardarBorrador() {
      if (!this.opts.claveBorrador) return;
      clearTimeout(this._tb);
      this._tb = setTimeout(() => { try { localStorage.setItem(this.opts.claveBorrador, JSON.stringify({ p: this.p, registro: this.registro })); } catch (e) { /* sin almacenamiento */ } }, 500);
    }
    recuperarBorrador() {
      if (!this.opts.claveBorrador) return;
      try {
        const b = JSON.parse(localStorage.getItem(this.opts.claveBorrador) || 'null');
        if (b && b.p && b.p.diapositivas) { this.p = normalizar(b.p); Object.assign(this.registro, b.registro || {}); this.recuperado = true; }
      } catch (e) { /* */ }
    }
    irA(i) { this.idx = clamp(i, 0, this.p.diapositivas.length - 1); this.sel = []; this.selAnim = null; this.render(); this.emitir('seleccion'); }
    seleccionar(ids, agregar) {
      ids = [].concat(ids || []);
      if (agregar) { for (const id of ids) { const k = this.sel.indexOf(id); if (k >= 0) this.sel.splice(k, 1); else this.sel.push(id); } }
      else this.sel = ids;
      this.selAnim = null;
      this.render();
      this.emitir('seleccion');
    }

    /* ------------------------------------------------------ estructura DOM */
    armar() {
      this.cont.innerHTML = '';
      this.raiz = h('div', { class: 'dp-app', tabindex: '-1', style: { '--dp-alto': (this.opts.alto || 640) + 'px' } });
      this.elCinta = h('div', { class: 'dp-cinta' });
      this.elMini = h('div', { class: 'dp-miniaturas', role: 'listbox', 'aria-label': 'Miniaturas de las diapositivas', tabindex: '0' });
      this.elLienzoCont = h('div', { class: 'dp-lienzo-cont' });
      this.elNotas = h('textarea', { class: 'dp-notas', placeholder: 'Haga clic para agregar notas', 'aria-label': 'Notas del orador', spellcheck: 'true' });
      this.elNotas.addEventListener('change', () => { const v = this.elNotas.value; if (v !== this.d.notas) this.cambiar(() => { this.d.notas = v; }); });
      this.elClasif = h('div', { class: 'dp-clasificador' });
      this.elCentro = h('div', { class: 'dp-centro' }, this.elLienzoCont, this.elNotas, this.elClasif);
      this.elPanel = h('div', { class: 'dp-panel' });
      this.elEstado = h('div', { class: 'dp-estado' });
      this.raiz.append(this.elCinta, h('div', { class: 'dp-cuerpo' }, this.elMini, this.elCentro, this.elPanel), this.elEstado);
      this.cont.appendChild(this.raiz);
      this.raiz.addEventListener('keydown', (e) => this.teclas(e));
      document.addEventListener('mousedown', (e) => { if (this.elMenu && !this.elMenu.contains(e.target) && !(this._anclaMenu && this._anclaMenu.contains(e.target))) this.cerrarMenu(); });
      if (window.ResizeObserver) { this._ro = new ResizeObserver(() => this.dibujarLienzo()); this._ro.observe(this.elLienzoCont); }
      else window.addEventListener('resize', () => this.dibujarLienzo());
    }

    render() {
      if (!this.raiz) return;
      this.raiz.classList.toggle('sin-panel', !this.panel);
      this.raiz.classList.toggle('clasificador', this.vista === 'clasificador');
      this.raiz.classList.toggle('sin-notas', !this.notasVisibles);
      this.raiz.classList.toggle('pest-animaciones', this.pestana === 'animaciones');
      if (LT.DiapoCinta) { this.elCinta.innerHTML = ''; this.elCinta.appendChild(LT.DiapoCinta.construir(this)); }
      this.dibujarMiniaturas();
      if (this.vista === 'clasificador') this.dibujarClasificador();
      else this.dibujarLienzo();
      if (document.activeElement !== this.elNotas) this.elNotas.value = this.d ? this.d.notas || '' : '';
      this.dibujarPanel();
      this.dibujarEstado();
    }

    /* ------------------------------------------------------------- menús */
    menu(ancla, construirFn, clase) {
      this.cerrarMenu();
      const m = h('div', { class: 'dp-menu ' + (clase || ''), role: 'menu' });
      construirFn(m, () => this.cerrarMenu());
      this.raiz.appendChild(m);
      const ra = ancla.getBoundingClientRect(), rr = this.raiz.getBoundingClientRect();
      let left = ra.left - rr.left, top = ra.bottom - rr.top + 2;
      m.style.left = '0px'; m.style.top = top + 'px';
      const mw = m.offsetWidth;
      if (left + mw > rr.width - 4) left = Math.max(4, rr.width - mw - 4);
      m.style.left = left + 'px';
      this.elMenu = m;
      this._anclaMenu = ancla;
      const foco = m.querySelector('button, input, select');
      if (foco) setTimeout(() => foco.focus(), 20);
      m.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); this.cerrarMenu(); ancla.focus && ancla.focus(); } });
      return m;
    }
    cerrarMenu() { if (this.elMenu) { this.elMenu.remove(); this.elMenu = null; this._anclaMenu = null; } }
    menuSimple(ancla, opciones) {
      this.menu(ancla, (m, cerrar) => {
        for (const o of opciones) {
          if (!o) { m.appendChild(h('div', { class: 'dp-menu-sep' })); continue; }
          m.appendChild(h('button', { class: 'dp-menu-item', role: 'menuitem', disabled: o.desactivado ? true : null, onclick: () => { cerrar(); o.accion(); } }, o.texto));
        }
      });
    }

    /* -------------------------------------------------------- miniaturas */
    dibujarMiniaturas() {
      const cont = this.elMini;
      const scroll = cont.scrollTop;
      cont.innerHTML = '';
      const secs = secciones(this.p);
      const items = [];
      this.p.diapositivas.forEach((d, i) => {
        if (secs) { const s = secs.find((x) => x.indices[0] === i); if (s) cont.appendChild(this.cabSeccion(s)); }
        const it = this.miniatura(d, i, this.anchoMini());
        items.push(it);
        cont.appendChild(it);
      });
      this.arrastreDiapos(cont, items, 'vertical');
      cont.scrollTop = scroll;
      const act = items[this.idx];
      if (act && (act.offsetTop < cont.scrollTop || act.offsetTop + act.offsetHeight > cont.scrollTop + cont.clientHeight)) cont.scrollTop = act.offsetTop - 30;
    }
    anchoMini() {
      const w = this.elMini.clientWidth;
      if (!w) return 136;
      if (getComputedStyle(this.elMini).flexDirection === 'row') return 96;
      return Math.max(80, Math.min(170, w - 36));
    }
    cabSeccion(s) {
      const b = h('div', { class: 'dp-seccion', 'data-seccion': s.id },
        h('span', { class: 'dp-seccion-nombre', title: 'Sección' }, '▾ ' + s.nombre), h('span', { class: 'dp-seccion-n' }, '(' + s.indices.length + ')'),
        h('button', { class: 'dp-mas', title: 'Opciones de la sección', 'aria-label': 'Opciones de la sección ' + s.nombre, onclick: (e) => { e.stopPropagation(); this.menuSeccion(e.currentTarget, s.id); } }, '⋮'));
      b.addEventListener('contextmenu', (e) => { e.preventDefault(); this.menuSeccion(b, s.id); });
      return b;
    }
    menuSeccion(ancla, id) {
      this.menuSimple(ancla, [
        { texto: 'Cambiar nombre de sección…', accion: () => this.renombrarSeccion(id) },
        { texto: 'Quitar sección', accion: () => this.quitarSeccion(id) },
      ]);
    }
    miniatura(d, i, ancho) {
      const pasos = R.pasos(d);
      const marca = h('div', { class: 'dp-mini-marcas' },
        h('span', { class: 'dp-mini-num' + (d.oculta ? ' oculta' : '') }, String(i + 1)),
        d.transicion && d.transicion.efecto !== 'ninguna' ? h('span', { class: 'dp-mini-ic', title: 'Transición: ' + K.transicion(d.transicion.efecto).nombre }, '★') : null,
        pasos.length ? h('span', { class: 'dp-mini-ic', title: d.animaciones.length + ' animaciones' }, '✦') : null);
      const it = h('div', { class: 'dp-mini' + (i === this.idx ? ' activa' : '') + (d.oculta ? ' oculta' : ''), role: 'option', 'aria-selected': i === this.idx ? 'true' : 'false', 'aria-label': 'Diapositiva ' + (i + 1) + (R.tituloDe(d) ? ': ' + R.tituloDe(d) : ''), 'data-indice': i, tabindex: '-1' },
        marca, R.escalada(this.p, d, ancho, { modo: 'mini' }),
        i === this.idx ? h('button', { class: 'dp-mas', title: 'Opciones de la diapositiva', 'aria-label': 'Opciones de la diapositiva ' + (i + 1), onclick: (e) => { e.stopPropagation(); this.menuDiapo(e.currentTarget, i); } }, '⋮') : null);
      it.addEventListener('contextmenu', (e) => { e.preventDefault(); this.irA(i); this.menuDiapo(this.elMini.querySelector('.dp-mini.activa') || it, i); });
      return it;
    }
    menuDiapo(ancla, i) {
      const n = this.p.diapositivas.length;
      this.menuSimple(ancla, [
        { texto: 'Nueva diapositiva', accion: () => this.nuevaDiapositiva() },
        { texto: 'Duplicar diapositiva', accion: () => this.duplicarDiapositiva() },
        { texto: 'Eliminar diapositiva', desactivado: n <= 1, accion: () => this.eliminarDiapositiva() },
        null,
        { texto: 'Agregar sección', accion: () => this.agregarSeccion() },
        null,
        { texto: 'Mover hacia arriba', desactivado: i === 0, accion: () => this.moverDiapositiva(i, i - 1) },
        { texto: 'Mover hacia abajo', desactivado: i >= n - 1, accion: () => this.moverDiapositiva(i, i + 1) },
        null,
        { texto: this.p.diapositivas[i].oculta ? 'Mostrar diapositiva' : 'Ocultar diapositiva', accion: () => this.ocultarDiapositiva() },
      ]);
    }
    /* Arrastrar miniaturas para reordenar (lista vertical o cuadrícula) */
    arrastreDiapos(cont, items, modoBase) {
      items.forEach((it, i) => {
        const modo = modoBase === 'vertical' && getComputedStyle(cont).flexDirection === 'row' ? 'cuadricula' : modoBase;
        it.addEventListener('pointerdown', (e) => {
          if (e.button !== 0 || e.target.closest('.dp-mas')) return;
          const x0 = e.clientX, y0 = e.clientY;
          let arrastrando = false, destino = i, linea = null;
          const mover = (ev) => {
            if (!arrastrando && Math.hypot(ev.clientX - x0, ev.clientY - y0) > 6) {
              arrastrando = true;
              it.classList.add('arrastrando');
              linea = h('div', { class: 'dp-insercion' + (modo === 'cuadricula' ? ' vertical' : '') });
              cont.appendChild(linea);
            }
            if (!arrastrando) return;
            ev.preventDefault();
            const rc = cont.getBoundingClientRect();
            destino = items.length;
            for (let k = 0; k < items.length; k++) {
              const r = items[k].getBoundingClientRect();
              const antes = modo === 'cuadricula' ? (ev.clientY < r.bottom && ev.clientX < r.left + r.width / 2) || ev.clientY < r.top : ev.clientY < r.top + r.height / 2;
              if (antes) { destino = k; break; }
            }
            const ref = items[Math.min(destino, items.length - 1)].getBoundingClientRect();
            if (modo === 'cuadricula') {
              const x = destino < items.length ? ref.left - 6 : ref.right + 4;
              Object.assign(linea.style, { left: x - rc.left + cont.scrollLeft + 'px', top: ref.top - rc.top + cont.scrollTop + 'px', height: ref.height + 'px' });
            } else {
              const y = destino < items.length ? ref.top - 4 : ref.bottom + 2;
              Object.assign(linea.style, { top: y - rc.top + cont.scrollTop + 'px' });
            }
          };
          const soltar = () => {
            document.removeEventListener('pointermove', mover);
            document.removeEventListener('pointerup', soltar);
            if (linea) linea.remove();
            it.classList.remove('arrastrando');
            if (arrastrando) {
              const a = destino > i ? destino - 1 : destino;
              if (a !== i) this.moverDiapositiva(i, a);
            } else this.irA(i);
          };
          document.addEventListener('pointermove', mover);
          document.addEventListener('pointerup', soltar);
        });
      });
    }

    /* ---------------------------------------------------- clasificador */
    dibujarClasificador() {
      const c = this.elClasif;
      c.innerHTML = '';
      const secs = secciones(this.p);
      const items = [];
      const grid = h('div', { class: 'dp-clasif-grid' });
      this.p.diapositivas.forEach((d, i) => {
        if (secs) { const s = secs.find((x) => x.indices[0] === i); if (s) grid.appendChild(h('div', { class: 'dp-clasif-sec' }, this.cabSeccion(s))); }
        const t = d.transicion;
        const pie = h('div', { class: 'dp-clasif-pie' }, h('span', null, String(i + 1)), t && t.efecto !== 'ninguna' ? h('span', { title: 'Transición' }, '★') : null, d.animaciones.length ? h('span', { title: 'Animaciones' }, '✦') : null, t && t.despues != null ? h('span', { class: 'dp-clasif-tiempo', title: 'Avanza automáticamente después de' }, tiempoTxt(t.despues)) : null);
        const it = h('div', { class: 'dp-clasif-item' + (i === this.idx ? ' activa' : '') + (d.oculta ? ' oculta' : ''), 'data-indice': i }, R.escalada(this.p, d, 176, { modo: 'mini' }), pie);
        it.addEventListener('dblclick', () => { this.vista = 'normal'; this.irA(i); });
        it.addEventListener('contextmenu', (e) => { e.preventDefault(); this.irA(i); this.menuDiapo(it, i); });
        items.push(it);
        grid.appendChild(it);
      });
      c.appendChild(grid);
      this.arrastreDiapos(grid, items, 'cuadricula');
    }

    /* ------------------------------------------------------------ lienzo */
    dibujarLienzo() {
      if (this.vista === 'clasificador' || !this.d) return;
      const cont = this.elLienzoCont;
      const aw = Math.max(200, cont.clientWidth - 24), ah = Math.max(120, cont.clientHeight - 20);
      const s = Math.min(aw / K.ANCHO, ah / K.ALTO);
      this.escala = s;
      cont.innerHTML = '';
      const marco = R.escalada(this.p, this.d, Math.round(K.ANCHO * s), { modo: 'editor' });
      marco.classList.add('dp-lienzo');
      const diapo = marco.firstChild;
      this.elDiapo = diapo;
      this.elMarco = marco;
      // marcas sobre los objetos: selección, números de animación y trayectorias
      const capa = h('div', { class: 'dp-capa' });
      diapo.appendChild(capa);
      this.elCapa = capa;
      for (const o of this.d.objetos) {
        const el = diapo.querySelector('.dp-obj[data-id="' + o.id + '"]');
        if (!el) continue;
        el.addEventListener('pointerdown', (e) => this.alPresionarObjeto(e, o));
        el.addEventListener('dblclick', (e) => { e.stopPropagation(); this.editarTexto(o); });
      }
      diapo.addEventListener('pointerdown', (e) => { if (e.target === diapo || e.target.classList.contains('dp-deco')) { this.cerrarMenu(); if (this.sel.length || this.selAnim) this.seleccionar([]); this.raiz.focus({ preventScroll: true }); } });
      this.dibujarSeleccion();
      cont.appendChild(marco);
      if (this.editando) this.editarTexto(this.objeto(this.editando), true);
    }
    dibujarSeleccion() {
      const capa = this.elCapa;
      if (!capa) return;
      capa.innerHTML = '';
      const s = this.escala || 1;
      const k = 1 / s;
      if (this.pestana === 'animaciones') {
        const nums = R.numerosClic(this.d);
        const porObj = {};
        this.d.animaciones.forEach((a) => { (porObj[a.objeto] = porObj[a.objeto] || []).push(nums[a.id]); });
        for (const [id, ns] of Object.entries(porObj)) {
          const o = this.objeto(id);
          if (!o) continue;
          const txt = Array.from(new Set(ns)).join(', ');
          capa.appendChild(h('div', { class: 'dp-num-anim', style: { left: o.x - 4 * k + 'px', top: o.y + 'px', fontSize: 11 * k + 'px', padding: '0 ' + 4 * k + 'px', transform: 'translateX(-100%)' } }, txt));
        }
        // trayectorias de los objetos seleccionados
        for (const a of this.d.animaciones) {
          if (a.cat !== 'trayectoria' || !(this.sel.includes(a.objeto) || this.selAnim === a.id)) continue;
          this.dibujarTrayectoria(capa, a, k);
        }
      }
      for (const o of this.objSel()) {
        const caja = h('div', { class: 'dp-sel', style: { left: o.x + 'px', top: o.y + 'px', width: o.w + 'px', height: o.h + 'px', borderWidth: 1.5 * k + 'px' } });
        if (this.sel.length === 1) {
          for (const pos of ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']) {
            const m = h('div', { class: 'dp-manija ' + pos, style: { width: 10 * k + 'px', height: 10 * k + 'px', margin: -5 * k + 'px', borderWidth: 1.5 * k + 'px' } });
            m.addEventListener('pointerdown', (e) => this.alRedimensionar(e, o, pos));
            caja.appendChild(m);
          }
        }
        capa.appendChild(caja);
      }
    }
    dibujarTrayectoria(capa, a, k) {
      const o = this.objeto(a.objeto);
      if (!o) return;
      const cx = o.x + o.w / 2, cy = o.y + o.h / 2;
      const pts = K.puntosTrayectoria(a.trayectoria || K.trayectoriaInicial(a.efecto, a.opcion), 48);
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'dp-tray');
      svg.setAttribute('viewBox', '0 0 ' + K.ANCHO + ' ' + K.ALTO);
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', pts.map((q, i) => (i ? 'L' : 'M') + (cx + q[0]).toFixed(1) + ' ' + (cy + q[1]).toFixed(1)).join(''));
      path.setAttribute('stroke-width', 2 * k);
      path.setAttribute('stroke-dasharray', 6 * k + ' ' + 4 * k);
      svg.appendChild(path);
      const ini = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      ini.setAttribute('cx', cx); ini.setAttribute('cy', cy); ini.setAttribute('r', 6 * k); ini.setAttribute('class', 'ini');
      svg.appendChild(ini);
      capa.appendChild(svg);
      const fin = pts[pts.length - 1];
      const t = a.trayectoria || {};
      if (t.tipo === 'circulo') return;
      const manija = h('div', { class: 'dp-tray-fin', title: 'Arrastra para cambiar dónde termina el movimiento', style: { left: cx + fin[0] + 'px', top: cy + fin[1] + 'px', width: 14 * k + 'px', height: 14 * k + 'px', margin: -7 * k + 'px' } });
      manija.addEventListener('pointerdown', (e) => {
        e.stopPropagation(); e.preventDefault();
        const antes = JSON.stringify(this.p);
        const mover = (ev) => {
          const q = this.aDiapo(ev);
          t.dx = Math.round(q.x - cx); t.dy = Math.round(q.y - cy);
          a.trayectoria = t;
          manija.style.left = q.x + 'px'; manija.style.top = q.y + 'px';
          const np = K.puntosTrayectoria(t, 48);
          path.setAttribute('d', np.map((qq, i) => (i ? 'L' : 'M') + (cx + qq[0]).toFixed(1) + ' ' + (cy + qq[1]).toFixed(1)).join(''));
        };
        const soltar = () => {
          document.removeEventListener('pointermove', mover);
          document.removeEventListener('pointerup', soltar);
          this.historia.push(antes); this.futuro = [];
          this.cambiar(() => {}, { sinHistoria: true });
        };
        document.addEventListener('pointermove', mover);
        document.addEventListener('pointerup', soltar);
      });
      capa.appendChild(manija);
    }
    aDiapo(e) {
      const r = this.elMarco.getBoundingClientRect();
      return { x: (e.clientX - r.left) / this.escala, y: (e.clientY - r.top) / this.escala };
    }

    alPresionarObjeto(e, o) {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      e.stopPropagation();
      this.cerrarMenu();
      if (this.editando === o.id) return;
      if (e.shiftKey || e.ctrlKey || e.metaKey) { this.seleccionar([o.id], true); return; }
      if (!this.sel.includes(o.id)) { this.sel = [o.id]; this.selAnim = null; this.dibujarSeleccion(); this.dibujarPanel(); this.refrescarCinta(); this.emitir('seleccion'); }
      this.raiz.focus({ preventScroll: true });
      const p0 = this.aDiapo(e);
      const objs = this.objSel();
      const orig = objs.map((x) => ({ x: x.x, y: x.y }));
      const antes = JSON.stringify(this.p);
      let movido = false;
      const els = objs.map((x) => this.elDiapo.querySelector('.dp-obj[data-id="' + x.id + '"]'));
      const mover = (ev) => {
        const q = this.aDiapo(ev);
        let dx = q.x - p0.x, dy = q.y - p0.y;
        if (!movido && Math.hypot(dx, dy) * this.escala < 4) return;
        movido = true;
        ev.preventDefault();
        // guías inteligentes: alinear el conjunto con el centro de la diapositiva y con otros objetos
        const caja = unir(objs.map((x, i) => ({ x: orig[i].x + dx, y: orig[i].y + dy, w: x.w, h: x.h })));
        const g = this.guias(caja, objs);
        dx += g.dx; dy += g.dy;
        objs.forEach((x, i) => { x.x = Math.round(orig[i].x + dx); x.y = Math.round(orig[i].y + dy); if (els[i]) { els[i].style.left = x.x + 'px'; els[i].style.top = x.y + 'px'; } });
        this.dibujarSeleccion();
        this.dibujarGuias(g.lineas);
      };
      const soltar = () => {
        document.removeEventListener('pointermove', mover);
        document.removeEventListener('pointerup', soltar);
        this.dibujarGuias([]);
        if (movido) { this.historia.push(antes); this.futuro = []; this.cambiar(() => {}, { sinHistoria: true }); }
      };
      document.addEventListener('pointermove', mover);
      document.addEventListener('pointerup', soltar);
    }
    guias(caja, mueven) {
      const ids = new Set(mueven.map((x) => x.id));
      const otros = this.d.objetos.filter((x) => !ids.has(x.id));
      const umbral = 6 / Math.max(0.4, this.escala);
      const xs = [[K.ANCHO / 2, 'c']].concat(otros.flatMap((o) => [[o.x, 'i'], [o.x + o.w / 2, 'c'], [o.x + o.w, 'd']]));
      const ys = [[K.ALTO / 2, 'c']].concat(otros.flatMap((o) => [[o.y, 'i'], [o.y + o.h / 2, 'c'], [o.y + o.h, 'd']]));
      const mx = [caja.x, caja.x + caja.w / 2, caja.x + caja.w], my = [caja.y, caja.y + caja.h / 2, caja.y + caja.h];
      let best = { dx: 0, dy: 0, lineas: [] };
      let bx = umbral, by = umbral;
      for (const [v] of xs) for (const m of mx) { const dd = v - m; if (Math.abs(dd) < bx) { bx = Math.abs(dd); best.dx = dd; best.vx = v; } }
      for (const [v] of ys) for (const m of my) { const dd = v - m; if (Math.abs(dd) < by) { by = Math.abs(dd); best.dy = dd; best.vy = v; } }
      if (best.vx != null) best.lineas.push({ eje: 'x', v: best.vx });
      if (best.vy != null) best.lineas.push({ eje: 'y', v: best.vy });
      return best;
    }
    dibujarGuias(lineas) {
      if (!this.elCapa) return;
      this.elCapa.querySelectorAll('.dp-guia').forEach((x) => x.remove());
      const k = 1 / (this.escala || 1);
      for (const l of lineas) this.elCapa.appendChild(h('div', { class: 'dp-guia ' + l.eje, style: l.eje === 'x' ? { left: l.v + 'px', width: 1.2 * k + 'px' } : { top: l.v + 'px', height: 1.2 * k + 'px' } }));
    }
    alRedimensionar(e, o, pos) {
      e.stopPropagation(); e.preventDefault();
      const p0 = this.aDiapo(e);
      const b = { x: o.x, y: o.y, w: o.w, h: o.h };
      const antes = JSON.stringify(this.p);
      const proporcion = ['imagen', 'icono', 'audio'].includes(o.tipo) && o.bloquearProporcion !== false;
      const el = this.elDiapo.querySelector('.dp-obj[data-id="' + o.id + '"]');
      const mover = (ev) => {
        const q = this.aDiapo(ev);
        let dx = q.x - p0.x, dy = q.y - p0.y;
        let x = b.x, y = b.y, w = b.w, hh = b.h;
        if (pos.includes('e')) w = b.w + dx;
        if (pos.includes('w')) { w = b.w - dx; x = b.x + dx; }
        if (pos.includes('s')) hh = b.h + dy;
        if (pos.includes('n')) { hh = b.h - dy; y = b.y + dy; }
        const esquina = pos.length === 2;
        if ((proporcion && esquina) || ev.shiftKey) {
          const r = b.w / b.h;
          if (Math.abs(w - b.w) / b.w > Math.abs(hh - b.h) / b.h) hh = w / r; else w = hh * r;
          if (pos.includes('w')) x = b.x + b.w - w;
          if (pos.includes('n')) y = b.y + b.h - hh;
        }
        w = Math.max(16, w); hh = Math.max(12, hh);
        Object.assign(o, { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(hh) });
        if (el) Object.assign(el.style, { left: o.x + 'px', top: o.y + 'px', width: o.w + 'px', height: o.h + 'px' });
        this.dibujarSeleccion();
      };
      const soltar = () => {
        document.removeEventListener('pointermove', mover);
        document.removeEventListener('pointerup', soltar);
        this.historia.push(antes); this.futuro = [];
        this.cambiar(() => {}, { sinHistoria: true });
      };
      document.addEventListener('pointermove', mover);
      document.addEventListener('pointerup', soltar);
    }

    /* Edición de texto en el lienzo (doble clic): un área de texto encima del objeto */
    editarTexto(o, reabrir) {
      if (!o || !['texto', 'forma'].includes(o.tipo)) { if (o && ['smartart', 'tabla', 'grafico'].includes(o.tipo)) { this.panel = 'formato'; this.seleccionar([o.id]); setTimeout(() => { const t = this.elPanel.querySelector('textarea, input'); if (t) t.focus(); }, 30); } return; }
      if (!reabrir) { this.sel = [o.id]; this.editando = o.id; this.dibujarSeleccion(); }
      const e = R.estilo(this.p, this.d, o);
      const ta = h('textarea', { class: 'dp-edicion', 'aria-label': 'Texto de ' + o.nombre, spellcheck: 'true', style: { left: o.x + 'px', top: o.y + 'px', width: o.w + 'px', height: Math.max(o.h, 40) + 'px', fontFamily: R.pila(e.fuenteReal), fontSize: e.tam + 'px', color: e.colorReal, fontWeight: e.negrita ? 700 : 400, textAlign: { izquierda: 'left', centro: 'center', derecha: 'right' }[e.alinear] || 'left' } });
      ta.value = o.texto || '';
      const terminar = (guardar) => {
        if (this.editando !== o.id) return;
        this.editando = null;
        const v = ta.value;
        ta.remove();
        if (guardar && v !== (o.texto || '')) this.cambiar(() => { o.texto = v; });
        else this.render();
      };
      ta.addEventListener('blur', () => terminar(true));
      ta.addEventListener('keydown', (ev) => {
        ev.stopPropagation();
        if (ev.key === 'Escape') { ev.preventDefault(); terminar(true); this.raiz.focus({ preventScroll: true }); }
        if (ev.key === 'Tab') { ev.preventDefault(); const s = ta.selectionStart; const ini = ta.value.lastIndexOf('\n', s - 1) + 1; if (ev.shiftKey) { if (ta.value.slice(ini, ini + 2) === '  ') { ta.value = ta.value.slice(0, ini) + ta.value.slice(ini + 2); ta.selectionStart = ta.selectionEnd = Math.max(ini, s - 2); } } else { ta.value = ta.value.slice(0, ini) + '  ' + ta.value.slice(ini); ta.selectionStart = ta.selectionEnd = s + 2; } }
      });
      ta.addEventListener('pointerdown', (ev) => ev.stopPropagation());
      this.elDiapo.appendChild(ta);
      setTimeout(() => { ta.focus(); if (!reabrir) ta.select(); }, 10);
    }

    /* ------------------------------------------------------------ teclado */
    teclas(e) {
      if (e.target.closest && e.target.closest('input, textarea, select, .dp-menu') && e.key !== 'F5') return;
      const ctrl = e.ctrlKey || e.metaKey;
      const k = e.key;
      if (k === 'F5') { e.preventDefault(); this.presentar({ desde: e.shiftKey ? this.idx : 0, moderador: e.altKey ? true : undefined }); return; }
      if (ctrl && k.toLowerCase() === 'z') { e.preventDefault(); this.deshacer(); return; }
      if (ctrl && k.toLowerCase() === 'y') { e.preventDefault(); this.rehacer(); return; }
      if (ctrl && k.toLowerCase() === 'm') { e.preventDefault(); this.nuevaDiapositiva(); return; }
      if (ctrl && k.toLowerCase() === 'd' && this.sel.length) { e.preventDefault(); this.duplicarSeleccion(); return; }
      if (ctrl && k.toLowerCase() === 'a' && this.vista === 'normal') { e.preventDefault(); this.seleccionar(this.d.objetos.map((o) => o.id)); return; }
      const enMini = e.target === this.elMini || (e.target.closest && e.target.closest('.dp-miniaturas, .dp-clasificador'));
      if (enMini || (!this.sel.length && this.vista === 'clasificador')) {
        if (ctrl && (k === 'ArrowUp' || k === 'ArrowLeft')) { e.preventDefault(); if (this.idx > 0) this.moverDiapositiva(this.idx, this.idx - 1); return; }
        if (ctrl && (k === 'ArrowDown' || k === 'ArrowRight')) { e.preventDefault(); if (this.idx < this.p.diapositivas.length - 1) this.moverDiapositiva(this.idx, this.idx + 1); return; }
        if (k === 'ArrowUp' || k === 'ArrowLeft') { e.preventDefault(); this.irA(this.idx - 1); this.elMini.focus(); return; }
        if (k === 'ArrowDown' || k === 'ArrowRight') { e.preventDefault(); this.irA(this.idx + 1); this.elMini.focus(); return; }
        if (k === 'Delete') { e.preventDefault(); this.eliminarDiapositiva(); return; }
      }
      if (this.sel.length) {
        const paso = e.shiftKey ? 10 : ctrl ? 1 : 4;
        const mov = { ArrowLeft: [-paso, 0], ArrowRight: [paso, 0], ArrowUp: [0, -paso], ArrowDown: [0, paso] }[k];
        if (mov) { e.preventDefault(); this.cambiar(() => { for (const o of this.objSel()) { o.x += mov[0]; o.y += mov[1]; } }); return; }
        if (k === 'Delete' || k === 'Backspace') { e.preventDefault(); this.eliminarSeleccion(); return; }
        if (k === 'Escape') { this.seleccionar([]); return; }
        if (k === 'Enter' || k === 'F2') { e.preventDefault(); this.editarTexto(this.objSel()[0]); return; }
      } else if (!enMini && this.vista === 'normal') {
        if (k === 'PageDown') { e.preventDefault(); this.irA(this.idx + 1); }
        if (k === 'PageUp') { e.preventDefault(); this.irA(this.idx - 1); }
      }
    }

    /* =========================================================== comandos */
    nuevaDiapositiva(diseno) {
      const actual = this.d;
      const id = diseno || (actual ? (actual.diseno === 'titulo' ? 'tituloObjetos' : actual.diseno) : 'titulo');
      this.cambiar(() => {
        const d = crearDiapo(this.p, id);
        d.seccion = actual ? actual.seccion : null;
        this.p.diapositivas.splice(this.idx + 1, 0, d);
        this.idx = this.idx + 1;
        this.sel = [];
      });
    }
    duplicarDiapositiva() {
      this.cambiar(() => {
        const c = clonar(this.d);
        const mapa = {};
        c.id = nuevoId(this.p, 'd');
        c.objetos.forEach((o) => { const n = nuevoId(this.p, 'o'); mapa[o.id] = n; o.id = n; });
        c.animaciones.forEach((a) => { a.id = nuevoId(this.p, 'a'); a.objeto = mapa[a.objeto]; });
        this.p.diapositivas.splice(this.idx + 1, 0, c);
        this.idx++;
      });
    }
    eliminarDiapositiva() {
      if (this.p.diapositivas.length <= 1) { this.toast('La presentación necesita al menos una diapositiva.'); return; }
      this.cambiar(() => { this.p.diapositivas.splice(this.idx, 1); this.idx = Math.min(this.idx, this.p.diapositivas.length - 1); this.sel = []; });
    }
    moverDiapositiva(de, a) {
      if (a < 0 || a >= this.p.diapositivas.length || de === a) return;
      this.cambiar(() => {
        const [d] = this.p.diapositivas.splice(de, 1);
        this.p.diapositivas.splice(a, 0, d);
        // la diapositiva toma la sección del lugar donde se soltó
        if (this.p.secciones.length) {
          const prev = this.p.diapositivas[a - 1], sig = this.p.diapositivas[a + 1];
          if (prev && sig && prev.seccion !== sig.seccion) d.seccion = a > de ? prev.seccion : sig.seccion;
          else d.seccion = prev ? prev.seccion : sig ? sig.seccion : d.seccion;
        }
        this.idx = a;
        this.sel = [];
      });
    }
    ocultarDiapositiva() { this.cambiar(() => { this.d.oculta = !this.d.oculta; }); }
    cambiarDiseno(id) { this.cambiar(() => { aplicarDiseno(this.p, this.d, id); this.sel = []; }); }
    restablecerDiapositiva() {
      this.cambiar(() => {
        const def = K.diseno(this.d.diseno);
        for (const o of this.d.objetos) { if (!o.ph) continue; const m = def.ph.find((x) => x.ph === o.ph); if (m) Object.assign(o, { x: m.x, y: m.y, w: m.w, h: m.h }); delete o.estilo; }
        delete this.d.fondo;
      });
    }
    async agregarSeccion() {
      const nombre = await this.pedirTexto('Agregar sección', 'Nombre de la sección', 'Sección sin título');
      if (!nombre) return;
      this.cambiar(() => {
        const sec = { id: nuevoId(this.p, 's'), nombre };
        const D = this.p.diapositivas;
        if (!this.p.secciones.length) {
          if (this.idx > 0) { const pre = { id: nuevoId(this.p, 's'), nombre: 'Sección predeterminada' }; this.p.secciones.push(pre); D.forEach((d, i) => { d.seccion = i < this.idx ? pre.id : sec.id; }); }
          else D.forEach((d) => { d.seccion = sec.id; });
          this.p.secciones.push(sec);
        } else {
          const actual = this.d.seccion;
          const pos = this.p.secciones.findIndex((s) => s.id === actual);
          this.p.secciones.splice(pos + 1, 0, sec);
          D.forEach((d, i) => { if (i >= this.idx && d.seccion === actual) d.seccion = sec.id; });
        }
      });
    }
    async renombrarSeccion(id) {
      const s = this.p.secciones.find((x) => x.id === id);
      if (!s) return;
      const nombre = await this.pedirTexto('Cambiar nombre de sección', 'Nombre de la sección', s.nombre);
      if (nombre) this.cambiar(() => { s.nombre = nombre; });
    }
    quitarSeccion(id) {
      this.cambiar(() => {
        const i = this.p.secciones.findIndex((s) => s.id === id);
        if (i < 0) return;
        const destino = this.p.secciones[i - 1] || this.p.secciones[i + 1] || null;
        this.p.diapositivas.forEach((d) => { if (d.seccion === id) d.seccion = destino ? destino.id : null; });
        this.p.secciones.splice(i, 1);
      });
    }
    pedirTexto(titulo, etiqueta, valor) {
      const inp = h('input', { type: 'text', value: valor || '', 'aria-label': etiqueta, style: { width: '100%' } });
      return LT.ui.modal({ titulo, cuerpo: h('div', null, h('label', { style: { display: 'block', marginBottom: '6px', fontWeight: 600 } }, etiqueta), inp), botones: [{ texto: 'Cancelar', valor: null }, { texto: 'Aceptar', primario: true, valor: () => inp.value.trim() || null }], alAbrir: () => setTimeout(() => inp.select(), 40) });
    }

    /* objetos */
    insertar(o, opc) {
      opc = opc || {};
      this.cambiar(() => {
        o.id = nuevoId(this.p, 'o');
        // si hay un marcador de contenido vacío, el objeto toma su lugar (como en PowerPoint)
        if (opc.enMarcador) {
          const ph = this.d.objetos.find((x) => /^cuerpo/.test(x.ph || '') && !String(x.texto || '').trim());
          if (ph) { Object.assign(o, { x: ph.x, y: ph.y, w: ph.w, h: ph.h }); if (opc.ajustarAlto) o.h = Math.min(ph.h, opc.ajustarAlto); this.d.objetos.splice(this.d.objetos.indexOf(ph), 1); }
        }
        if (o.x == null) { o.x = Math.round((K.ANCHO - o.w) / 2); o.y = Math.round((K.ALTO - o.h) / 2); }
        o.nombre = nombreLibre(this.d, baseNombre(o));
        this.d.objetos.push(o);
        this.sel = [o.id];
      });
      return o;
    }
    /* Inicio › Convertir a SmartArt: cada párrafo del texto seleccionado se vuelve una forma del diagrama */
    convertirSmartArt(diseno) {
      const o = this.objSel()[0];
      if (!o || o.tipo !== 'texto' || !String(o.texto || '').trim()) { this.toast('Selecciona primero un cuadro con viñetas.'); return; }
      this.cambiar(() => {
        const i = this.d.objetos.indexOf(o);
        const s = { id: nuevoId(this.p, 'o'), tipo: 'smartart', diseno, elementos: String(o.texto).split(/\n/).map((x) => x.trim()).filter(Boolean), x: o.x, y: o.y, w: o.w, h: o.h, colores: 'mono' };
        s.nombre = nombreLibre(this.d, 'Diagrama');
        this.d.objetos.splice(i, 1, s);
        this.d.animaciones = this.d.animaciones.filter((a) => a.objeto !== o.id);
        this.sel = [s.id];
      });
    }
    eliminarSeleccion() {
      const ids = new Set(this.sel);
      this.cambiar(() => { this.d.objetos = this.d.objetos.filter((o) => !ids.has(o.id)); this.d.animaciones = this.d.animaciones.filter((a) => !ids.has(a.objeto)); this.sel = []; });
    }
    duplicarSeleccion() {
      this.cambiar(() => {
        const nuevos = [];
        for (const o of this.objSel()) { const c = clonar(o); c.id = nuevoId(this.p, 'o'); c.x += 20; c.y += 20; delete c.ph; c.nombre = nombreLibre(this.d, baseNombre(c)); this.d.objetos.push(c); nuevos.push(c.id); }
        this.sel = nuevos;
      });
    }
    ordenar(modo) {
      this.cambiar(() => {
        const objs = this.objSel();
        const resto = this.d.objetos.filter((o) => !objs.includes(o));
        if (modo === 'frente') this.d.objetos = resto.concat(objs);
        else if (modo === 'fondo') this.d.objetos = objs.concat(resto);
        else for (const o of objs) { const i = this.d.objetos.indexOf(o), j = clamp(i + (modo === 'adelante' ? 1 : -1), 0, this.d.objetos.length - 1); this.d.objetos.splice(i, 1); this.d.objetos.splice(j, 0, o); }
      });
    }
    /* Alinear: con un objeto, respecto a la diapositiva; con varios, entre ellos */
    alinear(modo) {
      const objs = this.objSel();
      if (!objs.length) return;
      this.cambiar(() => {
        const ref = objs.length === 1 ? { x: 0, y: 0, w: K.ANCHO, h: K.ALTO } : unir(objs);
        if (modo === 'distH' || modo === 'distV') {
          const h2 = modo === 'distH';
          const lista = objs.slice().sort((a, b) => (h2 ? a.x - b.x : a.y - b.y));
          if (lista.length < 3 && objs.length > 1) { if (lista.length === 2) { /* con dos objetos no hay nada que distribuir */ } return; }
          const caja = objs.length === 1 ? ref : unir(lista);
          const total = lista.reduce((s, o) => s + (h2 ? o.w : o.h), 0);
          const hueco = ((h2 ? caja.w : caja.h) - total) / Math.max(1, lista.length - 1);
          let pos = h2 ? caja.x : caja.y;
          for (const o of lista) { if (h2) o.x = Math.round(pos); else o.y = Math.round(pos); pos += (h2 ? o.w : o.h) + hueco; }
          return;
        }
        for (const o of objs) {
          if (modo === 'izq') o.x = ref.x;
          if (modo === 'centro') o.x = Math.round(ref.x + ref.w / 2 - o.w / 2);
          if (modo === 'der') o.x = ref.x + ref.w - o.w;
          if (modo === 'arriba') o.y = ref.y;
          if (modo === 'medio') o.y = Math.round(ref.y + ref.h / 2 - o.h / 2);
          if (modo === 'abajo') o.y = ref.y + ref.h - o.h;
        }
      });
    }
    estiloTexto(prop, valor) {
      const objs = this.objSel().filter((o) => ['texto', 'forma', 'smartart', 'tabla'].includes(o.tipo));
      if (!objs.length) { this.toast('Selecciona primero un cuadro de texto o una forma.'); return; }
      this.cambiar(() => {
        for (const o of objs) {
          o.estilo = Object.assign({}, o.estilo || {});
          if (prop === 'tamMas' || prop === 'tamMenos') { const t = R.estilo(this.p, this.d, o).tam; const esc = [8, 9, 10, 10.5, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 44, 48, 54, 60, 66, 72, 80, 88, 96]; o.estilo.tam = prop === 'tamMas' ? (esc.find((x) => x > t) || t + 8) : (esc.slice().reverse().find((x) => x < t) || Math.max(6, t - 2)); }
          else if (valor === null) delete o.estilo[prop];
          else if (['negrita', 'cursiva', 'subrayado', 'vinetas'].includes(prop) && valor === 'alternar') o.estilo[prop] = !R.estilo(this.p, this.d, o)[prop];
          else o.estilo[prop] = valor;
        }
      });
    }
    propiedad(prop, valor, filtro) {
      const objs = this.objSel().filter(filtro || (() => true));
      if (!objs.length) return;
      this.cambiar(() => { for (const o of objs) { if (valor === undefined) delete o[prop]; else o[prop] = valor; } });
    }

    /* tema */
    aplicarTema(id) { this.cambiar(() => { this.p.tema = id; this.p.variante = 0; }); }
    aplicarVariante(i) { this.cambiar(() => { this.p.variante = i; }); }

    /* transiciones */
    transicion(cambios, todas) {
      this.cambiar(() => {
        const lista = todas ? this.p.diapositivas : [this.d];
        const base = todas ? clonar(this.d.transicion || { efecto: 'ninguna' }) : null;
        for (const d of lista) {
          if (todas) { d.transicion = clonar(base); continue; }
          d.transicion = Object.assign({ efecto: 'ninguna', opcion: null, duracion: null, alHacerClic: true, despues: null, sonido: null }, d.transicion || {}, cambios);
          if (cambios.efecto) { const t = K.transicion(cambios.efecto); d.transicion.duracion = t.dur; d.transicion.opcion = (t.opciones || [])[0] || null; }
        }
      });
      if (cambios && cambios.efecto && cambios.efecto !== 'ninguna' && !todas) this.vistaPreviaTransicion(true);
    }

    /* animaciones */
    animacionesObjetivo() {
      if (this.selAnim) { const a = this.d.animaciones.find((x) => x.id === this.selAnim); return a ? [a] : []; }
      return this.d.animaciones.filter((a) => this.sel.includes(a.objeto));
    }
    animar(efecto, agregar) {
      const objs = this.objSel();
      if (!objs.length) { this.toast('Selecciona primero el objeto que quieres animar.'); return; }
      const def = K.animacion(efecto);
      this.cambiar(() => {
        for (const o of objs) {
          if (!agregar) {
            // reemplaza la animación del objeto (o la seleccionada en el panel)
            const prev = this.selAnim ? this.d.animaciones.find((a) => a.id === this.selAnim && a.objeto === o.id) : this.d.animaciones.find((a) => a.objeto === o.id);
            if (efecto === 'ninguna') { this.d.animaciones = this.d.animaciones.filter((a) => a.objeto !== o.id); continue; }
            if (prev) { Object.assign(prev, { efecto: def.id, cat: def.cat, opcion: (def.opciones || [])[0] || null, duracion: def.dur }); if (def.cat === 'trayectoria') prev.trayectoria = K.trayectoriaInicial(def.id, prev.opcion); else delete prev.trayectoria; continue; }
          }
          if (efecto === 'ninguna') continue;
          const a = { id: nuevoId(this.p, 'a'), objeto: o.id, efecto: def.id, cat: def.cat, opcion: (def.opciones || [])[0] || null, inicio: 'clic', duracion: def.dur, retraso: 0 };
          if (def.cat === 'trayectoria') a.trayectoria = K.trayectoriaInicial(def.id, a.opcion);
          this.d.animaciones.push(a);
          if (agregar) this.selAnim = a.id;
        }
      });
      if (efecto !== 'ninguna') this.vistaPreviaAnimacion(true);
    }
    propAnim(prop, valor) {
      const lista = this.animacionesObjetivo();
      if (!lista.length) { this.toast('Selecciona un objeto animado o una animación del panel.'); return; }
      this.cambiar(() => {
        for (const a of lista) {
          a[prop] = valor;
          if (prop === 'opcion' && a.cat === 'trayectoria') a.trayectoria = K.trayectoriaInicial(a.efecto, valor);
        }
      });
    }
    moverAnim(delta) {
      const lista = this.animacionesObjetivo();
      if (lista.length !== 1) { this.toast('Selecciona una sola animación en el panel para reordenarla.'); return; }
      const a = lista[0];
      this.cambiar(() => {
        const A = this.d.animaciones, i = A.indexOf(a), j = clamp(i + delta, 0, A.length - 1);
        A.splice(i, 1); A.splice(j, 0, a);
        this.selAnim = a.id;
      });
    }
    quitarAnim(id) { this.cambiar(() => { this.d.animaciones = this.d.animaciones.filter((a) => a.id !== id); }); }

    /* vistas previas en el lienzo */
    vistaPreviaTransicion(auto) {
      if (!LT.DiapoShow || !this.elMarco) return;
      if (!auto) this.registrar('vistaPreviaTransicion');
      const anterior = this.p.diapositivas[this.idx - 1];
      LT.DiapoShow.previaTransicion(this, anterior);
    }
    vistaPreviaAnimacion(auto) {
      if (!LT.DiapoShow || !this.elMarco) return;
      if (!auto) this.registrar('vistaPreviaAnimacion');
      LT.DiapoShow.previaAnimaciones(this);
    }
    presentar(opc) {
      if (!LT.DiapoShow) return;
      opc = opc || {};
      this.registrar('presentaciones');
      if (!opc.desde) this.registrar('desdeInicio');
      // con un solo monitor la vista del moderador se abre con Alt+F5 (o el botón «Vista del moderador»)
      const moderador = opc.moderador === true && this.p.config.moderador !== false && this.p.config.tipo !== 'quiosco' && !opc.ensayo;
      if (moderador) this.registrar('moderador');
      if (this.p.config.tipo === 'quiosco') this.registrar('quiosco');
      LT.DiapoShow.iniciar(this, Object.assign({}, opc, { moderador }));
    }

    /* ------------------------------------------------------------ estado */
    dibujarEstado() {
      const e = this.elEstado;
      e.innerHTML = '';
      const n = this.p.diapositivas.length;
      const boton = (txt, titulo, fn, activo) => h('button', { class: 'dp-estado-btn' + (activo ? ' activo' : ''), title: titulo, 'aria-label': titulo, onclick: fn }, txt);
      e.append(
        h('span', null, 'Diapositiva ' + (this.idx + 1) + ' de ' + n),
        h('span', { class: 'dp-estado-tema' }, K.tema(this.p.tema).nombre + ' · ' + R.variante(this.p).nombre),
        h('span', { class: 'dp-flex' }),
        boton('Notas', 'Mostrar u ocultar el panel de notas', () => { this.notasVisibles = !this.notasVisibles; this.render(); }, this.notasVisibles),
        boton('▭', 'Normal', () => { this.vista = 'normal'; this.render(); }, this.vista === 'normal'),
        boton('▦', 'Clasificador de diapositivas', () => { this.vista = 'clasificador'; this.render(); }, this.vista === 'clasificador'),
        boton('▶', 'Presentación con diapositivas desde la diapositiva actual (Mayús+F5)', () => this.presentar({ desde: this.idx })),
        boton(this.raiz.classList.contains('ampliada') ? '⤡' : '⤢', this.raiz.classList.contains('ampliada') ? 'Salir de pantalla completa del simulador' : 'Ampliar el simulador a toda la ventana', () => { this.raiz.classList.toggle('ampliada'); document.body.classList.toggle('dp-sin-scroll', this.raiz.classList.contains('ampliada')); this.render(); }));
    }
    refrescarCinta() { if (LT.DiapoCinta) { this.elCinta.innerHTML = ''; this.elCinta.appendChild(LT.DiapoCinta.construir(this)); } }

    /* ============================================================ panel */
    dibujarPanel() {
      const c = this.elPanel;
      const sc = c.scrollTop;
      c.innerHTML = '';
      if (!this.panel) return;
      const titulo = { formato: this.sel.length ? 'Formato' : 'Formato del fondo', animacion: 'Panel de animación', accesibilidad: 'Accesibilidad' }[this.panel];
      c.appendChild(h('div', { class: 'dp-panel-cab' }, h('b', null, titulo), h('button', { class: 'dp-x', title: 'Cerrar panel', 'aria-label': 'Cerrar panel', onclick: () => { this.panel = this.panel === 'formato' ? null : 'formato'; this.render(); } }, '×')));
      const cuerpo = h('div', { class: 'dp-panel-cuerpo' });
      c.appendChild(cuerpo);
      if (this.panel === 'animacion') this.panelAnimacion(cuerpo);
      else if (this.panel === 'accesibilidad') this.panelAccesibilidad(cuerpo);
      else this.panelFormato(cuerpo);
      c.scrollTop = sc;
    }
    seccionPanel(cont, titulo, abierta) {
      const det = h('details', { class: 'dp-psec', open: abierta === false ? null : true }, h('summary', null, titulo));
      cont.appendChild(det);
      return det;
    }
    paleta(actual, alElegir, opc) {
      opc = opc || {};
      const v = R.variante(this.p);
      const cont = h('div', { class: 'dp-paleta' });
      const fila = (cols, et) => {
        const f = h('div', { class: 'dp-paleta-fila' }, et ? h('span', { class: 'dp-paleta-et' }, et) : null);
        for (const [val, nombre] of cols) {
          const real = R.color(this.p, val);
          f.appendChild(h('button', { class: 'dp-color' + (actual === val ? ' sel' : ''), style: { background: real }, title: nombre + (val.startsWith('tema:') ? ' (color del tema)' : ' ' + val), 'aria-label': nombre, onclick: () => alElegir(val) }));
        }
        cont.appendChild(f);
      };
      fila([['tema:fondo', 'Fondo'], ['tema:texto', 'Texto'], ['tema:titulo', 'Título'], ['tema:texto2', 'Texto secundario']].concat(v.acentos.map((_, i) => ['tema:acento' + (i + 1), 'Énfasis ' + (i + 1)])), 'Tema');
      fila([['#c00000', 'Rojo oscuro'], ['#ff0000', 'Rojo'], ['#ffc000', 'Naranja'], ['#ffff00', 'Amarillo'], ['#92d050', 'Verde claro'], ['#00b050', 'Verde'], ['#00b0f0', 'Azul claro'], ['#0070c0', 'Azul'], ['#002060', 'Azul oscuro'], ['#7030a0', 'Púrpura']], 'Estándar');
      fila([['#ffffff', 'Blanco'], ['#f2f2f2', 'Gris muy claro'], ['#bfbfbf', 'Gris claro'], ['#a6a6a6', 'Gris'], ['#7f7f7f', 'Gris medio'], ['#595959', 'Gris oscuro'], ['#262626', 'Casi negro'], ['#000000', 'Negro']], 'Neutros');
      const otro = h('input', { type: 'color', value: actual && actual[0] === '#' ? actual : '#336699', 'aria-label': 'Más colores', onchange: (e) => alElegir(e.target.value) });
      cont.appendChild(h('div', { class: 'dp-paleta-fila' }, h('label', { class: 'dp-mas-colores' }, otro, 'Más colores…'), opc.sinColor ? h('button', { class: 'btn chico fantasma', onclick: () => alElegir(null) }, opc.sinColor) : null));
      return cont;
    }
    panelFormato(c) {
      const objs = this.objSel();
      if (!objs.length) return this.panelFondo(c);
      const o = objs[0];
      const varios = objs.length > 1;
      const campo = (et, control) => h('label', { class: 'dp-campo' }, h('span', null, et), control);
      if (varios) {
        c.appendChild(h('p', { class: 'dp-nota' }, objs.length + ' objetos seleccionados. Usa Alinear para ordenarlos (Inicio › Organizar o aquí abajo).'));
      } else {
        const nombre = h('input', { type: 'text', value: o.nombre, 'aria-label': 'Nombre del objeto' });
        nombre.addEventListener('change', () => { const v = nombre.value.trim(); if (v) this.cambiar(() => { o.nombre = v; }); });
        c.appendChild(campo('Nombre (panel de selección)', nombre));
      }
      const conTexto = (x) => ['texto', 'forma'].includes(x.tipo);
      /* --- contenido según el tipo */
      if (!varios && conTexto(o)) {
        const s = this.seccionPanel(c, 'Texto');
        const ta = h('textarea', { rows: 4, 'aria-label': 'Texto', value: o.texto || '' });
        ta.value = o.texto || '';
        ta.addEventListener('change', () => this.cambiar(() => { o.texto = ta.value; }));
        s.append(ta, h('p', { class: 'dp-nota' }, 'Una línea por párrafo. Dos espacios al inicio = segundo nivel de viñeta. También puedes hacer doble clic en el lienzo.'));
      }
      if (!varios && o.tipo === 'smartart') {
        const s = this.seccionPanel(c, 'SmartArt');
        const ta = h('textarea', { rows: 5, 'aria-label': 'Panel de texto del SmartArt' });
        ta.value = (o.elementos || []).join('\n');
        ta.addEventListener('change', () => this.cambiar(() => { o.elementos = ta.value.split('\n').map((x) => x.trim()).filter(Boolean); }));
        const sel = h('select', { 'aria-label': 'Diseño del SmartArt', onchange: (e) => this.cambiar(() => { o.diseno = e.target.value; }) }, K.SMARTART.map((x) => h('option', { value: x.id, selected: x.id === o.diseno ? true : null }, x.cat + ' · ' + x.nombre)));
        const colores = h('select', { 'aria-label': 'Colores del SmartArt', onchange: (e) => this.cambiar(() => { o.colores = e.target.value; }) }, h('option', { value: 'mono', selected: o.colores !== 'multicolor' ? true : null }, 'Monocromático (énfasis 1)'), h('option', { value: 'multicolor', selected: o.colores === 'multicolor' ? true : null }, 'Multicolor (colores del tema)'));
        s.append(h('div', { class: 'dp-nota' }, 'Panel de texto: un elemento por línea.'), ta, campo('Diseño', sel), campo('Colores', colores));
      }
      if (!varios && o.tipo === 'tabla') this.panelTabla(c, o);
      if (!varios && o.tipo === 'grafico') this.panelGrafico(c, o);
      if (!varios && (o.tipo === 'video' || o.tipo === 'audio')) this.panelMedio(c, o);
      /* --- fuente */
      if (objs.some((x) => ['texto', 'forma', 'smartart', 'tabla'].includes(x.tipo))) {
        const s = this.seccionPanel(c, 'Fuente y párrafo');
        const e = R.estilo(this.p, this.d, o);
        const tema = K.tema(this.p.tema);
        const sf = h('select', { 'aria-label': 'Fuente', onchange: (ev) => this.estiloTexto('fuente', ev.target.value || null) },
          h('option', { value: 'tema:titulo', selected: e.fuente === 'tema:titulo' ? true : null }, tema.fuentes.titulo + ' (Títulos)'),
          h('option', { value: 'tema:cuerpo', selected: e.fuente === 'tema:cuerpo' ? true : null }, tema.fuentes.cuerpo + ' (Cuerpo)'),
          R.FUENTES.map((f) => h('option', { value: f, selected: e.fuente === f ? true : null }, f)));
        const st = h('input', { type: 'number', min: 6, max: 200, step: 1, value: e.tam, 'aria-label': 'Tamaño de fuente', onchange: (ev) => { const v = parseFloat(ev.target.value); if (v > 0) this.estiloTexto('tam', v); } });
        const b = (txt, tit, prop, act) => h('button', { class: 'dp-btn-ic' + (act ? ' activo' : ''), title: tit, 'aria-label': tit, 'aria-pressed': act ? 'true' : 'false', onclick: () => this.estiloTexto(prop, 'alternar') }, txt);
        const al = (txt, tit, v) => h('button', { class: 'dp-btn-ic' + (e.alinear === v ? ' activo' : ''), title: tit, 'aria-label': tit, onclick: () => this.estiloTexto('alinear', v) }, txt);
        s.append(campo('Fuente', sf), campo('Tamaño (pt)', st),
          h('div', { class: 'dp-fila' }, b('N', 'Negrita', 'negrita', e.negrita), b('K', 'Cursiva', 'cursiva', e.cursiva), b('S', 'Subrayado', 'subrayado', e.subrayado), h('span', { class: 'dp-sep' }), al('⟸', 'Alinear a la izquierda', 'izquierda'), al('≡', 'Centrar', 'centro'), al('⟹', 'Alinear a la derecha', 'derecha'), h('span', { class: 'dp-sep' }), conTexto(o) ? b('•', 'Viñetas', 'vinetas', e.vinetas) : null),
          h('div', { class: 'dp-et' }, 'Color de fuente'), this.paleta((o.estilo || {}).color, (val) => this.estiloTexto('color', val)));
        if (!varios && conTexto(o) && String(o.texto || '').trim()) {
          const cr = R.contrasteDe(this.p, this.d, o);
          const minimo = e.tam >= 24 || (e.negrita && e.tam >= 18.5) ? 3 : 4.5;
          s.appendChild(h('div', { class: 'dp-contraste ' + (cr >= minimo ? 'ok' : 'mal') }, h('span', { class: 'dp-muestra', style: { background: R.fondoDetras(this.p, this.d, o), color: e.colorReal } }, 'Aa'), 'Contraste con el fondo: ' + cr.toFixed(1) + ':1 ' + (cr >= minimo ? '✓' : '✗ (mínimo ' + minimo + ':1)')));
        }
        s.appendChild(h('button', { class: 'btn chico fantasma', onclick: () => this.cambiar(() => { for (const x of objs) delete x.estilo; }) }, 'Restablecer al estilo del tema'));
      }
      /* --- relleno */
      if (objs.some((x) => ['forma', 'texto', 'smartart', 'tabla', 'icono', 'imagen'].includes(x.tipo))) {
        const s = this.seccionPanel(c, o.tipo === 'icono' ? 'Color del icono' : o.tipo === 'imagen' ? 'Borde de la imagen' : 'Relleno y contorno', false);
        if (o.tipo === 'icono') s.append(this.paleta(o.color, (v) => this.propiedad('color', v, (x) => x.tipo === 'icono')), h('div', { class: 'dp-et' }, 'Fondo circular'), this.paleta(o.relleno, (v) => this.propiedad('relleno', v || undefined, (x) => x.tipo === 'icono'), { sinColor: 'Sin fondo' }));
        else if (o.tipo === 'imagen') s.append(this.paleta(o.borde, (v) => this.propiedad('borde', v || undefined, (x) => x.tipo === 'imagen'), { sinColor: 'Sin borde' }), h('label', { class: 'dp-check' }, h('input', { type: 'checkbox', checked: o.sombra ? true : null, onchange: (e) => this.propiedad('sombra', e.target.checked || undefined, (x) => x.tipo === 'imagen') }), 'Sombra'));
        else s.append(h('div', { class: 'dp-et' }, 'Relleno'), this.paleta(o.relleno, (v) => this.propiedad('relleno', v || undefined, (x) => x.tipo !== 'icono' && x.tipo !== 'imagen'), { sinColor: 'Sin relleno' }), o.tipo === 'smartart' || o.tipo === 'tabla' ? null : h('div', { class: 'dp-et' }, 'Contorno'), o.tipo === 'smartart' || o.tipo === 'tabla' ? null : this.paleta(o.borde, (v) => this.propiedad('borde', v || undefined, (x) => x.tipo === 'forma' || x.tipo === 'texto'), { sinColor: 'Sin contorno' }));
      }
      /* --- imagen: recortar */
      if (!varios && o.tipo === 'imagen') {
        const s = this.seccionPanel(c, 'Recortar y tamaño de la imagen');
        const im = K.imagen(o.src);
        const nat = im ? im.ancho / im.alto : 4 / 3;
        const rec = o.recorte || {};
        const rs = h('select', { 'aria-label': 'Relación de aspecto', onchange: (e) => { const v = e.target.value; this.cambiar(() => { if (!v) { o.recorte = rec.forma ? { forma: rec.forma } : null; o.h = Math.round(o.w / nat); } else { const r = eval_ratio(v); o.recorte = Object.assign({}, o.recorte || {}, { ratio: r }); o.h = Math.round(o.w / r); } }); } },
          h('option', { value: '' }, 'Original (' + (Math.round(nat * 100) / 100) + ')'), ['1:1', '4:3', '3:4', '16:9', '3:2'].map((r) => h('option', { value: r, selected: rec.ratio && Math.abs(rec.ratio - eval_ratio(r)) < 0.01 ? true : null }, r)));
        const fs = h('select', { 'aria-label': 'Recortar en la forma', onchange: (e) => this.cambiar(() => { o.recorte = Object.assign({ ratio: rec.ratio || nat }, o.recorte || {}, { forma: e.target.value || undefined }); }) },
          h('option', { value: '' }, 'Rectángulo'), h('option', { value: 'redondeado', selected: rec.forma === 'redondeado' ? true : null }, 'Rectángulo redondeado'), h('option', { value: 'elipse', selected: rec.forma === 'elipse' ? true : null }, 'Elipse'));
        s.append(campo('Recortar a la relación de aspecto', rs), campo('Recortar en la forma', fs));
        if (imagenDeformada(o)) s.append(h('div', { class: 'dp-aviso' }, 'La imagen está deformada: sus proporciones no coinciden con las originales. ', h('button', { class: 'btn chico', onclick: () => this.cambiar(() => { const r = o.recorte && o.recorte.ratio ? o.recorte.ratio : nat; o.h = Math.round(o.w / r); }) }, 'Restablecer proporciones')));
      }
      /* --- texto alternativo */
      if (objs.some((x) => ['imagen', 'icono', 'smartart', 'grafico', 'video', 'forma', 'tabla', 'audio'].includes(x.tipo))) {
        const s = this.seccionPanel(c, 'Texto alternativo', !!(o.tipo === 'imagen' || o.tipo === 'icono'));
        const ta = h('textarea', { rows: 3, 'aria-label': 'Texto alternativo', placeholder: '¿Cómo describirías este objeto y su contexto a alguien que no puede verlo? (1 o 2 frases)', disabled: o.decorativo ? true : null });
        ta.value = o.alt || '';
        ta.addEventListener('change', () => this.propiedad('alt', ta.value.trim()));
        const dec = h('input', { type: 'checkbox', checked: o.decorativo ? true : null, onchange: (e) => this.propiedad('decorativo', e.target.checked || undefined) });
        s.append(ta, h('label', { class: 'dp-check' }, dec, 'Marcar como decorativo'), h('p', { class: 'dp-nota' }, 'Los objetos decorativos (adornos sin información) no necesitan descripción: el lector de pantalla los omite.'));
        if (o.tipo === 'imagen') { const im = K.imagen(o.src); if (im && im.alt) s.appendChild(h('button', { class: 'btn chico fantasma', onclick: () => { ta.value = im.alt; this.propiedad('alt', im.alt); } }, 'Generar una descripción (revísala)')); }
      }
      /* --- vínculo */
      if (!varios && LT.DiapoCinta) {
        const s = this.seccionPanel(c, 'Vínculo', !!o.vinculo);
        s.append(h('p', { class: 'dp-nota' }, o.vinculo ? LT.DiapoCinta.textoVinculo(this, o.vinculo) : 'Sin vínculo.'), h('div', { class: 'dp-fila' }, h('button', { class: 'btn chico', onclick: () => LT.DiapoCinta.dialogoVinculo(this) }, o.vinculo ? 'Editar vínculo…' : 'Insertar vínculo…'), o.vinculo ? h('button', { class: 'btn chico fantasma', onclick: () => this.propiedad('vinculo', undefined) }, 'Quitar vínculo') : null));
      }
      /* --- tamaño y posición */
      {
        const s = this.seccionPanel(c, 'Tamaño y posición', false);
        const num = (et, prop) => { const i = h('input', { type: 'number', step: 1, value: Math.round(o[prop]), 'aria-label': et }); i.addEventListener('change', () => { const v = parseFloat(i.value); if (isFinite(v)) this.cambiar(() => { o[prop] = Math.round(v); }); }); return campo(et, i); };
        if (!varios) s.append(h('div', { class: 'dp-grid2' }, num('Posición X', 'x'), num('Posición Y', 'y'), num('Ancho', 'w'), num('Alto', 'h')));
        s.append(h('div', { class: 'dp-et' }, varios ? 'Alinear los objetos seleccionados' : 'Alinear con la diapositiva'),
          h('div', { class: 'dp-fila' }, [['izq', '⇤', 'Alinear a la izquierda'], ['centro', '↔', 'Alinear verticalmente'], ['der', '⇥', 'Alinear a la derecha'], ['arriba', '⤒', 'Alinear en la parte superior'], ['medio', '↕', 'Alinear al medio'], ['abajo', '⤓', 'Alinear en la parte inferior']].map(([m, t, tit]) => h('button', { class: 'dp-btn-ic', title: tit, 'aria-label': tit, onclick: () => this.alinear(m) }, t))),
          varios ? h('div', { class: 'dp-fila' }, h('button', { class: 'btn chico', onclick: () => this.alinear('distH') }, 'Distribuir horizontalmente'), h('button', { class: 'btn chico', onclick: () => this.alinear('distV') }, 'Distribuir verticalmente')) : null,
          h('div', { class: 'dp-fila' }, h('button', { class: 'btn chico', onclick: () => this.ordenar('frente') }, 'Traer al frente'), h('button', { class: 'btn chico', onclick: () => this.ordenar('fondo') }, 'Enviar al fondo')),
          h('div', { class: 'dp-fila' }, h('button', { class: 'btn chico fantasma', onclick: () => this.duplicarSeleccion() }, 'Duplicar'), h('button', { class: 'btn chico fantasma', onclick: () => this.eliminarSeleccion() }, 'Eliminar')));
      }
    }
    panelFondo(c) {
      const d = this.d;
      const campo = (et, control) => h('label', { class: 'dp-campo' }, h('span', null, et), control);
      c.appendChild(h('p', { class: 'dp-nota' }, 'No hay objetos seleccionados. Haz clic en un objeto del lienzo para ver su formato.'));
      const s = this.seccionPanel(c, 'Diapositiva ' + (this.idx + 1));
      s.append(campo('Diseño', h('select', { 'aria-label': 'Diseño de la diapositiva', onchange: (e) => this.cambiarDiseno(e.target.value) }, K.DISENOS.map((x) => h('option', { value: x.id, selected: x.id === d.diseno ? true : null }, x.nombre)))),
        h('label', { class: 'dp-check' }, h('input', { type: 'checkbox', checked: d.oculta ? true : null, onchange: () => this.ocultarDiapositiva() }), 'Ocultar diapositiva'));
      const f = this.seccionPanel(c, 'Relleno del fondo', false);
      f.append(this.paleta(d.fondo, (v) => this.cambiar(() => { if (v) d.fondo = v; else delete d.fondo; }), { sinColor: 'Fondo del tema' }),
        h('div', { class: 'dp-fila' }, h('button', { class: 'btn chico', onclick: () => this.cambiar(() => { for (const x of this.p.diapositivas) { if (d.fondo) x.fondo = d.fondo; else delete x.fondo; } }) }, 'Aplicar a todas'), h('button', { class: 'btn chico fantasma', onclick: () => this.cambiar(() => { for (const x of this.p.diapositivas) delete x.fondo; }) }, 'Restablecer fondo')));
      const lista = this.seccionPanel(c, 'Objetos de la diapositiva (orden de lectura)', false);
      const ul = h('ol', { class: 'dp-lista-obj' });
      for (const o of d.objetos) ul.appendChild(h('li', null, h('button', { class: 'dp-enlace', onclick: () => this.seleccionar([o.id]) }, o.nombre), o.alt ? ' ✓' : ''));
      lista.appendChild(ul);
    }
    panelTabla(c, o) {
      const s = this.seccionPanel(c, 'Tabla');
      const grid = h('div', { class: 'dp-tabla-ed', style: { gridTemplateColumns: 'repeat(' + (o.filas[0] || []).length + ', minmax(70px, 1fr))' } });
      o.filas.forEach((fila, r) => fila.forEach((v, k) => {
        const i = h('input', { type: 'text', value: v == null ? '' : v, 'aria-label': 'Fila ' + (r + 1) + ', columna ' + (k + 1), class: r === 0 && o.encabezado !== false ? 'enc' : '' });
        i.addEventListener('change', () => this.cambiar(() => { o.filas[r][k] = i.value; }));
        grid.appendChild(i);
      }));
      const nc = (o.filas[0] || []).length;
      s.append(h('div', { class: 'tabla-scroll' }, grid),
        h('div', { class: 'dp-fila' },
          h('button', { class: 'btn chico', onclick: () => this.cambiar(() => { o.filas.push(new Array(nc).fill('')); o.h += 34; }) }, '+ Fila'),
          h('button', { class: 'btn chico', onclick: () => this.cambiar(() => { o.filas.forEach((f) => f.push('')); }) }, '+ Columna'),
          h('button', { class: 'btn chico fantasma', disabled: o.filas.length <= 1 ? true : null, onclick: () => this.cambiar(() => { o.filas.pop(); }) }, '− Fila'),
          h('button', { class: 'btn chico fantasma', disabled: nc <= 1 ? true : null, onclick: () => this.cambiar(() => { o.filas.forEach((f) => f.pop()); }) }, '− Columna')),
        h('label', { class: 'dp-check' }, h('input', { type: 'checkbox', checked: o.encabezado !== false ? true : null, onchange: (e) => this.cambiar(() => { o.encabezado = e.target.checked; }) }), 'Fila de encabezado'),
        h('label', { class: 'dp-check' }, h('input', { type: 'checkbox', checked: o.bandas !== false ? true : null, onchange: (e) => this.cambiar(() => { o.bandas = e.target.checked; }) }), 'Filas con bandas'));
    }
    panelGrafico(c, o) {
      const s = this.seccionPanel(c, 'Gráfico');
      const campo = (et, control) => h('label', { class: 'dp-campo' }, h('span', null, et), control);
      const tipos = [['columnas', 'Columna agrupada'], ['barras', 'Barra agrupada'], ['lineas', 'Línea con marcadores'], ['circular', 'Circular']];
      const datos = (this.opts.datosGrafico || []);
      const t = h('input', { type: 'text', value: o.titulo || '', 'aria-label': 'Título del gráfico' });
      t.addEventListener('change', () => this.cambiar(() => { o.titulo = t.value; }));
      const ey = h('input', { type: 'text', value: o.ejeY || '', 'aria-label': 'Título del eje vertical' });
      ey.addEventListener('change', () => this.cambiar(() => { o.ejeY = ey.value; }));
      s.append(campo('Tipo de gráfico', h('select', { 'aria-label': 'Tipo de gráfico', onchange: (e) => this.cambiar(() => { o.subtipo = e.target.value; }) }, tipos.map(([v, n]) => h('option', { value: v, selected: o.subtipo === v ? true : null }, n)))),
        datos.length ? campo('Datos', h('select', { 'aria-label': 'Datos del gráfico', onchange: (e) => this.cambiar(() => { const ds = datos.find((x) => x.id === e.target.value); if (ds) { o.datos = clonar(ds); } }) }, datos.map((x) => h('option', { value: x.id, selected: o.datos && o.datos.id === x.id ? true : null }, x.nombre)))) : null,
        campo('Título del gráfico', t), o.subtipo !== 'circular' ? campo('Título del eje vertical', ey) : null,
        h('label', { class: 'dp-check' }, h('input', { type: 'checkbox', checked: o.mostrarTitulo !== false ? true : null, onchange: (e) => this.cambiar(() => { o.mostrarTitulo = e.target.checked; }) }), 'Mostrar título'),
        h('label', { class: 'dp-check' }, h('input', { type: 'checkbox', checked: o.leyenda !== false ? true : null, onchange: (e) => this.cambiar(() => { o.leyenda = e.target.checked; }) }), 'Leyenda'),
        h('label', { class: 'dp-check' }, h('input', { type: 'checkbox', checked: o.etiquetas ? true : null, onchange: (e) => this.cambiar(() => { o.etiquetas = e.target.checked; }) }), 'Etiquetas de datos'));
    }
    panelMedio(c, o) {
      const s = this.seccionPanel(c, o.tipo === 'video' ? 'Reproducción del video' : 'Reproducción del audio');
      const op = o.opciones || (o.opciones = {});
      const set = (k, v) => this.cambiar(() => { o.opciones = Object.assign({}, o.opciones, { [k]: v }); });
      const chk = (k, txt) => h('label', { class: 'dp-check' }, h('input', { type: 'checkbox', checked: op[k] ? true : null, onchange: (e) => set(k, e.target.checked) }), txt);
      s.append(h('label', { class: 'dp-campo' }, h('span', null, 'Inicio'), h('select', { 'aria-label': 'Inicio de la reproducción', onchange: (e) => set('inicio', e.target.value) }, [['secuencia', 'En secuencia de clic'], ['auto', 'Automáticamente'], ['clic', 'Al hacer clic en']].map(([v, n]) => h('option', { value: v, selected: (op.inicio || 'secuencia') === v ? true : null }, n)))));
      if (o.tipo === 'video') s.append(chk('pantallaCompleta', 'Reproducir a pantalla completa'), chk('ocultar', 'Ocultar con la reproducción detenida'), chk('repetir', 'Repetir la reproducción hasta su interrupción'), chk('rebobinar', 'Rebobinar después de la reproducción'), chk('subtitulos', 'Tiene subtítulos (o descripción en las notas)'));
      else s.append(chk('todas', 'Reproducir en todas las diapositivas'), chk('repetir', 'Repetir la reproducción hasta su interrupción'), chk('ocultar', 'Ocultar durante presentación'), chk('rebobinar', 'Rebobinar después de la reproducción'),
        h('button', { class: 'btn chico', onclick: () => this.cambiar(() => { o.opciones = Object.assign({}, o.opciones, { inicio: 'auto', todas: true, repetir: true, ocultar: true }); }) }, 'Reproducir en el fondo'));
      const vol = h('select', { 'aria-label': 'Volumen', onchange: (e) => set('volumen', e.target.value) }, ['Bajo', 'Medio', 'Alto', 'Silencio'].map((v) => h('option', { value: v, selected: (op.volumen || 'Medio') === v ? true : null }, v)));
      s.append(h('label', { class: 'dp-campo' }, h('span', null, 'Volumen'), vol));
    }

    panelAnimacion(c) {
      const d = this.d;
      const p = R.pasos(d);
      c.appendChild(h('div', { class: 'dp-fila' }, h('button', { class: 'btn chico primario', onclick: () => this.vistaPreviaAnimacion() }, '▶ Reproducir todo'), h('span', { class: 'dp-nota' }, d.animaciones.length + ' animaciones')));
      if (!d.animaciones.length) { c.appendChild(h('p', { class: 'dp-nota' }, 'Esta diapositiva no tiene animaciones. Selecciona un objeto y elige un efecto en la pestaña Animaciones.')); return; }
      const maxT = Math.max(1, ...p.map((g) => g.fin));
      const lista = h('ol', { class: 'dp-anim-lista' });
      const nums = R.numerosClic(d);
      let ultimoNum = null;
      p.forEach((g) => g.items.forEach((it) => {
        const a = it.anim;
        const o = this.objeto(a.objeto);
        const def = K.animacion(a.efecto) || {};
        const num = nums[a.id];
        const mostrarNum = num !== ultimoNum;
        ultimoNum = num;
        const ini = h('select', { 'aria-label': 'Inicio de la animación', onchange: (e) => { this.selAnim = a.id; this.propAnim('inicio', e.target.value); } }, K.INICIOS.map(([v, n]) => h('option', { value: v, selected: a.inicio === v ? true : null }, n)));
        const li = h('li', { class: 'dp-anim-item' + (this.selAnim === a.id ? ' sel' : ''), 'data-anim': a.id },
          h('div', { class: 'dp-anim-fila', onclick: (e) => { if (e.target.closest('select, button, input')) return; this.selAnim = a.id; this.sel = [a.objeto]; this.render(); this.emitir('seleccion'); } },
            h('span', { class: 'dp-anim-num' }, mostrarNum && num ? String(num) : ''),
            h('span', { class: 'dp-anim-ic', style: { background: K.COLOR_CAT[a.cat] }, title: K.CAT[a.cat] }, a.inicio === 'clic' ? '🖱' : a.inicio === 'con' ? '' : '⏱'),
            h('span', { class: 'dp-anim-nombre' }, h('b', null, o ? o.nombre : '?'), h('small', null, K.CAT[a.cat] + ': ' + (def.nombre || a.efecto) + (a.opcion ? ' (' + a.opcion + ')' : ''))),
            h('span', { class: 'dp-anim-barra', title: 'Inicia ' + it.ini.toFixed(2) + ' s · dura ' + it.dur.toFixed(2) + ' s' }, h('i', { style: { left: (it.ini / maxT) * 100 + '%', width: Math.max(2, (it.dur / maxT) * 100) + '%', background: K.COLOR_CAT[a.cat] } }))));
        if (this.selAnim === a.id) {
          const durI = h('input', { type: 'number', min: 0, max: 59, step: 0.25, value: a.duracion, 'aria-label': 'Duración en segundos', onchange: (e) => this.propAnim('duracion', Math.max(0, parseFloat(e.target.value) || 0)) });
          const retI = h('input', { type: 'number', min: 0, max: 59, step: 0.25, value: a.retraso || 0, 'aria-label': 'Retraso en segundos', onchange: (e) => this.propAnim('retraso', Math.max(0, parseFloat(e.target.value) || 0)) });
          li.appendChild(h('div', { class: 'dp-anim-det' },
            h('label', null, 'Inicio', ini), h('label', null, 'Duración (s)', durI), h('label', null, 'Retraso (s)', retI),
            h('div', { class: 'dp-fila' }, h('button', { class: 'dp-btn-ic', title: 'Mover antes', 'aria-label': 'Mover antes', onclick: () => this.moverAnim(-1) }, '▲'), h('button', { class: 'dp-btn-ic', title: 'Mover después', 'aria-label': 'Mover después', onclick: () => this.moverAnim(1) }, '▼'), h('button', { class: 'btn chico fantasma', onclick: () => this.quitarAnim(a.id) }, 'Quitar'))));
        }
        lista.appendChild(li);
      }));
      c.appendChild(lista);
      const escala = h('div', { class: 'dp-anim-escala' });
      for (let s = 0; s <= Math.ceil(maxT); s += Math.max(1, Math.ceil(maxT / 6))) escala.appendChild(h('span', { style: { left: (s / maxT) * 100 + '%' } }, s + ' s'));
      c.append(escala, h('p', { class: 'dp-nota' }, '🖱 = al hacer clic · ⏱ = después de la anterior · sin icono = con la anterior. El número indica en qué clic ocurre (0 = automática al mostrarse la diapositiva). Haz clic en una animación para cambiar su inicio, duración y retraso, o para moverla.'));
    }
    panelAccesibilidad(c) {
      const r = accesibilidad(this.p);
      if (!r.length) { c.appendChild(h('div', { class: 'dp-ok' }, '✓ No se encontraron problemas de accesibilidad.')); return; }
      c.appendChild(h('p', { class: 'dp-nota' }, r.filter((x) => x.tipo === 'error').length + ' errores y ' + r.filter((x) => x.tipo !== 'error').length + ' advertencias. Haz clic en uno para ir al objeto.'));
      const ul = h('ul', { class: 'dp-acc' });
      for (const x of r) ul.appendChild(h('li', { class: x.tipo }, h('button', { class: 'dp-enlace', onclick: () => { this.idx = x.diapo; this.sel = x.objeto ? [x.objeto] : []; this.render(); } }, x.texto), x.ayuda ? h('small', null, x.ayuda) : null));
      c.appendChild(ul);
    }
  }

  function unir(objs) {
    const x1 = Math.min(...objs.map((o) => o.x)), y1 = Math.min(...objs.map((o) => o.y));
    const x2 = Math.max(...objs.map((o) => o.x + o.w)), y2 = Math.max(...objs.map((o) => o.y + o.h));
    return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
  }
  function eval_ratio(r) { const [a, b] = r.split(':').map(Number); return a / b; }
  function tiempoTxt(s) { s = +s || 0; const m = Math.floor(s / 60); return String(m).padStart(2, '0') + ':' + (s - m * 60).toFixed(2).padStart(5, '0'); }

  Diapo.construir = construir;
  Diapo.normalizar = normalizar;
  Diapo.crearDiapo = crearDiapo;
  Diapo.aplicarDiseno = aplicarDiseno;
  Diapo.secciones = secciones;
  Diapo.accesibilidad = accesibilidad;
  Diapo.imagenDeformada = imagenDeformada;
  Diapo.tiempoTxt = tiempoTxt;
  Diapo.unir = unir;
  Diapo.nombreLibre = nombreLibre;
  Diapo.HERRAMIENTAS = HERRAMIENTAS;
  LT.Diapo = Diapo;
})();

/* Página de módulo: explicación, etapa 1 (ejemplo resuelto), etapa 2 (micro-retos),
   etapa 3 (reto principal en el simulador, en tres niveles), etapa 4 (laboratorio en PowerPoint real),
   «¿Dónde está?» y glosario. Los contenidos vienen de assets/js/modulos/mXX.js. */
(function () {
  'use strict';
  const LT = window.LT;
  const { h } = LT.u;
  const C = LT.CURSO;
  LT.modulos = LT.modulos || {};
  LT.definirModulo = (def) => { LT.modulos[def.id] = def; };

  const NIVELES_RETO = [
    ['explorador', 'Explorador', 'Con pasos guiados'],
    ['analista', 'Analista', 'Solo el enunciado'],
    ['experto', 'Experto', 'Con un requisito extra'],
  ];
  const ORDEN = { explorador: 1, analista: 2, experto: 3 };

  function textoHTML(x) { return typeof x === 'string' ? h('span', { html: x }) : x; }
  function lista(items, ordenada) {
    const l = h(ordenada ? 'ol' : 'ul');
    for (const it of items || []) l.appendChild(h('li', { html: it }));
    return l;
  }
  function rutaChips(ruta) { return h('span', { class: 'donde-ruta', html: LT.cinta.rutaHTML(ruta) }); }

  function resultadosLista(resultados, mostrarOk) {
    const ul = h('ul', { class: 'resultados', 'aria-live': 'polite' });
    for (const r of resultados) {
      if (r.ok && !mostrarOk) continue;
      ul.appendChild(h('li', { class: r.ok ? 'ok' : 'mal' }, h('span', { class: 'ic' }, r.ok ? '✓' : '✗'), h('span', null, r.ok ? (r.titulo || r.mensaje || 'Correcto') : r.mensaje), r.nota ? h('span', { class: 'ir' }, r.nota) : null));
    }
    return ul;
  }

  /* ================================================================ */
  LT.paginaModulo = function (id) {
    const def = LT.modulos[id];
    const meta = C.modulo(id);
    document.title = 'Módulo ' + id + ' · ' + meta.titulo + ' · ' + C.marca;
    const prog = LT.progreso.modulo(id);
    const main = h('main');

    /* ---------------------------------------------------- cabecera */
    const est = LT.progreso.estadoModulo(id);
    const insignia = h('div', { class: 'insignia' + (est.superado ? '' : ' bloqueada'), html: C.insignia(id, { tam: 84, estrella: est.estrella }) });
    const cab = h('section', { class: 'mod-cab' }, h('div', { class: 'contenedor' },
      h('div', { class: 'ruta' }, h('a', { href: LT.pagina.url('index.html') }, 'Inicio'), ' › ', h('a', { href: LT.pagina.url('index.html#modulos') }, meta.bloque), ' › Módulo ' + id),
      h('div', { class: 'mod-cab-grid' },
        h('div', null,
          h('div', { class: 'meta' }, h('span', { class: 'chip sesion' }, meta.bloque), h('span', { class: 'chip' }, meta.min + ' min'), h('span', { class: 'chip ppt' }, meta.entorno)),
          h('h1', null, 'Módulo ' + id + '. ' + meta.titulo),
          h('p', { class: 'objetivo' }, h('b', null, 'Objetivo: '), def.objetivo)),
        insignia),
      def.situacion ? h('div', { class: 'situacion' }, h('div', { class: 'avatar', 'aria-hidden': 'true' }, C.iniciales), h('div', null, h('div', { class: 'de' }, (def.situacionDe || C.coordinadora + ', ' + C.cargo + ' de la clínica') + ' escribe:'), h('div', { class: 'msj', html: def.situacion }))) : null,
      LT.progreso.cargar().ubicacion[meta.nivel] && LT.progreso.cargar().ubicacion[meta.nivel].salto
        ? h('div', { class: 'aviso-caja ok' }, 'Superaste la prueba de ubicación: puedes ir directo a la ', h('a', { href: '#etapa4' }, 'Etapa 4 (laboratorio en PowerPoint)'), '.') : null));
    const etapas = [['explicacion', 'Explicación', '·'], ['etapa1', 'Etapa 1: Ver', '1'], ['etapa2', 'Etapa 2: Completar', '2'], ['etapa3', 'Etapa 3: Resolver', '3'], ['etapa4', 'Etapa 4: Transferir', '4'], ['donde', '¿Dónde está?', '?']];
    const nav = h('nav', { class: 'etapas contenedor', 'aria-label': 'Etapas del módulo' });
    const enlaces = {};
    for (const [ancla, t, n] of etapas) { enlaces[ancla] = h('a', { href: '#' + ancla }, h('span', { class: 'n' }, n), t); nav.appendChild(enlaces[ancla]); }
    cab.appendChild(nav);
    main.appendChild(cab);
    const marcarEtapas = () => {
      const m = LT.progreso.modulo(id);
      enlaces.etapa1.classList.toggle('hecha', !!m.ejemplo);
      enlaces.etapa2.classList.toggle('hecha', Object.values(m.micro || {}).filter(Boolean).length >= (def.micro || []).length && (def.micro || []).length > 0);
      enlaces.etapa3.classList.toggle('hecha', !!(m.reto && m.reto.ok));
      enlaces.etapa4.classList.toggle('hecha', !!(m.lab && m.lab.ok));
      enlaces.donde.classList.toggle('hecha', !!m.donde);
      const e = LT.progreso.estadoModulo(id);
      insignia.className = 'insignia' + (e.superado ? '' : ' bloqueada');
      insignia.innerHTML = C.insignia(id, { tam: 84, estrella: e.estrella });
    };
    document.addEventListener('lt-progreso', marcarEtapas);
    const cuerpo = h('div', { class: 'contenedor' });
    main.appendChild(cuerpo);

    /* -------------------------------------------------- explicación */
    const secExp = seccion('explicacion', 'Información de apoyo', def.explicacionTitulo || '¿Cómo funciona?', def.explicacionIntro);
    const exp = h('div', { class: 'explicacion' });
    for (const b of def.explicacion || []) exp.appendChild(bloque(b));
    secExp.appendChild(exp);
    cuerpo.appendChild(secExp);

    /* -------------------------------------------- etapa 1: ejemplo */
    const sec1 = seccion('etapa1', 'Etapa 1 · Ver', 'Ejemplo resuelto', def.ejemplo && def.ejemplo.intro || 'Primero predice qué pasará; después mira cómo se hace, paso a paso.');
    if (def.ejemplo) sec1.appendChild(ejemplo(def.ejemplo, () => LT.progreso.actualizarModulo(id, (m) => { m.ejemplo = true; })));
    cuerpo.appendChild(sec1);

    /* -------------------------------------------- etapa 2: micro-retos */
    const sec2 = seccion('etapa2', 'Etapa 2 · Completar', 'Micro-retos', 'Practica una sola idea o un solo comando a la vez antes del reto principal.');
    const microGrid = h('div', { class: 'micro-grid' });
    (def.micro || []).forEach((mr, i) => microGrid.appendChild(microReto(mr, i, () => LT.progreso.actualizarModulo(id, (m) => { m.micro[i] = true; }), !!(prog.micro || {})[i])));
    sec2.appendChild(microGrid);
    cuerpo.appendChild(sec2);

    /* ---------------------------------------- etapa 3: reto principal */
    const sec3 = seccion('etapa3', 'Etapa 3 · Resolver', 'Reto principal: ' + (def.reto && def.reto.titulo || meta.reto), def.reto && def.reto.intro || 'Resuélvelo en el simulador de PowerPoint. Puedes usar la cinta de opciones, el panel de formato de la derecha, el clic derecho y los atajos de teclado.');
    let nivelActual = (prog.reto && prog.reto.nivel) || 'analista';
    const cambiarNivelLab = [];
    if (def.reto) sec3.appendChild(retoPrincipal(def, id, () => nivelActual, (n) => { nivelActual = n; cambiarNivelLab.forEach((fn) => fn(n)); }));
    cuerpo.appendChild(sec3);

    /* ---------------------------------------------- etapa 4: laboratorio */
    const sec4 = seccion('etapa4', 'Etapa 4 · Transferir', 'Laboratorio en PowerPoint real', def.lab && def.lab.intro || 'Resuelve el mismo tipo de tarea en PowerPoint, sin guía, y sube tu presentación para revisarla al instante.');
    if (def.lab) sec4.appendChild(laboratorio(def, id, () => nivelActual, cambiarNivelLab));
    cuerpo.appendChild(sec4);

    /* ---------------------------------------------- ¿dónde está? */
    const secD = seccion('donde', 'Cierre', '¿Dónde está?', 'Ubica en la cinta de opciones los comandos que usaste. Las rutas son de PowerPoint de Microsoft 365 para Windows; las notas indican diferencias en Mac y en PowerPoint para la web.');
    if (def.donde && def.donde.length) {
      const c = h('div', { class: 'widget' });
      secD.appendChild(c);
      LT.DondeEsta(c, def.donde, () => { LT.progreso.actualizarModulo(id, (m) => { m.donde = true; }); LT.ui.toast('¡Ubicaste todos los comandos!', 'ok'); });
    }
    if (def.glosario && def.glosario.length) {
      const t = h('table', { class: 'tabla-sitio' }, h('thead', null, h('tr', null, h('th', null, 'Término'), h('th', null, 'En inglés'), h('th', null, 'Qué es'))));
      const tb = h('tbody');
      for (const [es, en, d] of def.glosario) tb.appendChild(h('tr', null, h('td', null, h('b', null, es)), h('td', null, h('i', null, en)), h('td', { html: d })));
      t.appendChild(tb);
      secD.append(h('h3', { style: { marginTop: '24px' } }, 'Glosario del módulo'), h('div', { class: 'tabla-scroll' }, t));
    }
    if (def.atajos && def.atajos.length) secD.append(h('h3', { style: { marginTop: '20px' } }, 'Atajos útiles'), h('ul', null, def.atajos.map((a) => h('li', { html: a }))));
    cuerpo.appendChild(secD);

    // navegación entre módulos
    const ant = C.modulo(id - 1), sig = C.modulo(id + 1);
    cuerpo.appendChild(h('div', { class: 'grupo-btn', style: { justifyContent: 'space-between', marginTop: '36px' } },
      ant ? h('a', { class: 'btn', href: LT.pagina.urlModulo(ant.id) }, '← Módulo ' + ant.id + ': ' + ant.titulo) : h('span'),
      sig ? h('a', { class: 'btn primario', href: LT.pagina.urlModulo(sig.id) }, 'Módulo ' + sig.id + ': ' + sig.titulo + ' →') : h('a', { class: 'btn primario', href: LT.pagina.url('integrador.html') }, 'Reto integrador →')));
    LT.pagina.montar(main);
    marcarEtapas();
    const obs = new IntersectionObserver((ents) => {
      ents.forEach((e) => { if (e.isIntersecting) { Object.values(enlaces).forEach((a) => a.classList.remove('activa')); if (enlaces[e.target.id]) enlaces[e.target.id].classList.add('activa'); } });
    }, { rootMargin: '-40% 0px -55% 0px' });
    etapas.forEach(([a]) => { const s = document.getElementById(a); if (s) obs.observe(s); });
    if (location.hash) setTimeout(() => { const t = document.getElementById(location.hash.slice(1)); if (t) t.scrollIntoView(); }, 60);
  };

  function seccion(ancla, etiqueta, titulo, intro) {
    return h('section', { class: 'seccion', id: ancla },
      h('div', { class: 'etiqueta-etapa' }, etiqueta),
      h('div', { class: 'seccion-cab' }, h('h2', null, titulo)),
      intro ? h('p', { class: 'intro', html: intro }) : null);
  }

  /* Bloques de explicación: {html} | {widget, titulo, instr} */
  function bloque(b) {
    if (b.html) return h('div', { class: 'bloque-texto', html: b.html });
    const w = h('div', { class: 'widget' });
    if (b.titulo) w.appendChild(h('h3', null, b.titulo));
    if (b.instr) w.appendChild(h('p', { class: 'instr', html: b.instr }));
    const c = h('div');
    w.appendChild(c);
    if (b.widget) setTimeout(() => b.widget(c), 0);
    return w;
  }

  /* ------------------------------------------------- ejemplo resuelto */
  function ejemplo(ej, alTerminar) {
    const caja = h('div', { class: 'widget' });
    if (ej.titulo) caja.appendChild(h('h3', null, ej.titulo));
    const ol = h('ol', { class: 'pasos-ejemplo' });
    (ej.pasos || []).forEach((p) => ol.appendChild(h('li', null, textoHTML(typeof p === 'string' ? p : p.texto), p.ruta ? h('div', null, rutaChips(p.ruta)) : null)));
    let demo = null;
    if (ej.widget) { demo = h('div', { style: { margin: '12px 0' } }); setTimeout(() => ej.widget(demo), 0); }
    if (ej.pregunta) {
      caja.appendChild(h('p', { style: { fontWeight: 600, marginTop: '4px' } }, 'Predice: ', h('span', { html: ej.pregunta.texto })));
      const ocultos = h('div', { style: { display: 'none' } }, demo, ol);
      caja.appendChild(opciones(ej.pregunta, () => { ocultos.style.display = ''; alTerminar(); }));
      caja.appendChild(ocultos);
    } else { if (demo) caja.appendChild(demo); caja.appendChild(ol); alTerminar(); }
    return caja;
  }

  /* Preguntas de opción múltiple: {texto?, opciones:[], correcta, explicacion, retro:[]} */
  function opciones(q, alAcertar) {
    const cont = h('div');
    const ops = h('div', { class: 'opciones', role: 'radiogroup' });
    const retro = h('div', { class: 'retro' });
    let resuelto = false;
    q.opciones.forEach((o, i) => {
      const b = h('button', { class: 'opcion', type: 'button', role: 'radio', 'aria-checked': 'false' }, h('span', { class: 'letra' }, String.fromCharCode(65 + i)), h('span', { html: o }));
      b.addEventListener('click', () => {
        if (resuelto) return;
        const ok = i === q.correcta;
        b.classList.add(ok ? 'correcta' : 'incorrecta');
        b.setAttribute('aria-checked', 'true');
        retro.innerHTML = '';
        if (ok) { resuelto = true; retro.appendChild(h('div', { class: 'aviso-caja ok', html: '✓ ' + (q.explicacion || '¡Correcto!') })); alAcertar && alAcertar(); }
        else retro.appendChild(h('div', { class: 'aviso-caja alerta', html: (q.retro && q.retro[i]) || 'No es esa. Vuelve a intentarlo.' }));
      });
      ops.appendChild(b);
    });
    cont.append(ops, retro);
    return cont;
  }

  /* Clasificar elementos en categorías: {categorias:[…], items:[[texto, índice de categoría, explicación?], …]} */
  function clasificar(mr, alResolver) {
    const cont = h('div', { class: 'clasificar' });
    const elegidos = {};
    const retro = h('div', { class: 'retro' });
    const filas = h('div', { class: 'clasificar-filas' });
    mr.items.forEach(([texto], i) => {
      const botones = mr.categorias.map((c, k) => h('button', { class: 'btn chico', type: 'button', 'aria-pressed': 'false', onclick: (e) => { elegidos[i] = k; e.currentTarget.parentNode.querySelectorAll('button').forEach((b, j) => { b.classList.toggle('primario', j === k); b.setAttribute('aria-pressed', j === k ? 'true' : 'false'); }); fila.classList.remove('mal', 'bien'); } }, c));
      const fila = h('div', { class: 'clasificar-fila' }, h('span', { class: 'clasificar-texto', html: texto }), h('span', { class: 'grupo-btn' }, botones));
      filas.appendChild(fila);
    });
    const revisar = () => {
      let bien = 0;
      const malos = [];
      mr.items.forEach(([, correcta, porque], i) => {
        const fila = filas.children[i];
        const ok = elegidos[i] === correcta;
        fila.classList.toggle('bien', ok);
        fila.classList.toggle('mal', !ok);
        if (ok) bien++; else if (elegidos[i] != null && porque) malos.push(porque);
      });
      retro.innerHTML = '';
      if (bien === mr.items.length) { retro.appendChild(h('div', { class: 'aviso-caja ok', html: '✓ ' + (mr.exito || '¡Todo bien clasificado!') })); alResolver(); }
      else retro.appendChild(h('div', { class: 'aviso-caja alerta', html: bien + ' de ' + mr.items.length + ' correctas.' + (malos.length ? ' ' + malos[0] : ' Revisa las marcadas en rojo.') }));
    };
    cont.append(filas, h('button', { class: 'btn primario chico', style: { marginTop: '8px' }, onclick: revisar }, LT.icono('check', 15), 'Revisar'), retro);
    return cont;
  }

  /* Ordenar elementos: {items:[…en el orden correcto…], mezcla:[índices]} */
  function ordenar(mr, alResolver) {
    const cont = h('div', { class: 'ordenar' });
    let orden = (mr.mezcla || mr.items.map((_, i) => i).reverse()).slice();
    const ol = h('ol', { class: 'ordenar-lista' });
    const retro = h('div', { class: 'retro' });
    const dibujar = () => {
      ol.innerHTML = '';
      orden.forEach((k, pos) => ol.appendChild(h('li', null, h('span', { html: mr.items[k] }), h('span', { class: 'ordenar-btns' },
        h('button', { class: 'btn chico fantasma', 'aria-label': 'Subir', disabled: pos === 0 ? true : null, onclick: () => { [orden[pos - 1], orden[pos]] = [orden[pos], orden[pos - 1]]; dibujar(); } }, '▲'),
        h('button', { class: 'btn chico fantasma', 'aria-label': 'Bajar', disabled: pos === orden.length - 1 ? true : null, onclick: () => { [orden[pos + 1], orden[pos]] = [orden[pos], orden[pos + 1]]; dibujar(); } }, '▼')))));
    };
    dibujar();
    cont.append(ol, h('button', { class: 'btn primario chico', onclick: () => {
      retro.innerHTML = '';
      const ok = orden.every((k, i) => k === i);
      if (ok) { retro.appendChild(h('div', { class: 'aviso-caja ok', html: '✓ ' + (mr.exito || '¡Orden correcto!') })); alResolver(); }
      else { const i = orden.findIndex((k, j) => k !== j); retro.appendChild(h('div', { class: 'aviso-caja alerta', html: 'Todavía no. Revisa la posición ' + (i + 1) + '.' + (mr.pista ? ' ' + mr.pista : '') })); }
    } }, LT.icono('check', 15), 'Revisar'), retro);
    return cont;
  }

  /* ---------------------------------------------------------- micro-reto */
  function microReto(mr, i, alResolver, yaResuelto) {
    const chip = h('span', { class: 'chip ' + (yaResuelto ? 'ok' : 'pendiente') }, yaResuelto ? '✓ Resuelto' : 'Pendiente');
    const marcar = () => { chip.className = 'chip ok'; chip.textContent = '✓ Resuelto'; alResolver(); };
    const caja = h('div', { class: 'micro' + (mr.ancho ? ' ancho' : '') }, h('div', { class: 'micro-cab' }, h('h3', null, 'Micro-reto ' + (i + 1) + ': ' + mr.titulo), chip));
    if (mr.enunciado) caja.appendChild(h('p', { class: 'enunciado', html: mr.enunciado }));
    if (mr.tipo === 'opcion') caja.appendChild(opciones(mr, marcar));
    else if (mr.tipo === 'clasificar') caja.appendChild(clasificar(mr, marcar));
    else if (mr.tipo === 'ordenar') caja.appendChild(ordenar(mr, marcar));
    else if (mr.tipo === 'widget') { const c = h('div'); caja.appendChild(c); setTimeout(() => mr.crear(c, marcar), 0); }
    return caja;
  }

  /* ------------------------------------------------------ reto principal */
  function retoPrincipal(def, id, getNivel, setNivel) {
    const reto = def.reto;
    const cont = h('div', { class: 'panel-reto ancho' });
    const instr = h('div', { class: 'panel-instr' });
    const trabajo = h('div', { class: 'panel-trabajo' });
    cont.append(instr, trabajo);
    let widget = null, intentos = 0;
    const claveBorrador = (n) => 'pptSalud.borrador.m' + id + '.' + n;
    const especDe = (n) => {
      const base = reto.base || {};
      const niv = (reto.niveles || {})[n] || {};
      return { contexto: niv.contexto || base.contexto, instrucciones: niv.instrucciones || base.instrucciones || [], pistas: niv.pistas || base.pistas || [] };
    };
    const construir = () => {
      const n = getNivel();
      const e = especDe(n);
      instr.innerHTML = '';
      trabajo.innerHTML = '';
      intentos = 0;
      const selector = h('div', { class: 'selector-nivel', role: 'radiogroup', 'aria-label': 'Nivel de dificultad' });
      for (const [k, nom, d] of NIVELES_RETO) selector.appendChild(h('button', { class: k === n ? 'activo' : '', role: 'radio', 'aria-checked': k === n ? 'true' : 'false', onclick: () => { if (k !== n) { setNivel(k); construir(); } } }, nom, h('small', null, d)));
      instr.appendChild(h('h3', null, 'Nivel'));
      instr.appendChild(selector);
      if (e.contexto) instr.appendChild(h('p', { html: e.contexto, style: { fontSize: '.93rem' } }));
      instr.appendChild(h('h3', null, 'Lo que debes hacer'));
      instr.appendChild(lista(e.instrucciones, true));
      const der = h('div', { class: 'instr-der' });
      const pistas = h('div', { class: 'pistas' });
      const res = h('div');
      let nPista = 0;
      const btnPista = h('button', { class: 'btn chico' }, LT.icono('pista', 15), 'Pista (' + e.pistas.length + ')');
      btnPista.addEventListener('click', () => {
        if (nPista >= e.pistas.length) return;
        const titulos = ['Concepto', 'Dónde está', 'Paso exacto'];
        pistas.appendChild(h('div', { class: 'pista' }, h('b', null, (titulos[nPista] || 'Pista') + ' · ' + (nPista + 1) + ' de ' + e.pistas.length), h('span', { html: e.pistas[nPista] })));
        nPista++;
        btnPista.textContent = '';
        btnPista.append(LT.icono('pista', 15), nPista < e.pistas.length ? 'Otra pista' : 'Sin más pistas');
        if (nPista >= e.pistas.length) btnPista.disabled = true;
      });
      const verificar = () => {
        intentos++;
        const r = widget.verificar(n);
        res.innerHTML = '';
        res.appendChild(resultadosLista(r.resultados, true));
        if (r.ok) {
          const previo = LT.progreso.modulo(id).reto;
          LT.progreso.actualizarModulo(id, (m) => {
            m.intentos = (m.intentos || 0) + intentos;
            if (!m.reto || !m.reto.ok || ORDEN[n] >= ORDEN[m.reto.nivel]) m.reto = { ok: true, nivel: n, fecha: new Date().toISOString() };
          });
          res.appendChild(h('div', { class: 'exito' }, h('div', { html: C.insignia(id, { tam: 56 }) }), h('div', null, h('h4', null, previo && previo.ok ? '¡Reto superado otra vez!' : '¡Insignia desbloqueada!'), h('p', null, 'Superaste el reto en nivel ' + NIVELES_RETO.find((x) => x[0] === n)[1] + '. ' + (n !== 'experto' ? 'Prueba el nivel siguiente o pasa al laboratorio en PowerPoint real.' : 'Ahora transfiere lo aprendido al laboratorio en PowerPoint real.')))));
          if (!previo || !previo.ok) LT.ui.toast('¡Insignia del módulo ' + id + ' desbloqueada!', 'ok');
        }
        res.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      };
      der.append(h('h3', null, 'Revisión'), h('div', { class: 'grupo-btn' },
        h('button', { class: 'btn primario', onclick: verificar }, LT.icono('check', 16), 'Verificar'), btnPista,
        h('button', { class: 'btn chico fantasma', onclick: async () => { const ok = await LT.ui.modal({ titulo: 'Empezar de nuevo', cuerpo: h('p', null, 'Se borrará lo que hiciste en este nivel.'), botones: [{ texto: 'Cancelar', valor: false }, { texto: 'Restablecer', primario: true, valor: true }] }); if (ok) { try { localStorage.removeItem(claveBorrador(n)); } catch (er) { /* */ } construir(); } } }, LT.icono('reiniciar', 15), 'Restablecer')),
        pistas, res);
      instr.appendChild(der);
      const c = h('div');
      trabajo.appendChild(c);
      setTimeout(() => {
        widget = reto.crear(c, n, { id, claveBorrador: claveBorrador(n) });
        c.__reto = widget; // acceso para pruebas automáticas
        if (widget && widget.ed && widget.ed.recuperado) res.appendChild(h('div', { class: 'aviso-caja info' }, 'Recuperamos tu avance de la última vez. Usa «Restablecer» para empezar de nuevo.'));
      }, 0);
    };
    construir();
    return cont;
  }

  /* --------------------------------------------------------- laboratorio */
  function laboratorio(def, id, getNivel, cambiosNivel) {
    const lab = def.lab;
    const cont = h('div', { class: 'lab-grid' });
    const izq = h('div', { class: 'widget' });
    const der = h('div', { class: 'widget' });
    cont.append(izq, der);
    const ruta = LT.pagina.url('laboratorios/' + lab.archivo);
    const pasosCont = h('div');
    const dibujarPasos = (n) => {
      pasosCont.innerHTML = '';
      const pasos = (lab.pasos && (lab.pasos[n] || lab.pasos.analista)) || [];
      pasosCont.appendChild(h('div', { class: 'chip', style: { marginBottom: '6px' } }, 'Nivel ' + NIVELES_RETO.find((x) => x[0] === n)[1]));
      const ol = h('ol', { class: 'pasos-lab' });
      for (const p of pasos) ol.appendChild(h('li', null, h('span', { html: typeof p === 'string' ? p : p.texto }), p.ruta ? h('div', null, rutaChips(p.ruta)) : null));
      pasosCont.appendChild(ol);
    };
    cambiosNivel.push(dibujarPasos);
    izq.append(
      h('h3', null, lab.titulo || 'Laboratorio'),
      lab.contexto ? h('p', { html: lab.contexto }) : null,
      h('div', { class: 'grupo-btn', style: { margin: '10px 0' } }, h('a', { class: 'btn cafe', href: ruta, download: lab.archivo }, LT.icono('descargar', 16), 'Descargar ' + lab.archivo), (lab.descargas || []).map((d) => h('a', { class: 'btn chico', href: LT.pagina.url(d.ruta), download: d.ruta.split('/').pop() }, LT.icono('descargar', 15), d.texto))),
      h('p', { style: { fontSize: '.88rem', color: 'var(--tinta-2)' } }, lab.nota || 'La presentación trae la información que necesitas. El verificador encuentra las diapositivas por su título: no cambies los títulos salvo que la tarea lo pida.'),
      pasosCont,
      h('details', { style: { marginTop: '10px', fontSize: '.9rem' } }, h('summary', { style: { cursor: 'pointer' } }, '¿Usas PowerPoint para la web o Mac?'),
        h('p', null, 'PowerPoint para la web: sube la presentación a OneDrive, ábrela, resuélvela y descárgala con Archivo › Guardar como › Descargar una copia. Luego súbela aquí.' + (lab.notaWeb ? ' ' + lab.notaWeb : '')),
        h('p', null, 'Mac: las pestañas y los comandos son casi iguales; usa ⌘ en lugar de Ctrl.' + (lab.notaMac ? ' ' + lab.notaMac : ''))));
    dibujarPasos(getNivel());
    const res = h('div');
    const info = h('div', { class: 'archivo-info' });
    const inp = h('input', { type: 'file', accept: lab.acepta || '.pptx,.ppsx,.pptm', class: 'sr' });
    const zona = h('label', { class: 'zona-subir', tabindex: '0' }, inp, LT.icono('subir', 30), h('div', null, h('b', null, 'Sube tu presentación resuelta')), h('p', null, 'Arrastra aquí tu archivo .pptx o haz clic para elegirlo.'));
    zona.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inp.click(); } });
    const procesar = async (archivos) => {
      res.innerHTML = '';
      info.textContent = '';
      const f = Array.from(archivos).find((x) => /\.(pptx|ppsx|pptm)$/i.test(x.name));
      if (!f) { res.appendChild(h('div', { class: 'aviso-caja error' }, 'Sube una presentación de PowerPoint (.pptx).' + (/\.ppt$/i.test((archivos[0] || {}).name || '') ? ' El formato .ppt (PowerPoint 97-2003) no se puede revisar: ábrelo y guárdalo como Presentación de PowerPoint (.pptx).' : /\.pdf$/i.test((archivos[0] || {}).name || '') ? ' Un PDF no conserva transiciones, animaciones ni notas: sube el .pptx.' : ''))); return; }
      info.textContent = 'Revisando «' + f.name + '» (' + Math.round(f.size / 1024) + ' KB)…';
      try {
        const P = await LT.pptx.leer(f, f.name);
        const n = getNivel();
        const pruebas = lab.pruebas.filter((p) => !p.nivel || ORDEN[n] >= ORDEN[p.nivel]);
        const r = LT.pptx.revisar(P, pruebas, n);
        const ok = r.every((x) => x.ok);
        info.textContent = 'Archivo revisado: ' + f.name + ' · ' + r.filter((x) => x.ok).length + ' de ' + r.length + ' pruebas superadas.';
        res.appendChild(resultadosLista(r, true));
        if (ok) {
          LT.progreso.actualizarModulo(id, (m) => { m.lab = { ok: true, nivel: n, fecha: new Date().toISOString(), archivo: f.name }; });
          res.appendChild(h('div', { class: 'exito' }, h('div', { html: C.insignia(id, { tam: 56, estrella: true }) }), h('div', null, h('h4', null, '¡Laboratorio aprobado!'), h('p', null, 'Transferiste lo aprendido a PowerPoint real. Tu insignia ahora tiene estrella.'))));
          LT.ui.toast('Laboratorio del módulo ' + id + ' aprobado.', 'ok');
        } else LT.progreso.actualizarModulo(id, (m) => { if (!m.lab || !m.lab.ok) m.lab = { ok: false, fecha: new Date().toISOString(), puntaje: r.filter((x) => x.ok).length + '/' + r.length }; });
      } catch (err) {
        console.error(err);
        info.textContent = '';
        res.appendChild(h('div', { class: 'aviso-caja error' }, err.message || 'No se pudo leer el archivo.'));
      }
      inp.value = '';
    };
    inp.addEventListener('change', () => procesar(inp.files));
    zona.addEventListener('dragover', (e) => { e.preventDefault(); zona.classList.add('encima'); });
    zona.addEventListener('dragleave', () => zona.classList.remove('encima'));
    zona.addEventListener('drop', (e) => { e.preventDefault(); zona.classList.remove('encima'); procesar(e.dataTransfer.files); });
    der.append(h('h3', null, 'Verificador de presentaciones'), h('p', { style: { fontSize: '.9rem', color: 'var(--tinta-2)' } }, 'Tu presentación se revisa aquí mismo, en tu navegador: no se envía a ningún servidor.'), zona, info, res);
    const previo = LT.progreso.modulo(id).lab;
    if (previo && previo.ok) res.appendChild(h('div', { class: 'aviso-caja ok' }, '✓ Ya aprobaste este laboratorio (' + new Date(previo.fecha).toLocaleDateString('es-MX') + ', nivel ' + previo.nivel + '). Puedes volver a subirlo en otro nivel.'));
    return cont;
  }

  /* Simulador listo para un reto: crea el editor y lo devuelve junto con un verificador.
     opts: { presentacion, herramientas, pestana, alto, verificar(ed, nivel) -> [{ok, titulo, mensaje}] } */
  function retoSimulador(cont, opts, extra) {
    const ed = new LT.Diapo(cont, Object.assign({ alto: 640 }, opts, { claveBorrador: extra && extra.claveBorrador }));
    return {
      ed,
      verificar: (nivel) => {
        const resultados = opts.verificar(ed, nivel);
        return { ok: resultados.every((x) => x.ok), resultados };
      },
    };
  }
  /* Ayuda para escribir pruebas: chk(lista)(ok, titulo, mensaje) */
  function revisor() {
    const r = [];
    const add = (ok, titulo, mensaje) => { r.push({ ok: !!ok, titulo, mensaje: ok ? titulo : mensaje }); return !!ok; };
    add.lista = r;
    return add;
  }

  LT.modulo = { opciones, clasificar, ordenar, resultadosLista, NIVELES_RETO, retoSimulador, revisor };
})();

/* Área docente (PowerPoint para Ciencias de la Salud). El contenido (guía teórica, plan de la sesión y
   presentaciones de solución con sus guías) está cifrado con AES-GCM; la llave se deriva de la contraseña
   con PBKDF2-SHA256 en el navegador (WebCrypto). Nada se envía a ningún servidor.
   Archivos: docente/contenido.js y docente/archivos/*.js, generados por
   herramientas/proteger_docente.py a partir de la carpeta privada. */
(function () {
  'use strict';
  const LT = window.LT;
  const { h } = LT.u;
  const C = LT.CURSO;
  const P = LT.pagina;
  const NIVEL_TXT = { explorador: 'Explorador', analista: 'Analista', experto: 'Experto' };
  const SESION = 'pptSalud.docente.';
  const TIPOS = { pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', ppsx: 'application/vnd.openxmlformats-officedocument.presentationml.slideshow', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', pdf: 'application/pdf', mp4: 'video/mp4' };
  const NV = C.NIVELES[0];

  /* ------------------------------------------------------- criptografía */
  const deB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const aB64 = (u8) => { let s = ''; for (let i = 0; i < u8.length; i += 8192) s += String.fromCharCode.apply(null, u8.subarray(i, i + 8192)); return btoa(s); };
  async function derivar(clave, sal, iter) {
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(clave), 'PBKDF2', false, ['deriveBits']);
    return new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: sal, iterations: iter }, base, 256));
  }
  async function descifrar(raw, obj) {
    const k = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['decrypt']);
    return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: deB64(obj.iv) }, k, deB64(obj.datos)));
  }
  const ses = {
    leer() { try { return sessionStorage.getItem(SESION + window.LT_DOCENTE_CIFRADO.sal); } catch (e) { return null; } },
    guardar(v) { try { sessionStorage.setItem(SESION + window.LT_DOCENTE_CIFRADO.sal, v); } catch (e) { /* sin almacenamiento */ } },
    borrar() { try { Object.keys(sessionStorage).filter((k) => k.startsWith(SESION)).forEach((k) => sessionStorage.removeItem(k)); } catch (e) { /* nada */ } },
  };

  let llave = null;
  let contenido = null;
  async function abrir(raw) {
    const datos = await descifrar(raw, window.LT_DOCENTE_CIFRADO);
    contenido = JSON.parse(new TextDecoder().decode(datos));
    llave = raw;
  }
  function cargarScript(src) {
    return new Promise((ok, mal) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => mal(new Error('No se encontró ' + src)); document.head.appendChild(s); });
  }
  async function descargarSolucion(a) {
    const almacen = (window.LT_DOCENTE_ARCHIVOS = window.LT_DOCENTE_ARCHIVOS || {});
    if (!almacen[a.nombre]) await cargarScript(a.js);
    const datos = await descifrar(llave, almacen[a.nombre]);
    const ext = a.nombre.split('.').pop().toLowerCase();
    LT.u.descargar(a.nombre, new Blob([datos], { type: TIPOS[ext] || 'application/octet-stream' }));
  }

  /* ------------------------------------------------------------ inicio */
  function iniciar() {
    const main = h('main', { class: 'contenedor docente' });
    P.montar(main);
    if (!window.LT_DOCENTE_CIFRADO) { main.appendChild(aviso('Falta el contenido del área docente', 'No se encontró docente/contenido.js. Genera el contenido con: python herramientas/proteger_docente.py')); return; }
    if (!window.crypto || !crypto.subtle) { main.appendChild(aviso('Este navegador no puede abrir el área docente', 'El descifrado necesita una conexión segura (https) o abrir el archivo local en Chrome, Edge o Firefox actualizados.')); return; }
    const guardada = ses.leer();
    if (guardada) abrir(deB64(guardada)).then(() => panel(main)).catch(() => { ses.borrar(); acceso(main); });
    else acceso(main);
  }
  function aviso(titulo, texto) { return h('section', { class: 'seccion' }, h('h1', null, titulo), h('p', { class: 'intro' }, texto)); }

  function acceso(main) {
    main.innerHTML = '';
    const clave = h('input', { type: 'password', autocomplete: 'current-password', placeholder: 'Contraseña docente', 'aria-label': 'Contraseña docente' });
    const msj = h('div', { class: 'retro', 'aria-live': 'polite' });
    const btn = h('button', { class: 'btn primario', type: 'submit' }, LT.icono('usuario', 16), 'Entrar');
    const form = h('form', { class: 'acceso-docente tarjeta' },
      h('div', { class: 'acceso-icono', html: LT.iconoSVG('salud', 54) }),
      h('h1', null, 'Área docente'),
      h('p', null, 'Plan de la sesión minuto a minuto, guía teórica, soluciones, presentaciones resueltas con guías paso a paso y consolidación de reportes del grupo.'),
      h('label', null, 'Contraseña'), clave, btn, msj,
      h('p', { class: 'acceso-nota' }, 'El contenido se descifra en este navegador; la contraseña no se envía a ningún servidor. La sesión se cierra al cerrar la pestaña.'));
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!clave.value) { clave.focus(); return; }
      btn.disabled = true;
      msj.textContent = 'Verificando…';
      try {
        const c = window.LT_DOCENTE_CIFRADO;
        const raw = await derivar(clave.value, deB64(c.sal), c.iter);
        await abrir(raw);
        ses.guardar(aB64(raw));
        panel(main);
      } catch (er) {
        msj.innerHTML = '';
        msj.appendChild(h('div', { class: 'aviso-caja error' }, 'Contraseña incorrecta.'));
        btn.disabled = false;
        clave.select();
      }
    });
    main.append(form, h('p', { style: { textAlign: 'center', margin: '18px 0 40px' } }, h('a', { href: P.url('index.html') }, '← Volver al curso')));
    setTimeout(() => clave.focus(), 50);
  }

  /* ------------------------------------------------------------- panel */
  const PESTANAS = [
    ['plan', 'Plan de la sesión', plan],
    ['guia', 'Guía teórica', guia],
    ['retos', 'Soluciones de retos', soluciones],
    ['libros', 'Presentaciones de solución', libros],
    ['reportes', 'Reportes del grupo', reportes],
    ['tecnico', 'Notas técnicas', tecnico],
  ];
  function panel(main) {
    main.innerHTML = '';
    const actual = (location.hash.slice(1) && PESTANAS.find((p) => p[0] === location.hash.slice(1))) ? location.hash.slice(1) : 'plan';
    const cuerpo = h('div', { class: 'docente-cuerpo' });
    const tabs = h('div', { class: 'tabs docente-tabs no-imprimir', role: 'tablist' });
    const mostrar = (id) => {
      tabs.querySelectorAll('button').forEach((b) => b.setAttribute('aria-selected', b.dataset.id === id ? 'true' : 'false'));
      cuerpo.innerHTML = '';
      PESTANAS.find((x) => x[0] === id)[2](cuerpo);
      if (location.hash.slice(1) !== id) history.replaceState(null, '', '#' + id);
    };
    for (const [id, txt] of PESTANAS) tabs.appendChild(h('button', { class: 'tab', role: 'tab', 'data-id': id, onclick: () => mostrar(id) }, txt));
    main.append(
      h('section', { class: 'seccion docente-cab no-imprimir' },
        h('div', null, h('div', { class: 'etiqueta-etapa' }, 'Área docente'), h('h1', null, C.marca + ' · ' + C.formato), h('p', { class: 'intro' }, 'Contenido generado el ' + new Date(contenido.generado).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }) + '.')),
        h('button', { class: 'btn chico fantasma', onclick: () => { ses.borrar(); llave = null; contenido = null; location.hash = ''; acceso(main); } }, 'Cerrar sesión')),
      tabs, cuerpo);
    mostrar(actual);
  }

  /* ---------------------------------------------------- plan de la sesión */
  const aMin = (t) => { const [a, b] = t.split(':').map(Number); return a * 60 + b; };
  const hhmm = (m) => Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0');
  function plan(cont) {
    const PL = contenido.plan;
    const s = C.SESIONES[0];
    const info = (PL.sesiones || {})[s.n] || {};
    cont.appendChild(h('div', { class: 'grupo-btn no-imprimir', style: { margin: '6px 0 14px' } }, h('button', { class: 'btn chico', onclick: () => window.print() }, 'Imprimir el plan'), h('span', { class: 'chip' }, 'Horas relativas al inicio de la sesión (0:00)')));
    const t = h('table', { class: 'tabla-sitio plan-tabla' }, h('thead', null, h('tr', null, ['Hora', 'Etapa', 'El docente', 'El grupo', 'Evidencia'].map((x) => h('th', null, x)))));
    const tb = h('tbody');
    for (const it of C.agenda(s.n)) {
      if (it.tipo === 'bloque') {
        const txt = /arranque/i.test(it.titulo) ? info.arranque : /receso/i.test(it.titulo) ? info.receso : info.cierre;
        tb.appendChild(h('tr', { class: 'plan-bloque' }, h('td', null, it.inicio + '–' + it.fin), h('td', null, h('b', null, it.titulo)), h('td', { colspan: '3' }, txt || '')));
        continue;
      }
      const m = C.modulo(it.id);
      const pasos = (PL.modulos && PL.modulos[it.id]) || [];
      const suma = pasos.reduce((a, p) => a + p.min, 0);
      tb.appendChild(h('tr', { class: 'plan-modulo' }, h('td', null, it.inicio + '–' + it.fin), h('td', { colspan: '4' }, h('a', { href: P.urlModulo(it.id) }, it.titulo), ' · ' + it.min + ' min · ' + m.entorno, suma && suma !== it.min ? h('span', { class: 'chip pendiente', style: { marginLeft: '8px' } }, 'Los pasos suman ' + suma + ' min') : null)));
      let t0 = aMin(it.inicio);
      for (const p of pasos) {
        tb.appendChild(h('tr', null, h('td', { class: 'hora' }, hhmm(t0) + ' · ' + p.min + '′'), h('td', null, p.etapa), h('td', null, p.docente || '—'), h('td', null, p.grupo), h('td', null, p.evidencia || '')));
        t0 += p.min;
      }
    }
    t.appendChild(tb);
    cont.appendChild(h('section', { class: 'seccion plan-sesion' },
      h('h2', null, 'Sesión única · ' + NV.nombre),
      info.objetivo ? h('p', { class: 'intro' }, info.objetivo) : null,
      info.antes && info.antes.length ? h('div', { class: 'tarjeta plan-lista' }, h('b', null, 'Antes de la sesión'), h('ul', null, info.antes.map((x) => h('li', null, x)))) : null,
      h('div', { class: 'tabla-scroll' }, t),
      info.despues && info.despues.length ? h('div', { class: 'tarjeta plan-lista' }, h('b', null, 'Después de la sesión'), h('ul', null, info.despues.map((x) => h('li', null, x)))) : null,
      h('p', { style: { fontSize: '.88rem', color: 'var(--tinta-2)' } }, 'Trabajo autónomo: reto integrador «' + NV.integrador + '» (unos 45 minutos) y laboratorios pendientes.')));
  }

  /* ------------------------------------------------------- guía teórica */
  function guia(cont) {
    cont.appendChild(h('div', { class: 'grupo-btn no-imprimir', style: { margin: '6px 0 14px' } }, h('button', { class: 'btn chico', onclick: () => window.print() }, 'Imprimir o guardar en PDF')));
    const div = h('div', { class: 'guia-teorica' });
    div.innerHTML = contenido.guiaTeorica; // contenido propio, generado desde la carpeta privada
    div.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => { const t = div.querySelector(a.getAttribute('href')); if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); } }));
    cont.appendChild(div);
  }

  /* -------------------------------------------------- soluciones de retos */
  function soluciones(cont) {
    cont.appendChild(h('p', { class: 'intro' }, 'Cómo se resuelve el reto principal de cada módulo en el simulador (pasos del nivel Explorador y paso exacto) y qué revisa el verificador en cada laboratorio.'));
    for (const m of C.MODULOS) {
      const def = LT.modulos[m.id];
      if (!def || !def.reto) continue;
      const r = def.reto;
      const det = h('details', { class: 'tarjeta', style: { marginBottom: '10px', padding: '12px 16px' } }, h('summary', { style: { cursor: 'pointer', fontWeight: 600 } }, 'Módulo ' + m.id + '. ' + m.titulo + ' — ' + (r.titulo || m.reto)));
      const base = r.base || {};
      if (base.pistas && base.pistas.length) det.appendChild(h('div', null, h('p', null, h('b', null, 'Paso exacto (última pista):')), h('p', { html: base.pistas[base.pistas.length - 1] })));
      const exp = r.niveles && r.niveles.explorador && r.niveles.explorador.instrucciones;
      if (exp) det.appendChild(h('div', null, h('p', null, h('b', null, 'Pasos del nivel Explorador:')), h('ol', null, exp.map((x) => h('li', { html: x })))));
      const ex = r.niveles && r.niveles.experto && r.niveles.experto.instrucciones;
      if (ex) det.appendChild(h('div', null, h('p', null, h('b', null, 'Requisitos del nivel Experto:')), h('ul', null, ex.map((x) => h('li', { html: x })))));
      if (def.lab) det.appendChild(h('div', null, h('p', null, h('b', null, 'Laboratorio · qué revisa el verificador:')), h('ul', null, def.lab.pruebas.map((p) => h('li', null, p.titulo + (p.nivel ? ' (' + NIVEL_TXT[p.nivel] + ')' : ''))))));
      cont.appendChild(det);
    }
  }

  /* --------------------------------------------- presentaciones de solución */
  function libros(cont) {
    const arch = contenido.archivos || [];
    const boton = (a) => { const b = h('button', { class: 'btn chico cafe' }, LT.icono('descargar', 14), a.nombre); b.addEventListener('click', async () => { b.disabled = true; try { await descargarSolucion(a); } catch (e) { LT.ui.toast('No se pudo descargar: ' + e.message, 'error'); } b.disabled = false; }); return b; };
    const base = (archivo) => archivo.replace(/\.(pptx|ppsx|pptm)$/, '');
    const solDe = (archivo) => arch.filter((a) => a.nombre.startsWith(base(archivo) + '-solucion'));
    const guiaDe = (archivo) => arch.filter((a) => a.nombre.startsWith(base(archivo) + '-guia'));
    const celda = (lista) => h('td', null, h('div', { class: 'grupo-btn' }, lista.length ? lista.map(boton) : '—'));
    const t = h('table', { class: 'tabla-sitio' }, h('thead', null, h('tr', null, h('th', null, 'Módulo'), h('th', null, 'Presentación del participante'), h('th', null, 'Solución completa (cifrada)'), h('th', null, 'Guía paso a paso (PDF)'))));
    const tb = h('tbody');
    for (const m of C.MODULOS) {
      const def = LT.modulos[m.id];
      if (!def || !def.lab) continue;
      tb.appendChild(h('tr', null, h('td', null, 'M' + m.id + ' · ' + m.titulo), h('td', null, h('a', { href: P.url('laboratorios/' + def.lab.archivo), download: def.lab.archivo }, def.lab.archivo)), celda(solDe(def.lab.archivo)), celda(guiaDe(def.lab.archivo))));
    }
    const I = LT.paginas.INTEGRADORES.sesion;
    tb.appendChild(h('tr', null, h('td', null, 'Reto integrador'), h('td', null, h('a', { href: P.url('integradores/' + I.archivo), download: I.archivo }, I.archivo)), celda(solDe(I.archivo)), celda(guiaDe(I.archivo))));
    t.appendChild(tb);
    const otros = arch.filter((a) => /guia-soluciones/.test(a.nombre));
    cont.append(h('p', { class: 'intro' }, 'Las soluciones completas se hicieron en PowerPoint de escritorio (nivel Experto) y aprueban todas las pruebas del verificador. Cada una tiene su guía paso a paso en PDF, con capturas de PowerPoint y llamadas numeradas. Todo se descifra en este navegador al descargarlo.'),
      h('div', { class: 'tabla-scroll' }, t),
      otros.length ? h('p', { style: { marginTop: '14px' } }, h('b', null, 'Guía completa (todas las soluciones en un PDF): '), h('span', { class: 'grupo-btn', style: { display: 'inline-flex' } }, otros.map(boton))) : null);
  }

  /* ---------------------------------------------------- reportes del grupo */
  function reportes(cont) {
    const N = C.MODULOS.length;
    const resultados = h('div');
    const sinInteg = h('input', { type: 'checkbox' });
    const reps = [];
    const calcular = (d) => {
      const mods = C.MODULOS.map((m) => d.modulos[m.id] || {});
      const retos = mods.filter((m) => m.reto && m.reto.ok && (m.reto.nivel === 'analista' || m.reto.nivel === 'experto')).length;
      const labs = mods.filter((m) => m.lab && m.lab.ok).length;
      const integ = (d.integradores[NV.id] && d.integradores[NV.id].puntaje) || 0;
      const pctR = retos / N, pctL = labs / N, pctI = integ / 100;
      const cal = sinInteg.checked ? pctR * 30 + pctL * 70 : pctR * 30 + pctL * 30 + pctI * 40;
      return { retos, labs, integ, cal: Math.round(cal * 10) / 10 };
    };
    const dibujar = () => {
      resultados.innerHTML = '';
      if (!reps.length) return;
      const tabla = h('table', { class: 'tabla-sitio' });
      tabla.appendChild(h('thead', null, h('tr', null, h('th', null, 'Participante'), h('th', null, 'Grupo'), C.MODULOS.map((m) => h('th', { title: m.titulo }, 'M' + m.id)), h('th', null, 'Retos'), h('th', null, 'Labs'), h('th', null, 'Integrador'), h('th', null, 'Ubicación (pre → post)'), h('th', null, 'Calificación'))));
      const tb = h('tbody');
      for (const r of reps) {
        const d = r.datos;
        const c = calcular(d);
        const u = d.ubicacion[NV.id] || {};
        tb.appendChild(h('tr', null, h('td', null, (d.participante.nombre || '(sin nombre)') + (r.integro ? '' : ' ⚠')), h('td', null, d.participante.grupo || ''),
          C.MODULOS.map((m) => { const x = d.modulos[m.id] || {}; return h('td', { title: (x.reto && x.reto.ok ? 'Reto: ' + NIVEL_TXT[x.reto.nivel] : 'Reto pendiente') + (x.lab && x.lab.ok ? ' · Lab aprobado' : '') }, (x.reto && x.reto.ok ? x.reto.nivel[0].toUpperCase() : '·') + (x.lab && x.lab.ok ? '★' : '')); }),
          h('td', null, c.retos + '/' + N), h('td', null, c.labs + '/' + N), h('td', null, c.integ + ' %'), h('td', null, (u.pre ? u.pre.puntaje : '–') + ' → ' + (u.post ? u.post.puntaje : '–')), h('td', null, h('b', null, String(c.cal)))));
      }
      tabla.appendChild(tb);
      resultados.append(h('p', { style: { fontSize: '.88rem', color: 'var(--tinta-2)' } }, 'E/A/X = reto superado en nivel Explorador/Analista/Experto; ★ = laboratorio aprobado; ⚠ = el reporte fue editado a mano. La calificación cuenta los retos en nivel Analista o Experto (30 %), los laboratorios (30 %) y el integrador (40 %).'), h('div', { class: 'tabla-scroll' }, tabla),
        h('button', { class: 'btn chico', style: { marginTop: '10px' }, onclick: () => {
          const filas = [['Participante', 'Grupo', ...C.MODULOS.map((m) => 'M' + m.id + ' reto'), ...C.MODULOS.map((m) => 'M' + m.id + ' lab'), 'Retos', 'Labs', 'Integrador %', 'Ubicación pre', 'Ubicación post', 'Calificación']];
          for (const r of reps) { const d = r.datos; const c = calcular(d); const u = d.ubicacion[NV.id] || {}; filas.push([d.participante.nombre, d.participante.grupo, ...C.MODULOS.map((m) => { const x = d.modulos[m.id] || {}; return x.reto && x.reto.ok ? x.reto.nivel : ''; }), ...C.MODULOS.map((m) => { const x = d.modulos[m.id] || {}; return x.lab && x.lab.ok ? 'sí' : ''; }), c.retos, c.labs, c.integ, u.pre ? u.pre.puntaje : '', u.post ? u.post.puntaje : '', c.cal]); }
          const csv = '﻿' + filas.map((f) => f.map((x) => '"' + String(x == null ? '' : x).replace(/"/g, '""') + '"').join(',')).join('\r\n');
          LT.u.descargar('calificaciones-powerpoint-salud.csv', csv, 'text/csv');
        } }, LT.icono('descargar', 15), 'Descargar CSV'));
    };
    sinInteg.addEventListener('change', dibujar);
    const inp = h('input', { type: 'file', accept: '.json', multiple: true, onchange: async (e) => {
      for (const f of e.target.files) { try { reps.push(LT.progreso.leerReporte(await f.text())); } catch (er) { LT.ui.toast(f.name + ': ' + er.message, 'error'); } }
      dibujar();
    } });
    cont.append(h('p', { class: 'intro' }, 'Cada participante descarga su reporte desde la página de inicio (botón «Reporte para el docente»). Selecciona aquí todos los archivos .json: se procesan en este navegador, sin enviarse a ningún servidor.'),
      h('div', { class: 'grupo-btn' }, inp, h('label', { class: 'en-linea', style: { display: 'flex', gap: '6px', alignItems: 'center' } }, sinInteg, 'Sin reto integrador (su 40 % pasa a los laboratorios)')), resultados,
      h('h3', { style: { marginTop: '22px' } }, 'Rúbrica del integrador'),
      h('div', { class: 'tabla-scroll' }, h('table', { class: 'tabla-sitio' }, h('thead', null, h('tr', null, h('th', null, 'Criterio'), ['Inicial (1)', 'En desarrollo (2)', 'Logrado (3)', 'Destacado (4)'].map((x) => h('th', null, x)))), h('tbody', null, LT.paginas.RUBRICA.map(([c, n]) => h('tr', null, h('th', null, c), n.map((x) => h('td', null, x))))))));
  }

  /* ------------------------------------------------------- notas técnicas */
  function tecnico(cont) {
    const pre = (txt) => h('pre', { class: 'mono', style: { background: '#fdf8f6', border: '1px solid var(--linea)', borderRadius: '10px', padding: '12px', overflow: 'auto', fontSize: '.85rem' } }, txt);
    cont.append(
      h('section', { class: 'seccion' }, h('h2', null, 'Qué protege la contraseña'),
        h('p', null, 'La guía teórica, el plan de la sesión, las presentaciones de solución y sus guías viajan cifradas (AES-GCM de 256 bits; la llave se deriva de la contraseña con PBKDF2-SHA256 y ' + window.LT_DOCENTE_CIFRADO.iter.toLocaleString('es-MX') + ' iteraciones). Sin la contraseña no se pueden leer, aunque el sitio sea público.'),
        h('p', null, 'Límite importante: lo que revisa el simulador en cada reto forma parte del código público de cada módulo. Alguien con conocimientos técnicos podría leerlo en el código fuente; por eso la calificación pesa más los laboratorios en PowerPoint real y el integrador.')),
      h('section', { class: 'seccion' }, h('h2', null, 'Cambiar la contraseña o actualizar el contenido'),
        h('p', null, 'Las fuentes están en la carpeta privada (hermana del sitio, no se publica): docente/guia-teorica.html, docente/plan-sesiones.json y soluciones/. Después de editarlas, o para cambiar la contraseña, ejecuta:'),
        pre('python herramientas/proteger_docente.py --clave "tu-nueva-contraseña"'),
        h('p', null, 'Después sube a GitHub Pages la carpeta docente/ actualizada.')),
      h('section', { class: 'seccion' }, h('h2', null, 'Cómo agregar retos nuevos'),
        h('p', null, 'Cada módulo vive en ', h('code', null, 'assets/js/modulos/mXX.js'), ' y se declara con ', h('code', null, 'LT.definirModulo({…})'), '. Un reto crea el simulador con una presentación inicial y una función que revisa el resultado:'),
        pre("const inicial = () => LT.Diapo.construir({\n  tema: 'clinico', variante: 0,\n  secciones: [['Introducción', 0]],\n  diapositivas: [\n    { clave: 'portada', diseno: 'titulo', titulo: '…', subtitulo: '…', notas: '…' },\n    { clave: 'info', diseno: 'soloTitulo', titulo: '…',\n      objetos: [{ clave: 'foto', tipo: 'imagen', src: 'lavado', x: 60, y: 150, w: 400 }],\n      transicion: { efecto: 'desvanecer', duracion: 0.7, despues: 5 },\n      animaciones: [{ objeto: 'foto', efecto: 'zoom', inicio: 'despues' }] },\n  ],\n});\nreto: { tipo: 'widget', crear: (cont, nivel, extra) => LT.modulo.retoSimulador(cont,\n  { presentacion: inicial(), herramientas: ['inicio', 'insertar'], verificar }, extra) }\n// verificar(ed, nivel) devuelve [{ ok, titulo, mensaje }]; ed.p es la presentación y ed.registro\n// guarda lo que hizo el participante (presentaciones, vista del moderador, ensayos, vínculos probados)."),
        h('p', null, 'Los laboratorios declaran ', h('code', null, 'lab.pruebas: [{ titulo, nivel?, fn(P, A, nivel) }]'), ', donde ', h('code', null, 'P'), ' es la presentación leída y ', h('code', null, 'A'), ' trae ayudas como ', h('code', null, 'A.buscar'), ', ', h('code', null, 'A.tamTitulo'), ', ', h('code', null, 'A.fuentes'), ', ', h('code', null, 'A.iconos'), ' y ', h('code', null, 'A.deformada'), '; la función devuelve true o el mensaje para el participante.')),
      h('section', { class: 'seccion' }, h('h2', null, 'Cómo revisa una presentación el verificador'),
        h('p', null, 'Un .pptx es un paquete comprimido de archivos XML. La página lo descomprime en el navegador (JSZip) y lee: el orden de las diapositivas y sus secciones; el diseño (tipo de diseño del patrón); el tema y sus fuentes; el tamaño, la fuente y el color efectivos del texto (con la herencia del diseño y del patrón, y la reducción automática del texto); imágenes (tamaño original, recorte y forma), iconos SVG, texto alternativo y objetos decorativos; tablas, gráficos (tipo, título, etiquetas) y SmartArt (categoría y textos); video y audio (inicio, repetir, ocultar, todas las diapositivas, pantalla completa); hipervínculos; transiciones (efecto, duración, sonido, avance); animaciones (clase, inicio, duración, retraso y fin de las trayectorias); notas del orador y la configuración de la presentación (exposición, repetir, usar intervalos).')));
  }

  LT.docente = { iniciar };
})();

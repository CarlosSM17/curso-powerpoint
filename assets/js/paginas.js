/* Páginas generales: inicio, prueba de ubicación, reto integrador y glosario.
   (La guía visual vive en guia.js y el área docente en docente/, con su contenido cifrado.) */
(function () {
  'use strict';
  const LT = window.LT;
  const { h } = LT.u;
  const C = LT.CURSO;
  const P = LT.pagina;
  const param = (n) => new URLSearchParams(location.search).get(n);
  const NIVEL_TXT = { explorador: 'Explorador', analista: 'Analista', experto: 'Experto' };
  const NV = C.NIVELES[0];

  const RECURSOS = [
    ['Imágenes (PNG)', ['lavado-de-manos', 'vacunacion', 'personal-de-salud', 'familia', 'sala-de-espera', 'virus', 'plato-saludable', 'tension-arterial', 'logo-vida-sana'].map((n) => ['assets/media/imagenes/' + n + '.png', n.replace(/-/g, ' ')])],
    ['Iconos (SVG)', ['jeringa', 'vial', 'virus', 'mano', 'gota', 'jabon', 'mascarilla', 'termometro', 'corazon', 'persona', 'grupo', 'calendario', 'reloj', 'hospital', 'escudo', 'check'].map((n) => ['assets/media/iconos/' + n + '.svg', n])],
    ['Video y audio', [['assets/media/video-lavado-de-manos.mp4', 'video: lavado de manos (MP4, 16 s)'], ['assets/media/musica-sala-de-espera.wav', 'música de fondo (WAV, 24 s)']]],
  ];

  /* ============================================================ INICIO */
  function inicio() {
    const prog = LT.progreso.cargar();
    const main = h('main');
    const total = C.MODULOS.length;
    const estados = C.MODULOS.map((m) => LT.progreso.estadoModulo(m.id));
    const insignias = estados.filter((e) => e.superado).length;
    const avance = Math.round(estados.reduce((s, e) => s + e.avance, 0) / total);
    const siguiente = C.MODULOS.find((m, i) => !estados[i].superado) || C.MODULOS[0];
    const nombre = h('input', { type: 'text', value: prog.participante.nombre || '', placeholder: 'Tu nombre completo', 'aria-label': 'Nombre' });
    const grupo = h('input', { type: 'text', value: prog.participante.grupo || '', placeholder: 'Grupo o área', 'aria-label': 'Grupo' });
    [nombre, grupo].forEach((x) => x.addEventListener('change', () => LT.progreso.participante({ nombre: nombre.value.trim(), grupo: grupo.value.trim() })));
    main.appendChild(h('section', { class: 'portada' }, h('div', { class: 'contenedor portada-grid' },
      h('div', null,
        h('div', { class: 'chip', style: { background: 'rgba(255,255,255,.12)', color: '#fdeee8', borderColor: 'rgba(255,255,255,.2)', marginBottom: '12px' } }, 'Una sesión de 3 horas · 8 módulos · 1 reto integrador'),
        h('h1', null, 'PowerPoint, resolviendo retos reales'),
        h('p', { class: 'lead' }, 'Te incorporas al área de Educación para la Salud de la Clínica Universitaria Vida Sana: preparas pláticas para pacientes, informes para el Comité de Calidad y la pantalla de la sala de espera. Cada módulo te pide una tarea real de la clínica; la practicas en el simulador de PowerPoint, que revisa tu trabajo al instante, y la demuestras en PowerPoint.'),
        h('div', { class: 'grupo-btn', style: { marginTop: '18px' } },
          h('a', { class: 'btn primario', href: P.urlModulo(siguiente.id) }, insignias ? 'Continuar: módulo ' + siguiente.id : 'Empezar con el módulo 1', ' →'),
          h('a', { class: 'btn fantasma', style: { color: '#fdeee8' }, href: 'ubicacion.html' }, 'Prueba de ubicación'),
          h('a', { class: 'btn fantasma', style: { color: '#fdeee8' }, href: 'guia.html' }, 'Guía visual'))),
      h('div', { class: 'ficha-participante' },
        h('div', { style: { fontWeight: 600, color: '#fff' } }, 'Tu avance'),
        h('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: '.9rem', margin: '8px 0 6px' } }, h('span', null, insignias + ' de ' + total + ' insignias'), h('span', null, avance + ' %')),
        h('div', { class: 'barra-avance' }, h('span', { style: { width: avance + '%' } })),
        h('label', null, 'Nombre'), nombre, h('label', null, 'Grupo'), grupo,
        h('div', { class: 'grupo-btn', style: { marginTop: '12px' } },
          h('button', { class: 'btn chico', onclick: () => { LT.progreso.participante({ nombre: nombre.value.trim(), grupo: grupo.value.trim() }); if (!nombre.value.trim()) { LT.ui.aviso('Falta tu nombre', 'Escribe tu nombre para que el docente identifique tu reporte.'); return; } LT.u.descargar('reporte-powerpoint-salud-' + nombre.value.trim().toLowerCase().replace(/\s+/g, '-') + '.json', LT.progreso.reporte(), 'application/json'); } }, LT.icono('descargar', 15), 'Reporte para el docente'),
          h('label', { class: 'btn chico fantasma', style: { color: '#fdeee8', cursor: 'pointer' } }, 'Cargar avance', h('input', { type: 'file', accept: '.json', class: 'sr', onchange: async (e) => { const f = e.target.files[0]; if (!f) return; try { const r = LT.progreso.importar(await f.text()); LT.ui.toast(r.integro ? 'Avance cargado.' : 'Avance cargado (el archivo fue modificado a mano).', r.integro ? 'ok' : 'aviso'); setTimeout(() => location.reload(), 600); } catch (er) { LT.ui.aviso('No se pudo cargar', er.message); } } }))),
        h('p', { style: { fontSize: '.78rem', color: '#f4c9b9', margin: '10px 0 0' } }, 'Tu avance se guarda en este navegador. Usa el reporte para entregarlo o para pasarlo a otra computadora.'))),
      h('div', { class: 'taza-fondo', html: LT.iconoSVG('salud', 300) })));

    const cont = h('div', { class: 'contenedor', id: 'modulos' });
    cont.appendChild(h('section', { class: 'seccion' }, h('h2', null, 'Cómo funciona cada módulo'),
      h('div', { class: 'grid-modulos', style: { gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' } },
        [['1', 'Ver', 'Un ejemplo resuelto: predices qué pasará antes de verlo.'], ['2', 'Completar', 'Micro-retos de una sola idea o comando.'], ['3', 'Resolver', 'El reto principal en el simulador de PowerPoint, en nivel Explorador, Analista o Experto, con pistas y revisión instantánea.'], ['4', 'Transferir', 'Un laboratorio en PowerPoint real: descargas la presentación, la resuelves y la subes para revisarla.']].map(([n, t, d]) => h('div', { class: 'tarjeta' }, h('div', { class: 'etiqueta-etapa' }, 'Etapa ' + n), h('h3', null, t), h('p', { style: { margin: 0, color: 'var(--tinta-2)', fontSize: '.93rem' } }, d))))));
    // agenda de la sesión
    const s = C.SESIONES[0];
    cont.appendChild(h('section', { class: 'seccion' }, h('h2', null, 'La ruta: una sesión de 3 horas'),
      h('p', { class: 'intro' }, 'Dos bloques separados por un receso de 15 minutos. El reto integrador se resuelve de forma autónoma después de la sesión (unos 45 minutos).'),
      h('div', { class: 'ruta-sesiones' }, h('div', { class: 'sesion-tarjeta', style: { borderTopColor: NV.color } },
        h('div', { class: 'sesion-cab' }, h('span', { class: 'chip sesion' }, 'Sesión única'), h('b', null, NV.nombre)),
        h('ol', { class: 'agenda' }, C.agenda(s.n).map((it) => h('li', { class: it.tipo }, h('span', { class: 'hora' }, it.inicio), it.tipo === 'modulo' ? h('a', { href: P.urlModulo(it.id) }, it.titulo) : h('span', null, it.titulo), h('span', { class: 'min' }, it.min + ' min'))))),
        h('div', { class: 'tarjeta' }, h('h3', null, 'Lo que vas a lograr'), h('ul', null, ['Estructurar una plática con inicio, desarrollo y cierre, con diseños y secciones.', 'Diseñar con temas y variantes, jerarquía visual, tipografía legible y buen contraste.', 'Comunicar con imágenes, iconos, formas, SmartArt, tablas y gráficos accesibles.', 'Integrar video, audio e hipervínculos.', 'Distinguir transición de animación y animar con propósito: por objeto, trayectorias, panel e intervalos.', 'Exponer con la vista del moderador y dejar una presentación automática para la sala de espera.'].map((x) => h('li', null, x)))))));
    // módulos por bloque
    const ub = prog.ubicacion[NV.id];
    const bloques = Array.from(new Set(C.MODULOS.map((m) => m.bloque)));
    const cab = h('div', { class: 'nivel-cab' },
      h('div', null, h('span', { class: 'chip sesion' }, NV.horas), h('h2', { style: { marginTop: '6px' } }, 'Módulos'), h('p', { class: 'desc' }, NV.capa)),
      h('div', { class: 'grupo-btn' },
        h('a', { class: 'btn chico', href: 'ubicacion.html' }, ub && ub.pre ? 'Prueba de ubicación: ' + ub.pre.puntaje + '/' + ub.pre.total : 'Prueba de ubicación'),
        ub && ub.pre ? h('a', { class: 'btn chico fantasma', href: 'ubicacion.html?momento=post' }, ub.post ? 'Prueba final: ' + ub.post.puntaje + '/' + ub.post.total : 'Prueba final') : null));
    const bloque = h('section', { class: 'nivel-bloque', id: 'nivel-' + NV.id }, cab);
    for (const b of bloques) {
      bloque.appendChild(h('h3', { class: 'bloque-tit', style: { color: C.COLORES_BLOQUE[b] } }, b + (b === bloques[0] ? ' · antes del receso' : ' · después del receso')));
      const grid = h('div', { class: 'grid-modulos' });
      for (const m of C.MODULOS.filter((x) => x.bloque === b)) {
        const e = LT.progreso.estadoModulo(m.id);
        grid.appendChild(h('a', { class: 'tarjeta-modulo', href: P.urlModulo(m.id) },
          h('span', { class: 'insignia-mini', html: C.insignia(m.id, { tam: 40, estrella: e.estrella }), style: { filter: e.superado ? '' : 'grayscale(1) opacity(.35)' } }),
          h('span', { class: 'num' }, 'Módulo ' + m.id),
          h('h3', { style: { paddingRight: '40px' } }, m.titulo),
          h('span', { class: 'reto' }, 'Reto: ' + m.reto),
          h('div', { class: 'barra-avance', title: e.avance + ' % del módulo' }, h('span', { style: { width: e.avance + '%' } })),
          h('div', { class: 'meta' }, h('span', { class: 'chip' }, m.min + ' min'), h('span', { class: 'chip ppt' }, m.entorno), e.superado ? h('span', { class: 'chip ok' }, '✓ ' + NIVEL_TXT[e.nivelReto]) : null, e.lab ? h('span', { class: 'chip ok' }, '✓ Lab') : null)));
      }
      bloque.appendChild(grid);
    }
    const integ = prog.integradores[NV.id];
    bloque.appendChild(h('div', { class: 'grid-modulos', style: { marginTop: '14px' } }, h('a', { class: 'tarjeta-modulo tarjeta-especial', href: 'integrador.html' },
      h('span', { class: 'num' }, 'Reto integrador'),
      h('h3', null, NV.integrador),
      h('span', { class: 'reto' }, 'Reúne los 8 módulos en una presentación automática para la sala de espera. Unos 45 minutos, de forma autónoma, después de la sesión.'),
      h('div', { class: 'meta' }, integ && integ.aprobado ? h('span', { class: 'chip ok' }, '✓ Constancia') : h('span', { class: 'chip pendiente' }, 'Pendiente')))));
    cont.appendChild(bloque);
    cont.appendChild(h('section', { class: 'seccion' }, h('h2', null, 'Tus insignias'), h('p', { class: 'intro' }, 'Ganas la insignia al superar el reto principal de un módulo; la estrella, al aprobar también su laboratorio en PowerPoint real.'),
      h('div', { class: 'vitrina' }, C.MODULOS.map((m, i) => h('div', { class: 'insignia' + (estados[i].superado ? '' : ' bloqueada') }, h('span', { html: C.insignia(m.id, { tam: 58, estrella: estados[i].estrella }) }), m.titulo)))));
    cont.appendChild(h('section', { class: 'seccion', id: 'recursos' }, h('h2', null, 'Antes de empezar'),
      h('div', { class: 'lab-grid' },
        h('div', { class: 'tarjeta' }, h('h3', null, 'Lo que necesitas'), h('ul', null,
          h('li', null, 'Computadora con teclado y ratón, y un navegador actualizado (Chrome, Edge o Firefox).'),
          h('li', null, 'PowerPoint de Microsoft 365 para Windows o Mac (recomendado). PowerPoint para la web sirve en casi todos los módulos, pero no tiene Ensayar intervalos, el modo de exposición ni audio desde el equipo (módulos 5 y 8).'),
          h('li', null, 'Bocinas o audífonos para el módulo 5.'),
          h('li', null, 'Para repasar conceptos con ejemplos en movimiento, abre la ', h('a', { href: 'guia.html' }, 'Guía visual'), '.'))),
        h('div', { class: 'tarjeta' }, h('h3', null, 'El caso y sus recursos'), h('p', null, 'Todos los módulos usan materiales ficticios de la Clínica Universitaria Vida Sana: campañas de higiene de manos, hipertensión e influenza, el Comité de Calidad y la pantalla de la sala de espera. Las ilustraciones, iconos, música y video se hicieron para el curso y puedes usarlos en tus laboratorios.'),
          RECURSOS.map(([t, lista]) => h('details', { class: 'recursos' }, h('summary', null, t + ' (' + lista.length + ')'), h('div', { class: 'grupo-btn' }, lista.map(([ruta, n]) => h('a', { class: 'btn chico', href: ruta, download: ruta.split('/').pop() }, LT.icono('descargar', 14), n)))))))));
    main.appendChild(cont);
    P.montar(main);
    if (location.hash) setTimeout(() => { const t = document.getElementById(location.hash.slice(1)); if (t) t.scrollIntoView(); }, 50);
  }

  /* ================================================= PRUEBA DE UBICACIÓN */
  const op = (texto, opciones, correcta) => ({ tipo: 'opcion', texto, opciones, correcta });
  const PRUEBAS = {
    sesion: [
      op('¿Qué diseño de diapositiva conviene para abrir un bloque nuevo de la plática?', ['Diapositiva de título', 'Encabezado de sección', 'En blanco', 'Contenido con título'], 1),
      op('¿Para qué sirven las secciones (Inicio › Sección)?', ['Para cambiar el tema de una parte', 'Para agrupar diapositivas con nombre y moverlas juntas', 'Para ocultar diapositivas', 'Para numerar las páginas'], 1),
      op('Texto gris claro (#BFBFBF) sobre fondo blanco tiene un contraste de 1.8:1. ¿Es suficiente para texto de 20 pt?', ['Sí', 'No: se recomienda al menos 4.5:1', 'Solo si está en negrita', 'Depende del tema'], 1),
      op('¿Qué diferencia hay entre un tema y una variante?', ['Ninguna', 'El tema define colores, fuentes y estilo; la variante cambia la combinación de colores o el fondo del mismo tema', 'La variante cambia las fuentes', 'El tema solo cambia el fondo'], 1),
      op('Agrandas una foto arrastrando el controlador del lado derecho. ¿Qué pasa?', ['Crece proporcionalmente', 'Se deforma', 'Se recorta', 'Se vuelve icono'], 1),
      op('Quieres mostrar los pasos del día de la vacuna en orden. ¿Qué usas?', ['Un gráfico circular', 'Un SmartArt de proceso', 'Una tabla de 10 columnas', 'Un video'], 1),
      op('Quieres que la música suene desde la portada hasta el final sin ver el icono. ¿Qué eliges?', ['Inicio: Al hacer clic en', 'Reproducir en el fondo', 'Ocultar diapositiva', 'Recortar audio'], 1),
      op('¿Cuál es la diferencia entre transición y animación?', ['Son lo mismo', 'La transición ocurre al pasar de una diapositiva a otra; la animación se aplica a un elemento dentro de la diapositiva', 'La animación es para diapositivas y la transición para textos', 'La transición solo funciona con video'], 1),
      op('Un virus debe desplazarse de una persona a otra dentro de la diapositiva. ¿Qué animación usas?', ['Entrada: Aparecer', 'Trayectoria de la animación', 'Transición Empuje', 'Énfasis: Impulso'], 1),
      op('La presentación de la sala de espera debe repetirse sola. ¿Qué configuras?', ['Usar vista del moderador', 'Intervalos en todas las diapositivas y Examinada en exposición', 'Ocultar todas las diapositivas', 'Animaciones al hacer clic'], 1),
    ],
  };

  function ubicacion() {
    const momento = param('momento') === 'post' ? 'post' : 'pre';
    const items = PRUEBAS.sesion;
    const main = h('main', { class: 'contenedor' });
    main.appendChild(h('section', { class: 'seccion' },
      h('div', { class: 'etiqueta-etapa' }, momento === 'pre' ? 'Prueba de ubicación' : 'Prueba final'),
      h('h1', null, NV.nombre),
      h('p', { class: 'intro' }, momento === 'pre' ? 'Diez preguntas sobre los 8 módulos. Si aciertas 8 o más, puedes ir directo a la etapa 4 (laboratorio en PowerPoint) de cada módulo. Al final de la sesión repetirás la misma prueba para medir tu avance.' : 'Las mismas preguntas de la prueba de ubicación, para medir cuánto avanzaste.'),
      h('div', { class: 'grupo-btn' }, h('a', { class: 'btn chico' + (momento === 'pre' ? ' primario' : ''), href: 'ubicacion.html' }, 'Ubicación (antes)'), h('a', { class: 'btn chico' + (momento === 'post' ? ' primario' : ''), href: 'ubicacion.html?momento=post' }, 'Final (después)'))));
    const respuestas = {};
    const lista = h('div');
    items.forEach((it, i) => {
      const caja = h('div', { class: 'prueba-item' }, h('div', { class: 'num' }, 'Pregunta ' + (i + 1) + ' de ' + items.length), h('p', { style: { fontWeight: 600 }, html: it.texto }));
      const ops = h('div', { class: 'opciones' });
      it.opciones.forEach((o, j) => {
        const b = h('button', { class: 'opcion', type: 'button' }, h('span', { class: 'letra' }, String.fromCharCode(65 + j)), h('span', { html: o }));
        b.addEventListener('click', () => { ops.querySelectorAll('.opcion').forEach((x) => x.classList.remove('elegida')); b.classList.add('elegida'); respuestas[i] = j === it.correcta; });
        ops.appendChild(b);
      });
      caja.appendChild(ops);
      lista.appendChild(caja);
    });
    main.appendChild(lista);
    const resultado = h('div');
    main.appendChild(h('div', { class: 'grupo-btn', style: { margin: '16px 0 30px' } }, h('button', { class: 'btn primario', onclick: () => {
      const faltan = items.map((_, i) => i).filter((i) => !(i in respuestas));
      if (faltan.length) { LT.ui.aviso('Faltan respuestas', 'Contesta todas las preguntas (faltan: ' + faltan.map((i) => i + 1).join(', ') + ').'); return; }
      const puntaje = Object.values(respuestas).filter(Boolean).length;
      const prog = LT.progreso.cargar();
      prog.ubicacion[NV.id] = prog.ubicacion[NV.id] || {};
      prog.ubicacion[NV.id][momento] = { puntaje, total: items.length, fecha: new Date().toISOString() };
      if (momento === 'pre') prog.ubicacion[NV.id].salto = puntaje >= Math.ceil(items.length * 0.8);
      LT.progreso.guardar();
      resultado.innerHTML = '';
      const salto = momento === 'pre' && prog.ubicacion[NV.id].salto;
      const previo = prog.ubicacion[NV.id].pre;
      resultado.appendChild(h('div', { class: 'tarjeta resultado-prueba' },
        h('div', { class: 'grande' }, puntaje + ' / ' + items.length),
        momento === 'post' && previo ? h('p', null, 'En la prueba de ubicación obtuviste ' + previo.puntaje + ' / ' + previo.total + '. ' + (puntaje > previo.puntaje ? '¡Avanzaste ' + (puntaje - previo.puntaje) + ' aciertos!' : 'Repasa los módulos donde fallaste.')) : null,
        h('p', null, salto ? '¡Excelente! Puedes ir directo a la etapa 4 (laboratorio) de cada módulo. Las etapas 1 a 3 siguen disponibles para repasar.' : momento === 'pre' ? 'Recorre los módulos en orden: cada uno empieza con un ejemplo resuelto.' : ''),
        h('div', { class: 'grupo-btn', style: { justifyContent: 'center' } }, NV.modulos.map((id) => h('a', { class: 'btn chico', href: P.urlModulo(id) + (salto ? '#etapa4' : '') }, 'Módulo ' + id)))));
      resultado.scrollIntoView({ behavior: 'smooth' });
    } }, 'Calificar')));
    main.appendChild(resultado);
    P.montar(main);
  }

  /* ===================================================== INTEGRADOR */
  const RUBRICA = [
    ['Estructura y mensaje', ['Sin orden claro', 'Orden con saltos o títulos vagos', 'Inicio, desarrollo y cierre claros', 'Títulos-mensaje y una llamada a la acción']],
    ['Diseño y legibilidad', ['Difícil de leer', 'Legible con detalles', 'Tema coherente, buen contraste y jerarquía', 'Se lee perfecto desde el fondo de la sala']],
    ['Recursos visuales y datos', ['Decorativos o confusos', 'Adecuados con errores', 'Bien elegidos y accesibles', 'Comunican mejor que el texto']],
    ['Movimiento y automatización', ['Distraen o fallan', 'Funcionan con detalles', 'Sutiles y automáticos', 'Refuerzan el mensaje y corren solos sin fallas']],
  ];
  const sut = ['fade', 'push', 'wipe', 'split', 'reveal', 'cut', 'randomBar', 'circle', 'diamond', 'plus', 'zoom', 'cover', 'pull', 'morph', 'flash', 'strips'];
  const INTEGRADORES = {
    sesion: {
      titulo: 'Pantalla de la sala de espera: campaña de vacunación contra influenza', archivo: 'int-sala-de-espera.pptx', acepta: '.pptx,.ppsx',
      descargas: [{ ruta: 'assets/media/imagenes/vacunacion.png', texto: 'Imagen de vacunación (PNG)' }, { ruta: 'assets/media/musica-sala-de-espera.wav', texto: 'Música de fondo (WAV)' }, { ruta: 'assets/media/video-lavado-de-manos.mp4', texto: 'Video de lavado de manos (opcional)' }],
      situacion: 'Empieza la temporada de influenza. Necesito que la pantalla de la sala de espera muestre la campaña de vacunación todo el día: clara desde cualquier asiento, con imágenes y datos, música suave y que avance y se repita sola.',
      tareas: [
        '<b>Estructura</b>: portada con «Diapositiva de título» y al menos 2 secciones con nombre.',
        '<b>Diseño</b>: un tema (no el de Office), máximo 2 fuentes, títulos de 32 pt o más y texto de 20 pt o más.',
        '<b>Imágenes e iconos</b>: la imagen de vacunación sin deformar y con texto alternativo; al menos 3 iconos.',
        '<b>Datos</b>: los pasos del día de la vacuna como SmartArt de proceso y las dosis por mes como gráfico (datos en las notas).',
        '<b>Música</b> de fondo en la portada, reproduciéndose en el fondo.',
        '<b>Movimiento</b>: una misma transición sutil en todas las diapositivas y al menos 2 animaciones, ninguna al hacer clic.',
        '<b>Automática</b>: intervalos en todas las diapositivas y Configurar presentación › Examinada en exposición. Puedes guardarla como .ppsx.',
      ],
      pruebas: () => [
        { titulo: 'Portada y secciones', fn: (P) => { if (!P.diapositivas[0] || P.diapositivas[0].diseno.tipo !== 'title') return 'La primera diapositiva debe usar «Diapositiva de título».'; const s = P.secciones.filter((x) => !/sin t[ií]tulo|predeterminada|untitled|default/i.test(x.nombre)); return s.length >= 2 ? true : 'Crea al menos 2 secciones con nombre (Inicio › Sección).'; } },
        { titulo: 'Tema aplicado', fn: (P) => (P.tema.nombre && !/office/i.test(P.tema.nombre) ? true : 'Aplica un tema distinto del de Office.') },
        { titulo: 'Tipografía legible', fn: (P, A) => { const f = A.fuentes(P); if (f.length > 2) return 'Usas ' + f.length + ' fuentes: deja dos.'; const t = P.diapositivas.find((d) => (A.tamTitulo(d) || 99) < 32); if (t) return 'El título de la diapositiva ' + t.n + ' mide menos de 32 pt.'; const c = P.diapositivas.find((d) => (A.tamCuerpo(d) || 99) < 20); return c ? 'En la diapositiva ' + c.n + ' hay texto de menos de 20 pt.' : true; } },
        { titulo: 'Imagen sin deformar y con texto alternativo', fn: (P, A) => { const im = P.diapositivas.flatMap((d) => A.imagenes(d)).filter((f) => !f.imagen.svg); if (!im.length) return 'Inserta la imagen de vacunación.'; const def = im.find((f) => A.deformada(f)); if (def) return 'La imagen «' + def.nombre + '» está deformada.'; const sin = im.find((f) => !f.decorativo && f.descr.length < 15); return sin ? 'Escribe el texto alternativo de «' + sin.nombre + '».' : true; } },
        { titulo: 'Tres iconos o más', fn: (P, A) => (P.diapositivas.reduce((s, d) => s + A.iconos(d).length, 0) >= 3 ? true : 'Inserta al menos 3 iconos.') },
        { titulo: 'SmartArt de proceso', fn: (P, A) => (P.diapositivas.some((d) => A.formas(d).some((f) => f.smartart && f.smartart.categorias.includes('process') && f.smartart.textos.length >= 3)) ? true : 'Convierte los pasos del día de la vacuna en un SmartArt de proceso.') },
        { titulo: 'Gráfico de las dosis', fn: (P, A) => { const g = P.diapositivas.flatMap((d) => A.formas(d)).find((f) => f.grafico); if (!g) return 'Inserta el gráfico de dosis por mes.'; if (g.grafico.puntos < 6) return 'Escribe en el gráfico los datos de los 6 meses (están en las notas).'; return g.grafico.tieneTitulo ? true : 'Ponle título al gráfico.'; } },
        { titulo: 'Música en el fondo', fn: (P) => { const a = P.diapositivas[0] && P.diapositivas[0].medios.find((m) => m.tipo === 'audio'); return a && a.todasDiapositivas && a.repetir && a.inicio === 'auto' ? true : 'Inserta la música en la portada y elige Reproducir en el fondo.'; } },
        { titulo: 'Una transición sutil para todo', fn: (P) => { const s = new Set(P.diapositivas.map((d) => (d.transicion && d.transicion.efecto) || 'ninguna')); const e = Array.from(s)[0]; return s.size === 1 && sut.includes(e) ? true : 'Usa una misma transición sutil en todas las diapositivas (Aplicar a todas).'; } },
        { titulo: 'Animaciones automáticas', fn: (P) => { const an = P.diapositivas.flatMap((d) => d.animaciones.filter((a) => ['entr', 'emph', 'exit', 'path'].includes(a.clase))); if (an.length < 2) return 'Agrega al menos 2 animaciones.'; return an.some((a) => a.inicio === 'clic') ? 'En exposición nadie hace clic: cambia las animaciones a «Después de la anterior» o «Con la anterior».' : true; } },
        { titulo: 'Presentación automática', fn: (P) => { const d = P.diapositivas.find((x) => !x.oculta && !(x.transicion && x.transicion.despues != null && x.transicion.despues > 0)); if (d) return 'La diapositiva ' + d.n + ' no tiene intervalo.'; if (P.config.tipo !== 'quiosco') return 'Configurar presentación › Examinada en exposición.'; return P.config.usarIntervalos ? true : 'Activa «Usar intervalos».'; } },
      ],
    },
  };

  function integrador() {
    const I = INTEGRADORES.sesion;
    const prog = LT.progreso.cargar();
    const guardado = prog.integradores[NV.id] || {};
    const main = h('main', { class: 'contenedor' });
    main.appendChild(h('section', { class: 'seccion' },
      h('div', { class: 'etiqueta-etapa' }, 'Reto integrador'),
      h('h1', null, I.titulo),
      h('div', { class: 'situacion' }, h('div', { class: 'avatar' }, C.iniciales), h('div', null, h('div', { class: 'de' }, C.coordinadora + ', ' + C.cargo + ', escribe:'), h('div', { class: 'msj' }, I.situacion))),
      h('p', { class: 'intro' }, 'Reúne lo aprendido en los 8 módulos. Se resuelve de forma autónoma en unos 45 minutos, después de la sesión. Se aprueba con el 80 % de las pruebas.')));
    const res = h('div');
    const inp = h('input', { type: 'file', accept: I.acepta, class: 'sr' });
    const zona = h('label', { class: 'zona-subir', tabindex: '0' }, inp, LT.icono('subir', 30), h('div', null, h('b', null, 'Sube tu presentación resuelta')), h('p', null, 'Archivo .pptx o .ppsx.'));
    const procesar = async (archivos) => {
      res.innerHTML = '';
      const f = Array.from(archivos).find((x) => /\.(pptx|ppsx|pptm)$/i.test(x.name));
      if (!f) { res.appendChild(h('div', { class: 'aviso-caja error' }, 'Sube una presentación de PowerPoint (.pptx o .ppsx).')); return; }
      try {
        const Pz = await LT.pptx.leer(f, f.name);
        const r = LT.pptx.revisar(Pz, I.pruebas(), 'analista');
        const ok = r.filter((x) => x.ok).length;
        const pct = Math.round((ok / r.length) * 100);
        const aprobado = pct >= 80;
        LT.progreso.cargar().integradores[NV.id] = Object.assign({}, LT.progreso.cargar().integradores[NV.id], { puntaje: pct, aprobado: aprobado || !!guardado.aprobado, fecha: new Date().toISOString(), archivo: f.name });
        LT.progreso.guardar();
        res.append(h('p', null, h('b', null, ok + ' de ' + r.length + ' pruebas superadas (' + pct + ' %).')), LT.modulo.resultadosLista(r, true));
        if (aprobado) res.appendChild(h('div', { class: 'exito' }, h('div', { html: LT.iconoSVG('trofeo', 44) }), h('div', null, h('h4', null, '¡Reto integrador aprobado!'), h('p', null, 'Ya puedes imprimir tu constancia (abajo).'))));
        dibujarConstancia();
      } catch (e) { res.appendChild(h('div', { class: 'aviso-caja error' }, e.message)); }
      inp.value = '';
    };
    inp.addEventListener('change', () => procesar(inp.files));
    zona.addEventListener('dragover', (e) => { e.preventDefault(); zona.classList.add('encima'); });
    zona.addEventListener('dragleave', () => zona.classList.remove('encima'));
    zona.addEventListener('drop', (e) => { e.preventDefault(); zona.classList.remove('encima'); procesar(e.dataTransfer.files); });
    main.appendChild(h('div', { class: 'lab-grid' },
      h('div', { class: 'widget' }, h('h3', null, 'Lo que debes entregar'), h('ol', { class: 'pasos-lab' }, I.tareas.map((t) => h('li', { html: t }))),
        h('div', { class: 'grupo-btn' }, h('a', { class: 'btn cafe', href: 'integradores/' + I.archivo, download: I.archivo }, LT.icono('descargar', 16), 'Descargar ' + I.archivo), I.descargas.map((d) => h('a', { class: 'btn chico', href: d.ruta, download: d.ruta.split('/').pop() }, LT.icono('descargar', 15), d.texto))),
        h('p', { style: { fontSize: '.88rem', color: 'var(--tinta-2)', marginTop: '8px' } }, 'La presentación trae el contenido en texto simple y los datos en las notas. Necesitas PowerPoint de escritorio (Ensayar intervalos y el modo de exposición no están en la versión web).')),
      h('div', { class: 'widget' }, h('h3', null, 'Verificador'), zona, res)));
    const sel = Object.assign({}, guardado.rubrica || {});
    const tabla = h('table', { class: 'tabla-sitio rubrica' });
    const dibujarRubrica = () => {
      tabla.innerHTML = '';
      tabla.appendChild(h('thead', null, h('tr', null, h('th', null, 'Criterio'), ['Inicial (1)', 'En desarrollo (2)', 'Logrado (3)', 'Destacado (4)'].map((x) => h('th', null, x)))));
      const tb = h('tbody');
      RUBRICA.forEach(([crit, niveles]) => tb.appendChild(h('tr', null, h('th', null, crit), niveles.map((t, j) => h('td', { class: 'clic' + (sel[crit] === j + 1 ? ' sel' : ''), tabindex: '0', onclick: () => { sel[crit] = j + 1; const p = LT.progreso.cargar(); p.integradores[NV.id] = Object.assign({}, p.integradores[NV.id], { rubrica: Object.assign({}, sel) }); LT.progreso.guardar(); dibujarRubrica(); } }, t)))));
      tabla.appendChild(tb);
    };
    dibujarRubrica();
    main.appendChild(h('section', { class: 'seccion' }, h('h2', null, 'Rúbrica'), h('p', { class: 'intro' }, 'Autoevalúate haciendo clic en el nivel que alcanzaste en cada criterio. El docente revisa la rúbrica junto con tu presentación.'), h('div', { class: 'tabla-scroll' }, tabla)));
    const constCont = h('section', { class: 'seccion' });
    main.appendChild(constCont);
    const dibujarConstancia = () => {
      constCont.innerHTML = '';
      const info = LT.progreso.cargar().integradores[NV.id] || {};
      if (!info.aprobado) { constCont.append(h('h2', null, 'Constancia'), h('p', { class: 'intro' }, 'La constancia se habilita al aprobar el reto integrador (80 % de las pruebas o más).')); return; }
      const nombre = LT.progreso.participante().nombre || '(escribe tu nombre en la página de inicio)';
      const ins = C.MODULOS.filter((m) => LT.progreso.estadoModulo(m.id).superado).length;
      constCont.append(h('div', { class: 'grupo-btn no-imprimir' }, h('h2', { style: { margin: 0 } }, 'Constancia'), h('button', { class: 'btn primario chico', onclick: () => window.print() }, 'Imprimir o guardar en PDF')),
        h('div', { class: 'constancia' }, h('div', { html: LT.GALERIA.logoSVG, style: { width: '90px', margin: '0 auto' } }), h('p', null, C.nombre + ' otorga la presente'), h('h1', null, 'Constancia'), h('p', null, 'a'), h('div', { class: 'nombre' }, nombre), h('p', null, 'por aprobar el reto integrador «' + I.titulo + '» del curso ' + C.nombre + ' (' + C.formato.toLowerCase() + '), con ' + ins + ' de ' + C.MODULOS.length + ' insignias de módulo.'), h('p', { style: { color: 'var(--tinta-3)', fontSize: '.9rem' } }, new Date(info.fecha).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }) + ' · Puntaje del verificador: ' + info.puntaje + ' %')));
    };
    dibujarConstancia();
    P.montar(main);
  }

  /* ========================================================= GLOSARIO */
  const ATAJOS = [
    ['Ctrl+M', 'Nueva diapositiva', 1], ['Ctrl+D', 'Duplicar la diapositiva u objeto seleccionado', 1], ['Ctrl+↑ / Ctrl+↓', 'Mover la diapositiva en el panel de miniaturas', 1],
    ['Ctrl+Espacio', 'Quitar el formato de caracteres puesto a mano', 2], ['Ctrl+Mayús+> / <', 'Aumentar o disminuir el tamaño de fuente', 2], ['Ctrl+N / Ctrl+K / Ctrl+S', 'Negrita, cursiva y subrayado', 2],
    ['Mayús + arrastrar', 'Cambiar el tamaño conservando la proporción', 3], ['Ctrl + arrastrar', 'Duplicar un objeto', 3], ['Mayús + clic', 'Seleccionar varios objetos', 3],
    ['Tab', 'Siguiente celda de una tabla (en la última, agrega una fila)', 4], ['Ctrl+Alt+K', 'Insertar vínculo', 5], ['Alt+P / Alt+Q', 'Reproducir o pausar / detener el video durante la presentación', 5],
    ['F5', 'Presentar desde el principio', 6], ['Mayús+F5', 'Presentar desde la diapositiva actual', 6], ['Alt+F5', 'Presentar con la vista del moderador', 8],
    ['→, Espacio, Entrar o clic', 'Siguiente animación o diapositiva', 7], ['← o Retroceso', 'Animación o diapositiva anterior', 7],
    ['Número + Entrar', 'Ir a esa diapositiva durante la presentación', 8], ['B / W', 'Pantalla negra / blanca durante la presentación', 8], ['Ctrl+L', 'Puntero láser', 8], ['Esc', 'Terminar la presentación', 8],
  ];
  function glosario() {
    const main = h('main', { class: 'contenedor' });
    const buscar = h('input', { class: 'buscador', type: 'search', placeholder: 'Buscar en español o inglés (por ejemplo: transición, morph, notas)', 'aria-label': 'Buscar término' });
    const terminos = [];
    for (const m of C.MODULOS) for (const [es, en, d] of ((LT.modulos[m.id] || {}).glosario || [])) terminos.push({ es, en, d, m: m.id });
    terminos.sort((a, b) => a.es.localeCompare(b.es, 'es'));
    const tabla = h('table', { class: 'tabla-sitio' });
    const dibujar = () => {
      const q = buscar.value.trim().toLowerCase();
      tabla.innerHTML = '';
      tabla.appendChild(h('thead', null, h('tr', null, ['Término', 'En inglés', 'Qué es', 'Módulo'].map((x) => h('th', null, x)))));
      const tb = h('tbody');
      terminos.filter((t) => !q || [t.es, t.en, t.d].some((x) => x.toLowerCase().includes(q))).forEach((t) => tb.appendChild(h('tr', null, h('td', null, h('b', null, t.es)), h('td', null, h('i', null, t.en)), h('td', { html: t.d }), h('td', null, h('a', { href: P.urlModulo(t.m) }, 'M' + t.m)))));
      tabla.appendChild(tb);
    };
    buscar.addEventListener('input', dibujar);
    dibujar();
    const atajos = h('table', { class: 'tabla-sitio' }, h('thead', null, h('tr', null, h('th', null, 'Atajo'), h('th', null, 'Qué hace'), h('th', null, 'Módulo'))), h('tbody', null, ATAJOS.map(([a, d, m]) => h('tr', null, h('td', null, h('kbd', null, a)), h('td', null, d), h('td', null, h('a', { href: P.urlModulo(m) }, 'M' + m))))));
    main.append(h('section', { class: 'seccion' }, h('div', { class: 'etiqueta-etapa' }, 'Referencia'), h('h1', null, 'Glosario de PowerPoint español-inglés'), h('p', { class: 'intro' }, 'Los términos de los 8 módulos con su nombre en inglés (útil para buscar ayuda o tutoriales). Para ver los efectos en movimiento, abre la ', h('a', { href: 'guia.html' }, 'Guía visual'), '.'), buscar),
      h('div', { class: 'tabla-scroll', style: { marginTop: '12px' } }, tabla),
      h('section', { class: 'seccion' }, h('h2', null, 'Atajos de teclado'), h('p', { class: 'intro' }, 'Atajos de PowerPoint para Windows en español. En Mac, Ctrl suele ser ⌘.'), h('div', { class: 'tabla-scroll' }, atajos)));
    P.montar(main);
  }

  LT.paginas = { inicio, ubicacion, integrador, glosario, PRUEBAS, INTEGRADORES, RUBRICA, NIVEL_TXT, ATAJOS };
})();

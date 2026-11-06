/* Guía visual de PowerPoint: conceptos clave con ejemplos en movimiento. */
(function () {
  'use strict';
  const LT = window.LT;
  const { h } = LT.u;
  const { miniaturas, escenario, capaInicial, demoTransicionAnimacion, medidorContraste, catalogo, R, K } = LT.ppt;

  function seccion(id, titulo, intro, ...hijos) {
    return h('section', { class: 'seccion gv-sec', id }, h('h2', null, titulo), intro ? h('p', { class: 'intro', html: intro }) : null, hijos);
  }
  function widget(fn) { const c = h('div', { class: 'widget' }); setTimeout(() => fn(c), 0); return c; }

  /* Inicio de las animaciones: tres formas de encadenarlas */
  function inicios(c) {
    const p = LT.Diapo.construir({ tema: 'sereno', diapositivas: [{ diseno: 'blanco', objetos: [
      { clave: 'a', tipo: 'forma', forma: 'redondeado', texto: '1', x: 120, y: 200, w: 200, h: 140, estilo: { tam: 48 }, relleno: 'tema:acento1' },
      { clave: 'b', tipo: 'forma', forma: 'redondeado', texto: '2', x: 380, y: 200, w: 200, h: 140, estilo: { tam: 48 }, relleno: 'tema:acento2' },
      { clave: 'c', tipo: 'forma', forma: 'redondeado', texto: '3', x: 640, y: 200, w: 200, h: 140, estilo: { tam: 48 }, relleno: 'tema:acento3' },
    ] }] });
    const casos = {
      'Todos «Al hacer clic»': ['clic', 'clic', 'clic'],
      '«Con la anterior»': ['clic', 'con', 'con'],
      '«Después de la anterior»': ['clic', 'despues', 'despues'],
    };
    const linea = h('div', { class: 'gv-linea' });
    const caja = h('div');
    const fila = h('div', { class: 'grupo-btn', style: { marginTop: '8px' } });
    c.append(caja, linea, fila, h('p', { class: 'instr' }, 'En «Al hacer clic» el simulador hace los clics por ti cada segundo. Fíjate en la línea de tiempo: «Con la anterior» empieza al mismo tiempo; «Después de la anterior» espera a que termine.'));
    let esc;
    setTimeout(() => { esc = escenario(caja, Math.min(560, c.clientWidth || 560)); capaInicial(esc, p, p.diapositivas[0]); }, 0);
    for (const [nombre, ini] of Object.entries(casos)) {
      fila.appendChild(h('button', { class: 'btn chico', onclick: () => {
        esc.limpiar();
        const d = JSON.parse(JSON.stringify(p.diapositivas[0]));
        d.animaciones = d.objetos.map((o, i) => ({ id: 'x' + i, objeto: o.id, efecto: 'zoom', cat: 'entrada', inicio: ini[i], duracion: 0.8, retraso: 0 }));
        const capa = capaInicial(esc, p, d);
        esc.preparar(capa, d);
        const pasos = R.pasos(d);
        linea.innerHTML = '';
        let t0 = 0;
        const max = pasos.reduce((s, g) => s + g.fin + 1, 0);
        pasos.forEach((g, k) => { g.items.forEach((it, j) => linea.appendChild(h('div', { class: 'gv-barra', style: { left: ((t0 + it.ini) / max * 100) + '%', width: (it.dur / max * 100) + '%', top: (j * 22 + (pasos.length > 1 ? 0 : 0)) + 'px', background: ['#2f80c0', '#5fb49c', '#f2b134'][d.objetos.findIndex((o) => o.id === it.anim.objeto)] } }, String(d.objetos.findIndex((o) => o.id === it.anim.objeto) + 1) + (it.anim.inicio === 'clic' ? ' 🖱' : '')))); if (k < pasos.length - 1) linea.appendChild(h('div', { class: 'gv-clic', style: { left: ((t0 + g.fin + 0.5) / max * 100) + '%' } }, 'clic')); t0 += g.fin + 1; });
        pasos.reduce((pr, g, k) => pr.then(() => new Promise((ok) => setTimeout(ok, k ? 700 : 150))).then(() => esc.ejecutar(capa, d, g)), Promise.resolve());
      } }, '▶ ' + nombre));
    }
  }

  /* Maqueta anotada de la vista del moderador */
  function moderador(c) {
    const p = LT.Diapo.construir({ tema: 'sereno', variante: 1, diapositivas: [
      { diseno: 'tituloObjetos', titulo: '¿Quién debe vacunarse?', cuerpo: 'Personal de salud\nAdultos de 60 años o más\nEmbarazadas\nNiñas y niños de 6 a 59 meses' },
      { diseno: 'tituloObjetos', titulo: '¿Dónde y cuándo?', cuerpo: 'Módulo de vacunación, planta baja\nLunes a viernes de 8:00 a 14:00' },
    ] });
    const n = (k) => h('span', { class: 'gv-num' }, String(k));
    c.appendChild(h('div', { class: 'gv-mod' },
      h('div', { class: 'gv-mod-barra' }, n(1), h('b', null, '0:12:35'), ' ⏯ ↺', h('span', { style: { marginLeft: 'auto' } }, '10:42 a. m.')),
      h('div', { class: 'gv-mod-cuerpo' },
        h('div', null, n(2), R.escalada(p, p.diapositivas[0], 360, { modo: 'show' }), h('div', { class: 'gv-mod-ctrl' }, n(4), '◀  Diapositiva 3 de 5  ▶ · ▦ Ver todas · ■ Pantalla negra · 🔍 Zoom · ✎ Puntero láser')),
        h('div', null, n(3), h('div', { class: 'gv-mod-et' }, 'Siguiente'), R.escalada(p, p.diapositivas[1], 200, { modo: 'show' }), n(5), h('div', { class: 'gv-mod-et' }, 'Notas'), h('div', { class: 'gv-mod-notas' }, 'Menciona que la primera vez los niños de 6 a 59 meses necesitan 2 dosis. Pregunta quién ya se vacunó.')))));
    c.appendChild(h('ol', { class: 'gv-leyenda' }, h('li', null, 'Cronómetro de tu exposición y reloj.'), h('li', null, 'Diapositiva actual: lo único que ve el público.'), h('li', null, 'Siguiente diapositiva o siguiente animación.'), h('li', null, 'Navegación y herramientas: ver todas, pantalla negra (B), zoom y puntero láser (Ctrl+L).'), h('li', null, 'Tus notas del orador; puedes agrandar el texto.')));
    c.appendChild(h('p', { class: 'instr' }, 'Con dos pantallas (proyector), PowerPoint muestra esta vista en tu laptop. Con una sola pantalla, ábrela con Alt+F5. Puedes probarla en el módulo 8.'));
  }

  function jerarquia(c) {
    const mal = LT.Diapo.construir({ tema: 'office', diapositivas: [{ diseno: 'tituloObjetos', titulo: 'Acciones para controlarla', cuerpo: 'Mide tu presión al menos una vez al año\nReduce la sal y los alimentos procesados\nCamina 30 minutos al día\nToma tus medicamentos como te indicaron', estilos: { titulo: { tam: 22, fuente: 'Comic Sans MS', color: '#ffc000' }, cuerpo: { tam: 26, negrita: true, fuente: 'Times New Roman', color: '#7f7f7f' } } }] });
    const bien = LT.Diapo.construir({ tema: 'clinico', variante: 1, diapositivas: [{ diseno: 'tituloObjetos', titulo: 'Acciones para controlarla', cuerpo: 'Mide tu presión al menos una vez al año\nReduce la sal y los alimentos procesados\nCamina 30 minutos al día\nToma tus medicamentos como te indicaron' }] });
    miniaturas(c, [[mal, 0, '<b>Evita</b>: título más chico que el texto, tres fuentes, amarillo y gris claro sobre blanco', 'mal'], [bien, 0, '<b>Mejor</b>: tema, título dominante, dos fuentes y buen contraste', 'bien']], 320);
    c.appendChild(h('div', { class: 'tabla-scroll' }, h('table', { class: 'tabla-sitio' }, h('thead', null, h('tr', null, h('th', null, 'Elemento'), h('th', null, 'Tamaño orientativo'), h('th', null, 'Consejo'))), h('tbody', null,
      [['Título', '36 a 44 pt', 'Una frase-mensaje; máximo dos líneas.'], ['Texto principal', '24 a 32 pt', 'Frases cortas; 3 a 6 viñetas.'], ['Texto secundario (fuentes, pies)', '18 a 20 pt', 'Nunca menos de 18 pt en pantalla.'], ['Familias de letra', 'Máximo 2', 'Las del tema: una para títulos y otra para el texto.']].map((r) => h('tr', null, r.map((x) => h('td', null, x))))))));
  }

  function smartTablaGrafico(c) {
    c.appendChild(h('div', { class: 'tabla-scroll' }, h('table', { class: 'tabla-sitio' }, h('thead', null, h('tr', null, h('th', null, 'Si quieres mostrar…'), h('th', null, 'Usa'), h('th', null, 'Ejemplo de la clínica'))), h('tbody', null,
      [['Pasos en orden', 'SmartArt de Proceso', 'Registro → Valoración → Aplicación → Observación'], ['Etapas que se repiten', 'SmartArt de Ciclo', 'Ciclo de transmisión de la influenza'], ['Quién depende de quién', 'SmartArt de Jerarquía', 'Organigrama de Enfermería'], ['Valores exactos para consultar', 'Tabla', 'Dosis por grupo y edad'], ['Comparar cantidades', 'Gráfico de columnas o barras', 'Dosis por sede'], ['Cambio en el tiempo', 'Gráfico de líneas', 'Dosis por mes'], ['Partes de un todo (2 a 5)', 'Gráfico circular', 'Tipo de pago de las consultas']].map((r) => h('tr', null, r.map((x) => h('td', null, x))))))));
  }

  function kiosco(c) {
    c.appendChild(h('ol', { class: 'gv-check' }, [
      'Todas las diapositivas tienen intervalo: Transiciones › Después de, o Presentación con diapositivas › Ensayar intervalos.',
      'Las animaciones inician «Con la anterior» o «Después de la anterior» (nadie hará clic).',
      'Videos y música: Inicio «Automáticamente»; la música, «Reproducir en el fondo».',
      'Presentación con diapositivas › Configurar presentación › Examinada en exposición (pantalla completa).',
      '«Usar intervalos» activado.',
      'Guárdala como .ppsx para que abra directo en modo presentación; para salir, Esc.',
    ].map((x) => h('li', null, x))));
  }

  function pagina() {
    const main = h('main', { class: 'contenedor' });
    const secciones = [
      ['transicion', 'Transición o animación'], ['estructura', 'Estructura de una presentación'], ['jerarquia', 'Jerarquía visual y tipografía'], ['color', 'Uso del color y contraste'],
      ['datos', 'SmartArt, tabla o gráfico'], ['transiciones', 'Catálogo de transiciones'], ['animaciones', 'Catálogo de animaciones'], ['inicio', 'Al hacer clic, con la anterior o después'],
      ['moderador', 'Vista del moderador'], ['automatica', 'Presentación automática'],
    ];
    main.appendChild(h('section', { class: 'seccion' }, h('div', { class: 'etiqueta-etapa' }, 'Referencia'), h('h1', null, 'Guía visual de PowerPoint'), h('p', { class: 'intro' }, 'Los conceptos clave del curso con ejemplos en movimiento. Úsala para repasar antes del laboratorio o del reto integrador.'),
      h('nav', { class: 'gv-indice', 'aria-label': 'Contenido de la guía' }, secciones.map(([id, t], i) => h('a', { href: '#' + id }, (i + 1) + '. ' + t)))));
    main.appendChild(seccion('transicion', '1. Transición o animación', '<b>Transición</b>: efecto que ocurre al pasar de una diapositiva a otra. <b>Animación</b>: efecto aplicado a un elemento dentro de una diapositiva.', widget(demoTransicionAnimacion),
      h('div', { class: 'tabla-scroll' }, h('table', { class: 'tabla-sitio' }, h('thead', null, h('tr', null, h('th', null, ''), h('th', null, 'Transición'), h('th', null, 'Animación'))), h('tbody', null,
        [['Afecta a', 'Toda la diapositiva que entra', 'Un objeto: texto, imagen, icono, forma, gráfico'], ['Pestaña', 'Transiciones', 'Animaciones'], ['Tipos', 'Sutiles, llamativas y contenido dinámico', 'Entrada, énfasis, salida y trayectorias'], ['Tiempo', 'Duración y avance (al hacer clic o después de un tiempo)', 'Inicio, duración y retraso de cada efecto'], ['Regla práctica', 'Una sutil para todo; otra solo para cambiar de sección', 'Solo cuando ayuda a entender: revelar, señalar o mostrar un proceso']].map((r) => h('tr', null, h('th', null, r[0]), h('td', null, r[1]), h('td', null, r[2]))))))));
    main.appendChild(seccion('estructura', '2. Estructura de una presentación', 'Portada → propósito o agenda → bloques de desarrollo (cada uno abre con un encabezado de sección) → cierre con mensaje clave, llamada a la acción y contacto.', widget((c) => {
      const p = LT.Diapo.construir({ tema: 'clinico', variante: 1, diapositivas: [
        { diseno: 'titulo', titulo: 'Diabetes: conócela y contrólala', subtitulo: 'Clínica Universitaria Vida Sana' },
        { diseno: 'tituloObjetos', titulo: '¿Qué veremos?', cuerpo: 'Qué es la diabetes\nCómo se detecta\nCómo controlarla' },
        { diseno: 'seccion', titulo: 'Cómo se detecta', texto: 'Bloque 2' },
        { diseno: 'comparacion', titulo: 'Glucosa en ayuno', enc1: 'Normal', cuerpo: 'Menos de 100 mg/dL', enc2: 'Alterada', cuerpo2: '100 mg/dL o más: acude a consulta' },
        { diseno: 'titulo', titulo: 'Camina 30 minutos al día', subtitulo: '¿Preguntas? Educación para la Salud' },
      ] });
      miniaturas(c, [[p, 0, 'Portada · Diapositiva de título'], [p, 1, 'Agenda · Título y objetos'], [p, 2, 'Bloque · Encabezado de sección'], [p, 3, 'Desarrollo · Comparación'], [p, 4, 'Cierre · mensaje y contacto']], 190);
    })));
    main.appendChild(seccion('jerarquia', '3. Jerarquía visual y tipografía', 'El ojo va primero a lo más grande, pesado y contrastado: ese lugar es para el título-mensaje.', widget(jerarquia)));
    main.appendChild(seccion('color', '4. Uso del color y contraste', 'Usa la paleta del tema, un color de énfasis y un contraste de al menos 4.5:1 (3:1 en texto de 24 pt o más). No comuniques solo con color.', widget((c) => medidorContraste(c))));
    main.appendChild(seccion('datos', '5. SmartArt, tabla o gráfico', 'Elige según el mensaje, no según lo que se ve bonito.', widget(smartTablaGrafico)));
    main.appendChild(seccion('transiciones', '6. Catálogo de transiciones', 'Haz clic en una transición para verla. En la clínica usa las sutiles.', widget((c) => catalogo(c, 'transiciones'))));
    main.appendChild(seccion('animaciones', '7. Catálogo de animaciones', 'Verde = entrada, amarillo = énfasis, rojo = salida y gris = trayectorias.', widget((c) => catalogo(c, 'animaciones'))));
    main.appendChild(seccion('inicio', '8. Al hacer clic, con la anterior o después de la anterior', 'El <b>Inicio</b> de cada animación decide si espera un clic o se encadena sola. La <b>duración</b> es la velocidad y el <b>retraso</b>, la espera antes de empezar.', widget(inicios)));
    main.appendChild(seccion('moderador', '9. Vista del moderador', 'Lo que ve quien presenta mientras el público ve solo la diapositiva.', widget(moderador)));
    main.appendChild(seccion('automatica', '10. Presentación automática (sala de espera)', 'Lista de comprobación antes de dejarla corriendo sola.', widget(kiosco)));
    LT.pagina.montar(main);
    if (location.hash) setTimeout(() => { const t = document.getElementById(location.hash.slice(1)); if (t) t.scrollIntoView(); }, 80);
  }

  LT.guia = { pagina };
})();

/* Módulo 8 · Presentación automática, ensayo de intervalos y vista del moderador */
(function () {
  const { h } = LT.u;
  const { porClave, revisor } = LT.ppt;

  const inicial = () => LT.Diapo.construir({
    titulo: 'Vacunación contra influenza', tema: 'sereno', variante: 1,
    diapositivas: [
      { clave: 'portada', diseno: 'titulo', titulo: 'Vacunación contra influenza: lo que debes saber', subtitulo: 'Clínica Universitaria Vida Sana', transicion: { efecto: 'desvanecer', duracion: 0.7 } },
      { clave: 'porque', diseno: 'tituloObjetos', titulo: '¿Por qué vacunarte cada año?', cuerpo: 'El virus cambia cada temporada\nLa vacuna reduce complicaciones y hospitalizaciones\nProteges a bebés y a personas mayores', transicion: { efecto: 'desvanecer', duracion: 0.7 }, notas: 'La influenza puede complicarse en adultos mayores, embarazadas y personas con enfermedades crónicas. Pregunta al público quién ya se vacunó este año.', animaciones: [{ objeto: 'cuerpo', efecto: 'desvanecer', inicio: 'clic' }] },
      { clave: 'quien', diseno: 'tituloObjetos', titulo: '¿Quién debe vacunarse?', cuerpo: 'Personal de salud\nAdultos de 60 años o más\nEmbarazadas\nNiñas y niños de 6 a 59 meses\nPersonas con enfermedades crónicas', transicion: { efecto: 'desvanecer', duracion: 0.7 } },
      { clave: 'donde', diseno: 'tituloObjetos', titulo: '¿Dónde y cuándo?', cuerpo: 'Módulo de vacunación, planta baja\nLunes a viernes de 8:00 a 14:00\nTrae tu cartilla de vacunación', transicion: { efecto: 'desvanecer', duracion: 0.7 }, notas: 'Recuerda que la vacuna es gratuita para los grupos prioritarios.' },
      { clave: 'cierre', diseno: 'titulo', titulo: 'Vacúnate: protégete y protege a tu familia', subtitulo: '¿Dudas? Pregunta en recepción', transicion: { efecto: 'desvanecer', duracion: 0.7 } },
    ],
  });

  function verificar(ed, nivel) {
    const p = ed.p;
    const add = revisor();
    const R = ed.registro;
    const sinNotas = p.diapositivas.findIndex((d) => String(d.notas || '').trim().length < 15);
    add(sinNotas < 0, 'Notas del orador en todas las diapositivas', 'Escribe notas (15 caracteres o más) en la diapositiva ' + (sinNotas + 1) + ': es lo que dirás al presentar.');
    add(R.moderador > 0 && R.maxDiapoModerador >= 3, 'Vista del moderador probada', 'Presenta con la vista del moderador (Presentación con diapositivas › Vista del moderador, o Alt+F5) y avanza al menos hasta la diapositiva 3 leyendo tus notas.');
    const sinT = p.diapositivas.findIndex((d) => !(d.transicion && d.transicion.despues != null && d.transicion.despues >= 3 && d.transicion.despues <= 60));
    add(sinT < 0, 'Intervalos en todas las diapositivas', sinT >= 0 && p.diapositivas[sinT].transicion && p.diapositivas[sinT].transicion.despues != null ? 'El intervalo de la diapositiva ' + (sinT + 1) + ' debe estar entre 3 y 60 s.' : 'La diapositiva ' + (sinT + 1) + ' no tiene intervalo: usa Ensayar intervalos o Transiciones › Después de.');
    const clic = p.diapositivas.findIndex((d) => d.animaciones.some((a) => a.inicio === 'clic'));
    add(clic < 0, 'Animaciones automáticas', 'En la diapositiva ' + (clic + 1) + ' hay una animación «Al hacer clic»: en exposición nadie hará clic. Cámbiala a «Después de la anterior».');
    add(p.config.tipo === 'quiosco', 'Examinada en exposición (pantalla completa)', 'Configurar presentación › Tipo: Examinada en exposición (pantalla completa).');
    add(p.config.avance === 'intervalos', 'Usar intervalos', 'Activa «Usar intervalos» (o, en Configurar presentación, «Usar los intervalos de diapositiva guardados»).');
    if (nivel === 'experto') {
      add(R.ensayosGuardados > 0, 'Intervalos ensayados', 'Usa Presentación con diapositivas › Ensayar intervalos y conserva los intervalos al final.');
      add(R.quiosco > 0, 'Prueba en modo exposición', 'Presenta (F5) ya configurada en exposición y deja que avance sola.');
    }
    return add.lista;
  }
  function crearReto(cont, nivel, extra) {
    return LT.modulo.retoSimulador(cont, { presentacion: inicial(), herramientas: ['presentacion', 'transiciones', 'animaciones', 'vista'], pestana: 'presentacion', verificar }, extra);
  }

  function demoModerador(c) {
    const p = inicial();
    p.diapositivas.forEach((d, i) => { if (!d.notas) d.notas = ['Saludo. Presenta al equipo de vacunación.', '', 'Menciona que los niños de 6 a 59 meses necesitan 2 dosis la primera vez.', '', 'Invita a pasar al módulo al terminar la plática.'][i]; });
    const caja = h('div');
    c.appendChild(caja);
    const ed = new LT.Diapo(caja, { presentacion: p, herramientas: ['presentacion'], alto: 420, panel: null });
    c.appendChild(h('div', { class: 'grupo-btn', style: { marginTop: '8px' } }, h('button', { class: 'btn primario chico', onclick: () => ed.presentar({ desde: 0, moderador: true }) }, '▶ Abrir la vista del moderador (Alt+F5)')));
  }

  LT.definirModulo({
    id: 8,
    objetivo: 'Preparar una presentación que avance sola con intervalos y modo de exposición, y presentar con la vista del moderador y notas del orador.',
    situacion: 'Necesito dos usos para la plática de <b>vacunación</b>: que yo la presente en el auditorio con mis notas, sin leerlas en la pantalla, y que después se repita sola en la <b>pantalla de la sala de espera</b>, sin que nadie tenga que hacer clic.',
    explicacion: [
      { html: '<h3>Notas del orador y vista del moderador</h3><p>Las <b>notas</b> (panel inferior; Vista › Notas) guardan lo que vas a decir, datos y tiempos. En la <b>vista del moderador</b> (Presentación con diapositivas › Usar vista del moderador) ves la diapositiva actual, la siguiente, tus notas y el cronómetro; el público solo ve la diapositiva. Con un solo monitor, pruébala con <kbd>Alt+F5</kbd>. Desde ahí puedes ver todas las diapositivas, oscurecer la pantalla (B), acercar una zona y usar el puntero láser (Ctrl+L).</p><h3>Intervalos</h3><p>Un intervalo es el tiempo que la diapositiva permanece antes de avanzar sola: se pone en <b>Transiciones › Después de</b> o se graba con <b>Presentación con diapositivas › Ensayar intervalos</b>, que cronometra cada diapositiva mientras la presentas en voz alta y al final pregunta si quieres conservar los tiempos. La casilla <b>Usar intervalos</b> los activa.</p>' },
      { html: '<h3>Presentación automática (modo exposición)</h3><p><b>Configurar presentación › Examinada en exposición (pantalla completa)</b> crea un quiosco: la presentación <b>se repite</b> hasta presionar Esc y el público no puede avanzar con clics (los vínculos sí funcionan). Por eso <b>todas las diapositivas necesitan intervalo</b> y las animaciones deben iniciar <i>Con la anterior</i> o <i>Después de la anterior</i>. Para que el archivo abra directo en presentación, guárdalo como <b>Presentación con diapositivas de PowerPoint (.ppsx)</b>.</p><table class="tabla-sitio"><thead><tr><th>Tipo de presentación</th><th>Para qué</th></tr></thead><tbody><tr><td>Presentado por un orador</td><td>Exposición en vivo; avanzas tú.</td></tr><tr><td>Examinada de forma individual (ventana)</td><td>Alguien la revisa solo en su computadora.</td></tr><tr><td>Examinada en exposición</td><td>Pantalla de una sala de espera o un stand: se repite sola.</td></tr></tbody></table>' },
      { titulo: 'Prueba la vista del moderador', widget: demoModerador },
    ],
    ejemplo: {
      titulo: 'Ensayar intervalos y dejarla automática',
      pasos: [
        { texto: 'Presentación con diapositivas › Ensayar intervalos. Di tu texto en voz alta y avanza con clic o →; la barra Grabación cronometra cada diapositiva.', ruta: ['Presentación con diapositivas', 'Ensayar intervalos'] },
        'Al terminar, responde «Sí» para conservar los intervalos. En el Clasificador verás el tiempo debajo de cada diapositiva.',
        { texto: 'Presentación con diapositivas › Configuración de la presentación con diapositivas › Examinada en exposición (pantalla completa) › Aceptar.', ruta: ['Presentación con diapositivas', 'Configuración de la presentación con diapositivas'] },
        { texto: 'Comprueba que «Usar intervalos» está activada y presenta con F5.', ruta: ['Presentación con diapositivas', 'Usar intervalos'] },
      ],
      pregunta: { texto: 'En modo «Examinada en exposición», una diapositiva no tiene intervalo. ¿Qué pasa?', opciones: ['Avanza al hacer clic', 'Se queda detenida en esa diapositiva', 'Avanza sola después de 5 segundos', 'Se cierra la presentación'], correcta: 1, explicacion: 'En exposición los clics no avanzan: sin intervalo, la presentación se queda en esa diapositiva.' },
    },
    micro: [
      { titulo: 'Las notas del orador', tipo: 'opcion', enunciado: 'Durante la exposición, ¿quién ve las notas del orador?', opciones: ['Todo el público', 'Solo el orador, en la vista del moderador', 'Nadie: solo sirven para imprimir', 'Quien tenga el PDF'], correcta: 1, explicacion: 'La vista del moderador muestra tus notas solo en tu pantalla.' },
      { titulo: '¿Dónde se hace?', tipo: 'clasificar', ancho: true, enunciado: 'Relaciona cada tarea con la herramienta.', categorias: ['Ensayar intervalos', 'Configurar presentación', 'Vista del moderador'], items: [['Grabar cuánto tiempo pasas en cada diapositiva', 0, 'Ensayar intervalos cronometra cada diapositiva.'], ['Repetir la presentación hasta presionar Esc', 1, 'Es una opción de Configurar presentación.'], ['Ver la siguiente diapositiva y tus notas mientras expones', 2, 'Eso muestra la vista del moderador.'], ['Que el público no pueda avanzar con clics', 1, 'Examinada en exposición, en Configurar presentación.'], ['Cronómetro de tu exposición', 2, 'La vista del moderador tiene cronómetro.']] },
      { titulo: 'Animaciones en la sala de espera', tipo: 'opcion', enunciado: 'Para la pantalla de la sala de espera (exposición), ¿cómo deben iniciar las animaciones?', opciones: ['Al hacer clic', 'Con la anterior o Después de la anterior', 'No importa', 'Con un desencadenador'], correcta: 1, explicacion: 'Nadie hará clic: las animaciones deben encadenarse solas.' },
    ],
    reto: {
      titulo: 'Ensayar y dejar lista la presentación', tipo: 'widget', crear: crearReto,
      base: {
        instrucciones: ['Escribe notas del orador en todas las diapositivas.', 'Presenta con la vista del moderador y avanza al menos hasta la diapositiva 3.', 'Da un intervalo de 3 a 60 s a todas las diapositivas (Ensayar intervalos o Transiciones › Después de).', 'Cambia la animación de la diapositiva 2 para que no espere un clic.', 'Configurar presentación: Examinada en exposición y Usar intervalos.'],
        pistas: ['Primero prepara la exposición en vivo (notas y moderador); después, la versión automática.', 'Notas: panel inferior. Vista del moderador: Alt+F5 o Usar vista del moderador + F5. Intervalos: Ensayar intervalos. Configurar presentación está en la pestaña Presentación con diapositivas.', 'Escribe notas en las diapositivas 1, 3 y 5 › Alt+F5 y avanza 3 diapositivas › Esc › Ensayar intervalos (unos 5 s por diapositiva) › Sí › Animaciones (diapositiva 2): Inicio «Después de la anterior» › Configurar presentación › Examinada en exposición › Aceptar.'],
      },
      niveles: {
        explorador: { instrucciones: ['Escribe en el panel de notas de las diapositivas 1, 3 y 5 lo que dirías (una o dos frases).', 'Pestaña Presentación con diapositivas: con la diapositiva 1 seleccionada pulsa «Vista del moderador» (o Alt+F5). Avanza con → hasta la diapositiva 3 leyendo tus notas; sal con Esc.', 'Pulsa «Ensayar intervalos» y avanza diciendo el texto en voz alta (unos 5 s por diapositiva). Al final elige «Sí».', 'Diapositiva 2 › Animaciones › Panel de animación: cambia el Inicio a «Después de la anterior».', '«Configurar presentación» › Examinada en exposición › Avance: Usar los intervalos › Aceptar.', 'Presenta con F5 y mira cómo avanza y se repite sola.'] },
        experto: { instrucciones: ['Todo lo del nivel Analista.', 'Usa Ensayar intervalos (no los escribas a mano) y conserva los tiempos.', 'Pruébala en modo exposición (F5) después de configurarla.'] },
      },
    },
    lab: {
      archivo: 'lab08-vacunacion-sala-de-espera.pptx', titulo: 'La plática lista para la sala de espera',
      contexto: 'Cinco diapositivas con transición; solo dos tienen notas y la diapositiva 2 tiene una animación al hacer clic.',
      pasos: {
        explorador: ['Escribe notas en las diapositivas que no tienen.', { texto: 'Presentación con diapositivas › Ensayar intervalos; al final, «Sí».', ruta: ['Presentación con diapositivas', 'Ensayar intervalos'] }, { texto: 'Diapositiva 2: Animaciones › Inicio: Después de la anterior.', ruta: ['Animaciones', 'Inicio'] }, { texto: 'Presentación con diapositivas › Configuración de la presentación con diapositivas › Examinada en exposición (pantalla completa).', ruta: ['Presentación con diapositivas', 'Configuración de la presentación con diapositivas'] }, 'Revisa que «Usar intervalos» esté activada y prueba con F5 (sales con Esc).', 'Guarda y sube la presentación.'],
        analista: ['Notas en todas las diapositivas.', 'Intervalos en todas.', 'Animaciones sin clic.', 'Examinada en exposición con intervalos.', 'Guarda y sube la presentación.'],
        experto: ['Todo lo del nivel Analista.', 'Guárdala como Presentación con diapositivas de PowerPoint (.ppsx) y sube ese archivo.'],
      },
      acepta: '.pptx,.ppsx',
      notaWeb: 'PowerPoint para la web no tiene Ensayar intervalos ni el modo de exposición: usa PowerPoint de escritorio.',
      pruebas: [
        { titulo: 'Notas del orador en todas', fn: (P) => { const d = P.diapositivas.find((x) => x.notas.length < 15); return d ? 'Escribe notas en la diapositiva ' + d.n + '.' : true; } },
        { titulo: 'Intervalos en todas', fn: (P) => { const d = P.diapositivas.find((x) => !x.oculta && !(x.transicion && x.transicion.despues != null && x.transicion.despues > 0)); return d ? 'La diapositiva ' + d.n + ' no tiene intervalo (Ensayar intervalos o Transiciones › Después de).' : true; } },
        { titulo: 'Animaciones automáticas', fn: (P) => { const d = P.diapositivas.find((x) => x.animaciones.some((a) => a.clase !== 'mediacall' && a.inicio === 'clic' && !a.interactiva)); return d ? 'La diapositiva ' + d.n + ' tiene una animación «Al hacer clic».' : true; } },
        { titulo: 'Examinada en exposición', fn: (P) => (P.config.tipo === 'quiosco' ? true : 'Configurar presentación › Examinada en exposición (pantalla completa).') },
        { titulo: 'Usar intervalos', fn: (P) => (P.config.usarIntervalos ? true : 'Activa «Usar intervalos».') },
        { titulo: 'Guardada como .ppsx', nivel: 'experto', fn: (P) => (P.extension === 'ppsx' ? true : 'Guárdala como Presentación con diapositivas de PowerPoint (.ppsx) y sube ese archivo.') },
      ],
    },
    donde: [
      { comando: 'Ensayar intervalos', ruta: ['Presentación con diapositivas', 'Ensayar intervalos'] },
      { comando: 'Configurar presentación', ruta: ['Presentación con diapositivas', 'Configuración de la presentación con diapositivas'] },
      { comando: 'Usar vista del moderador', ruta: ['Presentación con diapositivas', 'Usar vista del moderador'] },
      { comando: 'Mostrar el panel de notas', ruta: ['Vista', 'Notas'] },
      { comando: 'Guardar como .ppsx', ruta: ['Archivo', 'Guardar como', 'Presentación con diapositivas de PowerPoint (*.ppsx)'] },
    ],
    glosario: [
      ['Notas del orador', 'Speaker notes', 'Texto de apoyo que solo ve quien presenta.'],
      ['Vista del moderador', 'Presenter View', 'Pantalla del orador con diapositiva actual, siguiente, notas y cronómetro.'],
      ['Ensayar intervalos', 'Rehearse Timings', 'Cronometra cada diapositiva mientras ensayas y guarda los tiempos.'],
      ['Intervalo', 'Timing', 'Tiempo que una diapositiva permanece antes de avanzar sola.'],
      ['Examinada en exposición', 'Browsed at a kiosk', 'Presentación automática que se repite y no avanza con clics.'],
      ['.ppsx', 'PowerPoint Show', 'Archivo que se abre directo en modo presentación.'],
    ],
    atajos: ['<kbd>F5</kbd> desde el principio · <kbd>Mayús+F5</kbd> desde la actual · <kbd>Alt+F5</kbd> con la vista del moderador.', 'Durante la presentación: <kbd>B</kbd> pantalla negra, <kbd>W</kbd> pantalla blanca, número + <kbd>Entrar</kbd> va a esa diapositiva, <kbd>Ctrl+L</kbd> puntero láser, <kbd>Esc</kbd> termina.'],
  });
})();

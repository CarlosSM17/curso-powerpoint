/* Módulo 6 · Transiciones (y la diferencia entre transición y animación) */
(function () {
  const { h } = LT.u;
  const { porClave, revisor, K, demoTransicionAnimacion, catalogo } = LT.ppt;

  const T = (efecto, extra) => Object.assign({ efecto, duracion: K.transicion(efecto).dur, opcion: (K.transicion(efecto).opciones || [])[0] || null }, extra || {});
  const inicial = () => LT.Diapo.construir({
    titulo: 'Comité de Calidad', tema: 'office', variante: 2,
    diapositivas: [
      { clave: 'portada', diseno: 'titulo', titulo: 'Informe del Comité de Calidad 2026', subtitulo: 'Clínica Universitaria Vida Sana', transicion: T('vortice', { sonido: 'Aplauso' }) },
      { clave: 'agenda', diseno: 'tituloObjetos', titulo: 'Agenda', cuerpo: 'Resultados del semestre\nAcciones de mejora\nAcuerdos', transicion: T('cubo') },
      { clave: 'sec1', diseno: 'seccion', titulo: 'Resultados del semestre', texto: 'Enero a junio', transicion: T('cortinas', { sonido: 'Redoble' }) },
      { clave: 'r1', diseno: 'tituloObjetos', titulo: 'La satisfacción de pacientes subió a 92 %', cuerpo: 'Encuesta de salida con 1,240 respuestas\nMejor calificado: trato del personal\nPor mejorar: tiempo de espera', transicion: T('galeria', { duracion: 3 }) },
      { clave: 'r2', diseno: 'tituloObjetos', titulo: 'La espera promedio bajó a 18 minutos', cuerpo: 'Citas escalonadas en la sede Centro\nRegistro previo en línea\nMeta del próximo semestre: 15 minutos', transicion: T('voltear') },
      { clave: 'sec2', diseno: 'seccion', titulo: 'Acciones de mejora', texto: 'Julio a diciembre', transicion: T('zoom') },
      { clave: 'cierre', diseno: 'titulo', titulo: 'Gracias', subtitulo: 'Comité de Calidad · ext. 120', transicion: T('vortice', { sonido: 'Campana' }) },
    ],
  });
  const grupo = (efecto) => K.transicion(efecto).grupo;
  const durDe = (t) => (t.duracion == null ? K.transicion(t.efecto).dur : t.duracion);

  function verificar(ed, nivel) {
    const p = ed.p;
    const add = revisor();
    const D = p.diapositivas;
    const tr = (d) => d.transicion || { efecto: 'ninguna' };
    const secs = D.filter((d) => d.diseno === 'seccion');
    const resto = D.filter((d) => d.diseno !== 'seccion');
    const conSonido = D.findIndex((d) => tr(d).sonido);
    add(conSonido < 0, 'Sin sonidos', 'La diapositiva ' + (conSonido + 1) + ' tiene sonido de transición: elige [Sin sonido].');
    const llam = D.findIndex((d) => grupo(tr(d).efecto) === 'Llamativo');
    add(llam < 0, 'Sin transiciones llamativas', 'La diapositiva ' + (llam + 1) + ' usa «' + (llam >= 0 ? K.transicion(tr(D[llam]).efecto).nombre : '') + '»: en un informe profesional usa transiciones sutiles.');
    const efResto = new Set(resto.map((d) => tr(d).efecto));
    const unica = efResto.size === 1 ? Array.from(efResto)[0] : null;
    add(!!unica && unica !== 'ninguna', 'Una misma transición sutil para el contenido', efResto.size > 1 ? 'Las diapositivas de contenido usan ' + efResto.size + ' transiciones distintas: aplica una sola (Transiciones › efecto › Aplicar a todas).' : 'Aplica una transición sutil a las diapositivas (no «Ninguna»).');
    const efSec = new Set(secs.map((d) => tr(d).efecto));
    const especial = efSec.size === 1 ? Array.from(efSec)[0] : null;
    add(!!especial && especial !== 'ninguna' && especial !== unica, 'Una transición distinta para los encabezados de sección', 'Los dos encabezados de sección deben compartir una transición diferente a la del resto, para marcar el cambio de bloque.');
    const lenta = D.findIndex((d) => tr(d).efecto !== 'ninguna' && (durDe(tr(d)) < 0.5 || durDe(tr(d)) > 1.5));
    add(lenta < 0, 'Duración entre 0.5 y 1.5 s', 'La transición de la diapositiva ' + (lenta + 1) + ' dura ' + (lenta >= 0 ? durDe(tr(D[lenta])) : '') + ' s: ajusta la Duración entre 0.5 y 1.5 s.');
    if (nivel === 'experto') {
      add(especial === 'empujar' && secs.every((d) => /derecha/i.test(tr(d).opcion || '')), 'Encabezados con «Empuje» desde la derecha', 'Experto: usa «Empuje» con la opción de efecto «Desde la derecha» en los encabezados de sección.');
      add(ed.registro.presentaciones > 0 || ed.registro.vistaPreviaTransicion > 0, 'Transiciones probadas', 'Revisa el resultado con Vista previa o presentando (F5).');
    }
    return add.lista;
  }
  function crearReto(cont, nivel, extra) {
    return LT.modulo.retoSimulador(cont, { presentacion: inicial(), herramientas: ['transiciones', 'presentacion', 'vista'], pestana: 'transiciones', verificar }, extra);
  }

  LT.definirModulo({
    id: 6,
    objetivo: 'Aplicar transiciones discretas y coherentes, ajustar su duración y avance, y distinguir una transición de una animación.',
    situacion: 'La presentación del <b>Comité de Calidad</b> tiene una transición distinta en cada diapositiva, algunas con sonido de aplausos. Se ve poco profesional. Déjala sobria: una transición sutil para todo y otra solo para los inicios de sección.',
    explicacion: [
      { html: '<h3>Transición o animación</h3><table class="tabla-sitio"><thead><tr><th></th><th>Transición</th><th>Animación</th></tr></thead><tbody><tr><th>¿Qué es?</th><td>Efecto que ocurre <b>al pasar de una diapositiva a otra</b>.</td><td>Efecto aplicado a <b>un elemento dentro de una diapositiva</b>.</td></tr><tr><th>¿A qué se aplica?</th><td>A la diapositiva completa que <b>entra</b>.</td><td>A un título, texto, imagen, icono, forma o gráfico.</td></tr><tr><th>¿Dónde está?</th><td>Pestaña <b>Transiciones</b>.</td><td>Pestaña <b>Animaciones</b>.</td></tr><tr><th>Se ve en el panel de miniaturas como</th><td>Una estrella junto al número.</td><td>Una estrella junto al número y números sobre los objetos.</td></tr></tbody></table>' },
      { titulo: 'Míralo en movimiento', widget: demoTransicionAnimacion },
      { html: '<h3>Transiciones con criterio</h3><ul><li>La galería tiene transiciones <b>sutiles</b> (Desvanecer, Empuje, Barrido, Mostrar, Transformación) y <b>llamativas</b> (Vórtice, Cubo, Origami…). En una plática de salud o un informe, usa una sutil para todo; cambia de transición solo para marcar un cambio de sección.</li><li><b>Opciones de efectos</b>: dirección o variante (Desde la derecha, A través de negro…).</li><li><b>Duración</b>: entre 0.5 y 1 segundo. <b>Sonido</b>: casi nunca.</li><li><b>Aplicar a todas</b> copia la transición, la duración y el avance a todas las diapositivas.</li><li><b>Avanzar a la diapositiva</b>: <i>Al hacer clic con el mouse</i> y/o <i>Después de</i> (avance automático; lo verás en el módulo 8).</li><li><b>Transformación</b> (Morph) mueve suavemente los objetos que se repiten entre dos diapositivas: útil para acercar una imagen o mostrar un cambio.</li></ul>' },
      { titulo: 'Catálogo de transiciones', instr: 'Haz clic en una transición para verla.', widget: (c) => catalogo(c, 'transiciones') },
    ],
    ejemplo: {
      titulo: 'Una transición para todo y otra para las secciones',
      pasos: [
        { texto: 'Selecciona la primera diapositiva › Transiciones › Desvanecer.', ruta: ['Transiciones', 'Galería de transiciones'] },
        { texto: 'Ajusta Duración a 0.7 s y Sonido a [Sin sonido].', ruta: ['Transiciones', 'Duración'] },
        { texto: 'Transiciones › Aplicar a todas.', ruta: ['Transiciones', 'Aplicar a todas'] },
        'Selecciona solo los encabezados de sección (Ctrl+clic en las miniaturas) y elige Empuje.',
        { texto: 'Revisa con Transiciones › Vista previa o presenta con F5.', ruta: ['Transiciones', 'Vista previa'] },
      ],
      pregunta: { texto: 'Aplicaste «Empuje» a la diapositiva 4. ¿Cuándo se ve el efecto?', opciones: ['Al pasar de la 4 a la 5', 'Al pasar de la 3 a la 4 (cuando entra la 4)', 'Cuando aparece el título de la 4', 'Al terminar la presentación'], correcta: 1, explicacion: 'La transición pertenece a la diapositiva que <b>entra</b>: se ve al llegar a ella.' },
    },
    micro: [
      { titulo: '¿Transición o animación?', tipo: 'clasificar', ancho: true, enunciado: 'Clasifica cada efecto.', categorias: ['Transición', 'Animación'], items: [['La diapositiva 3 entra empujando a la 2', 0, 'Es el paso de una diapositiva a otra: transición.'], ['El título aparece desvaneciéndose', 1, 'Afecta a un elemento dentro de la diapositiva: animación.'], ['Una flecha se desplaza hasta el corazón', 1, 'Un objeto que se mueve dentro de la diapositiva: animación (trayectoria).'], ['Al avanzar, la nueva diapositiva se revela con un barrido', 0, 'Toda la diapositiva entra con un efecto: transición.'], ['Cada viñeta aparece con un clic', 1, 'Elementos que aparecen dentro de la diapositiva: animación.'], ['Pasar a la siguiente diapositiva después de 5 segundos', 0, 'El avance automático se configura en Transiciones.']] },
      { titulo: 'Una transición profesional', tipo: 'opcion', enunciado: '¿Qué transición conviene para toda la presentación del Comité de Calidad?', opciones: ['Vórtice con sonido de aplausos', 'Desvanecer, 0.7 s, sin sonido', 'Una distinta en cada diapositiva', 'Origami de 3 segundos'], correcta: 1, explicacion: 'Sutil, breve y consistente: la atención queda en el contenido.' },
      { titulo: 'Avance automático', tipo: 'opcion', enunciado: '¿Dónde configuras que una diapositiva avance sola a los 8 segundos?', opciones: ['Animaciones › Retraso', 'Transiciones › Después de', 'Presentación con diapositivas › Ocultar diapositiva', 'Diseño › Variantes'], correcta: 1, explicacion: 'En <b>Transiciones › Avanzar a la diapositiva › Después de</b>.' },
    ],
    reto: {
      titulo: 'Transiciones discretas y coherentes', tipo: 'widget', crear: crearReto,
      base: {
        instrucciones: ['Quita todos los sonidos de transición.', 'Usa una sola transición sutil para todas las diapositivas que no son encabezado de sección.', 'Los dos encabezados de sección comparten otra transición (también sutil).', 'Duración de todas las transiciones entre 0.5 y 1.5 s.', 'Revisa con Vista previa o presenta (F5).'],
        pistas: ['Primero unifica todo con «Aplicar a todas» y después cambia solo los encabezados.', 'Transiciones › Desvanecer › Sonido [Sin sonido] › Duración 0.7 › Aplicar a todas. Luego selecciona cada encabezado de sección y elige otra transición sutil.', 'Diapositiva 1: Desvanecer, [Sin sonido], 0.7 s, Aplicar a todas. Diapositivas 3 y 6: Empuje (Desde la derecha), 1 s.'],
      },
      niveles: {
        explorador: { instrucciones: ['Selecciona la diapositiva 1. En Transiciones elige «Desvanecer».', 'En Sonido elige [Sin sonido] y en Duración escribe 0.7.', 'Pulsa «Aplicar a todas».', 'Selecciona la diapositiva 3 (encabezado de sección) y elige «Empuje»; haz lo mismo con la diapositiva 6.', 'Pulsa Vista previa o presenta con F5 para ver el resultado.'] },
        experto: { instrucciones: ['Todo lo del nivel Analista.', 'Los encabezados de sección usan «Empuje» con la opción de efecto «Desde la derecha».', 'Prueba el resultado con Vista previa o presentando.'] },
      },
    },
    lab: {
      archivo: 'lab06-comite-calidad.pptx', titulo: 'Transiciones del informe en PowerPoint',
      contexto: 'Cada diapositiva tiene una transición distinta y algunas con sonido. Los encabezados de sección usan el diseño «Encabezado de sección».',
      pasos: {
        explorador: [{ texto: 'Selecciona la diapositiva 1 › Transiciones › Desvanecer; Sonido: [Sin sonido]; Duración: 00.70.', ruta: ['Transiciones', 'Sonido'] }, { texto: 'Transiciones › Aplicar a todas.', ruta: ['Transiciones', 'Aplicar a todas'] }, 'Selecciona las diapositivas 3 y 6 (Ctrl+clic en las miniaturas) › Empuje.', { texto: 'Prueba con Transiciones › Vista previa o F5.', ruta: ['Transiciones', 'Vista previa'] }, 'Guarda y sube la presentación.'],
        analista: ['Sin sonidos ni transiciones llamativas.', 'Una misma transición sutil en las diapositivas de contenido.', 'Otra transición (sutil) igual en los dos encabezados de sección.', 'Duración entre 0.5 y 1.5 s.', 'Guarda y sube la presentación.'],
        experto: ['Todo lo del nivel Analista.', 'Encabezados con «Empuje» y duración de 1 s o menos en todas.'],
      },
      pruebas: [
        { titulo: 'Sin sonidos', fn: (P) => { const d = P.diapositivas.find((x) => x.transicion && x.transicion.sonido); return d ? 'La diapositiva ' + d.n + ' tiene sonido de transición: elige [Sin sonido].' : true; } },
        { titulo: 'Sin transiciones llamativas', fn: (P) => { const sut = ['fade', 'push', 'wipe', 'split', 'reveal', 'cut', 'randomBar', 'circle', 'diamond', 'plus', 'zoom', 'cover', 'pull', 'morph', 'flash', 'strips']; const d = P.diapositivas.find((x) => x.transicion && x.transicion.efecto && !sut.includes(x.transicion.efecto)); return d ? 'La diapositiva ' + d.n + ' usa «' + d.transicion.nombre + '»: elige una transición sutil.' : true; } },
        { titulo: 'Una transición para el contenido', fn: (P) => { const r = P.diapositivas.filter((d) => d.diseno.tipo !== 'secHead'); const s = new Set(r.map((d) => (d.transicion && d.transicion.efecto) || 'ninguna')); return s.size === 1 && !s.has('ninguna') ? true : 'Las diapositivas de contenido deben tener la misma transición (hay ' + Array.from(s).join(', ') + ').'; } },
        { titulo: 'Otra transición para los encabezados', fn: (P) => { const sec = P.diapositivas.filter((d) => d.diseno.tipo === 'secHead'); const r = P.diapositivas.find((d) => d.diseno.tipo !== 'secHead'); const s = new Set(sec.map((d) => (d.transicion && d.transicion.efecto) || 'ninguna')); return sec.length && s.size === 1 && !s.has('ninguna') && !s.has(r && r.transicion && r.transicion.efecto) ? true : 'Los encabezados de sección deben compartir una transición distinta a la del contenido.'; } },
        { titulo: 'Duración entre 0.5 y 1.5 s', fn: (P) => { const d = P.diapositivas.find((x) => x.transicion && x.transicion.duracion != null && (x.transicion.duracion < 0.5 || x.transicion.duracion > 1.5)); return d ? 'La transición de la diapositiva ' + d.n + ' dura ' + d.transicion.duracion + ' s.' : true; } },
        { titulo: 'Encabezados con «Empuje» y duración de 1 s o menos', nivel: 'experto', fn: (P) => { const sec = P.diapositivas.filter((d) => d.diseno.tipo === 'secHead'); if (!sec.every((d) => d.transicion && d.transicion.efecto === 'push')) return 'Usa «Empuje» en los encabezados de sección.'; const d = P.diapositivas.find((x) => x.transicion && x.transicion.duracion > 1); return d ? 'La diapositiva ' + d.n + ' dura más de 1 s.' : true; } },
      ],
    },
    donde: [
      { comando: 'Galería de transiciones', ruta: ['Transiciones', 'Galería de transiciones'] },
      { comando: 'Opciones de efectos de la transición', ruta: ['Transiciones', 'Opciones de efectos'] },
      { comando: 'Aplicar a todas', ruta: ['Transiciones', 'Aplicar a todas'] },
      { comando: 'Quitar el sonido', ruta: ['Transiciones', 'Sonido'] },
      { comando: 'Avanzar después de un tiempo', ruta: ['Transiciones', 'Después de'] },
    ],
    glosario: [
      ['Transición', 'Transition', 'Efecto que ocurre al pasar de una diapositiva a otra.'],
      ['Animación', 'Animation', 'Efecto aplicado a un elemento dentro de una diapositiva.'],
      ['Opciones de efectos', 'Effect Options', 'Dirección o variante de una transición o animación.'],
      ['Transformación', 'Morph', 'Transición que mueve y transforma los objetos que se repiten entre dos diapositivas.'],
      ['Aplicar a todas', 'Apply To All', 'Copia la transición, su duración y su avance a todas las diapositivas.'],
    ],
    atajos: ['<kbd>Ctrl</kbd> + clic en las miniaturas selecciona varias diapositivas para aplicarles la misma transición.', '<kbd>F5</kbd> presenta desde el principio; <kbd>Mayús+F5</kbd>, desde la diapositiva actual.'],
  });
})();

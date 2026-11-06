/* Módulo 1 · Estructura de una presentación */
(function () {
  const { h } = LT.u;
  const { norm, porClave, miniaturas, revisor, R } = LT.ppt;

  const ORDEN = ['portada', 'agenda', 'sec1', 'cont1', 'sec2', 'cont2', 'comp', 'cierre'];
  const NOMBRES = { portada: 'la portada', agenda: '«¿Qué aprenderás hoy?»', sec1: '«¿Por qué lavarse las manos?»', cont1: '«Las manos llevan microbios…»', sec2: '«¿Cuándo y cómo lavarlas?»', cont2: '«Los momentos clave»', comp: '«Agua y jabón o gel con alcohol»', cierre: 'el cierre' };
  const DIAPOS = {
    portada: { clave: 'portada', diseno: 'tituloObjetos', titulo: 'Lavado de manos: tu primera vacuna', cuerpo: 'Clínica Universitaria Vida Sana · Educación para la Salud', notas: 'Bienvenida. Presenta al equipo de enfermería.' },
    agenda: { clave: 'agenda', diseno: 'tituloObjetos', titulo: '¿Qué aprenderás hoy?', cuerpo: 'Por qué lavarse las manos\nCuándo y cómo hacerlo\nAgua y jabón o gel con alcohol' },
    sec1: { clave: 'sec1', diseno: 'tituloObjetos', titulo: '¿Por qué lavarse las manos?', cuerpo: 'Bloque 1' },
    cont1: { clave: 'cont1', diseno: 'tituloObjetos', titulo: 'Las manos llevan microbios a ojos, nariz y boca', cuerpo: 'Tocamos superficies, alimentos y personas todo el día\nMuchos microbios no se ven\nAgua y jabón los eliminan' },
    sec2: { clave: 'sec2', diseno: 'tituloObjetos', titulo: '¿Cuándo y cómo lavarlas?', cuerpo: 'Bloque 2' },
    cont2: { clave: 'cont2', diseno: 'tituloObjetos', titulo: 'Los momentos clave', cuerpo: 'Antes de comer o preparar alimentos\nDespués de ir al baño o cambiar un pañal\nAntes y después de atender a un enfermo\nAl llegar a casa' },
    comp: { clave: 'comp', diseno: 'dosObjetos', titulo: 'Agua y jabón o gel con alcohol', cuerpo: 'Cuando las manos se ven sucias\nDespués de ir al baño\nDe 40 a 60 segundos', cuerpo2: 'Cuando no hay agua y jabón\nManos sin suciedad visible\nDe 20 a 30 segundos' },
    cierre: { clave: 'cierre', diseno: 'tituloObjetos', titulo: 'Gracias · ¿Preguntas?', cuerpo: 'Lávate las manos: protege a tu familia' },
  };
  const DESORDEN = ['cont2', 'portada', 'sec2', 'cierre', 'agenda', 'comp', 'cont1', 'sec1'];
  const inicial = () => LT.Diapo.construir({ titulo: 'Lavado de manos', tema: 'office', diapositivas: DESORDEN.map((k) => DIAPOS[k]) });

  /* Revisión del reto en el simulador */
  function verificar(ed, nivel) {
    const p = ed.p;
    const add = revisor();
    const claves = p.diapositivas.map((d) => d.clave).filter(Boolean);
    const faltan = ORDEN.filter((k) => !claves.includes(k));
    if (faltan.length || claves.length !== ORDEN.length) add(false, 'Las 8 diapositivas', faltan.length ? 'Falta ' + NOMBRES[faltan[0]] + ': no la elimines (usa Deshacer o Restablecer).' : 'Hay diapositivas repetidas: deja solo las 8 originales.');
    else {
      const k = ORDEN.findIndex((c, i) => claves[i] !== c);
      add(k < 0, 'Orden lógico: portada, agenda, bloques y cierre', k === 0 ? 'La portada debe ser la primera diapositiva.' : 'La diapositiva ' + (k + 1) + ' debería ser ' + NOMBRES[ORDEN[k]] + ' (después de ' + NOMBRES[ORDEN[k - 1]] + ').');
    }
    const d = (c) => porClave(p, c) || { diseno: '' };
    add(d('portada').diseno === 'titulo', 'Portada con «Diapositiva de título»', 'Cambia el diseño de la portada a «Diapositiva de título» (Inicio › Diseño).');
    add(d('sec1').diseno === 'seccion' && d('sec2').diseno === 'seccion', 'Inicios de bloque con «Encabezado de sección»', 'Las diapositivas que abren cada bloque llevan el diseño «Encabezado de sección».');
    add(d('comp').diseno === 'comparacion', 'Comparación con su diseño', '«Agua y jabón o gel con alcohol» compara dos opciones: usa el diseño «Comparación».');
    const secs = LT.Diapo.secciones(p) || [];
    const inicio = (c) => { const i = p.diapositivas.indexOf(porClave(p, c)); return secs.some((s) => s.indices[0] === i); };
    const genericas = secs.filter((s) => /sin t[ií]tulo|predeterminada/i.test(s.nombre));
    add(secs.length >= 4 && ['portada', 'sec1', 'sec2', 'cierre'].every(inicio) && !genericas.length, 'Cuatro secciones con nombre', secs.length < 4 ? 'Crea 4 secciones: Introducción (portada y agenda), una por cada bloque y Cierre (Inicio › Sección › Agregar sección).' : genericas.length ? 'Cambia el nombre de la sección «' + genericas[0].nombre + '».' : 'Cada sección debe empezar en la portada, en cada encabezado de sección y en el cierre.');
    if (nivel === 'experto') {
      const c = porClave(p, 'comp');
      const enc = c ? c.objetos.filter((o) => /^enc/.test(o.ph || '') && String(o.texto || '').trim()) : [];
      add(enc.length >= 2, 'Encabezados de la comparación', 'Escribe los encabezados de la comparación: «Agua y jabón» y «Gel con alcohol».');
      const coinciden = ['sec1', 'sec2'].every((cl) => { const dd = porClave(p, cl); const s = secs.find((x) => x.indices[0] === p.diapositivas.indexOf(dd)); return dd && s && norm(s.nombre) === norm(R.tituloDe(dd)); });
      add(coinciden, 'Secciones con el mismo nombre que su encabezado', 'Nombra cada sección de bloque igual que el título de su encabezado de sección.');
    }
    return add.lista;
  }

  function crearReto(cont, nivel, extra) {
    return LT.modulo.retoSimulador(cont, { presentacion: inicial(), herramientas: ['inicio', 'vista', 'presentacion'], pestana: 'inicio', verificar }, extra);
  }

  /* Ejemplo de estructura: miniaturas de una plática bien organizada */
  function esqueleto(c) {
    const p = LT.Diapo.construir({ tema: 'clinico', variante: 1, diapositivas: [
      { diseno: 'titulo', titulo: 'Diabetes: conócela y contrólala', subtitulo: 'Clínica Universitaria Vida Sana' },
      { diseno: 'tituloObjetos', titulo: '¿Qué veremos?', cuerpo: 'Qué es la diabetes\nCómo se detecta\nCómo controlarla' },
      { diseno: 'seccion', titulo: 'Qué es la diabetes', texto: 'Bloque 1' },
      { diseno: 'dosObjetos', titulo: 'Tipo 1 y tipo 2', cuerpo: 'El cuerpo no produce insulina', cuerpo2: 'El cuerpo no usa bien la insulina' },
      { diseno: 'titulo', titulo: 'Camina 30 minutos al día', subtitulo: '¿Preguntas? Educación para la Salud, ext. 214' },
    ] });
    miniaturas(c, [[p, 0, '<b>Portada</b><br>Diapositiva de título'], [p, 1, '<b>Propósito o agenda</b><br>Título y objetos'], [p, 2, '<b>Inicio de bloque</b><br>Encabezado de sección'], [p, 3, '<b>Desarrollo</b><br>Dos objetos o Comparación'], [p, 4, '<b>Cierre</b><br>Mensaje clave y contacto']], 200);
  }

  LT.definirModulo({
    id: 1,
    objetivo: 'Organizar una presentación con inicio, desarrollo y cierre, elegir el diseño de diapositiva adecuado para cada parte y agruparla en secciones.',
    situacion: 'El equipo de enfermería preparó la plática <b>«Lavado de manos»</b> para la sala de espera, pero las diapositivas quedaron en desorden y todas con el mismo diseño. Ordénala para que tenga inicio, desarrollo y cierre, y divídela en secciones para que cualquier compañero la pueda presentar.',
    explicacion: [
      { html: '<h3>Una presentación es un relato con estructura</h3><ol><li><b>Portada</b>: título y quién presenta (diseño <b>Diapositiva de título</b>).</li><li><b>Propósito o agenda</b>: qué aprenderá el público.</li><li><b>Desarrollo por bloques</b>: cada bloque abre con un <b>Encabezado de sección</b>; una idea por diapositiva.</li><li><b>Cierre</b>: mensaje clave, lo que el público debe hacer (llamada a la acción) y contacto o preguntas.</li></ol><p>Escribe <b>títulos-mensaje</b>: «Lavarse las manos previene diarreas e infecciones respiratorias» dice más que «Lavado de manos».</p>' },
      { html: '<h3>Diseños de diapositiva y marcadores de posición</h3><p>Un <b>diseño</b> (Inicio › Diseño) acomoda <b>marcadores de posición</b>: los cuadros punteados de título, texto, imágenes o gráficos. Úsalos en lugar de cuadros de texto sueltos: el título aparece en el esquema, los lectores de pantalla lo anuncian y, al cambiar de tema, todo se reacomoda. Los más usados: <i>Diapositiva de título, Título y objetos, Encabezado de sección, Dos objetos, Comparación, Solo el título</i> y <i>En blanco</i>.</p><h3>Secciones</h3><p>Las <b>secciones</b> (Inicio › Sección › Agregar sección) agrupan diapositivas con un nombre en el panel de miniaturas: puedes contraerlas, moverlas completas y repartir el trabajo. Para reordenar, arrastra las miniaturas o usa la vista <b>Clasificador de diapositivas</b> (Vista).</p>' },
      { titulo: 'El esqueleto de una buena plática', instr: 'Cinco tipos de diapositiva y el diseño que les corresponde.', widget: esqueleto },
    ],
    ejemplo: {
      titulo: 'Agregar una sección y cambiar el diseño',
      pasos: [
        'En el panel de miniaturas, selecciona la diapositiva donde empieza el bloque.',
        { texto: 'Inicio › Sección › Agregar sección y escribe su nombre (por ejemplo, «Introducción»).', ruta: ['Inicio', 'Sección', 'Agregar sección'] },
        { texto: 'Con la diapositiva seleccionada, cambia su diseño: Inicio › Diseño › Encabezado de sección.', ruta: ['Inicio', 'Diseño', 'Encabezado de sección'] },
        'Para mover una diapositiva, arrastra su miniatura; con el teclado, selecciónala y usa Ctrl+↑ o Ctrl+↓.',
        { texto: 'Para ver todo el orden de un vistazo: Vista › Clasificador de diapositivas.', ruta: ['Vista', 'Clasificador de diapositivas'] },
      ],
      pregunta: { texto: 'Tu plática tiene 12 diapositivas sobre tres temas. ¿Qué te permite mover cada tema completo y ver cuántas diapositivas tiene?', opciones: ['Secciones', 'Ocultar diapositivas', 'Una transición distinta por tema', 'Numerar las diapositivas'], correcta: 0, explicacion: 'Las <b>secciones</b> agrupan las diapositivas con un nombre: se mueven, contraen y cuentan juntas.' },
    },
    micro: [
      { titulo: 'El orden de una plática', tipo: 'ordenar', enunciado: 'Ordena las partes de una plática de educación para la salud.', items: ['Portada: título y quién presenta', 'Propósito o agenda', 'Desarrollo por bloques', 'Mensaje clave y llamada a la acción', 'Preguntas y contacto'], mezcla: [2, 4, 0, 3, 1], pista: 'El público primero necesita saber de qué trata y para qué le sirve.' },
      { titulo: '¿Qué diseño usarías?', tipo: 'clasificar', ancho: true, enunciado: 'Elige el diseño de diapositiva para cada parte.', categorias: ['Diapositiva de título', 'Encabezado de sección', 'Comparación', 'Título y objetos'], items: [['Portada «Lavado de manos: tu primera vacuna»', 0, 'La portada usa «Diapositiva de título».'], ['Inicio del bloque «¿Cuándo y cómo lavarlas?»', 1, 'Lo que abre un bloque es un «Encabezado de sección».'], ['«Agua y jabón o gel con alcohol»', 2, 'Dos opciones lado a lado con encabezado: «Comparación».'], ['Lista de los momentos clave', 3, 'Una lista con título: «Título y objetos».']] },
      { titulo: 'Títulos que dicen algo', tipo: 'opcion', enunciado: '¿Cuál título comunica mejor el mensaje de la diapositiva?', opciones: ['Datos', 'Lavado de manos 2026', 'Lavarse las manos con jabón previene diarreas e infecciones respiratorias', 'Información importante'], correcta: 2, explicacion: 'Un <b>título-mensaje</b> dice la conclusión: quien solo lea los títulos entiende la plática.' },
    ],
    reto: {
      titulo: 'Ordenar la plática «Lavado de manos»', tipo: 'widget', crear: crearReto,
      base: {
        instrucciones: ['Ordena las 8 diapositivas: portada, agenda, el bloque «¿Por qué lavarse las manos?» con su contenido, el bloque «¿Cuándo y cómo lavarlas?» con sus dos diapositivas y el cierre.', 'Aplica el diseño adecuado: portada = Diapositiva de título; inicios de bloque = Encabezado de sección; «Agua y jabón o gel con alcohol» = Comparación.', 'Crea 4 secciones con nombre: Introducción, una por bloque y Cierre.'],
        pistas: ['Piensa como el público: primero de qué trata, luego por qué importa, después cómo hacerlo y al final qué hacer.', 'Las diapositivas se mueven arrastrando su miniatura (o con ⋮ › Mover hacia arriba). El diseño está en Inicio › Diseño y las secciones en Inicio › Sección.', 'Orden: portada, ¿Qué aprenderás hoy?, ¿Por qué lavarse las manos?, Las manos llevan microbios…, ¿Cuándo y cómo lavarlas?, Los momentos clave, Agua y jabón o gel con alcohol, Gracias · ¿Preguntas? Las secciones empiezan en las diapositivas 1, 3, 5 y 8.'],
      },
      niveles: {
        explorador: { instrucciones: ['Arrastra la portada («Lavado de manos: tu primera vacuna») al primer lugar del panel de miniaturas.', 'Coloca después «¿Qué aprenderás hoy?», luego «¿Por qué lavarse las manos?» y «Las manos llevan microbios…».', 'Sigue con «¿Cuándo y cómo lavarlas?», «Los momentos clave», «Agua y jabón o gel con alcohol» y, al final, «Gracias · ¿Preguntas?».', 'Selecciona la portada › Inicio › Diseño › Diapositiva de título. Haz lo mismo con las diapositivas 3 y 5 eligiendo Encabezado de sección, y con la 7 eligiendo Comparación.', 'Selecciona la diapositiva 1 › Inicio › Sección › Agregar sección «Introducción». Repite en la 3 («¿Por qué lavarse las manos?»), la 5 («¿Cuándo y cómo lavarlas?») y la 8 («Cierre»).'] },
        experto: { instrucciones: ['Todo lo del nivel Analista: orden lógico, diseños adecuados y 4 secciones con nombre.', 'En la comparación, escribe los encabezados «Agua y jabón» y «Gel con alcohol».', 'Nombra cada sección de bloque exactamente como el título de su encabezado de sección.'] },
      },
    },
    lab: {
      archivo: 'lab01-lavado-de-manos.pptx', titulo: 'Plática «Lavado de manos» en PowerPoint',
      contexto: 'La presentación tiene las 8 diapositivas en desorden y todas con el mismo diseño.',
      nota: 'El verificador encuentra cada diapositiva por su título: no cambies los títulos.',
      pasos: {
        explorador: [{ texto: 'Vista › Clasificador de diapositivas y arrastra las miniaturas al orden: portada, agenda, bloque 1 (2 diapositivas), bloque 2 (3 diapositivas) y cierre.', ruta: ['Vista', 'Clasificador de diapositivas'] }, { texto: 'Vuelve a Vista › Normal. Selecciona la portada › Inicio › Diseño › Diapositiva de título.', ruta: ['Inicio', 'Diseño', 'Diapositiva de título'] }, { texto: 'Las diapositivas 3 y 5: Inicio › Diseño › Encabezado de sección. La 7: Comparación.', ruta: ['Inicio', 'Diseño', 'Encabezado de sección'] }, { texto: 'En la diapositiva 1: Inicio › Sección › Agregar sección «Introducción». Repite en la 3, la 5 y la 8.', ruta: ['Inicio', 'Sección', 'Agregar sección'] }, 'Guarda y sube la presentación.'],
        analista: ['Ordena las 8 diapositivas (portada, agenda, dos bloques y cierre).', 'Diseños: portada = Diapositiva de título; inicios de bloque = Encabezado de sección; «Agua y jabón o gel con alcohol» = Comparación.', 'Crea 4 secciones con nombre: Introducción, ¿Por qué lavarse las manos?, ¿Cuándo y cómo lavarlas? y Cierre.', 'Guarda y sube la presentación.'],
        experto: ['Todo lo del nivel Analista.', 'Escribe los encabezados de la comparación («Agua y jabón» y «Gel con alcohol»).', 'Nombra las secciones de bloque igual que su encabezado de sección.'],
      },
      pruebas: [
        { titulo: 'Orden lógico de las 8 diapositivas', fn: (P, A) => {
          const re = [/primera vacuna/i, /aprender/i, /por qu[eé] lavarse/i, /microbios/i, /cu[aá]ndo y c[oó]mo/i, /momentos/i, /gel con alcohol/i, /preguntas/i];
          const pos = re.map((r) => P.diapositivas.findIndex((d) => r.test(d.titulo)));
          if (pos.some((x) => x < 0)) return 'No encontré todas las diapositivas: no cambies sus títulos ni las elimines.';
          for (let i = 0; i < pos.length; i++) if (pos[i] !== i) return 'La diapositiva ' + (i + 1) + ' debería ser «' + P.diapositivas[pos[i]].titulo + '».';
          return true;
        } },
        { titulo: 'Portada con «Diapositiva de título»', fn: (P, A) => { const d = A.buscar(P, /primera vacuna/i); return d && d.diseno.tipo === 'title' ? true : 'Cambia el diseño de la portada a «Diapositiva de título» (Inicio › Diseño).'; } },
        { titulo: 'Encabezados de sección', fn: (P) => { const ds = P.diapositivas.filter((d) => /por qu[eé] lavarse|cu[aá]ndo y c[oó]mo/i.test(d.titulo)); return ds.length === 2 && ds.every((d) => d.diseno.tipo === 'secHead') ? true : 'Las diapositivas que abren cada bloque deben usar el diseño «Encabezado de sección».'; } },
        { titulo: 'Comparación', fn: (P, A) => { const d = A.buscar(P, /gel con alcohol/i); return d && d.diseno.tipo === 'twoTxTwoObj' ? true : '«Agua y jabón o gel con alcohol» debe usar el diseño «Comparación».'; } },
        { titulo: 'Cuatro secciones con nombre', fn: (P) => {
          if (P.secciones.length < 4) return 'Crea 4 secciones (Inicio › Sección › Agregar sección).';
          const gen = P.secciones.find((s) => /sin t[ií]tulo|predeterminada|untitled|default/i.test(s.nombre));
          if (gen) return 'Cambia el nombre de la sección «' + gen.nombre + '».';
          const inicios = P.secciones.map((s) => s.diapositivas[0]);
          return [1, 3, 5, 8].every((n) => inicios.includes(n)) ? true : 'Las secciones deben empezar en las diapositivas 1, 3, 5 y 8.';
        } },
        { titulo: 'Encabezados de la comparación', nivel: 'experto', fn: (P, A) => { const d = A.buscar(P, /gel con alcohol/i); const t = d ? A.textos(d).filter((f) => !(f.ph && /title/i.test(f.ph.type))) : []; return t.length >= 4 ? true : 'Escribe los encabezados «Agua y jabón» y «Gel con alcohol» en la comparación.'; } },
        { titulo: 'Secciones con el nombre de su encabezado', nivel: 'experto', fn: (P) => { const n = (s) => String(s).toLowerCase().normalize('NFD').replace(/[^a-z0-9ñ]+/g, ''); const ok = P.diapositivas.filter((d) => d.diseno.tipo === 'secHead').every((d) => d.seccion && n(d.seccion) === n(d.titulo)); return ok ? true : 'Nombra cada sección de bloque igual que el título de su encabezado de sección.'; } },
      ],
    },
    donde: [
      { comando: 'Nueva diapositiva con otro diseño', ruta: ['Inicio', 'Nueva diapositiva', 'Encabezado de sección'], nota: 'También en Insertar › Nueva diapositiva. Atajo: Ctrl+M.' },
      { comando: 'Cambiar el diseño a Comparación', ruta: ['Inicio', 'Diseño', 'Comparación'] },
      { comando: 'Agregar sección', ruta: ['Inicio', 'Sección', 'Agregar sección'], nota: 'También con clic derecho entre dos miniaturas.' },
      { comando: 'Clasificador de diapositivas', ruta: ['Vista', 'Clasificador de diapositivas'] },
    ],
    glosario: [
      ['Diseño de diapositiva', 'Slide layout', 'Acomodo de marcadores de posición (título, texto, objetos) de una diapositiva.'],
      ['Marcador de posición', 'Placeholder', 'Cuadro punteado del diseño para título, texto u objetos. Su texto aparece en el esquema y lo anuncian los lectores de pantalla.'],
      ['Sección', 'Section', 'Grupo de diapositivas con nombre en el panel de miniaturas.'],
      ['Encabezado de sección', 'Section Header', 'Diseño para la diapositiva que abre un bloque.'],
      ['Clasificador de diapositivas', 'Slide Sorter', 'Vista con todas las miniaturas para reordenar y revisar.'],
    ],
    atajos: ['<kbd>Ctrl+M</kbd> nueva diapositiva.', '<kbd>Ctrl+D</kbd> duplica la diapositiva seleccionada en el panel de miniaturas.', '<kbd>Ctrl+↑</kbd> / <kbd>Ctrl+↓</kbd> en el panel de miniaturas mueven la diapositiva.'],
  });
})();

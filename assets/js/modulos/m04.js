/* Módulo 4 · SmartArt, tablas y gráficos */
(function () {
  const { h } = LT.u;
  const { porClave, revisor, R, K, norm } = LT.ppt;

  const DATOS = [
    { id: 'dosis', nombre: 'Dosis aplicadas por mes (octubre a marzo)', categorias: ['Oct', 'Nov', 'Dic', 'Ene', 'Feb', 'Mar'], series: [{ nombre: 'Dosis aplicadas', valores: [420, 980, 760, 510, 300, 140] }], formato: '#,##0' },
    { id: 'cobertura', nombre: 'Cobertura por grupo prioritario (%)', categorias: ['Personal de salud', 'Adultos de 60 o más', 'Embarazadas', 'Niños de 6 a 59 meses', 'Enfermedades crónicas'], series: [{ nombre: 'Cobertura (%)', valores: [92, 71, 58, 64, 66] }] },
    { id: 'sedes', nombre: 'Dosis por sede', categorias: ['Centro', 'Norte', 'Sur'], series: [{ nombre: 'Dosis', valores: [1240, 860, 1010] }], formato: '#,##0' },
  ];
  const GRUPOS = 'Personal de salud: 1 dosis cada temporada (octubre a marzo)\nAdultos de 60 años o más: 1 dosis cada temporada\nEmbarazadas: 1 dosis en cualquier trimestre\nNiñas y niños de 6 a 59 meses: 1 dosis (2 la primera vez)';
  const inicial = () => LT.Diapo.construir({
    titulo: 'Campaña de vacunación', tema: 'sereno', variante: 0,
    diapositivas: [
      { clave: 'pasos', diseno: 'tituloObjetos', titulo: 'El día de tu vacuna', cuerpo: 'Registro\nValoración\nAplicación\nObservación de 15 minutos', notas: 'Convierte estas viñetas en un SmartArt de proceso.' },
      { clave: 'grupos', diseno: 'soloTitulo', titulo: '¿Quién debe vacunarse?', notas: 'Datos para la tabla (Grupo | Dosis | Cuándo):\n' + GRUPOS },
      { clave: 'dosis', diseno: 'soloTitulo', titulo: 'Dosis aplicadas por mes', notas: 'Usa el conjunto de datos «Dosis aplicadas por mes». El pico fue en noviembre (980 dosis).' },
    ],
  });

  function verificar(ed, nivel) {
    const p = ed.p;
    const add = revisor();
    const dp = porClave(p, 'pasos'), dg = porClave(p, 'grupos'), dd = porClave(p, 'dosis');
    const sa = dp && dp.objetos.find((o) => o.tipo === 'smartart');
    add(!!sa, 'SmartArt en «El día de tu vacuna»', 'Convierte las viñetas en un SmartArt (Inicio › Convertir a SmartArt) o inserta uno (Insertar › SmartArt).');
    if (sa) {
      add(K.smartart(sa.diseno).cat === 'Proceso', 'SmartArt de proceso', 'Los pasos tienen un orden: elige un diseño de la categoría Proceso (por ejemplo, Proceso básico).');
      const el = (sa.elementos || []).map(norm);
      add(el.length >= 4 && !el.some((x) => x === 'texto' || !x) && /registro/.test(el[0]) && /observacion/.test(el[el.length - 1]), 'Los 4 pasos en orden', 'El SmartArt debe tener los 4 pasos, de «Registro» a «Observación de 15 minutos», sin «[Texto]» vacíos.');
    }
    const tb = dg && dg.objetos.find((o) => o.tipo === 'tabla');
    add(!!tb, 'Tabla en «¿Quién debe vacunarse?»', 'Inserta una tabla (Insertar › Tabla).');
    if (tb) {
      const nf = tb.filas.length, nc = (tb.filas[0] || []).length;
      add(nf >= 5 && nc >= 3, 'Tabla de 3 columnas y 4 grupos', 'La tabla necesita 3 columnas (Grupo, Dosis, Cuándo) y una fila por cada uno de los 4 grupos, más el encabezado (' + nc + ' × ' + nf + ' ahora).');
      add(tb.filas.every((f) => f.every((c) => String(c || '').trim())), 'Tabla sin celdas vacías', 'Llena todas las celdas de la tabla (los datos están en las notas).');
      add(tb.encabezado !== false, 'Fila de encabezado', 'Activa la fila de encabezado para que se distingan las columnas.');
    }
    const gr = dd && dd.objetos.find((o) => o.tipo === 'grafico');
    add(!!gr, 'Gráfico en «Dosis aplicadas por mes»', 'Inserta un gráfico (Insertar › Gráfico) con los datos «Dosis aplicadas por mes».');
    if (gr) {
      add(gr.datos && gr.datos.id === 'dosis', 'Datos correctos', 'Usa el conjunto de datos «Dosis aplicadas por mes».');
      add(gr.subtipo === 'lineas', 'Gráfico de líneas', 'Para mostrar el cambio a lo largo de los meses usa un gráfico de líneas.');
      const t = String(gr.titulo || '').trim();
      add(t && gr.mostrarTitulo !== false && !/^t[ií]tulo del gr[aá]fico$/i.test(t), 'Título del gráfico', 'Escribe un título que diga qué muestra el gráfico (no dejes «Título del gráfico»).');
    }
    if (nivel === 'experto') {
      if (gr) add(/nov/i.test(gr.titulo || '') && gr.etiquetas, 'Título-conclusión y etiquetas de datos', 'Experto: el título debe decir la conclusión (por ejemplo «Noviembre fue el mes con más dosis») y activa las etiquetas de datos.');
      const sinAlt = [sa, tb, gr].filter(Boolean).filter((o) => o.tipo !== 'tabla' && !String(o.alt || '').trim());
      add(!sinAlt.length, 'Texto alternativo del SmartArt y del gráfico', 'Escribe el texto alternativo del SmartArt y del gráfico (panel Formato › Texto alternativo).');
    }
    return add.lista;
  }
  function crearReto(cont, nivel, extra) {
    return LT.modulo.retoSimulador(cont, { presentacion: inicial(), herramientas: ['insertar', 'inicio', 'revisar'], pestana: 'insertar', datosGrafico: DATOS, verificar }, extra);
  }

  function trio(c) {
    const p = LT.Diapo.construir({ tema: 'sereno', variante: 0, diapositivas: [
      { diseno: 'soloTitulo', titulo: 'SmartArt: pasos o relaciones', objetos: [{ tipo: 'smartart', diseno: 'procesoBasico', elementos: ['Registro', 'Valoración', 'Aplicación', 'Observación'], x: 60, y: 170, w: 840, h: 240 }] },
      { diseno: 'soloTitulo', titulo: 'Tabla: datos exactos', objetos: [{ tipo: 'tabla', filas: [['Grupo', 'Dosis', 'Cuándo'], ['Adultos de 60 o más', '1', 'Oct–Mar'], ['Embarazadas', '1', 'Cualquier trimestre'], ['Niños de 6 a 59 meses', '1 o 2', 'Oct–Mar']], x: 60, y: 150, w: 840, h: 260, estilo: { tam: 22 } }] },
      { diseno: 'soloTitulo', titulo: 'Gráfico: tendencias y comparaciones', objetos: [{ tipo: 'grafico', subtipo: 'lineas', datos: DATOS[0], titulo: 'Noviembre: el mes con más dosis', x: 60, y: 120, w: 840, h: 400, etiquetas: true }] },
    ] });
    LT.ppt.miniaturas(c, [[p, 0, '<b>SmartArt</b>: procesos, ciclos, jerarquías y listas con poco texto'], [p, 1, '<b>Tabla</b>: valores exactos que se comparan en filas y columnas'], [p, 2, '<b>Gráfico</b>: tendencias, comparaciones y proporciones']], 280);
  }

  LT.definirModulo({
    id: 4,
    objetivo: 'Elegir entre SmartArt, tabla o gráfico según el mensaje y crearlos legibles.',
    situacion: 'Para el informe de la <b>campaña de vacunación contra influenza</b> necesito tres diapositivas: los pasos del día de la vacuna, el esquema por grupo y las dosis aplicadas por mes. Que cada una use la herramienta adecuada.',
    explicacion: [
      { html: '<h3>Primero el mensaje, después la herramienta</h3><ul><li><b>SmartArt</b> (Insertar › SmartArt): ideas y sus relaciones con poco texto. <i>Proceso</i> para pasos en orden; <i>Ciclo</i> para etapas que se repiten; <i>Jerarquía</i> para organigramas; <i>Lista</i> para bloques sin orden; <i>Relación</i> para conceptos que se superponen. Si ya tienes viñetas: <b>Inicio › Convertir a SmartArt</b>. Escribe en el <b>Panel de texto</b> y cambia colores en Diseño de SmartArt.</li><li><b>Tabla</b> (Insertar › Tabla): valores exactos que el público compara en filas y columnas. Pocas filas y columnas (6 × 4 como máximo), encabezados claros y filas con bandas.</li><li><b>Gráfico</b> (Insertar › Gráfico): tendencias y comparaciones. Columnas o barras para comparar; líneas para el cambio en el tiempo; circular para partes de un todo con pocas partes. Al insertarlo, PowerPoint abre una hoja de Excel para escribir los datos.</li></ul><p>Haz que el <b>título diga la conclusión</b> («Noviembre fue el mes con más dosis») y agrega etiquetas de datos cuando el número exacto importe.</p>' },
      { titulo: 'Tres herramientas, tres mensajes', widget: trio },
    ],
    ejemplo: {
      titulo: 'Convertir viñetas en un SmartArt',
      pasos: [
        'Selecciona el cuadro con las viñetas de los pasos.',
        { texto: 'Inicio › Convertir a SmartArt › Proceso básico.', ruta: ['Inicio', 'Convertir a SmartArt'] },
        { texto: 'Edita el texto en el Panel de texto (Diseño de SmartArt › Panel de texto); cada línea es una forma.', ruta: ['Diseño de SmartArt', 'Panel de texto'] },
        { texto: 'Cambia la combinación de colores en Diseño de SmartArt › Cambiar colores.', ruta: ['Diseño de SmartArt', 'Cambiar colores'] },
      ],
      pregunta: { texto: 'Quieres mostrar cómo cambiaron las dosis aplicadas de octubre a marzo. ¿Qué usas?', opciones: ['Un SmartArt de ciclo', 'Una tabla de 6 columnas', 'Un gráfico de líneas', 'Un gráfico circular'], correcta: 2, explicacion: 'El <b>cambio en el tiempo</b> se ve mejor con un gráfico de líneas: la tendencia y el pico saltan a la vista.' },
    },
    micro: [
      { titulo: '¿SmartArt, tabla o gráfico?', tipo: 'clasificar', ancho: true, enunciado: 'Elige la herramienta para cada contenido.', categorias: ['SmartArt', 'Tabla', 'Gráfico'], items: [['Pasos del registro a la observación', 0, 'Pasos en orden: SmartArt de proceso.'], ['Dosis exactas por grupo y por edad', 1, 'Valores exactos por fila y columna: tabla.'], ['Casos de influenza por semana durante el año', 2, 'Tendencia en el tiempo: gráfico de líneas.'], ['Organigrama del equipo de enfermería', 0, 'Jerarquía: SmartArt.'], ['Comparar la cobertura de 5 grupos', 2, 'Comparar valores: gráfico de barras.'], ['Horarios de vacunación por sede', 1, 'Datos exactos para consultar: tabla.']] },
      { titulo: 'Categoría de SmartArt', tipo: 'opcion', enunciado: 'Quieres mostrar el ciclo de transmisión: contagio → incubación → síntomas → contagio de otra persona… ¿Qué categoría eliges?', opciones: ['Lista', 'Proceso', 'Ciclo', 'Jerarquía'], correcta: 2, explicacion: 'Etapas que se repiten de forma continua: <b>Ciclo</b>.' },
      { titulo: 'Tipo de gráfico', tipo: 'opcion', enunciado: 'Vas a comparar la cobertura de vacunación (en %) de 5 grupos: personal de salud, adultos mayores, embarazadas, niños y personas con enfermedades crónicas.', opciones: ['Circular', 'Barras', 'Líneas', 'Anillos'], correcta: 1, explicacion: 'Cada porcentaje es independiente (no suman 100 %): compáralos con <b>barras</b>.' },
    ],
    reto: {
      titulo: 'Los datos de la campaña de vacunación', tipo: 'widget', crear: crearReto,
      base: {
        instrucciones: ['Diapositiva 1: convierte los pasos en un SmartArt de proceso, en orden.', 'Diapositiva 2: crea una tabla de 3 columnas (Grupo, Dosis, Cuándo) con los 4 grupos de las notas, sin celdas vacías y con fila de encabezado.', 'Diapositiva 3: inserta un gráfico de líneas con los datos «Dosis aplicadas por mes» y un título que diga qué muestra.'],
        pistas: ['Pasos en orden → SmartArt de proceso; datos exactos → tabla; cambio en el tiempo → gráfico de líneas.', 'Inicio › Convertir a SmartArt; Insertar › Tabla; Insertar › Gráfico. La tabla y el gráfico se editan en el panel Formato.', 'SmartArt: Proceso básico. Tabla de 3 × 5: Grupo | Dosis | Cuándo y los 4 grupos de las notas. Gráfico: Línea con «Dosis aplicadas por mes» y título «Noviembre fue el mes con más dosis».'],
      },
      niveles: {
        explorador: { instrucciones: ['Diapositiva 1: selecciona el cuadro de viñetas › Inicio › Convertir a SmartArt › Proceso básico.', 'Diapositiva 2: Insertar › Tabla › elige 3 columnas × 5 filas. En el panel Formato escribe Grupo, Dosis, Cuándo y los 4 grupos (copia los datos de las notas).', 'Diapositiva 3: Insertar › Gráfico › Línea; Datos: «Dosis aplicadas por mes» › Aceptar.', 'En el panel Formato del gráfico cambia el título por «Noviembre fue el mes con más dosis».'] },
        experto: { instrucciones: ['Todo lo del nivel Analista.', 'El título del gráfico debe decir la conclusión (en qué mes hubo más dosis) y lleva etiquetas de datos.', 'Escribe el texto alternativo del SmartArt y del gráfico.'] },
      },
    },
    lab: {
      archivo: 'lab04-campana-vacunacion.pptx', titulo: 'Informe de la campaña en PowerPoint',
      contexto: 'Tres diapositivas: los pasos del día de la vacuna (con viñetas), «¿Quién debe vacunarse?» (los datos están en las notas) y «Dosis aplicadas por mes» (los datos están en las notas).',
      pasos: {
        explorador: [{ texto: 'Diapositiva 1: selecciona las viñetas › Inicio › Convertir a SmartArt › Proceso básico.', ruta: ['Inicio', 'Convertir a SmartArt'] }, { texto: 'Diapositiva 2: Insertar › Tabla de 3 × 5 y escribe los datos de las notas.', ruta: ['Insertar', 'Tabla'] }, { texto: 'Diapositiva 3: Insertar › Gráfico › Línea. En la hoja de Excel escribe los meses y las dosis; cierra la hoja.', ruta: ['Insertar', 'Gráfico'] }, { texto: 'Haz clic en el título del gráfico y escribe uno que diga qué muestra.', ruta: ['Diseño de gráfico', 'Agregar elemento de gráfico', 'Título del gráfico'] }, 'Guarda y sube la presentación.'],
        analista: ['SmartArt de proceso con los 4 pasos.', 'Tabla de 3 columnas con los 4 grupos y encabezado.', 'Gráfico de líneas con las dosis por mes y título.', 'Guarda y sube la presentación.'],
        experto: ['Todo lo del nivel Analista.', 'Título del gráfico con la conclusión (el mes con más dosis) y etiquetas de datos.', 'Texto alternativo en el SmartArt y en el gráfico.'],
      },
      pruebas: [
        { titulo: 'SmartArt de proceso con los 4 pasos', fn: (P, A) => { const d = A.buscar(P, /d[ií]a de tu vacuna/i); const s = d && A.formas(d).find((f) => f.smartart); if (!s) return 'Convierte las viñetas en un SmartArt (Inicio › Convertir a SmartArt).'; if (!s.smartart.categorias.includes('process')) return 'Usa un diseño de la categoría Proceso.'; return s.smartart.textos.length >= 4 && /registro/i.test(s.smartart.textos[0]) ? true : 'El SmartArt debe tener los 4 pasos, empezando por «Registro».'; } },
        { titulo: 'Tabla de grupos', fn: (P, A) => { const d = A.buscar(P, /qui[eé]n debe vacunarse/i); const t = d && A.formas(d).find((f) => f.tabla); if (!t) return 'Inserta una tabla en «¿Quién debe vacunarse?».'; if (t.tabla.columnas < 3 || t.tabla.filas < 5) return 'La tabla necesita 3 columnas y 5 filas (encabezado y 4 grupos).'; return t.tabla.celdas.every((r) => r.every((c) => c.trim())) ? true : 'Hay celdas vacías en la tabla.'; } },
        { titulo: 'Gráfico de líneas con título', fn: (P, A) => { const d = A.buscar(P, /dosis aplicadas/i); const g = d && A.formas(d).find((f) => f.grafico); if (!g) return 'Inserta un gráfico en «Dosis aplicadas por mes».'; if (!g.grafico.tipos.includes('lineas')) return 'Usa un gráfico de líneas para mostrar el cambio por mes.'; if (g.grafico.puntos < 6) return 'El gráfico necesita los 6 meses de datos (octubre a marzo): edítalos en Diseño de gráfico › Editar datos.'; return g.grafico.tieneTitulo && g.grafico.titulo && !/t[ií]tulo del gr[aá]fico|chart title/i.test(g.grafico.titulo) ? true : 'Escribe un título para el gráfico.'; } },
        { titulo: 'Título-conclusión y etiquetas', nivel: 'experto', fn: (P, A) => { const d = A.buscar(P, /dosis aplicadas/i); const g = d && A.formas(d).find((f) => f.grafico); if (!g) return 'Falta el gráfico.'; if (!/nov/i.test(g.grafico.titulo)) return 'El título debe decir en qué mes hubo más dosis.'; return g.grafico.etiquetas ? true : 'Agrega etiquetas de datos (Diseño de gráfico › Agregar elemento de gráfico › Etiquetas de datos).'; } },
        { titulo: 'Texto alternativo del SmartArt y del gráfico', nivel: 'experto', fn: (P, A) => { const f = P.diapositivas.flatMap((d) => A.formas(d)).filter((x) => x.smartart || x.grafico); const s = f.find((x) => !x.descr); return s ? 'Escribe el texto alternativo de «' + s.nombre + '».' : true; } },
      ],
    },
    donde: [
      { comando: 'Convertir a SmartArt', ruta: ['Inicio', 'Convertir a SmartArt'] },
      { comando: 'Panel de texto del SmartArt', ruta: ['Diseño de SmartArt', 'Panel de texto'] },
      { comando: 'Insertar tabla', ruta: ['Insertar', 'Tabla'] },
      { comando: 'Etiquetas de datos', ruta: ['Diseño de gráfico', 'Agregar elemento de gráfico', 'Etiquetas de datos'] },
      { comando: 'Cambiar tipo de gráfico', ruta: ['Diseño de gráfico', 'Cambiar tipo de gráfico'] },
    ],
    glosario: [
      ['SmartArt', 'SmartArt', 'Diagrama listo para mostrar procesos, ciclos, jerarquías y relaciones.'],
      ['Panel de texto', 'Text pane', 'Lista donde se escribe el texto del SmartArt; cada línea es una forma.'],
      ['Filas con bandas', 'Banded rows', 'Filas alternadas de color para seguir la lectura de una tabla.'],
      ['Etiquetas de datos', 'Data labels', 'Valores escritos sobre las barras, puntos o sectores de un gráfico.'],
      ['Gráfico de líneas', 'Line chart', 'Muestra cómo cambia un valor en el tiempo.'],
    ],
    atajos: ['<kbd>Tab</kbd> pasa a la siguiente celda de una tabla; en la última celda agrega una fila.', '<kbd>Tab</kbd> / <kbd>Mayús+Tab</kbd> en el Panel de texto del SmartArt bajan o suben de nivel.'],
  });
})();

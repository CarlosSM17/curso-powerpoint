/* Módulo 3 · Imágenes, iconos y formas */
(function () {
  const { h } = LT.u;
  const { porClave, miniaturas, revisor, R, K, centro, dentro } = LT.ppt;

  const inicial = () => LT.Diapo.construir({
    titulo: 'Higiene de manos', tema: 'clinico', variante: 0,
    diapositivas: [
      { clave: 'portada', diseno: 'titulo', titulo: 'Higiene de manos', subtitulo: 'Campaña de la Clínica Universitaria Vida Sana' },
      { clave: 'info', diseno: 'soloTitulo', titulo: 'Lávate las manos en los momentos clave', objetos: [{ clave: 'foto', tipo: 'imagen', src: 'lavado', x: 60, y: 150, w: 430, h: 180, alt: '' }] },
    ],
  });

  function analizar(p) {
    const d = porClave(p, 'info') || p.diapositivas[1] || p.diapositivas[0];
    const img = d.objetos.find((o) => o.tipo === 'imagen');
    const ics = d.objetos.filter((o) => o.tipo === 'icono');
    const formas = d.objetos.filter((o) => o.tipo === 'forma' && String(o.texto || '').trim());
    return { d, img, ics, formas };
  }
  function alineados(ics) {
    if (ics.length < 3) return { medio: false, dist: false };
    const cy = ics.map((o) => centro(o).y);
    const medio = Math.max(...cy) - Math.min(...cy) <= 3;
    const fila = ics.slice().sort((a, b) => a.x - b.x);
    const gaps = fila.slice(1).map((o, i) => o.x - (fila[i].x + fila[i].w));
    const dist = gaps.every((g) => g > 0) && Math.max(...gaps) - Math.min(...gaps) <= 4;
    return { medio, dist, gaps };
  }
  function verificar(ed, nivel) {
    const p = ed.p;
    const add = revisor();
    const { d, img, ics, formas } = analizar(p);
    add(!!img, 'Imagen en la diapositiva', 'No elimines la imagen del lavado de manos.');
    if (img) {
      add(!LT.Diapo.imagenDeformada(img), 'Imagen sin deformar', 'La imagen está estirada: restablece sus proporciones (panel Formato › Recortar y tamaño) o arrastra solo desde las esquinas.');
      const alt = String(img.alt || '').trim();
      add(alt.length >= 15 && !/\.(png|jpe?g)$/i.test(alt), 'Texto alternativo de la imagen', alt ? 'Describe mejor la imagen (una frase de lo que comunica, no el nombre del archivo).' : 'Agrega el texto alternativo de la imagen (panel Formato › Texto alternativo).');
    }
    add(ics.length >= 3, 'Tres iconos o más', 'Inserta al menos 3 iconos (Insertar › Iconos).');
    if (ics.length >= 3) {
      const colores = new Set(ics.map((o) => R.color(p, o.color || 'tema:acento1')));
      add(colores.size === 1, 'Iconos del mismo color', 'Usa el mismo color en todos los iconos: da unidad visual.');
      const a = alineados(ics);
      add(a.medio, 'Iconos alineados al medio', 'Selecciona los iconos (Mayús+clic) y usa Organizar › Alinear al medio.');
      add(a.dist, 'Iconos distribuidos', 'Separa los iconos sin encimarlos y usa Organizar › Distribuir horizontalmente para dejar el mismo espacio entre ellos.');
      add(ics.every((o) => o.decorativo || String(o.alt || '').trim().length >= 3), 'Iconos descritos o decorativos', 'Cada icono necesita texto alternativo o «Marcar como decorativo» (si el texto cercano ya lo explica).');
    }
    const f = formas[0];
    add(!!f, 'Forma con el mensaje', 'Inserta una forma (Insertar › Formas) y escribe dentro el mensaje, por ejemplo «Lávate de 40 a 60 segundos».');
    if (f) { const e = R.estilo(p, d, f); add(R.contrasteDe(p, d, f) >= (e.tam >= 24 || (e.negrita && e.tam >= 18.5) ? 3 : 4.5), 'Mensaje legible', 'El texto de la forma tiene poco contraste con su relleno.'); }
    const fuera = d.objetos.find((o) => !dentro(o));
    add(!fuera, 'Todo dentro de la diapositiva', fuera ? '«' + fuera.nombre + '» se sale de la diapositiva.' : '');
    const errs = LT.Diapo.accesibilidad(p).filter((x) => x.tipo === 'error');
    add(!errs.length, 'Comprobar accesibilidad sin errores', errs.length ? errs[0].texto : '');
    if (nivel === 'experto' && img) {
      add(img.recorte && img.recorte.forma === 'elipse' && Math.abs(img.recorte.ratio - 1) < 0.01 && !LT.Diapo.imagenDeformada(img), 'Imagen recortada en círculo', 'Recorta la imagen a la relación 1:1 y a la forma Elipse (panel Formato › Recortar).');
      add(ics.every((o) => !o.color || /^tema:/.test(o.color)), 'Iconos con color del tema', 'Colorea los iconos con un color de la fila «Tema» de la paleta.');
    }
    return add.lista;
  }
  function crearReto(cont, nivel, extra) {
    const r = LT.modulo.retoSimulador(cont, { presentacion: inicial(), herramientas: ['insertar', 'inicio', 'revisar'], pestana: 'insertar', verificar }, extra);
    if (!r.ed.recuperado) r.ed.irA(1);
    return r;
  }

  function comparativo(c) {
    const mal = LT.Diapo.construir({ tema: 'clinico', variante: 1, diapositivas: [{ diseno: 'soloTitulo', titulo: 'Momentos clave', objetos: [
      { tipo: 'imagen', src: 'lavado', x: 40, y: 140, w: 470, h: 170 },
      { tipo: 'icono', icono: 'gota', x: 560, y: 150, w: 90, h: 90, color: '#ff0000' }, { tipo: 'icono', icono: 'jabon', x: 690, y: 190, w: 70, h: 70, color: '#00b050' }, { tipo: 'icono', icono: 'mano', x: 800, y: 140, w: 110, h: 110, color: '#7030a0' },
      { tipo: 'forma', forma: 'estrella', texto: '¡40 s!', x: 600, y: 330, w: 200, h: 170, relleno: '#ffff00' }] }] });
    const bien = LT.Diapo.construir({ tema: 'clinico', variante: 1, diapositivas: [{ diseno: 'soloTitulo', titulo: 'Momentos clave', objetos: [
      { tipo: 'imagen', src: 'lavado', x: 40, y: 140, w: 400, h: 300, recorte: { ratio: 4 / 3 } },
      { tipo: 'icono', icono: 'gota', x: 500, y: 170, w: 96, h: 96 }, { tipo: 'icono', icono: 'jabon', x: 652, y: 170, w: 96, h: 96 }, { tipo: 'icono', icono: 'mano', x: 804, y: 170, w: 96, h: 96 },
      { tipo: 'forma', forma: 'redondeado', texto: 'Lávate de 40 a 60 segundos', x: 500, y: 330, w: 400, h: 90 }] }] });
    miniaturas(c, [[mal, 0, '<b>Evita</b>: imagen estirada, iconos de tamaños y colores distintos, desalineados y forma estridente', 'mal'], [bien, 0, '<b>Mejor</b>: proporciones originales, iconos iguales, alineados y distribuidos', 'bien']], 320);
  }

  LT.definirModulo({
    id: 3,
    objetivo: 'Insertar y ajustar imágenes sin deformarlas, usar iconos y formas para explicar visualmente, alinearlos y describirlos con texto alternativo.',
    situacion: 'Para la campaña de <b>higiene de manos</b> quiero una diapositiva tipo infografía: la imagen del lavado, iconos de los momentos clave bien alineados y un mensaje dentro de una forma. Que también la entiendan las personas que usan lector de pantalla.',
    explicacion: [
      { html: '<h3>Imágenes</h3><ul><li><b>Insertar › Imágenes</b> (Este dispositivo o Imágenes de archivo). Usa imágenes propias, de archivo de Office o con licencia libre, y cita la fuente. No uses fotos de pacientes identificables sin su consentimiento.</li><li>Cambia el tamaño <b>desde las esquinas</b>: si arrastras un lado, la imagen se <b>deforma</b>. Para quitar partes usa <b>Formato de imagen › Recortar</b>; también puedes <b>recortar en una forma</b> (círculo) o a una <b>relación de aspecto</b> (1:1, 16:9).</li></ul><h3>Iconos y formas</h3><ul><li><b>Insertar › Iconos</b>: son vectoriales (SVG), crecen sin perder calidad y se pueden recolorear. Usa un mismo estilo, tamaño y color.</li><li><b>Insertar › Formas</b>: rectángulos, flechas y bocadillos para resaltar un mensaje o armar un diagrama; puedes escribir dentro.</li><li><b>Alinear y distribuir</b> (Formato de forma › Alinear): alinea al medio y deja el mismo espacio entre objetos. Las guías rojas aparecen al arrastrar.</li></ul>' },
      { html: '<h3>Texto alternativo</h3><p>El <b>texto alternativo</b> (clic derecho › Ver texto alternativo) describe en una o dos frases lo que comunica una imagen, icono o gráfico, para quien usa lector de pantalla o cuando la imagen no carga. Si un objeto solo adorna, márcalo como <b>decorativo</b>. <b>Revisar › Comprobar accesibilidad</b> te dice qué falta.</p>' },
      { titulo: 'Evita y mejor', widget: comparativo },
    ],
    ejemplo: {
      titulo: 'Alinear y distribuir iconos',
      pasos: [
        { texto: 'Insertar › Iconos: busca y selecciona varios a la vez; luego Insertar.', ruta: ['Insertar', 'Iconos'] },
        'Acomódalos en una fila aproximada. Selecciónalos todos con Mayús+clic.',
        { texto: 'Formato de gráficos › Alinear › Alinear al medio.', ruta: ['Formato de gráficos', 'Alinear', 'Alinear al medio'] },
        { texto: 'Formato de gráficos › Alinear › Distribuir horizontalmente.', ruta: ['Formato de gráficos', 'Alinear', 'Distribuir horizontalmente'] },
        'Clic derecho en cada icono › Ver texto alternativo: descríbelo o márcalo como decorativo.',
      ],
      pregunta: { texto: 'Arrastras el controlador del <b>lado derecho</b> de una foto hasta duplicar su ancho. ¿Qué pasa?', opciones: ['Crece proporcionalmente', 'Se deforma: se estira solo a lo ancho', 'Se recorta', 'No cambia'], correcta: 1, explicacion: 'Los controladores laterales cambian una sola dimensión. Usa las esquinas (o Mayús) para conservar la proporción.' },
    },
    micro: [
      { titulo: 'Un buen texto alternativo', tipo: 'opcion', enunciado: 'Imagen: una enfermera muestra cómo frotar los pulgares durante el lavado de manos. ¿Cuál es el mejor texto alternativo?', opciones: ['imagen1.png', 'Imagen', 'Enfermera muestra cómo frotar los pulgares con movimiento de rotación al lavarse las manos.', 'Foto bonita'], correcta: 2, explicacion: 'Describe lo que la imagen comunica, en una frase, sin «imagen de…».' },
      { titulo: '¿Describir o decorativo?', tipo: 'clasificar', ancho: true, enunciado: '¿Qué harías con el texto alternativo de cada objeto?', categorias: ['Describirlo', 'Marcar como decorativo'], items: [['Gráfico de dosis aplicadas por mes', 0, 'Un gráfico informa: describe su conclusión.'], ['Línea de adorno bajo el título', 1, 'Un adorno no aporta información.'], ['Foto de los pasos del lavado de manos', 0, 'La foto enseña algo: descríbela.'], ['Icono de gota junto al texto «Moja tus manos» (el texto ya lo dice)', 1, 'Si el texto ya dice lo mismo, el icono es decorativo.']] },
      { titulo: 'Alinea los iconos', tipo: 'widget', ancho: true, enunciado: 'Alinea al medio los tres iconos y distribúyelos horizontalmente (selecciónalos con Mayús+clic y usa Inicio › Organizar o el panel Formato).', crear: (c, listo) => {
        const p = LT.Diapo.construir({ tema: 'clinico', diapositivas: [{ diseno: 'soloTitulo', titulo: 'Antes de comer, después del baño y al llegar a casa', objetos: [{ tipo: 'icono', icono: 'manzana', x: 140, y: 170, w: 110, h: 110, decorativo: true }, { tipo: 'icono', icono: 'gota', x: 400, y: 260, w: 110, h: 110, decorativo: true }, { tipo: 'icono', icono: 'casa', x: 700, y: 200, w: 110, h: 110, decorativo: true }] }] });
        const ed = new LT.Diapo(c, { presentacion: p, herramientas: ['inicio'], alto: 470, notas: false });
        const retro = h('div');
        c.appendChild(retro);
        ed.on('cambio', () => { const a = alineados(ed.d.objetos.filter((o) => o.tipo === 'icono')); if (a.medio && a.dist) { retro.innerHTML = ''; retro.appendChild(h('div', { class: 'aviso-caja ok' }, '✓ Alineados y distribuidos.')); listo(); } });
      } },
    ],
    reto: {
      titulo: 'Infografía de los momentos de la higiene de manos', tipo: 'widget', crear: crearReto,
      base: {
        instrucciones: ['En la diapositiva 2, corrige la imagen deformada y escribe su texto alternativo.', 'Inserta 3 iconos o más (por ejemplo agua, jabón y mano) del mismo color; alinéalos al medio y distribúyelos horizontalmente.', 'Describe los iconos o márcalos como decorativos.', 'Inserta una forma con el mensaje «Lávate de 40 a 60 segundos» (con buen contraste).', 'Comprueba la accesibilidad: sin errores.'],
        pistas: ['Una imagen se deforma si cambias solo su ancho o su alto. Los objetos se ordenan mejor con Alinear que «a ojo».', 'Panel Formato › Recortar y tamaño › Restablecer proporciones. Insertar › Iconos (puedes elegir varios). Para alinear: Mayús+clic en los iconos › Inicio › Organizar.', 'Imagen: Restablecer proporciones + texto alternativo «Dos manos con jabón y espuma bajo el chorro de agua». Iconos: gota, jabón y mano en una fila a la derecha › Alinear al medio › Distribuir horizontalmente › Marcar como decorativo. Forma: Rectángulo: esquinas redondeadas con el mensaje.'],
      },
      niveles: {
        explorador: { instrucciones: ['Haz clic en la imagen. En el panel Formato › Recortar y tamaño, pulsa «Restablecer proporciones».', 'En Texto alternativo escribe una frase como «Dos manos con jabón y espuma bajo el chorro de agua».', 'Insertar › Iconos: busca y elige «Agua», «Jabón» y «Mano» › Insertar. Arrástralos en una fila a la derecha de la imagen.', 'Selecciónalos con Mayús+clic › Inicio › Organizar › Alinear al medio; luego Distribuir horizontalmente.', 'Con cada icono seleccionado, marca «Marcar como decorativo» en el panel Formato.', 'Insertar › Formas › Rectángulo: esquinas redondeadas; haz doble clic y escribe «Lávate de 40 a 60 segundos».', 'Revisar › Comprobar accesibilidad: no debe quedar ningún error.'] },
        experto: { instrucciones: ['Todo lo del nivel Analista.', 'Recorta la imagen a la relación 1:1 y a la forma Elipse.', 'Colorea los iconos con un color del tema.'] },
      },
    },
    lab: {
      archivo: 'lab03-higiene-de-manos.pptx', titulo: 'Infografía de higiene de manos en PowerPoint',
      contexto: 'La diapositiva 2 tiene la imagen del lavado de manos deformada y sin texto alternativo. Puedes usar los iconos de PowerPoint (Insertar › Iconos) o descargar los de la clínica.',
      descargas: [{ ruta: 'assets/media/iconos/gota.svg', texto: 'Icono agua (SVG)' }, { ruta: 'assets/media/iconos/jabon.svg', texto: 'Icono jabón (SVG)' }, { ruta: 'assets/media/iconos/mano.svg', texto: 'Icono mano (SVG)' }],
      pasos: {
        explorador: [{ texto: 'Selecciona la imagen › Formato de imagen › Tamaño: activa «Bloquear relación de aspecto» o usa Restablecer imagen › Restablecer imagen y tamaño.', ruta: ['Formato de imagen', 'Restablecer imagen'] }, { texto: 'Clic derecho en la imagen › Ver texto alternativo y escribe una descripción.', ruta: ['Formato de imagen', 'Texto alternativo'] }, { texto: 'Insertar › Iconos: elige 3 (agua, jabón, mano) e insértalos.', ruta: ['Insertar', 'Iconos'] }, { texto: 'Selecciónalos › Formato de gráficos › Alinear › Alinear al medio y Distribuir horizontalmente.', ruta: ['Formato de gráficos', 'Alinear', 'Distribuir horizontalmente'] }, 'Marca los iconos como decorativos (Ver texto alternativo › Marcar como decorativo).', { texto: 'Insertar › Formas › Rectángulo: esquinas redondeadas con el mensaje «Lávate de 40 a 60 segundos».', ruta: ['Insertar', 'Formas'] }, 'Guarda y sube la presentación.'],
        analista: ['Imagen sin deformar y con texto alternativo.', '3 iconos o más alineados al medio y distribuidos horizontalmente, descritos o decorativos.', 'Una forma con el mensaje.', 'Guarda y sube la presentación.'],
        experto: ['Todo lo del nivel Analista.', 'Recorta la imagen a la forma Elipse y a la relación de aspecto 1:1 (Formato de imagen › Recortar).'],
      },
      notaMac: 'En Mac, «Alinear» está en Formato de forma › Organizar › Alinear.',
      pruebas: [
        { titulo: 'Imagen sin deformar', fn: (P, A) => { const d = A.buscar(P, /momentos clave/i); const im = d && A.imagenes(d).find((f) => !f.imagen.svg); if (!im) return 'No encontré la imagen en «Lávate las manos en los momentos clave».'; return A.deformada(im) ? 'La imagen sigue deformada: restablece su tamaño o bloquea la relación de aspecto.' : true; } },
        { titulo: 'Texto alternativo de la imagen', fn: (P, A) => { const d = A.buscar(P, /momentos clave/i); const im = d && A.imagenes(d).find((f) => !f.imagen.svg); if (!im) return 'No encontré la imagen.'; const t = im.descr; return t.length >= 15 && !/\.(png|jpe?g)$/i.test(t) && !/^(imagen|foto)$/i.test(t) ? true : 'Describe la imagen en una frase (clic derecho › Ver texto alternativo).'; } },
        { titulo: 'Tres iconos alineados y distribuidos', fn: (P, A) => {
          const d = A.buscar(P, /momentos clave/i);
          const ics = d ? A.iconos(d) : [];
          if (ics.length < 3) return 'Inserta al menos 3 iconos (Insertar › Iconos).';
          const tol = 12700 * 3;
          const cy = ics.map((f) => f.y + f.cy / 2);
          if (Math.max(...cy) - Math.min(...cy) > tol) return 'Alinea los iconos al medio (Alinear › Alinear al medio).';
          const fila = ics.slice().sort((a, b) => a.x - b.x);
          const gaps = fila.slice(1).map((f, i) => f.x - (fila[i].x + fila[i].cx));
          if (gaps.some((g) => g <= 0)) return 'Los iconos se enciman: sepáralos.';
          return Math.max(...gaps) - Math.min(...gaps) <= tol ? true : 'Distribuye los iconos horizontalmente para dejar el mismo espacio entre ellos.';
        } },
        { titulo: 'Iconos descritos o decorativos', fn: (P, A) => { const d = A.buscar(P, /momentos clave/i); const ics = d ? A.iconos(d) : []; const f = ics.find((x) => !x.decorativo && x.descr.length < 3); return f ? 'El icono «' + f.nombre + '» no tiene texto alternativo ni está marcado como decorativo.' : true; } },
        { titulo: 'Forma con el mensaje', fn: (P, A) => { const d = A.buscar(P, /momentos clave/i); const f = d && A.formas(d).find((x) => x.tipo === 'sp' && !x.ph && !x.cuadroTexto && x.geometria && x.texto); return f ? true : 'Inserta una forma (Insertar › Formas) y escribe el mensaje dentro.'; } },
        { titulo: 'Imagen recortada en círculo', nivel: 'experto', fn: (P, A) => { const d = A.buscar(P, /momentos clave/i); const im = d && A.imagenes(d).find((f) => !f.imagen.svg); if (!im) return 'No encontré la imagen.'; if (im.geometria !== 'ellipse') return 'Recorta la imagen a la forma Elipse (Formato de imagen › Recortar › Recortar en la forma).'; return Math.abs(im.cx / im.cy - 1) < 0.03 ? true : 'Usa la relación de aspecto 1:1 para que quede un círculo.'; } },
      ],
    },
    donde: [
      { comando: 'Insertar imágenes desde este dispositivo', ruta: ['Insertar', 'Imágenes', 'Este dispositivo…'] },
      { comando: 'Iconos', ruta: ['Insertar', 'Iconos'] },
      { comando: 'Recortar en la forma', ruta: ['Formato de imagen', 'Recortar', 'Recortar en la forma'], nota: 'La pestaña Formato de imagen aparece al seleccionar una imagen.' },
      { comando: 'Distribuir horizontalmente', ruta: ['Formato de gráficos', 'Alinear', 'Distribuir horizontalmente'] },
      { comando: 'Texto alternativo', ruta: ['Formato de imagen', 'Texto alternativo'], nota: 'También con clic derecho › Ver texto alternativo.' },
    ],
    glosario: [
      ['Texto alternativo', 'Alt text', 'Descripción breve de un objeto para lectores de pantalla.'],
      ['Decorativo', 'Mark as decorative', 'Indica que un objeto no aporta información; el lector de pantalla lo omite.'],
      ['Recortar en la forma', 'Crop to shape', 'Muestra la imagen dentro de una forma (círculo, rectángulo redondeado…).'],
      ['Relación de aspecto', 'Aspect ratio', 'Proporción entre ancho y alto (4:3, 16:9, 1:1).'],
      ['SVG', 'Scalable Vector Graphics', 'Formato vectorial de los iconos: crece sin perder calidad.'],
      ['Distribuir', 'Distribute', 'Reparte objetos con el mismo espacio entre ellos.'],
    ],
    atajos: ['<kbd>Mayús</kbd> + arrastrar una esquina conserva la proporción.', '<kbd>Ctrl</kbd> + arrastrar duplica un objeto.', '<kbd>Mayús</kbd> + clic selecciona varios objetos.', 'Flechas mueven el objeto; <kbd>Ctrl</kbd> + flecha lo mueve con precisión.'],
  });
})();

/* Módulo 2 · Diseño de diapositivas: temas y variantes, jerarquía visual, tipografía y color */
(function () {
  const { h } = LT.u;
  const { porClave, miniaturas, medidorContraste, revisor, R, K } = LT.ppt;
  const DECORATIVAS = ['Comic Sans MS', 'Brush Script MT', 'Impact', 'Courier New'];

  const inicial = () => LT.Diapo.construir({
    titulo: 'Hipertensión', tema: 'office',
    diapositivas: [
      { clave: 'portada', diseno: 'titulo', titulo: 'Hipertensión: conoce tus números', subtitulo: 'Plática para pacientes · Clínica Universitaria Vida Sana', estilos: { titulo: { fuente: 'Brush Script MT', tam: 32, color: '#7f7f7f' }, subtitulo: { fuente: 'Comic Sans MS', tam: 14, color: '#bfbfbf' } } },
      { clave: 'que', diseno: 'tituloObjetos', titulo: '¿Qué es la presión arterial alta?', cuerpo: 'Es la fuerza con la que la sangre empuja las paredes de las arterias\nCuando está alta de forma constante se llama hipertensión\nMuchas veces no da síntomas\nAumenta el riesgo de infarto, embolia y daño renal\nSe mide con un baumanómetro en mmHg\nTiene dos números: sistólica y diastólica\nPuede afectar a jóvenes y adultos\nSe puede controlar con hábitos y tratamiento', estilos: { titulo: { fuente: 'Impact', tam: 20 }, cuerpo: { fuente: 'Times New Roman', tam: 14, color: '#c0c0c0' } } },
      { clave: 'cifras', diseno: 'tituloObjetos', titulo: 'Cifras de referencia', cuerpo: 'Normal: menos de 120/80 mmHg\nElevada: de 120/80 a 139/89\nHipertensión: 140/90 o más (se confirma con varias tomas)', estilos: { cuerpo: { fuente: 'Courier New', tam: 16, color: '#ffc000' } } },
      { clave: 'acciones', diseno: 'tituloObjetos', titulo: 'Acciones para controlarla', cuerpo: 'Mide tu presión al menos una vez al año\nReduce la sal y los alimentos procesados\nCamina 30 minutos al día\nToma tus medicamentos como te indicaron', estilos: { titulo: { tam: 24, color: '#ffff00' }, cuerpo: { tam: 28, negrita: true } } },
    ],
  });

  /* Textos visibles con su estilo efectivo */
  function textos(p) {
    const out = [];
    p.diapositivas.forEach((d, i) => d.objetos.forEach((o) => { if ((o.tipo === 'texto' || o.tipo === 'forma') && String(o.texto || '').trim()) out.push({ d, i, o, e: R.estilo(p, d, o), titulo: o.ph === 'titulo' }); }));
    return out;
  }
  function verificar(ed, nivel) {
    const p = ed.p;
    const add = revisor();
    const T = textos(p);
    add(p.tema !== 'office', 'Tema aplicado', 'Aplica un tema distinto del «Tema de Office» (Diseño › Temas).');
    add(p.tema !== 'office' && p.variante > 0, 'Variante elegida', 'Elige una variante distinta de la primera (Diseño › Variantes).');
    const fam = Array.from(new Set(T.map((x) => x.e.fuenteReal)));
    add(fam.length <= 2, 'Máximo dos tipos de letra', 'Usas ' + fam.length + ' tipos de letra (' + fam.join(', ') + '). Deja solo dos: los del tema son una buena opción.');
    const deco = fam.filter((f) => DECORATIVAS.includes(f));
    add(!deco.length, 'Tipografía legible', 'Evita fuentes decorativas o difíciles de leer en pantalla: ' + deco.join(', ') + '.');
    const tchico = T.find((x) => x.titulo && x.e.tam < 32);
    add(!tchico, 'Títulos de 32 pt o más', tchico ? 'El título de la diapositiva ' + (tchico.i + 1) + ' mide ' + tchico.e.tam + ' pt: usa 32 pt o más.' : '');
    const xchico = T.find((x) => !x.titulo && x.e.tam < 20);
    add(!xchico, 'Texto de 20 pt o más', xchico ? 'El texto «' + String(xchico.o.texto).split('\n')[0].slice(0, 30) + '…» (diapositiva ' + (xchico.i + 1) + ') mide ' + xchico.e.tam + ' pt: desde el fondo de la sala no se lee. Usa 20 pt o más.' : '');
    const inv = p.diapositivas.findIndex((d) => { const t = T.filter((x) => x.d === d); const ti = t.find((x) => x.titulo); return ti && t.some((x) => !x.titulo && x.e.tam >= ti.e.tam); });
    add(inv < 0, 'Jerarquía: el título destaca más que el texto', 'En la diapositiva ' + (inv + 1) + ' el texto es igual o más grande que el título: la jerarquía está invertida.');
    const malC = T.find((x) => { const c = R.contrasteDe(p, x.d, x.o); return c < (x.e.tam >= 24 || (x.e.negrita && x.e.tam >= 18.5) ? 3 : 4.5); });
    add(!malC, 'Contraste suficiente', malC ? 'El texto «' + String(malC.o.texto).split('\n')[0].slice(0, 30) + '…» (diapositiva ' + (malC.i + 1) + ') tiene contraste de ' + R.contrasteDe(p, malC.d, malC.o).toFixed(1) + ':1 con el fondo. Usa los colores del tema o uno más oscuro/claro.' : '');
    const muchas = p.diapositivas.findIndex((d) => d.objetos.some((o) => /^cuerpo/.test(o.ph || '') && String(o.texto || '').split('\n').filter((l) => l.trim()).length > 6));
    add(muchas < 0, 'Máximo 6 viñetas por diapositiva', 'La diapositiva ' + (muchas + 1) + ' tiene más de 6 viñetas: deja las esenciales o divídela en dos diapositivas.');
    if (nivel === 'experto') {
      const suelto = T.find((x) => x.o.estilo && x.o.estilo.color && !/^tema:/.test(x.o.estilo.color));
      add(!suelto, 'Colores de la paleta del tema', suelto ? 'El texto de la diapositiva ' + (suelto.i + 1) + ' usa un color fuera del tema (' + suelto.o.estilo.color + '). Elige un color de la fila «Tema» o restablece el estilo.' : '');
      const cifras = porClave(p, 'cifras');
      add(!!cifras && p.diapositivas.length >= 4, 'Contenido completo', 'No elimines diapositivas de la plática.');
    }
    return add.lista;
  }
  function crearReto(cont, nivel, extra) {
    return LT.modulo.retoSimulador(cont, { presentacion: inicial(), herramientas: ['diseno', 'inicio', 'revisar', 'vista'], pestana: 'diseno', verificar }, extra);
  }

  function antesDespues(c) {
    const mal = inicial();
    const bien = LT.Diapo.construir({ tema: 'clinico', variante: 1, diapositivas: [{ diseno: 'tituloObjetos', titulo: 'Acciones para controlarla', cuerpo: 'Mide tu presión al menos una vez al año\nReduce la sal y los alimentos procesados\nCamina 30 minutos al día\nToma tus medicamentos como te indicaron' }] });
    miniaturas(c, [[mal, 3, '<b>Antes</b>: título más chico que el texto y amarillo sobre blanco', 'mal'], [bien, 0, '<b>Después</b>: tema y variante, título dominante, buen contraste', 'bien']], 300);
  }

  LT.definirModulo({
    id: 2,
    objetivo: 'Aplicar un tema y una variante coherentes y crear jerarquía visual con tipografía legible y colores con buen contraste.',
    situacion: 'La plática de <b>hipertensión</b> para la sala de espera se ve saturada: letras pequeñas, cinco tipos de letra, texto gris claro sobre blanco y demasiado texto. Necesito que se lea desde el fondo de la sala y que se vea como una sola presentación.',
    explicacion: [
      { html: '<h3>Temas y variantes</h3><p>Un <b>tema</b> (Diseño › Temas) es un paquete coherente de <b>colores, fuentes, efectos, fondos y diseños</b>; al aplicarlo, toda la presentación cambia a la vez. Una <b>variante</b> (Diseño › Variantes) es otra combinación de colores o de fondo del mismo tema. Lo que formateas a mano (un color o una fuente elegidos uno por uno) no se actualiza con el tema: para volver al estilo del tema usa <b>Inicio › Restablecer</b> o <kbd>Ctrl+Espacio</kbd> sobre el texto.</p><h3>Jerarquía visual: qué se ve primero</h3><ul><li><b>Tamaño</b>: título más grande que el texto; lo más importante, más grande.</li><li><b>Peso y color</b>: negrita o un color de énfasis solo para lo clave.</li><li><b>Posición y espacio</b>: arriba a la izquierda se lee primero; el espacio en blanco separa ideas.</li><li><b>Poco texto</b>: una idea por diapositiva y no más de 6 viñetas cortas; el detalle va en tus notas.</li></ul>' },
      { html: '<h3>Tipografía legible</h3><ul><li>Máximo <b>dos familias</b>: una para títulos y otra para el texto (las del tema).</li><li>Tamaños orientativos: títulos de 36 a 44 pt; texto de 24 pt o más (nunca menos de 18 a 20 pt).</li><li>Fuentes sin remates (Calibri, Segoe UI, Aptos) se leen mejor en pantalla. Evita fuentes decorativas (Comic Sans, Brush Script), MAYÚSCULAS sostenidas, cursivas largas y subrayado (parece vínculo).</li></ul><h3>Uso adecuado del color</h3><ul><li>Usa la <b>paleta del tema</b> y <b>un color de énfasis</b> para lo importante.</li><li><b>Contraste</b>: al menos 4.5:1 entre texto y fondo (3:1 en texto grande, de 24 pt o más). El proyector y la luz de la sala lo reducen todavía más.</li><li>No comuniques solo con color (rojo/verde): agrega texto o iconos; 1 de cada 12 hombres distingue mal esos colores.</li></ul>' },
      { titulo: 'Medidor de contraste', instr: 'Elige un color de texto y uno de fondo, o prueba las combinaciones de abajo.', widget: (c) => medidorContraste(c) },
      { titulo: 'Antes y después', widget: antesDespues },
    ],
    ejemplo: {
      titulo: 'Aplicar un tema, una variante y restablecer el formato',
      pasos: [
        { texto: 'Diseño › Temas: pasa el cursor sobre los temas para ver la vista previa y haz clic en uno.', ruta: ['Diseño', 'Temas'] },
        { texto: 'Diseño › Variantes: elige la combinación de colores que mejor contraste tenga.', ruta: ['Diseño', 'Variantes'] },
        { texto: 'Si una diapositiva conserva fuentes o colores puestos a mano, selecciónala y usa Inicio › Restablecer.', ruta: ['Inicio', 'Restablecer'] },
        { texto: 'Ajusta tamaños con Inicio › Tamaño de fuente (o Ctrl+Mayús+> y Ctrl+Mayús+<).', ruta: ['Inicio', 'Tamaño de fuente'] },
      ],
      pregunta: { texto: 'Una diapositiva tiene texto gris claro (#BFBFBF) sobre fondo blanco. ¿Qué pasa al proyectarla?', opciones: ['Se lee bien desde lejos', 'Tiene poco contraste: costará leerla, sobre todo con proyector', 'Es lo recomendado para textos secundarios', 'Depende solo del tipo de letra'], correcta: 1, explicacion: '#BFBFBF sobre blanco tiene un contraste de apenas 1.8:1; para texto normal se recomienda al menos 4.5:1.' },
    },
    micro: [
      { titulo: 'Texto sobre fondo oscuro', tipo: 'widget', enunciado: 'El fondo es azul oscuro (#0B3D66). Elige un color de texto con contraste suficiente (4.5:1 o más).', crear: (c, listo) => {
        const fondo = '#0b3d66';
        const retro = h('div');
        const fila = h('div', { class: 'grupo-btn' });
        for (const col of ['#7f7f7f', '#2e75b6', '#ffffff', '#c00000']) {
          fila.appendChild(h('button', { class: 'btn', style: { background: fondo, color: col, fontWeight: 700, minWidth: '90px' }, onclick: () => {
            const ct = K.contraste(col, fondo);
            retro.innerHTML = '';
            if (ct >= 4.5) { retro.appendChild(h('div', { class: 'aviso-caja ok' }, '✓ Contraste de ' + ct.toFixed(1) + ':1. Sobre fondos oscuros, el texto claro se lee mejor.')); listo(); }
            else retro.appendChild(h('div', { class: 'aviso-caja alerta' }, 'Contraste de ' + ct.toFixed(1) + ':1: insuficiente.'));
          } }, 'Texto'));
        }
        c.append(fila, retro);
      } },
      { titulo: 'Tipografía para pantalla', tipo: 'opcion', enunciado: '¿Qué combinación de fuentes conviene para una plática proyectada?', opciones: ['Comic Sans MS para títulos y Brush Script para el texto', 'Las dos fuentes del tema: una para títulos y otra para el texto', 'Cinco fuentes distintas para que sea dinámica', 'Todo en mayúsculas y cursiva para resaltar'], correcta: 1, explicacion: 'Dos familias legibles (las del tema) dan unidad y se leen bien desde lejos.' },
      { titulo: '¿Tema o variante?', tipo: 'clasificar', ancho: true, enunciado: '¿Qué cambiarías en cada caso?', categorias: ['El tema', 'La variante'], items: [['Quieres otras fuentes, otros adornos y otro estilo de fondo', 0, 'Fuentes y adornos dependen del tema.'], ['Te gusta el estilo, pero quieres otra combinación de colores', 1, 'La variante cambia colores sin cambiar el estilo.'], ['Pasar de «Clínico» a «Vital»', 0, 'Son temas distintos.'], ['Pasar de «Azul clínico» a «Verde agua» dentro de «Clínico»', 1, 'Son variantes del mismo tema.']] },
      { titulo: 'Jerarquía invertida', tipo: 'opcion', enunciado: 'Una diapositiva tiene el título en 24 pt y el texto en 28 pt y negrita. ¿Qué ve primero el público?', opciones: ['El título', 'El texto: la jerarquía está invertida', 'Ambos por igual', 'Nada en particular'], correcta: 1, explicacion: 'Lo más grande y pesado atrae la mirada: el título debe dominar.' },
    ],
    reto: {
      titulo: 'Rediseñar la plática de hipertensión', tipo: 'widget', crear: crearReto,
      base: {
        instrucciones: ['Aplica un tema y elige una variante distinta de la primera.', 'Usa máximo dos tipos de letra legibles (sin Comic Sans, Brush Script, Impact ni Courier).', 'Títulos de 32 pt o más y texto de 20 pt o más; el título siempre más grande que el texto.', 'Todo el texto con contraste suficiente con su fondo.', 'Máximo 6 viñetas por diapositiva.'],
        pistas: ['Casi todos los problemas vienen del formato puesto a mano: el tema ya trae fuentes, tamaños y colores pensados para leerse.', 'Diseño › Temas y Diseño › Variantes. Para borrar el formato manual: selecciona el objeto y usa «Restablecer al estilo del tema» (panel Formato) o Inicio › Restablecer en cada diapositiva.', 'Aplica «Clínico» › variante «Verde agua»; en cada diapositiva usa Inicio › Restablecer; en la diapositiva 2 borra dos viñetas (por ejemplo «Puede afectar a jóvenes y adultos» y «Se mide con un baumanómetro en mmHg»).'],
      },
      niveles: {
        explorador: { instrucciones: ['Diseño › Temas › «Clínico». Luego Diseño › Variantes › «Verde agua».', 'Ve a cada diapositiva y usa Inicio › Restablecer: quita las fuentes, tamaños y colores puestos a mano.', 'En la diapositiva 2 haz doble clic en el texto y borra dos viñetas para dejar 6.', 'Abre Revisar › Comprobar accesibilidad: no debe quedar ningún problema de contraste.'] },
        experto: { instrucciones: ['Todo lo del nivel Analista.', 'Usa solo colores de la paleta del tema (fila «Tema» de la paleta) o el color predeterminado.', 'No elimines diapositivas: si sobra texto, divídelo (Duplicar diapositiva).'] },
      },
    },
    lab: {
      archivo: 'lab02-hipertension.pptx', titulo: 'Rediseño de la plática de hipertensión',
      contexto: 'La presentación usa cuatro fuentes distintas, tamaños de 14 pt, texto gris claro y amarillo sobre blanco y una diapositiva con 8 viñetas.',
      pasos: {
        explorador: [{ texto: 'Diseño › Temas: aplica un tema (por ejemplo, Faceta o Retrospección) y elige una variante.', ruta: ['Diseño', 'Temas'] }, { texto: 'Selecciona todas las diapositivas en el panel de miniaturas (Ctrl+A) y usa Inicio › Restablecer.', ruta: ['Inicio', 'Restablecer'] }, 'Si quedan colores o fuentes a mano: selecciona el texto y presiona Ctrl+Espacio.', 'Revisa los tamaños: títulos de 32 pt o más y texto de 20 pt o más (Inicio › Tamaño de fuente).', 'En «¿Qué es la presión arterial alta?» deja 6 viñetas o menos (puedes dividirla en dos diapositivas).', 'Guarda y sube la presentación.'],
        analista: ['Aplica un tema y una variante.', 'Máximo dos fuentes legibles; títulos ≥ 32 pt y texto ≥ 20 pt.', 'Contraste suficiente en todo el texto.', 'Máximo 6 viñetas por diapositiva.', 'Guarda y sube la presentación.'],
        experto: ['Todo lo del nivel Analista.', 'Una variante distinta de la primera.', 'Sin fuentes decorativas (Comic Sans, Brush Script, Impact, Courier).', 'El título de cada diapositiva más grande que su texto.'],
      },
      notaWeb: 'En PowerPoint para la web los temas están en Diseño › Temas y «Restablecer» no existe: usa Inicio › Borrar formato.',
      pruebas: [
        { titulo: 'Tema aplicado', fn: (P) => (P.tema.nombre && !/office/i.test(P.tema.nombre) ? true : 'Aplica un tema distinto del Tema de Office (Diseño › Temas).') },
        { titulo: 'Máximo dos fuentes', fn: (P, A) => { const f = A.fuentes(P); return f.length <= 2 ? true : 'Usas ' + f.length + ' fuentes (' + f.join(', ') + '). Deja dos: usa Inicio › Restablecer o Ctrl+Espacio para volver a las del tema.'; } },
        { titulo: 'Títulos de 32 pt o más', fn: (P, A) => { const d = P.diapositivas.find((x) => (A.tamTitulo(x) || 99) < 32); return d ? 'El título de la diapositiva ' + d.n + ' mide ' + A.tamTitulo(d) + ' pt.' : true; } },
        { titulo: 'Texto de 20 pt o más', fn: (P, A) => { const d = P.diapositivas.find((x) => (A.tamCuerpo(x) || 99) < 20); return d ? 'En la diapositiva ' + d.n + ' hay texto de ' + A.tamCuerpo(d) + ' pt (si PowerPoint lo reduce para que quepa, quita texto).' : true; } },
        { titulo: 'Contraste suficiente', fn: (P, A) => {
          for (const d of P.diapositivas) for (const f of A.textos(d)) {
            if (f.ph && /title/i.test(f.ph.type)) continue;
            const fondo = f.relleno || (d.fondo && d.fondo.color);
            if (!fondo) continue;
            for (const p of f.parrafos) for (const r of p.runs) { if (!r.color || !r.texto.trim()) continue; const c = A.contraste(r.color, fondo); if (c < (r.tam >= 24 ? 3 : 4.5)) return 'En la diapositiva ' + d.n + ' el texto «' + r.texto.slice(0, 25) + '» tiene contraste de ' + c.toFixed(1) + ':1.'; }
          }
          return true;
        } },
        { titulo: 'Máximo 6 viñetas por diapositiva', fn: (P, A) => { const d = P.diapositivas.find((x) => A.vinetas(x) > 6); return d ? 'La diapositiva ' + d.n + ' tiene ' + A.vinetas(d) + ' líneas de texto: deja 6 o menos.' : true; } },
        { titulo: 'Variante distinta de la primera', nivel: 'experto', fn: (P, A) => { const v = A.varianteCambiada(P); return v === false ? 'Elige una variante distinta de la primera (Diseño › Variantes).' : true; } },
        { titulo: 'Sin fuentes decorativas', nivel: 'experto', fn: (P, A) => { const f = A.fuentes(P).filter((x) => DECORATIVAS.includes(x)); return f.length ? 'Cambia ' + f.join(', ') + ' por una fuente legible.' : true; } },
        { titulo: 'Título más grande que el texto', nivel: 'experto', fn: (P, A) => { const d = P.diapositivas.find((x) => A.tamTitulo(x) && A.tamCuerpo(x) && A.tamCuerpo(x) >= A.tamTitulo(x)); return d ? 'En la diapositiva ' + d.n + ' el texto es igual o más grande que el título.' : true; } },
      ],
    },
    donde: [
      { comando: 'Temas', ruta: ['Diseño', 'Temas'] },
      { comando: 'Variantes › Colores', ruta: ['Diseño', 'Variantes', 'Colores'], nota: 'La flecha «Más» de Variantes muestra Colores, Fuentes, Efectos y Estilos de fondo.' },
      { comando: 'Restablecer el formato de la diapositiva', ruta: ['Inicio', 'Restablecer'] },
      { comando: 'Borrar formato del texto', ruta: ['Inicio', 'Borrar formato'], nota: 'Atajo: Ctrl+Espacio.' },
      { comando: 'Comprobar accesibilidad (contraste)', ruta: ['Revisar', 'Comprobar accesibilidad'] },
    ],
    glosario: [
      ['Tema', 'Theme', 'Conjunto de colores, fuentes, efectos y fondos que se aplica a toda la presentación.'],
      ['Variante', 'Variant', 'Otra combinación de colores o fondo del mismo tema.'],
      ['Jerarquía visual', 'Visual hierarchy', 'Orden en que el ojo recorre la diapositiva según tamaño, peso, color y posición.'],
      ['Contraste', 'Contrast ratio', 'Diferencia de luminosidad entre texto y fondo (de 1:1 a 21:1). Mínimo 4.5:1 para texto normal.'],
      ['Fuente sin remates', 'Sans serif', 'Tipo de letra sin terminaciones (Calibri, Segoe UI, Aptos): se lee mejor en pantalla.'],
    ],
    atajos: ['<kbd>Ctrl+Espacio</kbd> quita el formato de caracteres puesto a mano.', '<kbd>Ctrl+Mayús+&gt;</kbd> / <kbd>Ctrl+Mayús+&lt;</kbd> aumentan o disminuyen el tamaño de fuente.', '<kbd>Ctrl+N</kbd> negrita, <kbd>Ctrl+K</kbd> cursiva y <kbd>Ctrl+S</kbd> subrayado (PowerPoint en español).'],
  });
})();

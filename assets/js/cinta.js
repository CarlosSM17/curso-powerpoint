/* Cinta de opciones de PowerPoint (Microsoft 365, en español) para la actividad «¿Dónde está?».
   El participante hace clic en la pestaña y el botón donde se encuentra un comando. */
(function () {
  'use strict';
  const LT = window.LT;
  const { h } = LT.u;

  // pestaña -> [[grupo, [comando | [comando, [submenú…]], …]], …]   (PowerPoint de Microsoft 365, en español)
  const CINTA = {
    'Archivo': [
      ['Archivo', ['Nuevo', 'Abrir', ['Información', ['Proteger presentación', 'Comprobar si hay problemas', 'Propiedades']], ['Guardar como', ['Presentación de PowerPoint (*.pptx)', 'Presentación con diapositivas de PowerPoint (*.ppsx)', 'PDF (*.pdf)', 'Video MPEG-4 (*.mp4)']], 'Imprimir', 'Compartir', ['Exportar', ['Crear un documento PDF/XPS', 'Crear un video', 'Empaquetar presentación para CD', 'Crear documentos']], 'Opciones']],
    ],
    'Inicio': [
      ['Portapapeles', [['Pegar', ['Usar tema de destino', 'Mantener formato de origen', 'Imagen', 'Mantener solo texto']], 'Cortar', 'Copiar', 'Copiar formato']],
      ['Diapositivas', [['Nueva diapositiva', ['Diapositiva de título', 'Título y objetos', 'Encabezado de sección', 'Dos objetos', 'Comparación', 'Solo el título', 'En blanco', 'Duplicar diapositivas seleccionadas']], ['Diseño', ['Diapositiva de título', 'Título y objetos', 'Encabezado de sección', 'Dos objetos', 'Comparación', 'Solo el título', 'En blanco']], 'Restablecer', ['Sección', ['Agregar sección', 'Cambiar nombre de sección', 'Quitar sección', 'Contraer todo', 'Expandir todo']]]],
      ['Fuente', ['Fuente', 'Tamaño de fuente', 'Aumentar tamaño de fuente', 'Disminuir tamaño de fuente', 'Negrita', 'Cursiva', 'Subrayado', 'Color de fuente', 'Borrar formato']],
      ['Párrafo', ['Viñetas', 'Numeración', 'Alinear a la izquierda', 'Centrar', 'Alinear a la derecha', 'Interlineado', 'Convertir a SmartArt']],
      ['Dibujo', ['Formas', ['Organizar', ['Traer al frente', 'Enviar al fondo', 'Traer adelante', 'Enviar atrás', 'Agrupar', 'Alinear', 'Panel de selección']], 'Estilos rápidos', 'Relleno de forma', 'Contorno de forma', 'Efectos de forma']],
      ['Edición', ['Buscar', 'Reemplazar', 'Seleccionar']],
      ['Diseñador', ['Diseñador']],
    ],
    'Insertar': [
      ['Diapositivas', ['Nueva diapositiva']],
      ['Tablas', ['Tabla']],
      ['Imágenes', [['Imágenes', ['Este dispositivo…', 'Imágenes de archivo…', 'Imágenes en línea…']], 'Captura', 'Álbum de fotografías']],
      ['Ilustraciones', ['Formas', 'Iconos', 'Modelos 3D', 'SmartArt', 'Gráfico']],
      ['Vínculos', ['Vista general', 'Vínculo', 'Acción']],
      ['Comentarios', ['Comentario']],
      ['Texto', ['Cuadro de texto', 'Encabezado y pie de página', 'WordArt']],
      ['Símbolos', ['Ecuación', 'Símbolo']],
      ['Multimedia', [['Video', ['Este dispositivo…', 'Videos de archivo…', 'Videos en línea…']], ['Audio', ['Audio en Mi PC…', 'Grabar audio…']], 'Grabación de pantalla']],
    ],
    'Diseño': [
      ['Temas', ['Temas']],
      ['Variantes', [['Variantes', ['Colores', 'Fuentes', 'Efectos', 'Estilos de fondo']]]],
      ['Personalizar', ['Tamaño de diapositiva', 'Formato del fondo']],
      ['Editar', ['Sugerencias de diseño']],
    ],
    'Transiciones': [
      ['Vista previa', ['Vista previa']],
      ['Transición a esta diapositiva', ['Galería de transiciones', 'Opciones de efectos']],
      ['Intervalos', ['Sonido', 'Duración', 'Aplicar a todas', 'Al hacer clic con el mouse', 'Después de']],
    ],
    'Animaciones': [
      ['Vista previa', ['Vista previa']],
      ['Animación', ['Galería de animaciones', 'Opciones de efectos']],
      ['Animación avanzada', [['Agregar animación', ['Entrada', 'Énfasis', 'Salida', 'Trayectorias de la animación', 'Más trayectorias de la animación…']], 'Panel de animación', 'Desencadenar', 'Copiar animación']],
      ['Intervalos', ['Inicio', 'Duración', 'Retraso', 'Mover antes', 'Mover después']],
    ],
    'Presentación con diapositivas': [
      ['Iniciar presentación con diapositivas', ['Desde el principio', 'Desde la diapositiva actual', 'Presentar en línea', 'Presentación personalizada']],
      ['Configurar', ['Configuración de la presentación con diapositivas', 'Ocultar diapositiva', 'Ensayar intervalos', 'Grabar', 'Reproducir narraciones', 'Usar intervalos', 'Mostrar controles multimedia']],
      ['Subtítulos', ['Configuración de subtítulos']],
      ['Monitores', ['Monitor', 'Usar vista del moderador']],
    ],
    'Revisar': [
      ['Revisión', ['Ortografía', 'Sinónimos']],
      ['Accesibilidad', ['Comprobar accesibilidad']],
      ['Idioma', ['Traducir', 'Idioma']],
      ['Comentarios', ['Nuevo comentario', 'Mostrar comentarios']],
      ['Comparar', ['Comparar']],
    ],
    'Vista': [
      ['Vistas de presentación', ['Normal', 'Vista Esquema', 'Clasificador de diapositivas', 'Página de notas', 'Vista Lectura']],
      ['Vistas maestras', ['Patrón de diapositivas', 'Patrón de documentos', 'Patrón de notas']],
      ['Mostrar', ['Regla', 'Líneas de la cuadrícula', 'Guías', 'Notas']],
      ['Zoom', ['Zoom', 'Ajustar a la ventana']],
    ],
    'Formato de imagen': [
      ['Ajustar', ['Quitar fondo', 'Correcciones', 'Color', 'Comprimir imágenes', 'Restablecer imagen']],
      ['Estilos de imagen', ['Estilos rápidos', 'Borde de imagen', 'Efectos de imagen']],
      ['Accesibilidad', ['Texto alternativo']],
      ['Organizar', ['Traer adelante', 'Enviar atrás', 'Panel de selección', 'Alinear', 'Agrupar']],
      ['Tamaño', [['Recortar', ['Recortar', 'Recortar en la forma', 'Relación de aspecto', 'Rellenar', 'Ajustar']], 'Alto', 'Ancho']],
    ],
    'Formato de gráficos': [
      ['Cambiar', ['Cambiar gráfico', 'Convertir en forma']],
      ['Estilos de gráficos', ['Relleno de gráficos', 'Contorno de gráficos', 'Efectos de gráficos']],
      ['Accesibilidad', ['Texto alternativo']],
      ['Organizar', ['Traer adelante', 'Enviar atrás', 'Panel de selección', ['Alinear', ['Alinear a la izquierda', 'Alinear verticalmente', 'Alinear a la derecha', 'Alinear en la parte superior', 'Alinear al medio', 'Alinear en la parte inferior', 'Distribuir horizontalmente', 'Distribuir verticalmente', 'Alinear con la diapositiva', 'Alinear objetos seleccionados']], 'Agrupar', 'Girar']],
      ['Tamaño', ['Recortar', 'Alto', 'Ancho']],
    ],
    'Formato de forma': [
      ['Insertar formas', ['Formas', 'Editar forma', 'Cuadro de texto']],
      ['Estilos de forma', ['Estilos rápidos', 'Relleno de forma', 'Contorno de forma', 'Efectos de forma']],
      ['Accesibilidad', ['Texto alternativo']],
      ['Organizar', ['Traer adelante', 'Enviar atrás', 'Panel de selección', ['Alinear', ['Alinear a la izquierda', 'Alinear verticalmente', 'Alinear a la derecha', 'Alinear en la parte superior', 'Alinear al medio', 'Alinear en la parte inferior', 'Distribuir horizontalmente', 'Distribuir verticalmente', 'Alinear con la diapositiva', 'Alinear objetos seleccionados']], 'Agrupar', 'Girar']],
      ['Tamaño', ['Alto', 'Ancho']],
    ],
    'Diseño de SmartArt': [
      ['Crear gráfico', ['Agregar forma', 'Agregar viñeta', 'Panel de texto', 'Promover', 'Disminuir nivel']],
      ['Diseños', ['Diseños']],
      ['Estilos SmartArt', ['Cambiar colores', 'Estilos SmartArt']],
      ['Restablecer', ['Restablecer gráfico', 'Convertir']],
    ],
    'Diseño de tabla': [
      ['Opciones de estilo de tabla', ['Fila de encabezado', 'Fila de totales', 'Filas con bandas', 'Primera columna']],
      ['Estilos de tabla', ['Estilos de tabla', 'Sombreado', 'Bordes']],
    ],
    'Diseño de gráfico': [
      ['Diseños de gráfico', [['Agregar elemento de gráfico', ['Títulos de ejes', 'Título del gráfico', 'Etiquetas de datos', 'Leyenda', 'Líneas de la cuadrícula']], 'Diseño rápido']],
      ['Estilos de diseño', ['Cambiar colores', 'Estilos de diseño']],
      ['Datos', ['Cambiar entre filas y columnas', 'Seleccionar datos', 'Editar datos']],
      ['Tipo', ['Cambiar tipo de gráfico']],
    ],
    'Reproducción': [
      ['Vista previa', ['Reproducir']],
      ['Marcadores', ['Agregar marcador']],
      ['Edición', ['Recortar video', 'Recortar audio', 'Fundido']],
      ['Opciones de video', ['Volumen', 'Inicio', 'Reproducir a pantalla completa', 'Ocultar con la reproducción detenida', 'Repetir la reproducción hasta su interrupción', 'Rebobinar después de la reproducción']],
      ['Opciones de audio', ['Reproducir en todas las diapositivas', 'Ocultar durante presentación']],
      ['Estilos de audio', ['Ningún estilo', 'Reproducir en el fondo']],
      ['Subtítulos', ['Insertar subtítulos']],
    ],
  };
  const CONTEXTUALES = ['Formato de imagen', 'Formato de gráficos', 'Formato de forma', 'Diseño de SmartArt', 'Diseño de tabla', 'Diseño de gráfico', 'Reproducción'];
  const ICONOS = {
    'Pegar': 'pegar', 'Cortar': 'cortar', 'Copiar': 'copiar', 'Copiar formato': 'brocha', 'Nueva diapositiva': 'nuevaDiapo', 'Diseño': 'diseno', 'Restablecer': 'reiniciar', 'Sección': 'seccion',
    'Fuente': 'fuente', 'Color de fuente': 'fuente', 'Alinear a la izquierda': 'alIzq', 'Centrar': 'alCen', 'Alinear a la derecha': 'alDer', 'Convertir a SmartArt': 'smartart',
    'Formas': 'forma', 'Organizar': 'ordenar', 'Relleno de forma': 'relleno', 'Contorno de forma': 'bordes', 'Buscar': 'buscar', 'Reemplazar': 'reemplazar', 'Diseñador': 'pista',
    'Tabla': 'tablaIns', 'Imágenes': 'imagen', 'Iconos': 'icono', 'SmartArt': 'smartart', 'Gráfico': 'grafico', 'Vínculo': 'vinculo', 'Acción': 'vinculo', 'Zoom': 'buscar',
    'Comentario': 'comentario', 'Cuadro de texto': 'cuadroTexto', 'Video': 'video', 'Audio': 'audio', 'Grabación de pantalla': 'grabar', 'Temas': 'estilos', 'Variantes': 'condicional', 'Formato del fondo': 'relleno',
    'Vista previa': 'ojo', 'Galería de transiciones': 'transicion', 'Opciones de efectos': 'estilos', 'Aplicar a todas': 'copiar', 'Duración': 'reloj', 'Después de': 'reloj', 'Al hacer clic con el mouse': 'check',
    'Galería de animaciones': 'animacion', 'Agregar animación': 'animacion', 'Panel de animación': 'panelAnim', 'Inicio': 'reloj', 'Retraso': 'reloj', 'Mover antes': 'flecha', 'Mover después': 'flecha',
    'Desde el principio': 'play', 'Desde la diapositiva actual': 'playActual', 'Configuración de la presentación con diapositivas': 'configurar', 'Ocultar diapositiva': 'ocultar', 'Ensayar intervalos': 'ensayar', 'Usar intervalos': 'check', 'Usar vista del moderador': 'check', 'Grabar': 'grabar',
    'Comprobar accesibilidad': 'accesibilidad', 'Normal': 'normal', 'Clasificador de diapositivas': 'clasificador', 'Página de notas': 'nota', 'Notas': 'nota', 'Patrón de diapositivas': 'diseno',
    'Texto alternativo': 'accesibilidad', 'Recortar': 'cortar', 'Alinear': 'alCen', 'Panel de selección': 'menu', 'Agrupar': 'condicional', 'Panel de texto': 'cuadroTexto', 'Agregar forma': 'forma', 'Cambiar colores': 'relleno',
    'Agregar elemento de gráfico': 'grafico', 'Cambiar tipo de gráfico': 'grafico', 'Editar datos': 'tablaDatos', 'Reproducir': 'play', 'Reproducir en el fondo': 'audio',
  };

  /* preguntas: [{comando, ruta:[pestaña, botón, (submenú)], nota}] */
  function DondeEsta(cont, preguntas, alTerminar) {
    let idx = 0, fallos = 0, ruta = [];
    let pestana = 'Inicio';
    const enunciado = h('div', { class: 'donde-pregunta' });
    const cinta = h('div', { class: 'cinta', style: { position: 'relative' } });
    const retro = h('div', { class: 'retro', 'aria-live': 'polite' });
    cont.innerHTML = '';
    cont.append(enunciado, cinta, retro);

    const actual = () => preguntas[idx];
    function dibujarEnunciado() {
      enunciado.innerHTML = '';
      if (idx >= preguntas.length) {
        enunciado.appendChild(h('span', { class: 'q' }, '¡Listo! Ubicaste todos los comandos.'));
        return;
      }
      enunciado.append(h('span', { class: 'q' }, '¿Dónde está «' + actual().comando + '»?'), h('span', { class: 'donde-progreso' }, (idx + 1) + ' de ' + preguntas.length));
    }
    function dibujarCinta() {
      cinta.innerHTML = '';
      const pest = h('div', { class: 'cinta-pest', role: 'tablist' });
      const visibles = Object.keys(CINTA).filter((p) => !CONTEXTUALES.includes(p) || preguntas.some((q) => q.ruta[0] === p) || p === pestana);
      for (const p of visibles) {
        pest.appendChild(h('button', { class: p === pestana ? 'activa' : '', role: 'tab', 'aria-selected': p === pestana ? 'true' : 'false', title: CONTEXTUALES.includes(p) ? 'Pestaña contextual: aparece al seleccionar el objeto' : p, onclick: () => { pestana = p; ruta = [p]; dibujarCinta(); } }, p));
      }
      const cuerpo = h('div', { class: 'cinta-cuerpo' });
      for (const [grupo, cmds] of CINTA[pestana]) {
        const g = h('div', { class: 'cinta-grupo' });
        const lista = h('div', { class: 'cmds' });
        for (const cmd of cmds) {
          const nombre = Array.isArray(cmd) ? cmd[0] : cmd;
          const sub = Array.isArray(cmd) ? cmd[1] : null;
          const b = h('button', { class: 'cinta-cmd', title: nombre }, h('span', { class: 'ico', html: LT.iconoSVG(ICONOS[nombre] || 'hoja', 20) }), nombre + (sub ? ' ▾' : ''));
          b.addEventListener('click', (e) => elegir(pestana, nombre, sub, b, e));
          lista.appendChild(b);
        }
        g.append(lista, h('div', { class: 'nombre-grupo' }, grupo));
        cuerpo.appendChild(g);
      }
      cinta.append(pest, cuerpo);
    }
    function cerrarSub() { cinta.querySelectorAll('.cinta-sub').forEach((x) => x.remove()); }
    function elegir(p, nombre, sub, boton, e) {
      cerrarSub();
      if (idx >= preguntas.length) return;
      const q = actual();
      if (sub && q.ruta.length > 2) {
        // el comando buscado está dentro de un menú desplegable
        const menu = h('div', { class: 'cinta-sub' });
        const r = boton.getBoundingClientRect(), rc = cinta.getBoundingClientRect();
        menu.style.left = r.left - rc.left + 'px';
        menu.style.top = r.bottom - rc.top + 'px';
        for (const s of sub) menu.appendChild(h('button', { onclick: () => { cerrarSub(); comprobar([p, nombre, s], boton); } }, s));
        cinta.appendChild(menu);
        return;
      }
      comprobar([p, nombre], boton);
    }
    function comprobar(elegida, boton) {
      const q = actual();
      const ok = q.ruta.length === elegida.length && q.ruta.every((x, i) => x === elegida[i]);
      boton.classList.add(ok ? 'correcto' : 'incorrecto');
      setTimeout(() => boton.classList.remove('correcto', 'incorrecto'), 900);
      retro.innerHTML = '';
      if (ok) {
        retro.appendChild(h('div', { class: 'aviso-caja ok' }, '✓ Correcto: ', h('span', { class: 'donde-ruta', html: rutaHTML(q.ruta) }), q.nota ? h('div', { style: { marginTop: '4px', fontSize: '.86rem' } }, q.nota) : null));
        idx++; fallos = 0;
        dibujarEnunciado();
        if (idx >= preguntas.length && alTerminar) alTerminar();
      } else {
        fallos++;
        const pista = fallos >= 2 ? ' Pista: está en la pestaña «' + q.ruta[0] + '»' + (fallos >= 3 ? ', grupo de «' + grupoDe(q.ruta[0], q.ruta[1]) + '».' : '.') : ' Intenta de nuevo.';
        retro.appendChild(h('div', { class: 'aviso-caja alerta' }, 'Ese es «' + elegida[elegida.length - 1] + '» (' + elegida[0] + ').' + pista));
      }
    }
    dibujarEnunciado();
    dibujarCinta();
    return { reiniciar: () => { idx = 0; fallos = 0; dibujarEnunciado(); retro.innerHTML = ''; } };
  }
  function grupoDe(p, cmd) {
    for (const [g, cmds] of CINTA[p] || []) if (cmds.some((c) => (Array.isArray(c) ? c[0] : c) === cmd)) return g;
    return '';
  }
  function rutaHTML(ruta) {
    return ruta.map((x) => '<span>' + LT.u.esc(x) + '</span>').join('<i>›</i>');
  }
  function existeRuta(ruta) {
    const grupos = CINTA[ruta[0]];
    if (!grupos) return false;
    for (const [, cmds] of grupos) for (const c of cmds) {
      const n = Array.isArray(c) ? c[0] : c;
      if (n === ruta[1]) return ruta.length < 3 || (Array.isArray(c) && c[1].includes(ruta[2]));
    }
    return false;
  }

  LT.DondeEsta = DondeEsta;
  LT.cinta = { CINTA, rutaHTML, existeRuta, grupoDe };
})();

/* Catálogos del simulador de PowerPoint (LT.Diapo): temas y variantes, diseños de diapositiva,
   transiciones, animaciones, SmartArt, formas, iconos e ilustraciones del caso Clínica Vida Sana.
   Las diapositivas miden 960 × 540 unidades (1 unidad = 1 punto, como en PowerPoint 16:9). */
(function () {
  'use strict';
  const LT = (window.LT = window.LT || {});
  const ANCHO = 960, ALTO = 540;

  /* ------------------------------------------------------------------ temas */
  // Cada variante: fondo, texto, titulo, texto2 (secundario) y acentos (6). deco(v, diseno) -> adornos.
  const TEMAS = [
    {
      id: 'office', nombre: 'Tema de Office', fuentes: { titulo: 'Calibri Light', cuerpo: 'Calibri' },
      variantes: [
        { nombre: 'Blanco', fondo: '#ffffff', texto: '#262626', titulo: '#262626', texto2: '#595959', acentos: ['#156082', '#e97132', '#196b24', '#0f9ed5', '#a02b93', '#4ea72e'] },
        { nombre: 'Gris claro', fondo: '#f2f2f2', texto: '#262626', titulo: '#156082', texto2: '#595959', acentos: ['#156082', '#e97132', '#196b24', '#0f9ed5', '#a02b93', '#4ea72e'] },
        { nombre: 'Azul pálido', fondo: '#eaf1f8', texto: '#1f2d3a', titulo: '#0e4a6b', texto2: '#4a5d6e', acentos: ['#156082', '#e97132', '#196b24', '#0f9ed5', '#a02b93', '#4ea72e'] },
        { nombre: 'Oscuro', fondo: '#262626', texto: '#f2f2f2', titulo: '#ffffff', texto2: '#bfbfbf', acentos: ['#4ea8de', '#f19a5c', '#5cc46b', '#47c1f1', '#d77fd0', '#8fd16a'], oscuro: true },
      ],
      deco: () => [],
    },
    {
      id: 'clinico', nombre: 'Clínico', fuentes: { titulo: 'Segoe UI Semibold', cuerpo: 'Segoe UI' },
      variantes: [
        { nombre: 'Azul clínico', fondo: '#ffffff', texto: '#1f2d3d', titulo: '#0b3d66', texto2: '#51606f', acentos: ['#1565c0', '#00897b', '#f9a825', '#c62828', '#6a1b9a', '#546e7a'] },
        { nombre: 'Verde agua', fondo: '#ffffff', texto: '#1d2f2c', titulo: '#00695c', texto2: '#4f625f', acentos: ['#00897b', '#1565c0', '#ef6c00', '#ad1457', '#558b2f', '#5d4037'] },
        { nombre: 'Coral', fondo: '#fffaf8', texto: '#2d1f1b', titulo: '#a8321f', texto2: '#6a5650', acentos: ['#c8462c', '#00796b', '#f2a900', '#3949ab', '#8e244d', '#5d6d7e'] },
        { nombre: 'Grafito', fondo: '#1d2733', texto: '#e8eef4', titulo: '#ffffff', texto2: '#a9b7c6', acentos: ['#4fc3f7', '#4db6ac', '#ffd54f', '#ff8a65', '#ce93d8', '#aed581'], oscuro: true },
      ],
      deco: (v, d) => d === 'titulo' || d === 'seccion'
        ? [{ x: 0, y: 400, w: 960, h: 140, color: v.acentos[0] }, { x: 0, y: 392, w: 960, h: 8, color: v.acentos[1] }]
        : [{ x: 0, y: 0, w: 18, h: 540, color: v.acentos[0] }, { x: 18, y: 0, w: 5, h: 540, color: v.acentos[1] }],
    },
    {
      id: 'vital', nombre: 'Vital', fuentes: { titulo: 'Georgia', cuerpo: 'Segoe UI' },
      variantes: [
        { nombre: 'Terracota', fondo: '#fffaf3', texto: '#3b2a20', titulo: '#7a2e14', texto2: '#6e5a4d', acentos: ['#c43e1c', '#f0a202', '#2e7d6b', '#5b6abf', '#9c3d6b', '#7a8a2e'] },
        { nombre: 'Oliva', fondo: '#fbfbf3', texto: '#2f3320', titulo: '#4a5a12', texto2: '#5e6450', acentos: ['#6b8e23', '#d98e04', '#2e6f8e', '#b5442b', '#7b4f9e', '#8a6d3b'] },
        { nombre: 'Ciruela', fondo: '#fcf8fb', texto: '#33202e', titulo: '#6b1f5a', texto2: '#6a5464', acentos: ['#8e3a8f', '#e0812b', '#2b7a78', '#c2344d', '#4b6cb7', '#7d8a2f'] },
        { nombre: 'Noche', fondo: '#2b1e18', texto: '#f6ebe2', titulo: '#ffd9c2', texto2: '#cbb6a7', acentos: ['#ff8a5c', '#ffc94d', '#6fd1b9', '#9fb0ff', '#f28bbd', '#c9d66b'], oscuro: true },
      ],
      deco: (v, d) => d === 'titulo' || d === 'seccion'
        ? [{ x: 700, y: -120, w: 380, h: 380, color: v.acentos[0], forma: 'elipse', opacidad: 0.9 }, { x: 640, y: 170, w: 140, h: 140, color: v.acentos[1], forma: 'elipse', opacidad: 0.85 }]
        : [{ x: 880, y: -40, w: 120, h: 120, color: v.acentos[0], forma: 'elipse', opacidad: 0.9 }, { x: 66, y: 120, w: 90, h: 5, color: v.acentos[1] }],
    },
    {
      id: 'sereno', nombre: 'Sereno', fuentes: { titulo: 'Trebuchet MS', cuerpo: 'Trebuchet MS' },
      variantes: [
        { nombre: 'Cielo', fondo: '#f4f9fd', texto: '#20313f', titulo: '#174a72', texto2: '#55697a', acentos: ['#2f80c0', '#5fb49c', '#f2b134', '#e05d5d', '#8c6bc8', '#7f8c8d'] },
        { nombre: 'Menta', fondo: '#f3fbf7', texto: '#1f3329', titulo: '#1e6b4a', texto2: '#52675c', acentos: ['#2e9e6e', '#3a7cc2', '#f0a33a', '#d6544f', '#8d6cc1', '#6f7f78'] },
        { nombre: 'Lavanda', fondo: '#f8f6fd', texto: '#2b2540', titulo: '#4b3a8c', texto2: '#5f587a', acentos: ['#6f5bd3', '#2fa3a0', '#f0a33a', '#d6546f', '#3a7cc2', '#7d7a8c'] },
        { nombre: 'Arena', fondo: '#fbf7ef', texto: '#33291c', titulo: '#7a5410', texto2: '#6b5d48', acentos: ['#c48a1c', '#2f80c0', '#5fa05a', '#c8503c', '#8c6bc8', '#8a8174'] },
      ],
      deco: (v) => [{ x: 0, y: 500, w: 960, h: 40, color: v.acentos[0], opacidad: 0.9 }, { x: 0, y: 492, w: 960, h: 8, color: v.acentos[1], opacidad: 0.6 }],
    },
    {
      id: 'contraste', nombre: 'Contraste', fuentes: { titulo: 'Segoe UI Black', cuerpo: 'Segoe UI' },
      variantes: [
        { nombre: 'Amarillo', fondo: '#111111', texto: '#f5f5f5', titulo: '#ffffff', texto2: '#c8c8c8', acentos: ['#ffd400', '#36c5f0', '#2eb67d', '#ff6b5e', '#c39bff', '#ffa94d'], oscuro: true },
        { nombre: 'Cian', fondo: '#0d1b2a', texto: '#eef6fb', titulo: '#ffffff', texto2: '#b6c9d6', acentos: ['#36c5f0', '#ffd400', '#2eb67d', '#ff6b5e', '#c39bff', '#ffa94d'], oscuro: true },
        { nombre: 'Claro', fondo: '#ffffff', texto: '#111111', titulo: '#111111', texto2: '#444444', acentos: ['#d62828', '#1d4ed8', '#047857', '#b45309', '#7c3aed', '#0f766e'] },
      ],
      deco: (v, d) => d === 'titulo' || d === 'seccion' ? [{ x: 120, y: 286, w: 160, h: 10, color: v.acentos[0] }] : [{ x: 66, y: 118, w: 120, h: 8, color: v.acentos[0] }],
    },
  ];

  /* ------------------------------------------------------- diseños (layouts) */
  // Marcadores de posición: rol, caja, tamaño de letra predeterminado, alineación y texto de indicación.
  const IND = { titulo: 'Haga clic para agregar título', subtitulo: 'Haga clic para agregar subtítulo', cuerpo: 'Haga clic para agregar texto', texto: 'Haga clic para agregar texto', enc: 'Haga clic para agregar texto' };
  const T = (o) => Object.assign({ ph: 'titulo', x: 66, y: 28, w: 828, h: 96, tam: 40, valign: 'medio' }, o);
  const DISENOS = [
    { id: 'titulo', nombre: 'Diapositiva de título', ooxml: 'title', ph: [T({ x: 120, y: 140, w: 720, h: 140, tam: 54, alinear: 'centro', valign: 'abajo' }), { ph: 'subtitulo', x: 120, y: 292, w: 720, h: 80, tam: 24, alinear: 'centro', valign: 'arriba', color: 'texto2' }] },
    { id: 'tituloObjetos', nombre: 'Título y objetos', ooxml: 'obj', ph: [T(), { ph: 'cuerpo', x: 66, y: 140, w: 828, h: 350, tam: 24, vinetas: true }] },
    { id: 'seccion', nombre: 'Encabezado de sección', ooxml: 'secHead', ph: [T({ y: 150, h: 150, tam: 50, valign: 'abajo' }), { ph: 'texto', x: 66, y: 306, w: 828, h: 70, tam: 22, color: 'texto2' }] },
    { id: 'dosObjetos', nombre: 'Dos objetos', ooxml: 'twoObj', ph: [T(), { ph: 'cuerpo', x: 66, y: 140, w: 405, h: 350, tam: 24, vinetas: true }, { ph: 'cuerpo2', x: 489, y: 140, w: 405, h: 350, tam: 24, vinetas: true }] },
    { id: 'comparacion', nombre: 'Comparación', ooxml: 'twoTxTwoObj', ph: [T(), { ph: 'enc1', x: 66, y: 132, w: 405, h: 52, tam: 24, negrita: true, valign: 'abajo' }, { ph: 'cuerpo', x: 66, y: 190, w: 405, h: 300, tam: 20, vinetas: true }, { ph: 'enc2', x: 489, y: 132, w: 405, h: 52, tam: 24, negrita: true, valign: 'abajo' }, { ph: 'cuerpo2', x: 489, y: 190, w: 405, h: 300, tam: 20, vinetas: true }] },
    { id: 'soloTitulo', nombre: 'Solo el título', ooxml: 'titleOnly', ph: [T()] },
    { id: 'blanco', nombre: 'En blanco', ooxml: 'blank', ph: [] },
    { id: 'contenidoTitulo', nombre: 'Contenido con título', ooxml: 'objTx', ph: [T({ x: 66, y: 36, w: 320, h: 120, tam: 30, valign: 'abajo' }), { ph: 'cuerpo', x: 410, y: 36, w: 484, h: 460, tam: 24, vinetas: true }, { ph: 'texto', x: 66, y: 164, w: 320, h: 330, tam: 16 }] },
  ];
  const ROL_TXT = { titulo: 'Título', subtitulo: 'Subtítulo', cuerpo: 'Marcador de contenido', cuerpo2: 'Marcador de contenido', texto: 'Marcador de texto', enc1: 'Marcador de texto', enc2: 'Marcador de texto' };

  /* ------------------------------------------------------------ transiciones */
  const DIR4 = ['Desde la derecha', 'Desde abajo', 'Desde la izquierda', 'Desde arriba'];
  const TRANSICIONES = [
    { id: 'ninguna', nombre: 'Ninguna', grupo: 'Sutil', dur: 0 },
    { id: 'transformacion', nombre: 'Transformación', grupo: 'Sutil', dur: 2, opciones: ['Objetos', 'Palabras', 'Caracteres'] },
    { id: 'desvanecer', nombre: 'Desvanecer', grupo: 'Sutil', dur: 0.7, opciones: ['Suavemente', 'A través de negro'] },
    { id: 'empujar', nombre: 'Empuje', grupo: 'Sutil', dur: 1, opciones: ['Desde abajo', 'Desde la izquierda', 'Desde la derecha', 'Desde arriba'] },
    { id: 'barrido', nombre: 'Barrido', grupo: 'Sutil', dur: 1, opciones: DIR4 },
    { id: 'dividir', nombre: 'Dividir', grupo: 'Sutil', dur: 1.5, opciones: ['Salida vertical', 'Entrada vertical', 'Salida horizontal', 'Entrada horizontal'] },
    { id: 'revelar', nombre: 'Mostrar', grupo: 'Sutil', dur: 1.6, opciones: ['Suavemente desde la derecha', 'Suavemente desde la izquierda'] },
    { id: 'cortar', nombre: 'Corte', grupo: 'Sutil', dur: 0.1, opciones: ['Sin negro', 'A través de negro'] },
    { id: 'forma', nombre: 'Forma', grupo: 'Sutil', dur: 1.5, opciones: ['Círculo', 'Rombo', 'Más'] },
    { id: 'descubrir', nombre: 'Revelar', grupo: 'Sutil', dur: 1, opciones: DIR4 },
    { id: 'cubrir', nombre: 'Cubrir', grupo: 'Sutil', dur: 1, opciones: DIR4 },
    { id: 'cortinas', nombre: 'Cortinas', grupo: 'Llamativo', dur: 2.75 },
    { id: 'voltear', nombre: 'Voltear', grupo: 'Llamativo', dur: 1.25, opciones: ['Derecha', 'Izquierda'] },
    { id: 'galeria', nombre: 'Galería', grupo: 'Llamativo', dur: 1.6, opciones: ['Desde la derecha', 'Desde la izquierda'] },
    { id: 'cubo', nombre: 'Cubo', grupo: 'Llamativo', dur: 1.25, opciones: DIR4 },
    { id: 'zoom', nombre: 'Zoom', grupo: 'Llamativo', dur: 1, opciones: ['Hacia dentro', 'Hacia fuera'] },
    { id: 'vortice', nombre: 'Vórtice', grupo: 'Llamativo', dur: 3, opciones: DIR4 },
  ];
  const SONIDOS = ['[Sin sonido]', 'Aplauso', 'Campana', 'Redoble', 'Viento'];

  /* -------------------------------------------------------------- animaciones */
  const CAT = { entrada: 'Entrada', enfasis: 'Énfasis', salida: 'Salida', trayectoria: 'Trayectorias de la animación' };
  const COLOR_CAT = { entrada: '#2e8540', enfasis: '#c9a100', salida: '#c0392b', trayectoria: '#5d6d7e' };
  const ANIMACIONES = [
    { id: 'aparecer', nombre: 'Aparecer', cat: 'entrada', dur: 0 },
    { id: 'desvanecer', nombre: 'Desvanecer', cat: 'entrada', dur: 0.5 },
    { id: 'desplazar', nombre: 'Desplazar hacia arriba', cat: 'entrada', dur: 0.5, opciones: ['Desde abajo', 'Desde la izquierda', 'Desde la derecha', 'Desde arriba'] },
    { id: 'flotar', nombre: 'Flotar hacia dentro', cat: 'entrada', dur: 1, opciones: ['Flotar hacia arriba', 'Flotar hacia abajo'] },
    { id: 'dividir', nombre: 'Dividir', cat: 'entrada', dur: 0.5, opciones: ['Entrada horizontal', 'Entrada vertical'] },
    { id: 'barrido', nombre: 'Barrido', cat: 'entrada', dur: 0.5, opciones: ['Desde abajo', 'Desde la izquierda', 'Desde la derecha', 'Desde arriba'] },
    { id: 'zoom', nombre: 'Zoom', cat: 'entrada', dur: 0.5 },
    { id: 'crecer', nombre: 'Aumentar y girar', cat: 'entrada', dur: 0.5 },
    { id: 'rebote', nombre: 'Rebote', cat: 'entrada', dur: 2 },
    { id: 'impulso', nombre: 'Impulso', cat: 'enfasis', dur: 0.5 },
    { id: 'pulsoColor', nombre: 'Pulso de color', cat: 'enfasis', dur: 0.5 },
    { id: 'balancin', nombre: 'Balancín', cat: 'enfasis', dur: 1 },
    { id: 'girar', nombre: 'Girar', cat: 'enfasis', dur: 2 },
    { id: 'aumentar', nombre: 'Aumentar o reducir', cat: 'enfasis', dur: 2 },
    { id: 'transparencia', nombre: 'Transparencia', cat: 'enfasis', dur: 2 },
    { id: 'desaparecer', nombre: 'Desaparecer', cat: 'salida', dur: 0 },
    { id: 'desvanecerSalida', nombre: 'Desvanecer', cat: 'salida', dur: 0.5 },
    { id: 'desplazarSalida', nombre: 'Desplazar hacia abajo', cat: 'salida', dur: 0.5, opciones: ['Hacia abajo', 'Hacia la izquierda', 'Hacia la derecha', 'Hacia arriba'] },
    { id: 'flotarSalida', nombre: 'Flotar hacia fuera', cat: 'salida', dur: 1 },
    { id: 'zoomSalida', nombre: 'Zoom', cat: 'salida', dur: 0.5 },
    { id: 'reducir', nombre: 'Reducir y girar', cat: 'salida', dur: 0.5 },
    { id: 'lineas', nombre: 'Líneas', cat: 'trayectoria', dur: 2, opciones: ['Abajo', 'Izquierda', 'Derecha', 'Arriba'] },
    { id: 'arcos', nombre: 'Arcos', cat: 'trayectoria', dur: 2, opciones: ['Abajo', 'Izquierda', 'Derecha', 'Arriba'] },
    { id: 'giros', nombre: 'Giros', cat: 'trayectoria', dur: 2, opciones: ['Abajo derecha', 'Abajo izquierda', 'Arriba derecha', 'Arriba izquierda'] },
    { id: 'formas', nombre: 'Formas', cat: 'trayectoria', dur: 2, opciones: ['Círculo', 'Rombo', 'Triángulo'] },
    { id: 'bucles', nombre: 'Bucles', cat: 'trayectoria', dur: 2 },
  ];
  const INICIOS = [['clic', 'Al hacer clic'], ['con', 'Con la anterior'], ['despues', 'Después de la anterior']];

  /* Trayectoria predeterminada: puntos relativos al centro del objeto, en unidades de diapositiva */
  function trayectoriaInicial(efecto, opcion) {
    const L = 160;
    const dir = { Abajo: [0, 1], Arriba: [0, -1], Izquierda: [-1, 0], Derecha: [1, 0] }[opcion || 'Abajo'] || [0, 1];
    if (efecto === 'lineas') return { tipo: 'linea', dx: dir[0] * L, dy: dir[1] * L };
    if (efecto === 'arcos') return { tipo: 'arco', dx: dir[0] * L || L * 0.9, dy: dir[1] * L || 0, curva: 0.5 };
    if (efecto === 'giros') { const s = /izquierda/i.test(opcion || '') ? -1 : 1, v = /Arriba/.test(opcion || '') ? -1 : 1; return { tipo: 'giro', dx: s * L * 0.8, dy: v * L * 0.8 }; }
    if (efecto === 'formas') return { tipo: 'circulo', dx: 0, dy: 0, radio: 70, forma: opcion || 'Círculo' };
    return { tipo: 'bucle', dx: L, dy: 0, radio: 50 };
  }
  /* Puntos (n+1) de una trayectoria, relativos al punto de partida */
  function puntosTrayectoria(t, n) {
    n = n || 40;
    const out = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      let x = 0, y = 0;
      if (t.tipo === 'linea') { x = t.dx * u; y = t.dy * u; }
      else if (t.tipo === 'arco') { const cx = t.dx / 2 - t.dy * (t.curva || 0.5), cy = t.dy / 2 + t.dx * (t.curva || 0.5) * -1; x = 2 * (1 - u) * u * cx + u * u * t.dx; y = 2 * (1 - u) * u * cy + u * u * t.dy; }
      else if (t.tipo === 'giro') { const cx = t.dx, cy = 0; x = 2 * (1 - u) * u * cx + u * u * t.dx; y = 2 * (1 - u) * u * cy + u * u * t.dy; }
      else if (t.tipo === 'circulo') { const r = t.radio || 70, a = u * Math.PI * 2; if (t.forma === 'Rombo') { const k = (u * 4) % 1, lado = Math.floor(u * 4) % 4, P = [[0, 0], [r, r], [0, 2 * r], [-r, r], [0, 0]]; x = P[lado][0] + (P[lado + 1][0] - P[lado][0]) * k; y = P[lado][1] + (P[lado + 1][1] - P[lado][1]) * k; } else if (t.forma === 'Triángulo') { const k = (u * 3) % 1, lado = Math.floor(u * 3) % 3, P = [[0, 0], [r, 1.7 * r], [-r, 1.7 * r], [0, 0]]; x = P[lado][0] + (P[lado + 1][0] - P[lado][0]) * k; y = P[lado][1] + (P[lado + 1][1] - P[lado][1]) * k; } else { x = r * Math.sin(a); y = r - r * Math.cos(a); } }
      else { const r = t.radio || 50, a = u * Math.PI * 2; x = t.dx * u + r * Math.sin(a); y = r * (Math.cos(a) - 1); }
      out.push([x, y]);
    }
    return out;
  }

  /* ----------------------------------------------------------------- SmartArt */
  const SMARTART = [
    { id: 'listaBloques', nombre: 'Lista de bloques básica', cat: 'Lista', desc: 'Muestra bloques de información sin orden ni secuencia.' },
    { id: 'listaVertical', nombre: 'Lista de viñetas vertical', cat: 'Lista', desc: 'Grupos de información con encabezados destacados.' },
    { id: 'procesoBasico', nombre: 'Proceso básico', cat: 'Proceso', desc: 'Pasos o etapas de un proceso, en orden, de izquierda a derecha.' },
    { id: 'procesoCheuron', nombre: 'Proceso de cheurón básico', cat: 'Proceso', desc: 'Etapas sucesivas de una tarea o un flujo de trabajo.' },
    { id: 'cicloBasico', nombre: 'Ciclo básico', cat: 'Ciclo', desc: 'Etapas que se repiten de forma continua.' },
    { id: 'cicloContinuo', nombre: 'Ciclo continuo', cat: 'Ciclo', desc: 'Secuencia continua de etapas en un círculo.' },
    { id: 'organigrama', nombre: 'Organigrama', cat: 'Jerarquía', desc: 'Relaciones jerárquicas: el primer elemento queda arriba.' },
    { id: 'jerarquia', nombre: 'Jerarquía', cat: 'Jerarquía', desc: 'Relaciones jerárquicas en niveles de arriba abajo.' },
    { id: 'venn', nombre: 'Venn básico', cat: 'Relación', desc: 'Áreas que se superponen o se relacionan.' },
    { id: 'piramide', nombre: 'Pirámide básica', cat: 'Pirámide', desc: 'Relaciones proporcionales o de base, con lo más grande abajo.' },
  ];

  /* -------------------------------------------------------------------- formas */
  const FORMAS = [
    { id: 'rect', nombre: 'Rectángulo' },
    { id: 'redondeado', nombre: 'Rectángulo: esquinas redondeadas' },
    { id: 'elipse', nombre: 'Elipse' },
    { id: 'triangulo', nombre: 'Triángulo isósceles' },
    { id: 'flecha', nombre: 'Flecha: a la derecha' },
    { id: 'cheuron', nombre: 'Flecha: cheurón' },
    { id: 'estrella', nombre: 'Estrella: 5 puntas' },
    { id: 'bocadillo', nombre: 'Bocadillo: rectángulo' },
    { id: 'corazon', nombre: 'Corazón' },
  ];
  function rutaForma(id, w, h) {
    const r = Math.min(w, h);
    switch (id) {
      case 'rect': return 'M0 0H' + w + 'V' + h + 'H0Z';
      case 'redondeado': { const k = r * 0.18; return 'M' + k + ' 0H' + (w - k) + 'Q' + w + ' 0 ' + w + ' ' + k + 'V' + (h - k) + 'Q' + w + ' ' + h + ' ' + (w - k) + ' ' + h + 'H' + k + 'Q0 ' + h + ' 0 ' + (h - k) + 'V' + k + 'Q0 0 ' + k + ' 0Z'; }
      case 'elipse': return 'M' + w / 2 + ' 0A' + w / 2 + ' ' + h / 2 + ' 0 1 1 ' + w / 2 + ' ' + h + 'A' + w / 2 + ' ' + h / 2 + ' 0 1 1 ' + w / 2 + ' 0Z';
      case 'triangulo': return 'M' + w / 2 + ' 0L' + w + ' ' + h + 'H0Z';
      case 'flecha': { const c = Math.min(w * 0.4, h * 0.9); return 'M0 ' + h * 0.25 + 'H' + (w - c) + 'V0L' + w + ' ' + h / 2 + 'L' + (w - c) + ' ' + h + 'V' + h * 0.75 + 'H0Z'; }
      case 'cheuron': { const c = Math.min(w * 0.45, h * 0.5); return 'M0 0H' + (w - c) + 'L' + w + ' ' + h / 2 + 'L' + (w - c) + ' ' + h + 'H0L' + c + ' ' + h / 2 + 'Z'; }
      case 'estrella': { let d = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? 0.4 : 1; d += (i ? 'L' : 'M') + (w / 2 + Math.cos(a) * rr * w / 2).toFixed(1) + ' ' + (h / 2 + Math.sin(a) * rr * h / 2 + h * 0.05).toFixed(1); } return d + 'Z'; }
      case 'bocadillo': return 'M0 0H' + w + 'V' + h * 0.78 + 'H' + w * 0.42 + 'L' + w * 0.22 + ' ' + h + 'L' + w * 0.26 + ' ' + h * 0.78 + 'H0Z';
      case 'corazon': return 'M' + w / 2 + ' ' + h + 'C' + w * 0.1 + ' ' + h * 0.7 + ' 0 ' + h * 0.45 + ' 0 ' + h * 0.28 + 'C0 ' + h * 0.08 + ' ' + w * 0.18 + ' 0 ' + w * 0.3 + ' 0C' + w * 0.4 + ' 0 ' + w * 0.47 + ' ' + h * 0.06 + ' ' + w / 2 + ' ' + h * 0.16 + 'C' + w * 0.53 + ' ' + h * 0.06 + ' ' + w * 0.6 + ' 0 ' + w * 0.7 + ' 0C' + w * 0.82 + ' 0 ' + w + ' ' + h * 0.08 + ' ' + w + ' ' + h * 0.28 + 'C' + w + ' ' + h * 0.45 + ' ' + w * 0.9 + ' ' + h * 0.7 + ' ' + w / 2 + ' ' + h + 'Z';
      default: return 'M0 0H' + w + 'V' + h + 'H0Z';
    }
  }

  /* -------------------------------------------------------------------- iconos */
  // Trazos de 24 × 24 (estilo de línea). Se colorean con el color de la forma.
  const ICONOS = [
    ['jeringa', 'Jeringa', 'M18 2l4 4M20 4l-9 9M15 5l4 4M14 8l-8 8-3 1 1-3 8-8M8 12l2 2M10 10l2 2'],
    ['vial', 'Vial de vacuna', 'M9 3h6M10 3v3M14 3v3M8 6h8v14a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2zM8 11h8M8 16h8'],
    ['virus', 'Virus', 'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12 2v5M12 17v5M2 12h5M17 12h5M4.9 4.9l3.5 3.5M15.6 15.6l3.5 3.5M4.9 19.1l3.5-3.5M15.6 8.4l3.5-3.5M10.5 11h.01M13.5 13h.01'],
    ['mano', 'Mano', 'M8 13V5.5a1.5 1.5 0 0 1 3 0V12M11 11.5V4a1.5 1.5 0 0 1 3 0v7.5M14 11.5V5.5a1.5 1.5 0 0 1 3 0V13M17 9.5a1.5 1.5 0 0 1 3 0V15a7 7 0 0 1-7 7h-1a7 7 0 0 1-6-3.4L3.3 14a1.5 1.5 0 0 1 2.6-1.5L8 15'],
    ['gota', 'Agua', 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z'],
    ['jabon', 'Jabón', 'M4 13h12a3 3 0 0 1 0 6H4a3 3 0 0 1 0-6zM17 5a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM10 6a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM20.5 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2z'],
    ['mascarilla', 'Cubrebocas', 'M4 9c3-1 5-2 8-2s5 1 8 2v5c-2 3-5 4-8 4s-6-1-8-4zM4 9H2v3a3 3 0 0 0 2 2.5M20 9h2v3a3 3 0 0 1-2 2.5M8 11h8M8 14h8'],
    ['termometro', 'Termómetro', 'M14 14.8V4a2 2 0 0 0-4 0v10.8a4 4 0 1 0 4 0zM12 9v8'],
    ['estetoscopio', 'Estetoscopio', 'M6 3v6a4 4 0 0 0 8 0V3M6 3H5M14 3h1M10 13v3a5 5 0 0 0 10 0v-2M20 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z'],
    ['corazon', 'Corazón', 'M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11zM5 12h4l1.5-3 2 6 1.5-3h4'],
    ['pulmones', 'Pulmones', 'M12 4v8M12 12c-1 1-3 1-4 0M12 12c1 1 3 1 4 0M8 7C5 7 3 12 3 16c0 2 1 4 3 4 3 0 4-2 4-5V9M16 7c3 0 5 5 5 9 0 2-1 4-3 4-3 0-4-2-4-5V9'],
    ['cerebro', 'Salud mental', 'M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 5 2V4.5A2.5 2.5 0 0 0 9 4zM15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-5 2V4.5A2.5 2.5 0 0 1 15 4z'],
    ['pildora', 'Medicamento', 'M10.5 20.5a5 5 0 0 1-7-7l9-9a5 5 0 0 1 7 7zM8 8l8 8'],
    ['botiquin', 'Botiquín', 'M3 8h18v12H3zM8 8V5h8v3M12 11v6M9 14h6'],
    ['curita', 'Curita', 'M4.5 13.5l9-9a3.5 3.5 0 0 1 5 5l-9 9a3.5 3.5 0 0 1-5-5zM9 9l6 6M10.5 12h.01M12 10.5h.01M12 13.5h.01M13.5 12h.01'],
    ['ambulancia', 'Ambulancia', 'M2 7h11v10H2zM13 10h5l3 3v4h-8zM7.5 9v4M5.5 11h4M6 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4z'],
    ['hospital', 'Hospital', 'M3 21h18M5 21V7h14v14M9 21v-4h6v4M10 11h4M12 9v4M8 3h8v4H8z'],
    ['persona', 'Persona', 'M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 21a8 8 0 0 1 16 0'],
    ['grupo', 'Grupo', 'M9 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM3 19a6 6 0 0 1 12 0M17 6a2.5 2.5 0 1 1 0 5M17.5 14a5 5 0 0 1 4 5'],
    ['calendario', 'Calendario', 'M4 5h16v15H4zM4 10h16M8 3v4M16 3v4M8 14h3'],
    ['reloj', 'Reloj', 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2'],
    ['manzana', 'Nutrición', 'M12 7c-3-2-8-1-8 5s4 9 6 9c1 0 1.5-.5 2-.5s1 .5 2 .5c2 0 6-3 6-9s-5-7-8-5zM12 7c0-2 1-4 3-4'],
    ['escudo', 'Protección', 'M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6zM9 12l2 2 4-4'],
    ['alerta', 'Alerta', 'M12 3l10 18H2zM12 10v5M12 18h.01'],
    ['check', 'Correcto', 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM8 12l3 3 5-6'],
    ['bombilla', 'Idea', 'M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z'],
    ['pregunta', 'Preguntas', 'M4 5h16v11H9l-5 4zM10 9a2 2 0 1 1 3 1.7c-.6.4-1 .8-1 1.3M12 14h.01'],
    ['telefono', 'Teléfono', 'M5 3h4l2 5-3 2a11 11 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z'],
    ['casa', 'Casa', 'M3 11l9-7 9 7M5 9.5V20h14V9.5M10 20v-5h4v5'],
    ['flecha', 'Flecha', 'M4 12h16M14 6l6 6-6 6'],
  ];
  function iconoSVG(id, color, grosor) {
    const i = ICONOS.find((x) => x[0] === id) || ICONOS[0];
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="' + (color || '#156082') + '" stroke-width="' + (grosor || 1.8) + '" stroke-linecap="round" stroke-linejoin="round" preserveAspectRatio="xMidYMid meet"><path d="' + i[2] + '"/></svg>';
  }

  /* --------------------------------------------------------------- ilustraciones */
  const PIEL = ['#f1c7a3', '#d9a07a', '#a8714f', '#7a4a32'];
  const ILUS = {
    lavado: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240"><rect width="320" height="240" fill="#e4f2f8"/><ellipse cx="160" cy="226" rx="140" ry="18" fill="#c9dde8"/><path d="M120 18h80v20h-22v16h-36V38h-22z" fill="#8fa6b6"/><rect x="146" y="54" width="28" height="10" rx="3" fill="#6f8797"/><g stroke="#4fa3d9" stroke-width="6" stroke-linecap="round"><path d="M154 70v14M166 76v14M160 92v12"/></g><path d="M70 176c18-38 58-58 92-52 20 4 44 16 54 30l-22 9c-12-9-26-13-40-12l52 23-8 16-62-19c-26-6-48 3-66 9z" fill="' + PIEL[0] + '"/><path d="M250 176c-18-38-58-58-92-52-20 4-44 16-54 30l22 9c12-9 26-13 40-12l-52 23 8 16 62-19c26-6 48 3 66 9z" fill="' + PIEL[1] + '" opacity=".95"/><g fill="#fff" stroke="#9cc9e0" stroke-width="2"><circle cx="118" cy="128" r="10"/><circle cx="200" cy="120" r="13"/><circle cx="168" cy="108" r="7"/><circle cx="96" cy="150" r="6"/><circle cx="232" cy="146" r="8"/><circle cx="146" cy="120" r="5"/></g></svg>',
    vacuna: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240"><rect width="320" height="240" fill="#fdf0ea"/><path d="M160 30l78 28v54c0 50-36 82-78 96-42-14-78-46-78-96V58z" fill="#c43e1c" opacity=".14"/><g transform="rotate(-38 160 130)"><rect x="96" y="112" width="120" height="34" rx="6" fill="#fff" stroke="#5d6d7e" stroke-width="4"/><rect x="100" y="116" width="62" height="26" rx="3" fill="#7cc4e8"/><path d="M216 120h26v18h-26M242 129h30M60 129h36M56 112v34" stroke="#5d6d7e" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M272 129h26" stroke="#9aa7b3" stroke-width="2"/><path d="M120 112v10M136 112v10M152 112v10" stroke="#5d6d7e" stroke-width="3"/></g><rect x="224" y="150" width="40" height="62" rx="6" fill="#fff" stroke="#5d6d7e" stroke-width="4"/><rect x="230" y="138" width="28" height="14" rx="3" fill="#c43e1c"/><rect x="228" y="176" width="32" height="22" fill="#f6c3b3"/></svg>',
    personal: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240"><rect width="320" height="240" fill="#e9f3ef"/><circle cx="160" cy="70" r="34" fill="' + PIEL[2] + '"/><path d="M126 62c2-26 22-36 38-34 18 2 32 14 30 36-8-10-22-16-36-14-14 1-24 6-32 12z" fill="#3b2a20"/><path d="M84 240c4-62 34-100 76-100s72 38 76 100z" fill="#fff" stroke="#b9c9c2" stroke-width="3"/><path d="M148 140l12 30 12-30" fill="#2e7d6b"/><path d="M128 150c-6 26 0 50 14 58M192 150c6 26 0 50-14 58" fill="none" stroke="#3b4b55" stroke-width="5" stroke-linecap="round"/><circle cx="176" cy="210" r="9" fill="#3b4b55"/><rect x="196" y="176" width="46" height="58" rx="5" fill="#f5d38a" stroke="#a57d2b" stroke-width="3"/><path d="M206 194h26M206 206h26M206 218h18" stroke="#a57d2b" stroke-width="3"/></svg>',
    familia: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240"><rect width="320" height="240" fill="#fff6e8"/><ellipse cx="160" cy="226" rx="130" ry="12" fill="#f0dcc0"/><circle cx="96" cy="74" r="24" fill="' + PIEL[1] + '"/><path d="M60 226c0-70 16-114 36-114s36 44 36 114z" fill="#2f80c0"/><circle cx="214" cy="68" r="25" fill="' + PIEL[0] + '"/><path d="M176 226c0-74 16-120 38-120s38 46 38 120z" fill="#c43e1c"/><path d="M188 60c2-20 16-26 26-26 14 0 26 8 26 30-6-8-14-12-26-12s-20 4-26 8z" fill="#5a3a2a"/><circle cx="152" cy="132" r="17" fill="' + PIEL[2] + '"/><path d="M130 226c0-46 10-74 22-74s22 28 22 74z" fill="#2e9e6e"/><circle cx="268" cy="150" r="13" fill="' + PIEL[3] + '"/><path d="M252 226c0-36 8-56 16-56s16 20 16 56z" fill="#f0a202"/></svg>',
    sala: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240"><rect width="320" height="240" fill="#eef2f6"/><rect y="176" width="320" height="64" fill="#d8dee6"/><rect x="82" y="24" width="156" height="88" rx="6" fill="#263445"/><rect x="90" y="32" width="140" height="72" rx="3" fill="#c43e1c"/><path d="M118 82l40-30M146 48l12 12M126 76l-6 2 2-6" stroke="#fff" stroke-width="5" stroke-linecap="round"/><text x="196" y="74" text-anchor="middle" font-family="Segoe UI,Arial" font-size="13" font-weight="700" fill="#fff">VACÚNATE</text><path d="M156 112v14" stroke="#263445" stroke-width="5"/><g fill="#2f80c0"><rect x="30" y="148" width="54" height="16" rx="4"/><rect x="96" y="148" width="54" height="16" rx="4"/><rect x="162" y="148" width="54" height="16" rx="4"/></g><g fill="#1f5f8f"><rect x="30" y="120" width="54" height="30" rx="6"/><rect x="96" y="120" width="54" height="30" rx="6"/><rect x="162" y="120" width="54" height="30" rx="6"/></g><path d="M36 164v20M78 164v20M102 164v20M144 164v20M168 164v20M210 164v20" stroke="#55606b" stroke-width="4"/><rect x="252" y="138" width="34" height="42" rx="5" fill="#b5764a"/><path d="M269 138c-16-26-10-52 0-60 10 8 16 34 0 60zM269 140c-24-14-34-34-30-44 12-2 28 14 30 44zM269 140c24-14 34-34 30-44-12-2-28 14-30 44z" fill="#2e9e6e"/></svg>',
    virus: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240"><rect width="320" height="240" fill="#f3f0fa"/><g stroke="#8e3a8f" stroke-width="8" stroke-linecap="round"><path d="M160 30v30M160 180v30M70 120h30M220 120h30M96 56l22 22M202 162l22 22M96 184l22-22M202 78l22-22"/></g><g fill="#8e3a8f"><circle cx="160" cy="26" r="11"/><circle cx="160" cy="214" r="11"/><circle cx="66" cy="120" r="11"/><circle cx="254" cy="120" r="11"/><circle cx="92" cy="52" r="11"/><circle cx="228" cy="188" r="11"/><circle cx="92" cy="188" r="11"/><circle cx="228" cy="52" r="11"/></g><circle cx="160" cy="120" r="64" fill="#b56fb6"/><circle cx="160" cy="120" r="64" fill="none" stroke="#8e3a8f" stroke-width="6"/><g fill="#f3e3f3"><circle cx="138" cy="102" r="12"/><circle cx="182" cy="134" r="16"/><circle cx="150" cy="148" r="8"/><circle cx="186" cy="96" r="7"/></g></svg>',
    plato: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240"><rect width="320" height="240" fill="#f7f3ea"/><circle cx="160" cy="122" r="100" fill="#fff" stroke="#d9cfbd" stroke-width="6"/><path d="M160 122V30a92 92 0 0 1 86 60z" fill="#5fa05a"/><path d="M160 122l86-32a92 92 0 0 1-30 104z" fill="#f0a202"/><path d="M160 122l56 72a92 92 0 0 1-112 0z" fill="#e3c26b"/><path d="M160 122l-56 72A92 92 0 0 1 74 90z" fill="#b5764a"/><path d="M160 122L74 90a92 92 0 0 1 86-60z" fill="#c8503c"/><circle cx="160" cy="122" r="6" fill="#fff"/></svg>',
    presion: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240"><rect width="320" height="240" fill="#eef4fb"/><rect x="40" y="96" width="120" height="74" rx="14" fill="#2f5d8f"/><rect x="52" y="108" width="96" height="50" rx="8" fill="#3d73ad"/><path d="M160 134c40 0 40 60 80 60" fill="none" stroke="#55606b" stroke-width="6"/><circle cx="234" cy="94" r="54" fill="#fff" stroke="#55606b" stroke-width="6"/><path d="M234 94l26-24" stroke="#c43e1c" stroke-width="5" stroke-linecap="round"/><circle cx="234" cy="94" r="6" fill="#55606b"/><g stroke="#55606b" stroke-width="3"><path d="M196 94h10M262 94h10M234 56v10M207 67l7 7M261 67l-7 7"/></g><ellipse cx="248" cy="198" rx="16" ry="20" fill="#55606b"/></svg>',
  };
  const uri = (svg) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  // como una foto: si se estira, la imagen se deforma (sin esto el SVG conservaría su proporción)
  const estirable = (svg) => svg.replace('<svg ', '<svg preserveAspectRatio="none" ');
  const G = LT.GALERIA || { imagenes: [] };
  const IMAGENES = [
    { id: 'lavado', nombre: 'Lavado de manos', archivo: 'lavado-de-manos.png', alt: 'Dos manos con jabón y espuma bajo el chorro de agua de una llave.' },
    { id: 'vacuna', nombre: 'Vacunación', archivo: 'vacunacion.png', alt: 'Jeringa y frasco de vacuna frente a un escudo de protección.' },
    { id: 'personal', nombre: 'Personal de salud', archivo: 'personal-de-salud.png', alt: 'Profesional de la salud con bata blanca, estetoscopio y un expediente.' },
    { id: 'familia', nombre: 'Familia', archivo: 'familia.png', alt: 'Familia de cuatro integrantes: dos adultos, un niño y una niña.' },
    { id: 'sala', nombre: 'Sala de espera', archivo: 'sala-de-espera.png', alt: 'Sala de espera con sillas y una pantalla que invita a vacunarse.' },
    { id: 'virus', nombre: 'Virus de la influenza', archivo: 'virus.png', alt: 'Ilustración de un virus de la influenza con sus espículas.' },
    { id: 'plato', nombre: 'Alimentación saludable', archivo: 'plato-saludable.png', alt: 'Plato dividido en grupos de alimentos: verduras, frutas, cereales, leguminosas y proteínas.' },
    { id: 'presion', nombre: 'Toma de presión', archivo: 'tension-arterial.png', alt: 'Baumanómetro con brazalete, manómetro y pera de insuflación.' },
  ].map((x) => Object.assign(x, { src: uri(estirable(ILUS[x.id])), svg: ILUS[x.id], ancho: 320, alto: 240 }));
  for (const g of G.imagenes || []) if (!IMAGENES.some((x) => x.id === g.id)) IMAGENES.push({ id: g.id, nombre: g.nombre.replace(/^Foto: /, ''), src: uri(estirable(decodeURIComponent(g.src.replace(/^data:image\/svg\+xml;charset=utf-8,/, '')))), ancho: g.ancho * 2, alto: g.alto * 2, alt: g.id === 'logo' ? 'Logotipo de la Clínica Universitaria Vida Sana.' : g.nombre.replace(/^Foto: /, '') });
  function imagen(id) { return IMAGENES.find((x) => x.id === id) || null; }

  /* ------------------------------------------------------------------ medios */
  const MEDIOS = {
    video: [{ id: 'lavado', nombre: 'Video: lavado de manos en 6 pasos', archivo: 'video-lavado-de-manos.mp4', poster: 'video-lavado-de-manos.png', dur: 16 }],
    audio: [{ id: 'musica', nombre: 'Audio: música de fondo tranquila', archivo: 'musica-sala-de-espera.wav', dur: 24 }],
  };

  /* ---------------------------------------------------------------- utilidades */
  function hexRgb(c) {
    const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(c || '').trim());
    if (!m) return null;
    let s = m[1];
    if (s.length === 3) s = s.split('').map((x) => x + x).join('');
    return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
  }
  function luminancia(c) {
    const rgb = hexRgb(c);
    if (!rgb) return 1;
    const [r, g, b] = rgb.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  /* Relación de contraste WCAG entre dos colores (1 a 21) */
  function contraste(a, b) {
    const la = luminancia(a), lb = luminancia(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  }

  LT.DIAPO = {
    ANCHO, ALTO, TEMAS, DISENOS, IND, ROL_TXT, TRANSICIONES, SONIDOS, ANIMACIONES, CAT, COLOR_CAT, INICIOS, SMARTART, FORMAS, ICONOS, IMAGENES, MEDIOS, ILUS,
    tema: (id) => TEMAS.find((t) => t.id === id) || TEMAS[0],
    diseno: (id) => DISENOS.find((d) => d.id === id) || DISENOS[1],
    transicion: (id) => TRANSICIONES.find((t) => t.id === id) || TRANSICIONES[0],
    animacion: (id) => ANIMACIONES.find((a) => a.id === id) || null,
    smartart: (id) => SMARTART.find((s) => s.id === id) || SMARTART[0],
    imagen, iconoSVG, rutaForma, trayectoriaInicial, puntosTrayectoria, hexRgb, luminancia, contraste,
  };
})();

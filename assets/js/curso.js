/* Catálogo del curso «PowerPoint para Ciencias de la Salud»: 8 módulos en una sesión de 3 horas. */
(function () {
  'use strict';
  const LT = (window.LT = window.LT || {});

  const NIVELES = [
    { id: 'sesion', nombre: 'Presentaciones efectivas', sesion: 1, horas: 'Sesión única · 3 horas', color: '#c43e1c', capa: 'Estructurar, diseñar, enriquecer y animar presentaciones claras para educación en salud, y exponerlas con seguridad en vivo o de forma automática.', modulos: [1, 2, 3, 4, 5, 6, 7, 8], integrador: 'Pantalla de la sala de espera: campaña de vacunación contra influenza' },
  ];

  // id, título, nivel, sesión, minutos, entorno, reto principal, glifo de insignia, micro-retos, bloque
  const MODULOS = [
    [1, 'Estructura de una presentación', 15, 'Ordenar la plática «Lavado de manos»', '☰', 3, 'Diseño y contenido'],
    [2, 'Diseño de diapositivas', 25, 'Rediseñar la plática de hipertensión', 'Aa', 4, 'Diseño y contenido'],
    [3, 'Imágenes, iconos y formas', 20, 'Infografía de los momentos de la higiene de manos', '◩', 3, 'Diseño y contenido'],
    [4, 'SmartArt, tablas y gráficos', 25, 'Los datos de la campaña de vacunación', '▦', 3, 'Diseño y contenido'],
    [5, 'Audio, video e hipervínculos', 15, 'Plática interactiva de prevención de infecciones', '▶', 3, 'Multimedia y movimiento'],
    [6, 'Transiciones', 15, 'Transiciones discretas y coherentes', '⇄', 3, 'Multimedia y movimiento'],
    [7, 'Animaciones', 25, 'Animar la transmisión de la influenza', '✦', 4, 'Multimedia y movimiento'],
    [8, 'Presentación automática y vista del moderador', 15, 'Ensayar y dejar lista la presentación', '⏱', 3, 'Multimedia y movimiento'],
  ].map(([id, titulo, min, reto, glifo, micro, bloque]) => ({ id, titulo, nivel: 'sesion', sesion: 1, min, entorno: 'Simulador + PowerPoint', reto, glifo, micro, bloque, slug: 'm' + String(id).padStart(2, '0') }));

  /* Agenda de la sesión de 180 minutos: números = módulos; [texto, minutos] = bloques fijos */
  const SESIONES = [
    { n: 1, nivel: 'sesion', agenda: [['Arranque', 5], 1, 2, 3, 4, ['Receso', 15], 5, 6, 7, 8, ['Cierre', 5]] },
  ].map((s) => Object.assign(s, { modulos: s.agenda.filter((x) => typeof x === 'number') }));

  function modulo(id) { return MODULOS.find((m) => m.id === +id) || null; }
  function nivel(id) { return NIVELES.find((n) => n.id === id) || null; }
  /* Agenda con horas de inicio y fin: [{tipo:'modulo'|'bloque', titulo, min, inicio, fin}] */
  function agenda(n) {
    const s = SESIONES.find((x) => x.n === n);
    let t = 0;
    const hhmm = (m) => Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0');
    return s.agenda.map((x) => {
      const it = typeof x === 'number' ? { tipo: 'modulo', id: x, titulo: 'Módulo ' + x + '. ' + modulo(x).titulo, min: modulo(x).min } : { tipo: 'bloque', titulo: x[0], min: x[1] };
      it.inicio = hhmm(t); t += it.min; it.fin = hhmm(t);
      return it;
    });
  }

  const COLORES_BLOQUE = { 'Diseño y contenido': '#c43e1c', 'Multimedia y movimiento': '#8e3a8f' };
  function insignia(id, opc) {
    opc = opc || {};
    const m = modulo(id);
    const color = COLORES_BLOQUE[m.bloque] || '#c43e1c';
    const t = opc.tam || 64;
    const estrella = opc.estrella ? '<path d="M50 4l3.5 7.1 7.8 1.1-5.6 5.5 1.3 7.8L50 21.8l-7 3.7 1.3-7.8-5.6-5.5 7.8-1.1z" fill="#f5c542" stroke="#fff" stroke-width="1.5"/>' : '';
    const tamGlifo = m.glifo.length > 1 ? 26 : 30;
    return '<svg viewBox="0 0 100 100" width="' + t + '" height="' + t + '" role="img" aria-label="Insignia del módulo ' + id + ': ' + m.titulo + '">' +
      '<path d="M50 6 88 28v44L50 94 12 72V28z" fill="' + color + '"/>' +
      '<path d="M50 14 81 32v36L50 86 19 68V32z" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="2"/>' +
      '<text x="50" y="56" text-anchor="middle" font-family="Georgia,\'Segoe UI Symbol\',serif" font-size="' + tamGlifo + '" fill="#fff" font-weight="700">' + m.glifo + '</text>' +
      '<text x="50" y="76" text-anchor="middle" font-family="Segoe UI,Arial" font-size="12" fill="rgba(255,255,255,.9)" font-weight="700">M' + id + '</text>' + estrella + '</svg>';
  }

  LT.CURSO = {
    version: 1, NIVELES, MODULOS, SESIONES, modulo, nivel, agenda, insignia, COLORES_BLOQUE,
    marca: 'PowerPoint', nombre: 'PowerPoint para Ciencias de la Salud',
    coordinadora: 'Mtra. Andrea Ríos', cargo: 'coordinadora de Educación para la Salud', iniciales: 'AR',
    institucion: 'Clínica Universitaria Vida Sana', formato: 'Una sesión de 3 horas',
  };
})();

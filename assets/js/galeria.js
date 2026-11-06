/* Imágenes e iconos del caso Clínica Universitaria Vida Sana (SVG en línea para que funcionen sin conexión) */
(function () {
  'use strict';
  const LT = (window.LT = window.LT || {});
  const uri = (svg) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);

  const LOGO = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><circle cx="100" cy="100" r="96" fill="#0f766e"/><circle cx="100" cy="100" r="84" fill="none" stroke="#99d5cf" stroke-width="3"/><path d="M82 46h36v30h30v36h-30v30H82v-30H52V76h30z" fill="#f2fbfa"/><path d="M56 96h22l8-16 12 32 10-22 6 6h30" fill="none" stroke="#0f766e" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><text x="100" y="172" text-anchor="middle" font-family="Georgia,serif" font-size="22" font-weight="bold" fill="#f2fbfa">Vida Sana</text></svg>';
  const CONSULTORIO = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180"><rect width="240" height="180" rx="14" fill="#e3f2f1"/><rect x="30" y="110" width="120" height="16" rx="4" fill="#9ccfca"/><rect x="36" y="126" width="8" height="34" fill="#5b8f8a"/><rect x="136" y="126" width="8" height="34" fill="#5b8f8a"/><rect x="160" y="40" width="54" height="84" rx="6" fill="#fff" stroke="#0f766e" stroke-width="3"/><path d="M187 58v20M177 68h20" stroke="#c53d5b" stroke-width="5"/><circle cx="70" cy="70" r="20" fill="#f2c9a5"/><path d="M44 110c2-18 14-26 26-26s24 8 26 26z" fill="#fff" stroke="#0f766e" stroke-width="3"/></svg>';
  const LABORATORIO = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180"><rect width="240" height="180" rx="14" fill="#eef4fb"/><path d="M96 34h48M104 34v46l-34 62a10 10 0 0 0 9 15h82a10 10 0 0 0 9-15l-34-62V34" fill="#fff" stroke="#2463a6" stroke-width="5" stroke-linejoin="round"/><path d="M82 120h76l13 24a6 6 0 0 1-5 9H74a6 6 0 0 1-5-9z" fill="#7cc4bd"/><circle cx="110" cy="132" r="5" fill="#fff"/><circle cx="130" cy="140" r="3" fill="#fff"/></svg>';
  const FACHADA = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180"><rect width="240" height="180" rx="14" fill="#e3f2f1"/><rect x="40" y="58" width="160" height="100" fill="#fff" stroke="#0f766e" stroke-width="4"/><rect x="30" y="44" width="180" height="18" fill="#0f766e"/><path d="M114 70h12v12h12v12h-12v12h-12V94h-12V82h12z" fill="#c53d5b"/><rect x="58" y="112" width="40" height="30" fill="#c9e3f5" stroke="#0f766e" stroke-width="3"/><rect x="142" y="112" width="40" height="46" fill="#5b8f8a"/><text x="120" y="57" text-anchor="middle" font-family="Georgia,serif" font-size="12" fill="#fff">CLÍNICA VIDA SANA</text></svg>';

  const ic = (d, color) => uri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' + (color || '#0f766e') + '" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="' + d + '"/></svg>');
  const ICONOS = [
    ['estetoscopio', 'Estetoscopio', 'M6 3v6a4 4 0 0 0 8 0V3M6 3H5M14 3h1M10 13v3a5 5 0 0 0 10 0v-2M20 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z'],
    ['corazon', 'Corazón (salud)', 'M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11zM5 12h4l1.5-3 2 6 1.5-3h4'],
    ['cruz', 'Cruz médica', 'M9 3h6v6h6v6h-6v6H9v-6H3V9h6z'],
    ['jeringa', 'Jeringa (vacunación)', 'M18 2l4 4M20 4l-9 9M15 5l4 4M14 8l-8 8-3 1 1-3 8-8M8 12l2 2M10 10l2 2'],
    ['pildora', 'Medicamento', 'M10.5 20.5a5 5 0 0 1-7-7l9-9a5 5 0 0 1 7 7zM8 8l8 8'],
    ['matraz', 'Laboratorio', 'M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3M7 15h10'],
    ['reloj', 'Horario', 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2'],
    ['ubicacion', 'Ubicación', 'M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12zM12 6.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z'],
    ['telefono', 'Teléfono', 'M5 3h4l2 5-3 2a11 11 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z'],
    ['calendario', 'Cita', 'M4 5h16v15H4zM4 10h16M8 3v4M16 3v4M8 14h3'],
    ['manzana', 'Nutrición', 'M12 7c-3-2-8-1-8 5s4 9 6 9c1 0 1.5-.5 2-.5s1 .5 2 .5c2 0 6-3 6-9s-5-7-8-5zM12 7c0-2 1-4 3-4'],
    ['escudo', 'Prevención', 'M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6zM9 12l2 2 4-4'],
  ];

  LT.GALERIA = {
    logo: uri(LOGO),
    logoSVG: LOGO,
    imagenes: [
      { id: 'logo', nombre: 'Logo de la Clínica Vida Sana', src: uri(LOGO), ancho: 110, alto: 110 },
      { id: 'consultorio', nombre: 'Foto: consultorio', src: uri(CONSULTORIO), ancho: 160, alto: 120 },
      { id: 'laboratorio', nombre: 'Foto: laboratorio', src: uri(LABORATORIO), ancho: 160, alto: 120 },
      { id: 'fachada', nombre: 'Foto: fachada de la clínica', src: uri(FACHADA), ancho: 160, alto: 120 },
    ],
    iconos: ICONOS.map(([id, nombre, d]) => ({ id, nombre, src: ic(d) })),
  };
})();

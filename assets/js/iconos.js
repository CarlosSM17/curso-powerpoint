/* Iconos SVG de la barra de herramientas (trazos de 24×24, heredan el color del texto) */
(function () {
  'use strict';
  const LT = (window.LT = window.LT || {});
  const P = {
    nuevaDiapo: 'M3 5h13v10H3zM19 12v7M15.5 15.5h7',
    diseno: 'M3 4h18v16H3zM3 9h18M10 9v11',
    seccion: 'M3 4h6v6H3zM3 14h6v6H3zM12 7h9M12 17h9',
    play: 'M7 4l13 8-13 8z',
    playActual: 'M3 5h14v10H3zM9 8l5 2.5L9 13zM19 9v10H7',
    animacion: 'M12 2l2.4 6.6L21 9l-5 4.5 1.5 7L12 17l-5.5 3.5L8 13.5 3 9l6.6-.4z',
    panelAnim: 'M4 4h16v16H4zM8 8h4M8 12h7M8 16h5M15 8h2',
    ensayar: 'M12 5a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 9v4l3 2M9 2h6M12 2v3',
    configurar: 'M3 5h18v11H3zM8 20h8M12 16v4M12 8.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
    ocultar: 'M3 3l18 18M10.6 6.1A10 10 0 0 1 12 6c6 0 10 6 10 6a17 17 0 0 1-3 3.5M6.6 6.6A17 17 0 0 0 2 12s4 6 10 6a9 9 0 0 0 4.4-1.1',
    video: 'M3 6h13v12H3zM16 10l5-3v10l-5-3z',
    audio: 'M4 9h4l5-4v14l-5-4H4zM16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11',
    smartart: 'M2 9h5v6H2zM9.5 9h5v6h-5zM17 9h5v6h-5zM7 12h2.5M14.5 12H17',
    tablaIns: 'M3 4h18v16H3zM3 10h18M3 15h18M9 4v16M15 4v16',
    accesibilidad: 'M12 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM4 9l8 2 8-2M12 11v4M12 15l-3 6M12 15l3 6',
    normal: 'M2 4h20v16H2zM7 4v16',
    clasificador: 'M3 4h8v6H3zM13 4h8v6h-8zM3 14h8v6H3zM13 14h8v6h-8z',
    transicion: 'M3 5h9v9H3zM12 10h9v9h-9z',
    moderador: 'M2 4h20v12H2zM8 20h8M12 16v4M5 7h7v6H5zM14 8h5M14 11h4',
    deshacer: 'M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3',
    rehacer: 'm15 14 5-5-5-5M20 9H10a6 6 0 0 0 0 12h3',
    cortar: 'M6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12',
    copiar: 'M9 9h11v11H9zM5 15H4V4h11v1',
    pegar: 'M9 4h6v3H9zM8 5H5v16h14V5h-3M9 12h6M9 16h6',
    brocha: 'M18 3H6v5h12zM12 8v4M10 12h4v9h-4z',
    alIzq: 'M4 6h16M4 10h10M4 14h16M4 18h10',
    alCen: 'M4 6h16M7 10h10M4 14h16M7 18h10',
    alDer: 'M4 6h16M10 10h10M4 14h16M10 18h10',
    ajustar: 'M4 6h16M4 12h13a3 3 0 0 1 0 6h-4m2-2-2 2 2 2M4 18h6',
    combinar: 'M3 5h18v14H3zM8 12H3m18 0h-5m-6-2-2 2 2 2m4-4 2 2-2 2',
    bordes: 'M4 4h16v16H4zM4 12h16M12 4v16',
    relleno: 'm5 11 7-7 7 7-7 7zM5 11h14M20 15s2 2.2 2 3.5a2 2 0 0 1-4 0c0-1.3 2-3.5 2-3.5z',
    fuente: 'M6 18 11 5h2l5 13M8 13h8',
    decMas: 'M3 17h2M8 12a2 2 0 0 1 4 0v3a2 2 0 0 1-4 0zM14 12a2 2 0 0 1 4 0v3a2 2 0 0 1-4 0zM16 21h6m-2-2 2 2-2 2',
    decMenos: 'M3 17h2M8 12a2 2 0 0 1 4 0v3a2 2 0 0 1-4 0zM14 21h6m-4-2-2 2 2 2',
    condicional: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
    estilos: 'M4 5h16v5H4zM4 14h7v5H4zM13 14h7v5h-7z',
    insertarFila: 'M4 4h16v6H4zM4 14h16v6H4zM12 11v2',
    eliminar: 'M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13',
    autosuma: 'M18 5H6l6 7-6 7h12',
    ordenarAZ: 'M4 18V6m0 12-2-2m2 2 2-2M10 6h5l-5 7h5M10 20l2.5-6 2.5 6m-4-2h3',
    ordenarZA: 'M4 6v12m0-12L2 8m2-2 2 2M10 13h5l-5 7h5M10 11l2.5-6 2.5 6m-4-2h3',
    ordenar: 'M4 6h10M4 12h7M4 18h4M17 5v14m0 0-3-3m3 3 3-3',
    filtro: 'M3 5h18l-7 8v6l-4 2v-8z',
    duplicados: 'M4 5h12v4H4zM8 13h12v4H8zM14 21l6-6',
    textoColumnas: 'M4 5h16v14H4zM12 5v14M8 9l-2 3 2 3M16 9l2 3-2 3',
    relampago: 'M13 2 4 14h7l-1 8 9-12h-7z',
    validacion: 'M4 4h16v16H4zM8 12l3 3 5-6',
    nombre: 'M4 7h16v10H4zM8 11h8M8 14h5',
    precedentes: 'M4 6h5v4H4zM15 14h5v4h-5zM9 8c4 0 6 2 6 7m0 0-2-2m2 2 2-2',
    evaluar: 'M4 19 8 5h3M6 12h5M14 9l6 8m0-8-6 8',
    mostrarFormulas: 'M4 4h16v16H4zM8 9h3M8 13h8M8 17h5M14 7v4',
    sinFlechas: 'M4 6h5v4H4zM15 14h5v4h-5zM5 19 19 5',
    objetivo: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2z',
    escenarios: 'M4 6h16v4H4zM4 14h7v6H4zM13 14h7v6h-7z',
    tablaDatos: 'M4 4h16v16H4zM4 9h16M9 4v16M13 13l4 4m0-4-4 4',
    inmovilizar: 'M12 2v20M3.3 7l17.4 10M20.7 7 3.3 17M9 4l3 2 3-2M9 20l3-2 3 2',
    comentario: 'M4 5h16v11H9l-5 4z',
    nota: 'M5 4h14v12l-4 4H5zM15 20v-4h4',
    proteger: 'M6 11h12v10H6zM8 11V8a4 4 0 0 1 8 0v3',
    desbloquear: 'M6 11h12v10H6zM8 11V8a4 4 0 0 1 7.5-2',
    imagen: 'M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6M15 9a1 1 0 1 0 0-.1',
    forma: 'M4 5h9v9H4zM16 13a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
    icono: 'M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z',
    cuadroTexto: 'M3 5h18v14H3zM8 9h8M12 9v7',
    vinculo: 'M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1',
    buscar: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM16 16l5 5',
    reemplazar: 'M4 7h11l-3-3m3 3-3 3M20 17H9l3 3m-3-3 3-3',
    grabar: 'M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12z',
    detener: 'M7 7h10v10H7z',
    ejecutar: 'M7 5v14l11-7z',
    codigo: 'm8 8-5 4 5 4M16 8l5 4-5 4M14 5l-4 14',
    hoja: 'M5 3h10l4 4v14H5zM15 3v4h4',
    reloj: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2',
    mas: 'M12 5v14M5 12h14',
    check: 'm5 12 5 5 9-10',
    x: 'M6 6l12 12M18 6 6 18',
    info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 11v6M12 7.5v.5',
    flecha: 'M5 12h14m-5-5 5 5-5 5',
    descargar: 'M12 4v11m0 0-4-4m4 4 4-4M5 19h14',
    subir: 'M12 16V5m0 0-4 4m4-4 4 4M5 19h14',
    pista: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z',
    reiniciar: 'M4 12a8 8 0 1 0 2.3-5.7M4 4v4h4',
    taza: 'M4 9h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM16 11h2a2 2 0 0 1 0 4h-2M8 3c0 2 2 2 2 4M12 3c0 2 2 2 2 4',
    salud: 'M9 3h6v6h6v6h-6v6H9v-6H3V9h6zM5 12h3l1.5-3 3 6 1.5-3h5',
    grafico: 'M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-8',
    ojo: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
    menu: 'M4 6h16M4 12h16M4 18h16',
    usuario: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
    trofeo: 'M8 4h8v6a4 4 0 0 1-8 0zM8 6H4a3 3 0 0 0 4 4M16 6h4a3 3 0 0 1-4 4M12 14v4M8 21h8',
  };
  LT.icono = function (nombre, tam) {
    const d = P[nombre] || P.info;
    const s = tam || 16;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', s);
    svg.setAttribute('height', s);
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.8');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', d);
    svg.appendChild(p);
    return svg;
  };
  LT.iconoSVG = function (nombre, tam) {
    const s = tam || 16;
    return '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + (P[nombre] || P.info) + '"/></svg>';
  };
})();

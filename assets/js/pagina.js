/* Elementos comunes de todas las páginas: barra superior, pie y rutas. */
(function () {
  'use strict';
  const LT = window.LT;
  const { h } = LT.u;

  const P = {
    raiz() { return document.body.dataset.raiz || '.'; },
    incrustado() { try { return window.self !== window.top; } catch (e) { return true; } },
    url(p) { return P.raiz() + '/' + p; },
    urlModulo(id) { return P.url('modulos/' + LT.CURSO.modulo(id).slug + '.html'); },
    barra() {
      const total = LT.CURSO.MODULOS.length;
      const cuenta = () => '🏅 ' + LT.CURSO.MODULOS.filter((m) => LT.progreso.estadoModulo(m.id).superado).length + '/' + total;
      const mini = h('span', { class: 'progreso-mini', title: 'Insignias obtenidas' }, cuenta());
      document.addEventListener('lt-progreso', () => { mini.textContent = cuenta(); });
      return h('header', { class: 'barra-sup' }, h('div', { class: 'contenedor' },
        h('a', { class: 'marca', href: P.url('index.html') }, LT.icono('salud', 26), h('span', null, 'PowerPoint', h('small', null, 'Sesión de 3 horas'))),
        h('nav', { 'aria-label': 'Principal' },
          h('a', { href: P.url('index.html#modulos') }, LT.icono('menu', 16), h('span', { class: 'txt-largo' }, 'Módulos')),
          h('a', { href: P.url('guia.html') }, LT.icono('ojo', 16), h('span', { class: 'txt-largo' }, 'Guía visual')),
          h('a', { href: P.url('glosario.html') }, LT.icono('hoja', 16), h('span', { class: 'txt-largo' }, 'Glosario')),
          P.incrustado() ? h('a', { href: location.href, target: '_blank', rel: 'noopener', title: 'Abrir la plataforma en una pestaña propia (recomendado si estás dentro de Google Sites)' }, LT.icono('flecha', 16), h('span', { class: 'txt-largo' }, 'Pestaña nueva')) : null,
          mini)));
    },
    pie() {
      return h('footer', { class: 'pie-sitio' }, h('div', { class: 'contenedor' },
        h('p', null, 'PowerPoint para Ciencias de la Salud · Curso con retos interactivos. Caso ficticio: Clínica Universitaria Vida Sana; los mensajes de salud son solo para practicar y no sustituyen guías clínicas ni campañas oficiales.'),
        h('p', null, 'Lectura de presentaciones con ', h('a', { href: 'https://stuk.github.io/jszip/', target: '_blank', rel: 'noopener' }, 'JSZip'), ' (licencia MIT). Ilustraciones, iconos, música y video hechos para el curso. Tu progreso se guarda solo en este navegador; descarga tu reporte desde la página de inicio.'),
        h('p', null, 'Microsoft PowerPoint es una marca de Microsoft Corporation. Este curso es independiente y no está afiliado a Microsoft.'),
        h('p', { class: 'pie-docente' }, h('a', { href: P.url('docente/index.html') }, LT.icono('usuario', 14), 'Acceso docente'))));
    },
    montar(contenido) {
      const app = document.getElementById('app');
      app.innerHTML = '';
      app.append(P.barra(), contenido, P.pie());
    },
  };
  LT.pagina = P;
})();

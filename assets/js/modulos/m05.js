/* Módulo 5 · Audio, video e hipervínculos */
(function () {
  const { h } = LT.u;
  const { porClave, revisor, R, K, norm } = LT.ppt;

  const boton = (clave, texto, x, y, w) => ({ clave, tipo: 'forma', forma: 'redondeado', texto, x, y, w: w || 240, h: 70, estilo: { tam: 22 } });
  const inicial = () => LT.Diapo.construir({
    titulo: 'Prevención de infecciones', tema: 'clinico', variante: 0,
    diapositivas: [
      { clave: 'portada', diseno: 'titulo', titulo: 'Prevención de infecciones', subtitulo: 'Plática interactiva · Clínica Universitaria Vida Sana' },
      { clave: 'menu', diseno: 'soloTitulo', titulo: 'Menú: elige un tema', objetos: [boton('bLavado', 'Lavado de manos', 120, 200, 320), boton('bVacuna', 'Vacunación', 520, 200, 320), boton('bInfo', 'Más información', 320, 330, 320)] },
      { clave: 'lavado', diseno: 'soloTitulo', titulo: 'Lavado de manos', objetos: [boton('vLavado', 'Volver al menú', 690, 450, 220)], notas: '' },
      { clave: 'vacuna', diseno: 'tituloObjetos', titulo: 'Vacunación', cuerpo: 'Vacúnate cada temporada de influenza\nRevisa tu cartilla de vacunación\nPregunta en el módulo de vacunación', cajas: { cuerpo: { h: 290 } }, objetos: [boton('vVacuna', 'Volver al menú', 690, 450, 220)] },
    ],
  });
  const vinculoA = (p, o, clave) => { if (!o || !o.vinculo || o.vinculo.tipo !== 'diapositiva') return false; const d = porClave(p, clave); return !!d && o.vinculo.destino === d.id; };

  function verificar(ed, nivel) {
    const p = ed.p;
    const add = revisor();
    const obj = (dc, oc) => { const d = porClave(p, dc); return d ? d.objetos.find((o) => o.clave === oc) : null; };
    add(vinculoA(p, obj('menu', 'bLavado'), 'lavado'), '«Lavado de manos» lleva a su diapositiva', 'Selecciona el botón «Lavado de manos» › Insertar › Vínculo › Lugar de este documento › diapositiva «Lavado de manos».');
    add(vinculoA(p, obj('menu', 'bVacuna'), 'vacuna'), '«Vacunación» lleva a su diapositiva', 'Vincula el botón «Vacunación» a la diapositiva «Vacunación».');
    const info = obj('menu', 'bInfo');
    add(!!(info && info.vinculo && info.vinculo.tipo === 'url' && /^https:\/\/[^\s]+\.[^\s]+/.test(info.vinculo.url)), '«Más información» abre una página web', 'Vincula «Más información» a una página web con dirección completa (por ejemplo https://www.gob.mx/salud).');
    add(vinculoA(p, obj('lavado', 'vLavado'), 'menu') && vinculoA(p, obj('vacuna', 'vVacuna'), 'menu'), 'Botones «Volver al menú»', 'Los dos botones «Volver al menú» deben llevar a la diapositiva «Menú».');
    const dl = porClave(p, 'lavado');
    const video = dl && dl.objetos.find((o) => o.tipo === 'video');
    add(!!video, 'Video en «Lavado de manos»', 'Inserta el video del lavado de manos (Insertar › Video) en la diapositiva «Lavado de manos».');
    if (video) add((video.opciones || {}).inicio === 'auto', 'El video inicia automáticamente', 'En el panel Formato › Reproducción del video elige Inicio: Automáticamente.');
    const dp = porClave(p, 'portada');
    const audio = dp && dp.objetos.find((o) => o.tipo === 'audio');
    add(!!audio, 'Música en la portada', 'Inserta el audio de música de fondo en la portada (Insertar › Audio).');
    if (audio) { const o = audio.opciones || {}; add(o.inicio === 'auto' && o.todas && o.repetir && o.ocultar, 'Música en el fondo', 'Usa «Reproducir en el fondo»: inicia sola, sigue en todas las diapositivas, se repite y oculta el icono.'); }
    if (nivel === 'experto') {
      add(!!video && (String(dl.notas || '').trim().length >= 30 || (video.opciones || {}).subtitulos), 'Video accesible', 'Describe el video en las notas de su diapositiva (30 caracteres o más) o confirma que tiene subtítulos.');
      add(!!(info && info.vinculo && String(info.vinculo.info || '').trim()), 'Información en pantalla del vínculo web', 'Agrega una «Info en pantalla» al vínculo de «Más información» que diga a dónde lleva.');
      add(Object.keys(ed.registro.vinculosProbados || {}).length >= 2, 'Vínculos probados en la presentación', 'Presenta (F5) y prueba al menos dos vínculos: los vínculos solo funcionan en la presentación con diapositivas.');
    }
    return add.lista;
  }
  function crearReto(cont, nivel, extra) {
    return LT.modulo.retoSimulador(cont, { presentacion: inicial(), herramientas: ['insertar', 'inicio', 'presentacion'], pestana: 'insertar', verificar }, extra);
  }

  function demoMenu(c) {
    const p = inicial();
    const o = (i, c) => p.diapositivas[i].objetos.find((x) => x.clave === c);
    o(1, 'bLavado').vinculo = { tipo: 'diapositiva', destino: p.diapositivas[2].id };
    o(1, 'bVacuna').vinculo = { tipo: 'diapositiva', destino: p.diapositivas[3].id };
    o(1, 'bInfo').vinculo = { tipo: 'url', url: 'https://www.gob.mx/salud' };
    o(2, 'vLavado').vinculo = { tipo: 'diapositiva', destino: p.diapositivas[1].id };
    o(3, 'vVacuna').vinculo = { tipo: 'diapositiva', destino: p.diapositivas[1].id };
    p.diapositivas[2].objetos.push({ id: 'ov', tipo: 'video', src: 'lavado', x: 60, y: 130, w: 560, h: 315, nombre: 'Video 3', opciones: { inicio: 'auto' } });
    const caja = h('div');
    c.appendChild(caja);
    const ed = new LT.Diapo(caja, { presentacion: p, herramientas: ['presentacion'], alto: 420, notas: false, panel: null });
    c.appendChild(h('p', { class: 'instr' }, 'Pulsa «Desde el principio», avanza al menú y haz clic en los botones: los vínculos solo funcionan en la presentación con diapositivas.'));
    void ed;
  }

  LT.definirModulo({
    id: 5,
    objetivo: 'Insertar video y audio con opciones de reproducción adecuadas y crear hipervínculos a páginas web y a otras diapositivas.',
    situacion: 'Para el taller de voluntarios quiero una <b>plática interactiva de prevención de infecciones</b>: un menú que lleve a cada tema y regrese, el video del lavado de manos que se reproduzca solo, música suave desde la portada y un vínculo a la página de la Secretaría de Salud.',
    explicacion: [
      { html: '<h3>Video</h3><p><b>Insertar › Video › Este dispositivo</b> incrusta el archivo (MP4 con H.264 es el formato más compatible). En la pestaña <b>Reproducción</b> eliges el <b>Inicio</b>: <i>En secuencia de clic</i> (con el siguiente clic), <i>Automáticamente</i> (al mostrarse la diapositiva) o <i>Al hacer clic en</i> (solo si haces clic sobre el video). También: Reproducir a pantalla completa, Ocultar con la reproducción detenida, Repetir, Rebobinar, Recortar video y Marco de póster. Los videos en línea necesitan internet.</p><h3>Audio</h3><p><b>Insertar › Audio › Audio en Mi PC</b>. <b>Reproducir en el fondo</b> activa todo lo que necesita la música de fondo: inicio automático, continuar en todas las diapositivas, repetir y ocultar el icono. Usa música con permiso de uso y volumen bajo.</p>' },
      { html: '<h3>Hipervínculos</h3><ul><li>Selecciona un texto o una forma › <b>Insertar › Vínculo</b> (Ctrl+Alt+K).</li><li><b>Archivo o página web existente</b>: escribe la dirección completa (https://…).</li><li><b>Lugar de este documento</b>: elige una diapositiva. Así se arma un <b>menú</b> con botones y un botón «Volver al menú» en cada tema.</li><li>Los vínculos funcionan en la <b>presentación con diapositivas</b> (F5); en la vista Normal se abren con Ctrl+clic.</li><li>Accesibilidad: el texto del vínculo debe decir a dónde lleva («Calendario de vacunación de la Secretaría de Salud», no «haz clic aquí»); los videos necesitan subtítulos o una descripción.</li></ul>' },
      { titulo: 'Prueba un menú interactivo', widget: demoMenu },
    ],
    ejemplo: {
      titulo: 'Un botón que lleva a otra diapositiva',
      pasos: [
        { texto: 'Inserta una forma (Insertar › Formas) y escribe el nombre del tema.', ruta: ['Insertar', 'Formas'] },
        { texto: 'Con la forma seleccionada: Insertar › Vínculo.', ruta: ['Insertar', 'Vínculo'] },
        'En «Vincular a» elige Lugar de este documento y la diapositiva de destino › Aceptar.',
        'Presenta con F5 y haz clic en el botón para probarlo.',
      ],
      pregunta: { texto: 'Quieres que la música suene desde la portada hasta el final, sin que se vea el icono. ¿Qué eliges?', opciones: ['Inicio: Al hacer clic en', 'Reproducir en el fondo', 'Solo «Repetir la reproducción»', 'Solo «Ocultar durante presentación»'], correcta: 1, explicacion: '<b>Reproducir en el fondo</b> combina inicio automático, todas las diapositivas, repetir y ocultar.' },
    },
    micro: [
      { titulo: 'Inicio del video', tipo: 'opcion', enunciado: 'En la pantalla de la sala de espera nadie hará clic: el video debe empezar solo al mostrarse la diapositiva.', opciones: ['En secuencia de clic', 'Automáticamente', 'Al hacer clic en', 'Ocultar con la reproducción detenida'], correcta: 1, explicacion: '<b>Automáticamente</b> reproduce el video en cuanto aparece la diapositiva.' },
      { titulo: '¿A dónde lleva el vínculo?', tipo: 'clasificar', ancho: true, enunciado: 'Elige el tipo de destino de cada vínculo.', categorias: ['Lugar de este documento', 'Página web'], items: [['Botón «Volver al menú»', 0, 'El menú es otra diapositiva.'], ['«Calendario de vacunación» de gob.mx', 1, 'Es una página web.'], ['«Ir a los momentos clave» (diapositiva 4)', 0, 'Es una diapositiva de la misma presentación.'], ['Formulario de registro en línea de la clínica', 1, 'Es una dirección web.']] },
      { titulo: 'Texto del vínculo', tipo: 'opcion', enunciado: '¿Qué texto de vínculo es más claro y accesible?', opciones: ['Haz clic aquí', 'https://www.gob.mx/salud/acciones-y-programas/…', 'Calendario de vacunación de la Secretaría de Salud', 'Más'], correcta: 2, explicacion: 'Un texto que dice a dónde lleva sirve a todos, también a quien usa lector de pantalla.' },
    ],
    reto: {
      titulo: 'Plática interactiva de prevención de infecciones', tipo: 'widget', crear: crearReto,
      base: {
        instrucciones: ['Menú (diapositiva 2): «Lavado de manos» y «Vacunación» llevan a sus diapositivas; «Más información» abre https://www.gob.mx/salud.', 'Los dos botones «Volver al menú» llevan a la diapositiva 2.', 'Diapositiva «Lavado de manos»: inserta el video y haz que inicie automáticamente.', 'Portada: inserta la música y configúrala para reproducirse en segundo plano.'],
        pistas: ['Los botones son formas: un vínculo puede llevar a otra diapositiva o a una página web.', 'Selecciona el botón › Insertar › Vínculo. Video y audio: Insertar › Video / Audio; sus opciones están en el panel Formato › Reproducción.', 'Lavado de manos → «3. Lavado de manos»; Vacunación → «4. Vacunación»; Más información → https://www.gob.mx/salud; Volver al menú → «2. Menú: elige un tema». Video: Inicio Automáticamente. Audio: botón «Reproducir en el fondo».'],
      },
      niveles: {
        explorador: { instrucciones: ['Ve a la diapositiva 2. Selecciona «Lavado de manos» › Insertar › Vínculo › Lugar de este documento › «3. Lavado de manos» › Aceptar.', 'Repite con «Vacunación» (diapositiva 4) y con «Más información» (Archivo o página web: https://www.gob.mx/salud).', 'En las diapositivas 3 y 4 vincula «Volver al menú» a «2. Menú: elige un tema».', 'Diapositiva 3: Insertar › Video › video-lavado-de-manos.mp4. En el panel Formato › Inicio: Automáticamente.', 'Diapositiva 1: Insertar › Audio › musica-sala-de-espera.wav. En el panel Formato pulsa «Reproducir en el fondo».', 'Presenta con F5 y prueba el menú.'] },
        experto: { instrucciones: ['Todo lo del nivel Analista.', 'Describe el video en las notas de su diapositiva (accesibilidad).', 'Agrega una «Info en pantalla» al vínculo web.', 'Presenta (F5) y prueba al menos dos vínculos.'] },
      },
    },
    lab: {
      archivo: 'lab05-prevencion-interactiva.pptx', titulo: 'Plática interactiva en PowerPoint',
      contexto: 'La presentación trae la portada, el menú con tres botones y las diapositivas «Lavado de manos» y «Vacunación» con su botón «Volver al menú». Descarga también el video y la música.',
      descargas: [{ ruta: 'assets/media/video-lavado-de-manos.mp4', texto: 'Video del lavado de manos (MP4)' }, { ruta: 'assets/media/musica-sala-de-espera.wav', texto: 'Música de fondo (WAV)' }],
      pasos: {
        explorador: [{ texto: 'Menú: selecciona cada botón › Insertar › Vínculo › Lugar de este documento › elige su diapositiva («Más información»: Archivo o página web existente › https://www.gob.mx/salud).', ruta: ['Insertar', 'Vínculo'] }, 'Vincula los botones «Volver al menú» a la diapositiva «Menú: elige un tema».', { texto: 'En «Lavado de manos»: Insertar › Video › Este dispositivo › el MP4. En Reproducción › Inicio: Automáticamente.', ruta: ['Insertar', 'Video', 'Este dispositivo…'] }, { texto: 'En la portada: Insertar › Audio › Audio en Mi PC › la música. En Reproducción › Reproducir en el fondo.', ruta: ['Reproducción', 'Reproducir en el fondo'] }, 'Guarda y sube la presentación (el video queda incrustado, por eso pesa más).'],
        analista: ['Vínculos del menú (2 a diapositivas y 1 a una página web) y botones «Volver al menú».', 'Video incrustado que inicia automáticamente.', 'Música en la portada reproduciéndose en el fondo.', 'Guarda y sube la presentación.'],
        experto: ['Todo lo del nivel Analista.', 'El video se reproduce a pantalla completa.', 'Describe el video en las notas de su diapositiva.'],
      },
      notaWeb: 'PowerPoint para la web no inserta audio desde el equipo: usa PowerPoint de escritorio para este laboratorio.',
      pruebas: [
        { titulo: 'Vínculos del menú', fn: (P, A) => {
          const menu = A.buscar(P, /men[uú]/i);
          if (!menu) return 'No encontré la diapositiva del menú.';
          const fs = A.formas(menu);
          const de = (re) => fs.find((f) => re.test(f.texto || ''));
          const lav = A.buscar(P, /^lavado de manos$/i), vac = P.diapositivas.find((d) => /^vacunaci[oó]n$/i.test(d.titulo));
          const v1 = de(/lavado/i), v2 = de(/vacunaci/i), v3 = de(/informaci/i);
          if (!v1 || !v1.vinculos.some((v) => v.tipo === 'diapositiva' && lav && v.n === lav.n)) return '«Lavado de manos» debe llevar a su diapositiva.';
          if (!v2 || !v2.vinculos.some((v) => v.tipo === 'diapositiva' && vac && v.n === vac.n)) return '«Vacunación» debe llevar a su diapositiva.';
          return v3 && v3.vinculos.some((v) => v.tipo === 'url' && /^https?:\/\//i.test(v.destino)) ? true : '«Más información» debe abrir una página web (dirección completa con https://).';
        } },
        { titulo: 'Botones «Volver al menú»', fn: (P, A) => { const menu = A.buscar(P, /men[uú]/i); const bs = P.diapositivas.flatMap((d) => A.formas(d).filter((f) => /volver/i.test(f.texto || ''))); if (bs.length < 2) return 'No encontré los dos botones «Volver al menú».'; return bs.every((b) => b.vinculos.some((v) => v.tipo === 'diapositiva' && menu && v.n === menu.n)) ? true : 'Los botones «Volver al menú» deben llevar a la diapositiva del menú.'; } },
        { titulo: 'Video incrustado que inicia solo', fn: (P) => { const d = P.diapositivas.find((x) => /^lavado de manos$/i.test(x.titulo)); const v = d && d.medios.find((m) => m.tipo === 'video'); if (!v) return 'Inserta el video en la diapositiva «Lavado de manos».'; if (v.externo) return 'Inserta el video desde el dispositivo (no vinculado).'; return v.inicio === 'auto' ? true : 'En Reproducción › Inicio elige «Automáticamente».'; } },
        { titulo: 'Música en el fondo', fn: (P) => { const d = P.diapositivas[0]; const a = d && d.medios.find((m) => m.tipo === 'audio'); if (!a) return 'Inserta la música en la portada.'; if (!a.todasDiapositivas) return 'La música debe seguir en todas las diapositivas (Reproducción › Reproducir en el fondo).'; if (!a.repetir) return 'Activa «Repetir la reproducción hasta su interrupción».'; if (!a.ocultar) return 'Oculta el icono durante la presentación.'; return a.inicio === 'auto' ? true : 'La música debe iniciar automáticamente.'; } },
        { titulo: 'Video a pantalla completa', nivel: 'experto', fn: (P) => { const d = P.diapositivas.find((x) => /^lavado de manos$/i.test(x.titulo)); const v = d && d.medios.find((m) => m.tipo === 'video'); return v && v.pantallaCompleta ? true : 'Activa Reproducción › Reproducir a pantalla completa.'; } },
        { titulo: 'Descripción del video en las notas', nivel: 'experto', fn: (P) => { const d = P.diapositivas.find((x) => /^lavado de manos$/i.test(x.titulo)); return d && d.notas.length >= 30 ? true : 'Describe el video en las notas de «Lavado de manos» (30 caracteres o más).'; } },
      ],
    },
    donde: [
      { comando: 'Video desde este dispositivo', ruta: ['Insertar', 'Video', 'Este dispositivo…'] },
      { comando: 'Audio en Mi PC', ruta: ['Insertar', 'Audio', 'Audio en Mi PC…'] },
      { comando: 'Reproducir en el fondo', ruta: ['Reproducción', 'Reproducir en el fondo'], nota: 'La pestaña Reproducción aparece al seleccionar el audio o el video.' },
      { comando: 'Inicio automático del video', ruta: ['Reproducción', 'Inicio'] },
      { comando: 'Vínculo a otra diapositiva', ruta: ['Insertar', 'Vínculo'], nota: 'Atajo: Ctrl+Alt+K.' },
    ],
    glosario: [
      ['Hipervínculo', 'Hyperlink', 'Texto u objeto que, al hacer clic en la presentación, lleva a una diapositiva, una página web o un correo.'],
      ['Lugar de este documento', 'Place in This Document', 'Vínculo a otra diapositiva de la misma presentación.'],
      ['Reproducir en el fondo', 'Play in Background', 'Audio que inicia solo, sigue en todas las diapositivas, se repite y oculta su icono.'],
      ['Marco de póster', 'Poster Frame', 'Imagen que muestra el video antes de reproducirse.'],
      ['Incrustar', 'Embed', 'Guardar el video o audio dentro del archivo .pptx (no depende de otra carpeta).'],
    ],
    atajos: ['<kbd>Ctrl+Alt+K</kbd> insertar vínculo (PowerPoint en español).', 'Durante la presentación, <kbd>Alt+P</kbd> reproduce o pausa el video y <kbd>Alt+Q</kbd> lo detiene.'],
  });
})();

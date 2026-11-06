/* Módulo 7 · Animaciones: por objeto, trayectorias, panel de animación e intervalos */
(function () {
  const { h } = LT.u;
  const { porClave, revisor, K, R, centro, catalogo, escenario, capaInicial } = LT.ppt;

  const consejo = (n, texto, y) => ({ clave: 'c' + n, nombre: 'Consejo ' + n, tipo: 'forma', forma: 'redondeado', texto, x: 120, y, w: 720, h: 80, estilo: { tam: 24 }, relleno: 'tema:acento' + n });
  const inicial = () => LT.Diapo.construir({
    titulo: 'Influenza', tema: 'vital', variante: 0,
    diapositivas: [
      { clave: 'transmision', diseno: 'soloTitulo', titulo: '¿Cómo se transmite la influenza?', objetos: [
        { clave: 'enferma', nombre: 'Persona enferma', tipo: 'icono', icono: 'persona', x: 90, y: 190, w: 150, h: 150, color: 'tema:acento1', alt: 'Persona enferma que tose' },
        { clave: 'virus', nombre: 'Virus', tipo: 'icono', icono: 'virus', x: 265, y: 225, w: 80, h: 80, color: 'tema:acento4', alt: 'Virus de la influenza' },
        { clave: 'sana', nombre: 'Persona sana', tipo: 'icono', icono: 'persona', x: 720, y: 190, w: 150, h: 150, color: 'tema:acento3', alt: 'Persona sana' },
        { clave: 'mensaje', nombre: 'Mensaje clave', tipo: 'forma', forma: 'redondeado', texto: 'Cúbrete al toser y estornudar', x: 230, y: 410, w: 500, h: 80, estilo: { tam: 26 } },
      ] },
      { clave: 'prevencion', diseno: 'soloTitulo', titulo: 'Así te proteges', objetos: [consejo(1, 'Consejo 1: Vacúnate cada año', 140), consejo(2, 'Consejo 2: Lávate las manos con frecuencia', 245), consejo(3, 'Consejo 3: Si tienes síntomas, quédate en casa', 350)],
        animaciones: [{ objeto: 'c3', efecto: 'desvanecer', inicio: 'clic' }, { objeto: 'c1', efecto: 'desvanecer', inicio: 'clic' }, { objeto: 'c2', efecto: 'desvanecer', inicio: 'clic' }] },
    ],
  });
  const finTrayectoria = (o, a) => { const t = a.trayectoria || K.trayectoriaInicial(a.efecto, a.opcion); const q = K.puntosTrayectoria(t, 40).pop(); const c = centro(o); return { x: c.x + q[0], y: c.y + q[1] }; };

  function verificar(ed, nivel) {
    const p = ed.p;
    const add = revisor();
    const d1 = porClave(p, 'transmision'), d2 = porClave(p, 'prevencion');
    const ob = (d, c) => d && d.objetos.find((o) => o.clave === c);
    const virus = ob(d1, 'virus'), sana = ob(d1, 'sana'), msj = ob(d1, 'mensaje');
    const A1 = d1 ? d1.animaciones : [];
    const tray = virus && A1.find((a) => a.objeto === virus.id && a.cat === 'trayectoria');
    add(!!tray, 'Trayectoria del virus', 'Selecciona el virus › Animaciones › Trayectorias (Líneas o Arcos).');
    if (tray && sana) {
      const f = finTrayectoria(virus, tray), c = centro(sana);
      add(Math.hypot(f.x - c.x, f.y - c.y) <= 90, 'El virus llega a la persona sana', 'Arrastra el punto rojo del final de la trayectoria hasta la persona sana (con el virus seleccionado en la pestaña Animaciones).');
      add(tray.inicio !== 'clic', 'El virus se mueve solo', 'Cambia el Inicio de la trayectoria a «Después de la anterior» (o «Con la anterior»).');
    }
    const enf = msj && A1.find((a) => a.objeto === msj.id && a.cat === 'enfasis');
    add(!!enf && A1[A1.length - 1] === enf, 'Énfasis final en el mensaje clave', !enf ? 'Aplica un efecto de énfasis (por ejemplo Impulso) al «Mensaje clave».' : 'El énfasis del «Mensaje clave» debe ser la última animación (Panel de animación › Mover después).');
    const A2 = d2 ? d2.animaciones.filter((a) => a.cat === 'entrada') : [];
    const ids = ['c1', 'c2', 'c3'].map((c) => ob(d2, c)).map((o) => o && o.id);
    const orden = A2.map((a) => ids.indexOf(a.objeto)).filter((i) => i >= 0);
    add(orden.length === 3 && orden.join() === '0,1,2', 'Consejos en orden 1, 2, 3', 'En el Panel de animación deja los consejos en orden: Consejo 1, Consejo 2 y Consejo 3 (Mover antes / Mover después).');
    const an = (i) => A2.find((a) => a.objeto === ids[i]);
    add(an(0) && an(0).inicio === 'clic' && [1, 2].every((i) => an(i) && an(i).inicio === 'despues'), 'Un clic y luego automático', '«Consejo 1» inicia al hacer clic; «Consejo 2» y «Consejo 3», Después de la anterior.');
    add([1, 2].every((i) => an(i) && an(i).retraso >= 0.25 && an(i).retraso <= 2), 'Retraso entre consejos', 'Pon un Retraso de 0.25 a 2 s en «Consejo 2» y «Consejo 3» para que el público alcance a leer.');
    const todas = A1.concat(d2 ? d2.animaciones : []);
    const mala = todas.find((a) => !['aparecer', 'desaparecer'].includes(a.efecto) && (a.duracion < 0.25 || a.duracion > 2));
    add(!mala, 'Duraciones entre 0.25 y 2 s', mala ? 'Una animación dura ' + mala.duracion + ' s: usa entre 0.25 y 2 s.' : '');
    if (nivel === 'experto') {
      const ent = virus && A1.find((a) => a.objeto === virus.id && a.cat === 'entrada');
      add(!!ent && tray && A1.indexOf(ent) < A1.indexOf(tray), 'El virus aparece y luego se mueve', 'Agrega al virus una animación de entrada antes de la trayectoria (Animaciones › Agregar animación).');
      add(!!enf && enf.inicio === 'despues', 'Énfasis automático', 'El énfasis del mensaje clave debe iniciar «Después de la anterior».');
    }
    return add.lista;
  }
  function crearReto(cont, nivel, extra) {
    return LT.modulo.retoSimulador(cont, { presentacion: inicial(), herramientas: ['animaciones', 'inicio', 'presentacion'], pestana: 'animaciones', verificar }, extra);
  }

  /* Demostración de las cuatro categorías sobre el mismo objeto */
  function cuatro(c) {
    const p = LT.Diapo.construir({ tema: 'vital', diapositivas: [{ diseno: 'blanco', objetos: [{ clave: 'v', tipo: 'icono', icono: 'virus', x: 400, y: 190, w: 160, h: 160, color: 'tema:acento4' }] }] });
    const d = p.diapositivas[0];
    const caja = h('div');
    const fila = h('div', { class: 'grupo-btn', style: { marginTop: '8px' } });
    c.append(caja, fila);
    setTimeout(() => {
      const esc = escenario(caja, Math.min(520, c.clientWidth || 520));
      capaInicial(esc, p, d);
      const jugar = (efecto, opcion) => {
        esc.limpiar();
        const def = K.animacion(efecto);
        const dd = JSON.parse(JSON.stringify(d));
        dd.animaciones = [{ id: 'q', objeto: dd.objetos[0].id, efecto, cat: def.cat, opcion, inicio: 'clic', duracion: Math.max(0.6, def.dur), retraso: 0, trayectoria: def.cat === 'trayectoria' ? K.trayectoriaInicial(efecto, opcion) : undefined }];
        const capa = capaInicial(esc, p, dd);
        esc.preparar(capa, dd);
        esc.ejecutar(capa, dd, R.pasos(dd)[0]).then(() => setTimeout(() => { if (def.cat === 'salida' || def.cat === 'trayectoria') capaInicial(esc, p, d); }, 700));
      };
      [['zoom', 'Entrada: Zoom', '#2e8540'], ['impulso', 'Énfasis: Impulso', '#9a7b00'], ['desvanecerSalida', 'Salida: Desvanecer', '#c0392b'], ['arcos', 'Trayectoria: Arcos', '#5d6d7e', 'Derecha']].forEach(([ef, t, col, op]) => fila.appendChild(h('button', { class: 'btn chico', style: { borderColor: col, color: col }, onclick: () => jugar(ef, op) }, '▶ ' + t)));
    }, 0);
  }

  LT.definirModulo({
    id: 7,
    objetivo: 'Animar objetos con efectos de entrada, énfasis, salida y trayectorias, y ordenarlos y temporizarlos con el panel de animación.',
    situacion: 'En la plática sobre <b>influenza</b> quiero explicar cómo se transmite: que el virus «viaje» de la persona que tose a otra, que los consejos aparezcan uno por uno en el orden correcto y que el mensaje clave destaque al final.',
    explicacion: [
      { html: '<h3>Cuatro tipos de animación por objeto</h3><ul><li><b style="color:#2e8540">Entrada</b> (verde): el objeto aparece (Aparecer, Desvanecer, Desplazar hacia arriba, Barrido, Zoom).</li><li><b style="color:#9a7b00">Énfasis</b> (amarillo): llama la atención sin salir (Impulso, Pulso de color, Balancín, Girar).</li><li><b style="color:#c0392b">Salida</b> (rojo): el objeto desaparece.</li><li><b style="color:#5d6d7e">Trayectorias de la animación</b>: el objeto se mueve por una ruta (Líneas, Arcos, Giros, Formas, Bucles o una ruta personalizada). El punto verde marca el inicio y el rojo el final: arrástralo para ajustar el destino.</li></ul><p>La galería <b>reemplaza</b> la animación del objeto; <b>Agregar animación</b> suma otra (por ejemplo, entrada + trayectoria + salida).</p>' },
      { titulo: 'Las cuatro categorías sobre el mismo objeto', widget: cuatro },
      { html: '<h3>Panel de animación e intervalos</h3><ul><li><b>Animaciones › Panel de animación</b> lista los efectos en orden. El número indica en qué clic ocurre; la barra, cuándo empieza y cuánto dura.</li><li><b>Inicio</b>: <i>Al hacer clic</i> (espera un clic), <i>Con la anterior</i> (al mismo tiempo) o <i>Después de la anterior</i> (cuando termina la anterior).</li><li><b>Duración</b> (velocidad) y <b>Retraso</b> (espera antes de empezar): entre 0.5 y 1 s suele bastar.</li><li><b>Reordenar animación</b>: Mover antes / Mover después.</li></ul><p>Anima con propósito: revelar ideas en orden, señalar algo, mostrar un proceso. Evita animar todo, el texto letra por letra y los efectos lentos.</p>' },
      { titulo: 'Catálogo de animaciones', instr: 'Haz clic en un efecto para verlo.', widget: (c) => catalogo(c, 'animaciones') },
    ],
    ejemplo: {
      titulo: 'Mover un objeto por una trayectoria',
      pasos: [
        { texto: 'Selecciona el objeto › Animaciones › Trayectorias de la animación › Líneas.', ruta: ['Animaciones', 'Galería de animaciones'] },
        { texto: 'Opciones de efectos › Derecha.', ruta: ['Animaciones', 'Opciones de efectos'] },
        'Arrastra el punto rojo (final) hasta el destino.',
        { texto: 'Intervalos › Inicio: Después de la anterior; Duración: 2 s.', ruta: ['Animaciones', 'Inicio'] },
        { texto: 'Revisa el orden en Animaciones › Panel de animación.', ruta: ['Animaciones', 'Panel de animación'] },
      ],
      pregunta: { texto: 'En el panel aparecen: Título (Al hacer clic), Viñeta 1 (Con la anterior) y Viñeta 2 (Después de la anterior). ¿Cuántos clics se necesitan para verlo todo?', opciones: ['1', '2', '3', 'Ninguno'], correcta: 0, explicacion: 'Solo la primera espera un clic; las otras dos se encadenan solas.' },
    },
    micro: [
      { titulo: 'Categorías de animación', tipo: 'clasificar', ancho: true, enunciado: '¿Qué tipo de animación usarías en cada caso?', categorias: ['Entrada', 'Énfasis', 'Salida', 'Trayectoria'], items: [['Los consejos aparecen uno por uno', 0, 'Aparecer es una entrada.'], ['El mensaje clave pulsa para destacar', 1, 'Destacar sin aparecer ni salir es énfasis.'], ['El virus se desplaza hacia otra persona', 3, 'Moverse por una ruta es una trayectoria.'], ['La nube de la tos se desvanece y se va', 2, 'Desaparecer es una salida.']] },
      { titulo: 'Intervalos', tipo: 'opcion', enunciado: 'Quieres que el virus empiece a moverse 1 segundo después de que aparezca la persona, sin hacer clic.', opciones: ['Inicio: Al hacer clic; Retraso: 1', 'Inicio: Después de la anterior; Retraso: 1', 'Inicio: Con la anterior; Duración: 1', 'Una transición de 1 s'], correcta: 1, explicacion: '<b>Después de la anterior</b> encadena sin clic y el <b>Retraso</b> espera 1 segundo.' },
      { titulo: 'El orden en el panel', tipo: 'ordenar', enunciado: 'Ordena las animaciones para contar la transmisión.', items: ['Persona enferma (entrada)', 'Gotitas de la tos (entrada, con la anterior)', 'Virus (trayectoria hacia la persona sana)', 'Mensaje clave (énfasis)'], mezcla: [3, 2, 0, 1] },
      { titulo: 'Reordena con el panel de animación', tipo: 'widget', ancho: true, enunciado: 'En el Panel de animación, deja el «Mensaje clave» como última animación (selecciónalo en el panel y usa ▼ Mover después).', crear: (c, listo) => {
        const p = LT.Diapo.construir({ tema: 'vital', diapositivas: [{ diseno: 'soloTitulo', titulo: 'Así se previene',
          objetos: [{ clave: 'm', nombre: 'Mensaje clave', tipo: 'forma', forma: 'redondeado', texto: 'Vacúnate cada año', x: 260, y: 380, w: 440, h: 80, estilo: { tam: 24 } }, { clave: 'a', nombre: 'Jeringa', tipo: 'icono', icono: 'jeringa', x: 300, y: 170, w: 130, h: 130 }, { clave: 'b', nombre: 'Escudo', tipo: 'icono', icono: 'escudo', x: 530, y: 170, w: 130, h: 130 }],
          animaciones: [{ objeto: 'm', efecto: 'impulso', inicio: 'clic' }, { objeto: 'a', efecto: 'zoom', inicio: 'clic' }, { objeto: 'b', efecto: 'zoom', inicio: 'despues' }] }] });
        const ed = new LT.Diapo(c, { presentacion: p, herramientas: ['animaciones'], alto: 470, notas: false, panel: 'animacion' });
        const retro = h('div');
        c.appendChild(retro);
        ed.on('cambio', () => { const A = ed.d.animaciones; const m = ed.d.objetos.find((o) => o.nombre === 'Mensaje clave'); if (A.length && m && A[A.length - 1].objeto === m.id) { retro.innerHTML = ''; retro.appendChild(h('div', { class: 'aviso-caja ok' }, '✓ Ahora el mensaje clave cierra la secuencia.')); listo(); } });
      } },
    ],
    reto: {
      titulo: 'Animar la transmisión de la influenza', tipo: 'widget', crear: crearReto,
      base: {
        instrucciones: ['Diapositiva 1: el virus se mueve por una trayectoria hasta la persona sana, sin esperar clic.', 'Diapositiva 1: el «Mensaje clave» tiene un efecto de énfasis y es la última animación.', 'Diapositiva 2: en el Panel de animación deja los consejos en orden 1, 2, 3.', 'Diapositiva 2: «Consejo 1» inicia al hacer clic; «Consejo 2» y «Consejo 3» Después de la anterior, con un retraso de 0.25 a 2 s.', 'Todas las animaciones duran entre 0.25 y 2 s.'],
        pistas: ['Las trayectorias están al final de la galería de Animaciones. El orden y los tiempos se ajustan en el Panel de animación.', 'Con el virus seleccionado verás su ruta: arrastra el punto rojo. En el panel, selecciona una animación para cambiar Inicio, Duración y Retraso o para moverla con ▲ ▼.', 'Virus: Líneas › Opciones de efectos: Derecha › arrastra el punto rojo a la persona sana › Inicio: Después de la anterior. Mensaje clave: Impulso. Diapositiva 2: mueve Consejo 1 arriba; Consejo 2 y 3: Después de la anterior, Retraso 0.5.'],
      },
      niveles: {
        explorador: { instrucciones: ['Diapositiva 1: haz clic en el virus › Animaciones › Líneas (Trayectorias). Opciones de efectos › Derecha.', 'Arrastra el punto rojo del final de la ruta hasta la persona sana.', 'En Inicio elige «Después de la anterior».', 'Haz clic en «Mensaje clave» › Animaciones › Impulso (Énfasis).', 'Diapositiva 2: abre el Panel de animación. Haz clic en «Consejo 1» y pulsa ▲ hasta dejarlo primero; deja «Consejo 2» en segundo lugar.', 'En el panel, selecciona «Consejo 2»: Inicio «Después de la anterior», Retraso 0.5. Repite con «Consejo 3».', 'Pulsa «▶ Reproducir todo» para revisar.'] },
        experto: { instrucciones: ['Todo lo del nivel Analista.', 'El virus primero aparece (efecto de entrada) y después se mueve: usa «Agregar animación».', 'El énfasis del mensaje clave inicia «Después de la anterior».'] },
      },
    },
    lab: {
      archivo: 'lab07-influenza-animada.pptx', titulo: 'Animaciones de la plática en PowerPoint',
      contexto: 'La diapositiva 1 tiene a la persona enferma, el virus, la persona sana y el mensaje clave (sin animaciones). En la 2, los tres consejos tienen animaciones en desorden.',
      nota: 'No cambies los nombres de los objetos (Panel de selección): el verificador los usa.',
      pasos: {
        explorador: [{ texto: 'Diapositiva 1: selecciona el virus › Animaciones › Líneas (Trayectorias de la animación) › Opciones de efectos › Derecha.', ruta: ['Animaciones', 'Opciones de efectos'] }, 'Arrastra el punto rojo de la ruta hasta la persona sana.', { texto: 'Animaciones › Inicio: Después de la anterior.', ruta: ['Animaciones', 'Inicio'] }, 'Selecciona «Mensaje clave» › Impulso (Énfasis).', { texto: 'Diapositiva 2: Animaciones › Panel de animación; ordena los consejos 1, 2, 3 con Mover antes / Mover después.', ruta: ['Animaciones', 'Panel de animación'] }, 'Consejos 2 y 3: Inicio «Después de la anterior», Retraso 00.50.', 'Guarda y sube la presentación.'],
        analista: ['Trayectoria del virus hasta la persona sana, sin clic.', 'Énfasis final en el mensaje clave.', 'Consejos en orden; el primero al hacer clic y los otros después de la anterior con retraso.', 'Duraciones entre 0.25 y 2 s.', 'Guarda y sube la presentación.'],
        experto: ['Todo lo del nivel Analista.', 'El virus tiene una entrada antes de su trayectoria (Agregar animación).'],
      },
      pruebas: [
        { titulo: 'Trayectoria del virus hasta la persona sana', fn: (P, A) => {
          const d = A.buscar(P, /transmite/i);
          if (!d) return 'No encontré la diapositiva «¿Cómo se transmite la influenza?».';
          const fs = A.formas(d);
          const v = fs.find((f) => /^virus/i.test(f.nombre)), s = fs.find((f) => /sana/i.test(f.nombre));
          if (!v || !s) return 'No encontré el virus o la persona sana: no cambies los nombres de los objetos.';
          const t = d.animaciones.find((a) => a.spid === v.id && a.clase === 'path');
          if (!t) return 'Aplica al virus una trayectoria (Animaciones › Líneas o Arcos).';
          if (!t.finRuta) return 'No pude leer la ruta del virus.';
          const fx = v.x + v.cx / 2 + t.finRuta.x * P.tamano.cx, fy = v.y + v.cy / 2 + t.finRuta.y * P.tamano.cy;
          const sx = s.x + s.cx / 2, sy = s.y + s.cy / 2;
          if (Math.hypot(fx - sx, fy - sy) > P.tamano.cx * 0.12) return 'La ruta del virus debe terminar sobre la persona sana: arrastra el punto rojo.';
          return t.inicio === 'clic' ? 'Cambia el Inicio de la trayectoria a «Después de la anterior».' : true;
        } },
        { titulo: 'Énfasis final en el mensaje clave', fn: (P, A) => { const d = A.buscar(P, /transmite/i); const m = d && A.formas(d).find((f) => /mensaje/i.test(f.nombre)); if (!m) return 'No encontré el «Mensaje clave».'; const an = d.animaciones.filter((a) => a.clase !== 'mediacall'); const e = an.find((a) => a.spid === m.id && a.clase === 'emph'); if (!e) return 'Aplica un efecto de énfasis al «Mensaje clave».'; return an[an.length - 1] === e ? true : 'El énfasis del mensaje clave debe ser la última animación.'; } },
        { titulo: 'Consejos en orden 1, 2, 3', fn: (P, A) => { const d = A.buscar(P, /te proteges/i); if (!d) return 'No encontré «Así te proteges».'; const nombres = d.animaciones.filter((a) => a.clase === 'entr').map((a) => (/consejo\s*(\d)/i.exec(a.objeto) || [])[1]).filter(Boolean); return nombres.join() === '1,2,3' ? true : 'En el Panel de animación el orden es ' + nombres.join(', ') + ': déjalo 1, 2, 3.'; } },
        { titulo: 'Un clic y después automático, con retraso', fn: (P, A) => { const d = A.buscar(P, /te proteges/i); const an = (n) => d && d.animaciones.find((a) => a.clase === 'entr' && new RegExp('consejo\\s*' + n, 'i').test(a.objeto)); if (!an(1) || an(1).inicio !== 'clic') return '«Consejo 1» debe iniciar al hacer clic.'; for (const n of [2, 3]) { const a = an(n); if (!a || a.inicio !== 'despues') return '«Consejo ' + n + '» debe iniciar «Después de la anterior».'; if (a.retraso < 0.25 || a.retraso > 2) return 'Pon un retraso de 0.25 a 2 s en «Consejo ' + n + '».'; } return true; } },
        { titulo: 'Duraciones entre 0.25 y 2 s', fn: (P) => { for (const d of P.diapositivas) for (const a of d.animaciones) { if (a.clase === 'mediacall' || a.presetID === 1) continue; if (a.duracion && (a.duracion < 0.25 || a.duracion > 2)) return 'Una animación de la diapositiva ' + d.n + ' dura ' + a.duracion + ' s.'; } return true; } },
        { titulo: 'El virus aparece antes de moverse', nivel: 'experto', fn: (P, A) => { const d = A.buscar(P, /transmite/i); const v = d && A.formas(d).find((f) => /^virus/i.test(f.nombre)); if (!v) return 'No encontré el virus.'; const an = d.animaciones; const e = an.findIndex((a) => a.spid === v.id && a.clase === 'entr'); const t = an.findIndex((a) => a.spid === v.id && a.clase === 'path'); return e >= 0 && t > e ? true : 'Agrega al virus una animación de entrada antes de su trayectoria (Agregar animación).'; } },
      ],
    },
    donde: [
      { comando: 'Trayectorias de la animación', ruta: ['Animaciones', 'Agregar animación', 'Trayectorias de la animación'] },
      { comando: 'Panel de animación', ruta: ['Animaciones', 'Panel de animación'] },
      { comando: 'Inicio: Después de la anterior', ruta: ['Animaciones', 'Inicio'] },
      { comando: 'Retraso', ruta: ['Animaciones', 'Retraso'] },
      { comando: 'Mover antes', ruta: ['Animaciones', 'Mover antes'], nota: 'Grupo Intervalos › Reordenar animación.' },
    ],
    glosario: [
      ['Efecto de entrada', 'Entrance effect', 'Hace aparecer un objeto.'],
      ['Efecto de énfasis', 'Emphasis effect', 'Destaca un objeto que ya está visible.'],
      ['Efecto de salida', 'Exit effect', 'Hace desaparecer un objeto.'],
      ['Trayectoria de la animación', 'Motion path', 'Ruta por la que se mueve un objeto.'],
      ['Panel de animación', 'Animation Pane', 'Lista ordenada de las animaciones de la diapositiva con sus tiempos.'],
      ['Retraso', 'Delay', 'Tiempo de espera antes de que empiece una animación.'],
    ],
    atajos: ['En el Panel de animación, <kbd>Ctrl</kbd> + clic selecciona varias animaciones para cambiar su inicio a la vez.', 'El pincel <b>Copiar animación</b> (Animaciones › Animación avanzada) copia los efectos de un objeto a otro.'],
  });
})();

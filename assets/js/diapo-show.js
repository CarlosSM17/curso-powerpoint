/* Presentación con diapositivas del simulador: transiciones entre diapositivas, animaciones por objeto
   (entrada, énfasis, salida y trayectorias), avance automático con intervalos, modo quiosco con repetición,
   ensayo de intervalos y vista del moderador. Usa la API Web Animations del navegador. */
(function () {
  'use strict';
  const LT = window.LT;
  const { h } = LT.u;
  const K = LT.DIAPO;
  const R = LT.DiapoRender;
  const W = K.ANCHO, H = K.ALTO;
  const ms = (s) => Math.max(1, Math.round((s || 0) * 1000));

  /* ---------------------------------------------------- fotogramas de efectos */
  function fotogramasEntrada(a, o) {
    const op = a.opcion || '';
    switch (a.efecto) {
      case 'aparecer': return [{ opacity: 1 }, { opacity: 1 }];
      case 'desvanecer': return [{ opacity: 0 }, { opacity: 1 }];
      case 'desplazar': {
        let dx = 0, dy = H - o.y + 10;
        if (/arriba/i.test(op)) dy = -(o.y + o.h + 10);
        if (/izquierda/i.test(op)) { dx = -(o.x + o.w + 10); dy = 0; }
        if (/derecha/i.test(op)) { dx = W - o.x + 10; dy = 0; }
        return [{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'translate(0,0)' }];
      }
      case 'flotar': return [{ opacity: 0, transform: 'translateY(' + (/abajo/i.test(op) ? -50 : 50) + 'px)' }, { opacity: 1, transform: 'translateY(0)' }];
      case 'dividir': return /vertical/i.test(op) ? [{ clipPath: 'inset(0 50% 0 50%)' }, { clipPath: 'inset(0 0% 0 0%)' }] : [{ clipPath: 'inset(50% 0 50% 0)' }, { clipPath: 'inset(0% 0 0% 0)' }];
      case 'barrido': {
        const ini = /izquierda/i.test(op) ? 'inset(0 100% 0 0)' : /derecha/i.test(op) ? 'inset(0 0 0 100%)' : /arriba/i.test(op) ? 'inset(0 0 100% 0)' : 'inset(100% 0 0 0)';
        return [{ clipPath: ini }, { clipPath: 'inset(0 0 0 0)' }];
      }
      case 'zoom': return [{ opacity: 0, transform: 'scale(.3)' }, { opacity: 1, transform: 'scale(1)' }];
      case 'crecer': return [{ opacity: 0, transform: 'scale(.2) rotate(-90deg)' }, { opacity: 1, transform: 'scale(1) rotate(0deg)' }];
      case 'rebote': return [{ opacity: 0, transform: 'translateY(-260px)', offset: 0 }, { opacity: 1, transform: 'translateY(0)', offset: 0.45 }, { transform: 'translateY(-60px)', offset: 0.62 }, { transform: 'translateY(0)', offset: 0.78 }, { transform: 'translateY(-16px)', offset: 0.89 }, { opacity: 1, transform: 'translateY(0)', offset: 1 }];
      default: return [{ opacity: 0 }, { opacity: 1 }];
    }
  }
  function fotogramasSalida(a, o) {
    const op = a.opcion || '';
    switch (a.efecto) {
      case 'desaparecer': return [{ opacity: 1 }, { opacity: 1 }];
      case 'desplazarSalida': {
        let dx = 0, dy = H - o.y + 10;
        if (/arriba/i.test(op)) dy = -(o.y + o.h + 10);
        if (/izquierda/i.test(op)) { dx = -(o.x + o.w + 10); dy = 0; }
        if (/derecha/i.test(op)) { dx = W - o.x + 10; dy = 0; }
        return [{ transform: 'translate(0,0)' }, { transform: 'translate(' + dx + 'px,' + dy + 'px)' }];
      }
      case 'flotarSalida': return [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(-50px)' }];
      case 'zoomSalida': return [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.3)' }];
      case 'reducir': return [{ opacity: 1, transform: 'scale(1) rotate(0deg)' }, { opacity: 0, transform: 'scale(.2) rotate(90deg)' }];
      default: return [{ opacity: 1 }, { opacity: 0 }];
    }
  }
  function fotogramasEnfasis(a) {
    switch (a.efecto) {
      case 'impulso': return { f: [{ scale: '1' }, { scale: '1.12' }, { scale: '1' }], fill: 'none' };
      case 'pulsoColor': return { f: [{ filter: 'none' }, { filter: 'brightness(1.35) saturate(1.8) drop-shadow(0 0 14px rgba(255,190,0,.95))' }, { filter: 'none' }], fill: 'none' };
      case 'balancin': return { f: [{ rotate: '0deg' }, { rotate: '6deg' }, { rotate: '-6deg' }, { rotate: '6deg' }, { rotate: '-6deg' }, { rotate: '0deg' }], fill: 'none' };
      case 'girar': return { f: [{ rotate: '0deg' }, { rotate: '360deg' }], fill: 'none' };
      case 'aumentar': return { f: [{ scale: '1' }, { scale: '1.5' }], fill: 'forwards' };
      case 'transparencia': return { f: [{ opacity: 1 }, { opacity: 0.45 }], fill: 'forwards' };
      default: return { f: [{ scale: '1' }, { scale: '1.1' }, { scale: '1' }], fill: 'none' };
    }
  }

  /* ============================================================ escenario */
  // Contenedor 16:9 con capas (una por diapositiva) donde corren transiciones y animaciones.
  class Escenario {
    constructor(cont, p, opc) {
      this.cont = cont;
      this.p = p;
      this.opc = opc || {};
      this.el = h('div', { class: 'dps-escenario' });
      cont.appendChild(this.el);
      this.capa = null;
      this.vivas = [];
      this.timers = [];
      this.escala = 1;
    }
    medir(ancho, alto) {
      const s = Math.min(ancho / W, alto / H);
      this.escala = s;
      Object.assign(this.el.style, { width: Math.round(W * s) + 'px', height: Math.round(H * s) + 'px' });
      this.el.querySelectorAll('.dps-capa > .dp-diapo').forEach((d) => { d.style.transform = 'scale(' + s + ')'; });
    }
    capaDe(d) {
      const capa = h('div', { class: 'dps-capa' });
      const s = R.diapositiva(this.p, d, { modo: 'show', silencio: this.opc.silencio });
      s.style.transform = 'scale(' + this.escala + ')';
      capa.appendChild(s);
      capa.__d = d;
      return capa;
    }
    limpiar() {
      this.timers.forEach(clearTimeout);
      this.timers = [];
      this.vivas.forEach((a) => { try { a.finish(); } catch (e) { /* */ } });
      this.vivas = [];
    }
    /* Estado inicial: ocultos los objetos cuya primera animación es de entrada */
    preparar(capa, d, sinAnimacion) {
      if (sinAnimacion) return;
      const vistos = new Set();
      for (const a of d.animaciones) {
        if (vistos.has(a.objeto)) continue;
        vistos.add(a.objeto);
        if (a.cat === 'entrada') { const el = capa.querySelector('.dp-obj[data-id="' + a.objeto + '"]'); if (el) el.style.visibility = 'hidden'; }
      }
    }
    animarItem(capa, d, it) {
      const a = it.anim;
      const o = d.objetos.find((x) => x.id === a.objeto);
      const el = capa.querySelector('.dp-obj[data-id="' + a.objeto + '"]');
      if (!o || !el) return;
      const dur = ms(it.dur);
      let anim;
      if (a.cat === 'entrada') {
        el.style.visibility = 'visible';
        anim = el.animate(fotogramasEntrada(a, o), { duration: dur, easing: a.efecto === 'rebote' ? 'linear' : 'cubic-bezier(.2,.7,.3,1)', fill: 'forwards' });
      } else if (a.cat === 'salida') {
        anim = el.animate(fotogramasSalida(a, o), { duration: dur, easing: 'ease-in', fill: 'forwards' });
        anim.onfinish = () => { el.style.visibility = 'hidden'; };
      } else if (a.cat === 'enfasis') {
        const e = fotogramasEnfasis(a);
        anim = el.animate(e.f, { duration: dur, easing: 'ease-in-out', fill: e.fill });
      } else if (a.cat === 'trayectoria') {
        const t = a.trayectoria || K.trayectoriaInicial(a.efecto, a.opcion);
        const pts = K.puntosTrayectoria(t, 40);
        const off = el.__off || [0, 0];
        anim = el.animate(pts.map((q) => ({ translate: (off[0] + q[0]).toFixed(1) + 'px ' + (off[1] + q[1]).toFixed(1) + 'px' })), { duration: dur, easing: 'ease-in-out', fill: 'forwards' });
        const fin = pts[pts.length - 1];
        el.__off = [off[0] + fin[0], off[1] + fin[1]];
      }
      if (anim) this.vivas.push(anim);
    }
    /* Ejecuta un paso (grupo de animaciones) y devuelve una promesa que se cumple al terminar */
    ejecutar(capa, d, g) {
      return new Promise((listo) => {
        for (const it of g.items) this.timers.push(setTimeout(() => this.animarItem(capa, d, it), ms(it.ini)));
        this.timers.push(setTimeout(listo, ms(g.fin) + 20));
      });
    }
    /* Transición de la capa vieja a la nueva */
    transicion(vieja, nueva, t) {
      const ef = t && t.efecto && t.efecto !== 'ninguna' ? t.efecto : null;
      this.el.appendChild(nueva);
      if (!vieja || !ef) { if (vieja) vieja.remove(); return Promise.resolve(); }
      const def = K.transicion(ef);
      const dur = ms(t.duracion == null ? def.dur : t.duracion);
      const op = t.opcion || (def.opciones || [])[0] || '';
      const anims = [];
      const A = (el, f, o) => { const x = el.animate(f, Object.assign({ duration: dur, easing: 'ease-in-out', fill: 'both' }, o || {})); anims.push(x); return x; };
      const dir = (s) => (/derecha/i.test(s) ? [1, 0] : /izquierda/i.test(s) ? [-1, 0] : /abajo/i.test(s) ? [0, 1] : /arriba/i.test(s) ? [0, -1] : [1, 0]);
      const tr = (v, k) => 'translate(' + v[0] * k + '%,' + v[1] * k + '%)';
      switch (ef) {
        case 'desvanecer':
          if (/negro/i.test(op)) { A(vieja, [{ opacity: 1 }, { opacity: 0 }], { duration: dur / 2 }); A(nueva, [{ opacity: 0 }, { opacity: 1 }], { duration: dur / 2, delay: dur / 2 }); }
          else A(nueva, [{ opacity: 0 }, { opacity: 1 }]);
          break;
        case 'empujar': { const v = dir(op); A(nueva, [{ transform: tr(v, 100) }, { transform: 'translate(0,0)' }]); A(vieja, [{ transform: 'translate(0,0)' }, { transform: tr(v, -100) }]); break; }
        case 'cubrir': { const v = dir(op); A(nueva, [{ transform: tr(v, 100) }, { transform: 'translate(0,0)' }]); break; }
        case 'descubrir': { const v = dir(op); this.el.appendChild(vieja); A(vieja, [{ transform: 'translate(0,0)' }, { transform: tr(v, -100) }]); break; }
        case 'barrido': {
          const ini = /izquierda/i.test(op) ? 'inset(0 100% 0 0)' : /abajo/i.test(op) ? 'inset(100% 0 0 0)' : /arriba/i.test(op) ? 'inset(0 0 100% 0)' : 'inset(0 0 0 100%)';
          A(nueva, [{ clipPath: ini }, { clipPath: 'inset(0 0 0 0)' }]);
          break;
        }
        case 'dividir':
          if (/entrada/i.test(op)) { this.el.appendChild(vieja); A(vieja, [{ clipPath: 'inset(0 0 0 0)' }, { clipPath: /vertical/i.test(op) ? 'inset(0 50% 0 50%)' : 'inset(50% 0 50% 0)' }]); }
          else A(nueva, [{ clipPath: /horizontal/i.test(op) ? 'inset(50% 0 50% 0)' : 'inset(0 50% 0 50%)' }, { clipPath: 'inset(0 0 0 0)' }]);
          break;
        case 'revelar': { const s = /izquierda/i.test(op) ? -1 : 1; A(vieja, [{ opacity: 1, transform: 'translateX(0)' }, { opacity: 0, transform: 'translateX(' + (-8 * s) + '%)' }], { duration: dur * 0.6 }); A(nueva, [{ opacity: 0, transform: 'translateX(' + (8 * s) + '%)' }, { opacity: 1, transform: 'translateX(0)' }], { duration: dur * 0.6, delay: dur * 0.4 }); break; }
        case 'cortar': if (/negro/i.test(op)) A(nueva, [{ opacity: 0 }, { opacity: 0, offset: 0.5 }, { opacity: 1 }], { easing: 'steps(1, end)' }); break;
        case 'forma':
          if (/rombo/i.test(op)) A(nueva, [{ clipPath: 'polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)' }, { clipPath: 'polygon(50% -60%, 160% 50%, 50% 160%, -60% 50%)' }]);
          else A(nueva, [{ clipPath: 'circle(0% at 50% 50%)' }, { clipPath: 'circle(75% at 50% 50%)' }]);
          break;
        case 'cortinas': {
          this.el.appendChild(vieja);
          const izq = vieja, der = vieja.cloneNode(true);
          this.el.appendChild(der);
          A(izq, [{ clipPath: 'inset(0 50% 0 0)', transform: 'translateX(0) scaleY(1)' }, { clipPath: 'inset(0 50% 0 0)', transform: 'translateX(-55%) scaleY(1.06)' }], { easing: 'ease-in' });
          const x = A(der, [{ clipPath: 'inset(0 0 0 50%)', transform: 'translateX(0) scaleY(1)' }, { clipPath: 'inset(0 0 0 50%)', transform: 'translateX(55%) scaleY(1.06)' }], { easing: 'ease-in' });
          x.onfinish = () => der.remove();
          break;
        }
        case 'voltear': { const s = /izquierda/i.test(op) ? -1 : 1; A(vieja, [{ transform: 'perspective(1600px) rotateY(0deg)' }, { transform: 'perspective(1600px) rotateY(' + 90 * s + 'deg)' }], { duration: dur / 2, easing: 'ease-in' }); A(nueva, [{ transform: 'perspective(1600px) rotateY(' + -90 * s + 'deg)' }, { transform: 'perspective(1600px) rotateY(0deg)' }], { duration: dur / 2, delay: dur / 2, easing: 'ease-out' }); break; }
        case 'galeria': { const s = /izquierda/i.test(op) ? -1 : 1; A(nueva, [{ transform: 'perspective(1400px) translateX(' + 100 * s + '%) rotateY(' + -35 * s + 'deg) scale(.8)' }, { transform: 'perspective(1400px) translateX(0) rotateY(0) scale(1)' }]); A(vieja, [{ transform: 'perspective(1400px) translateX(0) rotateY(0) scale(1)' }, { transform: 'perspective(1400px) translateX(' + -100 * s + '%) rotateY(' + 35 * s + 'deg) scale(.8)' }]); break; }
        case 'cubo': { const v = dir(op); const ry = v[0] ? 90 * v[0] : 0, rx = v[1] ? -90 * v[1] : 0; nueva.style.transformOrigin = v[0] > 0 ? 'left center' : v[0] < 0 ? 'right center' : v[1] > 0 ? 'center top' : 'center bottom'; vieja.style.transformOrigin = v[0] > 0 ? 'right center' : v[0] < 0 ? 'left center' : v[1] > 0 ? 'center bottom' : 'center top'; A(nueva, [{ transform: 'perspective(1600px) ' + tr(v, 100) + ' rotateY(' + ry + 'deg) rotateX(' + rx + 'deg)' }, { transform: 'perspective(1600px) translate(0,0) rotateY(0) rotateX(0)' }]); A(vieja, [{ transform: 'perspective(1600px) translate(0,0) rotateY(0) rotateX(0)' }, { transform: 'perspective(1600px) ' + tr(v, -100) + ' rotateY(' + -ry + 'deg) rotateX(' + -rx + 'deg)' }]); break; }
        case 'zoom':
          if (/fuera/i.test(op)) { this.el.appendChild(vieja); A(vieja, [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(.2)', opacity: 0 }]); A(nueva, [{ transform: 'scale(1.4)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }]); }
          else { A(nueva, [{ transform: 'scale(.2)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }]); A(vieja, [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(1.6)', opacity: 0 }]); }
          break;
        case 'vortice': A(nueva, [{ transform: 'rotate(-200deg) scale(.05)', opacity: 0 }, { transform: 'rotate(0) scale(1)', opacity: 1 }], { easing: 'cubic-bezier(.3,.6,.2,1)' }); A(vieja, [{ opacity: 1 }, { opacity: 0 }], { duration: dur * 0.5 }); break;
        case 'transformacion': {
          // los objetos con el mismo nombre se desplazan de su posición anterior a la nueva
          const d0 = vieja.__d, d1 = nueva.__d;
          A(vieja, [{ opacity: 1 }, { opacity: 0 }], { duration: dur * 0.5 });
          for (const o of d1.objetos) {
            const prev = d0 && d0.objetos.find((x) => x.nombre === o.nombre);
            const el = nueva.querySelector('.dp-obj[data-id="' + o.id + '"]');
            if (!el) continue;
            if (prev) { el.style.transformOrigin = '0 0'; A(el, [{ transform: 'translate(' + (prev.x - o.x) + 'px,' + (prev.y - o.y) + 'px) scale(' + prev.w / o.w + ',' + prev.h / o.h + ')' }, { transform: 'none' }]); }
            else A(el, [{ opacity: 0 }, { opacity: 1 }], { delay: dur * 0.3, duration: dur * 0.7 });
          }
          break;
        }
        default: A(nueva, [{ opacity: 0 }, { opacity: 1 }]);
      }
      this.transiciones = anims;
      return Promise.all(anims.map((x) => x.finished.catch(() => null))).then(() => {
        vieja.remove();
        nueva.style.transformOrigin = '';
        anims.forEach((x) => { try { x.cancel(); } catch (e) { /* */ } });
      });
    }
  }

  /* ======================================================== presentación */
  let activa = null;
  class Presentacion {
    constructor(ed, opc) {
      this.ed = ed;
      this.p = ed.p;
      this.opc = opc;
      this.cfg = this.p.config;
      this.quiosco = this.cfg.tipo === 'quiosco';
      this.ensayo = !!opc.ensayo;
      this.moderador = !!opc.moderador && !this.quiosco;
      this.usarIntervalos = !this.ensayo && this.cfg.avance === 'intervalos';
      this.repetir = this.quiosco || this.cfg.repetir;
      this.orden = this.p.diapositivas.map((d, i) => i).filter((i) => !this.p.diapositivas[i].oculta || i === opc.desde);
      if (!this.orden.length) this.orden = [0];
      this.pos = Math.max(0, this.orden.findIndex((i) => i >= (opc.desde || 0)));
      this.tiempos = {};
      this.armar();
      activa = this;
      this.mostrar(this.pos, { primera: true });
    }
    get d() { return this.p.diapositivas[this.orden[this.pos]]; }
    armar() {
      this.raiz = h('div', { class: 'dps' + (this.moderador ? ' moderador' : '') + (this.quiosco ? ' quiosco' : ''), role: 'dialog', 'aria-modal': 'true', 'aria-label': this.moderador ? 'Vista del moderador' : 'Presentación con diapositivas' });
      this.zona = h('div', { class: 'dps-zona' });
      if (this.moderador) {
        this.reloj = h('span', { class: 'dps-reloj' });
        this.crono = h('span', { class: 'dps-crono' }, '0:00:00');
        this.inicioCrono = Date.now();
        this.pausaCrono = 0;
        this.sig = h('div', { class: 'dps-sig' });
        this.notas = h('div', { class: 'dps-notas', tabindex: '0', 'aria-label': 'Notas del orador' });
        this.tamNotas = 18;
        this.contador = h('span', { class: 'dps-contador' });
        const barra = h('div', { class: 'dps-mod-barra' },
          h('div', { class: 'dps-mod-crono' }, h('button', { class: 'dps-b', title: 'Pausar o reanudar el cronómetro', 'aria-label': 'Pausar o reanudar el cronómetro', onclick: () => this.alternarCrono() }, '⏯'), this.crono, h('button', { class: 'dps-b', title: 'Reiniciar el cronómetro', 'aria-label': 'Reiniciar el cronómetro', onclick: () => { this.inicioCrono = Date.now(); this.pausaCrono = 0; this.pausadoDesde = null; } }, '↺')),
          this.reloj,
          h('span', { class: 'dps-mod-nota' }, 'Vista del moderador: el público solo ve la diapositiva actual.'),
          h('button', { class: 'dps-b texto', onclick: () => this.salir() }, 'Finalizar presentación'));
        const izq = h('div', { class: 'dps-mod-izq' }, this.zona,
          h('div', { class: 'dps-mod-ctrl' },
            h('button', { class: 'dps-b', title: 'Anterior', 'aria-label': 'Anterior', onclick: () => this.retroceder() }, '◀'), this.contador,
            h('button', { class: 'dps-b', title: 'Siguiente', 'aria-label': 'Siguiente', onclick: () => this.avanzar() }, '▶'),
            h('button', { class: 'dps-b texto', onclick: () => this.verTodas() }, '▦ Ver todas las diapositivas'),
            h('button', { class: 'dps-b texto', onclick: () => this.pantalla('negra') }, '■ Pantalla negra')));
        const der = h('div', { class: 'dps-mod-der' }, h('div', { class: 'dps-mod-tit' }, 'Siguiente'), this.sig,
          h('div', { class: 'dps-mod-tit' }, 'Notas', h('span', null, h('button', { class: 'dps-b', title: 'Aumentar el texto de las notas', 'aria-label': 'Aumentar el texto de las notas', onclick: () => { this.tamNotas = Math.min(40, this.tamNotas + 2); this.notas.style.fontSize = this.tamNotas + 'px'; } }, 'A⁺'), h('button', { class: 'dps-b', title: 'Disminuir el texto de las notas', 'aria-label': 'Disminuir el texto de las notas', onclick: () => { this.tamNotas = Math.max(12, this.tamNotas - 2); this.notas.style.fontSize = this.tamNotas + 'px'; } }, 'A⁻'))), this.notas);
        this.raiz.append(barra, h('div', { class: 'dps-mod-cuerpo' }, izq, der));
        this.tick = setInterval(() => this.actualizarReloj(), 500);
        this.actualizarReloj();
      } else {
        this.raiz.appendChild(this.zona);
        this.ayuda = h('div', { class: 'dps-ayuda' }, this.quiosco ? 'Modo exposición (quiosco): avanza solo. Esc para salir.' : 'Clic, → o Espacio: siguiente · ← anterior · Esc: salir · B: pantalla negra');
        this.raiz.appendChild(this.ayuda);
        setTimeout(() => this.ayuda && this.ayuda.classList.add('sale'), 2600);
        this.raiz.appendChild(h('button', { class: 'dps-salir', title: 'Finalizar la presentación (Esc)', 'aria-label': 'Finalizar la presentación', onclick: () => this.salir() }, '✕'));
      }
      if (this.ensayo) {
        this.tDiapo = h('span', null, '0:00:00');
        this.tTotal = h('span', null, '0:00:00');
        this.barraEnsayo = h('div', { class: 'dps-ensayo', role: 'toolbar', 'aria-label': 'Grabación' }, h('b', null, 'Grabación'),
          h('button', { class: 'dps-b', title: 'Siguiente', 'aria-label': 'Siguiente', onclick: (e) => { e.stopPropagation(); this.avanzar(); } }, '➜'),
          h('button', { class: 'dps-b', title: 'Pausar grabación', 'aria-label': 'Pausar grabación', onclick: (e) => { e.stopPropagation(); this.pausarEnsayo(); } }, '⏸'),
          this.tDiapo,
          h('button', { class: 'dps-b', title: 'Repetir', 'aria-label': 'Repetir la diapositiva', onclick: (e) => { e.stopPropagation(); this.inicioDiapo = Date.now(); this.pausaDiapo = 0; } }, '↺'),
          this.tTotal);
        this.raiz.appendChild(this.barraEnsayo);
        this.inicioEnsayo = Date.now();
        this.pausaTotal = 0;
        this.tickEnsayo = setInterval(() => this.actualizarEnsayo(), 200);
      }
      this.esc = new Escenario(this.zona, this.p, {});
      this.velo = h('div', { class: 'dps-velo' });
      this.zona.appendChild(this.velo);
      this.zona.addEventListener('click', (e) => this.alClic(e));
      this.teclado = (e) => this.teclas(e);
      document.addEventListener('keydown', this.teclado, true);
      this.redim = () => this.medir();
      window.addEventListener('resize', this.redim);
      document.body.appendChild(this.raiz);
      document.body.classList.add('dp-sin-scroll');
      this.medir();
      this.raiz.tabIndex = -1;
      this.raiz.focus();
    }
    medir() {
      const r = this.zona.getBoundingClientRect();
      this.esc.medir(Math.max(100, r.width - (this.moderador ? 0 : 0)), Math.max(60, r.height));
    }
    actualizarReloj() {
      if (!this.reloj) return;
      this.reloj.textContent = new Date().toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' });
      const t = (this.pausadoDesde || Date.now()) - this.inicioCrono - this.pausaCrono;
      this.crono.textContent = hms(t / 1000);
    }
    alternarCrono() { if (this.pausadoDesde) { this.pausaCrono += Date.now() - this.pausadoDesde; this.pausadoDesde = null; } else this.pausadoDesde = Date.now(); }
    actualizarEnsayo() {
      if (!this.tDiapo) return;
      const ahora = this.pausadoEnsayo || Date.now();
      this.tDiapo.textContent = hms((ahora - this.inicioDiapo - this.pausaDiapo) / 1000);
      this.tTotal.textContent = hms((ahora - this.inicioEnsayo - this.pausaTotal) / 1000);
    }
    pausarEnsayo() {
      if (this.pausadoEnsayo) { const d = Date.now() - this.pausadoEnsayo; this.pausaDiapo += d; this.pausaTotal += d; this.pausadoEnsayo = null; this.limpiarTimer(); return; }
      this.pausadoEnsayo = Date.now();
      LT.ui.modal({ titulo: 'Grabación en pausa', cuerpo: h('p', null, 'La grabación está en pausa. Presiona «Reanudar grabación» para continuar.'), botones: [{ texto: 'Reanudar grabación', primario: true, valor: true }] }).then(() => { if (this.pausadoEnsayo) this.pausarEnsayo(); });
    }

    /* ------------------------------------------------------------ mostrar */
    mostrar(pos, opc) {
      opc = opc || {};
      this.limpiarTimer();
      this.esc.limpiar();
      if (this.fin) { this.fin.remove(); this.fin = null; }
      if (this.ensayo && this.d && !opc.primera && this.inicioDiapo) this.tiempos[this.d.id] = Math.round(((Date.now() - this.inicioDiapo - this.pausaDiapo) / 1000) * 10) / 10;
      this.detenerMedios(false);
      this.pos = pos;
      const d = this.d;
      this.paso = 0;
      this.grupos = this.cfg.sinAnimacion ? [] : R.pasos(d);
      // video o audio «en secuencia de clic»: un clic más en la secuencia
      this.mediosSecuencia = d.objetos.filter((o) => (o.tipo === 'video' || o.tipo === 'audio') && ((o.opciones || {}).inicio || 'secuencia') === 'secuencia');
      const vieja = this.esc.capa;
      const nueva = this.esc.capaDe(d);
      this.esc.preparar(nueva, d, this.cfg.sinAnimacion);
      this.prepararMedios(nueva, d);
      this.esc.capa = nueva;
      this.inicioDiapo = Date.now();
      this.pausaDiapo = 0;
      this.enTransicion = true;
      const t = opc.sinTransicion ? null : d.transicion;
      this.marcarModerador();
      this.esc.transicion(opc.primera ? null : vieja, nueva, t).then(() => {
        this.enTransicion = false;
        if (this.esc.capa !== nueva) return;
        this.iniciarMediosAuto(nueva, d);
        const g = this.grupos[0];
        if (g && g.auto) { this.paso = 1; this.corriendo = this.esc.ejecutar(nueva, d, g).then(() => { this.corriendo = null; this.programar(); }); }
        else this.programar();
        this.actualizarModerador();
      });
      this.actualizarModerador();
    }
    pendientes() { return this.grupos.length - this.paso + this.mediosSecuencia.length; }
    programar() {
      this.limpiarTimer();
      const d = this.d;
      const t = d.transicion;
      if (this.usarIntervalos && t && t.despues != null) {
        const transcurrido = (Date.now() - this.inicioDiapo) / 1000;
        const falta = Math.max(0, t.despues - transcurrido);
        this.timer = setTimeout(() => this.siguienteDiapo(true), ms(falta));
      } else if (this.quiosco) {
        this.timer = setTimeout(() => this.avisar('Esta diapositiva no tiene intervalo: en modo exposición nadie puede hacer clic y la presentación se quedaría aquí. Agrega «Después de» o usa Ensayar intervalos.'), 5000);
      }
    }
    limpiarTimer() { clearTimeout(this.timer); this.timer = null; }
    avisar(txt) {
      if (this.aviso) this.aviso.remove();
      this.aviso = h('div', { class: 'dps-aviso' }, txt);
      this.zona.appendChild(this.aviso);
      setTimeout(() => { if (this.aviso) { this.aviso.remove(); this.aviso = null; } }, 6000);
    }

    /* -------------------------------------------------------- navegación */
    avanzar(origen) {
      if (this.fin) { this.salir(); return; }
      if (this.enTransicion) { (this.esc.transiciones || []).forEach((a) => { try { a.finish(); } catch (e) { /* */ } }); return; }
      if (this.corriendo) { this.esc.vivas.forEach((a) => { try { a.finish(); } catch (e) { /* */ } }); this.esc.timers.forEach(clearTimeout); this.esc.timers = []; this.terminarPasoActual(); return; }
      if (this.paso < this.grupos.length) {
        const g = this.grupos[this.paso++];
        this.limpiarTimer();
        this.corriendo = this.esc.ejecutar(this.esc.capa, this.d, g).then(() => { this.corriendo = null; this.encadenar(); });
        this.actualizarModerador();
        return;
      }
      if (this.mediosSecuencia.length) { const o = this.mediosSecuencia.shift(); this.reproducir(o); this.actualizarModerador(); return; }
      void origen;
      this.siguienteDiapo(false);
    }
    /* Tras un paso, los siguientes «Después de/Con la anterior» ya están dentro del mismo grupo; se reprograma el intervalo */
    encadenar() { this.programar(); this.actualizarModerador(); }
    terminarPasoActual() {
      // muestra el estado final del paso interrumpido
      const g = this.grupos[this.paso - 1];
      if (g) for (const it of g.items) { const el = this.esc.capa.querySelector('.dp-obj[data-id="' + it.anim.objeto + '"]'); if (!el) continue; if (it.anim.cat === 'entrada') el.style.visibility = 'visible'; if (it.anim.cat === 'salida') el.style.visibility = 'hidden'; }
      this.corriendo = null;
      this.programar();
      this.actualizarModerador();
    }
    siguienteDiapo(auto) {
      if (this.pos < this.orden.length - 1) { this.mostrar(this.pos + 1); return; }
      if (this.repetir && !this.ensayo) { this.mostrar(0); return; }
      if (auto && this.quiosco) { this.mostrar(0); return; }
      this.terminar();
    }
    retroceder() {
      if (this.fin) { this.fin.remove(); this.fin = null; this.mostrar(this.pos, { sinTransicion: true }); return; }
      if (this.pos > 0) this.mostrar(this.pos - 1, { sinTransicion: true });
      else if (this.repetir) this.mostrar(this.orden.length - 1, { sinTransicion: true });
    }
    irA(i) { const k = this.orden.indexOf(i); if (k >= 0) this.mostrar(k); else { this.orden.push(i); this.orden.sort((a, b) => a - b); this.mostrar(this.orden.indexOf(i)); } }
    terminar() {
      this.limpiarTimer();
      if (this.ensayo) { if (this.d) this.tiempos[this.d.id] = Math.round(((Date.now() - this.inicioDiapo - this.pausaDiapo) / 1000) * 10) / 10; this.salir(); return; }
      this.fin = h('div', { class: 'dps-fin' }, 'Fin de la presentación con diapositivas. Haga clic para salir.');
      this.zona.appendChild(this.fin);
      this.actualizarModerador();
    }
    pantalla(c) { this.velo.className = 'dps-velo' + (this.velo.className.includes(c) ? '' : ' ' + c); }

    alClic(e) {
      const objEl = e.target.closest('.dp-obj');
      if (objEl && this.esc.capa && this.esc.capa.contains(objEl)) {
        const o = this.d.objetos.find((x) => x.id === objEl.dataset.id);
        if (o && o.vinculo) { e.stopPropagation(); this.seguirVinculo(o); return; }
        if (o && o.tipo === 'video' && ((o.opciones || {}).inicio === 'clic' || this.mediosSecuencia.includes(o) || objEl.querySelector('video').currentTime > 0)) { e.stopPropagation(); this.mediosSecuencia = this.mediosSecuencia.filter((x) => x !== o); this.reproducir(o, true); return; }
      }
      if (e.target.closest('.dps-ensayo, .dps-aviso button, .dps-vinculo')) return;
      if (this.quiosco) return;
      if (this.d.transicion && this.d.transicion.alHacerClic === false && !this.fin && this.paso >= this.grupos.length && !this.mediosSecuencia.length) return;
      this.avanzar('clic');
    }
    seguirVinculo(o) {
      const v = o.vinculo;
      this.ed.registro.vinculosProbados[o.id] = true;
      this.ed.emitir('registro', 'vinculo');
      if (v.tipo === 'url') {
        if (this.banner) this.banner.remove();
        this.banner = h('div', { class: 'dps-vinculo' }, 'Vínculo: ', h('a', { href: v.url, target: '_blank', rel: 'noopener' }, v.url), h('span', null, ' (en PowerPoint se abre en el navegador)'), h('button', { class: 'dps-b', 'aria-label': 'Cerrar', onclick: (e) => { e.stopPropagation(); this.banner.remove(); this.banner = null; } }, '✕'));
        this.zona.appendChild(this.banner);
        return;
      }
      const cur = this.orden[this.pos];
      const n = this.p.diapositivas.length;
      let destino = { primera: 0, ultima: n - 1, siguiente: Math.min(n - 1, cur + 1), anterior: Math.max(0, cur - 1) }[v.destino];
      if (destino == null) destino = this.p.diapositivas.findIndex((d) => d.id === v.destino);
      if (destino >= 0) this.irA(destino);
    }
    teclas(e) {
      if (!this.raiz.isConnected) return;
      if (document.querySelector('.modal-fondo')) return;
      const k = e.key;
      const manejar = () => { e.preventDefault(); e.stopPropagation(); };
      if (k === 'Escape') { manejar(); this.salir(); return; }
      if (this.quiosco) { if (['ArrowRight', 'ArrowLeft', ' ', 'Enter', 'PageDown', 'PageUp'].includes(k)) manejar(); return; }
      if (['ArrowRight', 'ArrowDown', ' ', 'Enter', 'PageDown', 'n', 'N'].includes(k)) { manejar(); this.avanzar('tecla'); return; }
      if (['ArrowLeft', 'ArrowUp', 'Backspace', 'PageUp', 'p', 'P'].includes(k)) { manejar(); this.retroceder(); return; }
      if (k === 'b' || k === 'B' || k === '.') { manejar(); this.pantalla('negra'); return; }
      if (k === 'w' || k === 'W' || k === ',') { manejar(); this.pantalla('blanca'); return; }
      if (k === 'Home') { manejar(); this.mostrar(0); return; }
      if (k === 'End') { manejar(); this.mostrar(this.orden.length - 1); return; }
      if (/^[0-9]$/.test(k)) { manejar(); this.numero = (this.numero || '') + k; clearTimeout(this.tNum); this.tNum = setTimeout(() => { this.numero = ''; }, 1500); return; }
      if (k === 'Enter' && this.numero) { manejar(); this.irA(+this.numero - 1); this.numero = ''; }
    }

    /* ------------------------------------------------------------- medios */
    prepararMedios(capa, d) {
      for (const o of d.objetos) {
        if (o.tipo !== 'video') continue;
        const el = capa.querySelector('.dp-obj[data-id="' + o.id + '"]');
        const v = el && el.querySelector('video');
        if (!v) continue;
        const op = o.opciones || {};
        if (op.ocultar) el.classList.add('oculto-detenido');
        v.addEventListener('play', () => { el.classList.add('reproduciendo'); if (op.pantallaCompleta) el.classList.add('pantalla-completa'); });
        v.addEventListener('pause', () => el.classList.remove('reproduciendo'));
        v.addEventListener('ended', () => { el.classList.remove('reproduciendo', 'pantalla-completa'); if (op.rebobinar) v.currentTime = 0; });
        v.volume = { Bajo: 0.3, Medio: 0.65, Alto: 1, Silencio: 0 }[op.volumen || 'Medio'];
      }
    }
    iniciarMediosAuto(capa, d) {
      for (const o of d.objetos) if ((o.tipo === 'video' || o.tipo === 'audio') && (o.opciones || {}).inicio === 'auto') this.reproducir(o);
    }
    reproducir(o, alternar) {
      if (o.tipo === 'video') {
        const el = this.esc.capa.querySelector('.dp-obj[data-id="' + o.id + '"]');
        const v = el && el.querySelector('video');
        if (!v) return;
        if (alternar && !v.paused) { v.pause(); return; }
        v.play().catch(() => null);
        return;
      }
      // audio: uno por presentación si se reproduce en todas las diapositivas
      const m = K.MEDIOS.audio.find((x) => x.id === o.src) || K.MEDIOS.audio[0];
      const op = o.opciones || {};
      if (this.audio && this.audio.__id === o.id && !this.audio.paused) { if (alternar) this.audio.pause(); return; }
      if (this.audio) this.audio.pause();
      const a = new Audio(LT.pagina.url('assets/media/' + m.archivo));
      a.__id = o.id;
      a.__todas = !!op.todas;
      a.loop = !!op.repetir;
      a.volume = { Bajo: 0.3, Medio: 0.65, Alto: 1, Silencio: 0 }[op.volumen || 'Medio'];
      a.play().catch(() => null);
      this.audio = a;
      this.ed.registro.audioReproducido = true;
    }
    detenerMedios(todo) {
      if (this.esc && this.esc.capa) this.esc.capa.querySelectorAll('video').forEach((v) => { try { v.pause(); } catch (e) { /* */ } });
      if (this.audio && (todo || !this.audio.__todas)) { this.audio.pause(); this.audio = null; }
    }

    /* ------------------------------------------------- vista del moderador */
    marcarModerador() {
      if (!this.moderador) return;
      const n = this.orden[this.pos] + 1;
      this.ed.registro.maxDiapoModerador = Math.max(this.ed.registro.maxDiapoModerador || 0, n);
      if (String(this.d.notas || '').trim()) this.ed.registro.notasVistas[this.d.id] = true;
      this.ed.emitir('registro', 'moderador');
    }
    actualizarModerador() {
      if (!this.moderador) return;
      const n = this.orden[this.pos];
      this.contador.textContent = 'Diapositiva ' + (n + 1) + ' de ' + this.p.diapositivas.length;
      this.notas.textContent = '';
      const txt = String(this.d.notas || '').trim();
      if (txt) txt.split('\n').forEach((l) => this.notas.appendChild(h('p', null, l)));
      else this.notas.appendChild(h('p', { class: 'dps-sin-notas' }, 'No hay notas en esta diapositiva.'));
      this.notas.style.fontSize = this.tamNotas + 'px';
      this.sig.innerHTML = '';
      const pend = this.pendientes();
      if (this.fin) this.sig.appendChild(h('div', { class: 'dps-sig-fin' }, 'Fin de la presentación'));
      else if (pend > 0) { this.sig.appendChild(R.escalada(this.p, this.d, 300, { modo: 'show' })); this.sig.appendChild(h('div', { class: 'dps-sig-et' }, 'Siguiente clic: animación (' + pend + ' pendiente' + (pend > 1 ? 's' : '') + ')')); }
      else if (this.pos < this.orden.length - 1) this.sig.appendChild(R.escalada(this.p, this.p.diapositivas[this.orden[this.pos + 1]], 300, { modo: 'show' }));
      else this.sig.appendChild(h('div', { class: 'dps-sig-fin' }, this.repetir ? 'Vuelve a la primera diapositiva' : 'Fin de la presentación con diapositivas'));
    }
    verTodas() {
      const g = h('div', { class: 'dps-todas' });
      this.p.diapositivas.forEach((d, i) => g.appendChild(h('button', { class: 'dps-todas-item' + (i === this.orden[this.pos] ? ' sel' : ''), onclick: () => { cerrar(); this.irA(i); } }, R.escalada(this.p, d, 200, { modo: 'mini' }), h('span', null, (i + 1) + (d.oculta ? ' (oculta)' : '')))));
      const capa = h('div', { class: 'dps-todas-capa' }, h('div', { class: 'dps-mod-tit' }, 'Todas las diapositivas', h('button', { class: 'dps-b', 'aria-label': 'Cerrar', onclick: () => cerrar() }, '✕')), g);
      const cerrar = () => capa.remove();
      this.raiz.appendChild(capa);
    }

    /* -------------------------------------------------------------- salir */
    salir() {
      if (!this.raiz.isConnected) return;
      this.limpiarTimer();
      this.esc.limpiar();
      this.detenerMedios(true);
      clearInterval(this.tick);
      clearInterval(this.tickEnsayo);
      document.removeEventListener('keydown', this.teclado, true);
      window.removeEventListener('resize', this.redim);
      this.raiz.remove();
      if (!document.querySelector('.dp-app.ampliada')) document.body.classList.remove('dp-sin-scroll');
      activa = null;
      const ed = this.ed;
      if (this.ensayo) {
        const total = Object.values(this.tiempos).reduce((a, b) => a + b, 0);
        ed.registrar('ensayos');
        LT.ui.modal({ titulo: 'Microsoft PowerPoint', cuerpo: h('p', null, 'El tiempo total de la presentación con diapositivas fue de ' + hms(total) + '. ¿Desea conservar los nuevos intervalos de las diapositivas?'), botones: [{ texto: 'No', valor: false }, { texto: 'Sí', primario: true, valor: true }] }).then((si) => {
          if (!si) return;
          ed.registrar('ensayosGuardados');
          ed.cambiar(() => {
            for (const d of ed.p.diapositivas) {
              if (this.tiempos[d.id] == null) continue;
              d.transicion = Object.assign({ efecto: 'ninguna', opcion: null, duracion: null, alHacerClic: true, despues: null, sonido: null }, d.transicion || {}, { despues: Math.max(1, Math.round(this.tiempos[d.id])) });
            }
            ed.p.config.avance = 'intervalos';
          });
          ed.vista = 'clasificador';
          ed.render();
          ed.toast('Se guardaron los intervalos: ahora se ven debajo de cada diapositiva en el Clasificador.', 'ok');
        });
      }
      ed.emitir('finPresentacion', this);
      try { ed.raiz.focus({ preventScroll: true }); } catch (e) { /* */ }
    }
  }
  function hms(s) { s = Math.max(0, Math.floor(s)); return Math.floor(s / 3600) + ':' + String(Math.floor((s % 3600) / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); }

  /* ---------------------------------------------------- vistas previas */
  function sobreLienzo(ed) {
    if (!ed.elMarco) return null;
    const capa = h('div', { class: 'dp-previa' });
    ed.elMarco.appendChild(capa);
    const esc = new Escenario(capa, ed.p, { silencio: true });
    esc.medir(ed.elMarco.clientWidth, ed.elMarco.clientHeight);
    return { capa, esc };
  }
  function previaTransicion(ed, anterior) {
    const x = sobreLienzo(ed);
    if (!x) return;
    const d = ed.d;
    const vieja = anterior ? x.esc.capaDe(anterior) : h('div', { class: 'dps-capa negra' });
    x.esc.el.appendChild(vieja);
    const nueva = x.esc.capaDe(d);
    x.esc.transicion(vieja, nueva, d.transicion && d.transicion.efecto !== 'ninguna' ? d.transicion : null).then(() => setTimeout(() => x.capa.remove(), 250));
  }
  function previaAnimaciones(ed) {
    const x = sobreLienzo(ed);
    if (!x) return;
    const d = ed.d;
    const capa = x.esc.capaDe(d);
    x.esc.el.appendChild(capa);
    x.esc.preparar(capa, d);
    const grupos = R.pasos(d);
    let i = 0;
    const sig = () => {
      if (i >= grupos.length || !x.capa.isConnected) { setTimeout(() => x.capa.remove(), 500); return; }
      x.esc.ejecutar(capa, d, grupos[i++]).then(() => setTimeout(sig, 250));
    };
    x.capa.addEventListener('click', () => { x.esc.limpiar(); x.capa.remove(); });
    setTimeout(sig, 200);
  }

  function iniciar(ed, opc) {
    if (activa) activa.salir();
    return new Presentacion(ed, opc || {});
  }

  LT.DiapoShow = { iniciar, previaTransicion, previaAnimaciones, Escenario, fotogramasEntrada, fotogramasSalida, fotogramasEnfasis, hms, activa: () => activa };
})();

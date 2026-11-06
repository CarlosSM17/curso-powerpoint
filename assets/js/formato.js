/* Formatos de número al estilo Excel e interpretación de lo que se escribe en una celda. */
(function () {
  'use strict';
  const LT = (window.LT = window.LT || {});

  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const COLORES = {
    rojo: '#d40000', red: '#d40000', azul: '#0040d0', blue: '#0040d0', verde: '#008a2e', green: '#008a2e',
    amarillo: '#b8860b', yellow: '#b8860b', magenta: '#c000c0', cian: '#008b8b', cyan: '#008b8b',
    negro: '#000000', black: '#000000', blanco: '#ffffff', white: '#ffffff',
  };

  const PRESETS = {
    General: 'General',
    'Número': '0.00',
    Moneda: '$#,##0.00',
    Contabilidad: '_-$* #,##0.00_-;-$* #,##0.00_-;_-$* "-"??_-;_-@_-',
    'Fecha corta': 'dd/mm/yyyy',
    'Fecha larga': 'dddd, d" de "mmmm" de "yyyy',
    Hora: 'hh:mm',
    Porcentaje: '0%',
    Millares: '#,##0.00',
    Texto: '@',
  };

  /* Divide en secciones separadas por ; (respetando comillas y corchetes) */
  function secciones(codigo) {
    const out = [];
    let act = '', enComillas = false, enCorchete = false;
    for (let i = 0; i < codigo.length; i++) {
      const ch = codigo[i];
      if (ch === '\\' && !enComillas) { act += ch + (codigo[i + 1] || ''); i++; continue; }
      if (ch === '"') enComillas = !enComillas;
      else if (!enComillas && ch === '[') enCorchete = true;
      else if (!enComillas && ch === ']') enCorchete = false;
      if (ch === ';' && !enComillas && !enCorchete) { out.push(act); act = ''; continue; }
      act += ch;
    }
    out.push(act);
    return out;
  }

  /* Extrae [Color], [$símbolo-xxx] y [>=100] de una sección */
  function limpiarSeccion(sec) {
    let color = null, condicion = null;
    const texto = sec.replace(/\[([^\]]*)\]/g, (todo, dentro) => {
      const low = dentro.toLowerCase();
      if (COLORES[low]) { color = COLORES[low]; return ''; }
      if (/^color\d+$/.test(low)) return '';
      if (dentro[0] === '$') { const sim = dentro.slice(1).split('-')[0]; return sim ? '"' + sim + '"' : ''; }
      const mc = /^(<=|>=|<>|<|>|=)(-?[\d.]+)$/.exec(dentro);
      if (mc) { condicion = { op: mc[1], v: parseFloat(mc[2]) }; return ''; }
      if (/^(h+|m+|s+)$/i.test(dentro)) return dentro; // tiempo transcurrido: se trata como normal
      return '';
    });
    return { texto, color, condicion };
  }

  function cumple(cond, v) {
    switch (cond.op) {
      case '<': return v < cond.v; case '<=': return v <= cond.v; case '>': return v > cond.v;
      case '>=': return v >= cond.v; case '=': return v === cond.v; case '<>': return v !== cond.v;
    }
    return false;
  }

  /* Tokeniza una sección en literales y marcadores */
  function tokens(sec) {
    const out = [];
    for (let i = 0; i < sec.length; i++) {
      const ch = sec[i];
      if (ch === '"') {
        const j = sec.indexOf('"', i + 1);
        out.push({ t: 'lit', v: sec.slice(i + 1, j < 0 ? undefined : j) });
        i = j < 0 ? sec.length : j;
      } else if (ch === '\\') { out.push({ t: 'lit', v: sec[i + 1] || '' }); i++; }
      else if (ch === '_') { out.push({ t: 'lit', v: ' ' }); i++; }
      else if (ch === '*') { i++; }
      else out.push({ t: 'ch', v: ch });
    }
    return out;
  }

  function esFechaSeccion(sec) {
    const sinLit = sec.replace(/"[^"]*"/g, '').replace(/\\./g, '').replace(/\[[^\]]*\]/g, '');
    return /[dmyhsa]/i.test(sinLit.replace(/general/i, '').replace(/[eE][+-]/g, '')) && !/[0#?]/.test(sinLit);
  }
  function esFecha(codigo) {
    if (!codigo || codigo === 'General') return false;
    return esFechaSeccion(limpiarSeccion(secciones(codigo)[0]).texto);
  }

  function general(v) {
    if (!isFinite(v)) return '#¡NUM!';
    const a = Math.abs(v);
    if (a !== 0 && (a >= 1e11 || a < 1e-9)) {
      const [m, e] = v.toExponential(5).split('e');
      const mm = String(parseFloat(m));
      const en = parseInt(e, 10);
      return mm + 'E' + (en < 0 ? '-' : '+') + String(Math.abs(en)).padStart(2, '0');
    }
    if (Number.isInteger(v)) return String(v);
    let s = String(parseFloat(v.toPrecision(10)));
    if (s.includes('e')) s = v.toFixed(10).replace(/0+$/, '').replace(/\.$/, '');
    return s;
  }

  function formatearFecha(v, sec) {
    const n = Math.floor(v + 1e-9);
    const f = LT.fechas.deSerial(n);
    let frac = v - n;
    let totSeg = Math.round(frac * 86400);
    const hh = Math.floor(totSeg / 3600) % 24, mi = Math.floor((totSeg % 3600) / 60), ss = totSeg % 60;
    const ampm = /am\/pm|a\.m\.\/p\.m\.|a\/p/i.test(sec);
    let out = '';
    const toks = [];
    const s = sec;
    for (let i = 0; i < s.length;) {
      const ch = s[i];
      if (ch === '"') { const j = s.indexOf('"', i + 1); toks.push({ lit: s.slice(i + 1, j < 0 ? undefined : j) }); i = j < 0 ? s.length : j + 1; continue; }
      if (ch === '\\') { toks.push({ lit: s[i + 1] || '' }); i += 2; continue; }
      const resto = s.slice(i);
      let m = /^(am\/pm|a\.m\.\/p\.m\.|a\/p)/i.exec(resto);
      if (m) { toks.push({ k: 'ampm', v: m[0] }); i += m[0].length; continue; }
      m = /^(y+|a+|m+|d+|h+|s+)/i.exec(resto);
      if (m) { toks.push({ k: m[0][0].toLowerCase(), n: m[0].length }); i += m[0].length; continue; }
      toks.push({ lit: ch }); i++;
    }
    // m tras h o antes de s = minutos
    toks.forEach((t, k) => {
      if (t.k !== 'm') return;
      const prev = toks.slice(0, k).reverse().find((x) => x.k);
      const sig = toks.slice(k + 1).find((x) => x.k);
      if ((prev && prev.k === 'h') || (sig && sig.k === 's')) t.k = 'min';
    });
    for (const t of toks) {
      if (t.lit != null) { out += t.lit; continue; }
      switch (t.k) {
        case 'y': case 'a': out += t.n <= 2 ? String(f.y).slice(-2) : String(f.y); break;
        case 'm':
          if (t.n === 1) out += f.m; else if (t.n === 2) out += String(f.m).padStart(2, '0');
          else if (t.n === 3) out += MESES[f.m - 1].slice(0, 3); else if (t.n === 5) out += MESES[f.m - 1][0];
          else out += MESES[f.m - 1];
          break;
        case 'd':
          if (t.n === 1) out += f.d; else if (t.n === 2) out += String(f.d).padStart(2, '0');
          else if (t.n === 3) out += DIAS[f.dow].slice(0, 3); else out += DIAS[f.dow];
          break;
        case 'h': { let hv = hh; if (ampm) { hv = hh % 12; if (hv === 0) hv = 12; } out += t.n >= 2 ? String(hv).padStart(2, '0') : hv; break; }
        case 'min': out += t.n >= 2 ? String(mi).padStart(2, '0') : mi; break;
        case 's': out += t.n >= 2 ? String(ss).padStart(2, '0') : ss; break;
        case 'ampm': out += hh < 12 ? (t.v.length > 3 ? 'a.m.' : 'AM') : (t.v.length > 3 ? 'p.m.' : 'PM'); break;
      }
    }
    return out;
  }

  function formatearNumeroSeccion(v, sec, conSigno) {
    const toks = tokens(sec);
    if (toks.some((t) => t.t === 'ch' && /general/i.test(sec.replace(/"[^"]*"/g, '')))) {
      const g = general(Math.abs(v));
      return (conSigno && v < 0 ? '-' : '') + sec.replace(/"([^"]*)"/g, '$1').replace(/general/i, g);
    }
    // localizar el punto decimal y los marcadores
    let iDec = toks.findIndex((t) => t.t === 'ch' && t.v === '.');
    const esPh = (t) => t.t === 'ch' && (t.v === '0' || t.v === '#' || t.v === '?');
    const intToks = iDec >= 0 ? toks.slice(0, iDec) : toks.slice();
    const decToks = iDec >= 0 ? toks.slice(iDec + 1) : [];
    const pct = toks.filter((t) => t.t === 'ch' && t.v === '%').length;
    const intPh = intToks.filter(esPh);
    const decPh = decToks.filter(esPh);
    // comas: agrupación (entre marcadores) o escala (después del último marcador entero)
    let agrupar = false, escala = 0;
    const idxUltPh = intToks.reduce((acc, t, k) => (esPh(t) ? k : acc), -1);
    const idxPrimPh = intToks.findIndex(esPh);
    intToks.forEach((t, k) => {
      if (t.t === 'ch' && t.v === ',') {
        if (k > idxUltPh) escala++;
        else if (k > idxPrimPh) agrupar = true;
      }
    });
    decToks.forEach((t) => { if (t.t === 'ch' && t.v === ',') escala++; });
    let x = Math.abs(v) * Math.pow(100, pct) / Math.pow(1000, escala);
    const nd = decPh.length;
    x = Math.round((x + Number.EPSILON * x) * Math.pow(10, nd)) / Math.pow(10, nd);
    let [ent, dec] = x.toFixed(nd).split('.');
    dec = dec || '';
    // parte decimal
    let decStr = '';
    let k = 0;
    const decPhIdx = [];
    decToks.forEach((t, i) => { if (esPh(t)) decPhIdx.push(i); });
    for (let i = 0; i < decToks.length; i++) {
      const t = decToks[i];
      if (esPh(t)) {
        const d = dec[k] || '0';
        const restoCeros = dec.slice(k).replace(/0/g, '') === '';
        if (t.v === '#' && restoCeros) { k++; continue; }
        if (t.v === '?' && restoCeros) { decStr += ' '; k++; continue; }
        decStr += d; k++;
      } else if (t.t === 'lit' || (t.t === 'ch' && t.v !== ',')) decStr += t.v;
    }
    // parte entera
    const ceros = intPh.filter((t) => t.v === '0').length;
    if (ent === '0' && ceros === 0) ent = '';
    ent = ent.padStart(ceros, '0');
    let intStr = '';
    if (agrupar) {
      const agrupado = ent.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      let puesto = false;
      intToks.forEach((t, i) => {
        if (esPh(t) || (t.t === 'ch' && t.v === ',' && i < idxUltPh && i > idxPrimPh)) {
          if (!puesto && i >= idxPrimPh) { intStr += agrupado; puesto = true; }
        } else if (t.t === 'ch' && t.v === ',') { /* escala */ }
        else intStr += t.v;
      });
    } else {
      // distribuir dígitos de derecha a izquierda
      const partes = [];
      let digitos = ent;
      let phRest = intPh.length;
      for (let i = intToks.length - 1; i >= 0; i--) {
        const t = intToks[i];
        if (esPh(t)) {
          phRest--;
          if (phRest === 0) { partes.unshift(digitos || (t.v === '0' ? '0' : t.v === '?' ? ' ' : '')); digitos = ''; }
          else if (digitos.length) { partes.unshift(digitos.slice(-1)); digitos = digitos.slice(0, -1); }
          else partes.unshift(t.v === '?' ? ' ' : '');
        } else if (t.t === 'ch' && t.v === ',') { /* escala */ }
        else partes.unshift(t.v);
      }
      intStr = partes.join('');
      if (intPh.length === 0 && decPh.length && ent && ent !== '0') intStr += ent; // ".00" con parte entera
    }
    let res = intStr + (iDec >= 0 ? '.' : '') + decStr;
    const esCero = /^[^1-9]*$/.test(ent + dec);
    if (conSigno && v < 0 && !esCero) {
      // el signo va antes del primer dígito o símbolo de moneda visible
      res = '-' + res.replace(/^\s+/, '');
    }
    return res;
  }

  /* Devuelve {texto, color} */
  function formatear(valor, codigo) {
    if (valor == null || valor === '') return { texto: '' };
    if (typeof valor === 'boolean') return { texto: valor ? 'VERDADERO' : 'FALSO', alinear: 'center' };
    const cod = codigo && codigo !== 'General' ? codigo : null;
    if (typeof valor === 'string') {
      if (cod) {
        const secs = secciones(cod);
        if (secs.length >= 4 || (secs.length === 1 && secs[0].includes('@'))) {
          const s = limpiarSeccion(secs.length >= 4 ? secs[3] : secs[0]);
          return { texto: s.texto.replace(/"([^"]*)"/g, '$1').replace(/_./g, ' ').replace(/\*./g, '').replace('@', valor), color: s.color };
        }
      }
      return { texto: valor };
    }
    if (typeof valor !== 'number') return { texto: String(valor) };
    if (!cod) return { texto: general(valor) };
    const secs = secciones(cod).map(limpiarSeccion);
    let s, conSigno = true;
    const conCond = secs.some((x) => x.condicion);
    if (conCond) {
      s = secs.find((x) => x.condicion && cumple(x.condicion, valor)) || secs.find((x) => !x.condicion) || secs[secs.length - 1];
      conSigno = !s.condicion;
    } else if (secs.length === 1) s = secs[0];
    else if (valor > 0 || (valor === 0 && secs.length === 2)) s = secs[0];
    else if (valor < 0) { s = secs[1]; conSigno = false; }
    else s = secs[2] || secs[0];
    if (s.texto === '') return { texto: '', color: s.color };
    if (/^@$/.test(s.texto.trim())) return { texto: general(valor) };
    if (esFechaSeccion(s.texto)) return { texto: formatearFecha(valor, s.texto), color: s.color };
    return { texto: formatearNumeroSeccion(valor, s.texto, conSigno), color: s.color };
  }

  /* Interpreta lo que el participante escribe en una celda */
  function interpretar(texto) {
    const s = String(texto == null ? '' : texto);
    const t = s.trim();
    if (t === '') return { tipo: 'vacio', valor: null };
    if (t[0] === '=' && t.length > 1) return { tipo: 'formula', valor: t };
    if (s[0] === "'") return { tipo: 'texto', valor: s.slice(1) };
    if (/^verdadero$/i.test(t)) return { tipo: 'logico', valor: true };
    if (/^falso$/i.test(t)) return { tipo: 'logico', valor: false };
    let m = /^([-+]?)(\d{1,3}(?:,\d{3})+|\d*)(\.\d+)?\s*%$/.exec(t);
    if (m && (m[2] || m[3])) {
      const num = parseFloat((m[1] || '') + m[2].replace(/,/g, '') + (m[3] || '')) / 100;
      return { tipo: 'numero', valor: num, fmt: m[3] ? '0.' + '0'.repeat(Math.min(2, m[3].length - 1)) + '%' : '0%' };
    }
    m = /^([-+]?)\s*(\$)?\s*([-+]?)(\d{1,3}(?:,\d{3})+|\d+)?(\.\d+)?$/.exec(t);
    if (m && (m[4] || m[5])) {
      const neg = (m[1] === '-') !== (m[3] === '-');
      const num = parseFloat((m[4] || '0').replace(/,/g, '') + (m[5] || '')) * (neg ? -1 : 1);
      let fmt = null;
      if (m[2]) fmt = m[5] ? '$#,##0.00' : '$#,##0';
      else if (m[4] && m[4].includes(',')) fmt = m[5] ? '#,##0.00' : '#,##0';
      return { tipo: 'numero', valor: num, fmt };
    }
    m = /^(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2}|\d{4}))?$/.exec(t);
    if (m) {
      const d = +m[1], mes = +m[2];
      let y = m[3] ? +m[3] : new Date().getFullYear();
      if (y < 100) y += y < 30 ? 2000 : 1900;
      if (mes >= 1 && mes <= 12 && d >= 1 && d <= 31) {
        const serial = LT.fechas.aSerial(y, mes, d);
        const chk = LT.fechas.deSerial(serial);
        if (chk.d === d) return { tipo: 'numero', valor: serial, fmt: m[3] ? 'dd/mm/yyyy' : 'd-mmm' };
      }
    }
    m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t);
    if (m) return { tipo: 'numero', valor: LT.fechas.aSerial(+m[1], +m[2], +m[3]), fmt: 'dd/mm/yyyy' };
    m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(t);
    if (m && +m[1] < 24 && +m[2] < 60) {
      return { tipo: 'numero', valor: (+m[1] * 3600 + +m[2] * 60 + (+m[3] || 0)) / 86400, fmt: m[3] ? 'hh:mm:ss' : 'hh:mm' };
    }
    return { tipo: 'texto', valor: s };
  }

  /* Aumenta o disminuye los decimales de un código de formato */
  function ajustarDecimales(codigo, delta, valorEjemplo) {
    let cod = codigo && codigo !== 'General' ? codigo : null;
    if (!cod) {
      const dec = valorEjemplo != null && isFinite(valorEjemplo) ? (general(valorEjemplo).split('.')[1] || '').length : 0;
      cod = dec > 0 ? '0.' + '0'.repeat(dec) : '0';
    }
    if (esFecha(cod)) return cod;
    return secciones(cod).map((sec) => {
      // trabaja sobre el primer bloque numérico fuera de comillas
      return sec.replace(/((?:^|[^"\\])(?:"[^"]*")*[^"]*?)([0#][0#,]*)(\.([0#]*))?/, (todo, pre, ent, conPunto, decs) => {
        let n = (decs || '').length + delta;
        if (n < 0) n = 0;
        return pre + ent + (n > 0 ? '.' + '0'.repeat(n) : '');
      });
    }).join(';');
  }

  /* En la interfaz en español se escriben "aaaa" para el año; se normaliza a "yyyy" */
  function normalizarCodigo(cod) {
    if (!cod) return cod;
    return cod.split(/("[^"]*")/).map((parte) => {
      if (parte[0] === '"') return parte;
      return parte.replace(/(^|[^A-Za-z])(a{4}|a{2})(?![A-Za-z.\/])/gi, (t, pre, aes) => pre + 'y'.repeat(aes.length));
    }).join('');
  }

  LT.formato = { formatear, interpretar, esFecha, ajustarDecimales, normalizarCodigo, general, PRESETS, MESES, DIAS };
})();

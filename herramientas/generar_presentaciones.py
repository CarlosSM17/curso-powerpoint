"""Genera con PowerPoint de escritorio (Windows, COM) las presentaciones de los laboratorios y del
reto integrador del curso «PowerPoint para Ciencias de la Salud».

    laboratorios/lab01-…pptx … lab08-…pptx      presentaciones iniciales (públicas)
    integradores/int-sala-de-espera.pptx          presentación inicial del reto integrador

Con --soluciones escribe además, en la carpeta privada (hermana del sitio, no se publica):

    soluciones/laboratorios/labNN-…-solucion.pptx (lab08 como .ppsx)
    soluciones/integradores/int-sala-de-espera-solucion.ppsx

Las soluciones se hacen en nivel Experto y aprueban todas las pruebas del verificador.

Requisitos: Windows, PowerPoint de Microsoft 365 en español y pywin32 (pip install pywin32).
Uso:  python herramientas/generar_presentaciones.py [--soluciones] [lab01 lab05 int …]
"""
import math
import os
import pathlib
import random
import re
import shutil
import struct
import sys
import tempfile
import time
import wave
import zipfile

import win32com.client as w32

RAIZ = pathlib.Path(__file__).resolve().parent.parent
MEDIA = RAIZ / 'assets' / 'media'
IMG = MEDIA / 'imagenes'
ICO = MEDIA / 'iconos'
LABS = RAIZ / 'laboratorios'
INTEG = RAIZ / 'integradores'
PRIVADO = pathlib.Path(os.environ.get('LT_PRIVADO') or RAIZ.parent / (RAIZ.name + '-privado'))
SOL_LABS = PRIVADO / 'soluciones' / 'laboratorios'
SOL_INT = PRIVADO / 'soluciones' / 'integradores'
TEMAS = pathlib.Path(r'C:\Program Files\Microsoft Office\root\Document Themes 16')
SOLUCIONES = '--soluciones' in sys.argv
SOLO = [a for a in sys.argv[1:] if not a.startswith('--')]

LAYOUT = {'titulo': 1, 'tituloObjetos': 2, 'seccion': 3, 'dosObjetos': 4, 'comparacion': 5, 'soloTitulo': 6, 'blanco': 7}
FORMATO = {'.pptx': 24, '.ppsx': 28}
# Constantes de PowerPoint (biblioteca de tipos)
EF = dict(fade=3849, push_izq=3853, vortice=3863, cubo=3914, cortinas=3938, galeria=3880, voltear=3905, warp=3888)
AN = dict(aparecer=1, desplazar=2, desvanecer=10, barrido=22, zoom=23, pulso=75, tray_der=149, media=83)
CLIC, CON, DESPUES = 1, 2, 3


def rgb(h):
    h = h.lstrip('#')
    return int(h[0:2], 16) + int(h[2:4], 16) * 256 + int(h[4:6], 16) * 65536


class Ppt:
    def __init__(self):
        self.app = w32.DispatchEx('PowerPoint.Application')

    def nueva(self):
        p = self.app.Presentations.Add(-1)
        p.PageSetup.SlideWidth = 960
        p.PageSetup.SlideHeight = 540
        return p

    def abrir(self, ruta):
        return self.app.Presentations.Open(str(ruta), False, False, True)

    def salir(self):
        try:
            self.app.Quit()
        except Exception:
            pass


def marcadores(s):
    """Marcadores de posición de una diapositiva por papel: titulo, subtitulo, cuerpo, cuerpo2, texto, enc1, enc2."""
    tit, cuerpos, objetos = None, [], []
    for i in range(1, s.Shapes.Count + 1):
        sh = s.Shapes(i)
        if not sh.Type == 14:  # msoPlaceholder
            continue
        t = sh.PlaceholderFormat.Type
        if t in (1, 3):
            tit = sh
        elif t == 4:
            cuerpos.append(('subtitulo', sh))
        elif t == 2:
            cuerpos.append(('cuerpo', sh))
        elif t == 7:
            objetos.append(sh)
    out = {'titulo': tit}
    nombre = s.CustomLayout.Index
    cuerpos_sh = sorted([x for x in cuerpos], key=lambda x: x[1].Left)
    objetos = sorted(objetos, key=lambda x: x.Left)
    if nombre == LAYOUT['comparacion']:
        for k, (_, sh) in enumerate(cuerpos_sh[:2]):
            out['enc%d' % (k + 1)] = sh
        for k, sh in enumerate(objetos[:2]):
            out['cuerpo' if k == 0 else 'cuerpo2'] = sh
    else:
        for papel, sh in cuerpos_sh:
            if papel == 'subtitulo':
                out['subtitulo'] = sh
            elif nombre == LAYOUT['seccion']:
                out['texto'] = sh
            else:
                out.setdefault('cuerpo', sh)
        for k, sh in enumerate(objetos):
            out['cuerpo' if k == 0 and 'cuerpo' not in out else 'cuerpo2'] = sh
    return out


def texto(sh, valor):
    sh.TextFrame.TextRange.Text = '\r'.join(valor) if isinstance(valor, (list, tuple)) else valor


def diapo(p, diseno, titulo=None, notas=None, **textos):
    s = p.Slides.AddSlide(p.Slides.Count + 1, p.SlideMaster.CustomLayouts(LAYOUT[diseno]))
    m = marcadores(s)
    if titulo is not None:
        texto(m['titulo'], titulo)
    for k, v in textos.items():
        texto(m[k], v)
    if notas:
        nota(s, notas)
    return s


def nota(s, txt):
    s.NotesPage.Shapes.Placeholders(2).TextFrame.TextRange.Text = txt


def fmt(sh, fuente=None, tam=None, color=None, negrita=None):
    f = sh.TextFrame.TextRange.Font
    if fuente:
        f.Name = fuente
    if tam:
        f.Size = tam
    if color:
        f.Color.RGB = rgb(color)
    if negrita is not None:
        f.Bold = -1 if negrita else 0


def forma(s, nombre, txt, l, t, w, h, tam=24, tipo=5, relleno=None):
    sh = s.Shapes.AddShape(tipo, l, t, w, h)
    sh.Name = nombre
    sh.TextFrame.TextRange.Text = txt
    sh.TextFrame.TextRange.Font.Size = tam
    if relleno:
        sh.Fill.ForeColor.RGB = rgb(relleno)
    return sh


def imagen(s, archivo, l, t, w, h, nombre=None, alt=None, decorativo=False):
    sh = s.Shapes.AddPicture(str(archivo), 0, -1, l, t, w, h)
    if nombre:
        sh.Name = nombre
    if alt:
        sh.AlternativeText = alt
    if decorativo:
        sh.Decorative = -1
    return sh


def buscar(p, patron):
    for i in range(1, p.Slides.Count + 1):
        s = p.Slides(i)
        try:
            t = s.Shapes.Title.TextFrame.TextRange.Text
        except Exception:
            t = ''
        if re.search(patron, t, re.I):
            return s
    raise LookupError('No encontré la diapositiva ' + patron)


def figura(s, nombre):
    for i in range(1, s.Shapes.Count + 1):
        if s.Shapes(i).Name == nombre:
            return s.Shapes(i)
    raise LookupError('No encontré la forma ' + nombre)


def guardar(p, ruta):
    ruta = pathlib.Path(ruta)
    ruta.parent.mkdir(parents=True, exist_ok=True)
    if ruta.exists():
        ruta.unlink()
    p.SaveAs(str(ruta), FORMATO[ruta.suffix])
    p.Close()
    print('  ✓', ruta.relative_to(ruta.parent.parent.parent))


def vincular_diapo(sh, destino):
    sh.ActionSettings(1).Hyperlink.SubAddress = '%d,%d,%s' % (destino.SlideID, destino.SlideIndex, destino.Shapes.Title.TextFrame.TextRange.Text)


def inicio_medio(s, sh, disparador):
    """Cambia el disparador del efecto de reproducción de un video o audio (2 = con la anterior)."""
    seq = s.TimeLine.MainSequence
    for i in range(1, seq.Count + 1):
        e = seq.Item(i)
        if e.Shape.Name == sh.Name and e.EffectType == AN['media']:
            e.Timing.TriggerType = disparador
            return
    e = seq.AddEffect(sh, AN['media'], 0, disparador)


def video_pantalla_completa(ruta):
    """PowerPoint no expone «Reproducir a pantalla completa» por COM: se activa en el XML (fullScrn)."""
    tmp = ruta.with_suffix(ruta.suffix + '.tmp')
    with zipfile.ZipFile(ruta) as zin, zipfile.ZipFile(tmp, 'w', zipfile.ZIP_DEFLATED) as zout:
        for it in zin.infolist():
            datos = zin.read(it.filename)
            if re.match(r'ppt/slides/slide\d+\.xml$', it.filename) and b'<p:video' in datos:
                datos = re.sub(rb'<p:video(?![^>]*fullScrn)', b'<p:video fullScrn="1"', datos)
            zout.writestr(it, datos)
    tmp.replace(ruta)


def sonido_aplauso():
    ruta = pathlib.Path(tempfile.gettempdir()) / 'aplauso-curso.wav'
    if not ruta.exists():
        with wave.open(str(ruta), 'wb') as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(16000)
            random.seed(3)
            datos = b''.join(struct.pack('<h', int(random.uniform(-1, 1) * 9000 * math.exp(-i / 16000 * 2))) for i in range(16000 * 2))
            w.writeframes(datos)
    return ruta


def variantes(thmx):
    with zipfile.ZipFile(thmx) as z:
        m = [x for x in z.namelist() if x.endswith('themeVariantManager.xml')]
        xml = z.read(m[0]).decode('utf8') if m else ''
    vistos = []
    for vid in re.findall(r'vid="(\{[^}]+\})"', xml):
        if vid not in vistos:
            vistos.append(vid)
    return vistos


def aplicar_tema(p, nombre, variante=0):
    tema = TEMAS / (nombre + '.thmx')
    vs = variantes(tema)
    if vs:
        p.ApplyTemplate2(str(tema), vs[variante])
    else:
        p.ApplyTheme(str(tema))


def restablecer(ppt, p):
    """Inicio › Restablecer en cada diapositiva (quita el formato puesto a mano)."""
    for i in range(1, p.Slides.Count + 1):
        p.Windows(1).View.GotoSlide(i)
        ppt.app.CommandBars.ExecuteMso('SlideReset')


def layout_sa(app, uid):
    for i in range(1, app.SmartArtLayouts.Count + 1):
        l = app.SmartArtLayouts(i)
        if l.Id == uid:
            return l
    raise LookupError(uid)


def smartart(app, s, textos, l, t, w, h, uid='urn:microsoft.com/office/officeart/2005/8/layout/process1', alt=None):
    sa = s.Shapes.AddSmartArt(layout_sa(app, uid), l, t, w, h)
    nodos = sa.SmartArt.AllNodes
    while nodos.Count < len(textos):
        nodos.Add()
    while nodos.Count > len(textos):
        nodos.Item(nodos.Count).Delete()
    for k, txt in enumerate(textos, 1):
        nodos.Item(k).TextFrame2.TextRange.Text = txt
    if alt:
        sa.AlternativeText = alt
    return sa


def grafico_lineas(s, categorias, valores, serie, titulo, l, t, w, h, etiquetas=True, alt=None, tam=None):
    sh = s.Shapes.AddChart2(-1, 65, l, t, w, h)  # xlLineMarkers
    ch = sh.Chart
    cd = ch.ChartData
    cd.Activate()
    wb = cd.Workbook
    ws = wb.Worksheets(1)
    datos = [['', serie]] + [[c, v] for c, v in zip(categorias, valores)]
    for r, fila in enumerate(datos, 1):
        for k, v in enumerate(fila, 1):
            ws.Cells(r, k).Value = v
    try:
        ws.ListObjects(1).Resize(ws.Range('A1:B%d' % len(datos)))
    except Exception:
        pass
    ws.Range('C1:D20').ClearContents()
    ch.SetSourceData("='%s'!$A$1:$B$%d" % (ws.Name, len(datos)))
    time.sleep(1)
    wb.Close()
    ch.HasTitle = True
    ch.ChartTitle.Text = titulo
    ch.HasLegend = False
    if etiquetas:
        ch.SeriesCollection(1).HasDataLabels = True
    if tam:  # texto legible a distancia (pantalla de la sala de espera)
        ch.ChartArea.Format.TextFrame2.TextRange.Font.Size = tam
        ch.ChartTitle.Format.TextFrame2.TextRange.Font.Size = tam + 6
    if alt:
        sh.AlternativeText = alt
    return sh


def tabla(s, filas, l, t, w, h, nombre='Tabla de grupos'):
    sh = s.Shapes.AddTable(len(filas), len(filas[0]), l, t, w, h)
    sh.Name = nombre
    for r, fila in enumerate(filas, 1):
        for c, v in enumerate(fila, 1):
            sh.Table.Cell(r, c).Shape.TextFrame.TextRange.Text = v
            sh.Table.Cell(r, c).Shape.TextFrame.TextRange.Font.Size = 20
    return sh


# ============================================================ laboratorios
def lab01(ppt, sol):
    """Estructura: plática «Lavado de manos» en desorden, todas con el mismo diseño."""
    D = {
        'portada': ('tituloObjetos', 'Lavado de manos: tu primera vacuna', dict(cuerpo='Clínica Universitaria Vida Sana · Educación para la Salud')),
        'agenda': ('tituloObjetos', '¿Qué aprenderás hoy?', dict(cuerpo=['Por qué lavarse las manos', 'Cuándo y cómo hacerlo', 'Agua y jabón o gel con alcohol'])),
        'sec1': ('tituloObjetos', '¿Por qué lavarse las manos?', dict(cuerpo='Bloque 1')),
        'cont1': ('tituloObjetos', 'Las manos llevan microbios a ojos, nariz y boca', dict(cuerpo=['Tocamos superficies, alimentos y personas todo el día', 'Muchos microbios no se ven', 'Agua y jabón los eliminan'])),
        'sec2': ('tituloObjetos', '¿Cuándo y cómo lavarlas?', dict(cuerpo='Bloque 2')),
        'cont2': ('tituloObjetos', 'Los momentos clave', dict(cuerpo=['Antes de comer o preparar alimentos', 'Después de ir al baño o cambiar un pañal', 'Antes y después de atender a un enfermo', 'Al llegar a casa'])),
        'comp': ('dosObjetos', 'Agua y jabón o gel con alcohol', dict(cuerpo=['Cuando las manos se ven sucias', 'Después de ir al baño', 'De 40 a 60 segundos'], cuerpo2=['Cuando no hay agua y jabón', 'Manos sin suciedad visible', 'De 20 a 30 segundos'])),
        'cierre': ('tituloObjetos', 'Gracias · ¿Preguntas?', dict(cuerpo='Lávate las manos: protege a tu familia')),
    }
    desorden = ['cont2', 'portada', 'sec2', 'cierre', 'agenda', 'comp', 'cont1', 'sec1']
    p = ppt.nueva()
    for k in desorden:
        dis, tit, tx = D[k]
        diapo(p, dis, tit, **tx)
    guardar(p, LABS / 'lab01-lavado-de-manos.pptx')
    if not sol:
        return
    p = ppt.abrir(LABS / 'lab01-lavado-de-manos.pptx')
    orden = [r'primera vacuna', r'aprender', r'por qu[eé] lavarse', r'microbios', r'cu[aá]ndo y c[oó]mo', r'momentos', r'gel con alcohol', r'preguntas']
    for i, pat in enumerate(orden, 1):
        buscar(p, pat).MoveTo(i)
    buscar(p, 'primera vacuna').CustomLayout = p.SlideMaster.CustomLayouts(LAYOUT['titulo'])
    for pat in (r'por qu[eé] lavarse', r'cu[aá]ndo y c[oó]mo'):
        buscar(p, pat).CustomLayout = p.SlideMaster.CustomLayouts(LAYOUT['seccion'])
    comp = buscar(p, 'gel con alcohol')
    comp.CustomLayout = p.SlideMaster.CustomLayouts(LAYOUT['comparacion'])
    m = marcadores(comp)
    texto(m['enc1'], 'Agua y jabón')
    texto(m['enc2'], 'Gel con alcohol')
    sp = p.SectionProperties
    sp.AddBeforeSlide(1, 'Introducción')
    sp.AddBeforeSlide(3, '¿Por qué lavarse las manos?')
    sp.AddBeforeSlide(5, '¿Cuándo y cómo lavarlas?')
    sp.AddBeforeSlide(8, 'Cierre')
    guardar(p, SOL_LABS / 'lab01-lavado-de-manos-solucion.pptx')


def lab02(ppt, sol):
    """Diseño: plática de hipertensión con formato manual deficiente."""
    p = ppt.nueva()
    s = diapo(p, 'titulo', 'Hipertensión: conoce tus números', subtitulo='Plática para pacientes · Clínica Universitaria Vida Sana')
    m = marcadores(s)
    fmt(m['titulo'], 'Brush Script MT', 32, '#7F7F7F')
    fmt(m['subtitulo'], 'Comic Sans MS', 14, '#BFBFBF')
    s = diapo(p, 'tituloObjetos', '¿Qué es la presión arterial alta?', cuerpo=['Es la fuerza con la que la sangre empuja las paredes de las arterias', 'Cuando está alta de forma constante se llama hipertensión', 'Muchas veces no da síntomas', 'Aumenta el riesgo de infarto, embolia y daño renal', 'Se mide con un baumanómetro en mmHg', 'Tiene dos números: sistólica y diastólica', 'Puede afectar a jóvenes y adultos', 'Se puede controlar con hábitos y tratamiento'])
    m = marcadores(s)
    fmt(m['titulo'], 'Impact', 20)
    fmt(m['cuerpo'], 'Times New Roman', 14, '#C0C0C0')
    s = diapo(p, 'tituloObjetos', 'Cifras de referencia', cuerpo=['Normal: menos de 120/80 mmHg', 'Elevada: de 120/80 a 139/89', 'Hipertensión: 140/90 o más (se confirma con varias tomas)'])
    fmt(marcadores(s)['cuerpo'], 'Courier New', 16, '#FFC000')
    s = diapo(p, 'tituloObjetos', 'Acciones para controlarla', cuerpo=['Mide tu presión al menos una vez al año', 'Reduce la sal y los alimentos procesados', 'Camina 30 minutos al día', 'Toma tus medicamentos como te indicaron'])
    m = marcadores(s)
    fmt(m['titulo'], None, 24, '#FFFF00')
    fmt(m['cuerpo'], None, 28, None, True)
    guardar(p, LABS / 'lab02-hipertension.pptx')
    if not sol:
        return
    p = ppt.abrir(LABS / 'lab02-hipertension.pptx')
    aplicar_tema(p, 'Retrospect', 2)
    restablecer(ppt, p)
    s2 = buscar(p, 'presión arterial alta')
    cuerpo = marcadores(s2)['cuerpo'].TextFrame.TextRange
    cuerpo.Paragraphs(8).Delete()
    cuerpo.Paragraphs(7).Delete()
    for i in range(1, p.Slides.Count + 1):
        for papel, sh in marcadores(p.Slides(i)).items():
            if sh is not None and papel != 'titulo' and sh.TextFrame.HasText:
                sh.TextFrame.TextRange.Font.Size = 24
    guardar(p, SOL_LABS / 'lab02-hipertension-solucion.pptx')


def lab03(ppt, sol):
    """Imágenes, iconos y formas: infografía de higiene de manos con la imagen deformada."""
    p = ppt.nueva()
    diapo(p, 'titulo', 'Higiene de manos', subtitulo='Campaña de la Clínica Universitaria Vida Sana')
    s = diapo(p, 'soloTitulo', 'Lávate las manos en los momentos clave')
    imagen(s, IMG / 'lavado-de-manos.png', 60, 150, 430, 180, nombre='Imagen lavado de manos')
    guardar(p, LABS / 'lab03-higiene-de-manos.pptx')
    if not sol:
        return
    p = ppt.abrir(LABS / 'lab03-higiene-de-manos.pptx')
    s = buscar(p, 'momentos clave')
    im = figura(s, 'Imagen lavado de manos')
    im.LockAspectRatio = 0
    im.ScaleHeight(1, -1)
    im.ScaleWidth(1, -1)
    im.LockAspectRatio = -1
    lado = (im.Width - im.Height) / 2
    im.PictureFormat.CropLeft = lado
    im.PictureFormat.CropRight = lado
    im.Width = 300
    im.Left, im.Top = 60, 150
    im.AutoShapeType = 9  # msoShapeOval: recortar a la forma Elipse
    im.AlternativeText = 'Dos manos con jabón y espuma bajo el chorro de agua de una llave.'
    for k, ic in enumerate(['gota', 'jabon', 'mano']):
        imagen(s, ICO / (ic + '.svg'), 470 + k * 150, 160, 96, 96, nombre='Icono ' + ic, decorativo=True)
    forma(s, 'Mensaje', 'Lávate de 40 a 60 segundos', 470, 330, 400, 90)
    guardar(p, SOL_LABS / 'lab03-higiene-de-manos-solucion.pptx')


GRUPOS = [['Grupo', 'Dosis', 'Cuándo'], ['Personal de salud', '1', 'Cada temporada (octubre a marzo)'], ['Adultos de 60 años o más', '1', 'Cada temporada'], ['Embarazadas', '1', 'En cualquier trimestre'], ['Niñas y niños de 6 a 59 meses', '1 (2 la primera vez)', 'Cada temporada']]
MESES = ['Oct', 'Nov', 'Dic', 'Ene', 'Feb', 'Mar']
DOSIS = [420, 980, 760, 510, 300, 140]


def lab04(ppt, sol):
    """SmartArt, tablas y gráficos: informe de la campaña de vacunación."""
    p = ppt.nueva()
    diapo(p, 'titulo', 'Campaña de vacunación contra influenza', subtitulo='Informe · Clínica Universitaria Vida Sana')
    diapo(p, 'tituloObjetos', 'El día de tu vacuna', cuerpo=['Registro', 'Valoración', 'Aplicación', 'Observación de 15 minutos'], notas='Convierte estas viñetas en un SmartArt de proceso (Inicio › Convertir a SmartArt).')
    diapo(p, 'soloTitulo', '¿Quién debe vacunarse?', notas='Datos para la tabla (Grupo | Dosis | Cuándo):\r' + '\r'.join(' | '.join(f) for f in GRUPOS[1:]))
    diapo(p, 'soloTitulo', 'Dosis aplicadas por mes', notas='Datos para el gráfico de líneas (dosis aplicadas): ' + ', '.join('%s %d' % x for x in zip(MESES, DOSIS)) + '.')
    guardar(p, LABS / 'lab04-campana-vacunacion.pptx')
    if not sol:
        return
    p = ppt.abrir(LABS / 'lab04-campana-vacunacion.pptx')
    s = buscar(p, 'día de tu vacuna')
    c = marcadores(s)['cuerpo']
    l, t, w, h = c.Left, c.Top, c.Width, c.Height
    c.Delete()
    smartart(ppt.app, s, ['Registro', 'Valoración', 'Aplicación', 'Observación de 15 minutos'], l, t, w, h, alt='Proceso de cuatro pasos: registro, valoración, aplicación y observación de 15 minutos.')
    s = buscar(p, 'quién debe vacunarse')
    tabla(s, GRUPOS, 50, 140, 860, 320)
    s = buscar(p, 'dosis aplicadas')
    grafico_lineas(s, MESES, DOSIS, 'Dosis aplicadas', 'Noviembre fue el mes con más dosis', 60, 130, 840, 380, alt='Gráfico de líneas: las dosis subieron de 420 en octubre a 980 en noviembre y bajaron hasta 140 en marzo.')
    guardar(p, SOL_LABS / 'lab04-campana-vacunacion-solucion.pptx')


def lab05(ppt, sol):
    """Audio, video e hipervínculos: plática interactiva de prevención de infecciones."""
    p = ppt.nueva()
    diapo(p, 'titulo', 'Prevención de infecciones', subtitulo='Plática interactiva · Clínica Universitaria Vida Sana')
    s = diapo(p, 'soloTitulo', 'Menú: elige un tema')
    forma(s, 'Botón Lavado de manos', 'Lavado de manos', 120, 200, 320, 70)
    forma(s, 'Botón Vacunación', 'Vacunación', 520, 200, 320, 70)
    forma(s, 'Botón Más información', 'Más información', 320, 330, 320, 70)
    s = diapo(p, 'soloTitulo', 'Lavado de manos')
    forma(s, 'Volver al menú 1', 'Volver al menú', 690, 450, 220, 60, 20)
    s = diapo(p, 'tituloObjetos', 'Vacunación', cuerpo=['Vacúnate cada temporada de influenza', 'Revisa tu cartilla de vacunación', 'Pregunta en el módulo de vacunación'])
    marcadores(s)['cuerpo'].Height = 290
    forma(s, 'Volver al menú 2', 'Volver al menú', 690, 450, 220, 60, 20)
    guardar(p, LABS / 'lab05-prevencion-interactiva.pptx')
    if not sol:
        return
    p = ppt.abrir(LABS / 'lab05-prevencion-interactiva.pptx')
    menu, lav, vac, port = buscar(p, 'men[uú]'), buscar(p, '^lavado de manos$'), buscar(p, '^vacunaci[oó]n$'), p.Slides(1)
    vincular_diapo(figura(menu, 'Botón Lavado de manos'), lav)
    vincular_diapo(figura(menu, 'Botón Vacunación'), vac)
    hl = figura(menu, 'Botón Más información').ActionSettings(1).Hyperlink
    hl.Address = 'https://www.gob.mx/salud'
    hl.ScreenTip = 'Página de la Secretaría de Salud'
    vincular_diapo(figura(lav, 'Volver al menú 1'), menu)
    vincular_diapo(figura(vac, 'Volver al menú 2'), menu)
    v = lav.Shapes.AddMediaObject2(str(MEDIA / 'video-lavado-de-manos.mp4'), False, True, 60, 130, 560, 315)
    v.Name = 'Video lavado de manos'
    v.AlternativeText = 'Video de 16 segundos con los 6 pasos del lavado de manos.'
    v.AnimationSettings.PlaySettings.PlayOnEntry = -1
    inicio_medio(lav, v, CON)
    nota(lav, 'Video de 16 segundos con subtítulos: muestra los 6 pasos del lavado de manos, de mojar las manos a enjuagar y secar.')
    a = port.Shapes.AddMediaObject2(str(MEDIA / 'musica-sala-de-espera.wav'), False, True, 880, 460, 48, 48)
    a.Name = 'Música de fondo'
    ps = a.AnimationSettings.PlaySettings
    ps.PlayOnEntry = -1
    ps.StopAfterSlides = 999
    ps.LoopUntilStopped = -1
    ps.HideWhileNotPlaying = -1
    inicio_medio(port, a, CON)
    ruta = SOL_LABS / 'lab05-prevencion-interactiva-solucion.pptx'
    guardar(p, ruta)
    video_pantalla_completa(ruta)


def lab06(ppt, sol):
    """Transiciones: informe del Comité de Calidad con transiciones llamativas y sonidos."""
    p = ppt.nueva()
    snd = str(sonido_aplauso())
    filas = [
        ('titulo', 'Informe del Comité de Calidad 2026', dict(subtitulo='Clínica Universitaria Vida Sana'), 'vortice', 3, True),
        ('tituloObjetos', 'Agenda', dict(cuerpo=['Resultados del semestre', 'Acciones de mejora', 'Acuerdos']), 'cubo', 1.25, False),
        ('seccion', 'Resultados del semestre', dict(texto='Enero a junio'), 'cortinas', 2.75, True),
        ('tituloObjetos', 'La satisfacción de pacientes subió a 92 %', dict(cuerpo=['Encuesta de salida con 1,240 respuestas', 'Mejor calificado: trato del personal', 'Por mejorar: tiempo de espera']), 'galeria', 3, False),
        ('tituloObjetos', 'La espera promedio bajó a 18 minutos', dict(cuerpo=['Citas escalonadas en la sede Centro', 'Registro previo en línea', 'Meta del próximo semestre: 15 minutos']), 'voltear', 1.25, False),
        ('seccion', 'Acciones de mejora', dict(texto='Julio a diciembre'), 'warp', 1, False),
        ('titulo', 'Gracias', dict(subtitulo='Comité de Calidad · ext. 120'), 'vortice', 3, True),
    ]
    for dis, tit, tx, ef, dur, sonido in filas:
        s = diapo(p, dis, tit, **tx)
        tr = s.SlideShowTransition
        tr.EntryEffect = EF[ef]
        tr.Duration = dur
        if sonido:
            tr.SoundEffect.ImportFromFile(snd)
    guardar(p, LABS / 'lab06-comite-calidad.pptx')
    if not sol:
        return
    p = ppt.abrir(LABS / 'lab06-comite-calidad.pptx')
    for i in range(1, p.Slides.Count + 1):
        s = p.Slides(i)
        tr = s.SlideShowTransition
        seccion = s.CustomLayout.Index == LAYOUT['seccion']
        tr.EntryEffect = EF['push_izq'] if seccion else EF['fade']
        tr.Duration = 1 if seccion else 0.7
        tr.SoundEffect.Type = 0  # ppSoundNone
    guardar(p, SOL_LABS / 'lab06-comite-calidad-solucion.pptx')


def lab07(ppt, sol):
    """Animaciones: transmisión de la influenza (trayectoria, énfasis, panel e intervalos)."""
    p = ppt.nueva()
    s = diapo(p, 'soloTitulo', '¿Cómo se transmite la influenza?')
    imagen(s, ICO / 'persona.svg', 90, 190, 150, 150, 'Persona enferma', 'Persona enferma que tose')
    imagen(s, ICO / 'virus.svg', 265, 225, 80, 80, 'Virus', 'Virus de la influenza')
    imagen(s, ICO / 'persona.svg', 720, 190, 150, 150, 'Persona sana', 'Persona sana')
    forma(s, 'Mensaje clave', 'Cúbrete al toser y estornudar', 230, 410, 500, 80, 26)
    s2 = diapo(p, 'soloTitulo', 'Así te proteges')
    cs = [forma(s2, 'Consejo %d' % n, t, 120, y, 720, 80, 24) for n, t, y in [(1, 'Consejo 1: Vacúnate cada año', 140), (2, 'Consejo 2: Lávate las manos con frecuencia', 245), (3, 'Consejo 3: Si tienes síntomas, quédate en casa', 350)]]
    for k in (2, 0, 1):
        s2.TimeLine.MainSequence.AddEffect(cs[k], AN['desvanecer'], 0, CLIC)
    guardar(p, LABS / 'lab07-influenza-animada.pptx')
    if not sol:
        return
    p = ppt.abrir(LABS / 'lab07-influenza-animada.pptx')
    s = buscar(p, 'transmite')
    seq = s.TimeLine.MainSequence
    v, sana, msj = figura(s, 'Virus'), figura(s, 'Persona sana'), figura(s, 'Mensaje clave')
    e = seq.AddEffect(v, AN['zoom'], 0, CLIC)
    e.Timing.Duration = 0.5
    t = seq.AddEffect(v, AN['tray_der'], 0, DESPUES)
    t.Timing.Duration = 2
    dx = ((sana.Left + sana.Width / 2) - (v.Left + v.Width / 2)) / 960
    dy = ((sana.Top + sana.Height / 2) - (v.Top + v.Height / 2)) / 540
    t.Behaviors(1).MotionEffect.Path = 'M 0 0 L %.4f %.4f E' % (dx, dy)
    pu = seq.AddEffect(msj, AN['pulso'], 0, DESPUES)
    pu.Timing.Duration = 0.5
    s2 = buscar(p, 'te proteges')
    seq2 = s2.TimeLine.MainSequence
    for n in (1, 2, 3):
        for i in range(1, seq2.Count + 1):
            if seq2.Item(i).Shape.Name == 'Consejo %d' % n:
                seq2.Item(i).MoveTo(n)
                break
    for n in (2, 3):
        ef = seq2.Item(n)
        ef.Timing.TriggerType = DESPUES
        ef.Timing.TriggerDelayTime = 0.5
    guardar(p, SOL_LABS / 'lab07-influenza-animada-solucion.pptx')


def lab08(ppt, sol):
    """Presentación automática: la plática para la sala de espera."""
    p = ppt.nueva()
    filas = [
        ('titulo', 'Vacunación contra influenza: lo que debes saber', dict(subtitulo='Clínica Universitaria Vida Sana'), None),
        ('tituloObjetos', '¿Por qué vacunarte cada año?', dict(cuerpo=['El virus cambia cada temporada', 'La vacuna reduce complicaciones y hospitalizaciones', 'Proteges a bebés y a personas mayores']), 'La influenza puede complicarse en adultos mayores, embarazadas y personas con enfermedades crónicas.'),
        ('tituloObjetos', '¿Quién debe vacunarse?', dict(cuerpo=['Personal de salud', 'Adultos de 60 años o más', 'Embarazadas', 'Niñas y niños de 6 a 59 meses', 'Personas con enfermedades crónicas']), None),
        ('tituloObjetos', '¿Dónde y cuándo?', dict(cuerpo=['Módulo de vacunación, planta baja', 'Lunes a viernes de 8:00 a 14:00', 'Trae tu cartilla de vacunación']), 'Recuerda que la vacuna es gratuita para los grupos prioritarios.'),
        ('titulo', 'Vacúnate: protégete y protege a tu familia', dict(subtitulo='¿Dudas? Pregunta en recepción'), None),
    ]
    for dis, tit, tx, notas in filas:
        s = diapo(p, dis, tit, notas, **tx)
        s.SlideShowTransition.EntryEffect = EF['fade']
        s.SlideShowTransition.Duration = 0.7
    s2 = p.Slides(2)
    s2.TimeLine.MainSequence.AddEffect(marcadores(s2)['cuerpo'], AN['desvanecer'], 0, CLIC)
    guardar(p, LABS / 'lab08-vacunacion-sala-de-espera.pptx')
    if not sol:
        return
    p = ppt.abrir(LABS / 'lab08-vacunacion-sala-de-espera.pptx')
    notas = ['Saludo. Presento al equipo de vacunación y el propósito de la plática.', None, 'Menciona que los niños de 6 a 59 meses necesitan 2 dosis la primera vez.', None, 'Invita al público a pasar al módulo de vacunación al terminar.']
    for i in range(1, p.Slides.Count + 1):
        s = p.Slides(i)
        if notas[i - 1]:
            nota(s, notas[i - 1])
        tr = s.SlideShowTransition
        tr.AdvanceOnTime = -1
        tr.AdvanceTime = [6, 8, 8, 7, 6][i - 1]
        seq = s.TimeLine.MainSequence
        for k in range(1, seq.Count + 1):
            seq.Item(k).Timing.TriggerType = DESPUES
    ss = p.SlideShowSettings
    ss.ShowType = 3  # ppShowTypeKiosk
    ss.LoopUntilStopped = -1
    ss.AdvanceMode = 2  # ppSlideShowUseSlideTimings
    guardar(p, SOL_LABS / 'lab08-vacunacion-sala-de-espera-solucion.ppsx')


# ============================================================ integrador
def integrador(ppt, sol):
    p = ppt.nueva()
    s = diapo(p, 'titulo', 'Vacúnate contra la influenza', subtitulo='Temporada 2026–2027 · Clínica Universitaria Vida Sana', notas='Presentación para la pantalla de la sala de espera. Las tareas están en la página del reto integrador.')
    diapo(p, 'tituloObjetos', '¿Por qué vacunarte?', cuerpo=['El virus de la influenza cambia cada año', 'La vacuna reduce complicaciones y hospitalizaciones', 'Proteges a bebés, personas mayores y personas con enfermedades crónicas'])
    diapo(p, 'tituloObjetos', '¿Quién debe vacunarse?', cuerpo=['Personal de salud', 'Adultos de 60 años o más', 'Embarazadas', 'Niñas y niños de 6 a 59 meses', 'Personas con enfermedades crónicas'])
    diapo(p, 'tituloObjetos', 'El día de tu vacuna', cuerpo=['Registro', 'Valoración', 'Aplicación', 'Observación de 15 minutos'])
    diapo(p, 'soloTitulo', 'Dosis aplicadas la temporada pasada', notas='Datos para el gráfico: ' + ', '.join('%s %d' % x for x in zip(MESES, DOSIS)) + '.')
    diapo(p, 'tituloObjetos', '¿Dónde y cuándo?', cuerpo=['Módulo de vacunación, planta baja', 'Lunes a viernes de 8:00 a 14:00', 'Gratuita para los grupos prioritarios'])
    diapo(p, 'titulo', 'Vacúnate: protégete y protege a tu familia', subtitulo='¿Dudas? Pregunta en recepción')
    guardar(p, INTEG / 'int-sala-de-espera.pptx')
    if not sol:
        return
    p = ppt.abrir(INTEG / 'int-sala-de-espera.pptx')
    aplicar_tema(p, 'Retrospect', 1)
    restablecer(ppt, p)
    sp = p.SectionProperties
    sp.AddBeforeSlide(1, 'Bienvenida')
    sp.AddBeforeSlide(2, '¿Por qué vacunarte?')
    sp.AddBeforeSlide(6, '¿Dónde y cuándo?')
    s2 = buscar(p, 'por qué vacunarte')
    c = marcadores(s2)['cuerpo']
    c.Width = 520
    foto = imagen(s2, IMG / 'vacunacion.png', 620, 170, 300, 225, 'Imagen vacunación', 'Jeringa y frasco de vacuna frente a un escudo de protección.')
    s4 = buscar(p, 'día de tu vacuna')
    c = marcadores(s4)['cuerpo']
    l, t, w, h = c.Left, c.Top, c.Width, c.Height
    c.Delete()
    sa = smartart(ppt.app, s4, ['Registro', 'Valoración', 'Aplicación', 'Observación de 15 minutos'], l, t, w, min(h, 260), alt='Proceso: registro, valoración, aplicación y observación de 15 minutos.')
    s5 = buscar(p, 'dosis aplicadas')
    grafico_lineas(s5, MESES, DOSIS, 'Dosis aplicadas', 'Noviembre fue el mes con más dosis', 60, 125, 840, 360, alt='Gráfico de líneas de dosis por mes con el máximo en noviembre.', tam=16)
    s6 = buscar(p, 'dónde y cuándo')
    iconos = [imagen(s6, ICO / (ic + '.svg'), 700 + k * 0, 150 + k * 110, 90, 90, 'Icono ' + ic, decorativo=True) for k, ic in enumerate(['hospital', 'calendario', 'check'])]
    c = marcadores(s6)['cuerpo']
    c.Width = 560
    a = p.Slides(1).Shapes.AddMediaObject2(str(MEDIA / 'musica-sala-de-espera.wav'), False, True, 880, 460, 48, 48)
    a.Name = 'Música de fondo'
    ps = a.AnimationSettings.PlaySettings
    ps.PlayOnEntry = -1
    ps.StopAfterSlides = 999
    ps.LoopUntilStopped = -1
    ps.HideWhileNotPlaying = -1
    inicio_medio(p.Slides(1), a, CON)
    s2.TimeLine.MainSequence.AddEffect(foto, AN['desvanecer'], 0, DESPUES)
    s4.TimeLine.MainSequence.AddEffect(sa, AN['barrido'], 0, DESPUES)
    for k, ic in enumerate(iconos):
        e = s6.TimeLine.MainSequence.AddEffect(ic, AN['zoom'], 0, DESPUES)
        e.Timing.TriggerDelayTime = 0.3
    for i in range(1, p.Slides.Count + 1):
        tr = p.Slides(i).SlideShowTransition
        tr.EntryEffect = EF['fade']
        tr.Duration = 0.7
        tr.AdvanceOnTime = -1
        tr.AdvanceTime = 8
    for i in range(1, p.Slides.Count + 1):
        for papel, sh in marcadores(p.Slides(i)).items():
            if sh is not None and papel != 'titulo' and sh.HasTextFrame and sh.TextFrame.HasText:
                if sh.TextFrame.TextRange.Font.Size < 26:
                    sh.TextFrame.TextRange.Font.Size = 26
    ss = p.SlideShowSettings
    ss.ShowType = 3
    ss.LoopUntilStopped = -1
    ss.AdvanceMode = 2
    guardar(p, SOL_INT / 'int-sala-de-espera-solucion.ppsx')


TAREAS = [('lab01', lab01), ('lab02', lab02), ('lab03', lab03), ('lab04', lab04), ('lab05', lab05), ('lab06', lab06), ('lab07', lab07), ('lab08', lab08), ('int', integrador)]


def main():
    ppt = Ppt()
    try:
        for nombre, fn in TAREAS:
            if SOLO and nombre not in SOLO:
                continue
            print(nombre)
            fn(ppt, SOLUCIONES)
    finally:
        ppt.salir()


if __name__ == '__main__':
    main()

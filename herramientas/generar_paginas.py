"""Genera las páginas HTML del sitio (PowerPoint para Ciencias de la Salud: 8 módulos en una sesión de 3 horas).
Todas las páginas comparten la misma lista de scripts y hojas de estilo.

Uso:  python herramientas/generar_paginas.py
"""
import pathlib

RAIZ = pathlib.Path(__file__).resolve().parent.parent
CURSO = "PowerPoint para Ciencias de la Salud"

MODULOS = [
    "Estructura de una presentación", "Diseño de diapositivas", "Imágenes, iconos y formas", "SmartArt, tablas y gráficos",
    "Audio, video e hipervínculos", "Transiciones", "Animaciones", "Presentación automática y vista del moderador",
]

ESTILOS = ["css/estilos.css", "css/diapo.css"]
SCRIPTS = [
    "vendor/jszip.min.js",
    "js/nucleo.js", "js/formato.js", "js/iconos.js", "js/curso.js", "js/galeria.js", "js/graficos.js", "js/cinta.js", "js/pagina.js",
    "js/diapo-datos.js", "js/diapo-render.js", "js/diapo.js", "js/diapo-cinta.js", "js/diapo-show.js", "js/pptx.js",
    "js/modulo.js", "js/modulos/comun.js",
]

PLANTILLA = """<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{titulo}</title>
<meta name="description" content="{descripcion}">
{robots}<link rel="icon" href="{raiz}/assets/img/favicon.svg" type="image/svg+xml">
{estilos}
</head>
<body data-raiz="{raiz}"{extra_body}>
<div id="app"><noscript><p style="padding:20px">Esta plataforma necesita JavaScript activado.</p></noscript></div>
{scripts}
<script>{arranque}</script>
</body>
</html>
"""


def scripts(raiz, extra=(), locales=()):
    lista = [f'<script src="{raiz}/assets/{s}"></script>' for s in list(SCRIPTS) + list(extra)]
    lista += [f'<script src="{s}"></script>' for s in locales]
    return "\n".join(lista)


def estilos(raiz):
    return "\n".join(f'<link rel="stylesheet" href="{raiz}/assets/{e}">' for e in ESTILOS)


def escribir(ruta, robots="", **kw):
    ruta.parent.mkdir(parents=True, exist_ok=True)
    ruta.write_text(PLANTILLA.format(robots=robots, estilos=estilos(kw["raiz"]), **kw), encoding="utf-8")


def main():
    n = len(MODULOS)
    for i, titulo in enumerate(MODULOS, 1):
        slug = f"m{i:02d}"
        escribir(RAIZ / "modulos" / f"{slug}.html", raiz="..", extra_body=f' data-modulo="{i}"',
                 titulo=f"Módulo {i} · {titulo} · {CURSO}",
                 descripcion=f"Módulo {i} del curso {CURSO}: {titulo}. Retos en un simulador de PowerPoint y laboratorio en PowerPoint real.",
                 scripts=scripts("..", [f"js/modulos/{slug}.js"]), arranque=f"LT.paginaModulo({i});")
    todos = ["js/paginas.js"] + [f"js/modulos/m{i:02d}.js" for i in range(1, n + 1)]
    paginas = {
        "index.html": (f"{CURSO} · Curso de una sesión", "Curso de PowerPoint para estudiantes del área de la salud: una sesión de 3 horas con retos en un simulador de PowerPoint y el caso de la Clínica Universitaria Vida Sana.", "LT.paginas.inicio();", []),
        "ubicacion.html": (f"Prueba de ubicación · {CURSO}", f"Prueba de ubicación del curso {CURSO}.", "LT.paginas.ubicacion();", []),
        "integrador.html": (f"Reto integrador · {CURSO}", f"Reto integrador del curso {CURSO}: pantalla de la sala de espera.", "LT.paginas.integrador();", []),
        "glosario.html": (f"Glosario y atajos · {CURSO}", "Glosario de PowerPoint en español e inglés y atajos de teclado.", "LT.paginas.glosario();", []),
        "guia.html": (f"Guía visual · {CURSO}", "Guía visual de PowerPoint: transición y animación, catálogos de efectos, jerarquía, contraste, vista del moderador y presentación automática.", "LT.guia.pagina();", ["js/guia.js"]),
    }
    for archivo, (titulo, desc, arranque, extra) in paginas.items():
        escribir(RAIZ / archivo, raiz=".", extra_body="", titulo=titulo, descripcion=desc,
                 scripts=scripts(".", todos + extra), arranque=arranque)
    escribir(RAIZ / "docente" / "index.html", raiz="..", extra_body=' class="pagina-docente"',
             robots='<meta name="robots" content="noindex, nofollow">\n',
             titulo=f"Área docente · {CURSO}", descripcion=f"Área docente protegida del curso {CURSO}.",
             scripts=scripts("..", todos + ["js/docente.js"], ["contenido.js"]), arranque="LT.docente.iniciar();")
    print("páginas generadas:", n + len(paginas) + 1)


if __name__ == "__main__":
    main()

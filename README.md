# PowerPoint para Ciencias de la Salud

Curso de PowerPoint en **una sesión de 3 horas** para estudiantes de **licenciatura del área de la salud**. Todos los retos usan el caso ficticio de la **Clínica Universitaria Vida Sana** (área de Educación para la Salud, con la Mtra. Andrea Ríos): pláticas de lavado de manos, hipertensión, vacunación contra influenza y la pantalla de la sala de espera.

Es un sitio web estático: no necesita servidor ni base de datos. El simulador de PowerPoint, la revisión de archivos .pptx, el progreso y el área docente corren en el navegador.

> Es un curso independiente: no modifica los cursos de Excel (`curso-excel-la-taza`, `curso-excel-la-taza-v2`, `curso-excel-salud`).

## Temario

| Bloque | Módulo (minutos) | Temas | Reto del caso |
|---|---|---|---|
| Diseño y contenido | 1 Estructura de una presentación (15) | Estructura, diseños de diapositiva, secciones | Ordenar la plática «Lavado de manos» |
| | 2 Diseño de diapositivas (25) | Diseño de diapositivas, temas y variantes, jerarquía visual, tipografía, uso adecuado del color | Rediseñar la plática de hipertensión |
| | 3 Imágenes, iconos y formas (20) | Imágenes, iconos, formas, alinear y distribuir, texto alternativo | Infografía de los momentos de la higiene de manos |
| | 4 SmartArt, tablas y gráficos (25) | SmartArt, tablas, gráficos | Los datos de la campaña de vacunación |
| Multimedia y movimiento | 5 Audio, video e hipervínculos (15) | Audio, video, hipervínculos | Plática interactiva de prevención de infecciones |
| | 6 Transiciones (15) | Transiciones, opciones de efecto, duración | Transiciones discretas y coherentes |
| | 7 Animaciones (25) | Animaciones por objeto, trayectorias de movimiento, panel de animación, intervalos | Animar la transmisión de la influenza |
| | 8 Presentación automática y vista del moderador (15) | Presentación automática, vista del moderador, ensayo de intervalos | Ensayar y dejar lista la presentación |

Agenda: arranque 5 min · módulos 1–4 · receso 15 min · módulos 5–8 · cierre 5 min (180 minutos). El reto integrador, **Pantalla de la sala de espera: campaña de vacunación contra influenza**, se resuelve fuera del aula.

**Transición o animación.** El curso insiste en la diferencia: una **transición** es el efecto que ocurre al pasar de una diapositiva a otra; una **animación** es un efecto aplicado a un elemento dentro de una diapositiva. El módulo 6 abre con una tabla comparativa y un ejercicio de clasificación «¿Transición o animación?», la guía visual lo retoma en su primera sección y, en los módulos 6 a 8, las preguntas y los verificadores usan esos términos.

### Cómo se trabaja cada módulo

1. **Ver:** explicación breve con ejemplos en el simulador.
2. **Completar:** micro-retos de opción, clasificación y orden.
3. **Resolver:** reto en el simulador de PowerPoint, en tres niveles (Explorador con instrucciones, Analista con pistas y Experto con criterios). El verificador revisa la presentación y explica qué falta.
4. **Transferir:** laboratorio en PowerPoint real. Se descarga un .pptx, se resuelve y se sube al sitio, que lo revisa en el navegador sin enviarlo a ningún servidor.

### El simulador

Reproduce lo esencial de PowerPoint con los nombres de la versión de escritorio en español (verificados en Microsoft 365, octubre de 2026): cinta con pestañas y fichas contextuales, panel de miniaturas con secciones, diseños con marcadores, temas y variantes, guías inteligentes al arrastrar, imágenes, iconos, formas, SmartArt, tablas, gráficos, audio, video, hipervínculos, transiciones, animaciones de entrada, énfasis, salida y trayectorias, panel de animación, presentación con diapositivas, ensayo de intervalos, presentación examinada en exposición y vista del moderador (Alt+F5).

## Área docente

- **Entrada:** enlace «Acceso docente» al pie de cualquier página, o directamente `docente/index.html`.
- **Contraseña inicial: `VidaSana-PPT-Docente-2026`.** Cámbiala antes de publicar (ver abajo).
- **Pestañas:** plan de la sesión minuto a minuto, guía teórica de referencia, soluciones de los retos, presentaciones de solución con sus guías paso a paso en PDF, reportes del grupo y notas técnicas.
- **Cifrado:** el contenido viaja cifrado con AES-GCM de 256 bits. La llave se deriva de la contraseña con PBKDF2-SHA256 (600,000 iteraciones) y se descifra en el navegador. La sesión se cierra al cerrar la pestaña.
- **Límite:** las soluciones de los retos del simulador están en el código público de cada módulo, porque el verificador las necesita. Por eso la calificación pesa más los laboratorios en PowerPoint real y el integrador.

### Carpeta privada (no se publica)

```
curso-powerpoint-salud-privado/
  docente/guia-teorica.html          guía teórica de referencia (editable)
  docente/plan-sesiones.json         guion de la sesión (los pasos de cada módulo deben sumar sus minutos)
  soluciones/laboratorios/           8 laboratorios resueltos en PowerPoint real (lab08 es .ppsx)
  soluciones/integradores/           el integrador resuelto (.ppsx)
  soluciones/guias/                  9 guías paso a paso y el documento completo, en PDF (se cifran en el área docente)
  guias-paso-a-paso/                 las mismas guías en Word (editables) y el documento completo con portada e índice
  herramientas-guias/                scripts que resolvieron los laboratorios y tomaron las capturas (ver su LEEME.md)
```

### Soluciones y guías paso a paso

Los 8 laboratorios se resolvieron en **PowerPoint de escritorio**, en nivel Experto, haciendo los pasos en la propia interfaz; cada guía documenta ese recorrido:

- texto explicativo y reglas previas;
- pasos numerados con los nombres de botones, pestañas y cuadros de diálogo en negritas;
- capturas reales de PowerPoint con llamadas naranjas numeradas (cinta, galerías, menús, panel de animación, vista del moderador, ensayo de intervalos y cuadro «Configurar presentación»);
- al final, la lista de lo que revisa el verificador del sitio.

La guía del integrador recorre el archivo resuelto y remite, para cada tarea, al laboratorio donde está el procedimiento.

Notas sobre las capturas: se tomaron con Microsoft 365 en español (octubre de 2026). Algunos nombres cambian entre versiones (por ejemplo, «Vínculo» antes era «Hipervínculo»). La cinta de PowerPoint del equipo usado muestra complementos (Acrobat, entre otros), por lo que algunos grupos aparecen contraídos.

### Cambiar la contraseña o actualizar el contenido docente

```bash
pip install cryptography
python herramientas/proteger_docente.py --clave "nueva-contraseña-larga"
```

El script vuelve a cifrar todo en `docente/contenido.js` y `docente/archivos/`; sube esas carpetas actualizadas. Si la carpeta privada está en otro lugar, indica su ruta con la variable de entorno `LT_PRIVADO`.

## Publicar en GitHub Pages

1. Crea un repositorio **nuevo** en GitHub, por ejemplo `curso-powerpoint-salud`. Con la cuenta gratuita, debe ser público para usar Pages.
2. Sube **todo el contenido de esta carpeta** a la raíz del repositorio, con sus subcarpetas. **No subas la carpeta privada.**
3. En el repositorio, abre *Settings › Pages › Build and deployment*. Elige *Source: Deploy from a branch*, la rama `main` y la carpeta `/ (root)`, y guarda.
4. En uno o dos minutos el sitio queda en `https://USUARIO.github.io/curso-powerpoint-salud/`.

El archivo `.nojekyll` evita que GitHub procese el sitio con Jekyll.

## Incrustar en Google Sites

1. Publica primero en GitHub Pages.
2. En Google Sites, usa *Insertar › Incorporar › Por URL* y pega la dirección de la página: la de inicio, la de un módulo (`.../modulos/m07.html`) o la guía visual (`.../guia.html`).
3. Elige *Página completa* y ajusta la altura: 1,200 px o más para las páginas de módulo.

Dentro de un iframe, algunos navegadores limitan el almacenamiento y la pantalla completa. Por eso la barra superior tiene el botón **«Pestaña nueva»**. La presentación con diapositivas del simulador y el área docente conviene abrirlas en su propia pestaña.

## Usar sin internet

Copia la carpeta del sitio y abre `index.html` con Chrome o Edge. Todo funciona sin conexión, incluida el área docente.

## Estructura

```
index.html              inicio: agenda de la sesión, módulos e insignias
modulos/m01–m08.html    una página por módulo
guia.html               guía visual: transición o animación, estructura, jerarquía y tipografía, color y contraste,
                        SmartArt/tabla/gráfico, catálogos de transiciones y animaciones, inicio de las animaciones,
                        vista del moderador y presentación automática
glosario.html           términos español-inglés y atajos de teclado
ubicacion.html          prueba de ubicación (&momento=post para la prueba final)
integrador.html         reto integrador, rúbrica y constancia
docente/index.html      área docente (contenido cifrado en docente/contenido.js y docente/archivos/)
assets/js/              plataforma: simulador (diapo*.js), lector de .pptx (pptx.js), cinta, widgets, páginas
assets/js/modulos/      contenido de cada módulo (mXX.js) y utilidades del caso (comun.js)
assets/media/           imágenes, iconos SVG, música y video del caso
assets/vendor/          JSZip 3.10.1
laboratorios/           8 presentaciones de laboratorio
integradores/           presentación del reto integrador
herramientas/           scripts de Python: presentaciones, páginas y cifrado
```

## Modificar el contenido

- **Textos, retos y pruebas de un módulo:** `assets/js/modulos/mXX.js`. El formato se explica en Área docente › Notas técnicas.
- **Temario y agenda:** `assets/js/curso.js`. Los minutos de la sesión deben sumar 180.
- **Presentaciones y páginas:**
  ```bash
  pip install pywin32 cryptography
  python herramientas/generar_presentaciones.py               # laboratorios e integrador (requiere PowerPoint de escritorio en Windows)
  python herramientas/generar_presentaciones.py --soluciones  # además, soluciones simplificadas en la carpeta privada
  python herramientas/generar_paginas.py                      # páginas HTML (si cambias títulos o scripts)
  python herramientas/proteger_docente.py --clave "…"         # vuelve a cifrar el área docente
  ```
  Cuidado: `--soluciones` reemplaza las soluciones hechas en la interfaz (las que documentan las guías). Úsalo solo con `--soluciones lab03` o similar si necesitas regenerar una en particular.

## Requisitos de los participantes

- Computadora con teclado y ratón y un navegador actual (Chrome, Edge, Firefox o Safari).
- PowerPoint de Microsoft 365 para Windows o Mac (recomendado). PowerPoint para la web sirve en casi todos los laboratorios, pero no tiene «Ensayar intervalos» ni «Configurar presentación», que pide el laboratorio 8.
- Para el módulo 8, de preferencia un segundo monitor o proyector; la vista del moderador también se puede practicar en una sola pantalla con **Alt+F5**.

## Datos y confidencialidad

Las cifras del caso (dosis aplicadas, satisfacción, tiempos de espera) son **ficticias**. Los mensajes de salud siguen recomendaciones de uso común, pero el curso enseña PowerPoint, no clínica. Las imágenes, los iconos, la música y el video se generaron para el curso y no muestran pacientes reales; la guía teórica incluye recomendaciones para usar fotografías de pacientes con consentimiento y sin datos identificables.

## Licencias

- El código del sitio se distribuye bajo **GPL-3.0** (archivo `LICENSE`).
- **JSZip** se distribuye bajo licencia MIT o GPLv3.
- La licencia de los contenidos didácticos queda a decisión de la institución (por ejemplo, CC BY-SA 4.0).

## Limitaciones conocidas

- El simulador reproduce lo esencial de PowerPoint, no todo: por ejemplo, no tiene Transformación (Morph), grabación de narraciones ni edición de puntos de una trayectoria.
- El lector de archivos revisa la estructura del .pptx (diseños, temas, fuentes, colores, medios, transiciones, animaciones e intervalos); no reproduce la presentación.
- Las soluciones están resueltas en nivel Experto.
- El progreso se guarda en el navegador (localStorage, clave `pptSalud.progreso.v1`). El reporte descargable sirve como respaldo.
#   c u r s o - p o w e r p o i n t  
 
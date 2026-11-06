"""Cifra el contenido del área docente.

Lee la carpeta privada (hermana del sitio: «curso-powerpoint-salud-privado», o la
variable de entorno LT_PRIVADO):

  docente/guia-teorica.html     guía teórica de referencia
  docente/plan-sesiones.json    guion minuto a minuto de la sesión
  soluciones/**                 presentaciones resueltas y guías paso a paso en PDF
                                (las presentaciones las genera generar_presentaciones.py --soluciones)

y escribe en el sitio:

  docente/contenido.js          guía + plan + índice de archivos (cifrado)
  docente/archivos/*.js         cada archivo de solución (cifrado)

Cifrado: AES-GCM de 256 bits; la llave se deriva de la contraseña con PBKDF2-SHA256.
El navegador la descifra con WebCrypto (assets/js/docente.js). Cada ejecución usa una
sal nueva, así que cambiar la contraseña invalida las sesiones abiertas.

Uso:  python herramientas/proteger_docente.py --clave "contraseña"
      python herramientas/proteger_docente.py            (la pide sin mostrarla)
"""
import argparse
import base64
import datetime as dt
import getpass
import json
import os
import pathlib
import re
import sys

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

RAIZ = pathlib.Path(__file__).resolve().parent.parent
PRIVADO = pathlib.Path(os.environ.get("LT_PRIVADO") or RAIZ.parent / (RAIZ.name + "-privado"))
ITERACIONES = 600_000


def b64(b):
    return base64.b64encode(b).decode("ascii")


def main():
    ap = argparse.ArgumentParser(description="Cifra el contenido del área docente.")
    ap.add_argument("--clave", help="contraseña docente (si se omite, se pide sin mostrarla)")
    args = ap.parse_args()
    clave = args.clave
    if not clave:
        clave = getpass.getpass("Contraseña docente: ")
        if clave != getpass.getpass("Repite la contraseña: "):
            sys.exit("Las contraseñas no coinciden.")
    if len(clave) < 10:
        sys.exit("Usa una contraseña de al menos 10 caracteres.")

    guia = PRIVADO / "docente" / "guia-teorica.html"
    plan = PRIVADO / "docente" / "plan-sesiones.json"
    soluciones = PRIVADO / "soluciones"
    for p in (guia, plan, soluciones):
        if not p.exists():
            sys.exit(f"No se encontró {p}. Revisa la carpeta privada (o la variable LT_PRIVADO).")

    sal = os.urandom(16)
    llave = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=sal, iterations=ITERACIONES).derive(clave.encode("utf-8"))
    aes = AESGCM(llave)

    def cifrar(datos):
        iv = os.urandom(12)
        return {"iv": b64(iv), "datos": b64(aes.encrypt(iv, datos, None))}

    destino = RAIZ / "docente" / "archivos"
    destino.mkdir(parents=True, exist_ok=True)
    for viejo in destino.glob("*.js"):
        viejo.unlink()
    archivos = []
    for f in sorted(soluciones.rglob("*")):
        if not f.is_file() or f.name.startswith("~$"):
            continue
        ident = re.sub(r"[^a-z0-9]+", "-", f.name.lower()).strip("-")
        cuerpo = json.dumps(dict(nombre=f.name, **cifrar(f.read_bytes())))
        (destino / f"{ident}.js").write_text(
            "(window.LT_DOCENTE_ARCHIVOS = window.LT_DOCENTE_ARCHIVOS || {})[" + json.dumps(f.name) + "] = " + cuerpo + ";\n", encoding="utf-8")
        archivos.append({"nombre": f.name, "js": f"archivos/{ident}.js", "grupo": f.parent.name, "bytes": f.stat().st_size})

    contenido = {
        "version": 2,
        "generado": dt.datetime.now().isoformat(timespec="seconds"),
        "guiaTeorica": re.sub(r"<!--.*?-->", "", guia.read_text(encoding="utf-8"), flags=re.S).strip(),
        "plan": json.loads(plan.read_text(encoding="utf-8")),
        "archivos": archivos,
    }
    paquete = dict(v=1, kdf="PBKDF2-SHA256", iter=ITERACIONES, sal=b64(sal), **cifrar(json.dumps(contenido, ensure_ascii=False).encode("utf-8")))
    (RAIZ / "docente" / "contenido.js").write_text(
        "/* Contenido cifrado del área docente (AES-GCM; llave derivada de la contraseña con PBKDF2-SHA256).\n"
        "   Generado por herramientas/proteger_docente.py. No lo edites a mano. */\n"
        "window.LT_DOCENTE_CIFRADO = " + json.dumps(paquete) + ";\n", encoding="utf-8")
    print(f"Área docente cifrada: guía, plan y {len(archivos)} archivos de solución -> {RAIZ / 'docente'}")


if __name__ == "__main__":
    main()

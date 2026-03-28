"""
docx_to_pdf.py
--------------
Converts a DOCX file to PDF using LibreOffice headless mode,
preserving all formatting, fonts, layout, styles, and images.

Called by redactor.js:
    python docx_to_pdf.py <input_docx> <output_pdf>

Requires LibreOffice installed:
  Windows : https://www.libreoffice.org/download/download-libreoffice/
  Linux   : sudo apt install libreoffice
  macOS   : brew install --cask libreoffice

Prints OK:<output_pdf> on success, error message on stderr on failure.
"""

import sys
import os
import subprocess
import shutil
import tempfile
import glob


def find_libreoffice():
    """
    Return the LibreOffice executable path.
    Checks common Windows, Linux, and macOS locations.
    """
    # Check PATH first (Linux/macOS)
    for cmd in ("libreoffice", "soffice"):
        if shutil.which(cmd):
            return shutil.which(cmd)

    # Windows common install paths
    win_paths = [
        r"C:\Program Files\LibreOffice\program\soffice.exe",
        r"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
    ]
    for p in win_paths:
        if os.path.exists(p):
            return p

    return None


def main():
    if len(sys.argv) != 3:
        print("Usage: docx_to_pdf.py <input_docx> <output_pdf>", file=sys.stderr)
        sys.exit(1)

    input_docx  = sys.argv[1]
    output_pdf  = sys.argv[2]
    output_dir  = os.path.dirname(output_pdf)
    output_name = os.path.basename(output_pdf)

    if not os.path.exists(input_docx):
        print(f"Input file not found: {input_docx}", file=sys.stderr)
        sys.exit(1)

    lo = find_libreoffice()
    if not lo:
        print(
            "LibreOffice not found. Install from https://www.libreoffice.org/download/download-libreoffice/ "
            "and ensure it is added to PATH.",
            file=sys.stderr
        )
        sys.exit(1)

    # Use a dedicated temp user profile dir so parallel conversions don't clash
    with tempfile.TemporaryDirectory() as tmp_profile:
        cmd = [
            lo,
            "--headless",
            "--norestore",
            "--nofirststartwizard",
            f"-env:UserInstallation=file:///{tmp_profile.replace(os.sep, '/')}",
            "--convert-to", "pdf",
            "--outdir", output_dir,
            input_docx,
        ]

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=60,
        )

        if result.returncode != 0:
            print(f"LibreOffice error: {result.stderr}", file=sys.stderr)
            sys.exit(1)

    # LibreOffice names the output after the input file, e.g. myfile.docx → myfile.pdf
    input_stem   = os.path.splitext(os.path.basename(input_docx))[0]
    lo_output    = os.path.join(output_dir, input_stem + ".pdf")

    if not os.path.exists(lo_output):
        # Fallback: find any newly created pdf in output_dir
        pdfs = glob.glob(os.path.join(output_dir, "*.pdf"))
        if not pdfs:
            print("LibreOffice conversion produced no PDF output.", file=sys.stderr)
            sys.exit(1)
        lo_output = max(pdfs, key=os.path.getmtime)

    # Rename to the caller's requested output name
    if os.path.abspath(lo_output) != os.path.abspath(output_pdf):
        shutil.move(lo_output, output_pdf)

    print(f"OK:{output_pdf}")


if __name__ == "__main__":
    main()
"""Small pdf2image-compatible adapter used by the document render QA."""

from __future__ import annotations

import os

import pypdfium2 as pdfium


def pdfinfo_from_path(path, *args, **kwargs):
    document = pdfium.PdfDocument(path)
    try:
        page = document[0]
        width, height = page.get_size()
        return {
            "Pages": len(document),
            "Page size": f"{width:.2f} x {height:.2f} pts",
        }
    finally:
        document.close()


def convert_from_path(
    path,
    *,
    dpi=200,
    fmt="png",
    output_folder=None,
    paths_only=False,
    output_file="page",
    **kwargs,
):
    output_folder = output_folder or os.getcwd()
    os.makedirs(output_folder, exist_ok=True)
    document = pdfium.PdfDocument(path)
    results = []
    try:
        scale = float(dpi) / 72.0
        for index in range(len(document)):
            page = document[index]
            bitmap = page.render(scale=scale)
            image = bitmap.to_pil()
            filename = f"{output_file}0001-{index + 1:02d}.{fmt}"
            target = os.path.join(output_folder, filename)
            image.save(target, format=fmt.upper())
            results.append(target if paths_only else image)
            bitmap.close()
        return results
    finally:
        document.close()

"""
report_generator.py  (fixed)
----------------------------
Fix 1 — Summary cards: replaced nested-list cell content with a proper
         2-row Table per card so value and label never overlap.
Fix 2 — Highlighting: overlay is now merged UNDER the original page
         content so yellow background sits behind text, keeping it
         fully readable.
"""

import sys
import os
import json
import io
import re
import shutil
import subprocess
import tempfile
import glob
from datetime import datetime

import pdfplumber
from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, black, white
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT


# ── Colours ───────────────────────────────────────────────────────────────────

YELLOW     = HexColor("#FFD700")
DARK_BG    = HexColor("#1E1E2E")
ACCENT     = HexColor("#4F86C6")
LIGHT_GREY = HexColor("#F5F5F5")
MID_GREY   = HexColor("#CCCCCC")
TEXT_DARK  = HexColor("#222222")
HIGH_GREEN = HexColor("#27AE60")
LOW_ORANGE = HexColor("#E67E22")


# ── PII display names ─────────────────────────────────────────────────────────

PII_LABELS = {
    "aadhaar":           "Aadhaar Number",
    "pan":               "PAN Card",
    "phone":             "Phone Number",
    "email":             "Email Address",
    "ifsc":              "IFSC Code",
    "bankAccount":       "Bank Account Number",
    "paymentCardNumber": "Payment Card Number",
}


# ── Normalise helper ──────────────────────────────────────────────────────────

def normalise(s):
    return re.sub(r"\s+", "", s).lower()


# ── Section 1: Statistics Dashboard ──────────────────────────────────────────

def build_stats_pdf(pii_map, original_filename, output_path):

    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=18*mm, rightMargin=18*mm,
        topMargin=12*mm,  bottomMargin=15*mm,
    )

    W = A4[0] - 36*mm   # usable width

    # ── Styles ──
    title_style = ParagraphStyle("rpt_title",
        fontSize=20, fontName="Helvetica-Bold",
        textColor=white, alignment=TA_CENTER, leading=26)

    section_style = ParagraphStyle("rpt_section",
        fontSize=13, fontName="Helvetica-Bold",
        textColor=ACCENT, spaceBefore=12, spaceAfter=4)

    small_style = ParagraphStyle("rpt_small",
        fontSize=9, fontName="Helvetica",
        textColor=TEXT_DARK, leading=13)

    # Summary card styles — FIX 1:
    # Use two separate Paragraph rows inside a nested Table so the big
    # number and the label text are in different rows and never overlap.
    card_num_style = ParagraphStyle("card_num",
        fontSize=28, fontName="Helvetica-Bold",
        alignment=TA_CENTER, leading=34, spaceAfter=0)

    card_lbl_style = ParagraphStyle("card_lbl",
        fontSize=8, fontName="Helvetica",
        textColor=HexColor("#555555"),
        alignment=TA_CENTER, leading=11, spaceBefore=2)

    hdr_style = ParagraphStyle("tbl_hdr",
        fontSize=9, fontName="Helvetica-Bold",
        textColor=white, alignment=TA_CENTER)

    cell_style = ParagraphStyle("tbl_cell",
        fontSize=9, fontName="Helvetica",
        textColor=TEXT_DARK, alignment=TA_LEFT, leading=13)

    conf_high_style = ParagraphStyle("conf_high",
        fontSize=9, fontName="Helvetica-Bold",
        textColor=HIGH_GREEN, alignment=TA_CENTER)

    conf_low_style = ParagraphStyle("conf_low",
        fontSize=9, fontName="Helvetica-Bold",
        textColor=LOW_ORANGE, alignment=TA_CENTER)

    footer_style = ParagraphStyle("footer",
        fontSize=8, fontName="Helvetica",
        textColor=HexColor("#888888"), alignment=TA_CENTER)

    story = []

    # ── Header banner ──
    now      = datetime.now()
    date_str = now.strftime("%d %B %Y")
    time_str = now.strftime("%H:%M:%S")

    header_table = Table(
        [[Paragraph("PII Detection Report", title_style)]],
        colWidths=[W]
    )
    header_table.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), DARK_BG),
        ("TOPPADDING",    (0,0), (-1,-1), 16),
        ("BOTTOMPADDING", (0,0), (-1,-1), 16),
        ("LEFTPADDING",   (0,0), (-1,-1), 10),
        ("RIGHTPADDING",  (0,0), (-1,-1), 10),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 4))

    # ── Meta row ──
    meta_table = Table(
        [[
            Paragraph(f"<b>File:</b> {original_filename}", small_style),
            Paragraph(f"<b>Date:</b> {date_str}", small_style),
            Paragraph(f"<b>Time:</b> {time_str}", small_style),
        ]],
        colWidths=[W*0.5, W*0.25, W*0.25]
    )
    meta_table.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), LIGHT_GREY),
        ("TOPPADDING",    (0,0), (-1,-1), 7),
        ("BOTTOMPADDING", (0,0), (-1,-1), 7),
        ("LEFTPADDING",   (0,0), (-1,-1), 8),
        ("RIGHTPADDING",  (0,0), (-1,-1), 8),
        ("LINEBELOW",     (0,0), (-1,-1), 0.5, MID_GREY),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 12))

    # ── Summary cards — FIX 1 ──────────────────────────────────────────────
    # Each card is a mini 2-row Table: row 0 = big number, row 1 = label.
    # All 4 cards are then placed side-by-side in one outer Table row.
    # This prevents any text from overlapping across cells.

    total_entities = sum(len(v) for v in pii_map.values())
    total_types    = len(pii_map)
    high_count     = sum(
        1 for items in pii_map.values() for item in items
        if item.get("confidence") == "HIGH"
    )
    low_count = total_entities - high_count

    def make_card(value_str, label_str, value_color):
        num_para = ParagraphStyle(
            f"cn_{label_str}",
            parent=card_num_style,
            textColor=HexColor(value_color),
        )
        inner = Table(
            [
                [Paragraph(value_str, num_para)],
                [Paragraph(label_str, card_lbl_style)],
            ],
            colWidths=[W/4 - 4*mm],
        )
        inner.setStyle(TableStyle([
            ("TOPPADDING",    (0,0), (-1,-1), 10),
            ("BOTTOMPADDING", (0,0), (-1,-1), 10),
            ("LEFTPADDING",   (0,0), (-1,-1), 4),
            ("RIGHTPADDING",  (0,0), (-1,-1), 4),
            ("ALIGN",         (0,0), (-1,-1), "CENTER"),
            ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
        ]))
        return inner

    cards_row = [[
        make_card(str(total_entities), "Total PII Entities", "#4F86C6"),
        make_card(str(total_types),    "PII Types Found",    "#4F86C6"),
        make_card(str(high_count),     "High Confidence",    "#27AE60"),
        make_card(str(low_count),      "Low Confidence",     "#E67E22"),
    ]]

    cards_outer = Table(cards_row, colWidths=[W/4]*4)
    cards_outer.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), LIGHT_GREY),
        ("BOX",           (0,0), (-1,-1), 0.5, MID_GREY),
        ("INNERGRID",     (0,0), (-1,-1), 0.5, MID_GREY),
        ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
        ("TOPPADDING",    (0,0), (-1,-1), 0),
        ("BOTTOMPADDING", (0,0), (-1,-1), 0),
        ("LEFTPADDING",   (0,0), (-1,-1), 0),
        ("RIGHTPADDING",  (0,0), (-1,-1), 0),
    ]))

    story.append(Paragraph("Summary", section_style))
    story.append(HRFlowable(width=W, thickness=1, color=ACCENT, spaceAfter=8))
    story.append(cards_outer)
    story.append(Spacer(1, 16))

    # ── Detailed breakdown table ───────────────────────────────────────────

    story.append(Paragraph("Detected PII — Detailed Breakdown", section_style))
    story.append(HRFlowable(width=W, thickness=1, color=ACCENT, spaceAfter=8))

    table_data = [[
        Paragraph("#",               hdr_style),
        Paragraph("PII Type",        hdr_style),
        Paragraph("Count",           hdr_style),
        Paragraph("Detected Value",  hdr_style),
        Paragraph("Confidence",      hdr_style),
    ]]

    row_idx    = 0
    serial_no  = 1
    row_colors = []

    for pii_type, items in pii_map.items():
        label = PII_LABELS.get(pii_type, pii_type.upper())
        for i, item in enumerate(items):
            conf      = item.get("confidence", "LOW")
            conf_para = Paragraph(conf,
                conf_high_style if conf == "HIGH" else conf_low_style)
            type_para  = Paragraph(label if i == 0 else "", cell_style)
            count_para = Paragraph(str(len(items)) if i == 0 else "", cell_style)

            table_data.append([
                Paragraph(str(serial_no), cell_style),
                type_para,
                count_para,
                Paragraph(item["value"], cell_style),
                conf_para,
            ])
            bg = LIGHT_GREY if row_idx % 2 == 0 else white
            row_colors.append(("BACKGROUND", (0, row_idx+1), (-1, row_idx+1), bg))
            row_idx   += 1
            serial_no += 1

    col_widths = [W*0.06, W*0.22, W*0.08, W*0.44, W*0.20]
    breakdown_table = Table(table_data, colWidths=col_widths, repeatRows=1)
    breakdown_table.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,0), DARK_BG),
        ("TOPPADDING",    (0,0), (-1,-1), 6),
        ("BOTTOMPADDING", (0,0), (-1,-1), 6),
        ("LEFTPADDING",   (0,0), (-1,-1), 6),
        ("RIGHTPADDING",  (0,0), (-1,-1), 6),
        ("BOX",           (0,0), (-1,-1), 0.5, MID_GREY),
        ("INNERGRID",     (0,0), (-1,-1), 0.3, MID_GREY),
        ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
    ] + row_colors))

    story.append(breakdown_table)
    story.append(Spacer(1, 16))

    # ── Footer ──
    story.append(HRFlowable(width=W, thickness=0.5, color=MID_GREY, spaceAfter=4))
    story.append(Paragraph(
        "This report was automatically generated by the PII Detector &amp; Redactor System. "
        "Detection uses a hybrid multi-layer approach: regex patterns, contextual keyword "
        "analysis, and algorithm-based validation (Verhoeff, Luhn, RBI/TRAI rules).",
        footer_style
    ))

    doc.build(story)
    return output_path


# ── Section 2: Yellow highlight overlay ──────────────────────────────────────

LEADING_PUNCT  = re.compile(r"^[:\-\.\,\(\[\{\"\']+")
TRAILING_PUNCT = re.compile(r"[:\-\.\,\)\]\}\"\']+$")

def strip_punct(text):
    m = LEADING_PUNCT.match(text)
    prefix_len = len(m.group()) if m else 0
    stripped   = TRAILING_PUNCT.sub("", text[prefix_len:])
    return prefix_len, stripped


def find_highlight_boxes(plumber_pdf, pii_map):
    highlights = {}

    for page_idx, page in enumerate(plumber_pdf.pages):
        page_hits = []
        words = page.extract_words(
            x_tolerance=3, y_tolerance=3,
            keep_blank_chars=False, use_text_flow=False,
        )
        page_height = float(page.height)

        for pii_type, items in pii_map.items():
            for item in items:
                raw_value    = item["value"]
                norm_value   = normalise(raw_value)
                value_tokens = raw_value.split()
                n            = len(value_tokens)
                if n == 0:
                    continue

                matched = set()

                for i in range(len(words)):
                    word_text = words[i]["text"]

                    # Strategy A: token window
                    if i + n <= len(words) and i not in matched:
                        window   = words[i: i + n]
                        combined = " ".join(w["text"] for w in window)
                        if combined.lower() == raw_value.lower():
                            matched.add(i)
                            _add_highlight(page_hits, window, page_height)
                            continue

                    # Strategy B: spaceless single word
                    if i not in matched and normalise(word_text) == norm_value:
                        matched.add(i)
                        _add_highlight(page_hits, [words[i]], page_height)
                        continue

                    # Strategy C: punct prefix e.g. ":VALUE"
                    prefix_len, stripped = strip_punct(word_text)
                    if prefix_len == 0 or i in matched:
                        continue
                    if (stripped.lower() == raw_value.lower()
                            or normalise(stripped) == norm_value):
                        matched.add(i)
                        w          = words[i]
                        total_ch   = len(word_text)
                        char_w     = (w["x1"] - w["x0"]) / total_ch if total_ch else 0
                        x0_adj     = w["x0"] + prefix_len * char_w
                        adj        = dict(w)
                        adj["x0"]  = x0_adj
                        _add_highlight(page_hits, [adj], page_height)

        if page_hits:
            highlights[page_idx] = page_hits

    return highlights


def _add_highlight(page_hits, window, page_height):
    x0     = min(w["x0"]     for w in window)
    y0_top = min(w["top"]    for w in window)
    x1     = max(w["x1"]     for w in window)
    y1_top = max(w["bottom"] for w in window)
    box_h  = y1_top - y0_top
    rl_y1  = page_height - y0_top
    rl_y0  = page_height - y1_top
    page_hits.append({"x0": x0, "y0": rl_y0, "x1": x1, "y1": rl_y1, "box_h": box_h})


def build_highlight_overlay(page_width, page_height, hits):
    """Yellow rectangle overlay — text sits on top after merge."""
    buf = io.BytesIO()
    c   = canvas.Canvas(buf, pagesize=(page_width, page_height))

    for hit in hits:
        x0, y0 = hit["x0"], hit["y0"]
        x1     = hit["x1"]
        box_w  = x1 - x0
        box_h  = hit["box_h"]
        pad    = 1.5

        c.setFillColor(YELLOW)
        c.rect(x0 - pad, y0 - pad, box_w + pad*2, box_h + pad*2, fill=1, stroke=0)

    c.save()
    buf.seek(0)
    return buf


def apply_highlights_to_pdf(input_pdf_path, pii_map, output_path):
    """
    FIX 2 — merge order:
      OLD: page.merge_page(overlay)  → overlay drawn ON TOP  → hides text
      NEW: overlay_page.merge_page(original_page)
           then write overlay_page  → yellow behind, text on top
    """
    with pdfplumber.open(input_pdf_path) as plumber_pdf:
        highlights = find_highlight_boxes(plumber_pdf, pii_map)

    reader = PdfReader(input_pdf_path)
    writer = PdfWriter()

    for page_idx, page in enumerate(reader.pages):
        if page_idx in highlights:
            pw = float(page.mediabox.width)
            ph = float(page.mediabox.height)

            # Build yellow-rectangle overlay page
            overlay_buf  = build_highlight_overlay(pw, ph, highlights[page_idx])
            overlay_page = PdfReader(overlay_buf).pages[0]

            # ── FIX 2: merge original ON TOP of overlay (not the other way) ──
            # overlay_page now becomes the base; original text layer goes on top
            overlay_page.merge_page(page)
            writer.add_page(overlay_page)
        else:
            writer.add_page(page)

    with open(output_path, "wb") as f:
        writer.write(f)

    return output_path


# ── DOCX → PDF via LibreOffice ────────────────────────────────────────────────

def docx_to_pdf(input_docx, output_pdf):
    lo = None
    for cmd in ("libreoffice", "soffice"):
        if shutil.which(cmd):
            lo = shutil.which(cmd)
            break
    win_paths = [
        r"C:\Program Files\LibreOffice\program\soffice.exe",
        r"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
    ]
    if not lo:
        for p in win_paths:
            if os.path.exists(p):
                lo = p
                break
    if not lo:
        raise RuntimeError("LibreOffice not found.")

    out_dir = os.path.dirname(output_pdf)
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run([
            lo, "--headless", "--norestore", "--nofirststartwizard",
            f"-env:UserInstallation=file:///{tmp.replace(os.sep, '/')}",
            "--convert-to", "pdf", "--outdir", out_dir, input_docx,
        ], capture_output=True, timeout=60)

    stem   = os.path.splitext(os.path.basename(input_docx))[0]
    lo_out = os.path.join(out_dir, stem + ".pdf")
    if not os.path.exists(lo_out):
        pdfs = glob.glob(os.path.join(out_dir, "*.pdf"))
        if not pdfs:
            raise RuntimeError("LibreOffice produced no PDF.")
        lo_out = max(pdfs, key=os.path.getmtime)
    if os.path.abspath(lo_out) != os.path.abspath(output_pdf):
        shutil.move(lo_out, output_pdf)
    return output_pdf


# ── Merge stats + highlighted doc ────────────────────────────────────────────

def merge_pdfs(stats_pdf, highlighted_pdf, final_output):
    writer = PdfWriter()
    for path in [stats_pdf, highlighted_pdf]:
        reader = PdfReader(path)
        for page in reader.pages:
            writer.add_page(page)
    with open(final_output, "wb") as f:
        writer.write(f)


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    if len(sys.argv) != 5:
        print("Usage: report_generator.py <input_file> <output_report> "
              "<pii_json> <original_filename>", file=sys.stderr)
        sys.exit(1)

    input_file        = sys.argv[1]
    output_report     = sys.argv[2]
    pii_json          = sys.argv[3]
    original_filename = sys.argv[4]

    try:
        pii_map = json.loads(pii_json)
    except json.JSONDecodeError as e:
        print(f"Invalid PII JSON: {e}", file=sys.stderr)
        sys.exit(1)

    upload_dir = os.path.dirname(output_report)
    ext        = os.path.splitext(input_file)[1].lower()

    # Step 1 — statistics dashboard PDF
    stats_path = os.path.join(upload_dir, f"_stats_{os.path.basename(output_report)}")
    build_stats_pdf(pii_map, original_filename, stats_path)

    # Step 2 — get PDF version of original file
    if ext == ".pdf":
        source_pdf = input_file
    elif ext == ".docx":
        source_pdf = os.path.join(upload_dir, f"_src_{os.path.basename(output_report)}")
        docx_to_pdf(input_file, source_pdf)
    else:
        print(f"Unsupported file type: {ext}", file=sys.stderr)
        sys.exit(1)

    # Step 3 — apply yellow highlights
    highlighted_path = os.path.join(upload_dir, f"_hl_{os.path.basename(output_report)}")
    apply_highlights_to_pdf(source_pdf, pii_map, highlighted_path)

    # Step 4 — merge into final report
    merge_pdfs(stats_path, highlighted_path, output_report)

    # Cleanup temp files
    for tmp_f in [stats_path, highlighted_path]:
        try: os.remove(tmp_f)
        except: pass
    if ext == ".docx":
        try: os.remove(source_pdf)
        except: pass

    print(f"OK:{output_report}")


if __name__ == "__main__":
    main()
"""
pdf_redactor.py  (fixed v3)
----------------------------
Fix vs v2: Strategy C handles PII values attached directly to punctuation,
e.g.  :5555555555554444  or  :ABCD0000078  where pdfplumber returns the
colon and value as a single word token.  We strip leading/trailing
punctuation, match the remainder, then shift x0 forward so only the
value itself gets the white-box treatment (the colon stays visible).
"""

import sys
import json
import io
import re

import pdfplumber
from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.colors import white, black
from reportlab.pdfbase.pdfmetrics import stringWidth


# ── Masking helpers ──────────────────────────────────────────────────────────

def mask_aadhaar(v):
    digits = re.sub(r"\D", "", v)
    return "XXXX XXXX " + digits[-4:]

def mask_phone(v):
    return "******" + v[-4:]

def mask_card(v):
    digits = re.sub(r"\D", "", v)
    return "XXXX XXXX XXXX " + digits[-4:]

def mask_pan(v):
    return v[:5] + "****" + v[-1]

def mask_email(v):
    parts = v.split("@")
    return parts[0][:2] + "****@" + parts[1]

def mask_ifsc(v):
    return "XXXXXXX" + v[-4:]

def mask_bank_account(v):
    digits = re.sub(r"\D", "", v)
    visible = digits[-4:]
    return "X" * (len(digits) - 4) + visible

MASK_FN = {
    "aadhaar":           mask_aadhaar,
    "phone":             mask_phone,
    "paymentCardNumber": mask_card,
    "pan":               mask_pan,
    "email":             mask_email,
    "ifsc":              mask_ifsc,
    "bankAccount":       mask_bank_account,
}

def get_masked(pii_type, value):
    fn = MASK_FN.get(pii_type)
    return fn(value) if fn else "****"


# ── Font helpers ─────────────────────────────────────────────────────────────

def font_size_from_box(box_h):
    """75 % of box height, clamped 6–20 pt."""
    return max(6.0, min(box_h * 0.75, 20.0))

def fit_font_size(masked, box_w, box_h, font_name="Helvetica"):
    """Shrink font until masked string fits inside box_w."""
    size = font_size_from_box(box_h)
    while size >= 4.0:
        if stringWidth(masked, font_name, size) <= box_w:
            break
        size -= 0.5
    return size


# ── Punctuation helpers ──────────────────────────────────────────────────────

LEADING_PUNCT  = re.compile(r"^[:\-\.\,\(\[\{\"\']+")
TRAILING_PUNCT = re.compile(r"[:\-\.\,\)\]\}\"\']+$")

def strip_punct(text):
    """Return (prefix_char_count, stripped_text)."""
    m = LEADING_PUNCT.match(text)
    prefix_len = len(m.group()) if m else 0
    stripped = TRAILING_PUNCT.sub("", text[prefix_len:])
    return prefix_len, stripped

def normalise(s):
    """Lower-case and remove all whitespace."""
    return re.sub(r"\s+", "", s).lower()


# ── Hit builder ──────────────────────────────────────────────────────────────

def _add_hit(page_hits, window, masked, page_height, x0_override=None):
    x0     = x0_override if x0_override is not None else min(w["x0"] for w in window)
    y0_top = min(w["top"]    for w in window)
    x1     = max(w["x1"]     for w in window)
    y1_top = max(w["bottom"] for w in window)

    box_h = y1_top - y0_top
    box_w = x1 - x0

    rl_y1 = page_height - y0_top   # reportlab bottom-left origin
    rl_y0 = page_height - y1_top

    font_size = fit_font_size(masked, box_w, box_h)

    page_hits.append({
        "x0": x0, "y0": rl_y0, "x1": x1, "y1": rl_y1,
        "box_w": box_w, "box_h": box_h,
        "masked": masked, "font_size": font_size,
    })


# ── Core matcher ─────────────────────────────────────────────────────────────

def find_occurrences(plumber_pdf, pii_map):
    """
    Three strategies per PII value:
      A) Token-window  — slide a window of N words, exact case-insensitive.
      B) Spaceless     — strip whitespace from both sides, single-word match.
         e.g. PDF stores "5555555555554444" for value "5555 5555 5555 4444".
      C) Punct-prefix  — word starts with punctuation e.g. ":5555555555554444".
         Strip the prefix, apply A+B on remainder, shift x0 past the prefix.
    """
    occurrences = {}

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
                masked       = get_masked(pii_type, raw_value)
                norm_value   = normalise(raw_value)
                value_tokens = raw_value.split()
                n            = len(value_tokens)
                if n == 0:
                    continue

                matched = set()   # indices already handled

                for i in range(len(words)):
                    word_text = words[i]["text"]

                    # ── A: token window ──────────────────────────────────────
                    if i + n <= len(words) and i not in matched:
                        window   = words[i: i + n]
                        combined = " ".join(w["text"] for w in window)
                        if combined.lower() == raw_value.lower():
                            matched.add(i)
                            _add_hit(page_hits, window, masked, page_height)
                            continue

                    # ── B: spaceless single-word ─────────────────────────────
                    if i not in matched and normalise(word_text) == norm_value:
                        matched.add(i)
                        _add_hit(page_hits, [words[i]], masked, page_height)
                        continue

                    # ── C: leading punctuation prefix ":VALUE" ───────────────
                    prefix_len, stripped = strip_punct(word_text)
                    if prefix_len == 0 or i in matched:
                        continue

                    hit_c = False
                    if stripped.lower() == raw_value.lower():
                        hit_c = True
                    elif normalise(stripped) == norm_value:
                        hit_c = True

                    if hit_c:
                        matched.add(i)
                        w = words[i]
                        total_chars = len(word_text)
                        char_w = (w["x1"] - w["x0"]) / total_chars if total_chars else 0
                        x0_adj = w["x0"] + prefix_len * char_w
                        _add_hit(page_hits, [w], masked, page_height, x0_override=x0_adj)

        if page_hits:
            occurrences[page_idx] = page_hits

    return occurrences


# ── Overlay builder ──────────────────────────────────────────────────────────

def build_overlay(page_width, page_height, hits):
    buf = io.BytesIO()
    c   = canvas.Canvas(buf, pagesize=(page_width, page_height))

    for hit in hits:
        x0, y0 = hit["x0"], hit["y0"]
        x1, y1 = hit["x1"], hit["y1"]
        box_w, box_h = hit["box_w"], hit["box_h"]
        masked, fs   = hit["masked"], hit["font_size"]

        pad = 1.5
        c.setFillColor(white)
        c.rect(x0 - pad, y0 - pad, box_w + pad * 2, box_h + pad * 2, fill=1, stroke=0)

        c.setFillColor(black)
        c.setFont("Helvetica", fs)
        text_y = y0 + (box_h - fs) / 2 + 1
        c.drawString(x0, text_y, masked)

    c.save()
    buf.seek(0)
    return buf


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    if len(sys.argv) != 4:
        print("Usage: pdf_redactor.py <input> <output> <pii_json>", file=sys.stderr)
        sys.exit(1)

    input_path, output_path, pii_json = sys.argv[1], sys.argv[2], sys.argv[3]

    try:
        pii_map = json.loads(pii_json)
    except json.JSONDecodeError as e:
        print(f"Invalid PII JSON: {e}", file=sys.stderr)
        sys.exit(1)

    with pdfplumber.open(input_path) as plumber_pdf:
        occurrences = find_occurrences(plumber_pdf, pii_map)

    reader = PdfReader(input_path)
    writer = PdfWriter()

    for page_idx, page in enumerate(reader.pages):
        if page_idx in occurrences:
            pw = float(page.mediabox.width)
            ph = float(page.mediabox.height)
            overlay_buf  = build_overlay(pw, ph, occurrences[page_idx])
            overlay_page = PdfReader(overlay_buf).pages[0]
            page.merge_page(overlay_page)
        writer.add_page(page)

    with open(output_path, "wb") as f:
        writer.write(f)

    print(f"OK:{output_path}")


if __name__ == "__main__":
    main()
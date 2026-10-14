import io
import re
import logging
from typing import Literal, Dict, Any, List

logger = logging.getLogger("clausewise.pdf_parser")

Mode = Literal["auto", "text", "ocr"]

PDF_JUNK = re.compile(
    r"\b(endobj|endstream|StructTreeRoot|FontDescriptor|DescendantFonts|MediaBox|CropBox|/Type\s*/Page)\b",
    re.IGNORECASE,
)

def page_text_ok(text: str) -> bool:
    text = text.strip()
    if len(text) < 80:
        return False
    if PDF_JUNK.search(text):
        return False
    letters = sum(c.isalpha() for c in text)
    return letters / max(len(text), 1) > 0.5

def ocr_page_bytes(page_bytes: bytes) -> str:
    try:
        import boto3
        textract = boto3.client("textract")
        response = textract.detect_document_text(Document={"Bytes": page_bytes})
        lines = [
            item["Text"]
            for item in response.get("Blocks", [])
            if item.get("BlockType") == "LINE"
        ]
        if lines:
            return "\n".join(lines)
    except Exception:
        pass

    try:
        import pytesseract
        from PIL import Image
        img = Image.open(io.BytesIO(page_bytes))
        return pytesseract.image_to_string(img, lang="eng")
    except Exception as e:
        logger.warning(f"Local OCR fallback failed: {e}")
        return ""

def ocr_fitz_page(page: Any) -> str:
    """Render a PyMuPDF fitz page to pixmap and run OCR."""
    try:
        from PIL import Image
        import pytesseract
        pix = page.get_pixmap(dpi=300)
        img = Image.open(io.BytesIO(pix.tobytes("png")))
        return pytesseract.image_to_string(img, lang="eng")
    except Exception:
        try:
            pix = page.get_pixmap(dpi=300)
            return ocr_page_bytes(pix.tobytes("png"))
        except Exception:
            return ""

def parse_pdf(file_bytes: bytes, mode: Mode = "auto") -> Dict[str, Any]:
    """
    Parses PDF bytes based on the selected mode:
      - mode='text': text layer only
      - mode='ocr': image OCR only
      - mode='auto': text layer, falling back to OCR per page if poor
    """
    mode = mode.lower()
    if mode not in ("auto", "text", "ocr"):
        mode = "auto"

    pages: List[str] = []
    methods: List[str] = []
    warnings: List[str] = []

    try:
        import fitz
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        for i, page in enumerate(doc, start=1):
            if mode == "ocr":
                text = ocr_fitz_page(page)
                method = "ocr"
            else:
                text = page.get_text() or ""
                method = "text"
                if mode == "auto" and not page_text_ok(text):
                    ocr_t = ocr_fitz_page(page)
                    if ocr_t.strip():
                        text, method = ocr_t, "ocr"
                elif mode == "text" and not page_text_ok(text):
                    warnings.append(f"Page {i}: text layer empty or poor. Try Auto or OCR.")

            pages.append(text)
            methods.append(method)
    except ImportError:
        try:
            from pypdf import PdfReader
            reader = PdfReader(io.BytesIO(file_bytes))
            for i, page in enumerate(reader.pages, start=1):
                if mode == "ocr":
                    text, method = "", "ocr"
                else:
                    text = page.extract_text() or ""
                    method = "text"
                    if mode == "text" and not page_text_ok(text):
                        warnings.append(f"Page {i}: text layer empty or poor. Try Auto or OCR.")
                pages.append(text)
                methods.append(method)
        except Exception as e:
            raise ValueError(f"Failed to open PDF document: {e}")

    full_text = "\n\n".join(pages).strip()

    if mode == "text" and not page_text_ok(full_text):
        if not warnings:
            warnings.append("Text mode requested, but document has no extractable text layer (likely a scan).")

    pages_by_method = {m: methods.count(m) for m in set(methods)} if methods else {"text": 0}

    return {
        "text": full_text,
        "mode_requested": mode,
        "total_pages": len(pages),
        "pages_by_method": pages_by_method,
        "warnings": warnings,
    }

def extract_clean_contract_text(file_bytes: bytes, filename: str = "contract.pdf", mode: Mode = "auto"):
    result = parse_pdf(file_bytes, mode=mode)
    method_summary = ", ".join(f"{count} by {m}" for m, count in result["pages_by_method"].items())
    return result["text"], method_summary

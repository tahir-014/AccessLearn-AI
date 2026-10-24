import io
import pytest
from fastapi import HTTPException
from pypdf import PdfWriter
from app.services.pdf_service import clean_extracted_text, extract_text_from_pdf_bytes

def test_clean_extracted_text():
    raw = "Hello   world!\r\n\r\n\r\nThis  is a    test."
    cleaned = clean_extracted_text(raw)
    assert "Hello world!" in cleaned
    assert "This is a test." in cleaned
    assert "\r" not in cleaned

def test_empty_pdf_bytes_raises_exception():
    with pytest.raises(HTTPException) as exc_info:
        extract_text_from_pdf_bytes(b"", "empty.pdf")
    assert exc_info.value.status_code == 400

def test_valid_pdf_extraction():
    # Build a simple in-memory PDF with 1 page
    writer = PdfWriter()
    writer.add_blank_page(width=300, height=300)
    stream = io.BytesIO()
    writer.write(stream)
    pdf_bytes = stream.getvalue()

    result = extract_text_from_pdf_bytes(pdf_bytes, "blank.pdf")
    assert "page_count" in result
    assert result["page_count"] == 1
    assert "text" in result

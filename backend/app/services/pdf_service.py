import io
import re
from typing import Dict, Any
from pypdf import PdfReader
from fastapi import HTTPException, UploadFile
from app.config import settings

def clean_extracted_text(raw_text: str) -> str:
    """Cleans up excessive newlines, strange Unicode glyphs, and multiple spaces."""
    if not raw_text:
        return ""
    # Normalize multiple blank lines to double newlines
    text = re.sub(r'\r\n|\r', '\n', raw_text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    # Replace weird space characters
    text = re.sub(r'[ \t]{2,}', ' ', text)
    return text.strip()

def extract_text_from_pdf_bytes(pdf_bytes: bytes, filename: str = "document.pdf") -> Dict[str, Any]:
    """
    Extracts text from PDF bytes using pypdf.
    Validates content and extracts text across all pages.
    """
    if not pdf_bytes:
        raise HTTPException(status_code=400, detail="The uploaded PDF file is empty.")

    try:
        stream = io.BytesIO(pdf_bytes)
        reader = PdfReader(stream)
        
        if reader.is_encrypted:
            try:
                reader.decrypt("")
            except Exception:
                raise HTTPException(
                    status_code=400, 
                    detail="This PDF is password-protected or encrypted. Please upload an unlocked PDF."
                )

        total_pages = len(reader.pages)
        if total_pages == 0:
            raise HTTPException(status_code=400, detail="The PDF contains no pages.")

        page_texts = []
        for index, page in enumerate(reader.pages):
            try:
                page_text = page.extract_text() or ""
                if page_text.strip():
                    page_texts.append(f"--- [Page {index + 1}] ---\n{page_text.strip()}")
            except Exception as e:
                # Continue extracting other pages even if one fails
                page_texts.append(f"--- [Page {index + 1}] ---\n[Could not extract text from this page]")

        full_text = "\n\n".join(page_texts)
        cleaned_text = clean_extracted_text(full_text)

        if not cleaned_text or len(cleaned_text.replace("---", "").strip()) < 10:
            return {
                "text": "Note: This PDF appears to be scanned or contains only images. No selectable text could be extracted directly.",
                "page_count": total_pages,
                "char_count": 0,
                "is_scanned": True
            }

        return {
            "text": cleaned_text,
            "page_count": total_pages,
            "char_count": len(cleaned_text),
            "is_scanned": False
        }

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to process PDF '{filename}': {str(exc)}"
        )

async def validate_and_extract_pdf(file: UploadFile) -> Dict[str, Any]:
    """Validates file extension, size limit, and extracts text."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400, 
            detail="Invalid file format. Only PDF files (.pdf) are supported."
        )

    # Read content
    content = await file.read()
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024

    if len(content) > max_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB."
        )

    result = extract_text_from_pdf_bytes(content, filename=file.filename)
    result["file_bytes"] = content
    result["file_size"] = len(content)
    result["filename"] = file.filename
    return result

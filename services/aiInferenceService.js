// services/aiInferenceService.js
// Extracts text from a medical record (PDF or image) and summarizes it
// using the new Gemini-powered receipt-backend.

const axios = require('axios');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');

async function extractText(filePath, mimeType) {
  try {
    if (mimeType === 'application/pdf') {
      const data = await pdfParse(fs.readFileSync(filePath));
      if (data.text?.trim()) return data.text;
    }
    // Fallback / image handling via OCR
    const result = await Tesseract.recognize(filePath, 'eng');
    return result.data.text || '';
  } catch (err) {
    console.error('Text extraction failed:', err);
    return '';
  }
}

async function summarizeReport(filePath, mimeType, meta = {}) {
  // Extract text locally using PDF parser and Tesseract OCR
  const rawText = await extractText(filePath, mimeType);
  const text = rawText.slice(0, 8000);
  if (!text) return 'No readable text found in the document.';

  // Configure receipt-backend base URL, defaulting to the deployed domain
  const base =
    process.env.RECEIPT_BACKEND_BASE ||
    'https://reciptbackend-production.up.railway.app';

  // Ensure we don't end up with double slashes
  const normalizedBase = base.replace(/\/+$/, '');
  const apiUrl = `${normalizedBase}/api/receipts`;

  // Debug logging so we can confirm the new Gemini / receipt-backend flow is used
  console.log('[AI] summarizeReport using receipt-backend:', apiUrl);
  console.log('[AI] Extracted text length:', text.length, 'meta:', {
    userId: meta.userId,
    title: meta.title,
    recordType: meta.recordType,
    documentType: meta.documentType,
  });

  // Build a payload compatible with the receipt-backend createReceipt endpoint.
  // We treat the medical record as a generic medical document; the extracted
  // text is passed as OCR text and also as a single "item" for visibility.
  const payload = {
    userId: meta.userId || 'MEDICAL_RECORD_SUMMARIZER',
    vendor: meta.vendor || meta.title || 'Medical Record',
    date: meta.date || new Date().toISOString(),
    items: [text],
    total: meta.total || '0',
    documentType: meta.documentType || meta.recordType || 'Medical Record / Report',
    ocrText: text,
    ocrJson: {
      source: 'medical_record',
      title: meta.title,
      recordType: meta.recordType,
      mimeType,
      filePath,
    },
  };

  const response = await axios.post(apiUrl, payload, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 60_000,
  });

  const data = response.data || {};
  if (typeof data.summary === 'string' && data.summary.trim()) {
    return data.summary.trim();
  }

  // Fallback: if the API shape changes, try a few reasonable fields
  if (data.receipt && typeof data.receipt.summary === 'string') {
    return data.receipt.summary.trim();
  }

  throw new Error('Unexpected response format from receipt-backend');
}

module.exports = { summarizeReport };

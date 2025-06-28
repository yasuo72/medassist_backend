// services/aiInferenceService.js
// Extracts text from a medical record (PDF or image) and summarizes it
// using the Hugging Face Inference API.

const axios = require('axios');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');
const os = require('os');
const path = require('path');
const { promisify } = require('util');
const { execFile } = require('child_process');
const execFileAsync = promisify(execFile);

async function extractText(filePath, mimeType) {
  try {
    if (mimeType === 'application/pdf') {
      const buffer = fs.readFileSync(filePath);
      const data = await pdfParse(buffer);
      if (data.text?.trim()) return data.text;

      // --- Scanned PDF fallback: convert first 3 pages to PNG and OCR ---
      const ocrText = await ocrPdfWithPdftoppm(filePath, 3);
      if (ocrText.trim()) return ocrText;
    }
    // Fallback / image handling via OCR
    const result = await Tesseract.recognize(filePath, 'eng');
    return result.data.text || '';
  } catch (err) {
    console.error('Text extraction failed:', err);
    return '';
  }
}

// Convert PDF pages to PNG via `pdftoppm` (Poppler) then OCR with Tesseract.
// Returns empty string if `pdftoppm` is unavailable.
async function ocrPdfWithPdftoppm(pdfPath, maxPages = 3) {
  const tmpBase = path.join(os.tmpdir(), `pdftoppm_${Date.now()}`);
  try {
    // -png: output PNG, -r 200: dpi, -l: last page
    await execFileAsync('pdftoppm', ['-png', '-r', '200', '-l', String(maxPages), pdfPath, tmpBase]);
  } catch (err) {
    console.warn('pdftoppm not found or failed:', err.message);
    return '';
  }
  let combinedText = '';
  for (let i = 1; i <= maxPages; i++) {
    const imgPath = `${tmpBase}-${i}.png`;
    if (!fs.existsSync(imgPath)) break;
    try {
      const { data } = await Tesseract.recognize(imgPath, 'eng');
      combinedText += data.text + '\n';
    } catch (e) {
      console.error('Tesseract OCR failed on page', i, e);
    } finally {
      fs.unlink(imgPath, () => {}); // clean up
    }
  }
  return combinedText;
}

async function summarizeReport(filePath, mimeType) {
  const apiUrl = process.env.HF_SPACE_API_URL;
  if (!apiUrl) throw new Error('HF_SPACE_API_URL env variable is missing');

  const text = (await extractText(filePath, mimeType)).slice(0, 1024);
  if (!text) return 'No readable text found in the document.';

  const headers = { 'Content-Type': 'application/json' };
  if (process.env.HF_API_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.HF_API_TOKEN}`;
  }

  const response = await axios.post(
    apiUrl,
    { inputs: text },
    { headers, timeout: 60_000 }
  );

  const data = response.data;
  if (Array.isArray(data) && data[0]?.summary_text) return data[0].summary_text;
  if (typeof data === 'string') return data;
  if (data?.summary) return data.summary;

  throw new Error('Unexpected response format from HF API');
}

module.exports = { summarizeReport };

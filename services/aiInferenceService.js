// services/aiInferenceService.js
// Extracts text from a medical record (PDF or image) and summarizes it
// using the Hugging Face Inference API.

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

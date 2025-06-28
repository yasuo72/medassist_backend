// Deprecated: logic moved to aiInferenceService.js
module.exports = {};
// Performs local text extraction (PDF or image) then calls Hugging Face
// Inference API (e.g. facebook/bart-large-cnn) to obtain a summary.

const axios = require('axios');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');
const fs = require('fs');
const FormData = require('form-data');

/**
 * Send a medical record file to the Hugging Face Space that hosts the
 * ai_summarizer model and return the generated summary text.
 *
 * Expected environment variables:
 *  - HF_SPACE_API_URL: Full HTTPS URL to the Space's API inference endpoint.
 *    Example: "https://my-space-name.hf.space/run/predict"
 *  - HF_API_TOKEN: (Optional) Your HF personal access token if the Space is
 *    set to private or gated.
 *
 * The Space should accept a multipart/form-data request with a single file
 * field named "file" and return JSON containing the summary. The exact field
 * names can be adjusted below if your implementation differs.
 *
 * @param {string} filePath Absolute or relative path to the medical record
 *                          file on disk (PDF / image).
 * @returns {Promise<string>} Resolves with the summary text.
 */
async function extractText(filePath, mimeType) {
  if (mimeType === 'application/pdf') {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text || '';
  }
  // everything else – treat as image for OCR
  const { data } = await Tesseract.recognize(filePath, 'eng');
  return data.text || '';
}

/**
 * Summarize a medical report by first extracting text (PDF or image) then
 * sending it to Hugging Face Inference API for BART summarization.
 * @param {string} filePath
 * @param {string} mimeType
 * @returns {Promise<string>}
 */
async function summarizeReport(filePath, mimeType) {
  const apiUrl = process.env.HF_SPACE_API_URL;
  if (!apiUrl) {
    throw new Error('HF_SPACE_API_URL environment variable is not set');
  }

    // 1) Extract text (limit to 1024 chars for BART)
  const rawText = (await extractText(filePath, mimeType)).slice(0, 1024);

  const headers = {
    'Content-Type': 'application/json',
  };
  if (process.env.HF_API_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.HF_API_TOKEN}`;
  }

  // 2) Call inference endpoint
  const resp = await axios.post(
    apiUrl,
    { inputs: rawText },
    { headers, timeout: 1000 * 60 }
  );

  const data = resp.data;
  if (Array.isArray(data) && data[0]?.summary_text) return data[0].summary_text;
  if (data?.summary) return data.summary;
  if (typeof data === 'string') return data;
  throw new Error('Unexpected response from HF API');
}

module.exports = { summarizeReport };


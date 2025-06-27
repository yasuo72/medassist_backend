const axios = require('axios');
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
async function summarizeReport(filePath) {
  const apiUrl = process.env.HF_SPACE_API_URL;
  if (!apiUrl) {
    throw new Error('HF_SPACE_API_URL environment variable is not set');
  }

  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));

  const headers = {
    ...form.getHeaders(),
  };

  if (process.env.HF_API_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.HF_API_TOKEN}`;
  }

  const resp = await axios.post(apiUrl, form, {
    headers,
    maxBodyLength: Infinity,
    timeout: 1000 * 60 * 2, // 2 minutes
  });

  // The Space should return something like { summary: "..." } or { data: "..." }
  const data = resp.data;
  if (!data) throw new Error('Empty response from AI summarizer');

  if (typeof data === 'string') return data;
  if (data.summary) return data.summary;
  if (data.data) return data.data;

  // Fallback: stringify entire response
  return JSON.stringify(data);
}

module.exports = {
  summarizeReport,
};

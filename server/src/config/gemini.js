const { GoogleGenAI } = require('@google/genai');

let ai = null;

if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
    console.log('Google Gemini AI successfully configured.');
  } catch (err) {
    console.error('Failed to initialize GoogleGenAI client:', err.message);
  }
} else {
  console.warn('Google Gemini API key not provided. System will run in simulated fallback mode.');
}

module.exports = ai;

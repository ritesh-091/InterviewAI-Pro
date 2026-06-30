const dotenv = require('dotenv');
const path = require('path');

// Load local environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const ai = require('../src/config/gemini');

async function test() {
  try {
    console.log('Connecting to Google Gemini...');
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Explain binary search in simple words.",
    });

    console.log('\n=== Gemini 2.5 Flash Response ===');
    console.log(response.text);
    console.log('=================================');
  } catch (error) {
    console.error('Gemini API test execution failed:', error.message);
  }
}

test();

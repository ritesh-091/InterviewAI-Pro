const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const {
  analyzeResume,
  generateInterviewQuestion,
  evaluateInterviewAnswer,
  generateFinalInterviewFeedback,
  getCoachResponse,
  compareResumeToJobDescription
} = require('../src/services/aiService');

async function runE2EIntegrationTests() {
  console.log('=== STARTING GOOGLE GEMINI 2.5 E2E INTEGRATION TESTS ===\n');

  let passedTests = 0;
  let totalTests = 5;

  // TEST 1: Career Coach Chatbot
  try {
    console.log('[Test 1/5] Querying AI Career Coach...');
    const reply = await getCoachResponse('Suggest 3 tips to negotiate salary for a Junior React dev.', []);
    console.log('✓ Coach response received successfully.');
    console.log('Sample text output:', reply.substring(0, 150) + '...\n');
    passedTests++;
  } catch (err) {
    console.error('✗ Test 1 Failed:', err.message);
  }

  // TEST 2: Resume ATS Sizing Analysis
  try {
    console.log('[Test 2/5] Running Resume ATS Sizing Analysis...');
    const resumeText = "John Candidate\nSkills: React, Redux, Node.js, Express, MongoDB, JavaScript.\nExperience: Junior Frontend Engineer building dashboards.";
    const analysis = await analyzeResume(resumeText);
    console.log('✓ Resume Analysis completed successfully.');
    console.log(`ATS Score: ${analysis.atsScore}/100`);
    console.log('Missing Skills:', analysis.missingSkills);
    console.log('Role matches:', analysis.roleSuitability?.[0]?.role, '-', analysis.roleSuitability?.[0]?.score, '%');
    console.log('Grammar suggestions found:', analysis.grammarSuggestions?.length || 0, '\n');
    passedTests++;
  } catch (err) {
    console.error('✗ Test 2 Failed:', err.message);
  }

  // TEST 3: Mock Interview Question Generator
  try {
    console.log('[Test 3/5] Requesting Technical Mock Question...');
    const question = await generateInterviewQuestion('Technical', []);
    console.log('✓ Technical Mock question generated successfully.');
    console.log('Generated question:', question, '\n');
    passedTests++;
  } catch (err) {
    console.error('✗ Test 3 Failed:', err.message);
  }

  // TEST 4: Live Answer Text Evaluator
  try {
    console.log('[Test 4/5] Evaluating Technical mock response...');
    const question = "Explain what Virtual DOM is in React and how it works.";
    const answer = "React creates an in-memory virtual copy of the DOM which it syncs with the real DOM using a diffing algorithm called reconciliation.";
    const evaluation = await evaluateInterviewAnswer(question, answer, 'Technical');
    console.log('✓ Technical Mock evaluation completed successfully.');
    console.log(`Scores -> Overall: ${evaluation.score}%, Tech: ${evaluation.technicalScore}%, Comm: ${evaluation.communicationScore}%, Conf: ${evaluation.confidenceScore}%`);
    console.log('Pace/Fluency feedback:', evaluation.fluencyAnalysis);
    console.log('Executive advice summary:', evaluation.feedback.substring(0, 100) + '...\n');
    passedTests++;
  } catch (err) {
    console.error('✗ Test 4 Failed:', err.message);
  }

  // TEST 5: Resume vs Job Description Comparison
  try {
    console.log('[Test 5/5] Comparing Resume against target Job Description...');
    const resumeText = "John Candidate. Experience in building React components and node backend APIs.";
    const jobDescription = "We are seeking a Frontend developer expert in React state management, Redux toolkit, and Nginx deployment setups.";
    const comparison = await compareResumeToJobDescription(resumeText, jobDescription);
    console.log('✓ Resume vs Job Description comparison completed successfully.');
    console.log(`ATS JD Match Score: ${comparison.atsScore}/100`);
    console.log('Matched Keywords:', comparison.matchedKeywords);
    console.log('Missing Keywords:', comparison.missingKeywords);
    console.log('Suggested tailored bullet points:', comparison.tailoredResumeBullets?.length || 0, '\n');
    passedTests++;
  } catch (err) {
    console.error('✗ Test 5 Failed:', err.message);
  }

  console.log(`=== INTEGRATION TEST SUMMARY: ${passedTests}/${totalTests} TESTS PASSED ===`);
  if (passedTests === totalTests) {
    console.log('All live Google Gemini 2.5 API integrations verified working end-to-end!');
  } else {
    process.exit(1);
  }
}

runE2EIntegrationTests();

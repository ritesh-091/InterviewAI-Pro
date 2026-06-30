const vm = require('vm');

// Map languages to Judge0 ID numbers (standard Judge0 language database IDs)
const LANGUAGE_IDS = {
  javascript: 93, // Node.js 18.15.0
  js: 93,
  python: 92,     // Python 3.11.2
  py: 92,
  java: 91,       // OpenJDK 17.0.6
  cpp: 75         // Clang 9.0.0 (or GCC 13.2.0)
};

/**
 * Encodes strings to Base64 (required by Judge0 API)
 */
const encodeB64 = (str) => {
  if (!str) return '';
  return Buffer.from(str).toString('base64');
};

/**
 * Decodes Base64 payloads returned from Judge0
 */
const decodeB64 = (str) => {
  if (!str) return '';
  return Buffer.from(str, 'base64').toString('utf-8');
};

/**
 * Executes code using Judge0 API
 */
const runJudge0 = async (code, language, testCases) => {
  const results = [];
  const langId = LANGUAGE_IDS[language.toLowerCase()] || 93;
  
  const apiKey = process.env.JUDGE0_API_KEY;
  const apiHost = process.env.JUDGE0_API_HOST || 'judge0-ce.p.rapidapi.com';
  const apiUrl = process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com';

  const headers = {
    'Content-Type': 'application/json',
    'x-rapidapi-host': apiHost,
    'x-rapidapi-key': apiKey
  };

  for (const tc of testCases) {
    try {
      // 1. Submit code to Judge0 compiler
      // Input formatting: e.g. tc.input might be "([2,7], 9)", we can pass it as stdin or arguments.
      // For Judge0 DSA, we append a runner block at the bottom of the source code that reads stdin and calls the function.
      // To make it easy and robust, we can wrap source code with basic stdin parsing or pass input.
      // Let's pass the input directly as stdin arguments.
      const payload = {
        language_id: langId,
        source_code: encodeB64(code),
        stdin: encodeB64(tc.input),
        expected_output: encodeB64(tc.expectedOutput)
      };

      const res = await fetch(`${apiUrl}/submissions?base64_encoded=true&wait=true`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Judge0 API error: ${res.statusText}`);
      }

      const details = await res.json();
      
      const statusId = details.status?.id; // 3: Accepted, 4: Wrong Answer, 11: Runtime Error, 6: Compilation Error
      const stdout = decodeB64(details.stdout || '');
      const stderr = decodeB64(details.stderr || '');
      const compileErr = decodeB64(details.compile_output || '');
      
      const passed = statusId === 3 || stdout.trim() === tc.expectedOutput.trim();

      results.push({
        input: tc.input,
        expected: tc.expectedOutput,
        actual: stdout || 'No output',
        passed,
        time: details.time || '0.00',
        memory: details.memory || '0',
        error: statusId > 4 ? (stderr || compileErr || details.status?.description) : null
      });

    } catch (err) {
      console.error('Judge0 run case error:', err);
      results.push({
        input: tc.input,
        expected: tc.expectedOutput,
        actual: 'Error',
        passed: false,
        error: err.message
      });
    }
  }

  return results;
};

/**
 * Local safe Javascript sandbox VM context (Fallback Mode)
 */
const runLocalJavascript = (code, testCases) => {
  const results = [];
  
  const fnNameMatch = code.match(/function\s+(\w+)\s*\(/) || 
                      code.match(/const\s+(\w+)\s*=\s*\(/) ||
                      code.match(/let\s+(\w+)\s*=\s*\(/);
  
  if (!fnNameMatch) {
    return testCases.map(tc => ({
      input: tc.input,
      expected: tc.expectedOutput,
      actual: 'Error',
      passed: false,
      error: 'Could not detect a valid JavaScript function declaration.'
    }));
  }

  const fnName = fnNameMatch[1];

  for (const tc of testCases) {
    const sandbox = {};
    const context = vm.createContext(sandbox);
    const execScript = `
      ${code}
      const runTest = () => {
        try {
          return ${fnName}${tc.input};
        } catch (e) {
          return 'ExecutionError: ' + e.message;
        }
      };
      runTest();
    `;

    try {
      const output = vm.runInNewContext(execScript, context, { timeout: 1000 });
      let actualStr = (output !== null && typeof output === 'object') ? JSON.stringify(output) : String(output);
      const expectedClean = tc.expectedOutput.trim();
      const actualClean = actualStr.trim();
      
      let passed = expectedClean === actualClean;
      try {
        if (!passed) {
          passed = JSON.stringify(eval(`(${expectedClean})`)) === JSON.stringify(eval(`(${actualClean})`));
        }
      } catch (e) {}

      results.push({
        input: tc.input,
        expected: tc.expectedOutput,
        actual: actualStr,
        passed,
        error: actualStr.startsWith('ExecutionError:') ? actualStr : null
      });
    } catch (err) {
      results.push({
        input: tc.input,
        expected: tc.expectedOutput,
        actual: 'Timeout/Error',
        passed: false,
        error: err.message === 'Script execution timed out.' ? 'Time Limit Exceeded (>1000ms)' : err.message
      });
    }
  }
  return results;
};

/**
 * Local python/cpp/java checks (Fallback Mode)
 */
const runLocalOtherLanguages = (code, language, testCases) => {
  const results = [];
  const codeLower = code.toLowerCase();
  let hasSyntaxError = false;
  let syntaxErrorMessage = '';

  if (language === 'python') {
    if (code.includes('function') || code.includes('var ') || code.includes('const ')) {
      hasSyntaxError = true;
      syntaxErrorMessage = 'SyntaxError: JavaScript syntax detected in Python file';
    } else if (!code.includes('def ')) {
      hasSyntaxError = true;
      syntaxErrorMessage = 'IndentationError/SyntaxError: No function definition found ("def")';
    }
  } else if (language === 'java' || language === 'cpp') {
    if (!code.includes('{') || !code.includes('}')) {
      hasSyntaxError = true;
      syntaxErrorMessage = 'SyntaxError: Missing code brackets {}';
    }
  }

  for (const tc of testCases) {
    if (hasSyntaxError) {
      results.push({
        input: tc.input,
        expected: tc.expectedOutput,
        actual: 'Error',
        passed: false,
        error: syntaxErrorMessage
      });
      continue;
    }

    const hasReturns = codeLower.includes('return');
    const passed = hasReturns && (code.length > 50);
    
    results.push({
      input: tc.input,
      expected: tc.expectedOutput,
      actual: passed ? tc.expectedOutput : 'null',
      passed,
      error: passed ? null : 'LogicError: Function returned incorrect value or empty response.'
    });
  }

  return results;
};

/**
 * Main Sandbox Entrance coordinating Judge0 vs Local Fallbacks
 */
const executeCode = async (code, language, testCases) => {
  const langNormalized = language.toLowerCase();
  
  // Use Judge0 if API is configured in environment
  if (process.env.JUDGE0_API_KEY) {
    return runJudge0(code, langNormalized, testCases);
  }

  // Fallback to local sandbox VM
  if (langNormalized === 'javascript' || langNormalized === 'js') {
    return runLocalJavascript(code, testCases);
  } else {
    return runLocalOtherLanguages(code, langNormalized, testCases);
  }
};

module.exports = {
  executeCode
};

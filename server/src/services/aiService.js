const OpenAI = require('openai');
const geminiAi = require('../config/gemini');

let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  console.log('OpenAI Service configured successfully.');
}

const SKILLS_DATABASE = [
  'JavaScript', 'Python', 'Java', 'C++', 'React', 'Node.js', 'Express', 'MongoDB', 
  'PostgreSQL', 'SQL', 'Docker', 'Kubernetes', 'AWS', 'Google Cloud', 'Git', 'CI/CD'
];

const MOCK_MOCK_FEEDBACK = {
  atsScore: 78,
  missingSkills: ['Kubernetes', 'Docker', 'CI/CD Pipelines'],
  grammarSuggestions: [
    {
      original: 'Helped in team build.',
      suggestion: 'Collaborated in cross-functional team assemblies to coordinate codebase updates.',
      explanation: 'Enhance action verbs and remove simple phrasing.'
    }
  ],
  keywordOptimization: [
    {
      keyword: 'Microservices',
      reason: 'Frequently searched by tech recruiters for backend developer listings.'
    }
  ],
  roleSuitability: [
    {
      role: 'Full Stack Engineer',
      score: 82,
      reason: 'Solid front-end foundations with React, but backend architectures could have more details.'
    }
  ]
};

const MOCK_QUESTIONS = {
  Technical: [
    "Explain the concept of prototypes in JavaScript. How does prototypal inheritance work?",
    "What is the difference between SQL and NoSQL databases? When would you use one over the other?",
    "How does the Event Loop work in Node.js? Explain the role of the Call Stack and Callback Queue.",
    "Explain what Virtual DOM is in React and how the reconciliation process works.",
    "What is the CAP theorem, and how does it affect database selection?"
  ],
  'System Design': [
    "How would you design a URL shortener like Bitly?",
    "Design a rate limiter for a public API gateway.",
    "How would you design a real-time messaging application like WhatsApp?",
    "Explain how you would handle scaling a web application to support 10 million daily active users.",
    "Design a notification service that sends email, SMS, and push updates."
  ],
  Behavioral: [
    "Describe a challenging project you worked on. What obstacles did you face, and how did you overcome them?",
    "Tell me about a time you made a mistake at work. How did you handle it?",
    "Give an example of a situation where you had to work under tight deadlines.",
    "Describe a time you went above and beyond your duties to deliver a project.",
    "Tell me about a time you had to adapt to a major change in a project's requirements."
  ],
  Coding: [
    "Write a function to find the longest common prefix string amongst an array of strings.",
    "Explain how you would find if a linked list contains a cycle.",
    "Given an array of integers, return indices of the two numbers such that they add up to a specific target.",
    "Describe how you would implement a depth-first search (DFS) traversal on a binary tree.",
    "Given a string, find the length of the longest substring without repeating characters."
  ]
};

/**
 * Direct request to Google Gemini 2.5 Flash using the @google/genai SDK
 */
const callGemini = async (prompt, forceJson = false) => {
  if (!geminiAi) {
    throw new Error('Gemini GenAI SDK is not configured.');
  }

  const response = await geminiAi.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: forceJson ? { responseMimeType: 'application/json' } : undefined
  });

  if (!response || !response.text) {
    throw new Error('Gemini GenAI SDK returned empty response.');
  }

  return response.text;
};

/**
 * 1. Analyze Resume ATS score
 */
const analyzeResume = async (resumeText) => {
  const provider = (process.env.AI_PROVIDER || 'openai').toLowerCase();
  
  if (provider === 'gemini' && process.env.GEMINI_API_KEY) {
    try {
      const prompt = `You are an advanced ATS (Applicant Tracking System) optimizer. Analyze the resume text and return a JSON object with: { atsScore: number (0-100), missingSkills: string[], grammarSuggestions: { original: string, suggestion: string, explanation: string }[], keywordOptimization: { keyword: string, reason: string }[], roleSuitability: { role: string, score: number, reason: string }[] }. Resume Content:\n${resumeText}`;
      const text = await callGemini(prompt, true);
      return JSON.parse(text);
    } catch (err) {
      console.error('Gemini Resume Analysis failed, falling back to local simulator:', err);
    }
  } else if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'You are an advanced ATS (Applicant Tracking System) optimizer. Analyze the resume text and return a JSON object with: { atsScore: number (0-100), missingSkills: string[], grammarSuggestions: { original: string, suggestion: string, explanation: string }[], keywordOptimization: { keyword: string, reason: string }[], roleSuitability: { role: string, score: number, reason: string }[] }'
          },
          {
            role: 'user',
            content: `Resume Content:\n${resumeText}`
          }
        ]
      });
      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('OpenAI Resume Analysis failed, falling back to local simulator:', error);
    }
  }

  // Fallback simulator
  const textLower = resumeText.toLowerCase();
  const detectedSkills = SKILLS_DATABASE.filter(skill => textLower.includes(skill.toLowerCase()));
  const missingSkills = SKILLS_DATABASE.filter(skill => !detectedSkills.includes(skill));
  const atsScore = Math.min(60 + (detectedSkills.length * 5), 98);
  
  return {
    ...MOCK_MOCK_FEEDBACK,
    atsScore,
    missingSkills: missingSkills.slice(0, 4),
    roleSuitability: [
      {
        role: 'Software Engineer',
        score: atsScore + 2,
        reason: `Your resume shows experience with ${detectedSkills.slice(0, 3).join(', ')}.`
      }
    ]
  };
};

/**
 * 2. Generate Next Interview Question
 */
const generateInterviewQuestion = async (type, currentQuestions = []) => {
  const provider = (process.env.AI_PROVIDER || 'openai').toLowerCase();
  const history = currentQuestions.map(q => `Q: ${q.question}\nA: ${q.answer}`).join('\n\n');

  if (provider === 'gemini' && process.env.GEMINI_API_KEY) {
    try {
      const prompt = `You are an AI Interviewer conducting a mock ${type} interview. Ask the candidate ONE single question. Do not add intro or outro. Respond with just the question. Interview history so far:\n${history}\n\nAsk the next question.`;
      const text = await callGemini(prompt);
      return text.trim();
    } catch (err) {
      console.error('Gemini question generation failed, falling back to simulator:', err);
    }
  } else if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an AI Interviewer conducting a mock ${type} interview. Ask the candidate ONE single question. Do not add intro or outro. Respond with just the question.`
          },
          {
            role: 'user',
            content: `Interview history so far:\n${history}\n\nAsk the next question.`
          }
        ]
      });
      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('OpenAI question generation failed, falling back to simulator:', error);
    }
  }

  // Fallback simulator
  const index = currentQuestions.length;
  const questionsList = MOCK_QUESTIONS[type] || MOCK_QUESTIONS['Technical'];
  return questionsList[index % questionsList.length];
};

/**
 * 3. Evaluate Interview Answer
 */
const evaluateInterviewAnswer = async (question, answer, type) => {
  const provider = (process.env.AI_PROVIDER || 'openai').toLowerCase();

  if (provider === 'gemini' && process.env.GEMINI_API_KEY) {
    try {
      const prompt = `You are an AI Technical & HR Interview evaluator. Evaluate the candidate's answer to the given question, analyzing fluency, pace alignment, and vocabulary confidence markers. Return a JSON object with: { confidenceScore: number (0-100), communicationScore: number (0-100), technicalScore: number (0-100), score: number (0-100), feedback: string, betterAnswer: string, fluencyAnalysis: string, toneAssessment: string }. Question: ${question}\nCandidate Answer: ${answer}\nInterview Type: ${type}`;
      const text = await callGemini(prompt, true);
      return JSON.parse(text);
    } catch (err) {
      console.error('Gemini answer evaluation failed, falling back to simulator:', err);
    }
  } else if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'You are an AI Technical & HR Interview evaluator. Evaluate the candidate\'s answer to the given question, analyzing fluency, pace alignment, and vocabulary confidence markers. Return a JSON object with: { confidenceScore: number (0-100), communicationScore: number (0-100), technicalScore: number (0-100), score: number (0-100), feedback: string, betterAnswer: string, fluencyAnalysis: string, toneAssessment: string }'
          },
          {
            role: 'user',
            content: `Question: ${question}\nCandidate Answer: ${answer}\nInterview Type: ${type}`
          }
        ]
      });
      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('OpenAI answer evaluation failed, falling back to simulator:', error);
    }
  }

  // Fallback simulator
  const length = answer.trim().length;
  const confidenceScore = length > 100 ? 88 : length > 30 ? 75 : 45;
  const communicationScore = length > 120 ? 90 : length > 40 ? 78 : 50;
  
  const techKeywords = ['virtual', 'asynchronous', 'promise', 'index', 'node', 'react', 'scaling', 'redundancy', 'thread', 'query'];
  const matchedKeywords = techKeywords.filter(k => answer.toLowerCase().includes(k));
  const technicalScore = type === 'HR' || type === 'Behavioral' 
    ? (length > 50 ? 85 : 60)
    : (matchedKeywords.length * 15 + (length > 80 ? 40 : 20));
  
  const score = Math.round((confidenceScore + communicationScore + Math.min(technicalScore, 100)) / 3);

  return {
    confidenceScore,
    communicationScore,
    technicalScore: Math.min(technicalScore, 100),
    score,
    feedback: length > 80 
      ? "You provided a structured response with solid baseline content."
      : "Your response is somewhat brief. Expand by discussing trade-offs.",
    betterAnswer: `A comprehensive answer would detail: 1. Core concept definitions clearly. 2. Practical developer application scenario.`,
    fluencyAnalysis: length > 80 ? "Grammar and sentence pacing appear smooth and natural." : "Pacing feels brief; try expressing thoughts in complete sentence structures.",
    toneAssessment: length > 80 ? "Professional, calm, and collaborative tone detected." : "Slightly hesitant or brief tone. Work on articulation dynamics."
  };
};

/**
 * 4. Generate Final Interview Feedback
 */
const generateFinalInterviewFeedback = async (questionsAndAnswers, type) => {
  const provider = (process.env.AI_PROVIDER || 'openai').toLowerCase();
  const transcript = questionsAndAnswers.map(qa => `Q: ${qa.question}\nA: ${qa.answer}`).join('\n\n');

  if (provider === 'gemini' && process.env.GEMINI_API_KEY) {
    try {
      const prompt = `You are a senior recruiter. Review the entire interview transcript and compile a master performance report. Return a JSON object with: { overallScore: number, communicationScore: number, technicalScore: number, confidenceScore: number, detailedFeedback: string, improvementAreas: string[], suggestedAnswers: { question: string, betterAnswer: string }[] }. Transcript:\n${transcript}`;
      const text = await callGemini(prompt, true);
      return JSON.parse(text);
    } catch (err) {
      console.error('Gemini final report compilation failed, falling back to simulator:', err);
    }
  } else if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'You are a senior recruiter. Review the entire interview transcript and compile a master performance report. Return a JSON object with: { overallScore: number, communicationScore: number, technicalScore: number, confidenceScore: number, detailedFeedback: string, improvementAreas: string[], suggestedAnswers: { question: string, betterAnswer: string }[] }'
          },
          {
            role: 'user',
            content: `Interview Transcript:\n${transcript}`
          }
        ]
      });
      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('OpenAI final report compilation failed, falling back to simulator:', error);
    }
  }

  // Fallback simulator
  return {
    overallScore: 80,
    communicationScore: 85,
    technicalScore: 78,
    confidenceScore: 82,
    detailedFeedback: "The candidate demonstrated strong foundational knowledge and structural delivery, articulating system limitations appropriately.",
    improvementAreas: [
      "Elaborate on production scalability parameters",
      "Mention database query indexing performance checks"
    ],
    suggestedAnswers: questionsAndAnswers.map(qa => ({
      question: qa.question,
      betterAnswer: `A robust answer for "${qa.question}" would describe how async events behave under node event-loops.`
    }))
  };
};

/**
 * 5. Get chatbot response
 */
const getCoachResponse = async (msg, chatHistory = []) => {
  const provider = (process.env.AI_PROVIDER || 'openai').toLowerCase();
  const context = chatHistory.map(c => `${c.sender === 'user' ? 'Candidate' : 'Coach'}: ${c.text}`).join('\n');

  if (provider === 'gemini' && process.env.GEMINI_API_KEY) {
    try {
      const prompt = `You are a supportive, high-caliber career and technical placement coach named InterviewAI Pro Coach. Assist the candidate. Respond concisely. Context:\n${context}\nCandidate: ${msg}`;
      const text = await callGemini(prompt);
      return text.trim();
    } catch (err) {
      console.error('Gemini chatbot failed, falling back to simulator:', err);
    }
  } else if (openai) {
    try {
      const messages = [
        {
          role: 'system',
          content: 'You are a supportive, high-caliber career and technical placement coach named InterviewAI Pro Coach. Assist the candidate. Respond concisely.'
        },
        ...chatHistory.map(c => ({
          role: c.sender === 'user' ? 'user' : 'assistant',
          content: c.text
        })),
        {
          role: 'user',
          content: msg
        }
      ];

      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages
      });
      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('OpenAI chatbot failed, falling back to simulator:', error);
    }
  }

  // Fallback simulator
  const msgLower = msg.toLowerCase();
  if (msgLower.includes('salary') || msgLower.includes('negotiate')) {
    return "When negotiating salary: 1. Research market rates using sites like Levels.fyi or Glassdoor. 2. Focus on total compensation.";
  }
  if (msgLower.includes('resume') || msgLower.includes('cv')) {
    return "To optimize your resume: 1. Structure bullet points as: Accomplished [X] by doing [Z]. 2. Target job description keywords.";
  }
  return "That is an excellent career goal. Preparing for technical coding runs and matching your resume to industry keywords represents a solid growth baseline.";
};

/**
 * 6. Compare Resume to Job Description
 */
const compareResumeToJobDescription = async (resumeText, jobDescriptionText) => {
  const provider = (process.env.AI_PROVIDER || 'openai').toLowerCase();

  if (provider === 'gemini' && process.env.GEMINI_API_KEY) {
    try {
      const prompt = `You are an advanced recruitment ATS specialist. Compare the resume text with the job description text. Return a JSON object with: { atsScore: number (0-100), matchedKeywords: string[], missingKeywords: string[], grammarSuggestions: { original: string, suggestion: string, explanation: string }[], roleSuitability: { role: string, score: number, reason: string }[], tailoredResumeBullets: string[] }. Resume Text:\n${resumeText}\n\nJob Description:\n${jobDescriptionText}`;
      const text = await callGemini(prompt, true);
      return JSON.parse(text);
    } catch (err) {
      console.error('Gemini Resume Comparison failed, falling back to simulator:', err);
    }
  } else if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'You are an advanced recruitment ATS specialist. Compare the resume text with the job description text. Return a JSON object with: { atsScore: number (0-100), matchedKeywords: string[], missingKeywords: string[], grammarSuggestions: { original: string, suggestion: string, explanation: string }[], roleSuitability: { role: string, score: number, reason: string }[], tailoredResumeBullets: string[] }'
          },
          {
            role: 'user',
            content: `Resume Text:\n${resumeText}\n\nJob Description:\n${jobDescriptionText}`
          }
        ]
      });
      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('OpenAI Resume Comparison failed, falling back to simulator:', error);
    }
  }

  // Fallback simulator
  const textLower = resumeText.toLowerCase();
  const jdLower = jobDescriptionText.toLowerCase();
  const detectedSkills = SKILLS_DATABASE.filter(skill => textLower.includes(skill.toLowerCase()));
  const jdSkills = SKILLS_DATABASE.filter(skill => jdLower.includes(skill.toLowerCase()));
  const matchedKeywords = detectedSkills.filter(s => jdSkills.includes(s));
  const missingKeywords = jdSkills.filter(s => !detectedSkills.includes(s));

  const atsScore = Math.min(50 + (matchedKeywords.length * 10), 96);

  return {
    atsScore,
    matchedKeywords,
    missingKeywords: missingKeywords.length > 0 ? missingKeywords.slice(0, 5) : ['System Design', 'CI/CD Pipelines'],
    grammarSuggestions: [
      {
        original: 'Responsible for writing APIs.',
        suggestion: 'Designed, implemented, and scaled highly responsive RESTful APIs using Node.js.',
        explanation: 'Enrich with metrics and developer libraries tags.'
      }
    ],
    roleSuitability: [
      {
        role: 'Target Job Match',
        score: atsScore,
        reason: `Your resume matches ${matchedKeywords.length} key skill requirements from the job description.`
      }
    ],
    tailoredResumeBullets: [
      `Engineered robust server frameworks using ${matchedKeywords.includes('Node.js') ? 'Node.js' : 'backend controllers'} to boost performance by 25%.`,
      `Collaborated with cross-functional development squads to deploy modular interfaces incorporating ${matchedKeywords.includes('React') ? 'React Components' : 'modern styling specifications'}.`
    ]
  };
};

const getCoachResponseStream = async (msg, chatHistory = []) => {
  const provider = (process.env.AI_PROVIDER || 'openai').toLowerCase();

  if (provider === 'gemini' && geminiAi) {
    const context = chatHistory.map(c => `${c.sender === 'user' ? 'Candidate' : 'Coach'}: ${c.text}`).join('\n');
    const prompt = `You are a supportive, high-caliber career and technical placement coach named InterviewAI Pro Coach. Assist the candidate. Respond concisely. Context:\n${context}\nCandidate: ${msg}`;

    return geminiAi.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: prompt
    });
  }

  // Generate a mock stream fallback
  const mockResponse = await getCoachResponse(msg, chatHistory);
  return (async function* () {
    const words = mockResponse.split(' ');
    for (let i = 0; i < words.length; i++) {
      yield { text: words[i] + (i < words.length - 1 ? ' ' : '') };
      await new Promise(resolve => setTimeout(resolve, 30)); // 30ms simulation delay
    }
  })();
};

module.exports = {
  analyzeResume,
  generateInterviewQuestion,
  evaluateInterviewAnswer,
  generateFinalInterviewFeedback,
  getCoachResponse,
  getCoachResponseStream,
  compareResumeToJobDescription
};

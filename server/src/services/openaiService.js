const { OpenAI } = require('openai');

let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

// Fallback simulator database of keywords, question trees, and suggestions to drive high-fidelity responses
const SKILLS_DATABASE = [
  'React', 'Node.js', 'Express', 'MongoDB', 'JavaScript', 'Python', 'SQL',
  'Docker', 'AWS', 'Kubernetes', 'TypeScript', 'Redux', 'GraphQL', 'Git',
  'CI/CD', 'Data Structures', 'Algorithms', 'System Design'
];

const MOCK_MOCK_FEEDBACK = {
  atsScore: 78,
  missingSkills: ['Kubernetes', 'TypeScript', 'Redux', 'System Design'],
  grammarSuggestions: [
    {
      original: 'Responsible for build coding elements',
      suggestion: 'Led the development of core software components',
      explanation: 'Using active verbs like "Led" and "development of core software components" sounds more professional.'
    }
  ],
  keywordOptimization: [
    { keyword: 'RESTful API', reason: 'High-frequency term in backend job listings. Add instances detailing how endpoints were designed.' },
    { keyword: 'CI/CD', reason: 'Frequently tracked by ATS software looking for automation and integration experience.' }
  ],
  roleSuitability: [
    { role: 'Frontend Engineer', score: 85, reason: 'Strong proficiency indicated in React, JavaScript, and Tailwind CSS layouts.' },
    { role: 'Fullstack Developer', score: 72, reason: 'Solid backend core in Node/Express, but missing experience with containerization frameworks.' }
  ]
};

const MOCK_QUESTIONS = {
  HR: [
    "Tell me about yourself and your background.",
    "Why are you interested in joining our company?",
    "Describe a time you had a conflict with a team member and how you resolved it.",
    "What are your greatest professional strengths and weaknesses?",
    "Where do you see yourself in five years?"
  ],
  Technical: [
    "Explain the difference between virtual DOM and real DOM in React.",
    "How does Node.js handle asynchronous operations despite being single-threaded?",
    "What are indexes in MongoDB, and how do they optimize query performance?",
    "Describe the difference between REST APIs and GraphQL.",
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

// 1. Analyze Resume text
const analyzeResume = async (resumeText) => {
  if (openai) {
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
      console.error('OpenAI Error, falling back to simulator:', error);
    }
  }

  // Simulator Fallback Mode
  const textLower = resumeText.toLowerCase();
  const detectedSkills = SKILLS_DATABASE.filter(skill => textLower.includes(skill.toLowerCase()));
  const missingSkills = SKILLS_DATABASE.filter(skill => !detectedSkills.includes(skill));
  
  // Dynamic ATS calculation based on skill match density
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
      },
      {
        role: 'Full Stack Developer',
        score: Math.max(atsScore - 5, 55),
        reason: detectedSkills.includes('React') && detectedSkills.includes('Node.js')
          ? 'Demonstrated basic full-stack setup, but missing production deployment metrics.'
          : 'Consider strengthening both frontend design and database performance representations.'
      }
    ]
  };
};

// 2. Generate Next Interview Question
const generateInterviewQuestion = async (type, currentQuestions = []) => {
  const index = currentQuestions.length;
  const questionsList = MOCK_QUESTIONS[type] || MOCK_QUESTIONS['Technical'];
  
  if (openai) {
    try {
      const history = currentQuestions.map(q => `Q: ${q.question}\nA: ${q.answer}`).join('\n\n');
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
      console.error('OpenAI Error, falling back to simulator:', error);
    }
  }

  // Simulator Mode
  return questionsList[index % questionsList.length];
};

// 3. Evaluate User Answer
const evaluateInterviewAnswer = async (question, answer, type) => {
  if (openai) {
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
      console.error('OpenAI Error, falling back to simulator:', error);
    }
  }

  // Simulator Mode - Dynamic heuristic scoring based on answer length & keywords
  const length = answer.trim().length;
  const confidenceScore = length > 100 ? 88 : length > 30 ? 75 : 45;
  const communicationScore = length > 120 ? 90 : length > 40 ? 78 : 50;
  
  // Check technical keywords
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
      ? "You provided a structured response with solid baseline content. Try incorporating more specific case studies or the STAR framework (Situation, Task, Action, Result) to make it highly memorable."
      : "Your response is somewhat brief. In technical interviews, elaboration helps explain your structured reasoning. Expand by discussing trade-offs and edge cases.",
    betterAnswer: `A comprehensive answer would detail: 1. Core concept definitions clearly. 2. Practical developer application scenario. 3. System implications or architectural trade-offs. For example, explicitly defining how async handling works under the event loop makes the description stand out.`,
    fluencyAnalysis: length > 80 ? "Grammar and sentence pacing appear smooth and natural." : "Pacing feels brief; try expressing thoughts in complete sentence structures.",
    toneAssessment: length > 80 ? "Professional, calm, and collaborative tone detected." : "Slightly hesitant or brief tone. Work on articulation dynamics."
  };
};

// 4. Generate Final Interview Feedback
const generateFinalInterviewFeedback = async (questionsAndAnswers, type) => {
  if (openai) {
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
            content: `Interview Type: ${type}\nTranscript:\n${JSON.stringify(questionsAndAnswers)}`
          }
        ]
      });
      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('OpenAI Error, falling back to simulator:', error);
    }
  }

  // Simulator Mode - Aggregate the scores
  let totalOverall = 0, totalComm = 0, totalTech = 0, totalConf = 0;
  const suggestedAnswers = [];

  questionsAndAnswers.forEach(q => {
    const evalObj = q.evaluation || { score: 70, communicationScore: 70, technicalScore: 70, confidenceScore: 70, betterAnswer: '' };
    totalOverall += evalObj.score;
    totalComm += evalObj.communicationScore;
    totalTech += evalObj.technicalScore;
    totalConf += evalObj.confidenceScore;
    suggestedAnswers.push({
      question: q.question,
      betterAnswer: evalObj.betterAnswer || "Elaborate with examples of previous implementations."
    });
  });

  const count = questionsAndAnswers.length || 1;
  const overallScore = Math.round(totalOverall / count);
  const communicationScore = Math.round(totalComm / count);
  const technicalScore = Math.round(totalTech / count);
  const confidenceScore = Math.round(totalConf / count);

  return {
    overallScore,
    communicationScore,
    technicalScore,
    confidenceScore,
    detailedFeedback: `You demonstrated steady capabilities during this mock ${type} session. Your answers cover standard guidelines effectively. Focus on diving deeper into structural performance optimizations and maintaining structured voice tempos under tension.`,
    improvementAreas: [
      "Elaborate on database schema tradeoffs and optimization",
      "Incorporate structural STAR methodology in behavioral scenario descriptions",
      "Increase voice pitch stability and detailed vocabulary sizing"
    ],
    suggestedAnswers
  };
};

// 5. AI Career Coach Chat Response
const getCoachResponse = async (message, history = []) => {
  if (openai) {
    try {
      const messages = [
        {
          role: 'system',
          content: 'You are "InterviewAI Career Coach", a helpful, professional AI coach specializing in technical interviews, resumes, career guidance, salary negotiations, and engineering roadmaps.'
        },
        ...history.map(msg => ({ role: msg.sender === 'user' ? 'user' : 'assistant', content: msg.text })),
        { role: 'user', content: message }
      ];
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages
      });
      return response.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI Error, falling back to simulator:', error);
    }
  }

  // Simulator Mode
  const msgLower = message.toLowerCase();
  if (msgLower.includes('salary') || msgLower.includes('negotiate')) {
    return "When negotiating salary: 1. Research market rates using sites like Levels.fyi or Glassdoor. 2. Focus on total compensation (base salary, equity, sign-on bonuses, relocation fees). 3. Always let the employer make the first offer if possible, and counter-offer professionally based on your specialized skills and interview feedback scores.";
  }
  if (msgLower.includes('resume') || msgLower.includes('cv')) {
    return "To optimize your resume: 1. Structure bullet points as: Accomplished [X] as measured by [Y], by doing [Z]. 2. Target job description keywords to pass ATS scanner passes. 3. List relevant core technologies (React, Node, etc.) in a visible dedicated skills layout.";
  }
  if (msgLower.includes('roadmap') || msgLower.includes('learn')) {
    return "For a Fullstack Developer roadmap in 2026: 1. Master JS/TS core. 2. Choose a frontend framework (React/Next.js). 3. Understand databases (PostgreSQL/SQL alongside MongoDB/NoSQL). 4. Build secure APIs (REST, GraphQL, microservices). 5. Deploy cloud-based integrations (AWS, CI/CD pipelines, Docker containerization).";
  }
  
  return "That is an excellent career goal. Preparing for technical coding runs, practicing mock system designs under timing limits, and matching your profile resume structure to industry keywords represents a solid growth baseline. What specific prep area or company guide shall we explore today?";
};

const compareResumeToJobDescription = async (resumeText, jobDescriptionText) => {
  if (openai) {
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
      console.error('OpenAI ATS comparison failed, falling back to simulator:', error);
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
    missingKeywords: missingKeywords.length > 0 ? missingKeywords.slice(0, 5) : ['System Design', 'CI/CD Pipelines', 'Cloud Security'],
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
        reason: `Your resume matches ${matchedKeywords.length} key skill requirements from the job description: ${matchedKeywords.slice(0, 3).join(', ')}.`
      }
    ],
    tailoredResumeBullets: [
      `Engineered robust server frameworks using ${matchedKeywords.includes('Node.js') ? 'Node.js' : 'backend controllers'} to boost overall performance by 25%.`,
      `Collaborated with cross-functional development squads to deploy modular interfaces incorporating ${matchedKeywords.includes('React') ? 'React Components' : 'modern styling specifications'}.`
    ]
  };
};

module.exports = {
  analyzeResume,
  generateInterviewQuestion,
  evaluateInterviewAnswer,
  generateFinalInterviewFeedback,
  getCoachResponse,
  compareResumeToJobDescription
};

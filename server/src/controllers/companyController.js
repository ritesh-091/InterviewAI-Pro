const Company = require('../models/Company');
const { getCache, setCache } = require('../services/cacheService');

// List of companies to seed
const COMPANY_SEEDS = [
  {
    name: "TCS",
    interviewProcess: [
      { stepNumber: 1, title: "TCS NQT (National Qualifier Test)", description: "Aptitude, Verbal Ability, Reasoning, and Coding questions." },
      { stepNumber: 2, title: "Technical Interview", description: "Questions on DSA, DBMS, OOPs concepts, and final year projects." },
      { stepNumber: 3, title: "HR & Managerial Round", description: "Discussion on salary details, work locations, shift flexibility, and background verification." }
    ],
    faq: [
      { question: "What is the NQT cut-off?", answer: "Generally, securing a cumulative percentile of 70%+ in the Aptitude and Cognitive sections and compiling at least 1 coding challenge gets you shortlisted." }
    ],
    aptitudeTopics: ["Quantitative Aptitude", "Logical Reasoning", "Verbal Ability"],
    technicalTopics: ["Object-Oriented Programming (OOPs)", "C/Java/Python basics", "DBMS SQL queries"],
    hrQuestions: ["Are you ready to relocate?", "Why do you want to join TCS?"],
    codingQuestions: [
      { title: "Find Second Largest Element", difficulty: "Easy", description: "Given an array, find the second largest element." }
    ],
    previousExperiences: [
      { userName: "Rahul S.", role: "Systems Engineer", content: "NQT was medium difficulty. The technical interviewer asked me to explain Call by Value and Reference and print a Fibonacci series. HR was very friendly.", rating: 4 }
    ]
  },
  {
    name: "Microsoft",
    interviewProcess: [
      { stepNumber: 1, title: "Online Coding Test", description: "3 coding questions of Medium/Hard difficulty on Codility." },
      { stepNumber: 2, title: "Technical Round 1 & 2", description: "Deep-dives into data structures, algorithms, and micro-optimization tradeoff choices." },
      { stepNumber: 3, title: "System Design Round", description: "Design a high-scale service (e.g. Teams chat, cloud storage queues)." },
      { stepNumber: 4, title: "AA (As Appropriate) Round", description: "Leadership principles and behavioral matching with engineering directors." }
    ],
    faq: [
      { question: "Which languages are allowed?", answer: "Any standard object-oriented language including C++, Java, C#, or Python." }
    ],
    aptitudeTopics: ["Advanced Data Structures", "Thread Concurrency", "Memory Pointers"],
    technicalTopics: ["Trees & Graphs", "Dynamic Programming", "Distributed System Architectures"],
    hrQuestions: ["Tell me about a time you had to deliver critical updates under high pressure.", "Why Microsoft vs other cloud leaders?"],
    codingQuestions: [
      { title: "Binary Tree Zigzag Level Order Traversal", difficulty: "Medium", description: "Return the zigzag level order traversal of its nodes' values." }
    ],
    previousExperiences: [
      { userName: "Deepak K.", role: "Software Engineer II", content: "Four rounds of coding and system design. Focus heavily on trees, DFS, BFS, and caching mechanisms. The interviewers helped me refine my system design scaling blocks.", rating: 5 }
    ]
  },
  {
    name: "Google",
    interviewProcess: [
      { stepNumber: 1, title: "Recruiter Screen", description: "Initial resume check and high-level technical/experience sizing." },
      { stepNumber: 2, title: "Technical Phone Screen", description: "1-2 algorithm coding problems in Google Docs / online editor environment." },
      { stepNumber: 3, title: "Onsite Coding Rounds (3)", description: "Rigorous DSA coding exercises focusing on complexity metrics and runtime performance." },
      { stepNumber: 4, title: "Googleyness & Leadership", description: "Behavioral interview checking team alignment, ambiguity handling, and ethics." }
    ],
    faq: [
      { question: "How long does the hiring committee review take?", answer: "It usually takes between 1 to 3 weeks once all onsite interview evaluations are compiled." }
    ],
    aptitudeTopics: ["Algorithmic Optimization", "Big-O Analysis", "Advanced Graphs"],
    technicalTopics: ["Heaps & Tries", "Graph Pathfinding (Dijkstra, A*)", "Memory-constrained execution"],
    hrQuestions: ["Describe a time you saw a problem in a team project and solved it proactively.", "How do you handle ambiguous specifications?"],
    codingQuestions: [
      { title: "Longest Increasing Path in a Matrix", difficulty: "Hard", description: "Given an m x n integers matrix, return the length of the longest increasing path." }
    ],
    previousExperiences: [
      { userName: "Ananya M.", role: "L4 Software Engineer", content: "Focus heavily on graph structures and dynamic programming. Always talk aloud while writing your solution. They care about your thought process much more than typing code.", rating: 5 }
    ]
  },
  {
    name: "Amazon",
    interviewProcess: [
      { stepNumber: 1, title: "Online Assessment (OA)", description: "Debugging questions, coding challenges, and work simulation queries." },
      { stepNumber: 2, title: "Technical Loop (3-4 Rounds)", description: "Algorithms, system scaling, and deep dives into Amazon's Leadership Principles." },
      { stepNumber: 3, title: "Bar Raiser Round", description: "An independent interviewer evaluates if you raise the median capabilities of your prospective tier." }
    ],
    faq: [
      { question: "How crucial are the Leadership Principles?", answer: "Extremely. Over 50% of the rating weight is based on demonstrating the 16 Leadership Principles in your behavior questions." }
    ],
    aptitudeTopics: ["Data Structures", "System Scale Logic", "SQL Optimization"],
    technicalTopics: ["Hash Maps & Arrays", "Priority Queues", "High Availability Architectures"],
    hrQuestions: ["Tell me about a time you took absolute ownership of a project failure.", "Give me an example of when you disagreed with a manager but complied."],
    codingQuestions: [
      { title: "K Closest Points to Origin", difficulty: "Medium", description: "Find the k closest points to the origin (0, 0) on a 2D plane." }
    ],
    previousExperiences: [
      { userName: "Siddharth R.", role: "SDE 1", content: "Mock interview practice using Leadership principles is key. My coding question was similar to LRU Cache. Practice explaining your trade-offs clearly.", rating: 4 }
    ]
  }
];

// Add filler entries for the remaining required companies: Accenture, Cognizant, Capgemini, Deloitte, IBM, Wipro, Infosys
const OTHER_COMPANIES = ["Accenture", "Cognizant", "Capgemini", "Deloitte", "IBM", "Wipro", "Infosys"];
OTHER_COMPANIES.forEach((comp, idx) => {
  COMPANY_SEEDS.push({
    name: comp,
    interviewProcess: [
      { stepNumber: 1, title: "Aptitude & Cognitive Assessment", description: "Logical reasoning, English grammar, and quantitative puzzles." },
      { stepNumber: 2, title: "Pseudocode & Coding", description: "Dry-running code structures, loop trace tables, and programming fundamentals." },
      { stepNumber: 3, title: "Technical & HR Combined Interview", description: "Final year projects review, basic databases questions, and HR scenario checks." }
    ],
    faq: [
      { question: "Is active coding required?", answer: "Yes, usually there is 1 easy algorithm code block to complete in 30 minutes in their assessment interface." }
    ],
    aptitudeTopics: ["General Math", "Analytical Reasoning", "Communication Skills"],
    technicalTopics: ["OOPs Principles", "Database Normalization (SQL)", "SDLC Models (Agile)"],
    hrQuestions: ["Why are you interested in joining our consulting stream?", "Tell me about your final year academic project."],
    codingQuestions: [
      { title: "Palindrome Number", difficulty: "Easy", description: "Check if an integer is a palindrome." }
    ],
    previousExperiences: [
      { userName: `Priya G.`, role: "Associate Developer", content: "The aptitude round was fast-paced. Technical questions focused on inheritance, interfaces, and basic SQL updates. HR checked relocation readiness.", rating: 4 }
    ]
  });
});

// Helper to seed companies if database is empty
const seedCompaniesIfNeeded = async () => {
  try {
    const count = await Company.countDocuments();
    if (count === 0) {
      await Company.insertMany(COMPANY_SEEDS);
      console.log('Seeded company preparation tracks successfully!');
    }
  } catch (error) {
    console.error('Error seeding companies:', error);
  }
};

// Seed only after MongoDB connection is active
const mongoose = require('mongoose');
if (mongoose.connection.readyState === 1) {
  seedCompaniesIfNeeded();
} else {
  mongoose.connection.once('open', seedCompaniesIfNeeded);
}

// 1. Get List of all Companies
const getCompanies = async (req, res, next) => {
  try {
    const cacheKey = 'companies_list';
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    const companies = await Company.find({}).select('name aptitudeTopics technicalTopics codingQuestions.title');
    await setCache(cacheKey, companies, 1800); // 30 minutes TTL
    res.status(200).json(companies);
  } catch (error) {
    next(error);
  }
};

// 2. Get specific Company Details by Name
const getCompanyByName = async (req, res, next) => {
  try {
    const name = req.params.name;
    const cacheKey = `company_${name.toLowerCase()}`;
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    const company = await Company.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (!company) {
      return res.status(404).json({ message: `Company preparation module for ${name} not found` });
    }
    await setCache(cacheKey, company, 1800); // 30 minutes TTL
    res.status(200).json(company);
  } catch (error) {
    next(error);
  }
};

const User = require('../models/User');

// 3. Toggle Bookmark for Company
const toggleBookmark = async (req, res, next) => {
  try {
    const { name } = req.params;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const index = user.bookmarks.indexOf(name);
    let bookmarked = false;
    if (index > -1) {
      user.bookmarks.splice(index, 1);
    } else {
      user.bookmarks.push(name);
      bookmarked = true;
    }

    await user.save();
    res.status(200).json({ bookmarked, bookmarks: user.bookmarks });
  } catch (error) {
    next(error);
  }
};

// 4. Update Company Prep progress
const updateProgress = async (req, res, next) => {
  try {
    const { name } = req.params;
    const { status } = req.body; // 'in-progress' or 'completed'
    
    if (!status || !['in-progress', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Valid status is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const progressIdx = user.companyProgress.findIndex(p => p.name.toLowerCase() === name.toLowerCase());
    if (progressIdx > -1) {
      user.companyProgress[progressIdx].status = status;
    } else {
      user.companyProgress.push({ name, status });
    }

    await user.save();
    res.status(200).json({ companyProgress: user.companyProgress });
  } catch (error) {
    next(error);
  }
};

// 5. Add interview experience to company guide
const addExperience = async (req, res, next) => {
  try {
    const { name } = req.params;
    const { role, content, rating } = req.body;

    if (!role || !content || !rating) {
      return res.status(400).json({ message: 'Role, content, and rating are required' });
    }

    const company = await Company.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const newExp = {
      userName: req.user.profile.name || 'Anonymous Candidate',
      role,
      content,
      rating: Number(rating),
      date: new Date()
    };

    company.previousExperiences.push(newExp);
    await company.save();

    // Clear detail cache
    const { deleteCache } = require('../services/cacheService');
    await deleteCache(`company_${name.toLowerCase()}`);

    res.status(201).json({ message: 'Experience added successfully!', experience: newExp });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCompanies,
  getCompanyByName,
  toggleBookmark,
  updateProgress,
  addExperience
};

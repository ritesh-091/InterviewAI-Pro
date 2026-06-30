const CoachChat = require('../models/CoachChat');
const { getCoachResponse, getCoachResponseStream } = require('../services/aiService');

// 1. Send Chat Message to Career Coach
const chat = async (req, res, next) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    // Save user message to database
    await CoachChat.create({
      userId: req.user._id,
      sender: 'user',
      text: message
    });

    const responseText = await getCoachResponse(message, history || []);

    // Save coach reply to database
    await CoachChat.create({
      userId: req.user._id,
      sender: 'coach',
      text: responseText
    });

    res.status(200).json({ text: responseText });
  } catch (error) {
    next(error);
  }
};

// 2. Chat Streaming (SSE endpoint)
const chatStream = async (req, res, next) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    // Save user message
    await CoachChat.create({
      userId: req.user._id,
      sender: 'user',
      text: message
    });

    // Setup Server-Sent Events headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await getCoachResponseStream(message, history || []);
    let fullResponseText = '';

    for await (const chunk of stream) {
      const chunkText = chunk.text || '';
      fullResponseText += chunkText;
      res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
    }

    // Save coach response to database
    if (fullResponseText.trim()) {
      await CoachChat.create({
        userId: req.user._id,
        sender: 'coach',
        text: fullResponseText
      });
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Coach streaming error:', error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
};

// 3. Get Chat History
const getHistory = async (req, res, next) => {
  try {
    const { search } = req.query;
    const filter = { userId: req.user._id };
    
    if (search) {
      filter.text = { $regex: search, $options: 'i' };
    }

    const logs = await CoachChat.find(filter).sort({ createdAt: 1 });
    res.status(200).json(logs);
  } catch (error) {
    next(error);
  }
};

// 4. Delete Chat History
const deleteHistory = async (req, res, next) => {
  try {
    await CoachChat.deleteMany({ userId: req.user._id });
    res.status(200).json({ message: 'Chat history cleared successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  chat,
  chatStream,
  getHistory,
  deleteHistory
};

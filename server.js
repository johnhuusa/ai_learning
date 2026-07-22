require('dotenv').config();
const express = require('express');
const session = require('express-session');
const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const notes = fs.readFileSync('notes.txt', 'utf-8');

const app = express();
app.use(express.json());
app.use(express.static('public'));

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-this',
  resave: false,
  saveUninitialized: true,
}));

app.post('/chat', async (req, res) => {
  try {
    const userMessage = req.body.message;

    // If this session has no history yet, start one
    if (!req.session.conversationHistory) {
      req.session.conversationHistory = [];
    }

    req.session.conversationHistory.push({ role: 'user', content: userMessage });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 300,
      system: `You are a helpful assistant. Use the following notes to answer questions if relevant:\n\n${notes}`,
      messages: req.session.conversationHistory,
    });

    const textBlock = message.content.find(block => block.type === 'text');
    const reply = textBlock.text;
    req.session.conversationHistory.push({ role: 'assistant', content: reply });

    res.json({ reply: textBlock.text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.listen(3000, () => console.log('Server running at http://localhost:3000'));
require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');
const readline = require('readline');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let conversationHistory = [];

function askQuestion() {
  rl.question('You: ', async (userInput) => {
    if (userInput.toLowerCase() === 'exit') {
      rl.close();
      return;
    }

    conversationHistory.push({ role: 'user', content: userInput });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 300,
      messages: conversationHistory,
    });


    const textBlock = message.content.find(block => block.type === 'text');
    const reply = textBlock.text;
    
    console.log('Claude:', reply);

    conversationHistory.push({ role: 'assistant', content: reply });

    askQuestion(); // loop again
  });
}

console.log('Chat with Claude! Type "exit" to quit.\n');
askQuestion();
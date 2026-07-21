require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');
const readline = require('readline');


const fs = require('fs');                              // ← NEW
const notes = fs.readFileSync('notes.txt', 'utf-8');    // ← NEW

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let conversationHistory = [];

// Describe the tool to Claude - name, what it does, what input it expects
const tools = [
  {
    name: 'calculate',
    description: 'Perform a basic math calculation. Use this whenever the user asks for a calculation.',
    input_schema: {
      type: 'object',
      properties: {
        expression: {
          type: 'string',
          description: 'A math expression to evaluate, e.g. "12 * 47"',
        },
      },
      required: ['expression'],
    },
  },
];

// The actual function that runs when Claude requests the tool
function calculate(expression) {
  try {
    return String(eval(expression));
  } catch (err) {
    return 'Error: invalid expression';
  }
}

async function getResponse() {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 300,
    tools: tools,
    system: `You are a helpful assistant. Use the following notes to answer questions if relevant:\n\n${notes}`,
    messages: conversationHistory,
  });

  // Look for a tool_use block, the same way we looked for a text block before
  const toolUseBlock = message.content.find(block => block.type === 'tool_use');

  if (toolUseBlock) {
    console.log(`(Claude wants to use the "${toolUseBlock.name}" tool...)`);

    const result = calculate(toolUseBlock.input.expression);

    // Add Claude's full response (including the tool_use block) to history
    conversationHistory.push({ role: 'assistant', content: message.content });

    // Send the tool's result back as a new message
    conversationHistory.push({
      role: 'user',
      content: [
        {
          type: 'tool_result',
          tool_use_id: toolUseBlock.id,
          content: result,
        },
      ],
    });

    // Ask again - now Claude has the tool result and can give a final answer
    return getResponse();
  }

  // No tool needed - find the text block like before
  const textBlock = message.content.find(block => block.type === 'text');
  const reply = textBlock.text;
  conversationHistory.push({ role: 'assistant', content: reply });
  return reply;
}

function askQuestion() {
  rl.question('You: ', async (userInput) => {
    if (userInput.toLowerCase() === 'exit') {
      rl.close();
      return;
    }

    conversationHistory.push({ role: 'user', content: userInput });

    const reply = await getResponse();
    console.log('Claude:', reply);

    askQuestion();
  });
}

console.log('Chat with Claude! Try a math question. Type "exit" to quit.\n');
askQuestion();
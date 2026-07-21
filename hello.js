require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function main() {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `Give me 3 fun facts about Kimchi.
      Respond ONLY with valid JSON in this exact format, no other text:
      { "facts": ["fact 1", "fact 2", "fact 3"] }`
    }],
  });
  
  const data = JSON.parse(message.content[0].text);
  console.log(data.facts[0]); // prints just the first fact
}



main().catch(err => console.error('Error:', err));
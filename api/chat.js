const axios = require('axios');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-openai-key');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { message, sessionId, systemPrompt, faq } = req.body || {};
    const apiKey = req.headers['x-openai-key'] || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ reply: 'OpenAI API key not provided.' });
    }
    if (!message) {
      return res.status(400).json({ reply: 'No message provided.' });
    }
    let systemContent = systemPrompt || 'You are a helpful assistant.';
    if (faq) {
      systemContent += '\n\nKnowledge Base:\n' + faq;
    }
    const openaiRes = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemContent },
          { role: 'user', content: message }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    const reply = openaiRes.data.choices[0].message.content;
    res.status(200).json({ reply });
  } catch (error) {
    console.error('OpenAI API error:', error.response?.data || error.message);
    res.status(500).json({ reply: 'Sorry, there was an error processing your request.' });
  }
};

const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const client = new Anthropic();

app.post('/api/quiz', async (req, res) => {
  const { answers } = req.body;

  if (!answers || typeof answers !== 'object') {
    return res.status(400).json({ error: 'Invalid answers' });
  }

  const prompt = `Based on the following quiz answers about someone's personality and fighting style, determine which Dragon Ball Z character they most resemble. Choose ONLY from this list: Goku, Vegeta, Piccolo, Gohan, Future Trunks, Krillin, Frieza, Cell, Majin Buu.

Quiz answers:
${Object.entries(answers).map(([q, a]) => `- ${q}: ${a}`).join('\n')}

Respond with ONLY a JSON object in this exact format (no markdown, no explanation outside the JSON):
{
  "character": "<exact character name from the list>",
  "reason": "<2-3 sentences explaining why they match this character>",
  "powerLevel": "<a short fun power level description, like 'Over 9,000' or 'Immeasurable' or 'Perfect Form'>"
}`;

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = message.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ error: 'Could not parse character result' });
    }

    const result = JSON.parse(jsonMatch[0]);
    res.json(result);
  } catch (err) {
    console.error('Claude API error:', err.message);
    res.status(500).json({ error: 'Failed to get character match' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`DBZ Quiz server running on port ${PORT}`);
});

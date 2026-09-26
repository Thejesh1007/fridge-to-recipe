import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { callGemini } from './lib/gemini.js';
import { buildRecipePrompt } from './lib/prompt.js';
import { extractJson } from './lib/parseGeminiOutput.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/generate-recipe', async (req, res) => {
  const { ingredients } = req.body;

  if (!ingredients || typeof ingredients !== 'string' || !ingredients.trim()) {
    return res.status(400).json({ error: 'missing_ingredients' });
  }

  try {
    const prompt = buildRecipePrompt(ingredients.trim());
    const rawText = await callGemini(prompt);
    const parsed = extractJson(rawText);

    if (!parsed) {
      return res.status(422).json({ error: 'malformed_json' });
    }

    res.status(200).json(parsed);
  } catch (err) {
    console.error('generate-recipe error:', err.message);

    if (err.message === 'timeout') {
      return res.status(504).json({ error: 'timeout' });
    }
    if (err.message === 'no_response') {
      return res.status(422).json({ error: 'no_response' });
    }
    if (err.message === 'missing_api_key') {
      return res.status(500).json({ error: 'server_misconfigured' });
    }

    res.status(502).json({ error: 'upstream_failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
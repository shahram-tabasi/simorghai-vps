import OpenAI from 'openai';
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const PORT = process.env.PORT || 3001;

const SYSTEM_PROMPT = `You are the Simorgh AI support assistant on the Simorgh AI landing page.
Your role is to help visitors learn about Simorgh AI's products and services.
Be helpful, concise, and professional. Answer in the same language the user writes in (English or Persian/Farsi).

Here is the context about our products and services:

## Products

### 1. SIMORGH AI Chatbot
A smart AI-powered solution for the electrical industry. Key features:
- Automatic extraction of specialized electrical data from technical documents (drawings, catalogs, reports)
- Advanced electrical calculations: voltage drop, current, power, load flow analysis
- AI-powered assistant that understands engineering documents
- Available at: simorghai.electrokavir.com/chatbot

### 2. EPLANIX Design Suite (Simorgh Design Suite)
Software for managing project materials and consumables:
- Automatic inventory tracking
- Project cost calculation
- Recording and managing project parts and consumable materials
- Available at: simorghai.electrokavir.com/simorgh-draft

### 3. EPLANIX
Automatic electrical drawing software:
- Automatic generation of single-line diagrams
- Automatic layout drawings
- Available at: simorghai.electrokavir.com/eplanix

## Services
We design, implement, and manage complete AI platforms for organizations without needing internal hires.
The platform is:
- Tailored to each company's structure and industry
- Covers all current and future AI needs
- Permanently managed by our expert team

AI Platform packages include:
- Internal AI assistant for company documents
- Process automation (admin, financial, HR)
- Smart customer support (24/7)
- AI decision support systems
- Private/on-premise AI solutions
- Custom AI solutions

## Secure Messaging
We offer Delta Chat integration for privacy-focused communication.
Delta Chat downloads are available directly from our site.

## Company
Simorgh (سیمرغ) in Iranian mythology symbolizes wisdom, knowledge, and guidance.
We bridge ancient wisdom with modern AI technology.
Part of ElectroKavir Company (EKC).

Keep responses concise (2-4 sentences typically). If asked about pricing, suggest contacting us via email: simorgh.ekc.ai@gmail.com`;

const client = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

app.post('/api/chat', async (req, res) => {
  if (!client) {
    return res.status(503).json({
      response: 'Chat service is not configured. Please set the OPENAI_API_KEY environment variable.'
    });
  }

  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ response: 'No messages provided.' });
    }

    // Ensure messages alternate properly and only contain user/assistant roles
    const cleanMessages = messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({ role: m.role, content: String(m.content).slice(0, 2000) }));

    if (cleanMessages.length === 0 || cleanMessages[cleanMessages.length - 1].role !== 'user') {
      return res.status(400).json({ response: 'Invalid message format.' });
    }

    const response = await client.chat.completions.create({
      model: MODEL,
      max_tokens: 500,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...cleanMessages,
      ],
    });

    const text = response.choices[0]?.message?.content || '';

    res.json({ response: text || 'I apologize, I could not generate a response.' });
  } catch (error) {
    console.error('OpenAI API error:', error);
    res.status(500).json({ response: 'An error occurred. Please try again later.' });
  }
});

app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', hasApiKey: !!OPENAI_API_KEY });
});

app.listen(PORT, () => {
  console.log(`Chatbot API running on port ${PORT}`);
  console.log(`OpenAI API key: ${OPENAI_API_KEY ? 'configured' : 'NOT SET'}`);
});

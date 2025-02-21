import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleChatAction } from './handlers/chatHandler.js';
import { handleDataAnalysisAction } from './handlers/dataAnalysisHandler.js';
import { handleReportGeneratorAction } from './handlers/reportGeneratorHandler.js';
import { handleMindfulnessMeditationAction } from './handlers/mindfulnessMeditationHandler.js';
import { handleTaskAutomationAction } from './handlers/taskAutomationHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Set environment variables from secrets
process.env.AZURE_OPENAI_KEY = process.env.spn_4o_AZURE_CLIENT_SECRET;

console.log('Environment variables loaded:', {
  endpoint: process.env.AZURE_OPENAI_ENDPOINT,
  model: process.env.MODEL_NAME,
  port: process.env.PORT
});

const app = express();

app.use(cors());
app.use(express.json());

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const response = await handleChatAction(req.body);
    res.json(response);
  } catch (error) {
    console.error('Chat endpoint error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to process chat request',
      details: error instanceof Error ? error.stack : undefined
    });
  }
});

// Data Analysis endpoint
app.post('/api/data-analysis', async (req, res) => {
  try {
    const response = await handleDataAnalysisAction(req.body);
    res.json(response);
  } catch (error) {
    console.error('Data analysis endpoint error:', error);
    res.status(500).json({ error: 'Failed to process data analysis request' });
  }
});

// Report Generator endpoint
app.post('/api/report', async (req, res) => {
  try {
    const response = await handleReportGeneratorAction(req.body);
    res.json(response);
  } catch (error) {
    console.error('Report generator endpoint error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Mindfulness Meditation endpoint
app.post('/api/meditation', async (req, res) => {
  try {
    const response = await handleMindfulnessMeditationAction(req.body);
    res.json(response);
  } catch (error) {
    console.error('Meditation endpoint error:', error);
    res.status(500).json({ error: 'Failed to process meditation request' });
  }
});

// Task Automation endpoint
app.post('/api/task', async (req, res) => {
  try {
    const response = await handleTaskAutomationAction(req.body);
    res.json(response);
  } catch (error) {
    console.error('Task automation endpoint error:', error);
    res.status(500).json({ error: 'Failed to process task request' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

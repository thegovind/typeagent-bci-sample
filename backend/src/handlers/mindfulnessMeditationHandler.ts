import { generateMockBCIData, getLatestMetrics } from '../mock/bciData.js';
import { MindfulnessMeditationAction, MeditationResponse } from '../schemas/mindfulnessMeditationSchema.js';
import { callOpenAI } from '../utils/openai.js';

export async function handleMindfulnessMeditationAction(action: MindfulnessMeditationAction): Promise<MeditationResponse> {
  try {
    const bciSession = generateMockBCIData(5);
    const metrics = getLatestMetrics(bciSession);

    const messages = [
      { role: 'system' as const, content: "You are a mindfulness meditation guide. Adapt guidance based on real-time brain activity." },
      { role: 'user' as const, content: `Generate meditation guidance for state: ${action.parameters.state}. Metrics - Focus: ${action.parameters.bciMetrics.focus}, Stress: ${action.parameters.bciMetrics.stress}, Cognitive Load: ${action.parameters.bciMetrics.cognitive_load}` }
    ];

    try {
      const response = await callOpenAI(messages);
      if (!response?.choices?.[0]?.message?.content) {
        throw new Error('Invalid OpenAI response structure');
      }
      return {
        state: action.parameters.state,
        currentStep: action.parameters.currentStep || 0,
        guidance: response.choices[0].message.content,
        adaptedForMetrics: true,
        timestamp: Date.now()
      };
    } catch (error) {
      console.warn('OpenAI API error, using mock response:', error);
      return {
        state: action.parameters.state,
        currentStep: action.parameters.currentStep || 0,
        guidance: `Focus on your breath. Your current focus level is ${action.parameters.bciMetrics.focus}%. Try to maintain steady breathing.`,
        adaptedForMetrics: true,
        timestamp: Date.now()
      };
    }
  } catch (error) {
    console.error('Error in mindfulness meditation handler:', error);
    throw new Error('Failed to process meditation action');
  }
}

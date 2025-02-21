import { generateMockBCIData, getLatestMetrics } from '../mock/bciData.js';
import { DataAnalysisAction, DataAnalysisResponse } from '../schemas/dataAnalysisSchema.js';
import { callOpenAI } from '../utils/openai.js';
import { BCIDataPoint } from '../types/bci.js';

export async function handleDataAnalysisAction(action: DataAnalysisAction): Promise<DataAnalysisResponse> {
  try {
    const bciSession = generateMockBCIData(60); // Generate 1 minute of data
    const metrics = getLatestMetrics(bciSession);

    // Generate mock data points
    const data = bciSession.data.map((point: BCIDataPoint) => ({
      timestamp: point.timestamp,
      value: point.metrics[action.parameters.dataset === 'focus' ? 'focus' : 
        action.parameters.dataset === 'stress' ? 'stress' : 
        'cognitive_load']
    }));

    const messages = [
      { role: 'system' as const, content: "You are a BCI data analysis assistant. Analyze data based on the specified reading level." },
      { role: 'user' as const, content: `Analyze this brain activity data for ${action.parameters.dataset} at ${action.parameters.readingLevel} level.` }
    ];

    try {
      const response = await callOpenAI(messages);
      return {
        data,
        analysis: response.choices[0].message?.content || "Could not generate analysis.",
        readingLevel: action.parameters.readingLevel
      };
    } catch (error) {
      console.warn('OpenAI API error, using mock response:', error);
      return {
        data,
        analysis: `Analysis of ${action.parameters.dataset} data shows trends in brain activity. Focus levels averaged at ${action.parameters.bciMetrics.focus}%, with stress at ${action.parameters.bciMetrics.stress}%.`,
        readingLevel: action.parameters.readingLevel
      };
    }
  } catch (error) {
    console.error('Error in data analysis handler:', error);
    throw new Error('Failed to process data analysis action');
  }
}

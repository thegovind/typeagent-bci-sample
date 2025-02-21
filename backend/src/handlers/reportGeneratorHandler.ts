import { generateMockBCIData, getLatestMetrics } from '../mock/bciData.js';
import { ReportGeneratorAction, ReportResponse } from '../schemas/reportGeneratorSchema.js';
import { callOpenAI } from '../utils/openai.js';

export async function handleReportGeneratorAction(action: ReportGeneratorAction): Promise<ReportResponse> {
  try {
    const bciSession = generateMockBCIData(30);
    const metrics = getLatestMetrics(bciSession);

    const messages = [
      { role: 'system' as const, content: "You are a BCI report generator. Generate reports based on brain activity and adapt to the specified reading level." },
      { role: 'user' as const, content: `Generate a brain activity report at ${action.parameters.readingLevel} reading level. Metrics - Focus: ${action.parameters.bciMetrics.focus}, Stress: ${action.parameters.bciMetrics.stress}, Cognitive Load: ${action.parameters.bciMetrics.cognitive_load}` }
    ];

    try {
      const response = await callOpenAI(messages);
      if (!response?.choices?.[0]?.message?.content) {
        throw new Error('Invalid OpenAI response structure');
      }
      return {
        content: response.choices[0].message.content,
        readingLevel: action.parameters.readingLevel,
        timestamp: Date.now(),
        metrics
      };
    } catch (error) {
      console.warn('OpenAI API error, using mock response:', error);
      return {
        content: `Brain activity report (${action.parameters.readingLevel} level): Focus at ${action.parameters.bciMetrics.focus}%, stress at ${action.parameters.bciMetrics.stress}%, cognitive load at ${action.parameters.bciMetrics.cognitive_load}%.`,
        readingLevel: action.parameters.readingLevel,
        timestamp: Date.now(),
        metrics
      };
    }
  } catch (error) {
    console.error('Error in report generator handler:', error);
    throw new Error('Failed to generate report');
  }
}

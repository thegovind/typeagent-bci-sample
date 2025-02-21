/**
 * Report Generator Handler Module
 * Generates comprehensive reports about brain activity based on BCI metrics.
 * This handler creates readable and informative reports at different comprehension levels,
 * making brain activity data accessible to users with varying levels of expertise.
 */

import { generateMockBCIData, getLatestMetrics } from '../mock/bciData.js';
import { ReportGeneratorAction, ReportResponse } from '../schemas/reportGeneratorSchema.js';
import { callOpenAI } from '../utils/openai.js';

/**
 * Handles report generation requests for BCI session data
 * 
 * @param action - The report generation action containing report parameters
 * @param action.parameters.readingLevel - Target comprehension level for the report
 * @param action.parameters.bciMetrics - Brain activity measurements to report on
 * @param action.parameters.bciMetrics.focus - Focus level measurement (0-100)
 * @param action.parameters.bciMetrics.stress - Stress level measurement (0-100)
 * @param action.parameters.bciMetrics.cognitive_load - Cognitive load measurement (0-100)
 * 
 * @returns ReportResponse containing the generated report and metadata
 * @throws Error if report generation fails
 */
export async function handleReportGeneratorAction(action: ReportGeneratorAction): Promise<ReportResponse> {
  try {
    // Generate sample BCI data for the report (30 seconds)
    const bciSession = generateMockBCIData(30);
    const metrics = getLatestMetrics(bciSession);

    // Prepare conversation context for report generation
    const messages = [
      { 
        role: 'system' as const, 
        content: "You are a BCI report generator. Generate reports based on brain activity and adapt to the specified reading level." 
      },
      { 
        role: 'user' as const, 
        content: `Generate a brain activity report at ${action.parameters.readingLevel} reading level. ` +
                `Metrics - Focus: ${action.parameters.bciMetrics.focus}, ` +
                `Stress: ${action.parameters.bciMetrics.stress}, ` +
                `Cognitive Load: ${action.parameters.bciMetrics.cognitive_load}` 
      }
    ];

    try {
      // Generate personalized report using OpenAI
      const response = await callOpenAI(messages);
      if (!response?.choices?.[0]?.message?.content) {
        throw new Error('Invalid OpenAI response structure');
      }

      // Return successful response with report and metadata
      return {
        content: response.choices[0].message.content,
        readingLevel: action.parameters.readingLevel,
        timestamp: Date.now(),
        metrics
      };
    } catch (error) {
      // Fallback to basic report if OpenAI call fails
      console.warn('OpenAI API error, using mock response:', error);
      return {
        content: `Brain activity report (${action.parameters.readingLevel} level): ` +
                `Focus at ${action.parameters.bciMetrics.focus}%, ` +
                `stress at ${action.parameters.bciMetrics.stress}%, ` +
                `cognitive load at ${action.parameters.bciMetrics.cognitive_load}%.`,
        readingLevel: action.parameters.readingLevel,
        timestamp: Date.now(),
        metrics
      };
    }
  } catch (error) {
    // Log and propagate any processing errors
    console.error('Error in report generator handler:', error);
    throw new Error('Failed to generate report');
  }
}

/**
 * Data Analysis Handler Module
 * Processes and analyzes BCI data streams to provide insights about brain activity patterns.
 * This handler generates, processes, and interprets brain-computer interface data,
 * providing analysis at different reading levels for better accessibility.
 */

import { generateMockBCIData, getLatestMetrics } from '../mock/bciData.js';
import { DataAnalysisAction, DataAnalysisResponse } from '../schemas/dataAnalysisSchema.js';
import { callOpenAI } from '../utils/openai.js';
import { BCIDataPoint } from '../types/bci.js';

/**
 * Handles data analysis requests for BCI metrics
 * 
 * @param action - The data analysis action containing analysis parameters
 * @param action.parameters.dataset - Type of data to analyze ('focus', 'stress', or 'cognitive_load')
 * @param action.parameters.readingLevel - Desired complexity level of the analysis
 * @param action.parameters.bciMetrics - Current BCI metrics for context
 * 
 * @returns DataAnalysisResponse containing processed data points and analysis
 * @throws Error if data processing or analysis fails
 */
export async function handleDataAnalysisAction(action: DataAnalysisAction): Promise<DataAnalysisResponse> {
  try {
    // Generate mock BCI session data (1 minute duration)
    const bciSession = generateMockBCIData(60);
    const metrics = getLatestMetrics(bciSession);

    // Extract and transform relevant data points based on requested dataset
    const data = bciSession.data.map((point: BCIDataPoint) => ({
      timestamp: point.timestamp,
      value: point.metrics[
        action.parameters.dataset === 'focus' ? 'focus' : 
        action.parameters.dataset === 'stress' ? 'stress' : 
        'cognitive_load'
      ]
    }));

    // Prepare conversation context for analysis generation
    const messages = [
      { 
        role: 'system' as const, 
        content: "You are a BCI data analysis assistant. Analyze data based on the specified reading level." 
      },
      { 
        role: 'user' as const, 
        content: `Analyze this brain activity data for ${action.parameters.dataset} at ${action.parameters.readingLevel} level.` 
      }
    ];

    try {
      // Generate analysis using OpenAI
      const response = await callOpenAI(messages);
      return {
        data,
        analysis: response.choices[0].message?.content || "Could not generate analysis.",
        readingLevel: action.parameters.readingLevel
      };
    } catch (error) {
      // Fallback to mock analysis if OpenAI call fails
      console.warn('OpenAI API error, using mock response:', error);
      return {
        data,
        analysis: `Analysis of ${action.parameters.dataset} data shows trends in brain activity. ` +
                 `Focus levels averaged at ${action.parameters.bciMetrics.focus}%, ` +
                 `with stress at ${action.parameters.bciMetrics.stress}%.`,
        readingLevel: action.parameters.readingLevel
      };
    }
  } catch (error) {
    // Log and propagate any processing errors
    console.error('Error in data analysis handler:', error);
    throw new Error('Failed to process data analysis action');
  }
}

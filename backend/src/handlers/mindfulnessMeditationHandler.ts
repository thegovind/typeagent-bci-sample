/**
 * Mindfulness Meditation Handler Module
 * Provides real-time meditation guidance based on BCI metrics and user state.
 * This handler adapts meditation instructions based on the user's current brain activity,
 * offering personalized mindfulness experiences for optimal meditation practice.
 */

import { generateMockBCIData, getLatestMetrics } from '../mock/bciData.js';
import { MindfulnessMeditationAction, MeditationResponse } from '../schemas/mindfulnessMeditationSchema.js';
import { callOpenAI } from '../utils/openai.js';

/**
 * Handles mindfulness meditation sessions with BCI feedback
 * 
 * @param action - The meditation action containing session parameters
 * @param action.parameters.state - Current meditation state/phase
 * @param action.parameters.currentStep - Current step in the meditation sequence (optional)
 * @param action.parameters.bciMetrics - Real-time brain activity measurements
 * @param action.parameters.bciMetrics.focus - Current focus level (0-100)
 * @param action.parameters.bciMetrics.stress - Current stress level (0-100)
 * @param action.parameters.bciMetrics.cognitive_load - Current cognitive load level (0-100)
 * 
 * @returns MeditationResponse containing adapted guidance and session metadata
 * @throws Error if guidance generation fails
 */
export async function handleMindfulnessMeditationAction(action: MindfulnessMeditationAction): Promise<MeditationResponse> {
  try {
    // Generate sample BCI data for the meditation session (5 seconds)
    const bciSession = generateMockBCIData(5);
    const metrics = getLatestMetrics(bciSession);

    // Prepare conversation context for guidance generation
    const messages = [
      { 
        role: 'system' as const, 
        content: "You are a mindfulness meditation guide. Adapt guidance based on real-time brain activity." 
      },
      { 
        role: 'user' as const, 
        content: `Generate meditation guidance for state: ${action.parameters.state}. ` +
                `Metrics - Focus: ${action.parameters.bciMetrics.focus}, ` +
                `Stress: ${action.parameters.bciMetrics.stress}, ` +
                `Cognitive Load: ${action.parameters.bciMetrics.cognitive_load}` 
      }
    ];

    try {
      // Generate personalized meditation guidance using OpenAI
      const response = await callOpenAI(messages);
      if (!response?.choices?.[0]?.message?.content) {
        throw new Error('Invalid OpenAI response structure');
      }

      // Return successful response with guidance and metadata
      return {
        state: action.parameters.state,
        currentStep: action.parameters.currentStep || 0,
        guidance: response.choices[0].message.content,
        adaptedForMetrics: true,
        timestamp: Date.now()
      };
    } catch (error) {
      // Fallback to basic guidance if OpenAI call fails
      console.warn('OpenAI API error, using mock response:', error);
      return {
        state: action.parameters.state,
        currentStep: action.parameters.currentStep || 0,
        guidance: `Focus on your breath. Your current focus level is ${action.parameters.bciMetrics.focus}%. ` +
                 `Try to maintain steady breathing.`,
        adaptedForMetrics: true,
        timestamp: Date.now()
      };
    }
  } catch (error) {
    // Log and propagate any processing errors
    console.error('Error in mindfulness meditation handler:', error);
    throw new Error('Failed to process meditation action');
  }
}

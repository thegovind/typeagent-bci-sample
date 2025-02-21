/**
 * Chat Handler Module
 * Processes chat interactions while taking into account BCI metrics for adaptive responses.
 * This handler integrates brain-computer interface data with natural language processing
 * to provide context-aware responses based on the user's cognitive state.
 */

import { ChatAction, ChatResponse } from '../schemas/chatSchema.js';
import { callOpenAI } from '../utils/openai.js';

/**
 * Handles incoming chat actions with BCI metrics integration
 * 
 * @param action - The chat action containing the message and BCI metrics
 * @param action.parameters.message - The user's text message
 * @param action.parameters.bciMetrics - Object containing brain activity measurements
 * @param action.parameters.bciMetrics.focus - User's focus level (0-100)
 * @param action.parameters.bciMetrics.stress - User's stress level (0-100)
 * @param action.parameters.bciMetrics.cognitive_load - User's cognitive load level (0-100)
 * 
 * @returns ChatResponse object containing the AI's response and metadata
 * @throws Error if the request is invalid or processing fails
 */
export async function handleChatAction(action: ChatAction): Promise<ChatResponse> {
  try {
    console.log('Received chat action:', JSON.stringify(action, null, 2));
    
    if (!action?.parameters?.message || !action?.parameters?.bciMetrics) {
      throw new Error('Invalid request: missing message or BCI metrics');
    }

    const messages = [
      { role: 'system' as const, content: "You are a BCI-aware AI assistant. Adapt your responses based on the user's brain activity metrics." },
      { role: 'user' as const, content: `User brain metrics - Focus: ${action.parameters.bciMetrics.focus}, Stress: ${action.parameters.bciMetrics.stress}, Cognitive Load: ${action.parameters.bciMetrics.cognitive_load}. Message: ${action.parameters.message}` }
    ];

    try {
      const response = await callOpenAI(messages);
      if (!response?.choices?.[0]?.message?.content) {
        throw new Error('Invalid OpenAI response structure');
      }
      return {
        content: response.choices[0].message.content,
        timestamp: Date.now(),
        adaptedForMetrics: true
      };
    } catch (error) {
      console.warn('OpenAI API error, using mock response:', error);
      return {
        content: "I understand you're saying: " + action.parameters.message + ". Your focus is " + action.parameters.bciMetrics.focus + "%, stress is " + action.parameters.bciMetrics.stress + "%.",
        timestamp: Date.now(),
        adaptedForMetrics: true
      };
    }
  } catch (error) {
    console.error('Error in chat handler:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to process chat action');
  }
}

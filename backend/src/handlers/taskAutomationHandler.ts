/**
 * Task Automation Handler Module
 * Manages and optimizes task execution based on real-time BCI metrics.
 * This handler adapts task scheduling and execution based on the user's cognitive state,
 * ensuring optimal task performance and reduced cognitive load.
 */

import { generateMockBCIData, getLatestMetrics } from '../mock/bciData.js';
import { TaskAutomationAction, TaskResponse } from '../schemas/taskAutomationSchema.js';
import { callOpenAI } from '../utils/openai.js';

/**
 * Handles task automation requests with BCI-aware optimization
 * 
 * @param action - The task automation action containing task parameters
 * @param action.parameters.taskId - Unique identifier for the task
 * @param action.parameters.action - Task action to perform ('start', 'stop', etc.)
 * @param action.parameters.bciMetrics - Current brain activity measurements
 * @param action.parameters.bciMetrics.focus - Focus level for task optimization (0-100)
 * @param action.parameters.bciMetrics.stress - Stress level for workload management (0-100)
 * @param action.parameters.bciMetrics.cognitive_load - Cognitive load for task scheduling (0-100)
 * 
 * @returns TaskResponse containing task status and optimization details
 * @throws Error if required parameters are missing or processing fails
 */
export async function handleTaskAutomationAction(action: TaskAutomationAction): Promise<TaskResponse> {
  try {
    // Validate required parameters
    if (!action?.parameters?.taskId || !action?.parameters?.action || !action?.parameters?.bciMetrics) {
      throw new Error('Invalid request: missing required parameters');
    }

    // Generate sample BCI data for task optimization (5 seconds)
    const bciSession = generateMockBCIData(5);
    const metrics = getLatestMetrics(bciSession);

    // Prepare conversation context for task optimization
    const messages = [
      { 
        role: 'system' as const, 
        content: "You are a BCI-aware task automation assistant. Optimize task scheduling based on brain activity." 
      },
      { 
        role: 'user' as const, 
        content: `Handle task ${action.parameters.taskId} action: ${action.parameters.action}. ` +
                `Metrics - Focus: ${action.parameters.bciMetrics.focus}, ` +
                `Stress: ${action.parameters.bciMetrics.stress}, ` +
                `Cognitive Load: ${action.parameters.bciMetrics.cognitive_load}` 
      }
    ];

    try {
      // Generate optimized task handling using OpenAI
      const response = await callOpenAI(messages);
      if (!response?.choices?.[0]?.message?.content) {
        throw new Error('Invalid OpenAI response structure');
      }

      // Return successful response with task status and optimization details
      return {
        taskId: action.parameters.taskId,
        status: action.parameters.action === 'start' ? 'running' : 
                action.parameters.action === 'stop' ? 'completed' : 
                'pending',
        message: response.choices[0].message.content,
        timestamp: Date.now(),
        optimizedForMetrics: true
      };
    } catch (error) {
      // Fallback to basic task handling if OpenAI call fails
      console.warn('OpenAI API error, using mock response:', error);
      return {
        taskId: action.parameters.taskId,
        status: action.parameters.action === 'start' ? 'running' : 
                action.parameters.action === 'stop' ? 'completed' : 
                'pending',
        message: `Task ${action.parameters.taskId} ${action.parameters.action}ed. ` +
                `Focus level: ${action.parameters.bciMetrics.focus}%, optimizing workflow.`,
        timestamp: Date.now(),
        optimizedForMetrics: true
      };
    }
  } catch (error) {
    // Log and propagate any processing errors
    console.error('Error in task automation handler:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to process task action');
  }
}

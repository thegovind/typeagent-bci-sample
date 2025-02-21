import { generateMockBCIData, getLatestMetrics } from '../mock/bciData.js';
import { TaskAutomationAction, TaskResponse } from '../schemas/taskAutomationSchema.js';
import { callOpenAI } from '../utils/openai.js';

export async function handleTaskAutomationAction(action: TaskAutomationAction): Promise<TaskResponse> {
  try {
    if (!action?.parameters?.taskId || !action?.parameters?.action || !action?.parameters?.bciMetrics) {
      throw new Error('Invalid request: missing required parameters');
    }

    const bciSession = generateMockBCIData(5);
    const metrics = getLatestMetrics(bciSession);

    const messages = [
      { role: 'system' as const, content: "You are a BCI-aware task automation assistant. Optimize task scheduling based on brain activity." },
      { role: 'user' as const, content: `Handle task ${action.parameters.taskId} action: ${action.parameters.action}. Metrics - Focus: ${action.parameters.bciMetrics.focus}, Stress: ${action.parameters.bciMetrics.stress}, Cognitive Load: ${action.parameters.bciMetrics.cognitive_load}` }
    ];

    try {
      const response = await callOpenAI(messages);
      if (!response?.choices?.[0]?.message?.content) {
        throw new Error('Invalid OpenAI response structure');
      }
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
      console.warn('OpenAI API error, using mock response:', error);
      return {
        taskId: action.parameters.taskId,
        status: action.parameters.action === 'start' ? 'running' : 
                action.parameters.action === 'stop' ? 'completed' : 
                'pending',
        message: `Task ${action.parameters.taskId} ${action.parameters.action}ed. Focus level: ${action.parameters.bciMetrics.focus}%, optimizing workflow.`,
        timestamp: Date.now(),
        optimizedForMetrics: true
      };
    }
  } catch (error) {
    console.error('Error in task automation handler:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to process task action');
  }
}

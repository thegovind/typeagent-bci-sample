/**
 * Chat Interface Schema Definitions
 * Defines the structure of chat interactions between the user and the BCI-aware AI system.
 * These schemas ensure type safety and proper data structure for chat functionality.
 */

/**
 * Represents a chat action request from the client
 * 
 * @property actionName - Always "generateResponse" for chat actions
 * @property parameters - Container for chat request parameters
 * @property parameters.message - The user's text message to process
 * @property parameters.bciMetrics - Current brain activity measurements
 * @property parameters.bciMetrics.focus - User's focus level (0-100)
 * @property parameters.bciMetrics.stress - User's stress level (0-100)
 * @property parameters.bciMetrics.cognitive_load - User's cognitive load level (0-100)
 */
export interface ChatAction {
  actionName: "generateResponse";
  parameters: {
    message: string;
    bciMetrics: {
      focus: number;      // Focus/attention level
      stress: number;     // Stress/anxiety level
      cognitive_load: number; // Mental workload level
    };
  };
}

/**
 * Represents the AI system's response to a chat action
 * 
 * @property content - The AI-generated response text
 * @property timestamp - Unix timestamp of the response (milliseconds)
 * @property adaptedForMetrics - Whether the response was adapted based on BCI metrics
 */
export interface ChatResponse {
  content: string;
  timestamp: number;
  adaptedForMetrics: boolean;
}

/**
 * Mindfulness Meditation Schema Definitions
 * Defines the structure for BCI-enhanced meditation session management.
 * These schemas support real-time meditation guidance that adapts based on
 * the user's brain activity measurements and current meditation state.
 */

/**
 * Possible states of a meditation session
 * Tracks the progression of a meditation session from start to completion
 * 
 * @value inactive - Session not started or terminated
 * @value starting - Initial preparation phase
 * @value in_progress - Active meditation ongoing
 * @value paused - Temporarily suspended
 * @value completed - Session finished successfully
 */
export type MeditationState = "inactive" | "starting" | "in_progress" | "paused" | "completed";

/**
 * Represents a meditation session action request
 * 
 * @property actionName - Always "updateMeditation" for meditation actions
 * @property parameters - Container for meditation session parameters
 * @property parameters.state - Current or target meditation state
 * @property parameters.currentStep - Progress indicator in guided sequences (optional)
 * @property parameters.bciMetrics - Real-time brain activity measurements
 * @property parameters.bciMetrics.focus - Current focus/attention level (0-100)
 * @property parameters.bciMetrics.stress - Current stress/relaxation level (0-100)
 * @property parameters.bciMetrics.cognitive_load - Current mental activity level (0-100)
 */
export interface MindfulnessMeditationAction {
  actionName: "updateMeditation";
  parameters: {
    state: MeditationState;
    currentStep?: number;
    bciMetrics: {
      focus: number;      // Focus/attention level
      stress: number;     // Stress/relaxation level
      cognitive_load: number; // Mental activity level
    };
  };
}

/**
 * Represents the meditation system's response with guidance
 * 
 * @property state - Current state of the meditation session
 * @property currentStep - Current position in guided sequence
 * @property guidance - Personalized meditation instructions
 * @property adaptedForMetrics - Whether guidance was customized based on BCI data
 * @property timestamp - Time of guidance generation (milliseconds)
 */
export interface MeditationResponse {
  state: MeditationState;
  currentStep: number;
  guidance: string;
  adaptedForMetrics: boolean;
  timestamp: number;
}

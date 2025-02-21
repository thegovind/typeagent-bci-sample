/**
 * Task Automation Schema Definitions
 * Defines the structure for BCI-aware task management and automation.
 * These schemas support intelligent task scheduling and execution
 * based on the user's current cognitive state and brain activity metrics.
 */

/**
 * Possible states of an automated task
 * Tracks the lifecycle of a task from creation to completion
 * 
 * @value pending - Task created but not yet started
 * @value running - Task currently executing
 * @value completed - Task finished successfully
 * @value failed - Task encountered an error
 */
export type TaskStatus = "pending" | "running" | "completed" | "failed";

/**
 * Represents a task automation request
 * 
 * @property actionName - Always "manageTask" for task actions
 * @property parameters - Container for task management parameters
 * @property parameters.taskId - Unique identifier for the task
 * @property parameters.action - Task lifecycle action to perform
 * @property parameters.action - Can be 'start', 'pause', 'resume', or 'stop'
 * @property parameters.bciMetrics - Current brain activity measurements
 * @property parameters.bciMetrics.focus - Focus level for task optimization (0-100)
 * @property parameters.bciMetrics.stress - Stress level for workload management (0-100)
 * @property parameters.bciMetrics.cognitive_load - Mental load for scheduling (0-100)
 */
export interface TaskAutomationAction {
  actionName: "manageTask";
  parameters: {
    taskId: string;
    action: "start" | "pause" | "resume" | "stop";
    bciMetrics: {
      focus: number;      // Focus/attention level
      stress: number;     // Stress/workload level
      cognitive_load: number; // Mental capacity level
    };
  };
}

/**
 * Represents the task automation system's response
 * 
 * @property taskId - Identifier of the affected task
 * @property status - Current state of the task
 * @property message - Human-readable status or guidance
 * @property timestamp - Time of status update (milliseconds)
 * @property optimizedForMetrics - Whether execution was adapted for BCI metrics
 */
export interface TaskResponse {
  taskId: string;
  status: TaskStatus;
  message: string;
  timestamp: number;
  optimizedForMetrics: boolean;
}

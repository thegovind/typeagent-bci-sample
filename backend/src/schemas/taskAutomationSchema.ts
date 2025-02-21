export type TaskStatus = "pending" | "running" | "completed" | "failed";

export interface TaskAutomationAction {
  actionName: "manageTask";
  parameters: {
    taskId: string;
    action: "start" | "pause" | "resume" | "stop";
    bciMetrics: {
      focus: number;
      stress: number;
      cognitive_load: number;
    };
  };
}

export interface TaskResponse {
  taskId: string;
  status: TaskStatus;
  message: string;
  timestamp: number;
  optimizedForMetrics: boolean;
}

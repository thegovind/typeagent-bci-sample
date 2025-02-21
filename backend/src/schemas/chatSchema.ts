export interface ChatAction {
  actionName: "generateResponse";
  parameters: {
    message: string;
    bciMetrics: {
      focus: number;
      stress: number;
      cognitive_load: number;
    };
  };
}

export interface ChatResponse {
  content: string;
  timestamp: number;
  adaptedForMetrics: boolean;
}

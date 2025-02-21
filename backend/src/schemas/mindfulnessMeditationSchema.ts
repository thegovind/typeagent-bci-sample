export type MeditationState = "inactive" | "starting" | "in_progress" | "paused" | "completed";

export interface MindfulnessMeditationAction {
  actionName: "updateMeditation";
  parameters: {
    state: MeditationState;
    currentStep?: number;
    bciMetrics: {
      focus: number;
      stress: number;
      cognitive_load: number;
    };
  };
}

export interface MeditationResponse {
  state: MeditationState;
  currentStep: number;
  guidance: string;
  adaptedForMetrics: boolean;
  timestamp: number;
}

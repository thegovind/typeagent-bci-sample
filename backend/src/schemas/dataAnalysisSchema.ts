export type ReadingLevel = "eli5" | "eli15" | "high-school" | "college" | "phd";
export type Dataset = "productivity" | "focus" | "stress" | "learning";

export interface DataAnalysisAction {
  actionName: "analyzeData";
  parameters: {
    dataset: Dataset;
    readingLevel: ReadingLevel;
    timeRange: {
      start: number;
      end: number;
    };
    bciMetrics: {
      focus: number;
      stress: number;
      cognitive_load: number;
    };
  };
}

export interface DataAnalysisResponse {
  data: Array<{
    timestamp: number;
    value: number;
  }>;
  analysis: string;
  readingLevel: ReadingLevel;
}

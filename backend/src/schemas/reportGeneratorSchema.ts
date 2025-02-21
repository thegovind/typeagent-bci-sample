export type ReadingLevel = "eli5" | "eli15" | "high-school" | "college" | "phd";

export interface ReportGeneratorAction {
  actionName: "generateReport";
  parameters: {
    readingLevel: ReadingLevel;
    bciMetrics: {
      focus: number;
      stress: number;
      cognitive_load: number;
    };
  };
}

export interface ReportResponse {
  content: string;
  readingLevel: ReadingLevel;
  timestamp: number;
  metrics: {
    focus: number;
    stress: number;
    cognitive_load: number;
  };
}

/**
 * Report Generator Schema Definitions
 * Defines the structure for generating comprehensive BCI activity reports.
 * These schemas support the creation of detailed brain activity reports
 * at different reading levels to accommodate various user backgrounds.
 */

/**
 * Supported reading/comprehension levels for report content
 * Ranges from simple explanations to technical scientific descriptions
 * 
 * @value eli5 - Explain Like I'm 5 (very simple terms)
 * @value eli15 - Explain Like I'm 15 (teen-appropriate)
 * @value high-school - High school level understanding
 * @value college - Undergraduate level detail
 * @value phd - Advanced scientific/technical detail
 */
export type ReadingLevel = "eli5" | "eli15" | "high-school" | "college" | "phd";

/**
 * Represents a report generation request
 * 
 * @property actionName - Always "generateReport" for report actions
 * @property parameters - Container for report generation parameters
 * @property parameters.readingLevel - Target comprehension level
 * @property parameters.bciMetrics - Brain activity measurements to report on
 * @property parameters.bciMetrics.focus - Focus level measurement (0-100)
 * @property parameters.bciMetrics.stress - Stress level measurement (0-100)
 * @property parameters.bciMetrics.cognitive_load - Cognitive load measurement (0-100)
 */
export interface ReportGeneratorAction {
  actionName: "generateReport";
  parameters: {
    readingLevel: ReadingLevel;
    bciMetrics: {
      focus: number;      // Focus/attention level
      stress: number;     // Stress/anxiety level
      cognitive_load: number; // Mental workload level
    };
  };
}

/**
 * Represents the generated report response
 * 
 * @property content - The generated report text
 * @property readingLevel - Comprehension level of the report
 * @property timestamp - Time of report generation (milliseconds)
 * @property metrics - Brain activity metrics included in report
 * @property metrics.focus - Focus level included in report (0-100)
 * @property metrics.stress - Stress level included in report (0-100)
 * @property metrics.cognitive_load - Cognitive load included in report (0-100)
 */
export interface ReportResponse {
  content: string;
  readingLevel: ReadingLevel;
  timestamp: number;
  metrics: {
    focus: number;      // Focus/attention level
    stress: number;     // Stress/anxiety level
    cognitive_load: number; // Mental workload level
  };
}

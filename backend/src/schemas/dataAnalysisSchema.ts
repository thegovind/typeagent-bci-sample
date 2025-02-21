/**
 * Data Analysis Schema Definitions
 * Defines the structure for BCI data analysis requests and responses.
 * These schemas support analysis of brain activity data at different comprehension levels,
 * making the insights accessible to users with varying levels of expertise.
 */

/**
 * Supported reading/comprehension levels for analysis output
 * Ranges from simple explanations to technical scientific descriptions
 */
export type ReadingLevel = "eli5" | "eli15" | "high-school" | "college" | "phd";

/**
 * Types of datasets that can be analyzed
 * Each dataset focuses on a different aspect of brain activity and performance
 */
export type Dataset = "productivity" | "focus" | "stress" | "learning";

/**
 * Represents a data analysis request from the client
 * 
 * @property actionName - Always "analyzeData" for analysis actions
 * @property parameters - Container for analysis request parameters
 * @property parameters.dataset - Type of data to analyze
 * @property parameters.readingLevel - Target comprehension level for the analysis
 * @property parameters.timeRange - Time window for data analysis
 * @property parameters.timeRange.start - Start timestamp (milliseconds)
 * @property parameters.timeRange.end - End timestamp (milliseconds)
 * @property parameters.bciMetrics - Current brain activity measurements
 * @property parameters.bciMetrics.focus - Focus level (0-100)
 * @property parameters.bciMetrics.stress - Stress level (0-100)
 * @property parameters.bciMetrics.cognitive_load - Cognitive load level (0-100)
 */
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
      focus: number;      // Focus/attention level
      stress: number;     // Stress/anxiety level
      cognitive_load: number; // Mental workload level
    };
  };
}

/**
 * Represents the analysis results and insights
 * 
 * @property data - Array of processed data points for visualization
 * @property data[].timestamp - Time of measurement (milliseconds)
 * @property data[].value - Measured value for the selected dataset
 * @property analysis - Natural language analysis of the data
 * @property readingLevel - Comprehension level of the provided analysis
 */
export interface DataAnalysisResponse {
  data: Array<{
    timestamp: number;
    value: number;
  }>;
  analysis: string;
  readingLevel: ReadingLevel;
}

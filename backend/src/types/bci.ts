/**
 * Brain-Computer Interface (BCI) Type Definitions
 * Contains type definitions for BCI data structures used throughout the application.
 * These types represent the core data model for brain activity measurements and sessions.
 */

/**
 * Represents a single data point from BCI measurements
 * 
 * @property timestamp - Unix timestamp of the measurement (milliseconds)
 * @property channels - Raw channel data from BCI device, keyed by channel name
 * @property metrics - Processed metrics derived from raw channel data
 * @property metrics.focus - User's focus level (0-100)
 * @property metrics.stress - User's stress level (0-100)
 * @property metrics.cognitive_load - User's cognitive load level (0-100)
 */
export interface BCIDataPoint {
  timestamp: number;
  channels: {
    [key: string]: number;  // Raw channel values
  };
  metrics: {
    focus: number;         // Focus/attention level
    stress: number;        // Stress/anxiety level
    cognitive_load: number; // Mental workload level
  };
}

/**
 * Represents a complete BCI measurement session
 * 
 * @property id - Unique identifier for the session
 * @property startTime - Unix timestamp when session started (milliseconds)
 * @property endTime - Unix timestamp when session ended (milliseconds, optional)
 * @property data - Array of data points collected during the session
 */
export interface BCISession {
  id: string;
  startTime: number;
  endTime?: number;
  data: BCIDataPoint[];
}

export interface BCIDataPoint {
  timestamp: number;
  channels: {
    [key: string]: number;
  };
  metrics: {
    focus: number;
    stress: number;
    cognitive_load: number;
  };
}

export interface BCISession {
  id: string;
  startTime: number;
  endTime?: number;
  data: BCIDataPoint[];
}

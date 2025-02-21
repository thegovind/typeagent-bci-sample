import { BCIDataPoint, BCISession } from '../types/bci.js';

export function generateMockBCIData(duration: number = 60): BCISession {
  const startTime = Date.now();
  const data: BCIDataPoint[] = [];
  
  for (let i = 0; i < duration; i++) {
    data.push({
      timestamp: startTime + (i * 1000),
      channels: {
        'C3': Math.random(),
        'C4': Math.random(),
        'F3': Math.random(),
        'F4': Math.random()
      },
      metrics: {
        focus: Math.random() * 100,
        stress: Math.random() * 100,
        cognitive_load: Math.random() * 100
      }
    });
  }

  return {
    id: crypto.randomUUID(),
    startTime,
    data
  };
}

// Helper function to get the latest metrics from a session
export function getLatestMetrics(session: BCISession): BCIDataPoint['metrics'] {
  const lastDataPoint = session.data[session.data.length - 1];
  return lastDataPoint?.metrics || {
    focus: 0,
    stress: 0,
    cognitive_load: 0
  };
}

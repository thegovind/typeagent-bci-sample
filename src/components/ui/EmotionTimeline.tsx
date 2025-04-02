import React, { useMemo } from 'react';
import EmotionAvatar, { EmotionState } from './EmotionAvatar';

interface TimePoint {
  timestamp: string;
  flowValue: number;
  heartRateValue: number;
}

interface EmotionTimelineProps {
  timePoints: TimePoint[];
  width?: number;
}

const determineEmotion = (flowValue: number, heartRateValue: number): EmotionState => {
  // Logic to determine emotion based on flow and heart rate values
  if (flowValue > 80) {
    return heartRateValue > 85 ? "focused" : "happy";
  } else if (flowValue < 40) {
    return heartRateValue > 80 ? "stressed" : "sad";
  } else if (heartRateValue > 85) {
    return "surprised";
  }
  return "neutral";
};

const formatTime = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (e) {
    console.error("Invalid date string:", dateString);
    return "Invalid time";
  }
};

const formatHour = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      hour12: true
    });
  } catch (e) {
    console.error("Invalid date string:", dateString);
    return "Invalid hour";
  }
};

// Normalize date to the hour
const normalizeToHour = (date: Date): string => {
  const normalized = new Date(date);
  normalized.setMinutes(0, 0, 0);
  return normalized.toISOString();
};

// Function to validate date strings
const isValidDateString = (dateString: string): boolean => {
  if (!dateString) return false;
  
  try {
    const date = new Date(dateString);
    // Check if the date is valid and not too far in the past or future
    return !isNaN(date.getTime()) && 
           date.getFullYear() >= 2000 &&
           date.getFullYear() <= new Date().getFullYear() + 1;
  } catch (e) {
    return false;
  }
};

const EmotionTimeline: React.FC<EmotionTimelineProps> = ({ 
  timePoints, 
  width = 700
}) => {
  // Early validation of input data
  if (!timePoints || !Array.isArray(timePoints) || timePoints.length === 0) {
    console.log("EmotionTimeline: No timeline data available");
    return <div className="text-center text-sm text-muted-foreground">No timeline data available</div>;
  }

  // Do all the data processing in useMemo to optimize performance and avoid re-calculations
  const { validHours, hourlyData, hasAnyValidData, hourStats } = useMemo(() => {
    console.log(`EmotionTimeline: Starting to process ${timePoints.length} data points`);
    
    // Helper function to check if a data point is valid and has meaningful values
    const isValidDataPoint = (point: TimePoint): boolean => {
      if (!point) return false;
      
      // Ensure timestamp is valid
      if (!isValidDateString(point.timestamp)) {
        console.log(`EmotionTimeline: Skipping point with invalid timestamp: ${point.timestamp}`);
        return false;
      }
      
      // Check if values are meaningful (not zero or very close to zero)
      const MIN_FLOW_VALUE = 5;   // Minimum threshold for flow value
      const MIN_HEART_RATE = 40;  // Minimum threshold for heart rate
      const MAX_FLOW_VALUE = 150; // Maximum realistic flow value
      const MAX_HEART_RATE = 200; // Maximum realistic heart rate
      
      // Check for default values that indicate no real data
      const DEFAULT_FLOW_VALUE = 50;
      const DEFAULT_HEART_RATE = 75;
      
      // Reject data points with exactly the default values, as these are likely placeholder data
      if (point.flowValue === DEFAULT_FLOW_VALUE && point.heartRateValue === DEFAULT_HEART_RATE) {
        console.log(`EmotionTimeline: Rejecting point with default values: flow=${point.flowValue}, heart=${point.heartRateValue}`);
        return false;
      }
      
      // Also reject if only one value is exactly at the default
      if (point.flowValue === DEFAULT_FLOW_VALUE) {
        console.log(`EmotionTimeline: Rejecting point with default flow value=${point.flowValue}`);
        return false;
      }
      
      if (point.heartRateValue === DEFAULT_HEART_RATE) {
        console.log(`EmotionTimeline: Rejecting point with default heart rate=${point.heartRateValue}`);
        return false;
      }
      
      // Validate flow value is within realistic range
      if (typeof point.flowValue !== 'number' || 
          isNaN(point.flowValue) || 
          point.flowValue < MIN_FLOW_VALUE || 
          point.flowValue > MAX_FLOW_VALUE) {
        console.log(`EmotionTimeline: Invalid flow value: ${point.flowValue}`);
        return false;
      }
      
      // Validate heart rate is within realistic range
      if (typeof point.heartRateValue !== 'number' || 
          isNaN(point.heartRateValue) || 
          point.heartRateValue < MIN_HEART_RATE || 
          point.heartRateValue > MAX_HEART_RATE) {
        console.log(`EmotionTimeline: Invalid heart rate value: ${point.heartRateValue}`);
        return false;
      }
      
      return true;
    };
    
    // Pre-process and validate all time points
    const validPoints: TimePoint[] = [];
    
    // Log all data points for debugging
    timePoints.forEach((point, index) => {
      console.log(`EmotionTimeline: Point ${index}: timestamp=${point.timestamp}, flow=${point.flowValue}, heart=${point.heartRateValue}`);
      
      if (isValidDataPoint(point)) {
        validPoints.push(point);
      }
    });
    
    console.log(`EmotionTimeline: Filtered to ${validPoints.length} valid points`);
    
    // Group valid timepoints by hour
    const hourlyGroups: Record<string, TimePoint[]> = {};
    
    // Track stats for hours to log
    const hourlyStats: Record<string, { total: number, valid: number }> = {};
    
    validPoints.forEach(point => {
      try {
        const date = new Date(point.timestamp);
        const hourKey = normalizeToHour(date);
        
        // Initialize hourly stats if needed
        if (!hourlyStats[hourKey]) {
          hourlyStats[hourKey] = { total: 0, valid: 0 };
        }
        
        // Count this as a valid point
        hourlyStats[hourKey].valid++;
        hourlyStats[hourKey].total++;
        
        // Add to hourly groups for rendering
        if (!hourlyGroups[hourKey]) {
          hourlyGroups[hourKey] = [];
        }
        
        hourlyGroups[hourKey].push(point);
      } catch (e) {
        console.error("Error processing point:", point, e);
      }
    });
    
    // Get sorted list of hours that have valid data
    const sortedHours = Object.keys(hourlyGroups).sort();
    
    console.log(`EmotionTimeline: Found ${sortedHours.length} hours with valid data`);
    sortedHours.forEach(hour => {
      console.log(`EmotionTimeline: Hour ${formatHour(hour)} has ${hourlyGroups[hour].length} valid points`);
    });
    
    return {
      validHours: sortedHours,
      hourlyData: hourlyGroups,
      hasAnyValidData: sortedHours.length > 0,
      hourStats: hourlyStats
    };
  }, [timePoints]);
  
  // Calculate the appropriate avatar size based on the container width
  const avatarSize = Math.min(45, Math.floor((width - 100) / 12)); // 12 columns for 5-minute intervals per hour
  
  // If no valid hours found, display message
  if (!hasAnyValidData) {
    console.log("EmotionTimeline: No valid timeline data found");
    return <div className="text-center text-sm text-muted-foreground">No valid timeline data available</div>;
  }
  
  return (
    <div className="w-full overflow-auto pb-2 border rounded-md bg-accent/5">
      <div className="flex flex-col space-y-1 p-3">
        <h4 className="text-sm font-medium mb-3">
          Emotional Timeline (5-minute intervals) - {validHours.length} hours with data
        </h4>
        
        {/* Column headers showing 5-minute increments */}
        <div className="flex pl-20 mb-2">
          {Array(12).fill(0).map((_, i) => (
            <div 
              key={`header-${i}`} 
              className="text-xs text-center text-muted-foreground font-medium"
              style={{ width: `${avatarSize}px` }}
            >
              :{i * 5 < 10 ? `0${i * 5}` : i * 5}
            </div>
          ))}
        </div>
        
        {/* Timeline grid rows - only for hours with data */}
        <div className="space-y-1">
          {validHours.map(hourKey => {
            const pointsInHour = hourlyData[hourKey];
            
            // Create a map to place timepoints in their corresponding 5-minute slots
            const slotMap: Record<number, TimePoint> = {};
            
            pointsInHour.forEach(point => {
              try {
                const date = new Date(point.timestamp);
                const minutes = date.getMinutes();
                const slotIndex = Math.floor(minutes / 5);
                
                if (slotIndex >= 0 && slotIndex < 12) {
                  slotMap[slotIndex] = point;
                }
              } catch (e) {
                console.error("Error mapping point to slot:", point, e);
              }
            });
            
            // Log slots with data for debugging
            let slotsWithData = 0;
            for (let i = 0; i < 12; i++) {
              if (slotMap[i]) slotsWithData++;
            }
            console.log(`EmotionTimeline: Hour ${formatHour(hourKey)} has data in ${slotsWithData}/12 slots`);
            
            return (
              <div key={hourKey} className="flex items-center hover:bg-background py-1 px-2 rounded transition-colors">
                {/* Hour label */}
                <div className="w-20 font-medium text-sm pr-3 text-right">
                  {formatHour(hourKey)}
                </div>
                
                {/* 5-minute interval slots */}
                <div className="flex">
                  {Array(12).fill(0).map((_, slotIndex) => {
                    const point = slotMap[slotIndex];
                    
                    return (
                      <div 
                        key={`slot-${slotIndex}`}
                        className={`flex justify-center items-center ${slotIndex % 2 === 0 ? 'bg-accent/5' : ''} rounded-sm`}
                        style={{ width: `${avatarSize}px`, height: `${avatarSize}px` }}
                      >
                        {point ? (
                          <div className="flex flex-col items-center justify-center">
                            <EmotionAvatar
                              flowIntensity={point.flowValue}
                              heartRate={point.heartRateValue}
                              emotion={determineEmotion(point.flowValue, point.heartRateValue)}
                              width={avatarSize - 5}
                              height={avatarSize - 5}
                              showLabel={false}
                            />
                          </div>
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-gray-200"></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="flex justify-between mt-3 pt-2 border-t border-border/30">
          <p className="text-xs text-muted-foreground italic">
            Emotional state progression throughout the day based on flow and heart rate data
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Legend:</span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-gray-200"></div>
              <span className="text-xs text-muted-foreground">No data</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmotionTimeline; 
import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * EmotionTimelineBar - A component that visualizes emotions as RGB color values
 * - Red channel represents frustration (0-255)
 * - Green channel represents excitement (0-255)
 * - Blue channel represents calmness (0-255)
 */

export interface EmotionData {
  timestamp: Date;
  flowValue: number;
  frustratedValue: number;
  excitedValue: number;
  calmValue: number;
}

interface EmotionTimelineBarProps {
  flowIntensity?: number;
  heartRate?: number;
  frustratedValue?: number;
  excitedValue?: number;
  calmValue?: number;
  className?: string;
  width?: number;
  height?: number;
  showLabels?: boolean;
  historySize?: number;
  updateInterval?: number;
}

const EmotionTimelineBar: React.FC<EmotionTimelineBarProps> = ({
  flowIntensity = 50,
  heartRate = 75,
  frustratedValue = 40, 
  excitedValue = 60,
  calmValue = 50,
  className,
  width = 240,
  height = 80,
  showLabels = true,
  historySize = 10,
  updateInterval = 3000
}) => {
  const [emotionHistory, setEmotionHistory] = useState<EmotionData[]>([]);
  const lastValuesRef = useRef({
    flowIntensity,
    frustratedValue,
    excitedValue,
    calmValue
  });
  
  // Calculate normalized RGB values (0-255) from emotion indicators (0-100)
  const normalizeValue = (value: number): number => {
    return Math.min(255, Math.max(0, Math.round((value / 100) * 255)));
  };
  
  // Calculate RGB color based on emotion values
  const calculateRgbColor = (frustrated: number, excited: number, calm: number): string => {
    const redValue = normalizeValue(frustrated);
    const greenValue = normalizeValue(excited);
    const blueValue = normalizeValue(calm);
    
    return `rgb(${redValue}, ${greenValue}, ${blueValue})`;
  };
  
  // Calculate brightness of a color for determining text contrast
  const getBrightness = (r: number, g: number, b: number): number => {
    return (r * 299 + g * 587 + b * 114) / 1000;
  };
  
  // Track emotion data history using a circular buffer
  useEffect(() => {
    // Check if the values have changed
    if (
      lastValuesRef.current.flowIntensity !== flowIntensity ||
      lastValuesRef.current.frustratedValue !== frustratedValue ||
      lastValuesRef.current.excitedValue !== excitedValue ||
      lastValuesRef.current.calmValue !== calmValue
    ) {
      // Update our ref with the new values
      lastValuesRef.current = {
        flowIntensity,
        frustratedValue,
        excitedValue,
        calmValue
      };
      
      // Add the new data point to our history
      setEmotionHistory(prevHistory => {
        const newHistory = [...prevHistory];
        
        // Add new data point
        newHistory.push({
          timestamp: new Date(),
          flowValue: flowIntensity,
          frustratedValue,
          excitedValue,
          calmValue
        });
        
        // Keep only the last N items (circular buffer behavior)
        if (newHistory.length > historySize) {
          return newHistory.slice(newHistory.length - historySize);
        }
        
        return newHistory;
      });
    }
    
    // Initialize with empty circular buffer on first render
    if (emotionHistory.length === 0) {
      const initialData: EmotionData = {
        timestamp: new Date(),
        flowValue: flowIntensity,
        frustratedValue,
        excitedValue,
        calmValue
      };
      setEmotionHistory([initialData]);
    }
    
    // Set up update interval
    const interval = setInterval(() => {
      // Only add a new data point if the values have changed
      if (
        lastValuesRef.current.flowIntensity !== flowIntensity ||
        lastValuesRef.current.frustratedValue !== frustratedValue ||
        lastValuesRef.current.excitedValue !== excitedValue ||
        lastValuesRef.current.calmValue !== calmValue
      ) {
        lastValuesRef.current = {
          flowIntensity,
          frustratedValue,
          excitedValue,
          calmValue
        };
        
        setEmotionHistory(prevHistory => {
          const newHistory = [...prevHistory];
          
          newHistory.push({
            timestamp: new Date(),
            flowValue: flowIntensity,
            frustratedValue,
            excitedValue,
            calmValue
          });
          
          if (newHistory.length > historySize) {
            return newHistory.slice(newHistory.length - historySize);
          }
          
          return newHistory;
        });
      }
    }, updateInterval);
    
    return () => clearInterval(interval);
  }, [flowIntensity, frustratedValue, excitedValue, calmValue, historySize, updateInterval]);
  
  // Calculate current RGB values
  const currentRedValue = normalizeValue(frustratedValue);
  const currentGreenValue = normalizeValue(excitedValue);
  const currentBlueValue = normalizeValue(calmValue);
  const currentColor = calculateRgbColor(frustratedValue, excitedValue, calmValue);
  
  // Determine if we need light or dark text
  const brightness = getBrightness(currentRedValue, currentGreenValue, currentBlueValue);
  const textColor = brightness > 128 ? 'text-gray-800' : 'text-white';
  
  // Calculate bar width based on number of data points
  const barWidth = 100 / historySize;
  
  return (
    <div className={cn("w-full space-y-2", className)} style={{ width }}>
      {showLabels && (
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: currentColor }}
            />
          </div>
          <div className="text-xs text-muted-foreground">
            Last {historySize} values
          </div>
        </div>
      )}
      
      <div 
        className="w-full bg-sidebar-background/30 rounded-md overflow-hidden relative"
        style={{ height }}
      >
        {emotionHistory.map((data, index) => {
          const color = calculateRgbColor(
            data.frustratedValue,
            data.excitedValue,
            data.calmValue
          );
          
          return (
            <motion.div
              key={index}
              className="absolute bottom-0"
              style={{
                left: `${index * barWidth}%`,
                width: `${barWidth}%`,
                height: `${data.flowValue}%`,
                backgroundColor: color,
                maxHeight: '100%'
              }}
              initial={{ height: 0 }}
              animate={{ height: `${data.flowValue}%` }}
              transition={{ duration: 0.3 }}
            />
          );
        })}
      </div>
      
      {showLabels && (
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div 
            className={cn("p-2 rounded flex flex-col items-center justify-center", textColor)} 
            style={{ backgroundColor: currentColor }}
          >
            <div className="font-medium">{Math.round(frustratedValue)}%</div>
            <div className="text-[10px] opacity-80">Frustration</div>
          </div>
          <div 
            className={cn("p-2 rounded flex flex-col items-center justify-center", textColor)} 
            style={{ backgroundColor: currentColor }}
          >
            <div className="font-medium">{Math.round(excitedValue)}%</div>
            <div className="text-[10px] opacity-80">Excitement</div>
          </div>
          <div 
            className={cn("p-2 rounded flex flex-col items-center justify-center", textColor)} 
            style={{ backgroundColor: currentColor }}
          >
            <div className="font-medium">{Math.round(calmValue)}%</div>
            <div className="text-[10px] opacity-80">Calmness</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmotionTimelineBar; 
import { useRef, useEffect } from "react";

interface TimePoint {
  timestamp: string;
  flowValue: number;
  heartRateValue: number;
}

interface DayGradientProps {
  timePoints: TimePoint[];
  width?: number;
  height?: number;
  showTimeLabels?: boolean;
}

// Helper functions to calculate emotion values
const getFrustration = (flow: number, heart: number): number => {
  if (flow < 40 && heart > 80) return 85;
  if (flow < 60 && heart > 70) return 60;
  return Math.max(0, Math.min(100, 100 - flow + (heart - 70)));
};

const getExcitement = (flow: number, heart: number): number => {
  if (flow > 80 && heart > 75) return 85;
  if (flow > 60 && heart > 65) return 60;
  return Math.max(0, Math.min(100, flow * 0.8 + (heart - 60) * 0.4));
};

const getCalm = (flow: number, heart: number): number => {
  if (flow > 40 && flow < 80 && heart < 70) return 85;
  if (heart < 75) return 60;
  return Math.max(0, Math.min(100, 100 - (heart - 50)));
};

/**
 * DayGradient - A component that visualizes a day's emotional data as a gradient
 * Uses the same RGB color mapping as EmotionRange: 
 * - Red represents frustration
 * - Green represents excitement
 * - Blue represents calm
 */
const DayGradient: React.FC<DayGradientProps> = ({ 
  timePoints,
  width = 300,
  height = 60,
  showTimeLabels = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Filter out invalid points and sort timePoints by timestamp
  const sortedTimePoints = [...timePoints]
    .filter(point => point.flowValue > 0 && point.heartRateValue > 0)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || sortedTimePoints.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate time range of the data
    const startTime = new Date(sortedTimePoints[0].timestamp);
    const endTime = new Date(sortedTimePoints[sortedTimePoints.length - 1].timestamp);
    const timeRange = endTime.getTime() - startTime.getTime();

    // If no meaningful time range, don't proceed
    if (timeRange <= 0) return;

    // Create gradient for the data range only
    const gradientWidth = canvas.width;
    const gradient = ctx.createLinearGradient(0, 0, gradientWidth, 0);

    // Calculate actual gradient positions based on time relative to data bounds
    // This ensures the gradient only covers the exact time span with data
    sortedTimePoints.forEach(point => {
      const pointTime = new Date(point.timestamp).getTime();
      const position = (pointTime - startTime.getTime()) / timeRange;
      
      // Calculate RGB values based on emotion indicators
      const frustration = getFrustration(point.flowValue, point.heartRateValue);
      const excitement = getExcitement(point.flowValue, point.heartRateValue);
      const calm = getCalm(point.flowValue, point.heartRateValue);

      // Normalize to 0-1 for RGB
      const r = Math.min(255, Math.max(0, Math.round((frustration / 100) * 255)));
      const g = Math.min(255, Math.max(0, Math.round((excitement / 100) * 255)));
      const b = Math.min(255, Math.max(0, Math.round((calm / 100) * 255)));

      // Add color stop at exact normalized position
      gradient.addColorStop(position, `rgb(${r}, ${g}, ${b})`);
    });

    // Draw background
    ctx.fillStyle = '#f8f8f8';
    ctx.fillRect(0, 0, canvas.width, height - (showTimeLabels ? 20 : 0));

    // Fill with the gradient in the content area
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, gradientWidth, height - (showTimeLabels ? 20 : 0));

    // Add time labels if requested
    if (showTimeLabels) {
      // Draw time labels
      ctx.fillStyle = '#666';
      ctx.font = '10px sans-serif';
      
      // Start time label
      ctx.textAlign = 'left';
      ctx.fillText(formatTime(startTime.toISOString()), 2, height - 6);
      
      // End time label
      ctx.textAlign = 'right';
      ctx.fillText(formatTime(endTime.toISOString()), canvas.width - 2, height - 6);
      
      // Draw time markers line
      ctx.strokeStyle = '#ddd';
      ctx.beginPath();
      ctx.moveTo(0, height - 15);
      ctx.lineTo(canvas.width, height - 15);
      ctx.stroke();
      
      // Add middle marker
      ctx.textAlign = 'center';
      const middleTime = new Date(startTime.getTime() + timeRange / 2);
      ctx.fillText(formatTime(middleTime.toISOString()), canvas.width / 2, height - 6);
      
      // Draw tick marks at time boundaries
      ctx.strokeStyle = '#ddd';
      [0, 0.25, 0.5, 0.75, 1].forEach(pos => {
        const x = Math.floor(pos * gradientWidth);
        ctx.beginPath();
        ctx.moveTo(x, height - 15);
        ctx.lineTo(x, height - 12);
        ctx.stroke();
      });
    }
    
    // Add border
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, canvas.width, height - (showTimeLabels ? 20 : 0));
  }, [sortedTimePoints, width, height, showTimeLabels]);

  // Format time for labels
  const formatTime = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return "Invalid time";
    }
  };

  // If no valid data points, don't render the component
  if (sortedTimePoints.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col items-center">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="rounded-md"
      />
    </div>
  );
};

export default DayGradient; 
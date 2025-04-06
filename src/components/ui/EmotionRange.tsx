import { useRef, useEffect } from "react";

interface EmotionRangeProps {
  frustratedIndicatorValue?: number;
  excitedIndicatorValue?: number;
  calmIndicatorValue?: number;
  width?: number;
  height?: number;
  showLabel?: boolean;
  customDescription?: string;
  
  // Also support the same props as EmotionAvatar for compatibility
  flowIntensity?: number;
  heartRate?: number;
  flowStats?: any;
  heartRateStats?: any;
  correlation?: number;
}

/**
 * EmotionRange - A component that visualizes emotions as RGB color values
 * - Red channel represents frustration (0-255)
 * - Green channel represents excitement (0-255)
 * - Blue channel represents calmness (0-255)
 */
const EmotionRange = ({
  frustratedIndicatorValue,
  excitedIndicatorValue,
  calmIndicatorValue,
  width = 150,
  height = 150,
  showLabel = true,
  customDescription
}: EmotionRangeProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Calculate normalized RGB values (0-255) from emotion indicators (0-100)
  const normalizeValue = (value: number | undefined): number => {
    if (value === undefined) return 0;
    return Math.min(255, Math.max(0, Math.round((value / 100) * 255)));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate RGB values
    const redValue = normalizeValue(frustratedIndicatorValue);
    const greenValue = normalizeValue(excitedIndicatorValue);
    const blueValue = normalizeValue(calmIndicatorValue);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fill with the emotion color
    ctx.fillStyle = `rgb(${redValue}, ${greenValue}, ${blueValue})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add a subtle border
    ctx.strokeStyle = '#FFFFFF30';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);

    // Add text overlay showing RGB values if showLabel is true
    if (showLabel) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      
      // Determine text color for better contrast
      const brightness = (redValue * 299 + greenValue * 587 + blueValue * 114) / 1000;
      ctx.fillStyle = brightness > 125 ? '#000000' : '#FFFFFF';
      
      if (customDescription) {
        ctx.fillText(customDescription, canvas.width / 2, canvas.height / 2);
      } else {
        ctx.fillText(`R:${redValue} G:${greenValue} B:${blueValue}`, canvas.width / 2, canvas.height / 2);
      }
    }
  }, [frustratedIndicatorValue, excitedIndicatorValue, calmIndicatorValue, width, height, showLabel, customDescription]);

  return (
    <div className="flex flex-col items-center">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="rounded-md shadow-sm"
      />
      {showLabel && !customDescription && (
        <div className="mt-1 text-xs text-center text-muted-foreground">
          {frustratedIndicatorValue ? `Frustration: ${Math.round(frustratedIndicatorValue)}%` : ''} 
          {excitedIndicatorValue ? ` Excitement: ${Math.round(excitedIndicatorValue)}%` : ''}
          {calmIndicatorValue ? ` Calm: ${Math.round(calmIndicatorValue)}%` : ''}
        </div>
      )}
    </div>
  );
};

export default EmotionRange; 
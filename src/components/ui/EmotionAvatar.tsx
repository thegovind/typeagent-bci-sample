import { useState, useEffect, useRef, useCallback } from "react";

// Emotion avatar properties types
export type EmotionState = "happy" | "sad" | "surprised" | "neutral" | "focused" | "stressed";

interface FlowStats {
  average: number;
  peak: number;
  low: number;
  stability: number;
  peakTime: string;
  lowTime: string;
  deviation: number;
  outliers: { value: number; time: string }[];
}

interface HeartRateStats {
  average: number;
  peak: number;
  low: number;
  stability: number;
  peakTime: string;
  lowTime: string;
  deviation: number;
  outliers: { value: number; time: string }[];
}

interface EmotionAvatarProps {
  // Direct inputs
  flowIntensity?: number;
  heartRate?: number;
  emotion?: EmotionState;
  width?: number;
  height?: number;
  showLabel?: boolean;
  customDescription?: string;
  
  // Analysis mode inputs
  flowStats?: FlowStats;
  heartRateStats?: HeartRateStats;
  correlation?: number;
}

// Character emotion states definitions
const emotionProperties = {
  happy: { color: "#85C1E9", eyeSize: 18, mouthType: "smile", bodyBounce: 3 },
  sad: { color: "#5BA5F5", eyeSize: 16, mouthType: "smallFrown", bodyBounce: -2 },
  surprised: { color: "#B266FF", eyeSize: 20, mouthType: "o", bodyBounce: 4 },
  neutral: { color: "#7DCFB6", eyeSize: 18, mouthType: "smallSmile", bodyBounce: 1 },
  focused: { color: "#58D68D", eyeSize: 18, mouthType: "smile", bodyBounce: 2 },
  stressed: { color: "#EC7063", eyeSize: 16, mouthType: "smallFrown", bodyBounce: -1 }
};

// Emotion descriptions for different states
const emotionDescriptions = {
  happy: "Current state: Happy flow",
  sad: "Current state: Taking a break?",
  surprised: "Current state: Curious",
  neutral: "Current state: Calm & Ready",
  focused: "Current state: In the zone",
  stressed: "Current state: Need a pause"
};

/**
 * EmotionAvatar - A reusable avatar component that represents emotional state
 * Can be driven by flowIntensity & heartRate data, or directly by setting an emotion
 */
const EmotionAvatar = ({ 
  flowIntensity, 
  heartRate = 75,
  emotion,
  width = 150,
  height = 150,
  showLabel = true,
  customDescription,
  flowStats,
  heartRateStats,
  correlation
}: EmotionAvatarProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  
  // State for animation
  const [currentEmotion, setCurrentEmotion] = useState<EmotionState>("neutral");
  const [emotionDescription, setEmotionDescription] = useState(emotionDescriptions.neutral);
  
  // Draw the avatar - called in a useEffect
  const drawAvatar = useCallback(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas with transparent background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Determine current properties based on emotion
    const props = emotionProperties[currentEmotion];
    const bounce = props.bodyBounce;
    
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    
    // Scale factor for larger avatar
    const scale = width / 250;
    
    // Adjust vertical position to center the face
    const verticalPos = height / 2 - 10;
    
    // Draw character
    // Head (Round face)
    ctx.fillStyle = props.color;
    ctx.strokeStyle = "#1E1E1E";
    ctx.lineWidth = 4 * scale;
    ctx.beginPath();
    ctx.arc(centerX, verticalPos + bounce, 70 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Eyes
    ctx.fillStyle = "#1E1E1E";
    ctx.beginPath();
    ctx.arc(centerX - 20 * scale, verticalPos - 10 * scale + bounce, props.eyeSize * scale / 2, 0, Math.PI * 2);
    ctx.arc(centerX + 20 * scale, verticalPos - 10 * scale + bounce, props.eyeSize * scale / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Eye Highlights
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(centerX - 15 * scale, verticalPos - 15 * scale + bounce, 4 * scale, 0, Math.PI * 2);
    ctx.arc(centerX + 25 * scale, verticalPos - 15 * scale + bounce, 4 * scale, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyebrows
    ctx.strokeStyle = "#1E1E1E";
    ctx.lineWidth = 1.5 * scale;
    ctx.beginPath();
    
    if (props.mouthType === "frown" || props.mouthType === "smallFrown") {
      // Gentler eyebrows for sad/stress
      ctx.moveTo(centerX - 25 * scale, verticalPos - 35 * scale + bounce);
      ctx.lineTo(centerX - 10 * scale, verticalPos - 34 * scale + bounce);
      ctx.moveTo(centerX + 25 * scale, verticalPos - 35 * scale + bounce);
      ctx.lineTo(centerX + 10 * scale, verticalPos - 34 * scale + bounce);
    } else if (props.mouthType === "o") {
      // Slightly raised eyebrows
      ctx.moveTo(centerX - 25 * scale, verticalPos - 38 * scale + bounce);
      ctx.lineTo(centerX - 10 * scale, verticalPos - 39 * scale + bounce);
      ctx.moveTo(centerX + 25 * scale, verticalPos - 38 * scale + bounce);
      ctx.lineTo(centerX + 10 * scale, verticalPos - 39 * scale + bounce);
    } else if (props.mouthType === "smile" || props.mouthType === "smallSmile") {
      // Gentle upward curve for happy/focused/neutral
      ctx.moveTo(centerX - 25 * scale, verticalPos - 36 * scale + bounce);
      ctx.lineTo(centerX - 10 * scale, verticalPos - 38 * scale + bounce);
      ctx.moveTo(centerX + 25 * scale, verticalPos - 36 * scale + bounce);
      ctx.lineTo(centerX + 10 * scale, verticalPos - 38 * scale + bounce);
    } else {
      // Default neutral eyebrows
      ctx.moveTo(centerX - 25 * scale, verticalPos - 37 * scale + bounce);
      ctx.lineTo(centerX - 10 * scale, verticalPos - 37 * scale + bounce);
      ctx.moveTo(centerX + 25 * scale, verticalPos - 37 * scale + bounce);
      ctx.lineTo(centerX + 10 * scale, verticalPos - 37 * scale + bounce);
    }
    ctx.stroke();
    
    // Mouth
    ctx.strokeStyle = "#1E1E1E";
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    
    if (props.mouthType === "smile") {
      ctx.arc(centerX, verticalPos + 20 * scale + bounce, 18 * scale, 0, Math.PI, false);
    } else if (props.mouthType === "smallSmile") {
      // Smaller, more subtle smile for neutral state
      ctx.arc(centerX, verticalPos + 20 * scale + bounce, 12 * scale, 0, Math.PI, false);
    } else if (props.mouthType === "frown") {
      // Full frown
      ctx.arc(centerX, verticalPos + 30 * scale + bounce, 15 * scale, Math.PI, 0, false);
    } else if (props.mouthType === "smallFrown") {
      // Smaller, gentler frown
      ctx.arc(centerX, verticalPos + 25 * scale + bounce, 10 * scale, Math.PI, 0, false);
    } else if (props.mouthType === "o") {
      ctx.arc(centerX, verticalPos + 20 * scale + bounce, 10 * scale, 0, Math.PI * 2);
    } else {
      // Neutral mouth (slight curve)
      ctx.moveTo(centerX - 15 * scale, verticalPos + 20 * scale + bounce);
      ctx.quadraticCurveTo(centerX, verticalPos + 22 * scale + bounce, centerX + 15 * scale, verticalPos + 20 * scale + bounce);
    }
    ctx.stroke();
    
    // Blush (Cheeks)
    ctx.fillStyle = "#E57373";
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.arc(centerX - 30 * scale, verticalPos + 10 * scale + bounce, 12 * scale, 0, Math.PI * 2);
    ctx.arc(centerX + 30 * scale, verticalPos + 10 * scale + bounce, 12 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    
    animationRef.current = requestAnimationFrame(drawAvatar);
  }, [currentEmotion]);
  
  // Process data and update emotional state - only if no direct emotion is provided
  useEffect(() => {
    // If a direct emotion is provided, use that instead of calculating from flow/heart
    if (emotion) {
      setCurrentEmotion(emotion);
      setEmotionDescription(customDescription || emotionDescriptions[emotion]);
      return;
    }
    
    // Check if we're in analysis mode (using stats objects)
    if (flowStats && heartRateStats) {
      // Analysis mode processing
      let newEmotion: EmotionState = "neutral";
      let description = "Balanced mental state";
      
      if (flowStats.average > 70 && heartRateStats.stability > 60) {
        newEmotion = "focused";
        description = "Deep focus and stable heart rate";
      } else if (flowStats.average > 60) {
        newEmotion = "happy";
        description = "Positive flow state";
      } else if (flowStats.average < 30 && heartRateStats.average > 90) {
        newEmotion = "sad";
        description = "Signs of stress detected";
      } else if (flowStats.stability < 35 || heartRateStats.stability < 35) {
        newEmotion = "surprised";
        description = "Variable mental state";
      } else if (correlation && correlation < -0.7) {
        newEmotion = "stressed";
        description = "Negative correlation between flow and heart rate";
      }
      
      setCurrentEmotion(newEmotion);
      setEmotionDescription(customDescription || description);
      return;
    }
    
    // Only proceed with calculation if flowIntensity is provided (real-time mode)
    if (typeof flowIntensity === 'undefined') return;
    
    // Determine emotion based on flow intensity value
    let newEmotion: EmotionState = "neutral";
    let description = emotionDescriptions.neutral;
    
    if (flowIntensity > 65) {
      newEmotion = "focused";
      description = emotionDescriptions.focused;
    } else if (flowIntensity > 55) {
      newEmotion = "happy";
      description = emotionDescriptions.happy;
    } else if (flowIntensity < 25 && heartRate > 95) {
      newEmotion = "sad";
      description = emotionDescriptions.sad;
    } else if (flowIntensity > 40 && flowIntensity < 55) {
      newEmotion = "surprised";
      description = emotionDescriptions.surprised;
    }
    
    setCurrentEmotion(newEmotion);
    setEmotionDescription(customDescription || description);
  }, [flowIntensity, heartRate, emotion, customDescription, flowStats, heartRateStats, correlation]);
  
  // Set up animation loop
  useEffect(() => {
    animationRef.current = requestAnimationFrame(drawAvatar);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [drawAvatar]);
  
  return (
    <div className="flex flex-col items-center space-y-2">
      {showLabel && (
        <h4 className="text-sm font-medium text-muted-foreground mb-1">
          Emotional State
        </h4>
      )}
      <canvas 
        ref={canvasRef}
        width={width}
        height={height}
        className="border border-sidebar-border rounded-md"
      />
      {showLabel && (
        <p className="text-xs text-center text-muted-foreground">
          {emotionDescription}
        </p>
      )}
    </div>
  );
};

export default EmotionAvatar; 
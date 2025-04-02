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
  happy: { color: "#85C1E9", eyeSize: 18, mouthType: "smile", bodyBounce: 3, background: "sunny" },
  sad: { color: "#5BA5F5", eyeSize: 16, mouthType: "smallFrown", bodyBounce: -2, background: "cloudy" },
  surprised: { color: "#B266FF", eyeSize: 20, mouthType: "o", bodyBounce: 4, background: "clear" },
  neutral: { color: "#7DCFB6", eyeSize: 18, mouthType: "smallSmile", bodyBounce: 1, background: "clear" },
  focused: { color: "#58D68D", eyeSize: 18, mouthType: "smile", bodyBounce: 2, background: "sunny" },
  stressed: { color: "#EC7063", eyeSize: 16, mouthType: "smallFrown", bodyBounce: -1, background: "cloudy" }
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
  
  // Helper to draw a simple cloud shape
  const drawCloud = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    // Get flow value for cloud fluffiness and density
    const flowValue = typeof flowIntensity !== 'undefined' ? flowIntensity : 
                     (flowStats ? flowStats.average : 50);
    const flowNormalized = Math.min(Math.max(flowValue, 0), 100) / 100;
    
    // Cloud properties - fluffier with higher flow
    const radius = size / 3;
    const fluffiness = 0.8 + (flowNormalized * 0.4); // 0.8-1.2 range for bubble consistency
    
    // Time-based subtle movement for cloud
    const time = Date.now() / 5000; // Slow movement
    const driftX = Math.sin(time) * 2; // Slight horizontal drift
    const driftY = Math.cos(time) * 1; // Very slight vertical drift
    
    // Start a new path for each cloud to ensure proper fill
    ctx.beginPath();
    
    // Main cloud circle
    ctx.arc(x + driftX, y + driftY, radius, 0, Math.PI * 2);
    
    // Additional circles for the fluffy cloud shape
    ctx.arc(
      x + radius * fluffiness + driftX, 
      y - radius * 0.4 + driftY, 
      radius * 0.9 * fluffiness, 
      0, Math.PI * 2
    );
    ctx.arc(
      x + radius * 1.6 * fluffiness + driftX, 
      y + driftY, 
      radius * 1.2 * fluffiness, 
      0, Math.PI * 2
    );
    ctx.arc(
      x + radius * 0.5 * fluffiness + driftX, 
      y + radius * 0.4 + driftY, 
      radius * 0.7 * fluffiness, 
      0, Math.PI * 2
    );
    
    // Add more detail based on flow intensity
    if (flowNormalized > 0.5) {
      // Add extra puffs for more detailed clouds when flow is higher
      ctx.arc(
        x - radius * 0.5 * fluffiness + driftX, 
        y - radius * 0.3 + driftY, 
        radius * 0.6 * fluffiness, 
        0, Math.PI * 2
      );
      ctx.arc(
        x + radius * 2.1 * fluffiness + driftX, 
        y - radius * 0.2 + driftY, 
        radius * 0.5 * fluffiness, 
        0, Math.PI * 2
      );
    }
    
    ctx.fill();
  }, [flowIntensity, flowStats]);
  
  // Helper to draw raindrops
  const drawRaindrops = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, count: number) => {
    // Save current context state
    ctx.save();
    
    // Get heart rate value for raindrop size and dynamism
    const heartValue = heartRate || (heartRateStats ? heartRateStats.average : 75);
    const heartNormalized = Math.min(Math.max(heartValue, 50), 100) / 100;
    
    // Raindrop size increases with heart rate
    const dropSize = 3 + (heartNormalized * 3); // Size between 3-6 pixels
    
    // Raindrop color gets more intense blue with higher heart rate
    const blueIntensity = Math.round(180 + (heartNormalized * 60)); // 180-240 range
    ctx.fillStyle = `rgba(120, 160, ${blueIntensity}, 0.7)`;
    
    // Time-based animation offset (gives the raindrops a falling effect)
    const time = Date.now() / 1000;
    const speed = 1 + heartNormalized * 2; // Rain falls faster with higher heart rate
    
    for (let i = 0; i < count; i++) {
      // Position with some randomness
      const x = Math.random() * width;
      const yBase = Math.random() * height;
      
      // Calculate vertical position with time-based offset for animation
      // This creates an infinite falling effect - when drops go out of view they appear at the top
      const y = (yBase + (time * speed * 50)) % height;
      
      // Draw raindrop shape - more elongated with higher heart rate
      const stretch = 1 + heartNormalized;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(
        x - dropSize, y + dropSize * 2 * stretch,
        x + dropSize, y + dropSize * 2 * stretch,
        x, y + dropSize * 3 * stretch
      );
      ctx.fill();
      
      // Add tiny splash effect near bottom
      if (y > height * 0.7 && y < height * 0.9) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        ctx.beginPath();
        ctx.arc(x - dropSize, y + dropSize, dropSize / 2, 0, Math.PI * 2);
        ctx.arc(x + dropSize, y + dropSize, dropSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(120, 160, ${blueIntensity}, 0.7)`;
      }
    }
    
    // Restore context to previous state
    ctx.restore();
  }, [heartRate, heartRateStats]);
  
  // Helper function to draw different background environments
  const drawBackground = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, backgroundType: string) => {
    // No need to save/restore context or clear the canvas here since it's handled in drawAvatar
    
    // Create a gradient background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    
    // Get intensity values for dynamic background elements
    // Higher flow intensity = brighter sun/fewer clouds
    // Higher heart rate = more dynamic weather elements
    const flowValue = typeof flowIntensity !== 'undefined' ? flowIntensity : 
                      (flowStats ? flowStats.average : 50);
    const heartValue = heartRate || (heartRateStats ? heartRateStats.average : 75);
    
    // Normalize values between 0-1 for easier calculations
    const flowNormalized = Math.min(Math.max(flowValue, 0), 100) / 100;
    const heartNormalized = Math.min(Math.max(heartValue, 50), 100) / 100;
    
    switch (backgroundType) {
      case "sunny":
        // Sunny day - bright blue sky with sun
        // Flow intensity affects sky brightness
        const skyBlue = Math.round(135 + (flowNormalized * 40)); // 135-175 range
        bgGradient.addColorStop(0, `rgb(${skyBlue - 50}, ${skyBlue}, ${skyBlue + 35})`); // Sky blue, brighter with higher flow
        bgGradient.addColorStop(1, `rgb(${skyBlue}, ${skyBlue + 30}, ${skyBlue + 45})`); // Lighter blue
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, width, height);
        
        // Draw sun - size and brightness based on flow intensity
        const sunSize = width * (0.10 + (flowNormalized * 0.05)); // 10-15% of width
        const sunBrightness = 215 + Math.round(flowNormalized * 40); // 215-255 brightness
        
        // Sun gradient for more realistic effect
        const sunGradient = ctx.createRadialGradient(
          width * 0.8, height * 0.2, 0,
          width * 0.8, height * 0.2, sunSize
        );
        sunGradient.addColorStop(0, `rgb(${sunBrightness}, ${sunBrightness}, 50)`);
        sunGradient.addColorStop(1, `rgb(${sunBrightness - 30}, ${sunBrightness - 50}, 0)`);
        
        ctx.fillStyle = sunGradient;
        ctx.beginPath();
        ctx.arc(width * 0.8, height * 0.2, sunSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw rays around sun based on heart rate
        if (heartNormalized > 0.6) {
          const rayCount = Math.round(5 + (heartNormalized * 7)); // 5-12 rays
          ctx.strokeStyle = `rgba(${sunBrightness}, ${sunBrightness}, 100, 0.6)`;
          ctx.lineWidth = 2 + (heartNormalized * 2);
          
          for (let i = 0; i < rayCount; i++) {
            const angle = (i / rayCount) * Math.PI * 2;
            const rayLength = sunSize * (1 + (heartNormalized * 0.5));
            
            ctx.beginPath();
            ctx.moveTo(
              width * 0.8 + Math.cos(angle) * sunSize,
              height * 0.2 + Math.sin(angle) * sunSize
            );
            ctx.lineTo(
              width * 0.8 + Math.cos(angle) * (sunSize + rayLength),
              height * 0.2 + Math.sin(angle) * (sunSize + rayLength)
            );
            ctx.stroke();
          }
        }
        
        // Draw small clouds - fewer clouds with higher flow intensity
        const cloudCount = Math.round(3 - (flowNormalized * 2)); // 1-3 clouds
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        
        if (cloudCount > 0) {
          drawCloud(ctx, width * 0.2, height * 0.15, width * 0.15);
        }
        if (cloudCount > 1) {
          drawCloud(ctx, width * 0.5, height * 0.1, width * 0.12);
        }
        if (cloudCount > 2) {
          drawCloud(ctx, width * 0.7, height * 0.25, width * 0.1);
        }
        break;
        
      case "cloudy":
        // Cloudy/rainy day - grayish-blue sky with clouds
        // Lower flow intensity means darker clouds
        const grayLevel = Math.round(100 + (flowNormalized * 30)); // 100-130 range
        bgGradient.addColorStop(0, `rgb(${grayLevel}, ${grayLevel + 10}, ${grayLevel + 20})`); // Slate gray
        bgGradient.addColorStop(1, `rgb(${grayLevel + 30}, ${grayLevel + 40}, ${grayLevel + 50})`); // Lighter gray-blue
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, width, height);
        
        // Draw clouds - more clouds with lower flow intensity
        const bigCloudCount = Math.round(2 + ((1 - flowNormalized) * 2)); // 2-4 clouds
        const cloudDarkness = Math.round(200 + (flowNormalized * 30)); // Darker clouds with lower flow (200-230)
        ctx.fillStyle = `rgb(${cloudDarkness}, ${cloudDarkness}, ${cloudDarkness})`;
        
        // Draw big clouds
        drawCloud(ctx, width * 0.3, height * 0.2, width * (0.2 + ((1 - flowNormalized) * 0.1)));
        drawCloud(ctx, width * 0.7, height * 0.15, width * (0.15 + ((1 - flowNormalized) * 0.1)));
        
        if (bigCloudCount > 2) {
          drawCloud(ctx, width * 0.1, height * 0.3, width * 0.18);
        }
        if (bigCloudCount > 3) {
          drawCloud(ctx, width * 0.5, height * 0.25, width * 0.2);
        }
        
        // Draw raindrops - more rain with higher heart rate
        const rainCount = Math.round(5 + (heartNormalized * 15)); // 5-20 raindrops
        drawRaindrops(ctx, width, height, rainCount);
        break;
        
      case "clear":
      default:
        // Light gradient background - intensity based on flow
        const blueIntensity = Math.round(220 + (flowNormalized * 35)); // 220-255 range
        bgGradient.addColorStop(0, `rgb(230, ${blueIntensity}, 255)`); // Very light blue
        bgGradient.addColorStop(1, `rgb(240, ${blueIntensity}, 255)`); // Even lighter blue
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, width, height);
        
        // Add subtle clouds if heart rate is elevated
        if (heartNormalized > 0.7) {
          ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
          drawCloud(ctx, width * 0.8, height * 0.1, width * 0.1);
        }
        break;
    }
  }, [flowIntensity, heartRate, flowStats, heartRateStats]);
  
  // Draw the avatar - called in a useEffect
  const drawAvatar = useCallback(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Get canvas dimensions
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    
    // Scale factor for avatar
    const scale = width / 250;
    
    // Determine current properties based on emotion
    const props = emotionProperties[currentEmotion];
    const bounce = props.bodyBounce;
    
    // Adjust vertical position to center the face
    const verticalPos = height / 2 - 10;
    
    // Clear the entire canvas
    ctx.clearRect(0, 0, width, height);
    
    // 1. Draw background first
    const backgroundType = props.background || "clear";
    drawBackground(ctx, width, height, backgroundType);
    
    // 2. Draw the character on top of the background
    
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
    
    // Request next animation frame
    animationRef.current = requestAnimationFrame(drawAvatar);
  }, [currentEmotion, drawBackground, drawCloud, drawRaindrops]);
  
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
        className="border border-sidebar-border rounded-md bg-transparent"
        style={{ display: 'block' }}
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
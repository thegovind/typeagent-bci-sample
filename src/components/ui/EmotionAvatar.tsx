import { useState, useEffect, useRef, useCallback } from "react";

// Emotion avatar properties types
export type EmotionState = "happy" | "sad" | "surprised" | "neutral" | "focused" | "stressed" | "calm" | "anxious";

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

// Type for the emotion properties including optional jitter
type EmotionProperty = {
  color: string;
  eyeSize: number;
  eyeShape: string;
  mouthType: string;
  bodyBounce: number;
  background: string;
  jitter?: number;
};

interface EmotionAvatarProps {
  // Direct inputs
  flowIntensity?: number;
  heartRate?: number;
  emotion?: EmotionState;
  width?: number;
  height?: number;
  showLabel?: boolean;
  customDescription?: string;
  jitter?: number; // Optional jitter property // This seems redundant if emotionProperties has it? Keep for overrides?
  transitionDuration?: number; // Duration for emotion transitions in ms

  // New direct indicators (optional)
  frustratedIndicatorValue?: number;
  excitedIndicatorValue?: number;
  calmIndicatorValue?: number;

  // Analysis mode inputs
  flowStats?: FlowStats;
  heartRateStats?: HeartRateStats;
  correlation?: number;
}

// Character emotion states definitions
const emotionProperties: Record<EmotionState, EmotionProperty> = {
  happy: { color: "#FFDA63", eyeSize: 21, eyeShape: "normal", mouthType: "bigSmile", bodyBounce: 0, background: "sunny" },
  sad: { color: "#5591D6", eyeSize: 14, eyeShape: "down", mouthType: "smallFrown", bodyBounce: 0, background: "cloudy" },
  surprised: { color: "#B266FF", eyeSize: 24, eyeShape: "wide", mouthType: "o", bodyBounce: 0, background: "clear" },
  neutral: { color: "#A0A0A0", eyeSize: 18, eyeShape: "normal", mouthType: "neutral", bodyBounce: 0, background: "clear" },
  focused: { color: "#4CAF50", eyeSize: 17, eyeShape: "narrow", mouthType: "smallSmile", bodyBounce: 1, background: "sunny" },
  stressed: { color: "#F44336", eyeSize: 16, eyeShape: "narrow", mouthType: "jagged", bodyBounce: 0, background: "cloudy" },
  calm: { color: "#81D4FA", eyeSize: 16, eyeShape: "closed", mouthType: "smallSmile", bodyBounce: 0, background: "clear" },
  anxious: { color: "#FFA000", eyeSize: 19, eyeShape: "wide", mouthType: "wavy", bodyBounce: 0, jitter: 1.5, background: "cloudy" }
};

// Emotion descriptions for different states
const emotionDescriptions = {
  happy: "Current state: Joyful Flow",
  sad: "Current state: Feeling Low",
  surprised: "Current state: Curious",
  neutral: "Current state: Neutral",
  focused: "Current state: Deep Work",
  stressed: "Current state: Overwhelmed",
  calm: "Current state: Serene & Still",
  anxious: "Current state: Feeling Uneasy"
};

// --- Interpolation Helpers ---

// Linear interpolation
const lerp = (start: number, end: number, t: number): number => {
  return start * (1 - t) + end * t;
};

// Hex color to RGB object
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

// RGB object to CSS string
const rgbToCss = (rgb: { r: number; g: number; b: number }): string => {
  return `rgb(${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)})`;
};

// Interpolate between two colors
const lerpColor = (colorStart: string, colorEnd: string, t: number): string => {
  const rgbStart = hexToRgb(colorStart);
  const rgbEnd = hexToRgb(colorEnd);

  if (!rgbStart || !rgbEnd) {
    // Fallback if hex parsing fails
    return t < 0.5 ? colorStart : colorEnd;
  }

  const r = lerp(rgbStart.r, rgbEnd.r, t);
  const g = lerp(rgbStart.g, rgbEnd.g, t);
  const b = lerp(rgbStart.b, rgbEnd.b, t);

  return rgbToCss({ r, g, b });
};

// --- Component ---

/**
 * EmotionAvatar - A reusable avatar component that represents emotional state
 * Can be driven by flowIntensity & heartRate data, or directly by setting an emotion
 * Includes smooth transitions between states.
 */
const EmotionAvatar = ({
  flowIntensity,
  heartRate = 75,
  emotion,
  width = 150,
  height = 150,
  showLabel = true,
  customDescription,
  // jitter prop override might be removed if not needed
  transitionDuration = 500, // Default transition time: 500ms
  flowStats,
  heartRateStats,
  correlation,
  frustratedIndicatorValue,
  excitedIndicatorValue,
  calmIndicatorValue
}: EmotionAvatarProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const transitionAnimationRef = useRef<number>();

  // State for current displayed emotion (might be mid-transition)
  const [currentEmotionProps, setCurrentEmotionProps] = useState<EmotionProperty>(emotionProperties.neutral);
  const [emotionDescription, setEmotionDescription] = useState(emotionDescriptions.neutral);

  // State for managing transitions
  const [targetEmotion, setTargetEmotion] = useState<EmotionState>("neutral");
  const [previousEmotionProps, setPreviousEmotionProps] = useState<EmotionProperty>(emotionProperties.neutral);
  const [transitionProgress, setTransitionProgress] = useState(1); // Start at 1 (no transition initially)
  const [transitionStartTime, setTransitionStartTime] = useState<number | null>(null);

  // --- Drawing Callbacks (Clouds, Raindrops, Background - unchanged) ---
  const drawCloud = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    // Get flow value for cloud fluffiness and density
    const flowValue = typeof flowIntensity !== 'undefined' ? flowIntensity : 
                     (flowStats ? flowStats.average : 50);
    const flowNormalized = Math.min(Math.max(flowValue, 0), 100) / 100;
    
    // Cloud properties - fluffier with higher flow (Reduced effect)
    const radius = size / 3;
    const fluffiness = 0.8 + (flowNormalized * 0.2); // Reduced from 0.4
    
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
  
  // Helper to draw raindrops (Further reduced effect)
  const drawRaindrops = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, count: number) => {
    // Save current context state
    ctx.save();
    
    // Get heart rate value for raindrop size and dynamism
    const heartValue = heartRate || (heartRateStats ? heartRateStats.average : 75);
    const heartNormalized = Math.min(Math.max(heartValue, 50), 100) / 100;
    
    // Raindrop size increases with heart rate (Further reduced effect)
    const dropSize = 2 + (heartNormalized * 1); // Reduced from 1.5 (originally 3)
    
    // Raindrop color gets more intense blue with higher heart rate (Further reduced effect)
    const blueIntensity = Math.round(180 + (heartNormalized * 15)); // Reduced from 30 (originally 60)
    ctx.fillStyle = `rgba(120, 160, ${blueIntensity}, 0.6)`; // Slightly less opaque
    
    // Time-based animation offset (gives the raindrops a falling effect)
    const time = Date.now() / 1200; // Slow down time effect further
    const speed = 0.8 + heartNormalized * 0.5; // Reduced base speed and multiplier
    
    for (let i = 0; i < count; i++) {
      // Position with some randomness
      const x = Math.random() * width;
      const yBase = Math.random() * height;
      
      // Calculate vertical position with time-based offset for animation
      // This creates an infinite falling effect - when drops go out of view they appear at the top
      const y = (yBase + (time * speed * 40)) % height; // Speed multiplier reduced from 50
      
      // Draw raindrop shape - more elongated with higher heart rate (Further reduced effect)
      const stretch = 1 + heartNormalized * 0.3; // Reduced from 0.5 (originally 1)
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
        // Make splash semi-transparent white for better visibility
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)"; 
        ctx.beginPath();
        ctx.arc(x - dropSize, y + dropSize, dropSize / 2, 0, Math.PI * 2);
        ctx.arc(x + dropSize, y + dropSize, dropSize / 2, 0, Math.PI * 2);
        ctx.fill();
        // Reset fillStyle for next raindrop
        ctx.fillStyle = `rgba(120, 160, ${blueIntensity}, 0.6)`; 
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
        // Flow intensity affects sky brightness (Reduced effect)
        const skyBlue = Math.round(135 + (flowNormalized * 20)); // Reduced from 40
        bgGradient.addColorStop(0, `rgb(${skyBlue - 50}, ${skyBlue}, ${skyBlue + 35})`); 
        bgGradient.addColorStop(1, `rgb(${skyBlue}, ${skyBlue + 30}, ${skyBlue + 45})`); 
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, width, height);
        
        // Draw sun - size and brightness based on flow intensity (Reduced effect)
        const sunSize = width * (0.10 + (flowNormalized * 0.03)); // Reduced from 0.05
        const sunBrightness = 215 + Math.round(flowNormalized * 20); // Reduced from 40
        
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
        
        // Draw rays around sun based on heart rate (Reduced effect)
        if (heartNormalized > 0.6) {
          const rayCount = Math.round(5 + (heartNormalized * 5)); // Reduced from 7
          ctx.strokeStyle = `rgba(${sunBrightness}, ${sunBrightness}, 100, 0.6)`;
          ctx.lineWidth = 2 + (heartNormalized * 1); // Reduced from 2
          
          for (let i = 0; i < rayCount; i++) {
            const angle = (i / rayCount) * Math.PI * 2;
            const rayLength = sunSize * (1 + (heartNormalized * 0.3)); // Reduced from 0.5
            
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
        
        // Draw small clouds - fewer clouds with higher flow intensity (Reduced effect)
        const cloudCount = Math.round(3 - (flowNormalized * 1.5)); // Reduced from 2
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
        // Lower flow intensity means darker clouds (Reduced effect)
        const grayLevel = Math.round(100 + (flowNormalized * 15)); // Reduced from 30
        bgGradient.addColorStop(0, `rgb(${grayLevel}, ${grayLevel + 10}, ${grayLevel + 20})`); 
        bgGradient.addColorStop(1, `rgb(${grayLevel + 30}, ${grayLevel + 40}, ${grayLevel + 50})`); 
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, width, height);
        
        // Draw clouds - more clouds with lower flow intensity (Reduced effect)
        const bigCloudCount = Math.round(2 + ((1 - flowNormalized) * 1.5)); // Reduced from 2
        const cloudDarkness = Math.round(200 + (flowNormalized * 15)); // Reduced from 30
        ctx.fillStyle = `rgb(${cloudDarkness}, ${cloudDarkness}, ${cloudDarkness})`;
        
        // Draw big clouds (Reduced size effect)
        drawCloud(ctx, width * 0.3, height * 0.2, width * (0.2 + ((1 - flowNormalized) * 0.05))); // Reduced from 0.1
        drawCloud(ctx, width * 0.7, height * 0.15, width * (0.15 + ((1 - flowNormalized) * 0.05))); // Reduced from 0.1
        
        if (bigCloudCount > 2) {
          drawCloud(ctx, width * 0.1, height * 0.3, width * 0.18); // Kept size static
        }
        if (bigCloudCount > 3) {
          drawCloud(ctx, width * 0.5, height * 0.25, width * 0.2); // Kept size static
        }
        
        // Draw raindrops - more rain with higher heart rate (Further reduced effect)
        const rainCount = Math.round(3 + (heartNormalized * 7)); // Reduced from 10 (originally 15)
        drawRaindrops(ctx, width, height, rainCount);
        break;
        
      case "clear":
      default:
        // Light gradient background - intensity based on flow (Reduced effect)
        const blueIntensityClear = Math.round(220 + (flowNormalized * 15)); // Reduced from 35
        bgGradient.addColorStop(0, `rgb(230, ${blueIntensityClear}, 255)`); 
        bgGradient.addColorStop(1, `rgb(240, ${blueIntensityClear}, 255)`); 
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
  
  // --- Draw Avatar (Main Drawing Logic with Interpolation) ---
  const drawAvatar = useCallback(() => {
    if (!canvasRef.current || transitionProgress < 0) return; // Skip if no canvas or transition not started
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const targetProps = emotionProperties[targetEmotion];
    const progress = Math.min(transitionProgress, 1); // Clamp progress to 1

    // Interpolate numerical properties
    const interpolatedColor = lerpColor(previousEmotionProps.color, targetProps.color, progress);
    const interpolatedEyeSize = lerp(previousEmotionProps.eyeSize, targetProps.eyeSize, progress);
    const interpolatedBodyBounce = lerp(previousEmotionProps.bodyBounce, targetProps.bodyBounce, progress);
    const interpolatedJitter = lerp(previousEmotionProps.jitter ?? 0, targetProps.jitter ?? 0, progress);

    // Use target properties for categorical values once transition starts
    const currentEyeShape = progress > 0 ? targetProps.eyeShape : previousEmotionProps.eyeShape;
    const currentMouthType = progress > 0 ? targetProps.mouthType : previousEmotionProps.mouthType;
    const currentBackground = progress > 0 ? targetProps.background : previousEmotionProps.background;

    // Get canvas dimensions
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const centerX = canvasWidth / 2;
    const verticalPos = canvasHeight / 2; // Center vertically

    // Scale factor for avatar
    const scale = canvasWidth / 250;

    // Calculate jitter offsets (using interpolated jitter)
    const timeBasedJitter = Date.now() / 100;
    const jitterX = interpolatedJitter > 0 ? (Math.random() - 0.5) * interpolatedJitter * scale : 0;
    const jitterY = interpolatedJitter > 0 ? (Math.sin(timeBasedJitter) * interpolatedJitter * 0.5) * scale : 0;

    // Clear the entire canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // 1. Draw background first (using target background type)
    drawBackground(ctx, canvasWidth, canvasHeight, currentBackground);

    // 2. Draw the character on top of the background

    // Head (Round face)
    ctx.fillStyle = interpolatedColor; // Use interpolated color
    ctx.strokeStyle = "#1E1E1E";
    ctx.lineWidth = 4 * scale;
    ctx.beginPath();
    // Apply interpolated bounce and jitter
    ctx.arc(centerX + jitterX, verticalPos + interpolatedBodyBounce + jitterY, 70 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Eyes (using interpolated size and target shape)
    ctx.fillStyle = "#1E1E1E";
    const eyeY = verticalPos - 10 * scale + interpolatedBodyBounce + jitterY;
    const eyeXLeft = centerX - 20 * scale + jitterX;
    const eyeXRight = centerX + 20 * scale + jitterX;
    const eyeRadius = interpolatedEyeSize * scale / 2; // Use interpolated eye size

    // Draw eyes based on target shape
    ctx.beginPath();
    if (currentEyeShape === "closed") {
        ctx.lineWidth = 2 * scale;
        ctx.moveTo(eyeXLeft - eyeRadius * 0.7, eyeY);
        ctx.lineTo(eyeXLeft + eyeRadius * 0.7, eyeY);
        ctx.moveTo(eyeXRight - eyeRadius * 0.7, eyeY);
        ctx.lineTo(eyeXRight + eyeRadius * 0.7, eyeY);
        ctx.stroke();
    } else if (currentEyeShape === "narrow") {
        ctx.ellipse(eyeXLeft, eyeY, eyeRadius, eyeRadius * 0.6, 0, 0, Math.PI * 2);
        ctx.ellipse(eyeXRight, eyeY, eyeRadius, eyeRadius * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
    } else if (currentEyeShape === "wide") {
        ctx.arc(eyeXLeft, eyeY, eyeRadius, 0, Math.PI * 2);
        ctx.arc(eyeXRight, eyeY, eyeRadius, 0, Math.PI * 2);
        ctx.fill();
    } else if (currentEyeShape === "down") {
        ctx.arc(eyeXLeft, eyeY + eyeRadius * 0.3, eyeRadius, Math.PI * 0.1, Math.PI * 0.9, false);
        ctx.arc(eyeXRight, eyeY + eyeRadius * 0.3, eyeRadius, Math.PI * 0.1, Math.PI * 0.9, false);
        ctx.closePath();
        ctx.fill();
    } else { // normal
        ctx.arc(eyeXLeft, eyeY, eyeRadius, 0, Math.PI * 2);
        ctx.arc(eyeXRight, eyeY, eyeRadius, 0, Math.PI * 2);
        ctx.fill();
    }

    // Eye Highlights (skip for closed eyes)
    if (currentEyeShape !== "closed") {
        ctx.fillStyle = "white";
        ctx.beginPath();
        const highlightOffsetX = currentEyeShape === "narrow" ? 0 : (currentEyeShape === "down" ? 0 : 5 * scale);
        const highlightOffsetY = currentEyeShape === "down" ? -2 * scale : -5 * scale;
        ctx.arc(eyeXLeft + highlightOffsetX + jitterX * 0.5, eyeY + highlightOffsetY + jitterY * 0.5, 4 * scale * (currentEyeShape === "wide" ? 1.1 : 1), 0, Math.PI * 2);
        ctx.arc(eyeXRight - highlightOffsetX + jitterX * 0.5, eyeY + highlightOffsetY + jitterY * 0.5, 4 * scale * (currentEyeShape === "wide" ? 1.1 : 1), 0, Math.PI * 2);
        ctx.fill();
    }

    // Eyebrows (logic adjusted slightly based on target mouth type)
    ctx.strokeStyle = "#1E1E1E";
    ctx.lineWidth = 1.5 * scale;
    const eyebrowYBase = verticalPos - 37 * scale + interpolatedBodyBounce; // Base Y position for eyebrows

    ctx.beginPath();
    // Adjust eyebrow expressions slightly based on target mouth/emotion type
    if (currentMouthType === "frown" || currentMouthType === "smallFrown" || currentMouthType === "jagged") {
        // Sad/Stressed eyebrows
        ctx.moveTo(centerX - 25 * scale, eyebrowYBase + 2 * scale); ctx.lineTo(centerX - 10 * scale, eyebrowYBase + 3 * scale);
        ctx.moveTo(centerX + 25 * scale, eyebrowYBase + 2 * scale); ctx.lineTo(centerX + 10 * scale, eyebrowYBase + 3 * scale);
    } else if (currentMouthType === "o" || currentMouthType === "wavy") {
        // Surprised/Anxious eyebrows
         ctx.moveTo(centerX - 25 * scale, eyebrowYBase - 1 * scale); ctx.lineTo(centerX - 10 * scale, eyebrowYBase - 2 * scale);
         ctx.moveTo(centerX + 25 * scale, eyebrowYBase - 1 * scale); ctx.lineTo(centerX + 10 * scale, eyebrowYBase - 2 * scale);
    } else if (currentMouthType === "bigSmile" || currentMouthType === "smile" || currentMouthType === "smallSmile") {
         // Happy/Calm eyebrows
         ctx.moveTo(centerX - 25 * scale, eyebrowYBase + 1 * scale); ctx.lineTo(centerX - 10 * scale, eyebrowYBase - 1 * scale);
         ctx.moveTo(centerX + 25 * scale, eyebrowYBase + 1 * scale); ctx.lineTo(centerX + 10 * scale, eyebrowYBase - 1 * scale);
    } else { // Neutral/Focused/Closed eyes default
        ctx.moveTo(centerX - 25 * scale, eyebrowYBase); ctx.lineTo(centerX - 10 * scale, eyebrowYBase);
        ctx.moveTo(centerX + 25 * scale, eyebrowYBase); ctx.lineTo(centerX + 10 * scale, eyebrowYBase);
    }
    ctx.translate(jitterX, jitterY); // Apply jitter to eyebrows
    ctx.stroke();
    ctx.translate(-jitterX, -jitterY); // Reset translation

    // Mouth (drawn based on target mouth type)
    ctx.strokeStyle = "#1E1E1E";
    ctx.lineWidth = 2 * scale;
    const mouthY = verticalPos + 20 * scale + interpolatedBodyBounce + jitterY;
    const mouthX = centerX + jitterX;
    ctx.beginPath();

    // Draw mouth based on target type
    if (currentMouthType === "smile") {
      ctx.arc(mouthX, mouthY, 18 * scale, 0, Math.PI, false);
    } else if (currentMouthType === "bigSmile") {
      ctx.arc(mouthX, mouthY, 22 * scale, 0, Math.PI, false);
    } else if (currentMouthType === "smallSmile") {
      ctx.arc(mouthX, mouthY, 12 * scale, 0, Math.PI, false);
    } else if (currentMouthType === "frown") {
      ctx.arc(mouthX, mouthY + 10 * scale, 15 * scale, Math.PI, 0, false);
    } else if (currentMouthType === "smallFrown") {
      ctx.arc(mouthX, mouthY + 5 * scale, 10 * scale, Math.PI, 0, false);
    } else if (currentMouthType === "o") {
      ctx.arc(mouthX, mouthY, 10 * scale, 0, Math.PI * 2);
    } else if (currentMouthType === "line") {
      ctx.moveTo(mouthX - 15 * scale, mouthY + 5 * scale);
      ctx.lineTo(mouthX + 15 * scale, mouthY + 5 * scale);
    } else if (currentMouthType === "jagged") {
      ctx.moveTo(mouthX - 18 * scale, mouthY + 8 * scale);
      ctx.lineTo(mouthX - 6 * scale, mouthY + 4 * scale);
      ctx.lineTo(mouthX + 6 * scale, mouthY + 8 * scale);
      ctx.lineTo(mouthX + 18 * scale, mouthY + 4 * scale);
    } else if (currentMouthType === "wavy") {
      ctx.moveTo(mouthX - 18 * scale, mouthY + 5 * scale);
      ctx.quadraticCurveTo(mouthX - 9 * scale, mouthY + 10 * scale, mouthX, mouthY + 5 * scale);
      ctx.quadraticCurveTo(mouthX + 9 * scale, mouthY, mouthX + 18 * scale, mouthY + 5 * scale);
    } else { // neutral mouth
      ctx.moveTo(mouthX - 15 * scale, mouthY);
      ctx.quadraticCurveTo(mouthX, mouthY + 2 * scale, mouthX + 15 * scale, mouthY);
    }
    ctx.stroke();

    // Blush (Cheeks) - Intensity based on target emotion
    const targetBlushIntensity = (targetEmotion === 'sad' || targetEmotion === 'stressed' || targetEmotion === 'anxious' || targetEmotion === 'calm') ? 0.1 : 0.4;
    const previousBlushIntensity = (previousEmotionProps.background === 'cloudy' || previousEmotionProps.eyeShape === 'closed' || previousEmotionProps.mouthType === 'frown') ? 0.1 : 0.4; // Estimate previous blush
    const interpolatedBlushIntensity = lerp(previousBlushIntensity, targetBlushIntensity, progress);

    ctx.fillStyle = `rgba(229, 115, 115, ${interpolatedBlushIntensity})`;
    ctx.beginPath();
    ctx.arc(centerX - 30 * scale + jitterX, verticalPos + 10 * scale + interpolatedBodyBounce + jitterY, 12 * scale, 0, Math.PI * 2);
    ctx.arc(centerX + 30 * scale + jitterX, verticalPos + 10 * scale + interpolatedBodyBounce + jitterY, 12 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Request next animation frame ONLY if not in a transition managed separately
     if (transitionProgress >= 1) {
       animationRef.current = requestAnimationFrame(drawAvatar);
     }
  }, [targetEmotion, previousEmotionProps, transitionProgress, drawBackground, drawCloud, drawRaindrops, width, height]); // Added width/height


  // --- Emotion Calculation and Transition Initiation ---
  useEffect(() => {
    let newEmotionTarget: EmotionState = "neutral";
    let newDescription = emotionDescriptions.neutral;

    // Define a threshold for the indicators
    const indicatorThreshold = 60; 

    // Determine target emotion - Updated Order of precedence:
    // 1. Direct emotion prop
    // 2. New direct indicators (frustrated, excited, calm) - using threshold
    // 3. Analysis mode (stats)
    // 4. Real-time mode (intensity/rate)
    // 5. Default to neutral

    if (emotion) {
      newEmotionTarget = emotion;
      newDescription = customDescription || emotionDescriptions[emotion];
    } else if (typeof frustratedIndicatorValue === 'number' && frustratedIndicatorValue > indicatorThreshold) {
      // Prioritize frustration if indicator is high
      newEmotionTarget = "stressed"; // Could also be 'anxious' depending on desired mapping
      newDescription = customDescription || emotionDescriptions.stressed;
    } else if (typeof excitedIndicatorValue === 'number' && excitedIndicatorValue > indicatorThreshold) {
      // Prioritize excitement if indicator is high
      newEmotionTarget = "happy"; // Could also be 'surprised'
      newDescription = customDescription || emotionDescriptions.happy;
    } else if (typeof calmIndicatorValue === 'number' && calmIndicatorValue > indicatorThreshold) {
      // Prioritize calm if indicator is high
      newEmotionTarget = "calm";
      newDescription = customDescription || emotionDescriptions.calm;
      // High calm indicator takes precedence over subsequent conditions
    } else if (flowStats && heartRateStats) {
      // Analysis mode logic (only runs if indicators weren't triggered)
       if (correlation && correlation < -0.6 && heartRateStats.stability < 40) {
          newEmotionTarget = "anxious"; newDescription = "High tension, unstable state";
        } else if (flowStats.average < 35 && heartRateStats.average > 90 && flowStats.stability < 40) {
           // This won't be reached if calmIndicatorValue was high
           newEmotionTarget = "stressed"; newDescription = "Signs of overload detected";
        } else if (flowStats.average > 70 && heartRateStats.stability > 70) {
          newEmotionTarget = "focused"; newDescription = "Deep focus and stable heart rate";
        } else if (flowStats.average > 65 && heartRateStats.average < 85) {
          newEmotionTarget = "happy"; newDescription = "Positive flow state";
        } else if (flowStats.average < 30 && heartRateStats.average > 85) {
           // This won't be reached if calmIndicatorValue was high
           newEmotionTarget = "sad"; newDescription = "Low flow, feeling down";
        } else if (flowStats.average < 45 && heartRateStats.average < 65 && flowStats.stability > 60 && heartRateStats.stability > 60) {
           // This condition already leads to 'calm', reinforcing the indicator logic
           newEmotionTarget = "calm"; newDescription = "Relaxed and stable state";
        } else if (flowStats.stability < 45 || heartRateStats.stability < 45) {
          newEmotionTarget = "surprised"; newDescription = "Variable mental state";
        }
        // If none of the above analysis conditions met, it defaults to 'neutral'

    } else if (typeof flowIntensity !== 'undefined') {
      // Real-time mode logic (only runs if indicators and stats weren't triggered/available)
       if (flowIntensity < 25 && heartRate > 95) {
           // This won't be reached if calmIndicatorValue was high
           newEmotionTarget = "stressed"; newDescription = emotionDescriptions.stressed;
        } else if (flowIntensity < 35 && heartRate > 85) {
           // This won't be reached if calmIndicatorValue was high
           newEmotionTarget = "anxious"; newDescription = emotionDescriptions.anxious;
        } else if (flowIntensity < 40 && heartRate < 70) {
            // This won't be reached if calmIndicatorValue was high
            newEmotionTarget = "sad"; newDescription = emotionDescriptions.sad;
        } else if (flowIntensity > 70) {
          newEmotionTarget = "focused"; newDescription = emotionDescriptions.focused;
        } else if (flowIntensity > 60) {
          newEmotionTarget = "happy"; newDescription = emotionDescriptions.happy;
        } else if (flowIntensity < 45 && heartRate < 65) {
             // This condition already leads to 'calm'
            newEmotionTarget = "calm"; newDescription = emotionDescriptions.calm;
        } else if (flowIntensity > 40 && flowIntensity < 58) {
          newEmotionTarget = "surprised"; newDescription = emotionDescriptions.surprised;
        }
         // Default to neutral if no other condition met in real-time mode
    }

    // Initiate transition if target has changed
    if (newEmotionTarget !== targetEmotion) {
      setPreviousEmotionProps(emotionProperties[targetEmotion]); // Store current properties as previous
      setTargetEmotion(newEmotionTarget);
      setEmotionDescription(newDescription); // Update description immediately
      setTransitionStartTime(Date.now());
      setTransitionProgress(0); // Start transition
      // Cancel ongoing jitter/idle animation if starting a transition
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    }

  }, [
       flowIntensity, 
       heartRate, 
       emotion, 
       customDescription, 
       flowStats, 
       heartRateStats, 
       correlation, 
       targetEmotion, 
       width, 
       height, 
       frustratedIndicatorValue, 
       excitedIndicatorValue, 
       calmIndicatorValue 
     ] // Ensure all dependencies are listed
  );


  // --- Transition Animation Loop ---
  useEffect(() => {
    const runTransition = () => {
      if (transitionStartTime === null || transitionProgress >= 1) {
        // If transition finished or hasn't started, ensure idle animation runs
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        animationRef.current = requestAnimationFrame(drawAvatar);
        return;
      }

      const now = Date.now();
      const elapsed = now - transitionStartTime;
      const progress = Math.min(elapsed / transitionDuration, 1);

      setTransitionProgress(progress);

      // Call drawAvatar directly to render the intermediate state
      drawAvatar();

      if (progress < 1) {
        transitionAnimationRef.current = requestAnimationFrame(runTransition);
      } else {
        // Transition finished
        setTransitionStartTime(null);
        // Ensure the final state is drawn and idle animation resumes
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        animationRef.current = requestAnimationFrame(drawAvatar);
      }
    };

    // Start the transition loop if progress is less than 1
    if (transitionProgress < 1) {
       if (transitionAnimationRef.current) cancelAnimationFrame(transitionAnimationRef.current);
       transitionAnimationRef.current = requestAnimationFrame(runTransition);
    } else {
      // If not transitioning, ensure idle animation is running
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      animationRef.current = requestAnimationFrame(drawAvatar);
    }


    // Cleanup function
    return () => {
      if (transitionAnimationRef.current) {
        cancelAnimationFrame(transitionAnimationRef.current);
      }
       // Also cancel idle animation on unmount
       if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [transitionStartTime, transitionProgress, transitionDuration, drawAvatar]);

  // --- Initial Draw & Idle Animation Setup ---
   useEffect(() => {
    // Ensure initial draw happens and idle animation starts if no transition is active
    if (transitionProgress >= 1) {
       animationRef.current = requestAnimationFrame(drawAvatar);
    }
    // Cleanup idle animation on unmount
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
   }, [drawAvatar, transitionProgress]); // Rerun if transitionProgress finishes or drawAvatar changes


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
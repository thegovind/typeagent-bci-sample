import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Image as ImageIcon, Download, RefreshCw } from "lucide-react";
import DynamicSidebar from "@/components/DynamicSidebar";
import EmotionAvatar from "@/components/ui/EmotionAvatar";

interface BrainState {
  flowIntensity: number;
  heartRate: number;
  emotionalState: string;
  frustratedValue: number;
  excitedValue: number;
  calmValue: number;
}

const ImageGeneration = () => {
  const [brainState, setBrainState] = useState<BrainState>({
    flowIntensity: 0,
    heartRate: 75,
    emotionalState: "neutral",
    frustratedValue: 30,
    excitedValue: 40,
    calmValue: 35
  });
  
  const [userPrompt, setUserPrompt] = useState("");
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generationHistory, setGenerationHistory] = useState<Array<{
    prompt: string;
    imageUrl: string;
    timestamp: number;
    brainState: BrainState;
  }>>([]);

  useEffect(() => {
    const fetchBrainState = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/getMostRecentRecord', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const flowIntensity = Math.floor(data['flowIntensityValues']?.[0] || 0);
          const heartRate = Math.floor(data['heartRateValues']?.[0] || 75);
          
          const frustratedValue = Math.min(100, Math.max(0, 
            flowIntensity < 40 && heartRate > 75 ? 80 : flowIntensity < 30 ? 70 : 30
          ));
          const excitedValue = Math.min(100, Math.max(0, 
            flowIntensity > 70 && heartRate > 80 ? 90 : flowIntensity > 60 ? 75 : 40
          ));
          const calmValue = Math.min(100, Math.max(0, 
            flowIntensity > 40 && flowIntensity < 70 && heartRate < 70 ? 85 : heartRate < 65 ? 70 : 35
          ));
          
          let emotionalState = "neutral";
          if (frustratedValue > 60) emotionalState = "stressed";
          else if (excitedValue > 70) emotionalState = "focused";
          else if (calmValue > 70) emotionalState = "calm";
          
          setBrainState({
            flowIntensity: flowIntensity || Math.floor(Math.random() * (85 - 15) + 15),
            heartRate: heartRate || Math.floor(Math.random() * (85 - 65) + 65),
            emotionalState,
            frustratedValue,
            excitedValue,
            calmValue
          });
        }
      } catch (error) {
        console.error('Error fetching brain state:', error);
        const randomFlow = Math.floor(Math.random() * (85 - 15) + 15);
        const randomHeart = Math.floor(Math.random() * (85 - 65) + 65);
        setBrainState(prev => ({
          ...prev,
          flowIntensity: randomFlow,
          heartRate: randomHeart
        }));
      }
    };

    fetchBrainState();
    const interval = setInterval(fetchBrainState, 5000);
    return () => clearInterval(interval);
  }, []);

  const generateImage = async () => {
    if (!userPrompt.trim()) {
      setError("Please enter a prompt for image generation");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3000/api/image-generation', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          parameters: {
            userPrompt: userPrompt.trim(),
            brainState: brainState
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to generate image: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.imageUrl) {
        setGeneratedImageUrl(data.imageUrl);
        setGenerationHistory(prev => [{
          prompt: userPrompt,
          imageUrl: data.imageUrl,
          timestamp: Date.now(),
          brainState: { ...brainState }
        }, ...prev.slice(0, 4)]); // Keep last 5 generations
      } else {
        throw new Error("No image URL received from server");
      }
    } catch (error) {
      console.error('Error generating image:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = async () => {
    if (!generatedImageUrl) return;
    
    try {
      const response = await fetch(generatedImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `brain-state-image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      <DynamicSidebar />
      <main className="flex-1 p-6 neural-bg">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Brain State Image Generation</h1>
            <p className="text-lg text-muted-foreground">
              Generate AI images based on your current brain activity and emotional state
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Brain State Display */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Current Brain State
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center">
                  <EmotionAvatar
                    flowIntensity={brainState.flowIntensity}
                    heartRate={brainState.heartRate}
                    frustratedIndicatorValue={brainState.frustratedValue}
                    excitedIndicatorValue={brainState.excitedValue}
                    calmIndicatorValue={brainState.calmValue}
                    width={120}
                    height={120}
                    showLabel={true}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 border border-sidebar-border rounded bg-sidebar-background/50">
                    <div className="text-muted-foreground">Flow Intensity</div>
                    <div className="text-accent font-medium text-lg">{brainState.flowIntensity}%</div>
                  </div>
                  <div className="p-3 border border-sidebar-border rounded bg-sidebar-background/50">
                    <div className="text-muted-foreground">Heart Rate</div>
                    <div className="text-red-400 font-medium text-lg">{brainState.heartRate} BPM</div>
                  </div>
                  <div className="p-3 border border-sidebar-border rounded bg-sidebar-background/50">
                    <div className="text-muted-foreground">Emotional State</div>
                    <div className="text-blue-400 font-medium capitalize">{brainState.emotionalState}</div>
                  </div>
                  <div className="p-3 border border-sidebar-border rounded bg-sidebar-background/50">
                    <div className="text-muted-foreground">Dominant Emotion</div>
                    <div className="text-green-400 font-medium">
                      {brainState.frustratedValue > Math.max(brainState.excitedValue, brainState.calmValue) ? 'Frustrated' :
                       brainState.excitedValue > brainState.calmValue ? 'Excited' : 'Calm'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Image Generation Interface */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Generate Image
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="prompt" className="text-sm font-medium">
                    Image Prompt
                  </label>
                  <Textarea
                    id="prompt"
                    placeholder="Describe what you want to generate (e.g., 'a peaceful landscape', 'abstract art representing focus', 'a futuristic cityscape')..."
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Your brain state will automatically be incorporated into the generation prompt
                  </p>
                </div>

                <Button 
                  onClick={generateImage} 
                  disabled={isGenerating || !userPrompt.trim()}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Image...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Generate Image
                    </>
                  )}
                </Button>

                {error && (
                  <div className="p-3 border border-red-200 bg-red-50 text-red-700 rounded-md text-sm">
                    {error}
                  </div>
                )}

                {/* Generated Image Display */}
                {generatedImageUrl && (
                  <div className="space-y-3">
                    <div className="relative">
                      <img
                        src={generatedImageUrl}
                        alt="Generated based on brain state"
                        className="w-full rounded-lg border border-sidebar-border"
                        onError={() => setError("Failed to load generated image")}
                      />
                    </div>
                    <Button
                      onClick={downloadImage}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Image
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Generation History */}
          {generationHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Generations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {generationHistory.map((item, index) => (
                    <div key={index} className="space-y-2">
                      <img
                        src={item.imageUrl}
                        alt={`Generated: ${item.prompt}`}
                        className="w-full h-32 object-cover rounded-lg border border-sidebar-border"
                      />
                      <div className="text-xs text-muted-foreground">
                        <div className="truncate">{item.prompt}</div>
                        <div>Flow: {item.brainState.flowIntensity}% | HR: {item.brainState.heartRate} BPM</div>
                        <div>{new Date(item.timestamp).toLocaleTimeString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default ImageGeneration;

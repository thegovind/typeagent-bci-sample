import { motion, animate } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { WifiIcon, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

interface BrainActivityRecord {
  timestamp: string;
  flowIntensity: number;
  heartRate: number;
  flowIntensityValues?: number[];
}

const BrainActivity = () => {
  const [selectedActivity, setSelectedActivity] = useState<string>("working");
  const [selectedLocation, setSelectedLocation] = useState<string>("office");
  const [flowIntensity, setFlowIntensity] = useState(0);
  const [isConnected, setIsConnected] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const { toast } = useToast();

  const fetchBrainActivity = useCallback(async (attempt = 0) => {
    try {
      const response = await fetch('http://localhost:4518/api/getMostRecentRecord', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: BrainActivityRecord = await response.json();
      
      // Try to get flow intensity from either flowIntensityValues array or flowIntensity field
      const updateIntensity = data.flowIntensityValues?.[0] ?? data.flowIntensity ?? 0;
      
      setFlowIntensity(updateIntensity || Math.floor(Math.random() * (85 - 15) + 15));
      setIsConnected(true);
      setIsLoading(false);
      setRetryCount(0);
    } catch (error) {
      console.error('Error fetching brain activity:', error);
      setIsConnected(false);
      
      if (attempt < MAX_RETRIES) {
        toast({
          title: "Connection Error",
          description: `Retrying connection... (Attempt ${attempt + 1}/${MAX_RETRIES})`,
          variant: "destructive",
        });
        
        setTimeout(() => {
          fetchBrainActivity(attempt + 1);
        }, RETRY_DELAY * (attempt + 1)); // Exponential backoff
        
        setRetryCount(attempt + 1);
      } else {
        setIsLoading(false);
        toast({
          title: "Connection Failed",
          description: "Could not connect to brain activity monitor. Using simulated data.",
          variant: "destructive",
        });
        
        // Fallback to random data
        setFlowIntensity(Math.floor(Math.random() * (85 - 15) + 15));
      }
    }
  }, [toast]);

  useEffect(() => {
    // Initial fetch
    fetchBrainActivity();

    // Set up polling interval
    const interval = setInterval(() => {
      if (!isLoading) { // Only fetch if not currently loading
        fetchBrainActivity();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [fetchBrainActivity, isLoading]);

  const circumference = 2 * Math.PI * 120;
  const offset = circumference - (flowIntensity / 100) * circumference;

  return (
    <div className="p-4 border border-sidebar-border rounded-lg bg-sidebar-background/50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Brain Activity Monitor</h3>
        <div className="flex items-center gap-1 text-xs">
          {isLoading ? (
            <div className="flex items-center gap-1 text-muted-foreground">
              <div className="animate-spin h-3 w-3 border border-current rounded-full border-t-transparent" />
              <span>Connecting...</span>
            </div>
          ) : isConnected ? (
            <div className="flex items-center gap-1 text-accent">
              <WifiIcon className="h-3 w-3" />
              <span>Connected</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-destructive">
              <AlertCircle className="h-3 w-3" />
              <span>Disconnected</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="relative flex flex-col items-center justify-center h-48">
          <svg className="transform -rotate-90 w-48 h-48">
            <circle
              cx="96"
              cy="96"
              r="70"
              fill="none"
              stroke="rgb(var(--muted))"
              strokeWidth="8"
            />
            <motion.circle
              cx="96"
              cy="96"
              r="70"
              fill="none"
              stroke="rgb(var(--accent))"
              strokeWidth="8"
              strokeLinecap="round"
              initial={{ strokeDashoffset: circumference }}
              animate={{ 
                strokeDashoffset: offset,
                transition: { duration: 1, ease: "easeInOut" }
              }}
              style={{
                strokeDasharray: circumference
              }}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <motion.span 
              className={`text-4xl font-bold ${isConnected ? 'text-accent' : 'text-muted-foreground'}`}
              key={flowIntensity}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {flowIntensity}%
            </motion.span>
            <span className="text-sm text-muted-foreground">flow intensity</span>
            {!isConnected && (
              <span className="text-xs text-destructive mt-1">(Simulated Data)</span>
            )}
          </div>
        </div>

        <div>
          <div className="text-xs text-muted-foreground mb-2">Activity Context</div>
          <div className="grid grid-cols-2 gap-2">
            {["meeting", "working", "talking", "phone"].map((activity) => (
              <Button
                key={activity}
                variant={selectedActivity === activity ? "default" : "outline"}
                size="sm"
                className="w-full capitalize"
                onClick={() => setSelectedActivity(activity)}
              >
                {activity}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs text-muted-foreground mb-2">Location Context</div>
          <div className="grid grid-cols-2 gap-2">
            {["home", "office", "gym", "outdoor"].map((location) => (
              <Button
                key={location}
                variant={selectedLocation === location ? "default" : "outline"}
                size="sm"
                className="w-full capitalize"
                onClick={() => setSelectedLocation(location)}
              >
                {location}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 border border-sidebar-border rounded bg-sidebar-background/50">
            <div className="text-muted-foreground">Focus Level</div>
            <div className="text-accent font-medium">High</div>
          </div>
          <div className="p-2 border border-sidebar-border rounded bg-sidebar-background/50">
            <div className="text-muted-foreground">Stress Level</div>
            <div className="text-yellow-400 font-medium">Medium</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrainActivity;

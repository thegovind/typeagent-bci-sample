import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Send } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import DynamicSidebar from "@/components/DynamicSidebar";
import { motion, AnimatePresence } from "framer-motion";

// Flow intensity API endpoint
const FLOW_INTENSITY_API = "http://localhost:3000/api/getMostRecentRecord";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  flowIntensity?: number; // Flow intensity value (0-100)
}

interface Action {
  id: string;
  type: "thinking" | "processing" | "generating" | "complete";
  description: string;
  timestamp: Date;
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [input, setInput] = useState("");
  const [flowIntensity, setFlowIntensity] = useState(0);
  const intensityIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const addAction = (type: Action["type"], description: string) => {
    const newAction = {
      id: crypto.randomUUID(),
      type,
      description,
      timestamp: new Date(),
    };
    setActions(prev => [newAction, ...prev].slice(0, 5)); // Keep last 5 actions
  };

  // Start measuring flow intensity when user starts typing
  useEffect(() => {
    if (input && !intensityIntervalRef.current) {
      // Start tracking when user begins typing
      startFlowIntensityTracking();
    } else if (!input && intensityIntervalRef.current) {
      // Optional: reset tracking when input is cleared
      // stopFlowIntensityTracking();
      // setFlowIntensity(0);
    }
  }, [input]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intensityIntervalRef.current) {
        clearInterval(intensityIntervalRef.current);
      }
    };
  }, []);

  const startFlowIntensityTracking = () => {
    // Start with initial value from API
    fetchFlowIntensity();
    
    // Poll the API every 500ms for real-time updates
    intensityIntervalRef.current = setInterval(() => {
      fetchFlowIntensity();
    }, 500);
  };

  const fetchFlowIntensity = async () => {
    try {
      const response = await fetch(FLOW_INTENSITY_API, {
        method: 'POST',
        credentials: 'include', // Add this if you enabled credentials in corsOptions
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch flow intensity data');
      }
      
      const data = await response.json();
      
      // Use the same data extraction method as BloodFlowActivity
      if (data['flowIntensityValues'] && data['flowIntensityValues'].length > 0) {
        const updateIntensity = Math.floor(data['flowIntensityValues'][0]);
        
        // If we have real data, use it
        if (updateIntensity > 0) {
          setFlowIntensity(updateIntensity);
        } else {
          // Generate random intensity if real data is 0
          const newIntensity = Math.floor(Math.random() * (85 - 15) + 15); // Random value between 15-85
          setFlowIntensity(newIntensity);
        }
      } else {
        // Fallback if flowIntensityValues doesn't exist
        throw new Error('No flow intensity data available');
      }
      
    } catch (error) {
      console.error('Error fetching flow intensity:', error);
      
      // Fallback to simulation if API fails
      setFlowIntensity(prevIntensity => {
        const change = Math.floor(Math.random() * 15) - 7; // -7 to +7 range
        return Math.max(10, Math.min(95, prevIntensity ? prevIntensity + change : 50));
      });
    }
  };

  const stopFlowIntensityTracking = () => {
    if (intensityIntervalRef.current) {
      clearInterval(intensityIntervalRef.current);
      intensityIntervalRef.current = null;
    }
  };

  const handleSend = () => {
    if (!input.trim()) {
      toast({
        title: "Message cannot be empty",
        variant: "destructive",
      });
      return;
    }

    const currentIntensity = flowIntensity;
    
    // Stop tracking once message is sent
    stopFlowIntensityTracking();

    const newMessage: Message = {
      id: crypto.randomUUID(),
      content: input,
      role: "user",
      timestamp: new Date(),
      flowIntensity: currentIntensity,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput("");

    // Simulate AI response with actions
    addAction("thinking", "Processing your message and blood flow activity...");
    
    setTimeout(() => {
      addAction("processing", `Analyzing blood flow activity patterns (intensity: ${currentIntensity})...`);
      
      setTimeout(() => {
        addAction("generating", "Generating emotionally-calibrated response...");
        
        setTimeout(() => {
          // Adapt AI response based on flow intensity
          let responseContent = "";
          
          if (currentIntensity > 75) {
            responseContent = "I notice your blood flow activity suggests high engagement. This is a sample response calibrated for your elevated state, acknowledging your focused attention.";
          } else if (currentIntensity > 50) {
            responseContent = "Your blood flow patterns indicate moderate engagement. This is a balanced response designed to maintain your current flow state.";
          } else {
            responseContent = "I've detected lower intensity blood flow activity patterns. This response is crafted to be gentle and supportive while preserving your cognitive resources.";
          }
          
          const aiResponse: Message = {
            id: crypto.randomUUID(),
            content: responseContent,
            role: "assistant",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, aiResponse]);
          addAction("complete", "Blood flow-optimized response generated successfully!");
        }, 1000);
      }, 800);
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      <DynamicSidebar />
      
      <main className="flex-1 neural-bg">
        <div className="flex h-screen flex-col p-6">
          <div className="mb-4">
            <h1 className="text-2xl font-bold">Chat with Your Data</h1>
            <p className="text-muted-foreground">Experience personalized responses optimized by your blood flow activity patterns</p>
          </div>

          <ScrollArea className="flex-1 rounded-lg border border-sidebar-border bg-background/50 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === "user"
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <div className="mt-1 flex justify-between text-xs opacity-70">
                      <span>{message.timestamp.toLocaleTimeString()}</span>
                      {message.flowIntensity !== undefined && (
                        <span className="flex items-center gap-1">
                          <div 
                            className="h-1.5 w-1.5 rounded-full" 
                            style={{ 
                              backgroundColor: 
                                message.flowIntensity > 75 ? '#ef4444' : 
                                message.flowIntensity > 50 ? '#f59e0b' : 
                                '#10b981'
                            }} 
                          />
                          Flow: {message.flowIntensity}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="mt-4">
            {input && (
              <div className="mb-2 flex items-center gap-2">
                <div className="h-1.5 w-full rounded-full bg-gray-200">
                  <div 
                    className="h-1.5 rounded-full transition-all duration-300" 
                    style={{ 
                      width: `${flowIntensity}%`, 
                      backgroundColor: 
                        flowIntensity > 75 ? '#ef4444' : 
                        flowIntensity > 50 ? '#f59e0b' : 
                        '#10b981'
                    }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">Flow: {flowIntensity}</span>
              </div>
            )}
            <div className="flex gap-2">
              <Input
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                className="flex-1"
              />
              <Button onClick={handleSend}>
                <Send className="h-4 w-4" />
                <span className="ml-2">Send</span>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <div className="w-80 border-l border-sidebar-border bg-sidebar-background p-4 neural-bg">
        <h2 className="mb-4 text-lg font-semibold">Activity Feed</h2>
        <AnimatePresence>
          {actions.map((action) => (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="mb-3"
            >
              <div className="rounded-lg border border-sidebar-border bg-background/50 p-3">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <div className={`h-2 w-2 rounded-full ${
                      action.type === "thinking" ? "bg-blue-500 animate-pulse" :
                      action.type === "processing" ? "bg-yellow-500 animate-pulse" :
                      action.type === "generating" ? "bg-green-500 animate-pulse" :
                      "bg-accent"
                    }`} />
                  </div>
                  <span className="text-sm font-medium">{action.description}</span>
                </div>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {action.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Chat;

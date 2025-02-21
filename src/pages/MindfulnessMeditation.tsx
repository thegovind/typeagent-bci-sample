
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Brain, Pause, Play } from "lucide-react";
import { useState } from "react";
import DynamicSidebar from "@/components/DynamicSidebar";
import { motion, AnimatePresence } from "framer-motion";

const MindfulnessMeditation = () => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [actions, setActions] = useState<Array<{ id: string; type: string; description: string; timestamp: Date }>>([]);
  const { toast } = useToast();

  const meditationSteps = [
    "Find a comfortable position...",
    "Take a deep breath...",
    "Focus on your thoughts...",
    "Let go of any tension...",
    "Maintain this peaceful state..."
  ];

  const toggleMeditation = () => {
    if (!isActive) {
      setIsActive(true);
      addAction("processing", "Starting mindfulness session...");
      progressMeditation();
    } else {
      setIsActive(false);
      addAction("complete", "Session paused");
    }
  };

  const progressMeditation = () => {
    if (currentStep < meditationSteps.length) {
      addAction("meditating", meditationSteps[currentStep]);
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        if (currentStep < meditationSteps.length - 1) {
          progressMeditation();
        } else {
          addAction("complete", "Meditation session completed");
          setIsActive(false);
          setCurrentStep(0);
        }
      }, 5000);
    }
  };

  const addAction = (type: string, description: string) => {
    const newAction = {
      id: crypto.randomUUID(),
      type,
      description,
      timestamp: new Date(),
    };
    setActions(prev => [newAction, ...prev].slice(0, 5));
  };

  return (
    <div className="flex min-h-screen w-full">
      <DynamicSidebar />
      
      <main className="flex-1 neural-bg">
        <div className="flex h-screen flex-col p-6">
          <div className="mb-4">
            <h1 className="text-2xl font-bold">Mindfulness Meditation</h1>
            <p className="text-muted-foreground">Brain-activity-aware mindfulness meditation</p>
          </div>

          <ScrollArea className="flex-1 rounded-lg border border-sidebar-border bg-background/50 p-4">
            <div className="space-y-4">
              <Button 
                onClick={toggleMeditation}
                className="w-full"
              >
                {isActive ? (
                  <>
                    <Pause className="mr-2 h-4 w-4" />
                    Pause Session
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Start Session
                  </>
                )}
              </Button>
              
              {isActive && (
                <div className="p-4 bg-accent/10 rounded-lg">
                  <p className="text-center text-lg">{meditationSteps[currentStep]}</p>
                  <div className="mt-4 flex justify-center">
                    <Brain className="w-8 h-8 text-accent animate-pulse" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </main>

      <div className="w-80 border-l border-sidebar-border bg-sidebar-background p-4 neural-bg">
        <h2 className="mb-4 text-lg font-semibold">Session Progress</h2>
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
                      action.type === "processing" ? "bg-yellow-500 animate-pulse" :
                      action.type === "meditating" ? "bg-purple-500 animate-pulse" :
                      action.type === "complete" ? "bg-accent" :
                      "bg-blue-500"
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

export default MindfulnessMeditation;

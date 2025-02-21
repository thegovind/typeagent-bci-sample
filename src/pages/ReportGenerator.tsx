
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { FileText } from "lucide-react";
import { useState } from "react";
import DynamicSidebar from "@/components/DynamicSidebar";
import { motion, AnimatePresence } from "framer-motion";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type ReadingLevel = "eli5" | "eli15" | "high-school" | "college" | "phd";

const ReportGenerator = () => {
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState<string>("");
  const [readingLevel, setReadingLevel] = useState<ReadingLevel>("college");
  const [actions, setActions] = useState<Array<{ id: string; type: string; description: string; timestamp: Date }>>([]);
  const { toast } = useToast();

  const getReportByReadingLevel = (level: ReadingLevel, brainActivity: number) => {
    // This would typically come from an API based on brain activity
    const reports = {
      eli5: "Your brain is working like a busy playground! Some parts are super excited and running around, while other parts are sitting quietly and thinking.",
      eli15: "Your current brain activity shows increased activity in regions associated with focus and problem-solving. The data suggests you're in a good state for learning.",
      "high-school": "Analysis indicates elevated cognitive engagement in prefrontal cortex regions, suggesting enhanced executive function and decision-making capabilities.",
      college: "The neural activity patterns demonstrate significant activation in areas associated with complex problem-solving and analytical thinking, with notable synchronization between frontal and parietal regions.",
      phd: "Quantitative analysis of neural oscillations reveals heightened synchronicity in beta and gamma bands, particularly in prefrontal and temporal regions, indicating enhanced cognitive processing and executive function optimization."
    };
    return reports[level];
  };

  const handleGenerate = () => {
    setGenerating(true);
    addAction("processing", "Analyzing brain activity...");
    
    setTimeout(() => {
      addAction("generating", `Adjusting report complexity to ${readingLevel} level...`);
      
      setTimeout(() => {
        const brainActivity = 75; // This would come from your brain activity monitor
        const newReport = getReportByReadingLevel(readingLevel, brainActivity);
        setReport(newReport);
        setGenerating(false);
        addAction("complete", "Report generated successfully!");
        
        toast({
          title: "Report Generated",
          description: `Report complexity adjusted to ${readingLevel} reading level`,
        });
      }, 2000);
    }, 1500);
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
            <h1 className="text-2xl font-bold">Report Generator</h1>
            <p className="text-muted-foreground">Generate brain-activity-aware reports</p>
          </div>

          <ScrollArea className="flex-1 rounded-lg border border-sidebar-border bg-background/50 p-4">
            <div className="space-y-4">
              <Button 
                onClick={handleGenerate}
                disabled={generating}
                className="w-full"
              >
                <FileText className="mr-2 h-4 w-4" />
                Generate Report
              </Button>
              
              {report && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Reading Level:</span>
                    <ToggleGroup
                      type="single"
                      value={readingLevel}
                      onValueChange={(value: ReadingLevel) => value && setReadingLevel(value)}
                      className="justify-end"
                    >
                      <ToggleGroupItem value="eli5" aria-label="ELI5">
                        ELI5
                      </ToggleGroupItem>
                      <ToggleGroupItem value="eli15" aria-label="ELI15">
                        ELI15
                      </ToggleGroupItem>
                      <ToggleGroupItem value="high-school" aria-label="High School">
                        High School
                      </ToggleGroupItem>
                      <ToggleGroupItem value="college" aria-label="College">
                        College
                      </ToggleGroupItem>
                      <ToggleGroupItem value="phd" aria-label="PhD">
                        PhD
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                  
                  <div className="p-4 bg-accent/10 rounded-lg">
                    <p>{report}</p>
                  </div>
                </motion.div>
              )}
            </div>
          </ScrollArea>
        </div>
      </main>

      <div className="w-80 border-l border-sidebar-border bg-sidebar-background p-4 neural-bg">
        <h2 className="mb-4 text-lg font-semibold">Generation Progress</h2>
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
                      action.type === "generating" ? "bg-green-500 animate-pulse" :
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

export default ReportGenerator;

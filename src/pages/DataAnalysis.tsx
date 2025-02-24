import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import DynamicSidebar from "@/components/DynamicSidebar";
import { motion, AnimatePresence } from "framer-motion";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type ReadingLevel = "eli5" | "eli15" | "high-school" | "college" | "phd";
type Dataset = "productivity" | "flowIntensity" | "heartRate" | "stress" | "learning";

interface DataPoint {
  timestamp: string;
  value: number;
}

interface FlowRecord {
  userId: string;
  _ts: number;  // epoch timestamp in seconds
  flowIntensityValues: number[];
  heartRateValues: number[];  // Add heart rate values
}

interface ProcessedFlowData {
  timestamp: string;
  value: number;
}

const SAMPLE_DATA: Record<Dataset, { data: DataPoint[], description: Record<ReadingLevel, string> }> = {
  productivity: {
    data: Array.from({ length: 7 }, (_, i) => ({
      timestamp: `Day ${i + 1}`,
      value: Math.floor(Math.random() * 40) + 60,
    })),
    description: {
      eli5: "Your brain was super busy and got lots of work done! The spiky line shows when you were most focused.",
      eli15: "Your productivity levels show consistent high performance, with peak efficiency during mid-week sessions.",
      "high-school": "The data indicates strong productivity patterns with notable peaks in cognitive performance during key work periods.",
      college: "Analysis reveals sustained high productivity levels with significant correlations between focus periods and task completion rates.",
      phd: "Statistical analysis demonstrates consistent productivity optimization with notable periodic variations in cognitive resource allocation.",
    }
  },
  flowIntensity: {
    data: Array.from({ length: 7 }, (_, i) => ({
      timestamp: `Day ${i + 1}`,
      value: Math.floor(Math.random() * 30) + 70,
    })),
    description: {
      eli5: "Your brain's flow was like a river, moving smoothly and powerfully!",
      eli15: "Your flow intensity shows strong patterns of deep engagement and concentration.",
      "high-school": "The flow intensity metrics indicate sustained states of optimal performance.",
      college: "Analysis shows enhanced flow states with optimal cognitive engagement during tasks.",
      phd: "Quantitative assessment reveals sustained flow state patterns with optimal psychological immersion.",
    }
  },
  heartRate: {
    data: Array.from({ length: 7 }, (_, i) => ({
      timestamp: `Day ${i + 1}`,
      value: Math.floor(Math.random() * 30) + 60, // Random heart rate between 60-90
    })),
    description: {
      eli5: "Your heart beat like a steady drum, helping your brain work at its best!",
      eli15: "Your heart rate patterns show good cardiovascular engagement during tasks.",
      "high-school": "Heart rate metrics indicate optimal physiological arousal for cognitive tasks.",
      college: "Analysis reveals consistent cardiovascular patterns correlating with cognitive performance.",
      phd: "Cardiac metrics demonstrate optimal autonomic regulation during cognitive engagement periods.",
    }
  },
  stress: {
    data: Array.from({ length: 7 }, (_, i) => ({
      timestamp: `Day ${i + 1}`,
      value: Math.floor(Math.random() * 40) + 30,
    })),
    description: {
      eli5: "Your stress was like waves in the ocean - sometimes big, sometimes small, but mostly calm!",
      eli15: "Your stress levels stayed mostly manageable, with some expected variations during challenging tasks.",
      "high-school": "Stress measurements indicate moderate variability with effective regulation during peak periods.",
      college: "Analysis reveals effective stress management patterns with notable resilience during high-demand intervals.",
      phd: "Longitudinal stress analysis indicates adaptive autonomic regulation with optimal allostatic load management.",
    }
  },
  learning: {
    data: Array.from({ length: 7 }, (_, i) => ({
      timestamp: `Day ${i + 1}`,
      value: Math.floor(Math.random() * 25) + 75,
    })),
    description: {
      eli5: "Your brain was like a sponge, soaking up new things and getting smarter every day!",
      eli15: "Your learning capacity showed great results, picking up new information quickly and effectively.",
      "high-school": "Learning metrics demonstrate strong knowledge acquisition and retention patterns.",
      college: "Analysis indicates enhanced cognitive plasticity with efficient information processing and integration.",
      phd: "Cognitive acquisition metrics reveal optimized neural plasticity with enhanced synaptic consolidation patterns.",
    }
  },
};

const processFlowData = (records: FlowRecord[], dataType: 'flow' | 'heart'): ProcessedFlowData[] => {
  const dailyAverages = records.reduce((acc, record) => {
    const date = new Date(record._ts * 1000).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = { sum: 0, count: 0 };
    }
    const value = dataType === 'flow' 
      ? (record.flowIntensityValues[0] || 0)
      : (record.heartRateValues[0] || 0);
    acc[date].sum += value;
    acc[date].count += 1;
    return acc;
  }, {} as Record<string, { sum: number; count: number }>);

  return Object.entries(dailyAverages).map(([date, { sum, count }]) => ({
    timestamp: date,
    value: Math.round(sum / count),
  }));
};

const getLineColor = (dataset: Dataset): string => {
  switch (dataset) {
    case 'flowIntensity':
      return 'rgb(147, 51, 234)';  // Tailwind purple-600
    case 'heartRate':
      return 'rgb(239, 68, 68)';   // Tailwind red-500
    default:
      return 'rgb(var(--accent))';
  }
};

const DataAnalysis = () => {
  const [selectedDataset, setSelectedDataset] = useState<Dataset>("flowIntensity");
  const [readingLevel, setReadingLevel] = useState<ReadingLevel>("college");
  const [actions, setActions] = useState<Array<{ id: string; type: string; description: string; timestamp: Date }>>([]);
  const { toast } = useToast();
  const [flowData, setFlowData] = useState<ProcessedFlowData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addAction = (type: string, description: string) => {
    const newAction = {
      id: crypto.randomUUID(),
      type,
      description,
      timestamp: new Date(),
    };
    setActions(prev => [newAction, ...prev].slice(0, 5));
  };

  const handleDatasetChange = (value: Dataset) => {
    setSelectedDataset(value);
    addAction("processing", `Analyzing ${value} dataset...`);
    
    setTimeout(() => {
      addAction("complete", "Analysis completed!");
      toast({
        title: "Analysis Complete",
        description: `Analysis of ${value} data completed successfully`,
      });
    }, 1500);
  };

  useEffect(() => {
    const fetchFlowData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`http://localhost:3000/api/getFlowIntensityData`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            days: 7
          }),
        });

        if (!response.ok) throw new Error('Failed to fetch flow data');
        
        const records: FlowRecord[] = await response.json();
        const processedData = processFlowData(
          records, 
          selectedDataset === 'flowIntensity' ? 'flow' : 'heart'
        );
        setFlowData(processedData);
        
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to fetch data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (selectedDataset === 'flowIntensity' || selectedDataset === 'heartRate') {
      fetchFlowData();
    }
  }, [selectedDataset]);

  const chartData = (selectedDataset === 'flowIntensity' || selectedDataset === 'heartRate') && flowData.length > 0
    ? flowData
    : SAMPLE_DATA[selectedDataset].data;

  return (
    <div className="flex min-h-screen w-full">
      <DynamicSidebar />
      
      <main className="flex-1 neural-bg">
        <div className="flex h-screen flex-col p-6">
          <div className="mb-4">
            <h1 className="text-2xl font-bold">Data Analysis</h1>
            <p className="text-muted-foreground">Analyze brain activity patterns</p>
          </div>

          <ScrollArea className="flex-1 rounded-lg border border-sidebar-border bg-background/50 p-4">
            <div className="space-y-6">
              <Select
                value={selectedDataset}
                onValueChange={(value: Dataset) => handleDatasetChange(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select dataset to analyze" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flowIntensity">Flow Intensity</SelectItem>
                  <SelectItem value="heartRate">Heart Rate</SelectItem>
                  <SelectItem value="productivity">Productivity Patterns</SelectItem>
                  <SelectItem value="stress">Stress Patterns</SelectItem>
                  <SelectItem value="learning">Learning Capacity</SelectItem>
                </SelectContent>
              </Select>

              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke={getLineColor(selectedDataset)}
                      strokeWidth={2}
                      dot={{ fill: getLineColor(selectedDataset) }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                    <div className="animate-spin h-6 w-6 border-2 border-accent border-t-transparent rounded-full" />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Analysis Complexity:</span>
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
                
                <motion.div 
                  className="p-4 bg-accent/10 rounded-lg"
                  key={`${selectedDataset}-${readingLevel}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <p>{SAMPLE_DATA[selectedDataset].description[readingLevel]}</p>
                </motion.div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </main>

      <div className="w-80 border-l border-sidebar-border bg-sidebar-background p-4 neural-bg">
        <h2 className="mb-4 text-lg font-semibold">Analysis Progress</h2>
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

export default DataAnalysis;

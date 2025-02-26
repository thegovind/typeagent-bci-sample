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

/**
 * Analyzes data points to find days with the most similar values
 * @param data Array of data points with timestamps and values
 * @param topCount Number of similar pairs to return
 * @returns Array of most similar day pairs sorted by smallest difference
 */
const findMostSimilarDays = (data: DataPoint[] | ProcessedFlowData[], topCount: number = 3): Array<{
  day1: string;
  day2: string;
  value1: number;
  value2: number;
  difference: number;
}> => {
  // Create all possible pairs of days
  const pairs: Array<{
    day1: string;
    day2: string;
    value1: number;
    value2: number;
    difference: number;
  }> = [];

  // Compare each day with every other day (only unique pairs)
  for (let i = 0; i < data.length; i++) {
    for (let j = i + 1; j < data.length; j++) {
      const day1 = data[i].timestamp;
      const day2 = data[j].timestamp;
      const value1 = data[i].value;
      const value2 = data[j].value;
      const difference = Math.abs(value1 - value2);

      pairs.push({
        day1,
        day2,
        value1,
        value2,
        difference
      });
    }
  }

  // Sort pairs by smallest difference
  const sortedPairs = [...pairs].sort((a, b) => a.difference - b.difference);

  // Return top N most similar pairs
  return sortedPairs.slice(0, topCount);
};

/**
 * Performs comparative analysis on flowIntensity and heartRate data
 * @param flowData Flow intensity data points
 * @param heartRateData Heart rate data points
 * @returns Analysis results for both datasets
 */
const performDualDatasetAnalysis = (
  flowData: ProcessedFlowData[],
  heartRateData: ProcessedFlowData[]
) => {
  const flowSimilarities = findMostSimilarDays(flowData);
  const heartRateSimilarities = findMostSimilarDays(heartRateData);
  
  return {
    flowIntensity: {
      datasetName: "Flow Intensity",
      color: "rgb(147, 51, 234)", // Purple
      similarities: flowSimilarities
    },
    heartRate: {
      datasetName: "Heart Rate",
      color: "rgb(239, 68, 68)", // Red
      similarities: heartRateSimilarities
    }
  };
};

const DataAnalysis = () => {
  const [selectedDataset, setSelectedDataset] = useState<Dataset>("flowIntensity");
  const [readingLevel, setReadingLevel] = useState<ReadingLevel>("college");
  const [actions, setActions] = useState<Array<{ id: string; type: string; description: string; timestamp: Date }>>([]);
  const { toast } = useToast();
  const [flowData, setFlowData] = useState<ProcessedFlowData[]>([]);
  const [heartRateData, setHeartRateData] = useState<ProcessedFlowData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [showAnalysisResults, setShowAnalysisResults] = useState(false);

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
        
        // Process both flow and heart rate data
        const processedFlowData = processFlowData(records, 'flow');
        const processedHeartRateData = processFlowData(records, 'heart');
        
        setFlowData(processedFlowData);
        setHeartRateData(processedHeartRateData);
        
        if (selectedDataset === 'flowIntensity') {
          setFlowData(processedFlowData);
        } else if (selectedDataset === 'heartRate') {
          setHeartRateData(processedHeartRateData);
        }
        
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

  const runSimilarityAnalysis = () => {
    if (flowData.length < 2 || heartRateData.length < 2) {
      toast({
        title: "Insufficient Data",
        description: "Need at least two days of data for comparison",
        variant: "destructive",
      });
      return;
    }

    addAction("processing", "Running similarity analysis...");
    setIsLoading(true);
    
    // Simulate processing time
    setTimeout(() => {
      const results = performDualDatasetAnalysis(flowData, heartRateData);
      setAnalysisResults(results);
      setShowAnalysisResults(true);
      setIsLoading(false);
      addAction("complete", "Similarity analysis completed!");
      
      toast({
        title: "Analysis Complete",
        description: "Days with similar patterns identified",
      });
    }, 1000);
  };

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

              <div className="flex flex-col items-center space-y-2 border-t border-b py-4 border-sidebar-border">
                <h3 className="text-lg font-medium">Data Similarity Analysis</h3>
                <p className="text-sm text-muted-foreground text-center mb-2">
                  Compare flow and heart rate patterns to find which days had similar brain activity
                </p>
                <Button 
                  onClick={runSimilarityAnalysis}
                  className="bg-accent hover:bg-accent/80 px-6 py-2 text-lg h-auto font-medium transition-all shadow-md hover:shadow-lg"
                  size="lg"
                  disabled={isLoading || !(flowData.length > 0 && heartRateData.length > 0)}
                >
                  {isLoading ? (
                    <>
                      <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-5 w-5 mr-2" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" 
                        />
                      </svg>
                      Find Similar Days
                    </>
                  )}
                </Button>
                {!(flowData.length > 0 && heartRateData.length > 0) && (
                  <p className="text-xs text-muted-foreground italic">
                    Select flow or heart rate data first to enable analysis
                  </p>
                )}
              </div>

              <AnimatePresence>
                {showAnalysisResults && analysisResults && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4"
                  >
                    <div className="flex justify-between items-center">
                      <h2 className="text-lg font-semibold">Similarity Analysis Results</h2>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setShowAnalysisResults(false)}
                      >
                        Hide
                      </Button>
                    </div>
                    
                    {Object.entries(analysisResults).map(([key, dataset]: [string, any]) => (
                      <motion.div 
                        key={key}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-accent/10 rounded-lg"
                      >
                        <h3 className="font-medium mb-2" style={{ color: dataset.color }}>
                          {dataset.datasetName} Patterns
                        </h3>
                        
                        {dataset.similarities.length > 0 ? (
                          <div className="space-y-2">
                            {dataset.similarities.map((pair: any, index: number) => (
                              <div key={index} className="flex items-center justify-between bg-background/50 p-3 rounded-md">
                                <div className="flex-1">
                                  <span className="font-medium">{pair.day1}</span> and <span className="font-medium">{pair.day2}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <span>{pair.value1}</span>
                                  <span>≈</span>
                                  <span>{pair.value2}</span>
                                  <span className="text-xs text-muted-foreground">
                                    (diff: {pair.difference.toFixed(1)})
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-sm">Not enough data available for comparison</p>
                        )}
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

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

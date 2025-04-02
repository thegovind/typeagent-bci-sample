import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef, useCallback } from "react";
import DynamicSidebar from "@/components/DynamicSidebar";
import { motion, AnimatePresence } from "framer-motion";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area } from 'recharts';
import EmotionAvatar, { EmotionState } from "@/components/ui/EmotionAvatar";

type ReadingLevel = "eli5" | "eli15" | "high-school" | "college" | "phd";
type Dataset = "productivity" | "flowIntensity" | "heartRate" | "stress" | "learning" | "flowAndHeart";

interface DataPoint {
  timestamp: string;
  value: number;
}

interface FlowRecord {
  userId: string;
  _ts: number;  // epoch timestamp in seconds
  flowActivityValues: number[];
  heartRateValues: number[];  // Add heart rate values
}

interface ProcessedFlowData {
  timestamp: string;
  value: number;
}

interface RawDataPoint {
  timestamp: string;
  value: number;
}

interface IntervalData {
  timestamp: string;
  min: number;
  max: number;
  average: number;
}

interface DailyInsights {
  flowIntensity: {
    average: number;
    peak: number;
    low: number;
    stability: number; // 0-100, higher means more stable
    peakTime: string;
    lowTime: string;
    deviation: number;
    outliers: { value: number; time: string }[];
  };
  heartRate: {
    average: number;
    peak: number;
    low: number;
    stability: number;
    peakTime: string;
    lowTime: string;
    deviation: number;
    outliers: { value: number; time: string }[];
  };
  correlation: number; // -1 to 1, correlation between flow and heart rate
  keyInsights: string[];
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
  flowAndHeart: {
    data: Array.from({ length: 7 }, (_, i) => ({
      timestamp: `Day ${i + 1}`,
      value: Math.floor(Math.random() * 30) + 70,
    })),
    description: {
      eli5: "Your brain and heart worked together like a well-oiled machine!",
      eli15: "Your flow and heart rate patterns show strong coordination between mental and physical states.",
      "high-school": "Analysis reveals synchronized patterns between cognitive flow and cardiovascular activity.",
      college: "Data indicates optimal coordination between mental engagement and physiological responses.",
      phd: "Quantitative assessment demonstrates strong neuro-cardiac coupling with optimal performance states.",
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
      ? (record.flowActivityValues[0] || 0)
      : (record.heartRateValues[0] || 0);
    if (value > 0) {
      acc[date].sum += value;
      acc[date].count += 1;
    }
    return acc;
  }, {} as Record<string, { sum: number; count: number }>);

  return Object.entries(dailyAverages).map(([date, { sum, count }]) => ({
    timestamp: date,
    value: count > 0 ? Math.round(sum / count) : 0,
  }));
};

const processRawData = (records: FlowRecord[], dataType: 'flow' | 'heart'): RawDataPoint[] => {
  return records.flatMap(record => {
    const values = dataType === 'flow' ? record.flowActivityValues : record.heartRateValues;
    return values.map((value, index) => ({
      timestamp: new Date(record._ts * 1000).toISOString(),
      value: value
    }));
  });
};

const processIntervalData = (data: RawDataPoint[], intervalMinutes: number = 5): IntervalData[] => {
  const intervals: { [key: string]: number[] } = {};
  
  data.forEach(point => {
    const date = new Date(point.timestamp);
    date.setMinutes(Math.floor(date.getMinutes() / intervalMinutes) * intervalMinutes);
    date.setSeconds(0);
    date.setMilliseconds(0);
    
    const key = date.toISOString();
    if (!intervals[key]) {
      intervals[key] = [];
    }
    if (point.value > 0) {
      intervals[key].push(point.value);
    }
  });

  return Object.entries(intervals).map(([timestamp, values]) => {
    if (values.length === 0) {
      return {
        timestamp,
        min: 0,
        max: 0,
        average: 0
      };
    }
    return {
      timestamp,
      min: Math.min(...values),
      max: Math.max(...values),
      average: values.reduce((a, b) => a + b, 0) / values.length
    };
  }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
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

const calculateCorrelation = (x: number[], y: number[]): number => {
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
  const sumX2 = x.reduce((a, b) => a + b * b, 0);
  const sumY2 = y.reduce((a, b) => a + b * b, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  return denominator === 0 ? 0 : numerator / denominator;
};

const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const analyzeDailyData = (
  flowData: RawDataPoint[],
  heartRateData: RawDataPoint[],
  day: string
): DailyInsights => {
  const dailyFlow = flowData.filter(point => 
    new Date(point.timestamp).toDateString() === new Date(day).toDateString()
  );
  const dailyHeartRate = heartRateData.filter(point => 
    new Date(point.timestamp).toDateString() === new Date(day).toDateString()
  );

  // Process data in 5-minute intervals
  const flowIntervals = processIntervalData(dailyFlow, 5);
  const heartRateIntervals = processIntervalData(dailyHeartRate, 5);

  const calculateStats = (intervals: IntervalData[]) => {
    const validValues = intervals.map(d => d.average).filter(v => v > 0);
    const validTimestamps = intervals.filter(d => d.average > 0).map(d => d.timestamp);
    
    if (validValues.length === 0) {
      return {
        average: 0,
        peak: 0,
        low: 0,
        stability: 0,
        peakTime: '',
        lowTime: '',
        deviation: 0,
        outliers: []
      };
    }

    const avg = validValues.reduce((a, b) => a + b, 0) / validValues.length;
    const max = Math.max(...validValues);
    const min = Math.min(...validValues);
    const maxIndex = validValues.indexOf(max);
    const minIndex = validValues.indexOf(min);
    
    const variance = validValues.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / validValues.length;
    const deviation = Math.sqrt(variance);
    const stability = Math.max(0, 100 - (deviation * 10));

    // Find outliers (values more than 2 standard deviations from mean)
    const outliers = intervals
      .filter(d => d.average > 0)
      .filter(d => Math.abs(d.average - avg) > 2 * deviation)
      .map(d => ({
        value: d.average,
        time: formatTime(d.timestamp)
      }));

    return {
      average: Math.round(avg),
      peak: max,
      low: min,
      stability: Math.round(stability),
      peakTime: validTimestamps[maxIndex],
      lowTime: validTimestamps[minIndex],
      deviation: Math.round(deviation),
      outliers
    };
  };

  const flowStats = calculateStats(flowIntervals);
  const heartRateStats = calculateStats(heartRateIntervals);

  const correlation = calculateCorrelation(
    flowIntervals.map(d => d.average),
    heartRateIntervals.map(d => d.average)
  );

  const keyInsights: string[] = [];
  
  // Flow intensity insights with integer values and timing
  if (flowStats.peak > 80) {
    keyInsights.push(`Peak flow intensity of ${Math.round(flowStats.peak)}% at ${formatTime(flowStats.peakTime)}`);
  }
  if (flowStats.stability > 80) {
    keyInsights.push(`Very stable flow state with ${flowStats.stability}% consistency`);
  }
  if (flowStats.outliers.length > 0) {
    const outlierTimes = flowStats.outliers.map(o => `${Math.round(o.value)}% at ${o.time}`).join(', ');
    keyInsights.push(`Notable flow intensity spikes: ${outlierTimes}`);
  }
  
  // Heart rate insights with timing
  if (heartRateStats.peak > 90) {
    keyInsights.push(`Notable heart rate peak of ${Math.round(heartRateStats.peak)} bpm at ${formatTime(heartRateStats.peakTime)}`);
  }
  if (heartRateStats.stability > 80) {
    keyInsights.push(`Consistent heart rate patterns with ${heartRateStats.stability}% stability`);
  }
  if (heartRateStats.outliers.length > 0) {
    const outlierTimes = heartRateStats.outliers.map(o => `${Math.round(o.value)} bpm at ${o.time}`).join(', ');
    keyInsights.push(`Notable heart rate variations: ${outlierTimes}`);
  }

  // Add deviation information
  keyInsights.push(`Flow intensity deviation: ${flowStats.deviation} points`);
  keyInsights.push(`Heart rate deviation: ${heartRateStats.deviation} bpm`);
  
  // Correlation insights with more detail
  if (Math.abs(correlation) > 0.7) {
    keyInsights.push(
      correlation > 0 
        ? `Strong positive correlation (${correlation.toFixed(2)}) between flow and heart rate`
        : `Strong negative correlation (${correlation.toFixed(2)}) between flow and heart rate`
    );
  } else if (Math.abs(correlation) > 0.3) {
    keyInsights.push(
      correlation > 0 
        ? `Moderate positive correlation (${correlation.toFixed(2)}) between flow and heart rate`
        : `Moderate negative correlation (${correlation.toFixed(2)}) between flow and heart rate`
    );
  } else {
    keyInsights.push(`Weak correlation (${correlation.toFixed(2)}) between flow and heart rate`);
  }

  // Break time suggestions
  const flowPeakTime = new Date(flowStats.peakTime);
  const heartRatePeakTime = new Date(heartRateStats.peakTime);
  const timeDiff = Math.abs(flowPeakTime.getTime() - heartRatePeakTime.getTime()) / (1000 * 60);
  
  if (timeDiff < 30) {
    const breakTime = new Date(flowPeakTime.getTime() + 45 * 60000);
    keyInsights.push(`Consider taking a 15-minute break around ${formatTime(breakTime.toISOString())} after your peak performance period`);
  } else {
    keyInsights.push(`Consider taking breaks after peak periods: around ${formatTime(flowPeakTime.toISOString())} and ${formatTime(heartRatePeakTime.toISOString())}`);
  }

  // Water intake suggestions
  const avgFlow = flowStats.average;
  const avgHeartRate = heartRateStats.average;
  let baseIntake = 2; // Base 2L per day
  
  if (avgFlow > 80) {
    baseIntake += 0.5;
  } else if (avgFlow > 60) {
    baseIntake += 0.3;
  }
  
  if (avgHeartRate > 80) {
    baseIntake += 0.5;
  } else if (avgHeartRate > 70) {
    baseIntake += 0.3;
  }
  
  keyInsights.push(`Recommended water intake: ${baseIntake.toFixed(1)}L based on your activity levels`);

  return {
    flowIntensity: flowStats,
    heartRate: heartRateStats,
    correlation,
    keyInsights
  };
};

const DataAnalysis = () => {
  const [selectedDataset, setSelectedDataset] = useState<Dataset>("flowIntensity");
  const [readingLevel, setReadingLevel] = useState<ReadingLevel>("college");
  const [selectedDay, setSelectedDay] = useState<string>(new Date().toLocaleDateString());
  const [viewMode, setViewMode] = useState<'weekly' | 'daily'>('daily');
  const [actions, setActions] = useState<Array<{ id: string; type: string; description: string; timestamp: Date }>>([]);
  const { toast } = useToast();
  const [flowData, setFlowData] = useState<ProcessedFlowData[]>([]);
  const [heartRateData, setHeartRateData] = useState<ProcessedFlowData[]>([]);
  const [rawFlowData, setRawFlowData] = useState<RawDataPoint[]>([]);
  const [rawHeartRateData, setRawHeartRateData] = useState<RawDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [showAnalysisResults, setShowAnalysisResults] = useState(false);
  const [dailyInsights, setDailyInsights] = useState<DailyInsights | null>(null);
  const [currentFlowValue, setCurrentFlowValue] = useState(50);
  const [currentHeartRate, setCurrentHeartRate] = useState(75);

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

  const handleDaySelect = (day: string) => {
    setSelectedDay(day);
    if (day && rawFlowData.length > 0 && rawHeartRateData.length > 0) {
      const insights = analyzeDailyData(rawFlowData, rawHeartRateData, day);
      setDailyInsights(insights);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
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

        if (!response.ok) throw new Error('Failed to fetch data');
        
        const records: FlowRecord[] = await response.json();
        
        // Always process both flow and heart rate data
        const processedFlowData = processFlowData(records, 'flow');
        const processedHeartRateData = processFlowData(records, 'heart');
        const rawFlowDataPoints = processRawData(records, 'flow');
        const rawHeartRateDataPoints = processRawData(records, 'heart');
        
        setFlowData(processedFlowData);
        setHeartRateData(processedHeartRateData);
        setRawFlowData(rawFlowDataPoints);
        setRawHeartRateData(rawHeartRateDataPoints);

        // Trigger initial analysis for the current day
        if (selectedDay && rawFlowDataPoints.length > 0 && rawHeartRateDataPoints.length > 0) {
          const insights = analyzeDailyData(rawFlowDataPoints, rawHeartRateDataPoints, selectedDay);
          setDailyInsights(insights);
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

    // Always fetch data when component mounts or when dataset changes
    fetchData();
  }, [selectedDataset, selectedDay]); // Keep selectedDay as a dependency

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

  const getDailyData = (day: string, dataType: 'flow' | 'heart') => {
    const rawData = dataType === 'flow' ? rawFlowData : rawHeartRateData;
    const dailyData = rawData.filter(point => {
      const pointDate = new Date(point.timestamp);
      const selectedDate = new Date(day);
      return pointDate.toDateString() === selectedDate.toDateString();
    });
    return processIntervalData(dailyData);
  };

  const calculateDataRange = (data: IntervalData[], dataType: 'flow' | 'heart' = 'heart') => {
    const validValues = data
      .map(d => d.average)
      .filter(v => v > 0);
    
    if (validValues.length === 0) {
      return { min: 0, max: dataType === 'flow' ? 150 : 100 };
    }

    const min = Math.min(...validValues);
    const max = Math.max(...validValues);
    
    // Add more padding to the range (15% on each side)
    const padding = (max - min) * 0.15;
    return {
      min: Math.max(0, Math.floor(min - padding)),
      max: dataType === 'flow' 
        ? Math.ceil(max + padding * 3) // Add 200% more padding for flow intensity
        : Math.min(100, Math.ceil(max + padding * 2.5)) // Keep heart rate capped at 100
    };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const chartData = (() => {
    if (selectedDataset === 'flowAndHeart' && flowData.length > 0 && heartRateData.length > 0) {
      return flowData.map((flow, index) => ({
        timestamp: flow.timestamp,
        flowValue: flow.value,
        heartValue: heartRateData[index]?.value || 0
      }));
    }
    if ((selectedDataset === 'flowIntensity' || selectedDataset === 'heartRate') && flowData.length > 0) {
      return flowData;
    }
    return SAMPLE_DATA[selectedDataset].data;
  })();

  const availableDays = chartData.map(point => point.timestamp);

  // Mock real-time data update function
  const updateRealTimeData = useCallback(() => {
    // Get newest flow value based on the most recent data point
    if (rawFlowData.length > 0) {
      const latestTimestamp = new Date(Math.max(...rawFlowData.map(d => new Date(d.timestamp).getTime())));
      const latestFlowData = rawFlowData.filter(d => 
        new Date(d.timestamp).getTime() === latestTimestamp.getTime()
      );
      
      if (latestFlowData.length > 0) {
        setCurrentFlowValue(latestFlowData[0].value);
      }
      
      const latestHeartData = rawHeartRateData.filter(d => 
        new Date(d.timestamp).getTime() === latestTimestamp.getTime()
      );
      
      if (latestHeartData.length > 0) {
        setCurrentHeartRate(latestHeartData[0].value);
      }
    }
  }, [rawFlowData, rawHeartRateData]);
  
  // Update real-time values whenever new data is loaded
  useEffect(() => {
    updateRealTimeData();
  }, [rawFlowData, rawHeartRateData, updateRealTimeData]);

  return (
    <div className="flex min-h-screen w-full">
      <DynamicSidebar />
      
      <main className="flex-1 neural-bg">
        <div className="flex h-screen flex-col p-6">
          <div className="mb-4">
            <h1 className="text-2xl font-bold">Data Analysis</h1>
            <p className="text-muted-foreground">Analyze daily activity patterns</p>
          </div>

          <ScrollArea className="flex-1 rounded-lg border border-sidebar-border bg-background/50 p-4">
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Select
                    value={selectedDataset}
                    onValueChange={(value: Dataset) => handleDatasetChange(value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select dataset to analyze" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flowAndHeart">Flow & Heart Rate</SelectItem>
                      <SelectItem value="flowIntensity">Flow Intensity</SelectItem>
                      <SelectItem value="heartRate">Heart Rate</SelectItem>
                      <SelectItem value="productivity">Productivity Patterns</SelectItem>
                      <SelectItem value="stress">Stress Patterns</SelectItem>
                      <SelectItem value="learning">Learning Capacity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <ToggleGroup
                  type="single"
                  value={viewMode}
                  onValueChange={(value: 'weekly' | 'daily') => value && setViewMode(value)}
                  className="justify-end"
                >
                  <ToggleGroupItem value="weekly" aria-label="Weekly View">
                    Weekly
                  </ToggleGroupItem>
                  <ToggleGroupItem value="daily" aria-label="Daily View">
                    Daily
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              {viewMode === 'weekly' ? (
                <div className="h-[300px] w-full">
                  <h3 className="text-lg font-medium mb-2">Weekly Overview</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      {selectedDataset === 'flowAndHeart' ? (
                        <>
                          <Line 
                            type="monotone" 
                            dataKey="flowValue" 
                            name="Flow Intensity"
                            stroke={getLineColor('flowIntensity')}
                            strokeWidth={2}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="heartValue" 
                            name="Heart Rate"
                            stroke={getLineColor('heartRate')}
                            strokeWidth={2}
                          />
                        </>
                      ) : (
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke={getLineColor(selectedDataset)}
                          strokeWidth={2}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                      <div className="animate-spin h-6 w-6 border-2 border-accent border-t-transparent rounded-full" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Daily Breakdown</h3>
                    <Select
                      value={selectedDay}
                      onValueChange={handleDaySelect}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a day to view detailed data" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDays.map((day) => (
                          <SelectItem key={day} value={day}>
                            {formatDate(day)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {selectedDay && dailyInsights && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="h-[200px] w-full">
                          <h4 className="text-sm font-medium mb-2">Flow Intensity</h4>
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={getDailyData(selectedDay, 'flow')}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                dataKey="timestamp" 
                                tickFormatter={formatTime}
                                interval="preserveStartEnd"
                              />
                              <YAxis 
                                domain={[
                                  (dataMin) => calculateDataRange(getDailyData(selectedDay, 'flow'), 'flow').min,
                                  (dataMax) => calculateDataRange(getDailyData(selectedDay, 'flow'), 'flow').max
                                ]}
                              />
                              <Tooltip 
                                labelFormatter={(label) => formatTime(label)}
                                formatter={(value, name) => [
                                  typeof value === 'number' ? value.toFixed(1) : value, 
                                  'Value'
                                ]}
                                contentStyle={{ color: 'black' }}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="average" 
                                stroke={getLineColor('flowIntensity')}
                                strokeWidth={2}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="h-[200px] w-full">
                          <h4 className="text-sm font-medium mb-2">Heart Rate</h4>
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={getDailyData(selectedDay, 'heart')}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                dataKey="timestamp" 
                                tickFormatter={formatTime}
                                interval="preserveStartEnd"
                              />
                              <YAxis 
                                domain={[
                                  (dataMin) => calculateDataRange(getDailyData(selectedDay, 'heart'), 'heart').min,
                                  (dataMax) => calculateDataRange(getDailyData(selectedDay, 'heart'), 'heart').max
                                ]}
                              />
                              <Tooltip 
                                labelFormatter={(label) => formatTime(label)}
                                formatter={(value, name) => [
                                  typeof value === 'number' ? value.toFixed(1) : value, 
                                  'Value'
                                ]}
                                contentStyle={{ color: 'black' }}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="average" 
                                stroke={getLineColor('heartRate')}
                                strokeWidth={2}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <br></br>
                      <div className="bg-accent/10 rounded-lg p-4 space-y-4">
                        <div className="text-sm space-y-1">
                          <h4 className="font-medium text-lg">Daily Insights</h4>
                        </div>
                        
                        {dailyInsights && (
                          <div className="grid grid-cols-3 gap-4">
                            {/* Column 1: Emotion Visualization */}
                            <div className="flex flex-col items-center justify-center">
                              <EmotionAvatar 
                                flowStats={dailyInsights.flowIntensity}
                                heartRateStats={dailyInsights.heartRate}
                                correlation={dailyInsights.correlation}
                                width={200}
                                height={150}
                              />
                            </div>
                            
                            {/* Column 2: Flow Intensity */}
                            <div className="space-y-2">
                              <h5 className="font-medium text-sm text-muted-foreground">Flow Intensity</h5>
                              <div className="text-sm space-y-1">
                                <p>Average: {Math.round(dailyInsights.flowIntensity.average)}%</p>
                                <p>Peak: {Math.round(dailyInsights.flowIntensity.peak)}%</p>
                                <p>Stability: {Math.round(dailyInsights.flowIntensity.stability)}%</p>
                                <p>Peak Time: {formatTime(dailyInsights.flowIntensity.peakTime)}</p>
                                <p>Deviation: {Math.round(dailyInsights.flowIntensity.deviation)}%</p>
                              </div>
                            </div>
                            
                            {/* Column 3: Heart Rate */}
                            <div className="space-y-2">
                              <h5 className="font-medium text-sm text-muted-foreground">Heart Rate</h5>
                              <div className="text-sm space-y-1">
                                <p>Average: {Math.round(dailyInsights.heartRate.average)} bpm</p>
                                <p>Peak: {Math.round(dailyInsights.heartRate.peak)} bpm</p>
                                <p>Stability: {Math.round(dailyInsights.heartRate.stability)}%</p>
                                <p>Peak Time: {formatTime(dailyInsights.heartRate.peakTime)}</p>
                                <p>Deviation: {Math.round(dailyInsights.heartRate.deviation)} bpm</p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {dailyInsights && (
                          <div className="space-y-2">
                            <h5 className="font-medium text-sm text-muted-foreground">Key Insights</h5>
                            <ul className="list-disc list-inside text-sm space-y-1">
                              {dailyInsights.keyInsights.map((insight, index) => (
                                <li key={index}>{insight}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

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

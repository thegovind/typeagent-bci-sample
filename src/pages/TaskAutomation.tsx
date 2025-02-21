import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Plus, Play } from "lucide-react";
import { useState } from "react";
import DynamicSidebar from "@/components/DynamicSidebar";
import { motion, AnimatePresence } from "framer-motion";

interface Task {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed';
}

const TaskAutomation = () => {
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', name: 'Daily Report Generation', status: 'pending' },
    { id: '2', name: 'Data Backup', status: 'pending' },
    { id: '3', name: 'Email Summary', status: 'pending' },
  ]);
  const [actions, setActions] = useState<Array<{ id: string; type: string; description: string; timestamp: Date }>>([]);
  const { toast } = useToast();

  const runTask = (taskId: string) => {
    addAction("processing", `Starting task automation...`);
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, status: 'running' } : task
    ));
    
    setTimeout(() => {
      addAction("running", "Executing automated workflow...");
      
      setTimeout(() => {
        setTasks(prev => prev.map(task => 
          task.id === taskId ? { ...task, status: 'completed' } : task
        ));
        addAction("complete", "Task completed successfully!");
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
            <h1 className="text-2xl font-bold">Task Automation</h1>
            <p className="text-muted-foreground">Automate your workflows with brain-activity-aware scheduling</p>
          </div>

          <ScrollArea className="flex-1 rounded-lg border border-sidebar-border bg-background/50 p-4">
            <div className="space-y-4">
              <Button className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add New Task
              </Button>
              
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 rounded-lg border border-sidebar-border bg-background/50 flex items-center justify-between"
                  >
                    <div>
                      <h3 className="font-medium">{task.name}</h3>
                      <span className={`text-sm ${
                        task.status === 'completed' ? 'text-green-500' :
                        task.status === 'running' ? 'text-yellow-500' :
                        'text-muted-foreground'
                      }`}>
                        {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => runTask(task.id)}
                      disabled={task.status !== 'pending'}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        </div>
      </main>

      <div className="w-80 border-l border-sidebar-border bg-sidebar-background p-4 neural-bg">
        <h2 className="mb-4 text-lg font-semibold">Automation Progress</h2>
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
                      action.type === "running" ? "bg-blue-500 animate-pulse" :
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

export default TaskAutomation;
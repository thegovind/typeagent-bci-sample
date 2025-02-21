import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const VoiceInterface = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");

  const toggleListening = () => {
    if (!isListening) {
      toast("Voice recognition started");
      setIsListening(true);
      // Simulate voice input
      setTimeout(() => {
        setTranscript("Analyzing data for Q4 report...");
      }, 1000);
    } else {
      setIsListening(false);
      setTranscript("");
      toast("Voice recognition stopped");
    }
  };

  return (
    <div className="p-4 border border-sidebar-border rounded-lg bg-sidebar-background/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Voice Interface</h3>
        <Button
          variant="outline"
          size="icon"
          className={`${isListening ? "text-accent border-accent" : ""}`}
          onClick={toggleListening}
        >
          {isListening ? (
            <Mic className="h-4 w-4" />
          ) : (
            <MicOff className="h-4 w-4" />
          )}
        </Button>
      </div>

      {isListening && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-muted-foreground"
        >
          {transcript || "Listening..."}
        </motion.div>
      )}

      {isListening && (
        <div className="mt-4 flex gap-1">
          {[1,2,3,4].map((i) => (
            <motion.div
              key={i}
              className="flex-1 h-1 bg-accent rounded-full"
              animate={{
                scaleY: [1, 2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.1
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default VoiceInterface;
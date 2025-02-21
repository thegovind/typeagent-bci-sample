
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import DynamicSidebar from "@/components/DynamicSidebar";
import { Bluetooth, Waves, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const Settings = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<{ name: string; batteryLevel: number } | null>(null);

  const handleConnect = async () => {
    setIsScanning(true);
    toast("Scanning for BlueberryX devices...");
    
    // Simulate device discovery
    setTimeout(() => {
      setIsScanning(false);
      setIsConnected(true);
      setDeviceInfo({
        name: "BlueberryX-892",
        batteryLevel: 85
      });
      toast.success("Connected to BlueberryX device!");
    }, 2000);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setDeviceInfo(null);
    toast.success("Disconnected from BlueberryX device");
  };

  return (
    <div className="flex min-h-screen w-full">
      <DynamicSidebar />
      
      <main className="flex-1 neural-bg">
        <div className="flex h-screen flex-col p-6">
          <div className="mb-4">
            <h1 className="text-2xl font-bold">BCI Device Settings</h1>
            <p className="text-muted-foreground">Configure your BlueberryX wearable device</p>
          </div>

          <ScrollArea className="flex-1 rounded-lg border border-sidebar-border bg-background/50 p-4">
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="p-6 border border-sidebar-border rounded-lg bg-background/50">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Bluetooth className="h-5 w-5" />
                  Device Connection
                </h2>
                
                <div className="space-y-4">
                  {!isConnected ? (
                    <Button 
                      onClick={handleConnect}
                      disabled={isScanning}
                      className="w-full"
                    >
                      {isScanning ? "Scanning..." : "Connect BlueberryX Device"}
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-accent/10 rounded-lg">
                        <div>
                          <h3 className="font-medium">{deviceInfo?.name}</h3>
                          <p className="text-sm text-muted-foreground">Battery: {deviceInfo?.batteryLevel}%</p>
                        </div>
                        <Button variant="outline" onClick={handleDisconnect}>
                          Disconnect
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 border border-sidebar-border rounded-lg bg-background/50">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Waves className="h-5 w-5" />
                  Data Stream Configuration
                </h2>
                <div className="space-y-4">
                  <div className="p-4 bg-accent/10 rounded-lg">
                    <h3 className="font-medium mb-2">fNIRS Data Stream</h3>
                    <p className="text-sm text-muted-foreground">
                      Receiving real-time functional near-infrared spectroscopy data from the BlueberryX device.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 border border-sidebar-border rounded-lg bg-background/50">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Device Information
                </h2>
                <div className="space-y-2 text-sm">
                  <p><strong>Device Type:</strong> BlueberryX Wearable {deviceInfo ? "(Connected)" : "(Not Connected)"}</p>
                  <p><strong>Form Factor:</strong> Smart Glasses / Wearable Hat</p>
                  <p><strong>Sensor Type:</strong> fNIRS (functional near-infrared spectroscopy)</p>
                  <p><strong>Data Rate:</strong> 100Hz</p>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </main>
    </div>
  );
};

export default Settings;


import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import JobsMonitor from '@/components/JobsMonitor';
import Stats from '@/components/Stats';

export default function Index() {
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [apiKey, setApiKey] = useState('');
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);

  const handleConnect = async () => {
    if (!apiEndpoint || !apiKey) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    // Here you would implement the actual connection logic to the API
    try {
      setIsConnected(true);
      toast({
        title: "Success",
        description: "Successfully connected to Control-M",
      });
    } catch (error) {
      toast({
        title: "Connection error",
        description: "Could not connect to Control-M",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tighter text-gray-900 dark:text-gray-50 sm:text-5xl md:text-6xl">
            Control-M Automation
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Manage your workloads with simplicity and efficiency
          </p>
        </div>

        {!isConnected ? (
          <Card className="p-6 backdrop-blur-sm bg-white/30 dark:bg-black/30 border border-gray-200 dark:border-gray-800">
            <div className="space-y-4">
              <div>
                <label htmlFor="endpoint" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  API Endpoint
                </label>
                <Input
                  id="endpoint"
                  placeholder="https://your-control-m.company.com/automation-api"
                  value={apiEndpoint}
                  onChange={(e) => setApiEndpoint(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  API Key
                </label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="Your API key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full"
                />
              </div>
              <Button onClick={handleConnect} className="w-full">
                Connect
              </Button>
            </div>
          </Card>
        ) : (
          <Tabs defaultValue="monitor" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="monitor">Job Monitor</TabsTrigger>
              <TabsTrigger value="stats">Statistics</TabsTrigger>
            </TabsList>
            <TabsContent value="monitor">
              <JobsMonitor endpoint={apiEndpoint} apiKey={apiKey} />
            </TabsContent>
            <TabsContent value="stats">
              <Stats endpoint={apiEndpoint} apiKey={apiKey} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

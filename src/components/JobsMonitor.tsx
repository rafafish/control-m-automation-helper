
import { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Job {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'failed' | 'waiting';
  startTime?: string;
  endTime?: string;
}

interface JobsMonitorProps {
  endpoint: string;
  apiKey: string;
}

export default function JobsMonitor({ endpoint, apiKey }: JobsMonitorProps) {
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    // Simulação de dados - em produção, você faria a chamada real à API
    const mockJobs: Job[] = [
      { id: '1', name: 'ETL_Daily', status: 'running', startTime: new Date().toISOString() },
      { id: '2', name: 'Backup_Weekly', status: 'completed', startTime: new Date().toISOString(), endTime: new Date().toISOString() },
      { id: '3', name: 'Report_Generation', status: 'waiting' },
    ];
    setJobs(mockJobs);
  }, []);

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Monitor de Jobs</h2>
      <ScrollArea className="h-[600px] w-full">
        <div className="space-y-4">
          {jobs.map((job) => (
            <Card key={job.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{job.name}</h3>
                  <p className="text-sm text-gray-500">ID: {job.id}</p>
                </div>
                <Badge
                  variant={
                    job.status === 'completed' ? 'default' :
                    job.status === 'running' ? 'secondary' :
                    job.status === 'failed' ? 'destructive' : 'outline'
                  }
                >
                  {job.status.toUpperCase()}
                </Badge>
              </div>
              {job.startTime && (
                <div className="mt-2 text-sm text-gray-500">
                  <p>Início: {new Date(job.startTime).toLocaleString()}</p>
                  {job.endTime && <p>Fim: {new Date(job.endTime).toLocaleString()}</p>}
                </div>
              )}
            </Card>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}

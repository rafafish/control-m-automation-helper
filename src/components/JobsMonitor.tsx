
import { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Filter, CheckCircle, Clock, RefreshCw, Search } from "lucide-react";

interface Job {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'failed' | 'waiting';
  application?: string;
  subApplication?: string;
  folder?: string;
  startTime?: string;
  endTime?: string;
  errorMessage?: string;
  comment?: string;
  solution?: string;
  isBeingChecked?: boolean;
  isFixed?: boolean;
}

interface JobsMonitorProps {
  endpoint: string;
  apiKey: string;
}

export default function JobsMonitor({ endpoint, apiKey }: JobsMonitorProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [failedJobs, setFailedJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [filters, setFilters] = useState({
    name: '',
    application: '',
    subApplication: '',
    folder: '',
    showFixed: false,
  });
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const { toast } = useToast();
  const [refreshInterval, setRefreshInterval] = useState<number>(60000); // 1 minuto por padrão

  useEffect(() => {
    // Simulação de dados - em produção, você faria a chamada real à API do Control-M
    const mockJobs: Job[] = [
      { 
        id: '1', 
        name: 'ETL_Daily', 
        status: 'failed', 
        application: 'Finance', 
        subApplication: 'Accounting', 
        folder: 'Daily_Jobs', 
        startTime: new Date().toISOString(), 
        endTime: new Date().toISOString(),
        errorMessage: 'Connection timeout to database server'
      },
      { 
        id: '2', 
        name: 'Backup_Weekly', 
        status: 'completed', 
        application: 'IT', 
        subApplication: 'Infrastructure', 
        folder: 'Weekly_Jobs', 
        startTime: new Date().toISOString(), 
        endTime: new Date().toISOString() 
      },
      { 
        id: '3', 
        name: 'Report_Generation', 
        status: 'failed', 
        application: 'HR', 
        subApplication: 'Payroll', 
        folder: 'Monthly_Jobs', 
        startTime: new Date().toISOString(),
        errorMessage: 'Invalid input parameters'
      },
      { 
        id: '4', 
        name: 'Data_Sync', 
        status: 'failed', 
        application: 'Sales', 
        subApplication: 'CRM', 
        folder: 'Daily_Jobs', 
        startTime: new Date().toISOString(),
        errorMessage: 'Failed to connect to remote server'
      },
    ];
    
    setJobs(mockJobs);
    const failed = mockJobs.filter(job => job.status === 'failed');
    setFailedJobs(failed);
    setFilteredJobs(failed);
  }, []);

  // Adicionar a lógica para atualizar periodicamente
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchFailedJobs();
    }, refreshInterval);
    
    return () => clearInterval(intervalId);
  }, [refreshInterval]);

  const fetchFailedJobs = () => {
    // Aqui você implementaria a chamada real à API Control-M
    // Por enquanto, vamos simular adicionando um novo job aleatório com falha

    const newJob: Job = { 
      id: Date.now().toString(), 
      name: `Job_${Math.floor(Math.random() * 1000)}`, 
      status: 'failed', 
      application: ['Finance', 'IT', 'HR', 'Sales'][Math.floor(Math.random() * 4)], 
      subApplication: ['Reporting', 'Processing', 'Backup', 'Analysis'][Math.floor(Math.random() * 4)], 
      folder: ['Daily_Jobs', 'Weekly_Jobs', 'Monthly_Jobs'][Math.floor(Math.random() * 3)], 
      startTime: new Date().toISOString(),
      errorMessage: ['Database error', 'Network timeout', 'Invalid parameters', 'Authentication failed'][Math.floor(Math.random() * 4)]
    };
    
    setJobs(prev => [...prev, newJob]);
    setFailedJobs(prev => [...prev, newJob]);
    applyFilters([...failedJobs, newJob]);
    
    toast({
      title: "Novo job com falha detectado",
      description: `${newJob.name} falhou com erro: ${newJob.errorMessage}`,
      variant: "destructive",
    });
  };

  const applyFilters = (jobsToFilter = failedJobs) => {
    let result = jobsToFilter;
    
    if (filters.name) {
      result = result.filter(job => job.name.toLowerCase().includes(filters.name.toLowerCase()));
    }
    
    if (filters.application) {
      result = result.filter(job => job.application?.toLowerCase().includes(filters.application.toLowerCase()));
    }
    
    if (filters.subApplication) {
      result = result.filter(job => job.subApplication?.toLowerCase().includes(filters.subApplication.toLowerCase()));
    }
    
    if (filters.folder) {
      result = result.filter(job => job.folder?.toLowerCase().includes(filters.folder.toLowerCase()));
    }
    
    if (!filters.showFixed) {
      result = result.filter(job => !job.isFixed);
    }
    
    setFilteredJobs(result);
  };

  const handleFilterChange = (field: string, value: string | boolean) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    
    // Aplicar os novos filtros imediatamente
    let result = failedJobs;
    
    if (newFilters.name) {
      result = result.filter(job => job.name.toLowerCase().includes(newFilters.name.toLowerCase()));
    }
    
    if (newFilters.application) {
      result = result.filter(job => job.application?.toLowerCase().includes(newFilters.application.toLowerCase()));
    }
    
    if (newFilters.subApplication) {
      result = result.filter(job => job.subApplication?.toLowerCase().includes(newFilters.subApplication.toLowerCase()));
    }
    
    if (newFilters.folder) {
      result = result.filter(job => job.folder?.toLowerCase().includes(newFilters.folder.toLowerCase()));
    }
    
    if (!newFilters.showFixed) {
      result = result.filter(job => !job.isFixed);
    }
    
    setFilteredJobs(result);
  };

  const handleJobClick = (job: Job) => {
    setSelectedJob(job);
  };

  const saveComment = () => {
    if (!selectedJob) return;
    
    setFailedJobs(prev => 
      prev.map(job => 
        job.id === selectedJob.id ? selectedJob : job
      )
    );
    
    applyFilters();
    
    toast({
      title: "Comentário salvo",
      description: `Comentário para ${selectedJob.name} foi salvo com sucesso`,
    });
  };

  const markAsChecking = () => {
    if (!selectedJob) return;
    
    const updatedJob = { ...selectedJob, isBeingChecked: true };
    setSelectedJob(updatedJob);
    
    setFailedJobs(prev => 
      prev.map(job => 
        job.id === updatedJob.id ? updatedJob : job
      )
    );
    
    applyFilters();
    
    toast({
      title: "Status atualizado",
      description: `${updatedJob.name} marcado como "Em verificação"`,
    });
  };

  const markAsFixed = () => {
    if (!selectedJob) return;
    
    const updatedJob = { ...selectedJob, isFixed: true, isBeingChecked: false };
    setSelectedJob(updatedJob);
    
    setFailedJobs(prev => 
      prev.map(job => 
        job.id === updatedJob.id ? updatedJob : job
      )
    );
    
    applyFilters();
    
    toast({
      title: "Status atualizado",
      description: `${updatedJob.name} marcado como "Corrigido"`,
    });
  };

  const refreshJobs = () => {
    fetchFailedJobs();
    toast({
      title: "Atualizando jobs",
      description: "Buscando jobs com falha...",
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="p-6 lg:col-span-2">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Monitor de Jobs com Falha</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={refreshJobs}>
              <RefreshCw className="h-4 w-4 mr-1" /> Atualizar
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <div className="flex items-center mb-1">
              <Search className="h-4 w-4 mr-1 text-gray-500" />
              <label className="text-sm font-medium">Nome do Job</label>
            </div>
            <Input 
              placeholder="Filtrar por nome" 
              value={filters.name}
              onChange={(e) => handleFilterChange('name', e.target.value)}
            />
          </div>
          <div>
            <div className="flex items-center mb-1">
              <Filter className="h-4 w-4 mr-1 text-gray-500" />
              <label className="text-sm font-medium">Application</label>
            </div>
            <Input 
              placeholder="Filtrar por application" 
              value={filters.application}
              onChange={(e) => handleFilterChange('application', e.target.value)}
            />
          </div>
          <div>
            <div className="flex items-center mb-1">
              <Filter className="h-4 w-4 mr-1 text-gray-500" />
              <label className="text-sm font-medium">SubApplication</label>
            </div>
            <Input 
              placeholder="Filtrar por subApplication" 
              value={filters.subApplication}
              onChange={(e) => handleFilterChange('subApplication', e.target.value)}
            />
          </div>
          <div>
            <div className="flex items-center mb-1">
              <Filter className="h-4 w-4 mr-1 text-gray-500" />
              <label className="text-sm font-medium">Folder</label>
            </div>
            <Input 
              placeholder="Filtrar por folder" 
              value={filters.folder}
              onChange={(e) => handleFilterChange('folder', e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex items-center mb-4">
          <Button 
            variant={filters.showFixed ? "default" : "outline"} 
            size="sm"
            onClick={() => handleFilterChange('showFixed', !filters.showFixed)}
            className="mr-2"
          >
            {filters.showFixed ? "Esconder Corrigidos" : "Mostrar Corrigidos"}
          </Button>
          <span className="text-sm text-gray-500">
            Mostrando {filteredJobs.length} de {failedJobs.length} jobs com falha
          </span>
        </div>
        
        <ScrollArea className="h-[500px] w-full">
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <Card 
                key={job.id} 
                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer ${
                  selectedJob?.id === job.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => handleJobClick(job)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{job.name}</h3>
                    <div className="grid grid-cols-2 text-sm text-gray-500 mt-1">
                      <p>Application: {job.application || 'N/A'}</p>
                      <p>SubApplication: {job.subApplication || 'N/A'}</p>
                      <p>Folder: {job.folder || 'N/A'}</p>
                      <p>ID: {job.id}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <Badge variant="destructive">
                      FALHA
                    </Badge>
                    {job.isBeingChecked && (
                      <Badge variant="secondary">
                        <Clock className="h-3 w-3 mr-1" /> Em verificação
                      </Badge>
                    )}
                    {job.isFixed && (
                      <Badge variant="default">
                        <CheckCircle className="h-3 w-3 mr-1" /> Corrigido
                      </Badge>
                    )}
                  </div>
                </div>
                {job.startTime && (
                  <div className="mt-2 text-sm text-gray-500">
                    <p>Início: {new Date(job.startTime).toLocaleString()}</p>
                    {job.endTime && <p>Fim: {new Date(job.endTime).toLocaleString()}</p>}
                  </div>
                )}
                {job.errorMessage && (
                  <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-md text-sm">
                    <p className="font-medium text-red-600 dark:text-red-400">Erro:</p>
                    <p className="text-red-600 dark:text-red-400">{job.errorMessage}</p>
                  </div>
                )}
                {job.comment && (
                  <div className="mt-2">
                    <p className="text-sm font-medium">Comentário:</p>
                    <p className="text-sm">{job.comment}</p>
                  </div>
                )}
                {job.solution && (
                  <div className="mt-2">
                    <p className="text-sm font-medium">Solução:</p>
                    <p className="text-sm">{job.solution}</p>
                  </div>
                )}
              </Card>
            ))}
            {filteredJobs.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nenhum job com falha encontrado com os filtros aplicados.
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>
      
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Detalhes do Job</h2>
        {selectedJob ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">{selectedJob.name}</h3>
              <p className="text-sm text-gray-500">ID: {selectedJob.id}</p>
              {selectedJob.application && (
                <p className="text-sm text-gray-500">Application: {selectedJob.application}</p>
              )}
              {selectedJob.subApplication && (
                <p className="text-sm text-gray-500">SubApplication: {selectedJob.subApplication}</p>
              )}
              {selectedJob.folder && (
                <p className="text-sm text-gray-500">Folder: {selectedJob.folder}</p>
              )}
            </div>
            
            {selectedJob.errorMessage && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
                <p className="font-medium text-red-600 dark:text-red-400">Erro:</p>
                <p className="text-red-600 dark:text-red-400">{selectedJob.errorMessage}</p>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Comentário
              </label>
              <Textarea
                placeholder="Adicione um comentário sobre o erro"
                value={selectedJob.comment || ''}
                onChange={(e) => setSelectedJob({...selectedJob, comment: e.target.value})}
                className="mb-2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Solução
              </label>
              <Textarea
                placeholder="Descreva a solução aplicada"
                value={selectedJob.solution || ''}
                onChange={(e) => setSelectedJob({...selectedJob, solution: e.target.value})}
                className="mb-4"
              />
            </div>
            
            <div className="flex justify-between">
              <div className="space-x-2">
                <Button
                  variant={selectedJob.isBeingChecked ? "secondary" : "outline"}
                  onClick={markAsChecking}
                >
                  <Clock className="h-4 w-4 mr-1" />
                  {selectedJob.isBeingChecked ? "Em verificação" : "Marcar em verificação"}
                </Button>
                <Button
                  variant={selectedJob.isFixed ? "default" : "outline"}
                  onClick={markAsFixed}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  {selectedJob.isFixed ? "Corrigido" : "Marcar como corrigido"}
                </Button>
              </div>
              <Button onClick={saveComment}>
                Salvar
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-10 text-gray-500">
            Selecione um job para ver os detalhes
          </div>
        )}
      </Card>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { 
  Filter, 
  CheckCircle, 
  Clock, 
  RefreshCw, 
  Search, 
  Calendar as CalendarIcon,
  FileSpreadsheet
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import * as XLSX from 'xlsx';

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
    todayOnly: false,
  });
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const { toast } = useToast();
  const [refreshInterval, setRefreshInterval] = useState<number>(60000); // 1 minute by default
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
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
      { 
        id: '5', 
        name: 'Yesterday_Job', 
        status: 'failed', 
        application: 'Finance', 
        subApplication: 'Reporting', 
        folder: 'Daily_Jobs', 
        startTime: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
        errorMessage: 'Data validation error'
      },
    ];
    
    setJobs(mockJobs);
    const failed = mockJobs.filter(job => job.status === 'failed');
    setFailedJobs(failed);
    setFilteredJobs(failed);
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchFailedJobs();
    }, refreshInterval);
    
    return () => clearInterval(intervalId);
  }, [refreshInterval]);

  const fetchFailedJobs = () => {
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
      title: "New failed job detected",
      description: `${newJob.name} failed with error: ${newJob.errorMessage}`,
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
    
    if (filters.todayOnly) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      result = result.filter(job => {
        if (!job.startTime) return false;
        const jobDate = new Date(job.startTime);
        return jobDate >= today;
      });
    } else if (selectedDate) {
      const filterDate = new Date(selectedDate);
      filterDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(filterDate);
      nextDay.setDate(filterDate.getDate() + 1);
      
      result = result.filter(job => {
        if (!job.startTime) return false;
        const jobDate = new Date(job.startTime);
        return jobDate >= filterDate && jobDate < nextDay;
      });
    }
    
    setFilteredJobs(result);
  };

  const handleFilterChange = (field: string, value: string | boolean) => {
    if (field === 'todayOnly' && value === true) {
      setSelectedDate(undefined);
    }
    
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    
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
    
    if (newFilters.todayOnly) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      result = result.filter(job => {
        if (!job.startTime) return false;
        const jobDate = new Date(job.startTime);
        return jobDate >= today;
      });
    } else if (selectedDate) {
      const filterDate = new Date(selectedDate);
      filterDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(filterDate);
      nextDay.setDate(filterDate.getDate() + 1);
      
      result = result.filter(job => {
        if (!job.startTime) return false;
        const jobDate = new Date(job.startTime);
        return jobDate >= filterDate && jobDate < nextDay;
      });
    }
    
    setFilteredJobs(result);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    
    if (date) {
      setFilters(prev => ({...prev, todayOnly: false}));
    }
    
    applyFilters();
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
      title: "Comment saved",
      description: `Comment for ${selectedJob.name} has been saved successfully`,
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
      title: "Status updated",
      description: `${updatedJob.name} marked as "Being checked"`,
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
      title: "Status updated",
      description: `${updatedJob.name} marked as "Fixed"`,
    });
  };

  const refreshJobs = () => {
    fetchFailedJobs();
    toast({
      title: "Refreshing jobs",
      description: "Fetching failed jobs...",
    });
  };
  
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredJobs.map(job => ({
        ID: job.id,
        Name: job.name,
        Status: job.status,
        Application: job.application || 'N/A',
        SubApplication: job.subApplication || 'N/A',
        Folder: job.folder || 'N/A',
        StartTime: job.startTime ? new Date(job.startTime).toLocaleString() : 'N/A',
        EndTime: job.endTime ? new Date(job.endTime).toLocaleString() : 'N/A',
        Error: job.errorMessage || 'N/A',
        Comment: job.comment || 'N/A',
        Solution: job.solution || 'N/A',
        JobStatus: job.isFixed ? 'Fixed' : (job.isBeingChecked ? 'Being checked' : 'Failed')
      }))
    );
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Failed Jobs');
    
    const dateStr = selectedDate 
      ? format(selectedDate, 'yyyy-MM-dd')
      : filters.todayOnly 
        ? format(new Date(), 'yyyy-MM-dd') 
        : 'all-dates';
    
    XLSX.writeFile(workbook, `control-m-failed-jobs-${dateStr}.xlsx`);
    
    toast({
      title: "Export successful",
      description: "Failed jobs exported to Excel",
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="p-6 lg:col-span-2">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Failed Jobs Monitor</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={refreshJobs}>
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={exportToExcel}
              className="flex items-center"
            >
              <FileSpreadsheet className="h-4 w-4 mr-1" /> Export
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <div className="flex items-center mb-1">
              <Search className="h-4 w-4 mr-1 text-gray-500" />
              <label className="text-sm font-medium">Job Name</label>
            </div>
            <Input 
              placeholder="Filter by name" 
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
              placeholder="Filter by application" 
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
              placeholder="Filter by subApplication" 
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
              placeholder="Filter by folder" 
              value={filters.folder}
              onChange={(e) => handleFilterChange('folder', e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Button 
            variant={filters.showFixed ? "default" : "outline"} 
            size="sm"
            onClick={() => handleFilterChange('showFixed', !filters.showFixed)}
            className="mr-2"
          >
            {filters.showFixed ? "Hide Fixed" : "Show Fixed"}
          </Button>
          
          <Button 
            variant={filters.todayOnly ? "default" : "outline"} 
            size="sm"
            onClick={() => handleFilterChange('todayOnly', !filters.todayOnly)}
            className="mr-2"
          >
            <CalendarIcon className="h-4 w-4 mr-1" />
            {filters.todayOnly ? "All Dates" : "Today Only"}
          </Button>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={selectedDate ? "default" : "outline"}
                size="sm"
                className={cn(
                  "mr-2",
                  selectedDate && "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                <CalendarIcon className="h-4 w-4 mr-1" />
                {selectedDate ? format(selectedDate, "MMM dd, yyyy") : "Select Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          
          <span className="text-sm text-gray-500">
            Showing {filteredJobs.length} of {failedJobs.length} failed jobs
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
                      FAILED
                    </Badge>
                    {job.isBeingChecked && (
                      <Badge variant="secondary">
                        <Clock className="h-3 w-3 mr-1" /> Being checked
                      </Badge>
                    )}
                    {job.isFixed && (
                      <Badge variant="default">
                        <CheckCircle className="h-3 w-3 mr-1" /> Fixed
                      </Badge>
                    )}
                  </div>
                </div>
                {job.startTime && (
                  <div className="mt-2 text-sm text-gray-500">
                    <p>Start: {new Date(job.startTime).toLocaleString()}</p>
                    {job.endTime && <p>End: {new Date(job.endTime).toLocaleString()}</p>}
                  </div>
                )}
                {job.errorMessage && (
                  <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-md text-sm">
                    <p className="font-medium text-red-600 dark:text-red-400">Error:</p>
                    <p className="text-red-600 dark:text-red-400">{job.errorMessage}</p>
                  </div>
                )}
                {job.comment && (
                  <div className="mt-2">
                    <p className="text-sm font-medium">Comment:</p>
                    <p className="text-sm">{job.comment}</p>
                  </div>
                )}
                {job.solution && (
                  <div className="mt-2">
                    <p className="text-sm font-medium">Solution:</p>
                    <p className="text-sm">{job.solution}</p>
                  </div>
                )}
              </Card>
            ))}
            {filteredJobs.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No failed jobs found with the applied filters.
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>
      
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Job Details</h2>
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
                <p className="font-medium text-red-600 dark:text-red-400">Error:</p>
                <p className="text-red-600 dark:text-red-400">{selectedJob.errorMessage}</p>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Comment
              </label>
              <Textarea
                placeholder="Add a comment about the error"
                value={selectedJob.comment || ''}
                onChange={(e) => setSelectedJob({...selectedJob, comment: e.target.value})}
                className="mb-2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Solution
              </label>
              <Textarea
                placeholder="Describe the applied solution"
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
                  {selectedJob.isBeingChecked ? "Being checked" : "Mark as checking"}
                </Button>
                <Button
                  variant={selectedJob.isFixed ? "default" : "outline"}
                  onClick={markAsFixed}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  {selectedJob.isFixed ? "Fixed" : "Mark as fixed"}
                </Button>
              </div>
              <Button onClick={saveComment}>
                Save
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-10 text-gray-500">
            Select a job to view details
          </div>
        )}
      </Card>
    </div>
  );
}

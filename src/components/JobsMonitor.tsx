import { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Filter, 
  CheckCircle, 
  Clock, 
  RefreshCw, 
  Search, 
  Calendar as CalendarIcon,
  FileSpreadsheet,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  ArrowUpAZ,
  ArrowDownAZ,
  User,
  GripHorizontal,
  MoveHorizontal,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import * as XLSX from 'xlsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

interface Job {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'failed' | 'waiting';
  application?: string;
  subApplication?: string;
  folder?: string;
  startTime?: string;
  endTime?: string;
  orderDate?: string;
  errorMessage?: string;
  comment?: string;
  solution?: string;
  isBeingChecked?: boolean;
  isFixed?: boolean;
  checkedBy?: string;
  fixedBy?: string;
}

interface JobsMonitorProps {
  endpoint: string;
  apiKey: string;
}

type SortField = 'name' | 'application' | 'subApplication' | 'folder' | 'orderDate';
type SortDirection = 'asc' | 'desc';

type ColumnConfig = {
  id: string;
  label: string;
  width: number;
  visible: boolean;
  order: number;
};

export default function JobsMonitor({ endpoint, apiKey }: JobsMonitorProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [failedJobs, setFailedJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [filters, setFilters] = useState({
    showFixed: false,
    todayOnly: false,
  });
  const [sortConfig, setSortConfig] = useState<{
    field: SortField;
    direction: SortDirection;
  }>({
    field: 'name',
    direction: 'asc',
  });
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [bulkComment, setBulkComment] = useState('');
  const [bulkSolution, setBulkSolution] = useState('');
  const { toast } = useToast();
  const [refreshInterval, setRefreshInterval] = useState<number>(60000); // 1 minute by default
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [columnFilters, setColumnFilters] = useState({
    name: '',
    application: '',
    subApplication: '',
    folder: '',
  });
  const [columns, setColumns] = useState<ColumnConfig[]>([
    { id: 'checkbox', label: '', width: 5, visible: true, order: 0 },
    { id: 'name', label: 'Job Name', width: 15, visible: true, order: 1 },
    { id: 'application', label: 'Application', width: 15, visible: true, order: 2 },
    { id: 'subApplication', label: 'SubApplication', width: 15, visible: true, order: 3 },
    { id: 'folder', label: 'Folder Name', width: 15, visible: true, order: 4 },
    { id: 'status', label: 'Status', width: 10, visible: true, order: 5 },
    { id: 'assignedTo', label: 'Assigned To', width: 10, visible: true, order: 6 },
    { id: 'orderDate', label: 'Order Date', width: 10, visible: true, order: 7 },
    { id: 'error', label: 'Error', width: 20, visible: true, order: 8 },
  ]);
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  
  const currentUser = "John Doe";

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
        orderDate: new Date().toISOString(),
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
        endTime: new Date().toISOString(),
        orderDate: new Date().toISOString(),
      },
      { 
        id: '3', 
        name: 'Report_Generation', 
        status: 'failed', 
        application: 'HR', 
        subApplication: 'Payroll', 
        folder: 'Monthly_Jobs', 
        startTime: new Date().toISOString(),
        orderDate: new Date().toISOString(),
        errorMessage: 'Invalid input parameters',
        isBeingChecked: true,
        checkedBy: 'Alice Smith'
      },
      { 
        id: '4', 
        name: 'Data_Sync', 
        status: 'failed', 
        application: 'Sales', 
        subApplication: 'CRM', 
        folder: 'Daily_Jobs', 
        startTime: new Date().toISOString(),
        orderDate: new Date().toISOString(),
        errorMessage: 'Failed to connect to remote server',
        isFixed: true,
        fixedBy: 'Bob Johnson'
      },
      { 
        id: '5', 
        name: 'Yesterday_Job', 
        status: 'failed', 
        application: 'Finance', 
        subApplication: 'Reporting', 
        folder: 'Daily_Jobs', 
        startTime: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
        orderDate: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
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

  useEffect(() => {
    applyFiltersAndSort();
  }, [columnFilters, sortConfig]);

  const fetchFailedJobs = () => {
    const newJob: Job = { 
      id: Date.now().toString(), 
      name: `Job_${Math.floor(Math.random() * 1000)}`, 
      status: 'failed', 
      application: ['Finance', 'IT', 'HR', 'Sales'][Math.floor(Math.random() * 4)], 
      subApplication: ['Reporting', 'Processing', 'Backup', 'Analysis'][Math.floor(Math.random() * 4)], 
      folder: ['Daily_Jobs', 'Weekly_Jobs', 'Monthly_Jobs'][Math.floor(Math.random() * 3)], 
      startTime: new Date().toISOString(),
      orderDate: new Date().toISOString(),
      errorMessage: ['Database error', 'Network timeout', 'Invalid parameters', 'Authentication failed'][Math.floor(Math.random() * 4)]
    };
    
    setJobs(prev => [...prev, newJob]);
    setFailedJobs(prev => [...prev, newJob]);
    applyFiltersAndSort([...failedJobs, newJob]);
    
    toast({
      title: "New failed job detected",
      description: `${newJob.name} failed with error: ${newJob.errorMessage}`,
      variant: "destructive",
    });
  };

  const applyFiltersAndSort = (jobsToFilter = failedJobs) => {
    let result = jobsToFilter;
    
    if (columnFilters.name) {
      result = result.filter(job => job.name.toLowerCase().includes(columnFilters.name.toLowerCase()));
    }
    
    if (columnFilters.application) {
      result = result.filter(job => job.application?.toLowerCase().includes(columnFilters.application.toLowerCase()));
    }
    
    if (columnFilters.subApplication) {
      result = result.filter(job => job.subApplication?.toLowerCase().includes(columnFilters.subApplication.toLowerCase()));
    }
    
    if (columnFilters.folder) {
      result = result.filter(job => job.folder?.toLowerCase().includes(columnFilters.folder.toLowerCase()));
    }
    
    if (!filters.showFixed) {
      result = result.filter(job => !job.isFixed);
    }
    
    if (filters.todayOnly) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      result = result.filter(job => {
        if (!job.orderDate) return false;
        const jobDate = new Date(job.orderDate);
        return jobDate >= today;
      });
    } else if (selectedDate) {
      const filterDate = new Date(selectedDate);
      filterDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(filterDate);
      nextDay.setDate(filterDate.getDate() + 1);
      
      result = result.filter(job => {
        if (!job.orderDate) return false;
        const jobDate = new Date(job.orderDate);
        return jobDate >= filterDate && jobDate < nextDay;
      });
    }
    
    if (sortConfig.field) {
      result = [...result].sort((a, b) => {
        const aValue = a[sortConfig.field] || '';
        const bValue = b[sortConfig.field] || '';
        
        if (sortConfig.field === 'orderDate') {
          const dateA = aValue ? new Date(aValue).getTime() : 0;
          const dateB = bValue ? new Date(bValue).getTime() : 0;
          return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
        } else {
          if (sortConfig.direction === 'asc') {
            return String(aValue).localeCompare(String(bValue));
          } else {
            return String(bValue).localeCompare(String(aValue));
          }
        }
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
    
    if (columnFilters.name) {
      result = result.filter(job => job.name.toLowerCase().includes(columnFilters.name.toLowerCase()));
    }
    
    if (columnFilters.application) {
      result = result.filter(job => job.application?.toLowerCase().includes(columnFilters.application.toLowerCase()));
    }
    
    if (columnFilters.subApplication) {
      result = result.filter(job => job.subApplication?.toLowerCase().includes(columnFilters.subApplication.toLowerCase()));
    }
    
    if (columnFilters.folder) {
      result = result.filter(job => job.folder?.toLowerCase().includes(columnFilters.folder.toLowerCase()));
    }
    
    if (!newFilters.showFixed) {
      result = result.filter(job => !job.isFixed);
    }
    
    if (newFilters.todayOnly) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      result = result.filter(job => {
        if (!job.orderDate) return false;
        const jobDate = new Date(job.orderDate);
        return jobDate >= today;
      });
    } else if (selectedDate) {
      const filterDate = new Date(selectedDate);
      filterDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(filterDate);
      nextDay.setDate(filterDate.getDate() + 1);
      
      result = result.filter(job => {
        if (!job.orderDate) return false;
        const jobDate = new Date(job.orderDate);
        return jobDate >= filterDate && jobDate < nextDay;
      });
    }
    
    setFilteredJobs(result);
  };

  const handleColumnFilter = (field: keyof typeof columnFilters, value: string) => {
    const newColumnFilters = { ...columnFilters, [field]: value };
    setColumnFilters(newColumnFilters);
  };

  const handleSortChange = (field: SortField) => {
    setSortConfig((prevSort) => ({
      field,
      direction: prevSort.field === field && prevSort.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    
    if (date) {
      setFilters(prev => ({...prev, todayOnly: false}));
    }
    
    applyFiltersAndSort();
  };

  const handleJobClick = (job: Job) => {
    if (selectedJobs.length > 0) {
      toggleJobSelection(job.id);
    } else {
      setSelectedJob(job);
    }
  };

  const saveComment = () => {
    if (!selectedJob && selectedJobs.length === 0) return;
    
    if (selectedJobs.length > 0) {
      const updatedJobs = failedJobs.map(job => {
        if (selectedJobs.includes(job.id)) {
          return {
            ...job,
            comment: bulkComment || job.comment,
            solution: bulkSolution || job.solution
          };
        }
        return job;
      });
      
      setFailedJobs(updatedJobs);
      applyFiltersAndSort(updatedJobs);
      
      toast({
        title: "Comments saved",
        description: `Comments updated for ${selectedJobs.length} jobs`,
      });
    } else if (selectedJob) {
      setFailedJobs(prev => 
        prev.map(job => 
          job.id === selectedJob.id ? selectedJob : job
        )
      );
      
      applyFiltersAndSort();
      
      toast({
        title: "Comment saved",
        description: `Comment for ${selectedJob.name} was successfully saved`,
      });
    }
  };

  const markAsChecking = () => {
    if (!selectedJob && selectedJobs.length === 0) return;
    
    if (selectedJobs.length > 0) {
      const updatedJobs = failedJobs.map(job => {
        if (selectedJobs.includes(job.id)) {
          return {
            ...job,
            isBeingChecked: true,
            comment: bulkComment || job.comment,
            solution: bulkSolution || job.solution,
            checkedBy: currentUser
          };
        }
        return job;
      });
      
      setFailedJobs(updatedJobs);
      applyFiltersAndSort(updatedJobs);
      
      toast({
        title: "Status updated",
        description: `${selectedJobs.length} jobs marked as "Being checked" by ${currentUser}`,
      });
    } else if (selectedJob) {
      const updatedJob = { 
        ...selectedJob, 
        isBeingChecked: true,
        checkedBy: currentUser
      };
      setSelectedJob(updatedJob);
      
      setFailedJobs(prev => 
        prev.map(job => 
          job.id === updatedJob.id ? updatedJob : job
        )
      );
      
      applyFiltersAndSort();
      
      toast({
        title: "Status updated",
        description: `${updatedJob.name} marked as "Being checked" by ${currentUser}`,
      });
    }
  };

  const markAsFixed = () => {
    if (!selectedJob && selectedJobs.length === 0) return;
    
    if (selectedJobs.length > 0) {
      const updatedJobs = failedJobs.map(job => {
        if (selectedJobs.includes(job.id)) {
          return {
            ...job,
            isFixed: true,
            isBeingChecked: false,
            comment: bulkComment || job.comment,
            solution: bulkSolution || job.solution,
            fixedBy: currentUser,
            checkedBy: job.checkedBy
          };
        }
        return job;
      });
      
      setFailedJobs(updatedJobs);
      applyFiltersAndSort(updatedJobs);
      
      toast({
        title: "Status updated",
        description: `${selectedJobs.length} jobs marked as "Fixed" by ${currentUser}`,
      });
    } else if (selectedJob) {
      const updatedJob = { 
        ...selectedJob, 
        isFixed: true, 
        isBeingChecked: false,
        fixedBy: currentUser,
        checkedBy: selectedJob.checkedBy
      };
      setSelectedJob(updatedJob);
      
      setFailedJobs(prev => 
        prev.map(job => 
          job.id === updatedJob.id ? updatedJob : job
        )
      );
      
      applyFiltersAndSort();
      
      toast({
        title: "Status updated",
        description: `${updatedJob.name} marked as "Fixed" by ${currentUser}`,
      });
    }
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
        OrderDate: job.orderDate ? new Date(job.orderDate).toLocaleString() : 'N/A',
        StartTime: job.startTime ? new Date(job.startTime).toLocaleString() : 'N/A',
        EndTime: job.endTime ? new Date(job.endTime).toLocaleString() : 'N/A',
        Error: job.errorMessage || 'N/A',
        Comment: job.comment || 'N/A',
        Solution: job.solution || 'N/A',
        JobStatus: job.isFixed ? `Fixed by ${job.fixedBy || 'Unknown'}` : 
                  (job.isBeingChecked ? `Being checked by ${job.checkedBy || 'Unknown'}` : 'Failed')
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

  const toggleJobSelection = (jobId: string) => {
    setSelectedJobs(prev => {
      if (prev.includes(jobId)) {
        return prev.filter(id => id !== jobId);
      } else {
        return [...prev, jobId];
      }
    });
  };

  const selectAllJobs = () => {
    if (selectedJobs.length === filteredJobs.length) {
      setSelectedJobs([]);
    } else {
      setSelectedJobs(filteredJobs.map(job => job.id));
    }
  };

  const clearSelection = () => {
    setSelectedJobs([]);
    setBulkComment('');
    setBulkSolution('');
  };

  const getStatusBadge = (job: Job) => {
    if (job.isFixed) {
      return (
        <Badge variant="default" className="bg-green-200 hover:bg-green-300 text-green-800 dark:bg-green-500/30 dark:text-green-200">
          <CheckCircle className="h-3 w-3 mr-1" /> 
          Fixed
        </Badge>
      );
    } else if (job.isBeingChecked) {
      return (
        <Badge variant="secondary" className="bg-yellow-200 hover:bg-yellow-300 text-yellow-800 dark:bg-yellow-500/30 dark:text-yellow-200">
          <Clock className="h-3 w-3 mr-1" /> 
          Being checked
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive">
          <AlertCircle className="h-3 w-3 mr-1" /> FAILED
        </Badge>
      );
    }
  };

  const getUserInfo = (job: Job) => {
    if (job.isFixed && job.fixedBy) {
      return (
        <div className="flex items-center text-sm text-green-700 dark:text-green-400">
          <User className="h-3 w-3 mr-1" /> 
          {job.fixedBy}
        </div>
      );
    } else if (job.isBeingChecked && job.checkedBy) {
      return (
        <div className="flex items-center text-sm text-yellow-700 dark:text-yellow-400">
          <User className="h-3 w-3 mr-1" /> 
          {job.checkedBy}
        </div>
      );
    } else {
      return null;
    }
  };

  const getColumnFilterIcon = (field: keyof typeof columnFilters) => {
    return columnFilters[field] ? <Filter className="h-3 w-3 text-primary" /> : <Filter className="h-3 w-3 text-gray-400" />;
  };

  const getSortIcon = (field: SortField) => {
    if (sortConfig.field !== field) {
      return null;
    }
    
    if (field === 'name' || field === 'application' || field === 'subApplication' || field === 'folder') {
      return sortConfig.direction === 'asc' ? 
        <ArrowUpAZ className="h-3 w-3" /> : 
        <ArrowDownAZ className="h-3 w-3" />;
    } else {
      return sortConfig.direction === 'asc' ? 
        <ArrowUp className="h-3 w-3" /> : 
        <ArrowDown className="h-3 w-3" />;
    }
  };

  // Column resizing handler
  const handleResizeEnd = (columnId: string, newSize: number) => {
    setColumns(columns.map(col => 
      col.id === columnId ? { ...col, width: newSize } : col
    ));
  };

  // Column drag start handler
  const handleDragStart = (columnId: string) => {
    setDraggedColumn(columnId);
  };

  // Column drag over handler
  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    if (draggedColumn && draggedColumn !== columnId) {
      const updatedColumns = [...columns];
      const draggedIndex = updatedColumns.findIndex(col => col.id === draggedColumn);
      const targetIndex = updatedColumns.findIndex(col => col.id === columnId);
      
      // Swap order values
      const draggedOrder = updatedColumns[draggedIndex].order;
      updatedColumns[draggedIndex].order = updatedColumns[targetIndex].order;
      updatedColumns[targetIndex].order = draggedOrder;
      
      setColumns(updatedColumns.sort((a, b) => a.order - b.order));
    }
  };

  // Column drag end handler
  const handleDragEnd = () => {
    setDraggedColumn(null);
  };

  // Get sorted columns
  const getSortedColumns = () => {
    return [...columns].sort((a, b) => a.order - b.order);
  };

  // Render the cell content based on column id
  const renderCellContent = (job: Job, columnId: string) => {
    switch (columnId) {
      case 'checkbox':
        return (
          <Checkbox 
            checked={selectedJobs.includes(job.id)}
            onCheckedChange={() => toggleJobSelection(job.id)}
            onClick={(e) => e.stopPropagation()}
          />
        );
      case 'name':
        return job.name;
      case 'application':
        return job.application || 'N/A';
      case 'subApplication':
        return job.subApplication || 'N/A';
      case 'folder':
        return job.folder || 'N/A';
      case 'status':
        return getStatusBadge(job);
      case 'assignedTo':
        return getUserInfo(job);
      case 'orderDate':
        return job.orderDate ? format(new Date(job.orderDate), "dd/MM HH:mm") : 'N/A';
      case 'error':
        return job.errorMessage || 'N/A';
      default:
        return null;
    }
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
          
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Checkbox 
                id="select-all" 
                checked={filteredJobs.length > 0 && selectedJobs.length === filteredJobs.length}
                onCheckedChange={selectAllJobs}
              />
              <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                Select all
              </label>
            </div>
            
            {selectedJobs.length > 0 && (
              <Button size="sm" variant="outline" onClick={clearSelection}>
                Clear selection ({selectedJobs.length})
              </Button>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500">
            Showing {filteredJobs.length} of {failedJobs.length} failed jobs
          </span>
          {selectedJobs.length > 0 && (
            <span className="text-sm text-primary font-medium">
              {selectedJobs.length} jobs selected
            </span>
          )}
        </div>
        
        <ScrollArea className="h-[500px] w-full border rounded-md" orientation="both">
          <div className="min-w-max">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  {getSortedColumns().filter(col => col.visible).map((column) => (
                    <TableHead 
                      key={column.id}
                      style={{ width: `${column.width}%` }}
                      className="relative group"
                      draggable={column.id !== 'checkbox'}
                      onDragStart={() => handleDragStart(column.id)}
                      onDragOver={(e) => handleDragOver(e, column.id)}
                      onDragEnd={handleDragEnd}
                    >
                      <div className="flex items-center gap-1">
                        {column.id !== 'checkbox' && (
                          <div 
                            className="cursor-move opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Drag to reorder column"
                          >
                            <GripHorizontal className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                        
                        {column.id === 'name' && (
                          <div 
                            className="cursor-pointer flex items-center gap-1" 
                            onClick={() => handleSortChange('name')}
                          >
                            {column.label}
                            {getSortIcon('name')}
                          </div>
                        )}
                        
                        {column.id === 'application' && (
                          <div 
                            className="cursor-pointer flex items-center gap-1" 
                            onClick={() => handleSortChange('application')}
                          >
                            {column.label}
                            {getSortIcon('application')}
                          </div>
                        )}
                        
                        {column.id === 'subApplication' && (
                          <div 
                            className="cursor-pointer flex items-center gap-1" 
                            onClick={() => handleSortChange('subApplication')}
                          >
                            {column.label}
                            {getSortIcon('subApplication')}
                          </div>
                        )}
                        
                        {column.id === 'folder' && (
                          <div 
                            className="cursor-pointer flex items-center gap-1" 
                            onClick={() => handleSortChange('folder')}
                          >
                            {column.label}
                            {getSortIcon('folder')}
                          </div>
                        )}
                        
                        {column.id === 'orderDate' && (
                          <div 
                            className="cursor-pointer flex items-center gap-1" 
                            onClick={() => handleSortChange('orderDate')}
                          >
                            {column.label}
                            {getSortIcon('orderDate')}
                          </div>
                        )}
                        
                        {!['checkbox', 'name', 'application', 'subApplication', 'folder', 'orderDate'].includes(column.id) && (
                          <div>{column.label}</div>
                        )}
                        
                        {['name', 'application', 'subApplication', 'folder'].includes(column.id) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                                {getColumnFilterIcon(column.id as keyof typeof columnFilters)}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <div className="p-2">
                                <Input 
                                  placeholder={`Filter ${column.label.toLowerCase()}`}
                                  value={columnFilters[column.id as keyof typeof columnFilters]}
                                  onChange={(e) => handleColumnFilter(column.id as keyof typeof columnFilters, e.target.value)}
                                  className="h-8 mb-2"
                                />
                                <div className="flex justify-between mt-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleColumnFilter(column.id as keyof typeof columnFilters, '')}
                                  >
                                    Clear
                                  </Button>
                                  <Button 
                                    size="sm"
                                    onClick={() => document.body.click()} // close dropdown
                                  >
                                    Apply
                                  </Button>
                                </div>
                              </div>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                      
                      {/* Column resize handle */}
                      {column.id !== 'checkbox' && (
                        <div
                          className="absolute right-0 top-0 h-full w-1 bg-transparent hover:bg-gray-400 cursor-col-resize"
                          onMouseDown={(e) => {
                            const startX = e.clientX;
                            const startWidth = column.width;
                            
                            const handleMouseMove = (e: MouseEvent) => {
                              const diff = e.clientX - startX;
                              const newWidth = Math.max(5, startWidth + (diff * 0.1));
                              handleResizeEnd(column.id, newWidth);
                            };
                            
                            const handleMouseUp = () => {
                              document.removeEventListener('mousemove', handleMouseMove);
                              document.removeEventListener('mouseup', handleMouseUp);
                            };
                            
                            document.addEventListener('mousemove', handleMouseMove);
                            document.addEventListener('mouseup', handleMouseUp);
                          }}
                        />
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobs.map((job) => (
                  <TableRow 
                    key={job.id}
                    className={cn(
                      "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800",
                      selectedJob?.id === job.id ? "bg-muted" : "",
                      job.isFixed ? "bg-green-50/50 dark:bg-green-900/10" : "",
                      job.isBeingChecked ? "bg-yellow-50/50 dark:bg-yellow-900/10" : ""
                    )}
                    onClick={() => handleJobClick(job)}
                  >
                    {getSortedColumns().filter(col => col.visible).map((column) => (
                      <TableCell key={`${job.id}-${column.id}`} className="p-2">
                        {renderCellContent(job, column.id)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                {filteredJobs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={getSortedColumns().filter(col => col.visible).length} className="text-center py-8 text-gray-500">
                      No failed jobs found with the applied filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>
      </Card>
      
      <Card className="p-6">
        {selectedJobs.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold mb-4">Bulk Edit ({selectedJobs.length} jobs)</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Comment for all selected jobs
              </label>
              <Textarea
                placeholder="Add a comment for all selected jobs"
                value={bulkComment}
                onChange={(e) => setBulkComment(e.target.value)}
                className="mb-2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Solution for all selected jobs
              </label>
              <Textarea
                placeholder="Describe the solution applied to all jobs"
                value={bulkSolution}
                onChange={(e) => setBulkSolution(e.target.value)}
                className="mb-4"
              />
            </div>
            
            <div className="flex justify-between">
              <div className="space-x-2">
                <Button
                  variant="outline"
                  onClick={markAsChecking}
                  className="bg-yellow-200 hover:bg-yellow-300 text-yellow-800 dark:bg-yellow-500/30 dark:text-yellow-200"
                >
                  <Clock className="h-4 w-4 mr-1" />
                  Mark as checking
                </Button>
                <Button
                  variant="outline"
                  onClick={markAsFixed}
                  className="bg-green-200 hover:bg-green-300 text-green-800 dark:bg-green-500/30 dark:text-green-200"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Mark as fixed
                </Button>
              </div>
              <Button onClick={saveComment}>
                Save changes
              </Button>
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <Button variant="outline" size="sm" onClick={clearSelection} className="w-full">
                Return to individual editing
              </Button>
            </div>
          </div>
        ) : (
          <div>
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
                
                <div className="grid grid-cols-2 gap-2">
                  {selectedJob.startTime && (
                    <div className="text-sm">
                      <span className="font-medium">Start Time:</span>
                      <p>{format(new Date(selectedJob.startTime), "MMM dd, yyyy HH:mm:ss")}</p>
                    </div>
                  )}
                  
                  {selectedJob.endTime && (
                    <div className="text-sm">
                      <span className="font-medium">End Time:</span>
                      <p>{format(new Date(selectedJob.endTime), "MMM dd, yyyy HH:mm:ss")}</p>
                    </div>
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
                      className={selectedJob.isBeingChecked ? "bg-yellow-200 hover:bg-yellow-300 text-yellow-800 dark:bg-yellow-500/30 dark:text-yellow-200" : ""}
                    >
                      <Clock className="h-4 w-4 mr-1" />
                      {selectedJob.isBeingChecked ? selectedJob.checkedBy ? `Being checked by ${selectedJob.checkedBy}` : "Being checked" : "Mark as checking"}
                    </Button>
                    <Button
                      variant={selectedJob.isFixed ? "default" : "outline"}
                      onClick={markAsFixed}
                      className={selectedJob.isFixed ? "bg-green-200 hover:bg-green-300 text-green-800 dark:bg-green-500/30 dark:text-green-200" : ""}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      {selectedJob.isFixed ? selectedJob.fixedBy ? `Fixed by ${selectedJob.fixedBy}` : "Fixed" : "Mark as fixed"}
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
          </div>
        )}
      </Card>
    </div>
  );
}

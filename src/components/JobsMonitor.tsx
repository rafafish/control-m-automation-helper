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

type SortField = keyof Job;
type SortDirection = 'asc' | 'desc';

type ColumnConfig = {
  id: string;
  label: string;
  width: number;
  visible: boolean;
  order: number;
  sortable: boolean;
  filterable: boolean;
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
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({
    name: '',
    application: '',
    subApplication: '',
    folder: '',
    status: '',
    errorMessage: '',
    assignedTo: '',
    orderDate: '',
  });
  const [columns, setColumns] = useState<ColumnConfig[]>([
    { id: 'checkbox', label: '', width: 5, visible: true, order: 0, sortable: false, filterable: false },
    { id: 'name', label: 'Job Name', width: 15, visible: true, order: 1, sortable: true, filterable: true },
    { id: 'application', label: 'Application', width: 15, visible: true, order: 2, sortable: true, filterable: true },
    { id: 'subApplication', label: 'SubApplication', width: 15, visible: true, order: 3, sortable: true, filterable: true },
    { id: 'folder', label: 'Folder Name', width: 15, visible: true, order: 4, sortable: true, filterable: true },
    { id: 'status', label: 'Status', width: 10, visible: true, order: 5, sortable: true, filterable: true },
    { id: 'assignedTo', label: 'Assigned To', width: 10, visible: true, order: 6, sortable: true, filterable: true },
    { id: 'orderDate', label: 'Order Date', width: 10, visible: true, order: 7, sortable: true, filterable: true },
    { id: 'error', label: 'Error', width: 20, visible: true, order: 8, sortable: true, filterable: true },
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
  }, [columnFilters, sortConfig, filters, selectedDate]);

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
    let result = [...jobsToFilter];
    
    // Apply all column filters
    Object.entries(columnFilters).forEach(([key, value]) => {
      if (value) {
        result = result.filter(job => {
          if (key === 'status') {
            // Special handling for status which isn't directly a string
            if (job.isFixed && value.toLowerCase().includes('fix')) return true;
            if (job.isBeingChecked && value.toLowerCase().includes('check')) return true;
            if (!job.isFixed && !job.isBeingChecked && value.toLowerCase().includes('fail')) return true;
            return false;
          } else if (key === 'assignedTo') {
            // Special handling for assigned to
            if (job.fixedBy && job.fixedBy.toLowerCase().includes(value.toLowerCase())) return true;
            if (job.checkedBy && job.checkedBy.toLowerCase().includes(value.toLowerCase())) return true;
            return false;
          } else if (key === 'error') {
            // Handle error field (maps to errorMessage)
            return job.errorMessage?.toLowerCase().includes(value.toLowerCase()) || false;
          } else if (key === 'orderDate') {
            // Skip orderDate filtering here - handled separately
            return true;
          } else {
            // Standard field filtering
            const jobValue = job[key as keyof Job];
            return jobValue && String(jobValue).toLowerCase().includes(value.toLowerCase());
          }
        });
      }
    });
    
    // Apply special filters
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
    
    // Apply sorting
    if (sortConfig.field) {
      result = [...result].sort((a, b) => {
        const aValue = a[sortConfig.field];
        const bValue = b[sortConfig.field];
        
        // Special handling for dates
        if (sortConfig.field === 'orderDate' || sortConfig.field === 'startTime' || sortConfig.field === 'endTime') {
          const dateA = aValue ? new Date(aValue as string).getTime() : 0;
          const dateB = bValue ? new Date(bValue as string).getTime() : 0;
          return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
        } 
        // Special handling for status
        else if (sortConfig.field === 'status') {
          // Create a status value for sorting where fixed = 2, checking = 1, failed = 0
          const statusA = a.isFixed ? 2 : (a.isBeingChecked ? 1 : 0);
          const statusB = b.isFixed ? 2 : (b.isBeingChecked ? 1 : 0);
          return sortConfig.direction === 'asc' ? statusA - statusB : statusB - statusA;
        }
        // Default string comparison
        else {
          const strA = aValue !== undefined ? String(aValue) : '';
          const strB = bValue !== undefined ? String(bValue) : '';
          
          if (sortConfig.direction === 'asc') {
            return strA.localeCompare(strB);
          } else {
            return strB.localeCompare(strA);
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
  };

  const handleColumnFilter = (field: string, value: string) => {
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

  const getColumnFilterIcon = (field: string) => {
    return columnFilters[field] ? <Filter className="h-3 w-3 text-primary" /> : <Filter className="h-3 w-3 text-gray-400" />;
  };

  const getSortIcon = (field: string) => {
    if (sortConfig.field !== field as SortField) {
      return null;
    }
    
    if (['name', 'application', 'subApplication', 'folder', 'errorMessage'].includes(field)) {
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

  // Get filter dropdown for a column
  const getFilterDropdown = (column: ColumnConfig) => {
    if (!column.filterable) return null;
    
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
            {getColumnFilterIcon(column.id)}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <div className="p-2">
            <Input 
              placeholder={`Filter ${column.label.toLowerCase()}`}
              value={columnFilters[column.id] || ''}
              onChange={(e) => handleColumnFilter(column.id, e.target.value)}
              className="h-8 mb-2"
            />
            <div className="flex justify-between mt-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleColumnFilter(column.id, '')}
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
    );
  };

  // Get sort button for a column
  const getSortButton = (column: ColumnConfig) => {
    if (!column.sortable) return null;
    
    return (
      <div 
        className="cursor-pointer flex items-center gap-1" 
        onClick={() => handleSortChange(column.id as SortField)}
      >
        {column.label}
        {getSortIcon(column.id)}
      </div>
    );
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
                        
                        {column.sortable ? (
                          getSortButton(column)
                        ) : (
                          <div>{column.label}</div>
                        )}
                        
                        {column.filterable && getFilterDropdown(column)}
                      </div>
                      
                      {/* Column resize handle */}
                      {column.id !== 'checkbox' &&

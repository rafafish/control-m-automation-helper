import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CalendarIcon, RefreshCw, GripHorizontal, FileSpreadsheet } from "lucide-react";
import { format } from "date-fns";
import * as XLSX from 'xlsx';
import { cn } from "@/lib/utils";

interface Job {
  id: string;
  jobName: string;
  folderName: string;
  status: string;
  startTime: string;
  endTime: string;
  duration: string;
  retries: number;
  logLink: string;
  runId: string;
  orderId: string;
  fixed: boolean;
}

interface Column {
  id: string;
  label: string;
  width: number;
  sortable: boolean;
  filterable: boolean;
  visible: boolean;
}

interface JobsMonitorProps {
  endpoint: string;
  apiKey: string;
}

export default function JobsMonitor({ endpoint, apiKey }: JobsMonitorProps) {
  const [failedJobs, setFailedJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    showFixed: false,
    todayOnly: false,
  });
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [columns, setColumns] = useState<Column[]>([
    { id: 'checkbox', label: '', width: 3, sortable: false, filterable: false, visible: true },
    { id: 'jobName', label: 'Job Name', width: 15, sortable: true, filterable: true, visible: true },
    { id: 'folderName', label: 'Folder Name', width: 15, sortable: true, filterable: true, visible: true },
    { id: 'status', label: 'Status', width: 10, sortable: true, filterable: true, visible: true },
    { id: 'startTime', label: 'Start Time', width: 12, sortable: true, filterable: false, visible: true },
    { id: 'endTime', label: 'End Time', width: 12, sortable: true, filterable: false, visible: true },
    { id: 'duration', label: 'Duration', width: 8, sortable: true, filterable: false, visible: true },
    { id: 'retries', label: 'Retries', width: 7, sortable: true, filterable: false, visible: true },
    { id: 'logLink', label: 'Log Link', width: 8, sortable: false, filterable: false, visible: true },
  ]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' | null }>({
    key: 'startTime',
    direction: 'descending',
  });
  const [columnOrder, setColumnOrder] = useState<string[]>(columns.map(col => col.id));
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);

  const fetchFailedJobs = useCallback(async () => {
    try {
      const response = await fetch(`${endpoint}/jobs/failed`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: Job[] = await response.json();
      setFailedJobs(data);
    } catch (error) {
      console.error("Could not fetch failed jobs:", error);
    }
  }, [apiKey, endpoint]);

  useEffect(() => {
    fetchFailedJobs();
  }, [fetchFailedJobs]);

  useEffect(() => {
    applyFilters();
  }, [failedJobs, filters, selectedDate]);

  const applyFilters = () => {
    let filtered = [...failedJobs];

    if (filters.showFixed) {
      filtered = filtered.filter(job => !job.fixed);
    }

    if (filters.todayOnly) {
      const today = new Date();
      filtered = filtered.filter(job => {
        const jobDate = new Date(job.startTime);
        return (
          jobDate.getDate() === today.getDate() &&
          jobDate.getMonth() === today.getMonth() &&
          jobDate.getFullYear() === today.getFullYear()
        );
      });
    }

    if (selectedDate) {
      filtered = filtered.filter(job => {
        const jobDate = new Date(job.startTime);
        return (
          jobDate.getDate() === selectedDate.getDate() &&
          jobDate.getMonth() === selectedDate.getMonth() &&
          jobDate.getFullYear() === selectedDate.getFullYear()
        );
      });
    }

    if (sortConfig.key) {
      filtered = [...filtered].sort((a, b) => {
        const key = sortConfig.key as keyof Job;
        const direction = sortConfig.direction === 'ascending' ? 1 : -1;

        if (key === 'jobName' || key === 'folderName' || key === 'status') {
          return a[key].localeCompare(b[key]) * direction;
        } else if (key === 'startTime' || key === 'endTime') {
          return (new Date(a[key]).getTime() - new Date(b[key]).getTime()) * direction;
        } else if (typeof a[key] === 'number') {
          return (Number(a[key]) - Number(b[key])) * direction;
        } else {
          return 0;
        }
      });
    }

    setFilteredJobs(filtered);
  };

  const handleFilterChange = (filterKey: string, value: boolean) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [filterKey]: value,
    }));
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  const handleJobClick = (job: Job) => {
    window.open(job.logLink, '_blank');
  };

  const toggleJobSelection = (jobId: string) => {
    setSelectedJobs(prevSelected => {
      if (prevSelected.includes(jobId)) {
        return prevSelected.filter(id => id !== jobId);
      } else {
        return [...prevSelected, jobId];
      }
    });
  };

  const selectAllJobs = (checked: boolean) => {
    if (checked) {
      setSelectedJobs(filteredJobs.map(job => job.id));
    } else {
      setSelectedJobs([]);
    }
  };

  const clearSelection = () => {
    setSelectedJobs([]);
  };

  const handleSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortButton = (column: Column) => {
    if (!column.sortable) return null;

    let arrow = null;
    if (sortConfig.key === column.id) {
      arrow = sortConfig.direction === 'ascending' ? '▲' : '▼';
    }

    return (
      <Button variant="ghost" size="sm" onClick={() => handleSort(column.id)} className="gap-1">
        {column.label} {arrow}
      </Button>
    );
  };

  const handleColumnVisibility = (id: string) => {
    setColumns(prevColumns =>
      prevColumns.map(column =>
        column.id === id ? { ...column, visible: !column.visible } : column
      )
    );
  };

  const getFilterDropdown = (column: Column) => {
    if (!column.filterable) return null;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            Filter
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <div className="p-2">
            <Label htmlFor="filter" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed">
              Filter by {column.label}
            </Label>
            <Input type="text" id="filter" placeholder={`Filter ${column.label}...`} />
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const refreshJobs = () => {
    fetchFailedJobs();
  };

  const renderCellContent = (job: Job, columnId: string) => {
    switch (columnId) {
      case 'checkbox':
        return (
          <Checkbox
            checked={selectedJobs.includes(job.id)}
            onCheckedChange={() => toggleJobSelection(job.id)}
          />
        );
      case 'jobName':
        return job.jobName;
      case 'folderName':
        return job.folderName;
      case 'status':
        return job.status;
      case 'startTime':
        return format(new Date(job.startTime), 'yyyy-MM-dd HH:mm:ss');
      case 'endTime':
        return format(new Date(job.endTime), 'yyyy-MM-dd HH:mm:ss');
      case 'duration':
        return job.duration;
      case 'retries':
        return job.retries.toString();
      case 'logLink':
        return (
          <a href={job.logLink} target="_blank" rel="noopener noreferrer">
            View Log
          </a>
        );
      default:
        return null;
    }
  };

  const exportToExcel = () => {
    const visibleColumns = columns.filter(col => col.visible && col.id !== 'checkbox');
    const data = filteredJobs.map(job => {
      const row: { [key: string]: any } = {};
      visibleColumns.forEach(column => {
        row[column.label] = renderCellContent(job, column.id);
      });
      return row;
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Failed Jobs');
    XLSX.writeFile(wb, 'failed_jobs.xlsx');
  };

  const handleDragStart = (columnId: string) => {
    console.log("Drag start for column:", columnId);
  };

  const handleDragOver = (e: React.DragEvent<HTMLTableCellElement>, columnId: string) => {
    e.preventDefault();
    console.log("Drag over column:", columnId);
  };

  const handleDragEnd = () => {
    console.log("Drag end");
  };

  const handleResizeEnd = (columnId: string, size: number) => {
    setResizingColumn(null);
    setColumns(prevColumns =>
      prevColumns.map(column =>
        column.id === columnId ? { ...column, width: size } : column
      )
    );
  };

  const getSortedColumns = () => {
    return columnOrder.map(id => columns.find(col => col.id === id)!).filter(Boolean);
  };

  const ResizableHandle = ({ onResizeEnd }: { onResizeEnd: (size: number) => void }) => {
    const [startWidth, setStartWidth] = useState(0);
    const [startPosition, setStartPosition] = useState(0);
    const [isResizing, setIsResizing] = useState(false);

    const handleMouseDown = useCallback((event: React.MouseEvent) => {
      setIsResizing(true);
      setStartPosition(event.clientX);
      setStartWidth(event.currentTarget.parentElement?.offsetWidth || 0);
      setResizingColumn(event.currentTarget.parentElement?.dataset.columnId || null);
    }, []);

    const handleMouseUp = useCallback(() => {
      setIsResizing(false);
      setResizingColumn(null);
    }, []);

    const handleMouseMove = useCallback((event: MouseEvent) => {
      if (!isResizing) return;

      const movement = event.clientX - startPosition;
      const newWidth = startWidth + movement;

      if (newWidth > 50) {
        onResizeEnd(newWidth);
      }
    }, [isResizing, startPosition, startWidth, onResizeEnd]);

    useEffect(() => {
      if (isResizing) {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
      }

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }, [isResizing, handleMouseMove, handleMouseUp]);

    return (
      <div
        className="absolute top-0 right-0 h-full w-1 cursor-col-resize opacity-0 hover:bg-accent group-hover:opacity-100"
        onMouseDown={handleMouseDown}
      />
    );
  };

  return (
    <div className="w-full">
      <Card className="p-4 sm:p-6">
        <CardHeader>
          <CardTitle>Failed Jobs Monitor</CardTitle>
          <CardDescription>Monitor failed jobs here.</CardDescription>
        </CardHeader>
        
        <CardFooter>
          <div className="flex flex-wrap items-center gap-2">
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
        </CardFooter>
        
        <CardContent>
          <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button 
                variant={filters.showFixed ? "default" : "outline"} 
                size="sm"
                onClick={() => handleFilterChange('showFixed', !filters.showFixed)}
              >
                {filters.showFixed ? "Hide Fixed" : "Show Fixed"}
              </Button>
              
              <Button 
                variant={filters.todayOnly ? "default" : "outline"} 
                size="sm"
                onClick={() => handleFilterChange('todayOnly', !filters.todayOnly)}
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
                    className="p-3"
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="flex-1 w-full sm:w-auto flex flex-wrap items-center gap-2 mt-2 sm:mt-0 sm:justify-end">
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="select-all" 
                  checked={filteredJobs.length > 0 && selectedJobs.length === filteredJobs.length}
                  onCheckedChange={selectAllJobs}
                />
                <label htmlFor="select-all" className="text-sm font-medium cursor-pointer whitespace-nowrap">
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
          
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="text-sm text-gray-500">
              Showing {filteredJobs.length} of {failedJobs.length} failed jobs
            </span>
            {selectedJobs.length > 0 && (
              <span className="text-sm text-primary font-medium">
                {selectedJobs.length} jobs selected
              </span>
            )}
          </div>
          
          <ScrollArea className="h-[calc(100vh-20rem)] w-full border rounded-md" orientation="both">
            <div className="min-w-max">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    {getSortedColumns().filter(col => col.visible).map((column) => (
                      <TableHead 
                        key={column.id}
                        style={{ 
                          width: `${column.width}%`,
                          minWidth: column.id === 'checkbox' ? '40px' : '120px'
                        }}
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
                        
                        {column.id !== 'checkbox' && (
                          <ResizableHandle 
                            onResizeEnd={(size) => handleResizeEnd(column.id, size)}
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
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleJobClick(job)}
                    >
                      {getSortedColumns()
                        .filter(col => col.visible)
                        .map((column) => (
                          <TableCell 
                            key={column.id}
                            className="overflow-hidden text-ellipsis whitespace-nowrap"
                          >
                            {renderCellContent(job, column.id)}
                          </TableCell>
                        ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

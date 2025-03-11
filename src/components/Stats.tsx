
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Calendar, TrendingDown, BarChart3, PieChart as PieChartIcon } from "lucide-react";

interface StatsProps {
  endpoint: string;
  apiKey: string;
}

export default function Stats({ endpoint, apiKey }: StatsProps) {
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  const [chartType, setChartType] = useState<'line' | 'bar' | 'pie'>('line');
  
  // Dados simulados para falhas de jobs
  const dailyData = [
    { name: '00:00', failed: 2, application: 'Finance' },
    { name: '03:00', failed: 1, application: 'IT' },
    { name: '06:00', failed: 3, application: 'HR' },
    { name: '09:00', failed: 5, application: 'Finance' },
    { name: '12:00', failed: 2, application: 'Sales' },
    { name: '15:00', failed: 4, application: 'IT' },
    { name: '18:00', failed: 3, application: 'Finance' },
    { name: '21:00', failed: 1, application: 'HR' },
  ];
  
  const weeklyData = [
    { name: 'Segunda', failed: 8, application: 'Finance' },
    { name: 'Terça', failed: 5, application: 'IT' },
    { name: 'Quarta', failed: 10, application: 'HR' },
    { name: 'Quinta', failed: 7, application: 'Sales' },
    { name: 'Sexta', failed: 12, application: 'Finance' },
    { name: 'Sábado', failed: 3, application: 'IT' },
    { name: 'Domingo', failed: 1, application: 'HR' },
  ];
  
  const monthlyData = [
    { name: 'Semana 1', failed: 25, application: 'Finance' },
    { name: 'Semana 2', failed: 18, application: 'IT' },
    { name: 'Semana 3', failed: 32, application: 'HR' },
    { name: 'Semana 4', failed: 15, application: 'Sales' },
  ];
  
  const applicationData = [
    { name: 'Finance', value: 45, color: '#ef4444' },
    { name: 'IT', value: 27, color: '#f97316' },
    { name: 'HR', value: 18, color: '#3b82f6' },
    { name: 'Sales', value: 15, color: '#10b981' },
  ];
  
  const folderData = [
    { name: 'Daily_Jobs', value: 52, color: '#8b5cf6' },
    { name: 'Weekly_Jobs', value: 35, color: '#ec4899' },
    { name: 'Monthly_Jobs', value: 18, color: '#06b6d4' },
  ];
  
  const getCurrentData = () => {
    switch(viewMode) {
      case 'day':
        return dailyData;
      case 'week':
        return weeklyData;
      case 'month':
        return monthlyData;
      default:
        return dailyData;
    }
  };
  
  const renderLineChart = () => {
    const data = getCurrentData();
    return (
      <LineChart width={800} height={400} data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="failed" stroke="#ef4444" name="Falhas" />
      </LineChart>
    );
  };
  
  const renderBarChart = () => {
    const data = getCurrentData();
    return (
      <BarChart width={800} height={400} data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="failed" fill="#ef4444" name="Falhas" />
      </BarChart>
    );
  };
  
  const renderPieChart = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium mb-2 text-center">Falhas por Application</h3>
          <PieChart width={400} height={300}>
            <Pie
              data={applicationData}
              cx={200}
              cy={150}
              labelLine={true}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {applicationData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </div>
        <div>
          <h3 className="text-lg font-medium mb-2 text-center">Falhas por Folder</h3>
          <PieChart width={400} height={300}>
            <Pie
              data={folderData}
              cx={200}
              cy={150}
              labelLine={true}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {folderData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </div>
      </div>
    );
  };
  
  const renderChart = () => {
    switch(chartType) {
      case 'line':
        return renderLineChart();
      case 'bar':
        return renderBarChart();
      case 'pie':
        return renderPieChart();
      default:
        return renderLineChart();
    }
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
        <h2 className="text-2xl font-semibold mb-2 md:mb-0">Estatísticas de Falhas</h2>
        <div className="flex space-x-2">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-1 flex">
            <Button
              variant={viewMode === 'day' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('day')}
              className="rounded-lg"
            >
              <Calendar className="h-4 w-4 mr-1" />
              Dia
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('week')}
              className="rounded-lg"
            >
              <Calendar className="h-4 w-4 mr-1" />
              Semana
            </Button>
            <Button
              variant={viewMode === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('month')}
              className="rounded-lg"
            >
              <Calendar className="h-4 w-4 mr-1" />
              Mês
            </Button>
          </div>
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-1 flex">
            <Button
              variant={chartType === 'line' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setChartType('line')}
              className="rounded-lg"
            >
              <TrendingDown className="h-4 w-4" />
            </Button>
            <Button
              variant={chartType === 'bar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setChartType('bar')}
              className="rounded-lg"
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
            <Button
              variant={chartType === 'pie' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setChartType('pie')}
              className="rounded-lg"
            >
              <PieChartIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <div className="w-full overflow-x-auto flex justify-center">
        {renderChart()}
      </div>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <h3 className="font-medium text-red-700 dark:text-red-400">Total de falhas hoje</h3>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400">21</p>
          <p className="text-sm text-red-600 dark:text-red-400">+5 desde ontem</p>
        </Card>
        <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <h3 className="font-medium text-blue-700 dark:text-blue-400">Application mais problemática</h3>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">Finance</p>
          <p className="text-sm text-blue-600 dark:text-blue-400">45% das falhas</p>
        </Card>
        <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <h3 className="font-medium text-green-700 dark:text-green-400">Jobs corrigidos hoje</h3>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">15</p>
          <p className="text-sm text-green-600 dark:text-green-400">71% resolvidos</p>
        </Card>
      </div>
    </Card>
  );
}


import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface StatsProps {
  endpoint: string;
  apiKey: string;
}

export default function Stats({ endpoint, apiKey }: StatsProps) {
  // Dados simulados - em produção, você buscaria da API
  const data = [
    { name: 'Segunda', completed: 40, failed: 2, running: 5 },
    { name: 'Terça', completed: 45, failed: 1, running: 4 },
    { name: 'Quarta', completed: 38, failed: 3, running: 6 },
    { name: 'Quinta', completed: 42, failed: 2, running: 5 },
    { name: 'Sexta', completed: 35, failed: 1, running: 4 },
  ];

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Estatísticas</h2>
      <div className="w-full overflow-x-auto">
        <LineChart width={800} height={400} data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="completed" stroke="#10b981" name="Completados" />
          <Line type="monotone" dataKey="failed" stroke="#ef4444" name="Falhas" />
          <Line type="monotone" dataKey="running" stroke="#3b82f6" name="Em execução" />
        </LineChart>
      </div>
    </Card>
  );
}

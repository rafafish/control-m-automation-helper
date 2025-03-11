
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface WorkflowEditorProps {
  endpoint: string;
  apiKey: string;
}

export default function WorkflowEditor({ endpoint, apiKey }: WorkflowEditorProps) {
  return (
    <Card className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Editor de Workflow</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nome do Workflow
          </label>
          <Input placeholder="Nome do workflow" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Descrição
          </label>
          <Textarea placeholder="Descrição do workflow" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Definição JSON
          </label>
          <Textarea
            className="font-mono"
            placeholder="Definição do workflow em JSON"
            rows={10}
          />
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline">Cancelar</Button>
          <Button>Salvar Workflow</Button>
        </div>
      </div>
    </Card>
  );
}


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
      <h2 className="text-2xl font-semibold mb-4">Workflow Editor</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Workflow Name
          </label>
          <Input placeholder="Workflow name" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <Textarea placeholder="Workflow description" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            JSON Definition
          </label>
          <Textarea
            className="font-mono"
            placeholder="Workflow definition in JSON format"
            rows={10}
          />
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline">Cancel</Button>
          <Button>Save Workflow</Button>
        </div>
      </div>
    </Card>
  );
}

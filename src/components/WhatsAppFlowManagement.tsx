import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Play, Pause, Edit, Trash2, MessageSquare, MousePointer, GitBranch, Zap } from "lucide-react";
import { useWhatsAppFlows, WhatsAppFlow } from "@/hooks/useWhatsAppFlows";
import { CreateFlowDialog } from "@/components/CreateFlowDialog";
import { EditFlowDialog } from "@/components/EditFlowDialog";
import { FlowStepsEditor } from "@/components/FlowStepsEditor";

export const WhatsAppFlowManagement = () => {
  const { flows, loading, updateFlow, deleteFlow } = useWhatsAppFlows();
  const [selectedFlow, setSelectedFlow] = useState<WhatsAppFlow | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showStepsEditor, setShowStepsEditor] = useState(false);

  const toggleFlowActive = async (flow: WhatsAppFlow) => {
    await updateFlow(flow.id, { is_active: !flow.is_active });
  };

  const handleEditFlow = (flow: WhatsAppFlow) => {
    setSelectedFlow(flow);
    setShowEditDialog(true);
  };

  const handleEditSteps = (flow: WhatsAppFlow) => {
    setSelectedFlow(flow);
    setShowStepsEditor(true);
  };

  const getStepTypeIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="h-4 w-4" />;
      case 'input':
        return <MousePointer className="h-4 w-4" />;
      case 'condition':
        return <GitBranch className="h-4 w-4" />;
      case 'action':
        return <Zap className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  if (loading) {
    return <div>Carregando fluxos...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Fluxos do WhatsApp</h2>
          <p className="text-muted-foreground">
            Crie e gerencie fluxos personalizados para conversas no WhatsApp
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Fluxo
        </Button>
      </div>

      <div className="grid gap-4">
        {flows.map((flow) => (
          <Card key={flow.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {flow.name}
                    <Badge variant={flow.is_active ? "default" : "secondary"}>
                      {flow.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </CardTitle>
                  <CardDescription>{flow.description}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleFlowActive(flow)}
                    className="gap-2"
                  >
                    {flow.is_active ? (
                      <>
                        <Pause className="h-4 w-4" />
                        Pausar
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        Ativar
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditFlow(flow)}
                    className="gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditSteps(flow)}
                    className="gap-2"
                  >
                    <GitBranch className="h-4 w-4" />
                    Passos
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteFlow(flow.id)}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>Palavras-chave:</strong>{" "}
                  {flow.trigger_keywords?.join(", ") || "Nenhuma"}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}

        {flows.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Nenhum fluxo encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Crie seu primeiro fluxo para automatizar conversas no WhatsApp
              </p>
              <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Criar Primeiro Fluxo
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <CreateFlowDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog}
      />

      {selectedFlow && (
        <>
          <EditFlowDialog
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            flow={selectedFlow}
          />
          
          <FlowStepsEditor
            open={showStepsEditor}
            onOpenChange={setShowStepsEditor}
            flow={selectedFlow}
          />
        </>
      )}
    </div>
  );
};
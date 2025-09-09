import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, MessageSquare, MousePointer, GitBranch, Zap, ArrowDown } from "lucide-react";
import { useWhatsAppFlows, WhatsAppFlow, WhatsAppFlowStep } from "@/hooks/useWhatsAppFlows";
import { CreateStepDialog } from "@/components/CreateStepDialog";

interface FlowStepsEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flow: WhatsAppFlow;
}

export const FlowStepsEditor = ({ open, onOpenChange, flow }: FlowStepsEditorProps) => {
  const { flowSteps, fetchFlowSteps, deleteFlowStep } = useWhatsAppFlows();
  const [steps, setSteps] = useState<WhatsAppFlowStep[]>([]);
  const [showCreateStep, setShowCreateStep] = useState(false);

  useEffect(() => {
    if (flow?.id && open) {
      fetchFlowSteps(flow.id);
    }
  }, [flow?.id, open]);

  useEffect(() => {
    if (flowSteps[flow?.id]) {
      setSteps(flowSteps[flow.id]);
    }
  }, [flowSteps, flow?.id]);

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

  const getStepTypeBadge = (type: string) => {
    const colors = {
      message: "bg-blue-500",
      input: "bg-green-500", 
      condition: "bg-yellow-500",
      action: "bg-purple-500"
    };
    return colors[type as keyof typeof colors] || "bg-gray-500";
  };

  const handleDeleteStep = async (stepId: string) => {
    if (confirm("Tem certeza que deseja excluir este passo?")) {
      await deleteFlowStep(stepId);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editor de Passos - {flow?.name}</DialogTitle>
            <DialogDescription>
              Configure os passos do fluxo de conversa
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Passos do Fluxo</h3>
              <Button onClick={() => setShowCreateStep(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Passo
              </Button>
            </div>

            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`p-2 rounded-full text-white ${getStepTypeBadge(step.step_type)}`}>
                      {getStepTypeIcon(step.step_type)}
                    </div>
                    {index < steps.length - 1 && (
                      <ArrowDown className="h-4 w-4 text-muted-foreground mt-2" />
                    )}
                  </div>

                  <Card className="flex-1">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            Passo {step.step_order}: {step.step_name}
                            <Badge variant="outline" className="text-xs">
                              {step.step_type}
                            </Badge>
                          </CardTitle>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDeleteStep(step.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {step.message_text && (
                        <div className="mb-2">
                          <p className="text-sm font-medium">Mensagem:</p>
                          <p className="text-sm text-muted-foreground bg-muted p-2 rounded whitespace-pre-wrap">
                            {step.message_text}
                          </p>
                        </div>
                      )}
                      
                      {step.input_type && (
                        <div className="mb-2">
                          <p className="text-sm font-medium">Tipo de entrada:</p>
                          <Badge variant="outline">{step.input_type}</Badge>
                        </div>
                      )}

                      {step.input_options && step.input_options.length > 0 && (
                        <div className="mb-2">
                          <p className="text-sm font-medium">Opções:</p>
                          <div className="flex flex-wrap gap-1">
                            {step.input_options.map((option: any, idx: number) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {option.key}: {option.label}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {step.actions && Object.keys(step.actions).length > 0 && (
                        <div>
                          <p className="text-sm font-medium">Ações:</p>
                          <pre className="text-xs bg-muted p-2 rounded">
                            {JSON.stringify(step.actions, null, 2)}
                          </pre>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ))}

              {steps.length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum passo configurado</h3>
                    <p className="text-muted-foreground mb-4">
                      Adicione o primeiro passo para começar a configurar o fluxo
                    </p>
                    <Button onClick={() => setShowCreateStep(true)} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Adicionar Primeiro Passo
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <CreateStepDialog
        open={showCreateStep}
        onOpenChange={setShowCreateStep}
        flowId={flow?.id}
        nextStepOrder={(steps.length + 1)}
      />
    </>
  );
};
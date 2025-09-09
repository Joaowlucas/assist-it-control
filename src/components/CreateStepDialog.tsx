import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWhatsAppFlows } from "@/hooks/useWhatsAppFlows";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";

interface CreateStepDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flowId: string;
  nextStepOrder: number;
}

interface InputOption {
  key: string;
  label: string;
  value: string;
}

export const CreateStepDialog = ({ open, onOpenChange, flowId, nextStepOrder }: CreateStepDialogProps) => {
  const { createFlowStep } = useWhatsAppFlows();
  const [formData, setFormData] = useState({
    step_name: "",
    step_type: "message" as "message" | "input" | "condition" | "action",
    message_text: "",
    input_type: "text" as "text" | "number" | "options",
    input_options: [] as InputOption[],
    actions: {} as any,
  });
  const [newOption, setNewOption] = useState({ key: "", label: "", value: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const stepData = {
        flow_id: flowId,
        step_order: nextStepOrder,
        step_type: formData.step_type,
        step_name: formData.step_name,
        message_text: formData.message_text || null,
        input_type: formData.step_type === "input" ? formData.input_type : null,
        input_options: formData.step_type === "input" && formData.input_type === "options" 
          ? formData.input_options 
          : [],
        actions: formData.step_type === "action" ? formData.actions : {},
      };

      await createFlowStep(stepData);
      onOpenChange(false);
      
      // Reset form
      setFormData({
        step_name: "",
        step_type: "message",
        message_text: "",
        input_type: "text",
        input_options: [],
        actions: {},
      });
      setNewOption({ key: "", label: "", value: "" });
    } catch (error) {
      console.error("Erro ao criar passo:", error);
    } finally {
      setLoading(false);
    }
  };

  const addOption = () => {
    if (newOption.key && newOption.label && newOption.value) {
      setFormData(prev => ({
        ...prev,
        input_options: [...prev.input_options, { ...newOption }]
      }));
      setNewOption({ key: "", label: "", value: "" });
    }
  };

  const removeOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      input_options: prev.input_options.filter((_, i) => i !== index)
    }));
  };

  const handleActionsChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      actions: {
        ...prev.actions,
        [field]: value
      }
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Passo ao Fluxo</DialogTitle>
          <DialogDescription>
            Configure um novo passo para o fluxo de conversa
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="step_name">Nome do Passo</Label>
              <Input
                id="step_name"
                value={formData.step_name}
                onChange={(e) => setFormData(prev => ({ ...prev, step_name: e.target.value }))}
                placeholder="Ex: Boas vindas"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="step_type">Tipo do Passo</Label>
              <Select
                value={formData.step_type}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, step_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="message">Mensagem</SelectItem>
                  <SelectItem value="input">Entrada do Usuário</SelectItem>
                  <SelectItem value="condition">Condição</SelectItem>
                  <SelectItem value="action">Ação</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {(formData.step_type === "message" || formData.step_type === "input") && (
            <div className="space-y-2">
              <Label htmlFor="message_text">Mensagem</Label>
              <Textarea
                id="message_text"
                value={formData.message_text}
                onChange={(e) => setFormData(prev => ({ ...prev, message_text: e.target.value }))}
                placeholder="Digite a mensagem que será enviada..."
                rows={4}
                required
              />
            </div>
          )}

          {formData.step_type === "input" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Configuração de Entrada</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="input_type">Tipo de Entrada</Label>
                  <Select
                    value={formData.input_type}
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, input_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Texto livre</SelectItem>
                      <SelectItem value="number">Número</SelectItem>
                      <SelectItem value="options">Opções</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.input_type === "options" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        placeholder="Tecla (ex: 1)"
                        value={newOption.key}
                        onChange={(e) => setNewOption(prev => ({ ...prev, key: e.target.value }))}
                      />
                      <Input
                        placeholder="Rótulo (ex: Urgente)"
                        value={newOption.label}
                        onChange={(e) => setNewOption(prev => ({ ...prev, label: e.target.value }))}
                      />
                      <Input
                        placeholder="Valor (ex: alta)"
                        value={newOption.value}
                        onChange={(e) => setNewOption(prev => ({ ...prev, value: e.target.value }))}
                      />
                    </div>
                    <Button type="button" onClick={addOption} variant="outline" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Adicionar Opção
                    </Button>
                    
                    <div className="flex flex-wrap gap-2">
                      {formData.input_options.map((option, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {option.key}: {option.label}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => removeOption(index)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {formData.step_type === "action" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Configuração de Ação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipo de Ação</Label>
                  <Select
                    onValueChange={(value) => {
                      if (value === "create_ticket") {
                        handleActionsChange("ticket", {
                          category: "outros",
                          create_user_if_needed: true
                        });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma ação" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="create_ticket">Criar Chamado</SelectItem>
                      <SelectItem value="send_email">Enviar Email</SelectItem>
                      <SelectItem value="webhook">Chamar Webhook</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message_text">Mensagem de Resposta</Label>
                  <Textarea
                    value={formData.message_text}
                    onChange={(e) => setFormData(prev => ({ ...prev, message_text: e.target.value }))}
                    placeholder="Mensagem enviada após executar a ação..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Adicionando..." : "Adicionar Passo"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
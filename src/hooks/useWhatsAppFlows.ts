import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface WhatsAppFlow {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  trigger_keywords: string[];
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppFlowStep {
  id: string;
  flow_id: string;
  step_order: number;
  step_type: string;
  step_name: string;
  message_text?: string | null;
  input_type?: string | null;
  input_options: any;
  condition_field?: string | null;
  condition_operator?: string | null;
  condition_value?: string | null;
  next_step_success?: string | null;
  next_step_failure?: string | null;
  actions: any;
  created_at: string;
  updated_at: string;
}

export const useWhatsAppFlows = () => {
  const [flows, setFlows] = useState<WhatsAppFlow[]>([]);
  const [flowSteps, setFlowSteps] = useState<{ [flowId: string]: WhatsAppFlowStep[] }>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchFlows = async () => {
    try {
      const { data, error } = await supabase
        .from("whatsapp_flows")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFlows(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar fluxos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFlowSteps = async (flowId: string) => {
    try {
      const { data, error } = await supabase
        .from("whatsapp_flow_steps")
        .select("*")
        .eq("flow_id", flowId)
        .order("step_order");

      if (error) throw error;
      setFlowSteps(prev => ({
        ...prev,
        [flowId]: data || []
      }));
    } catch (error: any) {
      toast({
        title: "Erro ao carregar passos",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const createFlow = async (flowData: any) => {
    try {
      const { data, error } = await supabase
        .from("whatsapp_flows")
        .insert(flowData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Fluxo criado",
        description: "Fluxo criado com sucesso!",
      });

      fetchFlows();
      return data;
    } catch (error: any) {
      toast({
        title: "Erro ao criar fluxo",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateFlow = async (id: string, flowData: Partial<WhatsAppFlow>) => {
    try {
      const { error } = await supabase
        .from("whatsapp_flows")
        .update(flowData)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Fluxo atualizado",
        description: "Fluxo atualizado com sucesso!",
      });

      fetchFlows();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar fluxo",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteFlow = async (id: string) => {
    try {
      const { error } = await supabase
        .from("whatsapp_flows")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Fluxo excluído",
        description: "Fluxo excluído com sucesso!",
      });

      fetchFlows();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir fluxo",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const createFlowStep = async (stepData: any) => {
    try {
      const { data, error } = await supabase
        .from("whatsapp_flow_steps")
        .insert(stepData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Passo adicionado",
        description: "Passo adicionado ao fluxo!",
      });

      if (stepData.flow_id) {
        fetchFlowSteps(stepData.flow_id);
      }
      return data;
    } catch (error: any) {
      toast({
        title: "Erro ao criar passo",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateFlowStep = async (id: string, stepData: Partial<WhatsAppFlowStep>) => {
    try {
      const { error } = await supabase
        .from("whatsapp_flow_steps")
        .update(stepData)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Passo atualizado",
        description: "Passo atualizado com sucesso!",
      });

      // Recarregar passos do fluxo
      const step = Object.values(flowSteps).flat().find(s => s.id === id);
      if (step) {
        fetchFlowSteps(step.flow_id);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar passo",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteFlowStep = async (id: string) => {
    try {
      const step = Object.values(flowSteps).flat().find(s => s.id === id);
      
      const { error } = await supabase
        .from("whatsapp_flow_steps")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Passo excluído",
        description: "Passo excluído com sucesso!",
      });

      if (step) {
        fetchFlowSteps(step.flow_id);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao excluir passo",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchFlows();
  }, []);

  return {
    flows,
    flowSteps,
    loading,
    fetchFlows,
    fetchFlowSteps,
    createFlow,
    updateFlow,
    deleteFlow,
    createFlowStep,
    updateFlowStep,
    deleteFlowStep,
  };
};
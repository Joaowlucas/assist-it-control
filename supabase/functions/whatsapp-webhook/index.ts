import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppMessage {
  event: string;
  data: {
    key: {
      remoteJid: string;
      fromMe: boolean;
    };
    message: {
      conversation?: string;
    };
    messageType: string;
  };
}

interface ConversationState {
  step: string;
  phone: string;
  userName?: string;
  userId?: string;
  unitId?: string;
  currentFlowId?: string;
  currentStepId?: string;
  flowData: { [key: string]: any };
}

// Armazenar conversas ativas temporariamente
const activeConversations = new Map<string, ConversationState>();

// Função para normalizar número de telefone
function normalizePhone(phone: string): string {
  return phone.replace(/[^\d]/g, '').slice(-10);
}

// Função para enviar mensagem via WhatsApp
async function sendWhatsAppMessage(supabase: any, phone: string, message: string): Promise<void> {
  try {
    console.log(`💬 Enviando mensagem para ${phone.substring(0, 6)}****`);
    console.log(`📝 Mensagem: ${message.substring(0, 50)}...`);
    
    await supabase.functions.invoke('send-whatsapp', {
      body: {
        phone: phone,
        message: message
      }
    });
    
    console.log('✅ Mensagem enviada com sucesso');
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error);
  }
}

// Função para substituir variáveis na mensagem
function replaceVariables(message: string, data: { [key: string]: any }): string {
  let result = message;
  
  // Substituir variáveis entre chaves {}
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    result = result.replace(regex, data[key] || '');
  });
  
  return result;
}

// Função para buscar fluxos ativos
async function getActiveFlows(supabase: any) {
  const { data: flows } = await supabase
    .from('whatsapp_flows')
    .select(`
      *,
      whatsapp_flow_steps (*)
    `)
    .eq('is_active', true);
  
  return flows || [];
}

// Função para encontrar fluxo baseado em palavra-chave
function findFlowByKeyword(flows: any[], messageText: string) {
  const lowerMessage = messageText.toLowerCase();
  
  for (const flow of flows) {
    if (flow.trigger_keywords?.some((keyword: string) => 
      lowerMessage.includes(keyword.toLowerCase())
    )) {
      return flow;
    }
  }
  
  return flows.find(flow => flow.name.includes('padrão') || flow.name.includes('Criar Chamado'));
}

// Função para processar passo do fluxo
async function processFlowStep(
  supabase: any,
  phone: string,
  messageText: string,
  conversation: ConversationState,
  flows: any[]
) {
  const currentFlow = flows.find(f => f.id === conversation.currentFlowId);
  if (!currentFlow) return;

  const steps = currentFlow.whatsapp_flow_steps.sort((a: any, b: any) => a.step_order - b.step_order);
  
  let currentStep = steps.find((s: any) => s.id === conversation.currentStepId);
  if (!currentStep) {
    currentStep = steps[0]; // Primeiro passo
  }

  console.log(`📍 Processando passo: ${currentStep.step_name} (${currentStep.step_type})`);

  switch (currentStep.step_type) {
    case 'message':
      // Enviar mensagem e avançar para próximo passo
      const message = replaceVariables(currentStep.message_text, conversation.flowData);
      await sendWhatsAppMessage(supabase, phone, message);
      
      // Avançar para próximo passo
      const nextStep = steps.find((s: any) => s.step_order === currentStep.step_order + 1);
      if (nextStep) {
        conversation.currentStepId = nextStep.id;
      }
      break;

    case 'input':
      // Processar entrada do usuário
      if (currentStep.input_type === 'options') {
        // Verificar se entrada é válida
        const validOption = currentStep.input_options?.find((opt: any) => 
          opt.key === messageText.trim() || opt.value === messageText.toLowerCase()
        );
        
        if (validOption) {
          // Salvar valor na conversa
          conversation.flowData[currentStep.step_name] = validOption.value;
          
          // Avançar para próximo passo
          const nextStep = steps.find((s: any) => s.step_order === currentStep.step_order + 1);
          if (nextStep) {
            conversation.currentStepId = nextStep.id;
            await processFlowStep(supabase, phone, '', conversation, flows);
          }
        } else {
          // Reenviar opções
          await sendWhatsAppMessage(supabase, phone, 
            `❌ Opção inválida. ${currentStep.message_text || 'Digite uma opção válida:'}`);
        }
      } else {
        // Texto livre ou número
        if (messageText.trim().length < 3) {
          await sendWhatsAppMessage(supabase, phone, 
            "❌ Muito curto. Tente novamente:");
          return;
        }
        
        // Salvar entrada
        conversation.flowData[currentStep.step_name] = messageText.trim();
        
        // Avançar para próximo passo
        const nextStep = steps.find((s: any) => s.step_order === currentStep.step_order + 1);
        if (nextStep) {
          conversation.currentStepId = nextStep.id;
          await processFlowStep(supabase, phone, '', conversation, flows);
        }
      }
      break;

    case 'action':
      // Executar ação
      if (currentStep.actions?.ticket) {
        await createTicketFromFlow(supabase, phone, conversation, currentStep);
      }
      
      // Limpar conversa após ação
      const conversationKey = normalizePhone(phone);
      activeConversations.delete(conversationKey);
      break;
  }
}

// Função para criar ticket a partir do fluxo
async function createTicketFromFlow(supabase: any, phone: string, conversation: ConversationState, step: any) {
  try {
    console.log('🎫 Criando chamado via fluxo...');
    
    let requester_id = conversation.userId;
    let unit_id = conversation.unitId;
    
    // Criar usuário temporário se necessário
    if (!requester_id) {
      const { data: firstUnit } = await supabase.from('units').select('id').limit(1).single();
      unit_id = firstUnit?.id;
      
      if (unit_id) {
        const { data: newUser } = await supabase
          .from('profiles')
          .insert({
            name: conversation.userName || 'Usuário WhatsApp',
            email: `${normalizePhone(phone)}@whatsapp.temp`,
            phone: normalizePhone(phone),
            unit_id: unit_id,
            role: 'user',
            status: 'ativo'
          })
          .select('id')
          .single();
          
        if (newUser) {
          requester_id = newUser.id;
        }
      }
    }
    
    // Criar chamado
    const { data: ticket, error } = await supabase
      .from('tickets')
      .insert({
        title: (conversation.flowData.problema || 'Chamado via WhatsApp').substring(0, 100),
        description: `📱 CHAMADO VIA WHATSAPP\n\n👤 ${conversation.userName}\n📞 ${phone}\n\n📝 PROBLEMA:\n${conversation.flowData.problema || 'Não especificado'}`,
        category: step.actions.ticket?.category || 'outros',
        priority: conversation.flowData.prioridade_escolha || conversation.flowData.prioridade || 'media',
        requester_id: requester_id,
        unit_id: unit_id,
        status: 'aberto'
      })
      .select('ticket_number')
      .single();

    if (!error && ticket) {
      const responseMessage = replaceVariables(
        step.message_text || '🎉 *CHAMADO CRIADO!*\n\n🎫 Número: *#{ticket_number}*',
        { 
          ...conversation.flowData, 
          ticket_number: ticket.ticket_number 
        }
      );
      
      await sendWhatsAppMessage(supabase, phone, responseMessage);
      console.log(`✅ Chamado #${ticket.ticket_number} criado via fluxo!`);
    } else {
      console.error('❌ Erro ao criar chamado:', error);
      await sendWhatsAppMessage(supabase, phone,
        '❌ Erro ao criar chamado. Tente novamente.');
    }
  } catch (error) {
    console.error('❌ Erro na criação via fluxo:', error);
    await sendWhatsAppMessage(supabase, phone,
      '❌ Erro interno. Nossa equipe foi notificada.');
  }
}

// Função principal para processar conversa
async function processConversation(
  supabase: any, 
  phone: string, 
  messageText: string, 
  userProfile?: any
): Promise<void> {
  console.log('🔄 Processando conversa...');
  
  const conversationKey = normalizePhone(phone);
  let conversation = activeConversations.get(conversationKey);
  
  // Buscar fluxos ativos
  const flows = await getActiveFlows(supabase);
  
  // NOVA CONVERSA
  if (!conversation) {
    console.log('🆕 Nova conversa iniciada');
    
    // Encontrar fluxo apropriado
    const selectedFlow = findFlowByKeyword(flows, messageText);
    if (!selectedFlow) {
      await sendWhatsAppMessage(supabase, phone, 
        '❌ Desculpe, não consegui entender. Tente enviar "ajuda" ou "suporte".');
      return;
    }
    
    // Iniciar nova conversa
    conversation = {
      step: 'flow',
      phone: phone,
      userName: userProfile ? userProfile.name : 'Usuário WhatsApp',
      userId: userProfile ? userProfile.id : undefined,
      unitId: userProfile ? userProfile.unit_id : undefined,
      currentFlowId: selectedFlow.id,
      currentStepId: undefined,
      flowData: {}
    };
    
    activeConversations.set(conversationKey, conversation);
    
    // Iniciar fluxo
    await processFlowStep(supabase, phone, messageText, conversation, flows);
  } else {
    // Continuar conversa existente
    console.log(`🔄 Continuando conversa - Fluxo: ${conversation.currentFlowId}`);
    await processFlowStep(supabase, phone, messageText, conversation, flows);
  }
  
  // Salvar estado da conversa
  activeConversations.set(conversationKey, conversation);
}

// WEBHOOK PRINCIPAL
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 === WEBHOOK CHAMADO ===');
    console.log(`🕒 ${new Date().toISOString()}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.text();
    const parsedBody: WhatsAppMessage = JSON.parse(body);
    
    console.log(`📨 Evento: ${parsedBody.event}`);

    // Filtrar apenas mensagens válidas
    if (parsedBody.event !== 'messages.upsert') {
      console.log(`⏭️ Evento ignorado: ${parsedBody.event}`);
      return new Response(JSON.stringify({ success: true, ignored: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const messageData = parsedBody.data;
    
    // Ignorar mensagens próprias
    if (messageData.key.fromMe) {
      console.log('⏭️ Mensagem própria ignorada');
      return new Response(JSON.stringify({ success: true, ignored: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Extrair texto da mensagem
    const messageText = messageData.message?.conversation;
    if (!messageText || messageText.trim() === '') {
      console.log('⏭️ Mensagem vazia ignorada');
      return new Response(JSON.stringify({ success: true, ignored: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`✅ Mensagem: ${messageText}`);

    // Extrair número de telefone
    const originalPhone = messageData.key.remoteJid.split('@')[0];
    const normalizedPhone = normalizePhone(originalPhone);
    
    console.log(`📞 Telefone: ${normalizedPhone}`);
    
    // Buscar usuário no sistema
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('id, name, unit_id, phone')
      .eq('phone', normalizedPhone)
      .single();
      
    console.log(`👤 Usuário: ${userProfile ? userProfile.name : 'Novo usuário'}`);
    
    // Processar conversa
    await processConversation(supabase, originalPhone, messageText, userProfile);
    
    console.log('✅ Processamento concluído');

    return new Response(JSON.stringify({
      success: true,
      user: userProfile ? userProfile.name : 'Novo usuário',
      message: messageText,
      processed: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Erro no webhook:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
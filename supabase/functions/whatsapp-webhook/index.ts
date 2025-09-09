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
  problem?: string;
  category?: string;
  priority?: string;
  isNewUser?: boolean;
}

// Armazenar conversas ativas temporariamente
const activeConversations = new Map<string, ConversationState>();

// Função para normalizar número de telefone
function normalizePhone(phone: string): string {
  return phone.replace(/[^\d]/g, '').slice(-10); // Últimos 10 dígitos
}

// Função para enviar mensagem via WhatsApp
async function sendWhatsAppMessage(supabase: any, phone: string, message: string): Promise<void> {
  try {
    console.log(`💬 Tentando enviar mensagem para ${phone.substring(0, 6)}****`);
    console.log(`📝 Mensagem: ${message.substring(0, 50)}...`);
    
    await supabase.functions.invoke('send-whatsapp', {
      body: {
        phone: phone,
        message: message
      }
    });
    
    console.log('✅ Resposta do send-whatsapp enviada');
  } catch (error) {
    console.error('❌ Erro ao invocar send-whatsapp:', error);
    console.error('📍 Stack trace:', error.stack);
  }
}

// FLUXO SIMPLIFICADO DE CONVERSA
async function processConversation(
  supabase: any, 
  phone: string, 
  messageText: string, 
  userProfile?: any
): Promise<void> {
  console.log('🔄 Iniciando processConversation');
  console.log(`📞 Phone: ${phone.substring(0, 6)}****`);
  console.log(`💬 Message: ${messageText}`);
  console.log(`👤 UserProfile: ${userProfile ? userProfile.name : 'Novo usuário'}`);
  
  const conversationKey = normalizePhone(phone);
  let conversation = activeConversations.get(conversationKey);
  
  console.log(`🗂️ Conversation key: ${conversationKey}`);
  console.log(`💾 Existing conversation: ${conversation ? `Etapa: ${conversation.step}` : 'Nova'}`);

  const input = messageText.trim().toLowerCase();

  // PRIMEIRA MENSAGEM - INICIAR FLUXO
  if (!conversation) {
    console.log('🆕 Nova conversa - iniciando');
    
    if (userProfile) {
      // Usuário cadastrado - menu completo
      await sendWhatsAppMessage(supabase, phone,
        `🤖 *BOT DE SUPORTE TI*\n\n👋 Olá ${userProfile.name}!\n\n*Digite 1 para criar chamado*\n\n1️⃣ Novo chamado\n2️⃣ Meus chamados\n3️⃣ Atendimento humano`
      );
      
      conversation = {
        step: 'menu',
        phone: phone,
        userName: userProfile.name,
        userId: userProfile.id,
        unitId: userProfile.unit_id,
        isNewUser: false
      };
    } else {
      // Novo usuário - direto ao problema
      await sendWhatsAppMessage(supabase, phone,
        `🤖 *BOT DE SUPORTE TI*\n\n👋 Olá! Vou te ajudar a abrir um chamado.\n\n📝 *Descreva o problema:*\n\nExemplos:\n• Computador não liga\n• Internet lenta\n• Email não funciona`
      );
      
      conversation = {
        step: 'problem',
        phone: phone,
        userName: 'Usuário WhatsApp',
        isNewUser: true
      };
    }
    
    activeConversations.set(conversationKey, conversation);
    return;
  }

  // PROCESSAR ETAPAS
  switch (conversation.step) {
    case 'menu':
      if (input === '1') {
        conversation.step = 'problem';
        await sendWhatsAppMessage(supabase, phone,
          `📝 *NOVO CHAMADO*\n\n*Descreva o problema:*`
        );
      } else if (input === '2' && conversation.userId) {
        // Buscar chamados do usuário
        const { data: tickets } = await supabase
          .from('tickets')
          .select('ticket_number, title, status')
          .eq('requester_id', conversation.userId)
          .order('created_at', { ascending: false })
          .limit(3);

        let statusMessage = `📋 *SEUS CHAMADOS:*\n\n`;
        if (tickets && tickets.length > 0) {
          tickets.forEach((ticket: any) => {
            statusMessage += `🎫 #${ticket.ticket_number}: ${ticket.title} (${ticket.status})\n`;
          });
        } else {
          statusMessage += `Nenhum chamado encontrado.\n`;
        }
        statusMessage += `\n*Digite 1 para novo chamado*`;
        
        await sendWhatsAppMessage(supabase, phone, statusMessage);
      } else {
        await sendWhatsAppMessage(supabase, phone,
          `❓ Digite 1 para criar chamado`
        );
      }
      break;

    case 'problem':
      if (messageText.trim().length < 3) {
        await sendWhatsAppMessage(supabase, phone,
          `❌ Muito curto.\n\n*Descreva o problema:*`
        );
        return;
      }
      
      conversation.problem = messageText.trim();
      conversation.step = 'priority';
      
      await sendWhatsAppMessage(supabase, phone,
        `✅ *CHAMADO:* ${messageText.trim()}\n\n⚡ *Urgência:*\n\n1️⃣ 🔴 Urgente\n2️⃣ 🟡 Normal\n3️⃣ 🟢 Baixa\n\n*Digite o número:*`
      );
      break;

    case 'priority':
      const priorities = ['alta', 'media', 'baixa'];
      const priorityLabels = ['🔴 Urgente', '🟡 Normal', '🟢 Baixa'];
      const priorityIndex = parseInt(input) - 1;
      
      if (priorityIndex >= 0 && priorityIndex < priorities.length) {
        conversation.priority = priorities[priorityIndex];
        
        // CRIAR CHAMADO IMEDIATAMENTE
        await createTicket(supabase, phone, conversation);
        
        // Limpar conversa
        activeConversations.delete(conversationKey);
        return;
      } else {
        await sendWhatsAppMessage(supabase, phone,
          `❌ Digite 1, 2 ou 3`
        );
      }
      break;
  }
  
  // Salvar estado da conversa
  activeConversations.set(conversationKey, conversation);
  console.log(`💾 Conversa salva - Etapa: ${conversation.step}`);
}

// Função para criar chamado
async function createTicket(supabase: any, phone: string, conversation: ConversationState) {
  try {
    console.log('🎫 Criando chamado...');
    
    let requester_id = conversation.userId;
    let unit_id = conversation.unitId;
    
    // Se não tem usuário, criar temporário
    if (!requester_id) {
      console.log('🆕 Criando usuário temporário');
      
      // Buscar primeira unidade
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
          console.log('✅ Usuário criado');
        }
      }
    }
    
    // Criar chamado
    const { data: ticket, error } = await supabase
      .from('tickets')
      .insert({
        title: conversation.problem!.substring(0, 100),
        description: `CHAMADO VIA WHATSAPP\n\nUsuário: ${conversation.userName}\nTelefone: ${phone}\n\nProblema: ${conversation.problem}`,
        category: 'outros',
        priority: conversation.priority || 'media',
        requester_id: requester_id,
        unit_id: unit_id,
        status: 'aberto'
      })
      .select('ticket_number')
      .single();

    if (!error && ticket) {
      await sendWhatsAppMessage(supabase, phone,
        `✅ *CHAMADO CRIADO!*\n\n🎫 #${ticket.ticket_number}\n📝 ${conversation.problem}\n⚡ ${conversation.priority}\n\n🕐 Nossa equipe entrará em contato!\n\n💬 *Digite qualquer mensagem para novo chamado*`
      );
      
      console.log(`✅ Chamado #${ticket.ticket_number} criado!`);
    } else {
      console.error('❌ Erro ao criar chamado:', error);
      await sendWhatsAppMessage(supabase, phone,
        `❌ Erro ao criar chamado.\n\n*Digite qualquer mensagem para tentar novamente*`
      );
    }
  } catch (error) {
    console.error('❌ Erro na criação:', error);
    await sendWhatsAppMessage(supabase, phone,
      `❌ Erro interno.\n\n*Digite qualquer mensagem para tentar novamente*`
    );
  }
}

// WEBHOOK PRINCIPAL
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 === WEBHOOK CHAMADO ===');
    console.log(`🕒 Timestamp: ${new Date().toISOString()}`);
    console.log(`📍 URL: ${req.url}`);
    console.log(`🌍 Method: ${req.method}`);
    console.log(`📋 Headers:`, Object.fromEntries(req.headers.entries()));

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.text();
    console.log(`📥 Body raw: ${body}`);
    
    const parsedBody: WhatsAppMessage = JSON.parse(body);
    console.log(`📨 Body parsed:`, JSON.stringify(parsedBody, null, 2));

    // Filtrar apenas mensagens válidas
    if (parsedBody.event !== 'messages.upsert') {
      console.log(`⏭️ Evento ignorado: ${parsedBody.event}`);
      return new Response(JSON.stringify({ success: true, ignored: true, event: parsedBody.event }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const messageData = parsedBody.data;
    
    // Ignorar mensagens próprias
    if (messageData.key.fromMe) {
      console.log('⏭️ Mensagem própria ignorada');
      return new Response(JSON.stringify({ success: true, ignored: true, reason: 'own_message' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Extrair texto da mensagem
    const messageText = messageData.message?.conversation;
    if (!messageText || messageText.trim() === '') {
      console.log('⏭️ Mensagem vazia ignorada');
      return new Response(JSON.stringify({ success: true, ignored: true, reason: 'empty_message' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`✅ Texto da mensagem: ${messageText}`);
    console.log(`✅ Evento aceito: ${parsedBody.event}`);

    // Extrair número de telefone
    const originalPhone = messageData.key.remoteJid.split('@')[0];
    console.log(`📞 Telefone original: ${originalPhone}`);
    
    const normalizedPhone = normalizePhone(originalPhone);
    console.log(`📞 Telefone normalizado: ${normalizedPhone}`);
    
    // Buscar usuário no sistema
    console.log('👤 Buscando usuário...');
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('id, name, unit_id, phone')
      .eq('phone', normalizedPhone)
      .single();
      
    console.log(`👤 Usuário encontrado: ${userProfile ? userProfile.name : 'Novo usuário'}`);
    
    console.log('💬 Iniciando processamento da conversa...');
    
    // Processar conversa
    await processConversation(supabase, originalPhone, messageText, userProfile);
    
    console.log('✅ Conversa processada com sucesso');

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

// FLUXO SIMPLIFICADO DE CONVERSA
async function processConversation(
  supabase: any, 
  phone: string, 
  messageText: string, 
  userProfile?: any
): Promise<void> {
  const conversationKey = normalizePhone(phone);
  let conversation = activeConversations.get(conversationKey);
  const input = messageText.trim().toLowerCase();
  
  console.log(`🔍 Input: "${input}"`);
  console.log(`📊 Conversa atual: ${conversation ? conversation.step : 'Nova'}`);

  // NOVA CONVERSA
  if (!conversation) {
    console.log('🆕 Iniciando nova conversa');
    
    // Ir direto para o problema
    conversation = {
      step: 'problem',
      phone: phone,
      userName: userProfile ? userProfile.name : 'Usuário WhatsApp',
      userId: userProfile ? userProfile.id : undefined,
      unitId: userProfile ? userProfile.unit_id : undefined,
      isNewUser: !userProfile
    };
    
    await sendWhatsAppMessage(supabase, phone,
      `🤖 *BOT DE SUPORTE TI*\n\n👋 Olá${userProfile ? ` ${userProfile.name}` : ''}!\n\n📝 *Descreva seu problema:*\n\nExemplos:\n• Computador não liga\n• Internet lenta\n• Email não funciona`
    );
    
    activeConversations.set(conversationKey, conversation);
    return;
  }

  // PROCESSAR ETAPAS
  switch (conversation.step) {
    case 'problem':
      if (messageText.trim().length < 3) {
        await sendWhatsAppMessage(supabase, phone,
          `❌ Muito curto.\n\n*Descreva melhor o problema:*`
        );
        return;
      }
      
      conversation.problem = messageText.trim();
      conversation.step = 'priority';
      
      await sendWhatsAppMessage(supabase, phone,
        `✅ Problema registrado!\n\n⚡ *Qual a urgência?*\n\n1️⃣ 🔴 Urgente\n2️⃣ 🟡 Normal  \n3️⃣ 🟢 Baixa\n\n*Digite 1, 2 ou 3:*`
      );
      break;

    case 'priority':
      const priorities = ['alta', 'media', 'baixa'];
      const priorityIndex = parseInt(input) - 1;
      
      if (priorityIndex >= 0 && priorityIndex < 3) {
        conversation.priority = priorities[priorityIndex];
        console.log(`✅ Prioridade selecionada: ${conversation.priority}`);
        
        // CRIAR CHAMADO IMEDIATAMENTE
        await createTicketNow(supabase, phone, conversation);
        
        // Limpar conversa
        activeConversations.delete(conversationKey);
        return;
      } else {
        await sendWhatsAppMessage(supabase, phone,
          `❌ Digite 1, 2 ou 3`
        );
      }
      break;
  }
  
  // Salvar conversa
  activeConversations.set(conversationKey, conversation);
  console.log(`💾 Conversa atualizada - Etapa: ${conversation.step}`);
}

// CRIAR CHAMADO
async function createTicketNow(supabase: any, phone: string, conversation: ConversationState) {
  try {
    console.log('🎫 Criando chamado final...');
    
    let requester_id = conversation.userId;
    let unit_id = conversation.unitId;
    
    // Criar usuário temporário se necessário
    if (!requester_id) {
      console.log('👤 Criando usuário temporário');
      
      // Buscar primeira unidade
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
          console.log('✅ Usuário temporário criado');
        }
      }
    }
    
    // Criar chamado
    const { data: ticket, error } = await supabase
      .from('tickets')
      .insert({
        title: conversation.problem!.substring(0, 100),
        description: `📱 CHAMADO VIA WHATSAPP\n\n👤 ${conversation.userName}\n📞 ${phone}\n\n📝 PROBLEMA:\n${conversation.problem}`,
        category: 'outros',
        priority: conversation.priority || 'media',
        requester_id: requester_id,
        unit_id: unit_id,
        status: 'aberto'
      })
      .select('ticket_number')
      .single();

    if (!error && ticket) {
      await sendWhatsAppMessage(supabase, phone,
        `🎉 *CHAMADO CRIADO!*\n\n🎫 Número: *#${ticket.ticket_number}*\n📝 ${conversation.problem}\n⚡ Prioridade: ${conversation.priority}\n\n✅ Nossa equipe foi notificada!\n\n📱 *Digite qualquer mensagem para criar outro chamado*`
      );
      
      console.log(`🎉 SUCESSO! Chamado #${ticket.ticket_number} criado via WhatsApp`);
    } else {
      console.error('❌ Erro ao criar chamado:', error);
      await sendWhatsAppMessage(supabase, phone,
        `❌ Erro ao criar chamado.\n\n*Digite qualquer mensagem para tentar novamente*`
      );
    }
  } catch (error) {
    console.error('❌ Erro na criação do chamado:', error);
    await sendWhatsAppMessage(supabase, phone,
      `❌ Erro interno. Nossa equipe foi notificada.\n\n*Digite qualquer mensagem para tentar novamente*`
    );
  }
}
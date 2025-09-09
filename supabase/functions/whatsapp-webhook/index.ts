import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppMessage {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  messageType: string;
  message: {
    conversation?: string;
    extendedTextMessage?: {
      text: string;
    };
  };
  pushName: string;
  messageTimestamp: number;
}

interface ConversationState {
  step: 'menu' | 'name' | 'unit' | 'problem' | 'category' | 'priority' | 'confirmation' | 'completed';
  userId?: string;
  userName?: string;
  userEmail?: string;
  selectedUnitId?: string;
  problem?: string;
  category?: string;
  priority?: string;
  phone: string;
  unitId?: string;
  isNewUser?: boolean;
}

// Armazenamento temporário de conversas
const activeConversations = new Map<string, ConversationState>();

// Normalizar número de telefone
function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('55') && cleaned.length > 11) {
    return cleaned.substring(2);
  }
  return cleaned;
}

// Enviar mensagem via WhatsApp
async function sendWhatsAppMessage(supabase: any, phone: string, message: string) {
  try {
    console.log(`💬 Tentando enviar mensagem para ${phone.substring(0, 6)}****`);
    console.log(`📝 Mensagem: ${message.substring(0, 50)}...`);
    
    const { data, error } = await supabase.functions.invoke('send-whatsapp', {
      body: {
        phone: phone,
        message: message
      }
    });
    
    if (error) {
      console.error('❌ Erro ao invocar send-whatsapp:', error);
      throw error;
    }
    
    console.log('✅ Resposta do send-whatsapp:', data);
    
  } catch (error) {
    console.error('❌ Erro crítico ao enviar mensagem WhatsApp:', error);
    console.error('📍 Stack trace:', error.stack);
    // Não lançar erro para não parar o fluxo
  }
}

// Processar fluxo de conversa baseado em regras
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
  console.log(`💾 Existing conversation:`, conversation ? 'Sim' : 'Não');

  // Nova conversa
  if (!conversation) {
    conversation = {
      step: 'menu',
      phone: phone,
      isNewUser: !userProfile
    };
    
    if (userProfile) {
      conversation.userId = userProfile.id;
      conversation.userName = userProfile.name;
      conversation.unitId = userProfile.unit_id;
    }
    
    activeConversations.set(conversationKey, conversation);
  }

  const input = messageText.trim().toLowerCase();

  switch (conversation.step) {
    case 'menu':
      if (conversation.isNewUser) {
        await sendWhatsAppMessage(supabase, phone, 
          `🤖 *BOT DE SUPORTE TI*\n\n👋 Olá! Seu número não está cadastrado.\n\n*Digite seu NOME COMPLETO para prosseguir:*`
        );
        conversation.step = 'name';
      } else {
        // Para usuários existentes, processar a opção do menu
        if (input === '1') {
          conversation.step = 'problem';
          await sendWhatsAppMessage(supabase, phone,
            `📝 *NOVO CHAMADO*\n\n*Descreva o problema em poucas palavras:*\n\nExemplos:\n• Computador não liga\n• Internet lenta\n• Email não funciona\n• Impressora com defeito`
          );
        } else if (input === '2') {
          // Buscar chamados do usuário
          const { data: tickets } = await supabase
            .from('tickets')
            .select('ticket_number, title, status')
            .eq('requester_id', conversation.userId)
            .order('created_at', { ascending: false })
            .limit(5);

          let statusMessage = `📋 *SEUS ÚLTIMOS CHAMADOS:*\n\n`;
          if (tickets && tickets.length > 0) {
            tickets.forEach((ticket: any) => {
              statusMessage += `🎫 #${ticket.ticket_number} - ${ticket.title}\n📊 Status: ${ticket.status}\n\n`;
            });
          } else {
            statusMessage += `Nenhum chamado encontrado.\n\n`;
          }
          statusMessage += `*Digite 1 para abrir novo chamado*`;
          
          await sendWhatsAppMessage(supabase, phone, statusMessage);
          
        } else if (input === '3') {
          await sendWhatsAppMessage(supabase, phone,
            `👨‍💻 *ATENDIMENTO HUMANO*\n\nEm breve um técnico entrará em contato.\n\n*Digite 1 para abrir chamado automático*`
          );
        } else {
          // Primeira vez ou opção inválida - mostrar menu
          await sendWhatsAppMessage(supabase, phone,
            `🤖 *BOT DE SUPORTE TI*\n\n👋 Olá ${conversation.userName}!\n\n*Escolha uma opção:*\n\n1️⃣ Abrir novo chamado\n2️⃣ Status dos meus chamados\n3️⃣ Falar com atendente\n\n*Digite o número da opção:*`
          );
        }
      }
      break;

    case 'name':
      if (messageText.trim().length < 3) {
        await sendWhatsAppMessage(supabase, phone,
          `❌ Nome muito curto.\n\n*Digite seu NOME COMPLETO:*`
        );
        return;
      }
      
      conversation.userName = messageText.trim();
      
      // Buscar unidades
      const { data: units } = await supabase.from('units').select('id, name').order('name');
      let unitsMessage = `✅ Nome: ${conversation.userName}\n\n🏢 *Selecione sua unidade:*\n\n`;
      
      units?.forEach((unit: any, index: number) => {
        unitsMessage += `${index + 1}️⃣ ${unit.name}\n`;
      });
      
      await sendWhatsAppMessage(supabase, phone, unitsMessage);
      conversation.step = 'unit';
      break;

    case 'unit':
      const { data: availableUnits } = await supabase.from('units').select('id, name').order('name');
      const unitIndex = parseInt(input) - 1;
      
      if (unitIndex >= 0 && unitIndex < availableUnits.length) {
        const selectedUnit = availableUnits[unitIndex];
        conversation.selectedUnitId = selectedUnit.id;
        
        // Criar usuário
        const { data: newUser, error } = await supabase
          .from('profiles')
          .insert({
            name: conversation.userName,
            email: `${normalizePhone(phone)}@whatsapp.temp`,
            phone: normalizePhone(phone),
            unit_id: selectedUnit.id,
            role: 'user',
            status: 'ativo'
          })
          .select()
          .single();

        if (!error) {
          conversation.userId = newUser.id;
          conversation.unitId = newUser.unit_id;
          conversation.isNewUser = false;
          
          await sendWhatsAppMessage(supabase, phone,
            `✅ *CADASTRO REALIZADO!*\n\n👤 ${conversation.userName}\n🏢 ${selectedUnit.name}\n\n📝 *Agora descreva o problema:*\n\nExemplos:\n• Computador não liga\n• Internet lenta\n• Email não funciona`
          );
          conversation.step = 'problem';
        } else {
          await sendWhatsAppMessage(supabase, phone,
            `❌ Erro no cadastro. Tente novamente.`
          );
        }
      } else {
        await sendWhatsAppMessage(supabase, phone,
          `❌ Unidade inválida.\n\n*Digite o número correto (1 a ${availableUnits.length}):*`
        );
      }
      break;

    case 'problem':
      if (messageText.trim().length < 10) {
        await sendWhatsAppMessage(supabase, phone,
          `❌ Descrição muito curta.\n\n*Descreva melhor o problema (mínimo 10 caracteres):*`
        );
        return;
      }
      
      conversation.problem = messageText.trim();
      await sendWhatsAppMessage(supabase, phone,
        `✅ Problema: "${messageText.trim()}"\n\n📂 *Categoria:*\n\n1️⃣ Hardware (PC, impressora)\n2️⃣ Software (programas)\n3️⃣ Rede/Internet\n4️⃣ Email\n5️⃣ Acesso/Senhas\n6️⃣ Outros\n\n*Digite o número:*`
      );
      conversation.step = 'category';
      break;

    case 'category':
      const categories = ['hardware', 'software', 'rede', 'email', 'acesso', 'outros'];
      const categoryIndex = parseInt(input) - 1;
      
      if (categoryIndex >= 0 && categoryIndex < categories.length) {
        conversation.category = categories[categoryIndex];
        
        await sendWhatsAppMessage(supabase, phone,
          `✅ Categoria: ${categories[categoryIndex]}\n\n⚡ *Prioridade:*\n\n1️⃣ 🔴 Alta (Urgente)\n2️⃣ 🟡 Média (Normal)\n3️⃣ 🟢 Baixa (Pode aguardar)\n\n*Digite o número:*`
        );
        conversation.step = 'priority';
      } else {
        await sendWhatsAppMessage(supabase, phone,
          `❌ Categoria inválida.\n\n*Digite 1 a 6:*`
        );
      }
      break;

    case 'priority':
      const priorities = ['alta', 'media', 'baixa'];
      const priorityIndex = parseInt(input) - 1;
      
      if (priorityIndex >= 0 && priorityIndex < priorities.length) {
        conversation.priority = priorities[priorityIndex];
        
        await sendWhatsAppMessage(supabase, phone,
          `📋 *RESUMO DO CHAMADO:*\n\n👤 ${conversation.userName}\n📝 ${conversation.problem}\n📂 ${conversation.category}\n⚡ ${conversation.priority}\n\n*Digite:*\n✅ SIM - Criar chamado\n❌ NÃO - Cancelar`
        );
        conversation.step = 'confirmation';
      } else {
        await sendWhatsAppMessage(supabase, phone,
          `❌ Prioridade inválida.\n\n*Digite 1, 2 ou 3:*`
        );
      }
      break;

    case 'confirmation':
      if (input.includes('sim') || input.includes('s') || input === '1') {
        // Criar chamado
        const { data: newTicket, error } = await supabase
          .from('tickets')
          .insert({
            title: conversation.problem!.substring(0, 100),
            description: `CHAMADO VIA WHATSAPP\n\nUsuário: ${conversation.userName}\nTelefone: ${phone}\n\nProblema: ${conversation.problem}`,
            category: conversation.category,
            priority: conversation.priority,
            requester_id: conversation.userId,
            unit_id: conversation.unitId || conversation.selectedUnitId,
            status: 'aberto'
          })
          .select('ticket_number')
          .single();

        if (!error) {
          await sendWhatsAppMessage(supabase, phone,
            `✅ *CHAMADO CRIADO!*\n\n🎫 Número: #${newTicket.ticket_number}\n📝 ${conversation.problem}\n\n🕐 Aguarde o atendimento!\n\n*Digite qualquer coisa para novo chamado*`
          );
          
          console.log(`Chamado #${newTicket.ticket_number} criado via WhatsApp para ${conversation.userName}`);
        } else {
          await sendWhatsAppMessage(supabase, phone,
            `❌ Erro ao criar chamado.\n\n*Digite SIM para tentar novamente*`
          );
          return;
        }
        
        // Resetar conversa
        activeConversations.delete(conversationKey);
        
      } else if (input.includes('nao') || input.includes('não') || input.includes('n')) {
        await sendWhatsAppMessage(supabase, phone,
          `❌ Chamado cancelado.\n\n*Digite qualquer coisa para recomeçar*`
        );
        activeConversations.delete(conversationKey);
      } else {
        await sendWhatsAppMessage(supabase, phone,
          `❓ Não entendi.\n\n*Digite SIM ou NÃO:*`
        );
      }
      break;
  }

  // Atualizar conversa
  activeConversations.set(conversationKey, conversation);
}

serve(async (req) => {
  // Log TODAS as tentativas de acesso
  console.log('🚀 === WEBHOOK CHAMADO ===');
  console.log('🕒 Timestamp:', new Date().toISOString());
  console.log('🌍 Method:', req.method);
  console.log('📍 URL:', req.url);
  
  // Log headers importantes
  const headers = {};
  req.headers.forEach((value, key) => {
    headers[key] = value;
  });
  console.log('📋 Headers:', JSON.stringify(headers, null, 2));

  if (req.method === 'OPTIONS') {
    console.log('✅ Respondendo OPTIONS (CORS)');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🤖 Processando webhook...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Tentar ler o body
    let body;
    let bodyText = '';
    try {
      bodyText = await req.text();
      console.log('📥 Body raw:', bodyText);
      
      if (bodyText) {
        body = JSON.parse(bodyText);
        console.log('📨 Body parsed:', JSON.stringify(body, null, 2));
      } else {
        console.log('⚠️ Body vazio');
        return new Response(JSON.stringify({ success: true, message: 'Body vazio' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } catch (parseError) {
      console.error('❌ Erro ao fazer parse do body:', parseError);
      console.log('📄 Raw body content:', bodyText);
      return new Response(JSON.stringify({ 
        error: 'Invalid JSON', 
        rawBody: bodyText,
        success: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verificar evento
    if (body.event !== 'messages.upsert') {
      console.log('📭 Evento ignorado:', body.event);
      return new Response(JSON.stringify({ success: true, ignored: true, event: body.event }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ Evento aceito: messages.upsert');

    // Verificar mensagem
    if (!body.data?.key || body.data.key.fromMe) {
      console.log('📱 Mensagem do bot ignorada - fromMe:', body.data?.key?.fromMe);
      return new Response(JSON.stringify({ success: true, ignored: true, reason: 'fromMe' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ Mensagem válida para processamento');

    const messageData: WhatsAppMessage = body.data;
    
    // Extrair texto
    let messageText = '';
    if (messageData.message?.conversation) {
      messageText = messageData.message.conversation;
    } else if (messageData.message?.extendedTextMessage?.text) {
      messageText = messageData.message.extendedTextMessage.text;
    }

    if (!messageText?.trim()) {
      console.log('📝 Mensagem sem texto válido');
      return new Response(JSON.stringify({ success: true, ignored: true, reason: 'no text' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ Texto da mensagem:', messageText);

    // Extrair telefone
    const phoneNumber = messageData.key.remoteJid.replace('@s.whatsapp.net', '');
    const normalizedPhone = normalizePhone(phoneNumber);
    
    console.log('📞 Telefone original:', phoneNumber);
    console.log('📞 Telefone normalizado:', normalizedPhone);

    // Buscar usuário
    console.log('👤 Buscando usuário...');
    const { data: userProfiles } = await supabase
      .from('profiles')
      .select('id, name, email, unit_id')
      .or(`phone.eq.${phoneNumber},phone.eq.${normalizedPhone}`)
      .eq('status', 'ativo');

    const userProfile = userProfiles?.[0];
    console.log('👤 Usuário encontrado:', userProfile?.name || 'Novo usuário');

    // Processar conversa
    console.log('💬 Iniciando processamento da conversa...');
    try {
      await processConversation(supabase, phoneNumber, messageText, userProfile);
      console.log('✅ Conversa processada com sucesso');
    } catch (conversationError) {
      console.error('❌ Erro no processamento da conversa:', conversationError);
      console.error('📍 Stack da conversa:', conversationError.stack);
      
      // Tentar enviar mensagem de erro para o usuário
      try {
        await sendWhatsAppMessage(supabase, phoneNumber, 
          '🤖 Desculpe, ocorreu um erro temporário. Tente novamente em alguns instantes.'
        );
      } catch (errorMsgError) {
        console.error('❌ Erro ao enviar mensagem de erro:', errorMsgError);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      user: userProfile?.name || 'Novo usuário',
      message: messageText,
      processed: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ ERRO CRÍTICO:', error);
    console.error('📚 Stack:', error.stack);
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
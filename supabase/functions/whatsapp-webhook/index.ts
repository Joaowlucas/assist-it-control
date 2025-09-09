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
  step: 'greeting' | 'registration_name' | 'registration_unit' | 'registration_confirm' | 'problem' | 'category' | 'priority' | 'confirmation' | 'completed';
  userId?: string;
  userName?: string;
  userEmail?: string;
  selectedUnitId?: string;
  problem?: string;
  category?: string;
  priority?: string;
  phone: string;
  unitId?: string;
  isRegistering?: boolean;
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
  await supabase.functions.invoke('send-whatsapp', {
    body: {
      phone: phone,
      message: message
    }
  });
}

// Processar diferentes etapas da conversa
async function processConversation(
  supabase: any, 
  phone: string, 
  messageText: string, 
  userProfile?: any
): Promise<void> {
  const conversationKey = normalizePhone(phone);
  let conversation = activeConversations.get(conversationKey);

  // Se não existe conversa, iniciar nova
  if (!conversation) {
    if (userProfile) {
      // Usuário cadastrado - fluxo normal
      conversation = {
        step: 'greeting',
        userId: userProfile.id,
        userName: userProfile.name,
        phone: phone,
        unitId: userProfile.unit_id,
        isRegistering: false
      };
    } else {
      // Usuário não cadastrado - fluxo de registro
      conversation = {
        step: 'greeting',
        phone: phone,
        isRegistering: true
      };
    }
    activeConversations.set(conversationKey, conversation);
  }

  switch (conversation.step) {
    case 'greeting':
      if (conversation.isRegistering) {
        await sendWhatsAppMessage(supabase, phone, 
          `👋 Olá! Bem-vindo ao atendimento de TI!\n\nVejo que seu número ainda não está cadastrado no sistema. Vou te ajudar a se registrar rapidamente para que você possa abrir chamados.\n\n📝 *Para começar, me informe seu nome completo:*`
        );
        conversation.step = 'registration_name';
      } else {
        await sendWhatsAppMessage(supabase, phone, 
          `Olá ${userProfile.name}! 👋\n\nSou o assistente de TI da Marka. Estou aqui para ajudar você a abrir um chamado.\n\n📝 *Por favor, descreva qual é o problema que você está enfrentando:*\n\nExemplo: "Meu computador não liga" ou "Não consigo acessar o email"`
        );
        conversation.step = 'problem';
      }
      break;

    case 'registration_name':
      conversation.userName = messageText.trim();
      
      // Buscar unidades disponíveis
      const { data: units } = await supabase.from('units').select('id, name').order('name');
      let unitsMessage = `✅ Obrigado, ${conversation.userName}!\n\n🏢 *Agora selecione sua unidade/setor:*\n\n`;
      
      units?.forEach((unit: any, index: number) => {
        unitsMessage += `${index + 1}️⃣ ${unit.name}\n`;
      });
      
      unitsMessage += `\n*Digite o número da sua unidade:*`;
      
      await sendWhatsAppMessage(supabase, phone, unitsMessage);
      conversation.step = 'registration_unit';
      break;

    case 'registration_unit':
      // Buscar unidades novamente para mapear a seleção
      const { data: availableUnits } = await supabase.from('units').select('id, name').order('name');
      const unitIndex = parseInt(messageText.trim()) - 1;
      
      if (unitIndex >= 0 && unitIndex < availableUnits.length) {
        const selectedUnit = availableUnits[unitIndex];
        conversation.selectedUnitId = selectedUnit.id;
        conversation.userEmail = `${normalizePhone(phone)}@temp.whatsapp.com`;
        
        await sendWhatsAppMessage(supabase, phone,
          `✅ *Informações do cadastro:*\n\n👤 Nome: ${conversation.userName}\n🏢 Unidade: ${selectedUnit.name}\n📱 WhatsApp: ${phone}\n\n*Digite "CONFIRMAR" para finalizar o cadastro ou "CORRIGIR" para refazer:*`
        );
        conversation.step = 'registration_confirm';
      } else {
        await sendWhatsAppMessage(supabase, phone,
          `❌ Opção inválida. Por favor, digite o número correspondente à sua unidade (1 a ${availableUnits.length}).`
        );
      }
      break;

    case 'registration_confirm':
      const confirmText = messageText.toLowerCase().trim();
      
      if (confirmText.includes('confirmar') || confirmText.includes('sim') || confirmText.includes('ok')) {
        try {
          // Criar o usuário
          const { data: newUser, error: userError } = await supabase
            .from('profiles')
            .insert({
              name: conversation.userName,
              email: conversation.userEmail,
              phone: normalizePhone(phone),
              unit_id: conversation.selectedUnitId,
              role: 'user',
              status: 'ativo'
            })
            .select()
            .single();

          if (userError) {
            console.error('Erro ao criar usuário:', userError);
            await sendWhatsAppMessage(supabase, phone,
              `❌ Erro ao criar cadastro. Tente novamente mais tarde ou entre em contato com o suporte.`
            );
            activeConversations.delete(conversationKey);
            return;
          }

          // Atualizar conversa com dados do usuário criado
          conversation.userId = newUser.id;
          conversation.unitId = newUser.unit_id;
          conversation.isRegistering = false;

          await sendWhatsAppMessage(supabase, phone,
            `✅ *Cadastro realizado com sucesso!*\n\n🎉 Bem-vindo ao sistema, ${conversation.userName}!\n\nAgora você pode abrir chamados de TI sempre que precisar.\n\n📝 *Vamos abrir seu primeiro chamado! Descreva qual é o problema que você está enfrentando:*\n\nExemplo: "Meu computador não liga" ou "Não consigo acessar o email"`
          );
          conversation.step = 'problem';
        } catch (error) {
          console.error('Erro no cadastro:', error);
          await sendWhatsAppMessage(supabase, phone,
            `❌ Erro interno. Tente novamente mais tarde.`
          );
          activeConversations.delete(conversationKey);
        }
      } else if (confirmText.includes('corrigir') || confirmText.includes('não') || confirmText.includes('nao')) {
        await sendWhatsAppMessage(supabase, phone,
          `🔄 Vamos refazer o cadastro.\n\n📝 *Me informe seu nome completo:*`
        );
        conversation.step = 'registration_name';
        // Limpar dados anteriores
        delete conversation.userName;
        delete conversation.selectedUnitId;
        delete conversation.userEmail;
      } else {
        await sendWhatsAppMessage(supabase, phone,
          `🔄 Não entendi sua resposta.\n\n✅ Digite "CONFIRMAR" para finalizar o cadastro\n❌ Digite "CORRIGIR" para refazer`
        );
      }
      break;

    case 'problem':
      conversation.problem = messageText;
      await sendWhatsAppMessage(supabase, phone,
        `✅ Problema registrado: "${messageText}"\n\n📂 *Agora me diga qual categoria melhor descreve seu problema:*\n\n1️⃣ Hardware (computador, impressora, equipamentos)\n2️⃣ Software (programas, aplicativos)\n3️⃣ Rede (internet, wifi, conexão)\n4️⃣ Email (problemas com e-mail)\n5️⃣ Acesso (senhas, permissões)\n6️⃣ Outros\n\n*Digite o número ou nome da categoria:*`
      );
      conversation.step = 'category';
      break;

    case 'category':
      const categoryMap: { [key: string]: string } = {
        '1': 'hardware', 'hardware': 'hardware',
        '2': 'software', 'software': 'software', 
        '3': 'rede', 'rede': 'rede',
        '4': 'email', 'email': 'email',
        '5': 'acesso', 'acesso': 'acesso',
        '6': 'outros', 'outros': 'outros'
      };
      
      const categoryInput = messageText.toLowerCase().trim();
      conversation.category = categoryMap[categoryInput] || 'outros';
      
      await sendWhatsAppMessage(supabase, phone,
        `✅ Categoria: ${conversation.category}\n\n⚡ *Qual é a urgência do seu problema?*\n\n🔴 *Alta* - Problema que impede completamente o trabalho\n🟡 *Média* - Problema que dificulta o trabalho\n🟢 *Baixa* - Problema que pode aguardar\n\n*Digite: Alta, Média ou Baixa*`
      );
      conversation.step = 'priority';
      break;

    case 'priority':
      const priorityMap: { [key: string]: string } = {
        'alta': 'alta', 'alto': 'alta', 'urgente': 'alta',
        'media': 'media', 'média': 'media', 'normal': 'media',
        'baixa': 'baixa', 'baixo': 'baixa', 'pouco': 'baixa'
      };
      
      const priorityInput = messageText.toLowerCase().trim();
      conversation.priority = priorityMap[priorityInput] || 'media';
      
      // Mostrar resumo para confirmação
      await sendWhatsAppMessage(supabase, phone,
        `📋 *RESUMO DO CHAMADO*\n\n👤 Solicitante: ${conversation.userName}\n📝 Problema: ${conversation.problem}\n📂 Categoria: ${conversation.category}\n⚡ Prioridade: ${conversation.priority}\n\n✅ *Digite "CONFIRMAR" para criar o chamado*\n❌ *Digite "CANCELAR" para cancelar*`
      );
      conversation.step = 'confirmation';
      break;

    case 'confirmation':
      const confirmInput = messageText.toLowerCase().trim();
      
      if (confirmInput.includes('confirmar') || confirmInput.includes('sim') || confirmInput.includes('ok')) {
        // Criar o chamado
        const { data: newTicket, error: ticketError } = await supabase
          .from('tickets')
          .insert({
            title: conversation.problem!.substring(0, 100),
            description: `CHAMADO CRIADO VIA WHATSAPP\n\nUsuário: ${conversation.userName}\nTelefone: ${phone}\n\nDescrição do problema:\n${conversation.problem}`,
            category: conversation.category,
            priority: conversation.priority,
            requester_id: conversation.userId,
            unit_id: conversation.unitId || conversation.selectedUnitId,
            status: 'aberto'
          })
          .select('ticket_number, id')
          .single();

        if (ticketError) {
          console.error('Erro ao criar chamado:', ticketError);
          await sendWhatsAppMessage(supabase, phone,
            `❌ Erro ao criar o chamado. Tente novamente mais tarde ou entre em contato com o suporte.`
          );
        } else {
          await sendWhatsAppMessage(supabase, phone,
            `✅ *CHAMADO CRIADO COM SUCESSO!*\n\n🎫 *Número:* #${newTicket.ticket_number}\n📝 *Título:* ${conversation.problem}\n📂 *Categoria:* ${conversation.category}\n⚡ *Prioridade:* ${conversation.priority}\n\n🔄 *Status:* Aberto\n⏰ *Criado em:* ${new Date().toLocaleString('pt-BR')}\n\n✨ Seu chamado foi registrado e será atendido em breve!\n\n💬 Para abrir um novo chamado, basta enviar uma mensagem.`
          );
          console.log(`Chamado #${newTicket.ticket_number} criado via WhatsApp para ${conversation.userName}`);
        }
        
        conversation.step = 'completed';
        // Limpar conversa após 5 minutos
        setTimeout(() => {
          activeConversations.delete(conversationKey);
        }, 5 * 60 * 1000);
        
      } else if (confirmInput.includes('cancelar') || confirmInput.includes('não') || confirmInput.includes('nao')) {
        await sendWhatsAppMessage(supabase, phone,
          `❌ Chamado cancelado.\n\n💬 Se precisar de ajuda, basta enviar uma nova mensagem!`
        );
        activeConversations.delete(conversationKey);
      } else {
        await sendWhatsAppMessage(supabase, phone,
          `🔄 Não entendi sua resposta.\n\n✅ Digite "CONFIRMAR" para criar o chamado\n❌ Digite "CANCELAR" para cancelar`
        );
      }
      break;

    case 'completed':
      // Reiniciar conversa
      activeConversations.delete(conversationKey);
      await processConversation(supabase, phone, messageText, userProfile);
      break;
  }

  // Atualizar estado da conversa
  if (conversation.step !== 'completed') {
    activeConversations.set(conversationKey, conversation);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Webhook WhatsApp recebido');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    console.log('Dados recebidos:', JSON.stringify(body, null, 2));

    // Verificar se é um evento de mensagem
    if (!body.event || body.event !== 'messages.upsert') {
      console.log(`Evento ignorado: ${body.event || 'sem evento'}`);
      return new Response(JSON.stringify({ success: true, message: 'Event ignored' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verificar se há dados da mensagem
    if (!body.data || !body.data.key) {
      console.log('Dados de mensagem inválidos');
      return new Response(JSON.stringify({ success: true, message: 'Invalid message data' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verificar se é uma mensagem recebida (não enviada pelo bot)
    if (body.data.key.fromMe) {
      console.log('Mensagem ignorada: enviada pelo bot');
      return new Response(JSON.stringify({ success: true, message: 'Message from bot ignored' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const messageData: WhatsAppMessage = body.data;
    
    // Extrair texto da mensagem
    let messageText = '';
    if (messageData.message?.conversation) {
      messageText = messageData.message.conversation;
    } else if (messageData.message?.extendedTextMessage?.text) {
      messageText = messageData.message.extendedTextMessage.text;
    }

    if (!messageText || messageText.trim().length === 0) {
      console.log('Mensagem sem texto ignorada');
      return new Response(JSON.stringify({ success: true, message: 'No text' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extrair e normalizar número de telefone
    const phoneNumber = messageData.key.remoteJid.replace('@s.whatsapp.net', '');
    const normalizedPhone = normalizePhone(phoneNumber);
    console.log('Número extraído:', phoneNumber);
    console.log('Número normalizado:', normalizedPhone);

    // Buscar usuário pelo telefone (tentando ambos os formatos)
    const { data: userProfiles, error: userError } = await supabase
      .from('profiles')
      .select('id, name, email, unit_id')
      .or(`phone.eq.${phoneNumber},phone.eq.${normalizedPhone}`)
      .eq('status', 'ativo');

    if (userError) {
      console.error('Erro ao buscar usuário:', userError);
      throw userError;
    }

    let userProfile = null;
    if (userProfiles && userProfiles.length > 0) {
      // Se há múltiplos usuários, usar o primeiro
      userProfile = userProfiles[0];
      if (userProfiles.length > 1) {
        console.log(`Múltiplos usuários encontrados para o telefone ${phoneNumber}. Usando: ${userProfile.name}`);
      }
      console.log('Usuário encontrado:', userProfile.name);
    } else {
      console.log('Usuário não encontrado para o telefone:', phoneNumber);
    }

    // Processar conversa interativa (com ou sem usuário cadastrado)
    await processConversation(supabase, phoneNumber, messageText, userProfile);

    return new Response(JSON.stringify({ 
      success: true, 
      user: userProfile?.name || 'Usuário não cadastrado',
      phone: phoneNumber
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro no webhook WhatsApp:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
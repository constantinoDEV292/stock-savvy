import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { tipo, produto_nome, quantidade, responsavel, departamento, motivo, responsavel_recebeu, quantidade_minima } = body;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    let message = '';

    if (tipo === 'stock_baixo') {
      message = `⚠️ ALERTA STOCK BAIXO

📦 Produto: ${produto_nome}
🔴 Stock atual: ${quantidade}
📊 Mínimo definido: ${quantidade_minima}
👷 Última movimentação por: ${responsavel}
🏢 Departamento: ${departamento}
📅 Data: ${new Date().toLocaleString('pt-PT', { timeZone: 'Europe/Lisbon' })}

⚡ Reposição necessária!`;
    } else {
      const tipoLabel = tipo === 'entrada' ? '📥 ENTRADA' : '📤 SAÍDA';
      const recebeuInfo = responsavel_recebeu ? `\n👤 Recebido por: ${responsavel_recebeu}` : '';
      
      message = `${tipoLabel} de Material

📦 Produto: ${produto_nome}
🔢 Quantidade: ${quantidade}
👷 Responsável: ${responsavel}${recebeuInfo}
🏢 Departamento: ${departamento}
📝 Motivo: ${motivo}
📅 Data: ${new Date().toLocaleString('pt-PT', { timeZone: 'Europe/Lisbon' })}`;
    }

    // Store alert record
    await supabase.from('alertas').insert({
      produto_id: '00000000-0000-0000-0000-000000000000',
      tipo_alerta: tipo === 'stock_baixo' ? 'stock_baixo' : 'notificacao_movimento',
      mensagem: message,
      status_envio: 'pendente',
    });

    // Telegram notifications paused
    // const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    // const chatId = Deno.env.get('TELEGRAM_CHAT_ID');
    console.log('Telegram notifications are currently paused');

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

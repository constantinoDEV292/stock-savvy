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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch all active products
    const { data: produtos, error: prodError } = await supabase
      .from('produtos')
      .select('*')
      .eq('ativo', true)
      .order('nome');

    if (prodError) throw prodError;

    // Fetch today's movements
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { data: movHoje, error: movError } = await supabase
      .from('movimentacoes')
      .select('*')
      .gte('created_at', today.toISOString());

    if (movError) throw movError;

    const entradasHoje = movHoje?.filter(m => m.tipo === 'entrada') || [];
    const saidasHoje = movHoje?.filter(m => m.tipo === 'saida') || [];

    const totalProdutos = produtos?.length || 0;
    const totalStock = produtos?.reduce((sum: number, p: any) => sum + p.quantidade, 0) || 0;
    const stockBaixo = produtos?.filter((p: any) => p.quantidade <= p.quantidade_minima) || [];

    let stockBaixoList = '';
    if (stockBaixo.length > 0) {
      stockBaixoList = stockBaixo
        .map((p: any) => `  ⚠️ ${p.nome} (${p.codigo}): ${p.quantidade}/${p.quantidade_minima}`)
        .join('\n');
    } else {
      stockBaixoList = '  ✅ Nenhum produto abaixo do mínimo';
    }

    const dataFormatada = new Date().toLocaleDateString('pt-PT', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const message = `📊 RESUMO DIÁRIO DE STOCK
📅 ${dataFormatada}

━━━━━━━━━━━━━━━━━━━━
📦 Produtos ativos: ${totalProdutos}
📈 Total em stock: ${totalStock} itens

📥 Entradas hoje: ${entradasHoje.length}
📤 Saídas hoje: ${saidasHoje.length}

🔴 STOCK BAIXO (${stockBaixo.length}):
${stockBaixoList}
━━━━━━━━━━━━━━━━━━━━

🏭 Sistema de Gestão de Stock`;

    // Send Telegram notification
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const chatId = Deno.env.get('TELEGRAM_CHAT_ID');

    if (botToken && chatId) {
      const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
      const res = await fetch(telegramUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
        }),
      });

      const result = await res.json();
      console.log('Telegram response:', JSON.stringify(result));

      if (!result.ok) {
        console.error('Telegram error:', result.description);
      }
    } else {
      console.warn('TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured');
    }

    return new Response(JSON.stringify({ success: true, message }), {
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

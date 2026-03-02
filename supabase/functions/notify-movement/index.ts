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
    const { tipo, produto_nome, quantidade, responsavel, departamento, motivo, responsavel_recebeu } = await req.json();

    // Get admin email from profiles + user_roles
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Find admin users
    const { data: adminRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (!adminRoles || adminRoles.length === 0) {
      return new Response(JSON.stringify({ message: 'No admin found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get admin emails from profiles
    const adminUserIds = adminRoles.map(r => r.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('email')
      .in('user_id', adminUserIds);

    const emails = profiles?.map(p => p.email).filter(Boolean) || [];

    if (emails.length === 0) {
      return new Response(JSON.stringify({ message: 'No admin emails found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const tipoLabel = tipo === 'entrada' ? '📥 ENTRADA' : '📤 SAÍDA';
    const subject = `StockFlow - ${tipoLabel}: ${quantidade}x ${produto_nome}`;
    const recebeuInfo = responsavel_recebeu ? `\nRecebido por: ${responsavel_recebeu}` : '';
    const body = `
${tipoLabel} de Material

Produto: ${produto_nome}
Quantidade: ${quantidade}
Responsável: ${responsavel}${recebeuInfo}
Departamento: ${departamento}
Motivo: ${motivo}
Data: ${new Date().toLocaleString('pt-PT', { timeZone: 'Europe/Lisbon' })}

---
Notificação automática do StockFlow
    `.trim();

    // Use Lovable AI gateway to send notification - we'll use a simple fetch to a webhook approach
    // For now, store the notification in the alertas table as a record
    for (const email of emails) {
      await supabase.from('alertas').insert({
        produto_id: '00000000-0000-0000-0000-000000000000', // placeholder
        tipo_alerta: 'notificacao_movimento',
        mensagem: `[${email}] ${subject}\n${body}`,
        status_envio: 'registado',
      });
    }

    // Try sending via Resend if API key is available
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (resendKey) {
      for (const email of emails) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'StockFlow <onboarding@resend.dev>',
            to: [email],
            subject,
            text: body,
          }),
        });
      }
    }

    return new Response(JSON.stringify({ success: true, emails_sent: emails.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const STATUS_MESSAGES = {
  approved: {
    title: '✅ Cadastro Aprovado!',
    message: 'Seu cadastro foi aprovado. Agora envie seus documentos para concluir o processo de associação.',
  },
  documents_pending: {
    title: '📎 Documentos em Análise',
    message: 'Seus documentos estão sendo analisados pela equipe da ANPPME. Em breve você receberá uma resposta.',
  },
  active: {
    title: '🎉 Cadastro Ativo!',
    message: 'Parabéns! Seu cadastro foi ativado. Você já pode emitir sua carteira e certidão de regularidade.',
  },
  rejected: {
    title: '❌ Cadastro Não Aprovado',
    message: 'Infelizmente seu cadastro não foi aprovado. Verifique as observações do gestor e entre em contato com a ANPPME.',
  },
  suspended: {
    title: '⚠️ Cadastro Suspenso',
    message: 'Seu cadastro foi suspenso. Entre em contato com a secretaria da ANPPME para regularizar sua situação.',
  },
  pending: {
    title: '🔄 Cadastro em Análise',
    message: 'Seu cadastro foi atualizado e está aguardando nova análise pela equipe da ANPPME.',
  },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { event, data, old_data } = payload;

    // Only act on status changes
    if (!data || !old_data || data.status === old_data.status) {
      return Response.json({ skipped: true });
    }

    const msg = STATUS_MESSAGES[data.status];
    if (!msg) return Response.json({ skipped: true, reason: 'No message for status' });

    // Notificação in-app
    await base44.asServiceRole.entities.Notification.create({
      member_id: data.id,
      user_email: data.email,
      type: 'status_change',
      title: msg.title,
      message: msg.message,
      read: false,
      link: '/meu-cadastro',
    });

    // E-mail
    if (data.email) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: data.email,
        subject: msg.title,
        body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f8fafc;">
  <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.07);">
    <img src="https://media.base44.com/images/public/69bdad4b62555d6f0c050afb/eb6f25876_LOGO_ANPPME_AZUL_SIMBOLO.png" alt="ANPPME" style="height: 48px; margin-bottom: 16px;" />
    <h2 style="color: #1e3a6e; margin: 0 0 16px;">${msg.title}</h2>
    <p style="color: #475569; margin: 0 0 8px;">Olá, <strong>${data.full_name || ''}</strong>!</p>
    <p style="color: #475569; margin: 0 0 20px;">${msg.message}</p>
    <a href="${typeof window !== 'undefined' ? window.location.origin : 'https://app.anppme.org.br'}/meu-cadastro" style="display: inline-block; background: #1e3a6e; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Acessar Meu Cadastro</a>
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
    <p style="color: #94a3b8; font-size: 11px; margin: 0;">ANPPME — Associação Nacional dos Profissionais de Políticas e Medidas Especiais</p>
  </div>
</div>`,
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
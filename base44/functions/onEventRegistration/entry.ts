/**
 * Disparado quando um EventRegistration é criado ou atualizado.
 * - Criação: envia e-mail + notificação de confirmação de inscrição
 * - Attended marcado como true: envia e-mail de certificado disponível
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { event, data, old_data } = payload;

    if (!data) return Response.json({ skipped: true });

    const eventType = event?.type;

    // ── Nova inscrição ──────────────────────────────────────────────
    if (eventType === 'create' && data.status === 'confirmed') {
      // Busca evento para obter detalhes
      const events = await base44.asServiceRole.entities.Event.filter({ id: data.event_id });
      const ev = events[0];
      const eventTitle = ev?.title || data.event_title || 'Evento';
      const startDate = ev?.start_date ? new Date(ev.start_date).toLocaleDateString('pt-BR') : '';
      const location = ev?.is_online ? 'Online' : (ev?.location ? `${ev.location}${ev.city ? ` — ${ev.city}` : ''}` : '');

      // Notificação in-app
      await base44.asServiceRole.entities.Notification.create({
        member_id: data.member_id,
        user_email: data.member_email,
        type: 'general',
        title: `✅ Inscrição confirmada: ${eventTitle}`,
        message: `Sua inscrição no evento "${eventTitle}"${startDate ? ` (${startDate})` : ''} foi confirmada com sucesso!`,
        read: false,
        link: '/eventos',
      });

      // E-mail de confirmação
      if (data.member_email) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: data.member_email,
          subject: `✅ Inscrição confirmada — ${eventTitle}`,
          body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f8fafc;">
  <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.07);">
    <img src="https://media.base44.com/images/public/69bdad4b62555d6f0c050afb/eb6f25876_LOGO_ANPPME_AZUL_SIMBOLO.png" alt="ANPPME" style="height: 48px; margin-bottom: 16px;" />
    <h2 style="color: #1e3a6e; margin: 0 0 8px;">Inscrição Confirmada!</h2>
    <p style="color: #475569; margin: 0 0 20px;">Olá, <strong>${data.member_name}</strong>!</p>
    <p style="color: #475569; margin: 0 0 8px;">Sua inscrição foi confirmada com sucesso:</p>
    <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0 0 6px; font-weight: bold; color: #1e3a6e; font-size: 16px;">${eventTitle}</p>
      ${startDate ? `<p style="margin: 0 0 4px; color: #475569;">📅 ${startDate}</p>` : ''}
      ${location ? `<p style="margin: 0; color: #475569;">📍 ${location}</p>` : ''}
    </div>
    <p style="color: #475569; font-size: 13px;">Acesse o portal para mais informações sobre o evento.</p>
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
    <p style="color: #94a3b8; font-size: 11px; margin: 0;">ANPPME — Associação Nacional dos Profissionais de Políticas e Medidas Especiais</p>
  </div>
</div>`,
        });
      }

      return Response.json({ success: true, action: 'registration_confirmed' });
    }

    // ── Presença confirmada → certificado disponível ────────────────
    if (eventType === 'update' && data.attended === true && old_data?.attended !== true) {
      // Só notifica se já tem certificado gerado
      if (!data.certificate_id && !data.certificate_url) {
        return Response.json({ skipped: true, reason: 'Certificate not yet generated' });
      }

      await base44.asServiceRole.entities.Notification.create({
        member_id: data.member_id,
        user_email: data.member_email,
        type: 'general',
        title: `🏆 Certificado disponível: ${data.event_title}`,
        message: `Seu certificado de participação no evento "${data.event_title}" está disponível para download!`,
        read: false,
        link: '/meus-certificados',
      });

      if (data.member_email) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: data.member_email,
          subject: `🏆 Certificado disponível — ${data.event_title}`,
          body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f8fafc;">
  <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.07);">
    <img src="https://media.base44.com/images/public/69bdad4b62555d6f0c050afb/eb6f25876_LOGO_ANPPME_AZUL_SIMBOLO.png" alt="ANPPME" style="height: 48px; margin-bottom: 16px;" />
    <h2 style="color: #1e3a6e; margin: 0 0 8px;">🏆 Certificado Disponível</h2>
    <p style="color: #475569; margin: 0 0 20px;">Olá, <strong>${data.member_name}</strong>!</p>
    <p style="color: #475569; margin: 0 0 8px;">Seu certificado de participação no evento <strong>"${data.event_title}"</strong> já está disponível.</p>
    <p style="color: #475569; margin: 0 0 20px;">Acesse a seção <strong>Meus Certificados</strong> no portal para fazer o download.</p>
    ${data.certificate_url ? `<a href="${data.certificate_url}" style="display: inline-block; background: #1e3a6e; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-bottom: 20px;">⬇ Baixar Certificado</a>` : ''}
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
    <p style="color: #94a3b8; font-size: 11px; margin: 0;">ANPPME — Associação Nacional dos Profissionais de Políticas e Medidas Especiais</p>
  </div>
</div>`,
        });
      }

      return Response.json({ success: true, action: 'certificate_available' });
    }

    // ── Inscrição cancelada ─────────────────────────────────────────
    if (eventType === 'update' && data.status === 'cancelled' && old_data?.status !== 'cancelled') {
      await base44.asServiceRole.entities.Notification.create({
        member_id: data.member_id,
        user_email: data.member_email,
        type: 'general',
        title: `❌ Inscrição cancelada: ${data.event_title}`,
        message: `Sua inscrição no evento "${data.event_title}" foi cancelada.`,
        read: false,
        link: '/eventos',
      });

      return Response.json({ success: true, action: 'registration_cancelled' });
    }

    return Response.json({ skipped: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
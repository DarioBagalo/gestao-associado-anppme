import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Load settings
    const settingsList = await base44.asServiceRole.entities.AppSettings.filter({ key: 'registration_config' });
    const reminderDays = settingsList.length > 0 ? (settingsList[0].renewal_reminder_days || 30) : 30;

    const today = new Date();
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + reminderDays);
    const targetStr = targetDate.toISOString().split('T')[0];

    // Get active members
    const members = await base44.asServiceRole.entities.Member.filter({ status: 'active' });

    let notified = 0;
    for (const member of members) {
      if (!member.active_until) continue;
      
      // Check if active_until is within the reminder window (today to targetDate)
      const expiryDate = new Date(member.active_until);
      const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry > 0 && daysUntilExpiry <= reminderDays) {
        // Check if already notified recently (avoid duplicate notifications)
        const existingNotifs = await base44.asServiceRole.entities.Notification.filter({
          member_id: member.id,
          type: 'renewal_reminder',
        });
        
        // Only notify if no notification in the last 7 days
        const recentNotif = existingNotifs.find(n => {
          const d = new Date(n.created_date);
          return (today - d) < 7 * 24 * 60 * 60 * 1000;
        });
        
        if (!recentNotif) {
          // Create in-app notification
          await base44.asServiceRole.entities.Notification.create({
            member_id: member.id,
            user_email: member.email,
            type: 'renewal_reminder',
            title: '⏰ Sua anuidade vence em breve!',
            message: `Sua anuidade vence em ${daysUntilExpiry} dia(s), em ${new Date(member.active_until).toLocaleDateString('pt-BR')}. Entre em contato com a ANPPME para renovar.`,
            read: false,
          });

          // Send email notification
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: member.email,
            subject: `⏰ ANPPME — Sua anuidade vence em ${daysUntilExpiry} dia(s)`,
            body: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #1e3a6e; padding: 24px; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 20px;">ANPPME</h1>
                  <p style="color: rgba(255,255,255,0.7); margin: 4px 0 0; font-size: 12px;">Associação Nacional de Pregoeiros e Agentes de Contratação</p>
                </div>
                <div style="padding: 32px 24px; background: #f9fafb;">
                  <h2 style="color: #1e3a6e; margin: 0 0 16px;">Olá, ${member.full_name}!</h2>
                  <p style="color: #374151; line-height: 1.6;">Sua anuidade como associado da ANPPME vence em <strong>${daysUntilExpiry} dia(s)</strong>, no dia <strong>${new Date(member.active_until).toLocaleDateString('pt-BR')}</strong>.</p>
                  <p style="color: #374151; line-height: 1.6;">Para manter seus benefícios de associado — incluindo acesso à carteira, certidão e convênios — entre em contato com nossa equipe para realizar a renovação.</p>
                  <div style="margin-top: 24px; padding: 16px; background: #fef3c7; border-left: 4px solid #d97706; border-radius: 4px;">
                    <p style="color: #92400e; margin: 0; font-size: 14px;"><strong>Registro:</strong> ${member.registration_number || 'N/A'}</p>
                  </div>
                  <p style="color: #6b7280; margin-top: 24px; font-size: 13px;">Atenciosamente,<br/><strong>Equipe ANPPME</strong></p>
                </div>
              </div>
            `,
          });

          notified++;
        }
      }
    }

    return Response.json({ 
      success: true, 
      notified,
      reminderDays,
      message: `${notified} associado(s) notificado(s) sobre vencimento de anuidade.`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all active members
    const members = await base44.asServiceRole.entities.Member.filter({ status: 'active' });

    const today = new Date();
    const in30days = new Date(today);
    in30days.setDate(today.getDate() + 30);
    const in7days = new Date(today);
    in7days.setDate(today.getDate() + 7);

    let sent = 0;

    for (const m of members) {
      if (!m.active_until || !m.email) continue;
      const expiry = new Date(m.active_until);

      // Check if 30 days warning or 7 days warning
      const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

      if (diffDays === 30 || diffDays === 7) {
        // Avoid duplicate notifications on same day
        const existing = await base44.asServiceRole.entities.Notification.filter({
          user_email: m.email,
          type: 'renewal_reminder',
        });
        const todayStr = today.toISOString().split('T')[0];
        const alreadySent = existing.some(n => n.created_date?.startsWith(todayStr));
        if (alreadySent) continue;

        await base44.asServiceRole.entities.Notification.create({
          member_id: m.id,
          user_email: m.email,
          type: 'renewal_reminder',
          title: `⏰ Anuidade vence em ${diffDays} dias`,
          message: `Sua anuidade ANPPME vencerá em ${diffDays} dias (${expiry.toLocaleDateString('pt-BR')}). Entre em contato para renovação.`,
          read: false,
          link: '/financeiro',
        });
        sent++;
      }

      // Already expired — notify once
      if (expiry < today) {
        const recent = await base44.asServiceRole.entities.Notification.filter({
          user_email: m.email,
          type: 'renewal_reminder',
        });
        const hasExpiredNotif = recent.some(n => n.title?.includes('vencida'));
        if (!hasExpiredNotif) {
          await base44.asServiceRole.entities.Notification.create({
            member_id: m.id,
            user_email: m.email,
            type: 'renewal_reminder',
            title: '🚨 Anuidade Vencida',
            message: `Sua anuidade ANPPME venceu em ${expiry.toLocaleDateString('pt-BR')}. Regularize sua situação para manter o acesso aos benefícios.`,
            read: false,
            link: '/financeiro',
          });
          sent++;
        }
      }
    }

    return Response.json({ success: true, notifications_sent: sent });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
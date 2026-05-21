import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { member_id, user_email, type, title, message, link } = await req.json();

    await base44.asServiceRole.entities.Notification.create({
      member_id,
      user_email,
      type: type || 'general',
      title,
      message,
      read: false,
      link: link || '',
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { base44 } from '@/api/base44Client';

const LOGO_URL = 'https://media.base44.com/images/public/69bdad4b62555d6f0c050afb/eb6f25876_LOGO_ANPPME_AZUL_SIMBOLO.png';
const PORTAL_URL = typeof window !== 'undefined' ? window.location.origin : 'https://anppme.base44.app';
const CONTACT_PHONE = '(69) 99912-4124';
const CONTACT_EMAIL = 'anppme@gmail.com';
const CONTACT_WA = 'https://wa.me/5569999124124';

const STATUS_LABELS = {
  pending: 'Pendente de Aprovação',
  payment_pending: 'Pendente de Pagamento',
  approved: 'Aprovado – Aguardando Documentos',
  documents_pending: 'Documentos em Análise',
  active: 'Ativo',
  rejected: 'Rejeitado',
  suspended: 'Suspenso',
};

function emailWrapper(content) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc">
      <div style="background:#1e3a6e;padding:24px;text-align:center">
        <img src="${LOGO_URL}" alt="ANPPME" style="height:48px;object-fit:contain;margin-bottom:8px;" />
        <h1 style="color:#fff;margin:0;font-size:20px;font-weight:800;letter-spacing:2px">ANPPME</h1>
        <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:11px">Associação Nacional de Pregoeiros e Agentes de Contratação</p>
      </div>
      <div style="padding:28px 32px;background:#fff;border:1px solid #e5e7eb;border-top:none">
        ${content}
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
        <div style="text-align:center;font-size:11px;color:#6b7280">
          <p style="margin:0 0 4px">
            📞 ${CONTACT_PHONE} &nbsp;|&nbsp; 
            ✉️ ${CONTACT_EMAIL} &nbsp;|&nbsp;
            <a href="${CONTACT_WA}" style="color:#25D366">WhatsApp</a>
          </p>
          <p style="margin:4px 0">
            <a href="${PORTAL_URL}" style="color:#1e3a6e;text-decoration:none">Acessar Portal ANPPME</a>
          </p>
          <p style="margin:8px 0 0;color:#9ca3af;font-size:10px">Este é um e-mail automático gerado pelo sistema ANPPME · CNPJ: 28.325.407/0001-08</p>
        </div>
      </div>
    </div>
  `;
}

export async function sendStatusChangeEmail(memberEmail, memberName, newStatus, adminNotes = '') {
  const statusLabel = STATUS_LABELS[newStatus] || newStatus;

  let bodyExtra = '';
  if (newStatus === 'approved') {
    bodyExtra = `<p>Acesse o portal e envie seus documentos para concluir o cadastro.</p>
      <p style="text-align:center;margin:16px 0"><a href="${PORTAL_URL}/meu-cadastro" style="background:#1e3a6e;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:bold">Enviar Documentos</a></p>`;
  } else if (newStatus === 'payment_pending') {
    bodyExtra = `<p>Seu cadastro foi aprovado! Realize o pagamento da anuidade para prosseguir.</p>
      <p>Em caso de dúvidas sobre formas de pagamento, entre em contato conosco.</p>
      <p style="text-align:center;margin:16px 0"><a href="${CONTACT_WA}" style="background:#25D366;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:bold">Falar no WhatsApp</a></p>`;
  } else if (newStatus === 'documents_pending') {
    bodyExtra = `<p>Seus documentos estão sendo analisados pela nossa equipe. Em breve você receberá um retorno.</p>
      <p style="text-align:center;margin:16px 0"><a href="${PORTAL_URL}/meu-cadastro" style="background:#1e3a6e;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:bold">Ver meu Cadastro</a></p>`;
  } else if (newStatus === 'rejected') {
    bodyExtra = adminNotes ? `<p><strong>Motivo:</strong> ${adminNotes}</p>` : '';
    bodyExtra += `<p>Entre em contato com a ANPPME para mais informações.</p>`;
  } else if (newStatus === 'active') {
    bodyExtra = `<p>🎉 Parabéns! Seu cadastro está <strong>ativo</strong>. Você já pode emitir sua Carteira de Associado e Certidão de Regularidade.</p>
      <p style="text-align:center;margin:16px 0"><a href="${PORTAL_URL}" style="background:#1e3a6e;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:bold">Acessar Portal</a></p>`;
  } else if (newStatus === 'suspended') {
    bodyExtra = `<p>Seu cadastro foi suspenso. Entre em contato com a ANPPME para regularizar sua situação.</p>
      <p style="text-align:center;margin:16px 0"><a href="${CONTACT_WA}" style="background:#25D366;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:bold">Falar no WhatsApp</a></p>`;
  }

  await base44.integrations.Core.SendEmail({
    from_name: 'ANPPME',
    to: memberEmail,
    subject: `[ANPPME] Atualização do cadastro: ${statusLabel}`,
    body: emailWrapper(`
      <p>Olá, <strong>${memberName}</strong>,</p>
      <p>O status do seu cadastro foi atualizado para:</p>
      <div style="background:#f0f4ff;border-left:4px solid #1e3a6e;padding:12px 16px;margin:16px 0;font-weight:bold;font-size:16px;color:#1e3a6e">
        ${statusLabel}
      </div>
      ${bodyExtra}
      <p>Em caso de dúvidas, entre em contato com a secretaria da ANPPME.</p>
    `),
  });
}

export async function sendNewRegistrationEmail(adminEmail, memberName, memberEmail) {
  await base44.integrations.Core.SendEmail({
    from_name: 'ANPPME',
    to: adminEmail,
    subject: `[ANPPME] Novo cadastro submetido: ${memberName}`,
    body: emailWrapper(`
      <p>Um novo cadastro foi submetido e <strong>aguarda aprovação</strong>:</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;background:#f8fafc">Nome</td><td style="padding:8px;border:1px solid #e5e7eb">${memberName}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;background:#f8fafc">E-mail</td><td style="padding:8px;border:1px solid #e5e7eb">${memberEmail}</td></tr>
      </table>
      <p style="text-align:center;margin:20px 0">
        <a href="${PORTAL_URL}/admin" style="background:#1e3a6e;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold">
          Revisar no Painel Administrativo
        </a>
      </p>
    `),
  });
}

export async function sendRenewalReminderEmail(memberEmail, memberName, activeUntil, daysLeft) {
  const urgency = daysLeft <= 7 ? 'URGENTE: ' : '';
  await base44.integrations.Core.SendEmail({
    from_name: 'ANPPME',
    to: memberEmail,
    subject: `[ANPPME] ${urgency}Anuidade vence em ${daysLeft} dia(s)`,
    body: emailWrapper(`
      <p>Olá, <strong>${memberName}</strong>,</p>
      <p>Sua anuidade junto à ANPPME vence em <strong>${daysLeft} dia(s)</strong> (${activeUntil}).</p>
      <p>Para manter seu cadastro ativo e continuar usufruindo dos benefícios de associado, realize a renovação com antecedência.</p>
      <p style="text-align:center;margin:20px 0">
        <a href="${CONTACT_WA}" style="background:#25D366;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold">
          Renovar via WhatsApp
        </a>
      </p>
      <p>Ou entre em contato: ${CONTACT_PHONE} · ${CONTACT_EMAIL}</p>
    `),
  });
}
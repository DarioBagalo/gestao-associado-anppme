import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jsPDF } from 'npm:jspdf@4.0.0';

// Generate a unique certificate code
function generateCertificateCode() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ANPPME-${timestamp}-${random}`;
}

// Format date in Portuguese
function formatDatePtBr(dateStr) {
  if (!dateStr) return '';
  const months = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];
  const d = new Date(dateStr + 'T12:00:00');
  return `${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()}`;
}

// Fetch image as base64
async function fetchImageAsBase64(url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  const contentType = response.headers.get('content-type') || 'image/png';
  return { base64, contentType };
}

// Generate QR Code as SVG data URL (simple implementation)
function generateQRCodeDataURL(text) {
  // We'll use a public QR API for generation
  return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(text)}&format=png`;
}

// Draw a certificate page (front or back)
async function drawCertificatePage(doc, templateUrl, isFirstPage, {
  memberName,
  eventLabel,
  participationLabel,
  cityDateLabel,
  workloadLabel,
  certificateCode,
  signatures,
  verifyUrl,
  pageWidth,
  pageHeight
}) {
  // Draw background template
  if (templateUrl) {
    const { base64, contentType } = await fetchImageAsBase64(templateUrl);
    const imgFormat = contentType.includes('png') ? 'PNG' : 'JPEG';
    doc.addImage(base64, imgFormat, 0, 0, pageWidth, pageHeight);
  } else {
    // White background fallback
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
  }

  // Only add dynamic content on front page (back is static art)
  if (isFirstPage) {
    // --- MEMBER NAME ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(15, 40, 90);
    const nameY = pageHeight * 0.42;
    doc.text(memberName, pageWidth / 2, nameY, { align: 'center' });

    // --- PARTICIPATION LABEL ---
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    const participationY = pageHeight * 0.50;
    doc.text(participationLabel || 'pela participação no Curso', pageWidth * 0.12, participationY);

    // --- EVENT TITLE ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 40, 90);
    const eventLines = doc.splitTextToSize(eventLabel || '', pageWidth * 0.76);
    const eventY = pageHeight * 0.555;
    doc.text(eventLines, pageWidth * 0.12, eventY);

    // --- CITY / DATE ---
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    const cityDateY = pageHeight * 0.66;
    doc.text(cityDateLabel || '', pageWidth * 0.12, cityDateY);

    // --- WORKLOAD ---
    if (workloadLabel) {
      doc.setFontSize(11);
      doc.text(workloadLabel, pageWidth * 0.12, cityDateY + 9);
    }

    // --- SIGNATURES (centered, dynamic) ---
    const enabledSigs = (signatures || []).filter(s => s.enabled && s.signer_name);
    if (enabledSigs.length > 0) {
      const sigAreaY = pageHeight * 0.815;
      const sigAreaWidth = pageWidth * 0.76;
      const sigAreaStart = pageWidth * 0.12;
      const sigWidth = 45;
      const sigHeight = 18;
      const spacing = sigAreaWidth / enabledSigs.length;

      for (let i = 0; i < enabledSigs.length; i++) {
        const sig = enabledSigs[i];
        const centerX = sigAreaStart + spacing * i + spacing / 2;

        // Signature image
        if (sig.signature_url) {
          const { base64 } = await fetchImageAsBase64(sig.signature_url);
          doc.addImage(base64, 'PNG', centerX - sigWidth / 2, sigAreaY - sigHeight - 2, sigWidth, sigHeight);
        }

        // Line
        doc.setDrawColor(40, 40, 40);
        doc.setLineWidth(0.4);
        doc.line(centerX - 28, sigAreaY, centerX + 28, sigAreaY);

        // Signer name
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(20, 20, 20);
        doc.text(sig.signer_name, centerX, sigAreaY + 4, { align: 'center' });

        // Signer role
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(60, 60, 60);
        doc.text(sig.signer_role || '', centerX, sigAreaY + 8, { align: 'center' });
      }
    }
  }

  // --- QR CODE + AUTH CODE (both pages) ---
  const qrUrl = generateQRCodeDataURL(verifyUrl);
  const { base64: qrBase64 } = await fetchImageAsBase64(qrUrl);
  const qrSize = 22;
  const qrX = pageWidth - 30;
  const qrY = pageHeight - 30;
  doc.addImage(qrBase64, 'PNG', qrX, qrY, qrSize, qrSize);

  // Auth code text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(80, 80, 80);
  doc.text(`Cód.: ${certificateCode}`, qrX + qrSize / 2, qrY - 2, { align: 'center' });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Acesso negado. Apenas administradores.' }, { status: 403 });
    }

    const body = await req.json();
    const { eventId, registrationIds } = body;

    if (!eventId) {
      return Response.json({ error: 'eventId é obrigatório.' }, { status: 400 });
    }

    // Fetch event data
    const events = await base44.asServiceRole.entities.Event.filter({ id: eventId });
    if (!events || events.length === 0) {
      return Response.json({ error: 'Evento não encontrado.' }, { status: 404 });
    }
    const event = events[0];

    // Fetch registrations
    let registrations;
    if (registrationIds && registrationIds.length > 0) {
      registrations = await base44.asServiceRole.entities.EventRegistration.filter({
        event_id: eventId,
        attended: true
      });
      registrations = registrations.filter(r => registrationIds.includes(r.id));
    } else {
      registrations = await base44.asServiceRole.entities.EventRegistration.filter({
        event_id: eventId,
        attended: true
      });
    }

    if (!registrations || registrations.length === 0) {
      return Response.json({ error: 'Nenhum participante com presença confirmada encontrado.' }, { status: 400 });
    }

    const results = [];
    const appBaseUrl = Deno.env.get('APP_URL') || 'https://anppme.base44.app';

    for (const reg of registrations) {
      // Check if certificate already exists
      const existing = await base44.asServiceRole.entities.Certificate.filter({
        event_registration_id: reg.id
      });

      let certCode;
      let certRecord;

      if (existing && existing.length > 0 && existing[0].file_url) {
        results.push({ registration_id: reg.id, member_name: reg.member_name, certificate_url: existing[0].file_url, skipped: true });
        continue;
      }

      certCode = existing && existing.length > 0 ? existing[0].certificate_code : generateCertificateCode();

      const verifyUrl = `${appBaseUrl}/verificar-certidao?code=${certCode}`;

      // Page setup: A4 landscape
      const pageWidth = 297;
      const pageHeight = 210;
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

      const cityDateLabel = event.certificate_city && event.certificate_issue_date_label
        ? `${event.certificate_city}, ${event.certificate_issue_date_label}.`
        : (event.certificate_issue_date_label || '');

      const workloadLabel = event.workload_hours
        ? `Carga Horária: ${event.workload_hours} horas`
        : '';

      const drawParams = {
        memberName: reg.member_name,
        eventLabel: event.certificate_event_label || event.title,
        participationLabel: event.certificate_participation_label || 'pela participação no Curso',
        cityDateLabel,
        workloadLabel,
        certificateCode: certCode,
        signatures: event.signatures || [],
        verifyUrl,
        pageWidth,
        pageHeight
      };

      // Draw front page
      await drawCertificatePage(doc, event.certificate_template_front_url, true, drawParams);

      // Draw back page
      if (event.certificate_template_back_url) {
        doc.addPage();
        await drawCertificatePage(doc, event.certificate_template_back_url, false, drawParams);
      }

      // Get PDF as base64
      const pdfBase64 = doc.output('datauristring');
      const pdfBlob = doc.output('blob');

      // Upload PDF
      const uploadResult = await base44.asServiceRole.integrations.Core.UploadFile({ file: pdfBlob });
      const fileUrl = uploadResult.file_url;

      // Save or update certificate record
      const today = new Date().toISOString().split('T')[0];

      if (existing && existing.length > 0) {
        certRecord = await base44.asServiceRole.entities.Certificate.update(existing[0].id, {
          file_url: fileUrl,
          status: 'generated',
          issue_date: today
        });
      } else {
        certRecord = await base44.asServiceRole.entities.Certificate.create({
          member_id: reg.member_id,
          member_name: reg.member_name,
          member_cpf: reg.member_cpf || '',
          event_id: eventId,
          event_title: event.title,
          event_registration_id: reg.id,
          certificate_code: certCode,
          file_url: fileUrl,
          issue_date: today,
          status: 'generated'
        });
      }

      // Update registration with certificate reference
      await base44.asServiceRole.entities.EventRegistration.update(reg.id, {
        certificate_id: certRecord.id,
        certificate_url: fileUrl
      });

      // Send notification to member
      if (reg.member_email) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: reg.member_email,
          subject: `Seu certificado está disponível – ${event.title}`,
          body: `
            <p>Olá, <strong>${reg.member_name}</strong>!</p>
            <p>Seu certificado de participação no evento <strong>${event.title}</strong> foi gerado e está disponível para download no seu painel.</p>
            <p>Acesse <a href="${appBaseUrl}/certidao">Meus Certificados</a> para visualizar e baixar.</p>
            <p>Código de autenticação: <strong>${certCode}</strong></p>
            <p>Atenciosamente,<br/>ANPPME</p>
          `
        });

        // In-app notification
        await base44.asServiceRole.entities.Notification.create({
          member_id: reg.member_id,
          user_email: reg.member_email,
          type: 'general',
          title: 'Certificado disponível!',
          message: `Seu certificado do evento "${event.title}" está pronto para download.`,
          read: false,
          link: '/certidao'
        });
      }

      results.push({
        registration_id: reg.id,
        member_name: reg.member_name,
        certificate_url: fileUrl,
        certificate_code: certCode
      });
    }

    return Response.json({ success: true, generated: results.length, results });
  } catch (error) {
    console.error('Erro ao gerar certificados:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
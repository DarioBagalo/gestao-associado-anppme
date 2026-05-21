/**
 * Modal de Carteira de Associado para uso administrativo.
 * Reutiliza a lógica e layout do MemberCard, mas aceita qualquer member como prop.
 */
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, User } from 'lucide-react';
import { format } from 'date-fns';
import { parseDateLocal, formatDateBR } from '@/lib/dateUtils';

const FRONT_BG = 'https://media.base44.com/images/public/69bdad4b62555d6f0c050afb/58471677c_FRENTE_CARTEIRINHA_ASSOCIADO.png';
const BACK_BG  = 'https://media.base44.com/images/public/69bdad4b62555d6f0c050afb/b49638cc4_VERSO_CARTEIRINHA_ASSOCIADO.png';

const FONT  = "'Calibri', 'Segoe UI', Arial, sans-serif";
const COL   = '#1e3a6e';
const PX_W  = 323;
const PX_H  = 204;
const SCALE = 1.9;
const M     = 15;
const PHOTO_W = 76;
const PHOTO_H = 96;
const QR_SIZE = 44;

function getCardData(member) {
  const issueDate  = member.card_issue_date ? parseDateLocal(member.card_issue_date) : new Date();
  const validUntil = member.active_until
    ? parseDateLocal(member.active_until)
    : new Date(issueDate.getFullYear() + 1, issueDate.getMonth(), issueDate.getDate());
  const authCode  = `ANPPME-${member.registration_number || '0000'}-${member.id.slice(-6).toUpperCase()}`;
  const verifyUrl = `${window.location.origin}/verificar?code=${encodeURIComponent(authCode)}`;
  return { issueDate, validUntil, authCode, verifyUrl };
}

function CardFront({ member, issueDate, validUntil }) {
  const textLeft  = M + PHOTO_W + 8;
  const textRight = PX_W - M;
  const textWidth = textRight - textLeft;
  const photoTop  = 74;

  return (
    <div style={{ width: PX_W, height: PX_H, position: 'relative', overflow: 'hidden', borderRadius: 6, fontFamily: FONT, flexShrink: 0 }}>
      <img src={FRONT_BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill', display: 'block' }} />
      <div style={{ position: 'absolute', top: photoTop, left: M, width: PHOTO_W, height: PHOTO_H, borderRadius: 4, overflow: 'hidden', background: 'rgba(180,200,220,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(30,58,110,0.15)' }}>
        {member.photo_url
          ? <img src={member.photo_url} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
          : <User style={{ width: 28, height: 28, color: COL, opacity: 0.35 }} />}
      </div>
      <div style={{ position: 'absolute', top: photoTop + 4, left: textLeft, width: textWidth, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, color: COL, textTransform: 'uppercase', letterSpacing: 0.4, lineHeight: 1 }}>Nome</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: COL, textTransform: 'uppercase', lineHeight: 1.25, wordBreak: 'break-word', marginTop: 2 }}>{member.full_name}</div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
          <div><div style={{ fontSize: 8, fontWeight: 700, color: COL, textTransform: 'uppercase' }}>Emissão</div><div style={{ fontSize: 10, color: '#222', marginTop: 2 }}>{format(issueDate, 'dd/MM/yyyy')}</div></div>
          <div><div style={{ fontSize: 8, fontWeight: 700, color: COL, textTransform: 'uppercase' }}>Validade</div><div style={{ fontSize: 10, fontWeight: 700, color: '#b45309', marginTop: 2 }}>{format(validUntil, 'dd/MM/yyyy')}</div></div>
          <div><div style={{ fontSize: 8, fontWeight: 700, color: COL, textTransform: 'uppercase' }}>Registro</div><div style={{ fontSize: 10, fontWeight: 700, color: COL, marginTop: 2 }}>{member.registration_number || '---'}</div></div>
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: M, left: M + PHOTO_W + 8, right: M, height: 45, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {member.signature_url && <img src={member.signature_url} alt="Assinatura" style={{ maxWidth: '100%', maxHeight: 45, objectFit: 'contain' }} crossOrigin="anonymous" />}
      </div>
    </div>
  );
}

function CardBack({ member, authCode, verifyUrl }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${QR_SIZE}x${QR_SIZE}&data=${encodeURIComponent(verifyUrl)}&color=1e3a6e&bgcolor=ffffff&margin=1`;
  return (
    <div style={{ width: PX_W, height: PX_H, position: 'relative', overflow: 'hidden', borderRadius: 6, fontFamily: FONT, flexShrink: 0 }}>
      <img src={BACK_BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill', display: 'block' }} />
      <div style={{ position: 'absolute', top: 23, left: M, right: M + QR_SIZE + 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div>
          <div style={{ fontSize: 8.5, fontWeight: 700, color: COL, textTransform: 'uppercase', letterSpacing: 0.4 }}>Filiação</div>
          <div style={{ fontSize: 9.5, color: '#222', lineHeight: 1.5, marginTop: 1 }}>
            <div><span style={{ color: '#666', fontSize: 8.5 }}>Mãe: </span>{member.mother_name || '---'}</div>
            {member.father_name && <div><span style={{ color: '#666', fontSize: 8.5 }}>Pai: </span>{member.father_name}</div>}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 10px' }}>
          <div><div style={{ fontSize: 8.5, fontWeight: 700, color: COL, textTransform: 'uppercase' }}>CPF</div><div style={{ fontSize: 9.5, color: '#222', fontFamily: 'monospace', marginTop: 1 }}>{member.cpf || '---'}</div></div>
          <div><div style={{ fontSize: 8.5, fontWeight: 700, color: COL, textTransform: 'uppercase' }}>Nascimento</div><div style={{ fontSize: 9.5, color: '#222', marginTop: 1 }}>{formatDateBR(member.birth_date)}</div></div>
          <div><div style={{ fontSize: 8.5, fontWeight: 700, color: COL, textTransform: 'uppercase' }}>Naturalidade</div><div style={{ fontSize: 9, color: '#222', marginTop: 1 }}>{member.birth_city ? `${member.birth_city}/${member.birth_state}` : '---'}</div></div>
          <div><div style={{ fontSize: 8.5, fontWeight: 700, color: COL, textTransform: 'uppercase' }}>Nacionalidade</div><div style={{ fontSize: 9, color: '#222', marginTop: 1 }}>{member.nationality || 'Brasileira'}</div></div>
        </div>
      </div>
      {/* QR + Auth code */}
      <div style={{ position: 'absolute', bottom: M, right: M, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
        <img src={qrUrl} alt="QR" style={{ width: QR_SIZE, height: QR_SIZE }} />
        <div style={{ fontSize: 5, color: COL, fontFamily: 'monospace', textAlign: 'center', maxWidth: QR_SIZE, wordBreak: 'break-all', lineHeight: 1.3 }}>{authCode}</div>
      </div>
    </div>
  );
}

export default function MemberCardModal({ member, onClose }) {
  const { issueDate, validUntil, authCode, verifyUrl } = getCardData(member);

  const handlePrint = () => {
    const qrUrl      = `https://api.qrserver.com/v1/create-qr-code/?size=84x84&data=${encodeURIComponent(verifyUrl)}&color=1e3a6e&bgcolor=ffffff&margin=1`;
    const photoHtml  = member.photo_url ? `<img src="${member.photo_url}" style="width:100%;height:100%;object-fit:cover;" />` : '';
    const sigHtml    = member.signature_url ? `<img src="${member.signature_url}" style="max-width:100%;max-height:12mm;object-fit:contain;" />` : '';
    const fatherRow  = member.father_name ? `<div><span style="color:#666;font-size:8.5pt;">Pai: </span>${member.father_name}</div>` : '';

    const win = window.open('', '_blank', 'width=900,height=700');
    win.document.write(`<!DOCTYPE html><html><head><title>Carteira ANPPME — ${member.full_name}</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
@page { size: A4 landscape; margin: 10mm; }
body { background:#fff; font-family:'Calibri','Segoe UI',Arial,sans-serif; display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; gap:8mm; }
.wrapper { display:flex; flex-direction:row; gap:0; }
.card { width:85.6mm; height:54mm; position:relative; overflow:hidden; border-radius:3mm; }
.card img.bg { position:absolute; inset:0; width:100%; height:100%; object-fit:fill; }
.auth-section { border:1px solid #d1d5db; border-radius:3mm; padding:4mm 6mm; max-width:180mm; width:100%; font-size:8pt; color:#444; display:flex; align-items:center; justify-content:space-between; gap:6mm; }
.auth-section .qr { width:18mm; height:18mm; flex-shrink:0; }
.auth-title { font-weight:700; color:#1e3a6e; font-size:9pt; margin-bottom:1.5mm; }
.auth-code { font-family:monospace; font-size:8.5pt; font-weight:bold; color:#1e3a6e; background:#f0f4fc; padding:1mm 2mm; border-radius:1mm; display:inline-block; margin:1mm 0; }
</style></head><body>
<div class="wrapper">
  <div class="card">
    <img class="bg" src="${FRONT_BG}" />
    <div style="position:absolute;top:19.5mm;left:4mm;width:20mm;height:25mm;border-radius:1mm;overflow:hidden;background:rgba(180,200,220,0.25);display:flex;align-items:center;justify-content:center;">${photoHtml}</div>
    <div style="position:absolute;top:19.5mm;left:27mm;right:4mm;display:flex;flex-direction:column;gap:1.8mm;">
      <div><div style="font-size:7pt;font-weight:700;color:#1e3a6e;text-transform:uppercase;">Nome</div><div style="font-size:10pt;font-weight:700;color:#1e3a6e;text-transform:uppercase;line-height:1.25;margin-top:0.5mm;">${member.full_name}</div></div>
      <div style="display:flex;gap:3mm;margin-top:1mm;flex-wrap:wrap;">
        <div><div style="font-size:6pt;font-weight:700;color:#1e3a6e;text-transform:uppercase;">Emissão</div><div style="font-size:8pt;margin-top:0.5mm;">${format(issueDate, 'dd/MM/yyyy')}</div></div>
        <div><div style="font-size:6pt;font-weight:700;color:#1e3a6e;text-transform:uppercase;">Validade</div><div style="font-size:8pt;font-weight:700;color:#b45309;margin-top:0.5mm;">${format(validUntil, 'dd/MM/yyyy')}</div></div>
        <div><div style="font-size:6pt;font-weight:700;color:#1e3a6e;text-transform:uppercase;">Registro</div><div style="font-size:8pt;font-weight:700;color:#1e3a6e;margin-top:0.5mm;">${member.registration_number || '---'}</div></div>
      </div>
    </div>
    <div style="position:absolute;bottom:4mm;left:27mm;right:4mm;height:12mm;display:flex;align-items:center;justify-content:center;">${sigHtml}</div>
  </div>
  <div class="card">
    <img class="bg" src="${BACK_BG}" />
    <div style="position:absolute;top:6mm;left:4mm;right:26mm;display:flex;flex-direction:column;gap:1.8mm;">
      <div><div style="font-size:7pt;font-weight:700;color:#1e3a6e;text-transform:uppercase;">Filiação</div>
        <div style="font-size:8.5pt;color:#222;line-height:1.5;margin-top:0.3mm;">
          <div><span style="color:#666;font-size:8.5pt;">Mãe: </span>${member.mother_name || '---'}</div>${fatherRow}
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1mm 2.5mm;">
        <div><div style="font-size:7pt;font-weight:700;color:#1e3a6e;text-transform:uppercase;">CPF</div><div style="font-size:8.5pt;font-family:monospace;margin-top:0.3mm;">${member.cpf || '---'}</div></div>
        <div><div style="font-size:7pt;font-weight:700;color:#1e3a6e;text-transform:uppercase;">Nascimento</div><div style="font-size:8.5pt;margin-top:0.3mm;">${formatDateBR(member.birth_date)}</div></div>
        <div><div style="font-size:7pt;font-weight:700;color:#1e3a6e;text-transform:uppercase;">Naturalidade</div><div style="font-size:8pt;margin-top:0.3mm;">${member.birth_city ? `${member.birth_city}/${member.birth_state}` : '---'}</div></div>
        <div><div style="font-size:7pt;font-weight:700;color:#1e3a6e;text-transform:uppercase;">Nacionalidade</div><div style="font-size:8pt;margin-top:0.3mm;">${member.nationality || 'Brasileira'}</div></div>
      </div>
    </div>
    <div style="position:absolute;bottom:4mm;right:4mm;display:flex;flex-direction:column;align-items:center;gap:1mm;">
      <img src="${qrUrl}" style="width:18mm;height:18mm;" />
      <div style="font-size:4.5pt;color:#1e3a6e;font-family:monospace;text-align:center;max-width:22mm;word-break:break-all;line-height:1.3;">${authCode}</div>
    </div>
  </div>
</div>
<!-- Seção de autenticação -->
<div class="auth-section">
  <div>
    <div class="auth-title">Autenticidade da Carteira</div>
    <div>Emitida por: <strong>ANPPME</strong> — Associação Nacional de Pregoeiros e Agentes de Contratação</div>
    <div>CNPJ: 28.325.407/0001-08 · Registro: <strong>${member.registration_number || '---'}</strong></div>
    <div>Código de verificação: <span class="auth-code">${authCode}</span></div>
    <div style="margin-top:1mm;">Verifique em: <strong>${window.location.origin}/verificar</strong></div>
    <div style="margin-top:1mm;font-size:7.5pt;color:#888;">Documento gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")} · Válido até: ${format(validUntil, 'dd/MM/yyyy')}</div>
  </div>
  <img class="qr" src="${qrUrl}" />
</div>
</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 1200);
  };

  const canShowCard = member.status === 'active' && member.registration_number;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Carteira — {member.full_name}</DialogTitle>
        </DialogHeader>

        {!canShowCard ? (
          <div className="py-8 text-center text-muted-foreground text-sm">
            <p className="font-semibold mb-1">Carteira indisponível</p>
            <p>O associado precisa estar <strong>Ativo</strong> e ter um número de registro para emitir a carteira.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center gap-8 py-2">
              <div>
                <p className="text-xs text-center text-muted-foreground mb-2 font-semibold tracking-wider uppercase">Frente</p>
                <div style={{ transform: `scale(${SCALE})`, transformOrigin: 'top left', width: PX_W, height: PX_H }}>
                  <CardFront member={member} issueDate={issueDate} validUntil={validUntil} />
                </div>
                <div style={{ height: PX_H * (SCALE - 1) }} />
              </div>
              <div>
                <p className="text-xs text-center text-muted-foreground mb-2 font-semibold tracking-wider uppercase">Verso</p>
                <div style={{ transform: `scale(${SCALE})`, transformOrigin: 'top left', width: PX_W, height: PX_H }}>
                  <CardBack member={member} authCode={authCode} verifyUrl={verifyUrl} />
                </div>
                <div style={{ height: PX_H * (SCALE - 1) }} />
              </div>
            </div>

            {/* Auth info */}
            <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground space-y-1">
              <p><strong className="text-foreground">Código de Autenticidade:</strong> <span className="font-mono text-primary">{authCode}</span></p>
              <p>Emissão: {format(issueDate, 'dd/MM/yyyy')} · Válido até: <span className="font-semibold text-amber-600">{format(validUntil, 'dd/MM/yyyy')}</span></p>
              <p>Verificação: {window.location.origin}/verificar</p>
            </div>

            <div className="flex justify-end">
              <Button onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" /> Imprimir / Baixar PDF
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
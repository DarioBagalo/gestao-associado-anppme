import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Printer, User } from 'lucide-react';
import { format } from 'date-fns';
import { parseDateLocal, formatDateBR } from '@/lib/dateUtils';

const FRONT_BG = 'https://media.base44.com/images/public/69bdad4b62555d6f0c050afb/58471677c_FRENTE_CARTEIRINHA_ASSOCIADO.png';
const BACK_BG  = 'https://media.base44.com/images/public/69bdad4b62555d6f0c050afb/b49638cc4_VERSO_CARTEIRINHA_ASSOCIADO.png';

const FONT = "'Calibri', 'Segoe UI', Arial, sans-serif";
const COL  = '#1e3a6e';

// Credit card: 85.6 x 54 mm
// At 96dpi: 1mm = 3.7795px → 85.6mm = 323px, 54mm = 204px
const PX_W  = 323;
const PX_H  = 204;
const SCALE = 2.2;
const SW    = PX_W * SCALE;
const SH    = PX_H * SCALE;

// margin: 4mm ≈ 15px
const M = 15;
// photo: 2cm wide ≈ 76px, height proportional
const PHOTO_W = 76;
const PHOTO_H = 96;
// QR code size on back
const QR_SIZE = 44;

function QRImg({ value, size }) {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&color=1e3a6e&bgcolor=ffffff&margin=1`;
  return <img src={url} alt="QR" style={{ width: size, height: size, display: 'block' }} />;
}

function CardFront({ member, issueDate, validUntil, authCode }) {
  // Text area starts right of photo
  const textLeft  = M + PHOTO_W + 8;
  const textRight = PX_W - M;
  const textWidth = textRight - textLeft;
  // Photo top: below logo band (~36px + ~38px for 1cm extra)
  const photoTop = 74;

  return (
    <div style={{ width: PX_W, height: PX_H, position: 'relative', overflow: 'hidden', borderRadius: 6, fontFamily: FONT, flexShrink: 0 }}>
      <img src={FRONT_BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill', display: 'block' }} />

      {/* Photo — below logo band, left margin 4mm */}
      <div style={{
        position: 'absolute',
        top: photoTop,
        left: M,
        width: PHOTO_W,
        height: PHOTO_H,
        borderRadius: 4,
        overflow: 'hidden',
        background: 'rgba(180,200,220,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '1px solid rgba(30,58,110,0.15)'
      }}>
        {member.photo_url
          ? <img src={member.photo_url} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
          : <User style={{ width: 28, height: 28, color: COL, opacity: 0.35 }} />
        }
      </div>

      {/* Text fields — right of photo */}
      <div style={{ position: 'absolute', top: photoTop + 4, left: textLeft, width: textWidth, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {/* Name */}
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, color: COL, textTransform: 'uppercase', letterSpacing: 0.4, lineHeight: 1 }}>Nome</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: COL, textTransform: 'uppercase', lineHeight: 1.25, wordBreak: 'break-word', marginTop: 2 }}>{member.full_name}</div>
        </div>

        {/* Dates + Registro row */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
          <div>
            <div style={{ fontSize: 8, fontWeight: 700, color: COL, textTransform: 'uppercase' }}>Emissão</div>
            <div style={{ fontSize: 10, color: '#222', marginTop: 2 }}>{format(issueDate, 'dd/MM/yyyy')}</div>
          </div>
          <div>
            <div style={{ fontSize: 8, fontWeight: 700, color: COL, textTransform: 'uppercase' }}>Validade</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#b45309', marginTop: 2 }}>{format(validUntil, 'dd/MM/yyyy')}</div>
          </div>
          <div>
            <div style={{ fontSize: 8, fontWeight: 700, color: COL, textTransform: 'uppercase' }}>Registro</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: COL, marginTop: 2 }}>{member.registration_number || '---'}</div>
          </div>
        </div>
      </div>

      {/* Assinatura associado — bottom, centralizada entre fim da foto e margem direita, altura máx 1,2cm ≈ 45px */}
      <div style={{
        position: 'absolute',
        bottom: M,
        left: M + PHOTO_W + 8,
        right: M,
        height: 45,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        {member.signature_url && (
          <img src={member.signature_url} alt="Assinatura" style={{ maxWidth: '100%', maxHeight: 45, objectFit: 'contain' }} crossOrigin="anonymous" />
        )}
      </div>
    </div>
  );
}

function CardBack({ member, authCode, verifyUrl }) {
  // QR and auth code at bottom-right
  return (
    <div style={{ width: PX_W, height: PX_H, position: 'relative', overflow: 'hidden', borderRadius: 6, fontFamily: FONT, flexShrink: 0 }}>
      <img src={BACK_BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill', display: 'block' }} />

      {/* Left data area — full height, leaves room for QR on right */}
      <div style={{ position: 'absolute', top: 23, left: M, right: M + QR_SIZE + 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {/* Filiação */}
        <div>
          <div style={{ fontSize: 8.5, fontWeight: 700, color: COL, textTransform: 'uppercase', letterSpacing: 0.4 }}>Filiação</div>
          <div style={{ fontSize: 9.5, color: '#222', lineHeight: 1.5, marginTop: 1 }}>
            <div><span style={{ color: '#666', fontSize: 8.5 }}>Mãe: </span>{member.mother_name || '---'}</div>
            {member.father_name && <div><span style={{ color: '#666', fontSize: 8.5 }}>Pai: </span>{member.father_name}</div>}
          </div>
        </div>

        {/* Grid info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 10px' }}>
          <div>
            <div style={{ fontSize: 8.5, fontWeight: 700, color: COL, textTransform: 'uppercase' }}>CPF</div>
            <div style={{ fontSize: 9.5, color: '#222', fontFamily: 'monospace', marginTop: 1 }}>{member.cpf || '---'}</div>
          </div>
          <div>
            <div style={{ fontSize: 8.5, fontWeight: 700, color: COL, textTransform: 'uppercase' }}>Nascimento</div>
            <div style={{ fontSize: 9.5, color: '#222', marginTop: 1 }}>{formatDateBR(member.birth_date)}</div>
          </div>
          <div>
            <div style={{ fontSize: 8.5, fontWeight: 700, color: COL, textTransform: 'uppercase' }}>Naturalidade</div>
            <div style={{ fontSize: 9, color: '#222', marginTop: 1 }}>{member.birth_city ? `${member.birth_city}/${member.birth_state}` : '---'}</div>
          </div>
          <div>
            <div style={{ fontSize: 8.5, fontWeight: 700, color: COL, textTransform: 'uppercase' }}>Nacionalidade</div>
            <div style={{ fontSize: 9, color: '#222', marginTop: 1 }}>{member.nationality || 'Brasileira'}</div>
          </div>
        </div>
      </div>

      {/* QR Code + Auth code — bottom-right */}
      <div style={{
        position: 'absolute',
        bottom: M,
        right: M,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3
      }}>
        <QRImg value={verifyUrl} size={QR_SIZE} />
        <div style={{ fontSize: 5, color: COL, fontFamily: 'monospace', textAlign: 'center', maxWidth: QR_SIZE, wordBreak: 'break-all', lineHeight: 1.3 }}>
          {authCode}
        </div>
      </div>
    </div>
  );
}

export default function MemberCard() {
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const u = await base44.auth.me();
      const members = await base44.entities.Member.filter({ email: u.email });
      if (members.length > 0) setMember(members[0]);
      setLoading(false);
    }
    load();
  }, []);

  const getCardData = () => {
    const issueDate  = member.card_issue_date ? parseDateLocal(member.card_issue_date) : new Date();
    const validUntil = member.active_until ? parseDateLocal(member.active_until) : new Date(issueDate.getFullYear() + 1, issueDate.getMonth(), issueDate.getDate());
    const authCode   = `ANPPME-${member.registration_number || '0000'}-${member.id.slice(-6).toUpperCase()}`;
    const verifyUrl  = `${window.location.origin}/verificar?code=${encodeURIComponent(authCode)}`;
    return { issueDate, validUntil, authCode, verifyUrl };
  };

  const handlePrint = () => {
    if (!member) return;
    const { issueDate, validUntil, authCode, verifyUrl } = getCardData();

    const qrUrl     = `https://api.qrserver.com/v1/create-qr-code/?size=84x84&data=${encodeURIComponent(verifyUrl)}&color=1e3a6e&bgcolor=ffffff&margin=1`;
    const photoHtml = member.photo_url
      ? `<img src="${member.photo_url}" style="width:100%;height:100%;object-fit:cover;" />`
      : '';
    const sigHtml = member.signature_url
      ? `<img src="${member.signature_url}" style="max-width:100%;max-height:12mm;object-fit:contain;" />`
      : '';
    const fatherRow = member.father_name
      ? `<div><span style="color:#666;font-size:8.5pt;">Pai: </span>${member.father_name}</div>` : '';

    const win = window.open('', '_blank', 'width=900,height=700');
    win.document.write(`<!DOCTYPE html><html><head><title>Carteira ANPPME</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
@page { size: A4 landscape; margin: 10mm; }
body { background:#fff; font-family:'Calibri','Segoe UI',Arial,sans-serif; display:flex; align-items:center; justify-content:center; min-height:100vh; }
.wrapper { display:flex; flex-direction:row; gap:0; }
.card { width:85.6mm; height:54mm; position:relative; overflow:hidden; border-radius:3mm; }
.card img.bg { position:absolute; inset:0; width:100%; height:100%; object-fit:fill; }
</style></head><body>
<div class="wrapper">

  <!-- FRENTE -->
  <div class="card">
    <img class="bg" src="${FRONT_BG}" />
    <!-- Foto: 2cm largura, abaixo da banda do logo ~19.5mm do topo -->
    <div style="position:absolute;top:19.5mm;left:4mm;width:20mm;height:25mm;border-radius:1mm;overflow:hidden;background:rgba(180,200,220,0.25);display:flex;align-items:center;justify-content:center;">
      ${photoHtml}
    </div>
    <!-- Texto: direita da foto -->
    <div style="position:absolute;top:19.5mm;left:27mm;right:4mm;display:flex;flex-direction:column;gap:1.8mm;">
      <div>
        <div style="font-size:7pt;font-weight:700;color:#1e3a6e;text-transform:uppercase;letter-spacing:0.3px;">Nome</div>
        <div style="font-size:10pt;font-weight:700;color:#1e3a6e;text-transform:uppercase;line-height:1.25;margin-top:0.5mm;">${member.full_name}</div>
      </div>
      <div style="display:flex;gap:3mm;margin-top:1mm;flex-wrap:wrap;">
        <div><div style="font-size:6pt;font-weight:700;color:#1e3a6e;text-transform:uppercase;">Emissão</div><div style="font-size:8pt;margin-top:0.5mm;">${format(issueDate, 'dd/MM/yyyy')}</div></div>
        <div><div style="font-size:6pt;font-weight:700;color:#1e3a6e;text-transform:uppercase;">Validade</div><div style="font-size:8pt;font-weight:700;color:#b45309;margin-top:0.5mm;">${format(validUntil, 'dd/MM/yyyy')}</div></div>
        <div><div style="font-size:6pt;font-weight:700;color:#1e3a6e;text-transform:uppercase;">Registro</div><div style="font-size:8pt;font-weight:700;color:#1e3a6e;margin-top:0.5mm;">${member.registration_number || '---'}</div></div>
      </div>
    </div>
    <!-- Assinatura: centralizada entre foto e margem direita, altura máx 12mm -->
    <div style="position:absolute;bottom:4mm;left:27mm;right:4mm;height:12mm;display:flex;align-items:center;justify-content:center;">
      ${sigHtml}
    </div>
  </div>

  <!-- VERSO -->
  <div class="card">
    <img class="bg" src="${BACK_BG}" />
    <!-- Dados: left=4mm, right=26mm (espaço para QR), top=6mm -->
    <div style="position:absolute;top:6mm;left:4mm;right:26mm;display:flex;flex-direction:column;gap:1.8mm;">
      <div>
        <div style="font-size:7pt;font-weight:700;color:#1e3a6e;text-transform:uppercase;letter-spacing:0.3px;">Filiação</div>
        <div style="font-size:8.5pt;color:#222;line-height:1.5;margin-top:0.3mm;">
          <div><span style="color:#666;font-size:8.5pt;">Mãe: </span>${member.mother_name || '---'}</div>
          ${fatherRow}
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1mm 2.5mm;">
        <div><div style="font-size:7pt;font-weight:700;color:#1e3a6e;text-transform:uppercase;">CPF</div><div style="font-size:8.5pt;font-family:monospace;margin-top:0.3mm;">${member.cpf || '---'}</div></div>
        <div><div style="font-size:7pt;font-weight:700;color:#1e3a6e;text-transform:uppercase;">Nascimento</div><div style="font-size:8.5pt;margin-top:0.3mm;">${formatDateBR(member.birth_date)}</div></div>
        <div><div style="font-size:7pt;font-weight:700;color:#1e3a6e;text-transform:uppercase;">Naturalidade</div><div style="font-size:8pt;margin-top:0.3mm;">${member.birth_city ? `${member.birth_city}/${member.birth_state}` : '---'}</div></div>
        <div><div style="font-size:7pt;font-weight:700;color:#1e3a6e;text-transform:uppercase;">Nacionalidade</div><div style="font-size:8pt;margin-top:0.3mm;">${member.nationality || 'Brasileira'}</div></div>
      </div>
    </div>
    <!-- QR Code + código — bottom-right -->
    <div style="position:absolute;bottom:4mm;right:4mm;display:flex;flex-direction:column;align-items:center;gap:1mm;">
      <img src="${qrUrl}" style="width:18mm;height:18mm;" />
      <div style="font-size:4.5pt;color:#1e3a6e;font-family:monospace;text-align:center;max-width:22mm;word-break:break-all;line-height:1.3;">${authCode}</div>
    </div>
  </div>

</div>
</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 1200);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!member || member.status !== 'active') {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Carteira de Associado</h1>
        <Card className="border-0 shadow-sm"><CardContent className="p-8 text-center">
          <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold">Carteira indisponível</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {!member ? 'Complete seu cadastro para acessar a carteira.' : 'Seu cadastro precisa estar ativo para emitir a carteira.'}
          </p>
        </CardContent></Card>
      </div>
    );
  }

  const { issueDate, validUntil, authCode, verifyUrl } = getCardData();
  const cardProps = { member, issueDate, validUntil, authCode, verifyUrl };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Carteira de Associado</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Carteira Nacional de Associado — ANPPME</p>
      </div>

      {/* Preview */}
      <div className="flex flex-col items-center gap-10">
        <div>
          <p className="text-xs text-center text-muted-foreground mb-3 font-semibold tracking-wider uppercase">Frente</p>
          <div style={{ transform: `scale(${SCALE})`, transformOrigin: 'top left', width: PX_W, height: PX_H }}>
            <CardFront {...cardProps} />
          </div>
          <div style={{ height: SH - PX_H }} />
        </div>
        <div>
          <p className="text-xs text-center text-muted-foreground mb-3 font-semibold tracking-wider uppercase">Verso</p>
          <div style={{ transform: `scale(${SCALE})`, transformOrigin: 'top left', width: PX_W, height: PX_H }}>
            <CardBack {...cardProps} />
          </div>
          <div style={{ height: SH - PX_H }} />
        </div>
      </div>

      <div className="flex justify-center">
        <Button onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-2" />
          Baixar / Imprimir
        </Button>
      </div>

      <Card className="border-0 shadow-sm bg-muted/40 max-w-md mx-auto">
        <CardContent className="p-4 text-xs text-muted-foreground space-y-1 text-center">
          <p><strong>Código:</strong> <span className="font-mono">{authCode}</span></p>
          <p>Emissão: {format(issueDate, 'dd/MM/yyyy')} · Válido até: <span className="font-semibold text-amber-600">{format(validUntil, 'dd/MM/yyyy')}</span></p>
          <p className="text-[10px]">Impressão em A4 paisagem — frente e verso lado a lado para dobra perfeita.</p>
        </CardContent>
      </Card>
    </div>
  );
}
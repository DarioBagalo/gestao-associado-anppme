/**
 * Modal de Ficha Cadastral completo (admin) com impressão PDF.
 * Inclui cabeçalho ANPPME, foto do associado, todos os dados e código autenticador.
 */
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { formatDateBR } from '@/lib/dateUtils';

const LOGO_URL    = 'https://media.base44.com/images/public/69bdad4b62555d6f0c050afb/eb6f25876_LOGO_ANPPME_AZUL_SIMBOLO.png';
const LOGO_NAME   = 'https://media.base44.com/images/public/69bdad4b62555d6f0c050afb/236232730_ANPPME_LOGO_OFICIAL_NOME.png';

function genAuthCode(member) {
  return `ANPPME-FICHA-${member.registration_number || '0000'}-${member.id.slice(-6).toUpperCase()}`;
}

export default function MemberFichaModal({ member, onClose }) {
  const [printing, setPrinting] = useState(false);

  const handlePrint = () => {
    setPrinting(true);
    const authCode = genAuthCode(member);
    const verifyUrl = `${window.location.origin}/verificar?code=${encodeURIComponent(authCode)}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(verifyUrl)}&color=1e3a6e&bgcolor=ffffff&margin=2`;
    const photoHtml = member.photo_url
      ? `<img src="${member.photo_url}" style="width:100%;height:100%;object-fit:cover;" crossorigin="anonymous" />`
      : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#aaa;font-size:10pt;">Sem foto</div>`;

    const win = window.open('', '_blank', 'width=900,height=1200');
    win.document.write(`<!DOCTYPE html><html><head><title>Ficha Cadastral — ${member.full_name}</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
@page { size: A4 portrait; margin: 15mm 18mm; }
body { font-family:'Calibri','Segoe UI',Arial,sans-serif; color:#111; background:#fff; }
.header { border-bottom: 2px solid #1e3a6e; padding-bottom:5mm; margin-bottom:6mm; display:flex; align-items:center; gap:4mm; }
.header-logos { display:flex; flex-direction:column; align-items:center; gap:1mm; }
.header-text { flex:1; }
.org-name { font-size:14pt; font-weight:900; color:#1e3a6e; letter-spacing:1px; }
.org-sub { font-size:8pt; color:#444; margin-top:1mm; line-height:1.5; }
.doc-title { text-align:right; font-size:13pt; font-weight:bold; text-transform:uppercase; letter-spacing:2px; color:#1e3a6e; }
.member-header { display:flex; gap:5mm; margin-bottom:6mm; }
.photo-box { width:35mm; height:44mm; border:1px solid #d1d5db; border-radius:2mm; overflow:hidden; flex-shrink:0; }
.member-info { flex:1; }
.member-name { font-size:14pt; font-weight:bold; color:#1e3a6e; margin-bottom:2mm; }
.member-contact { font-size:9pt; color:#444; line-height:1.8; }
.section-title { font-size:7pt; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:#1e3a6e; background:#f0f4fc; padding:1.5mm 3mm; margin:5mm 0 3mm; border-left:3px solid #1e3a6e; }
.grid { display:grid; grid-template-columns:1fr 1fr; gap:2mm 6mm; }
.field { margin-bottom:2mm; }
.field-label { font-size:7pt; color:#666; text-transform:uppercase; letter-spacing:0.4px; }
.field-value { font-size:9.5pt; font-weight:500; margin-top:0.3mm; }
.footer { margin-top:10mm; border-top:1.5px solid #1e3a6e; padding-top:4mm; display:flex; justify-content:space-between; align-items:flex-end; }
.footer-left { font-size:7.5pt; color:#444; line-height:1.6; }
.footer-left strong { color:#1e3a6e; }
.auth-code { font-family:monospace; font-size:8pt; font-weight:bold; color:#1e3a6e; }
.qr-block { text-align:center; }
.qr-label { font-size:6.5pt; color:#666; margin-top:1mm; }
.page-num { text-align:center; font-size:7pt; color:#aaa; margin-top:4mm; }
</style></head><body>

  <!-- Cabeçalho -->
  <div class="header">
    <div class="header-logos">
      <img src="${LOGO_URL}" style="height:40px;object-fit:contain;" />
      <img src="${LOGO_NAME}" style="height:16px;object-fit:contain;margin-top:2px;" />
    </div>
    <div class="header-text">
      <div class="org-name">ANPPME</div>
      <div class="org-sub">
        Associação Nacional de Pregoeiros e Agentes de Contratação<br/>
        CNPJ: 28.325.407/0001-08<br/>
        Rua Terezina, 1263 – Nova Brasília – CEP: 76.908-430 – Ji-Paraná – Rondônia
      </div>
    </div>
    <div class="doc-title">Ficha Cadastral</div>
  </div>

  <!-- Foto + Dados principais -->
  <div class="member-header">
    <div class="photo-box">${photoHtml}</div>
    <div class="member-info">
      <div class="member-name">${member.full_name}</div>
      <div class="member-contact">
        <div>📧 ${member.email || '---'}</div>
        <div>📞 ${member.phone || '---'}</div>
        ${member.registration_number ? `<div>🪪 Registro: <strong>${member.registration_number}</strong></div>` : ''}
        ${member.active_until ? `<div>📅 Anuidade válida até: <strong>${formatDateBR(member.active_until)}</strong></div>` : ''}
      </div>
    </div>
  </div>

  <!-- Dados Pessoais -->
  <div class="section-title">Dados Pessoais</div>
  <div class="grid">
    <div class="field"><div class="field-label">CPF</div><div class="field-value">${member.cpf || '---'}</div></div>
    <div class="field"><div class="field-label">Data de Nascimento</div><div class="field-value">${formatDateBR(member.birth_date)}</div></div>
    <div class="field"><div class="field-label">Nacionalidade</div><div class="field-value">${member.nationality || 'Brasileira'}</div></div>
    <div class="field"><div class="field-label">Naturalidade</div><div class="field-value">${member.birth_city ? `${member.birth_city}/${member.birth_state}` : '---'}</div></div>
    <div class="field"><div class="field-label">Nome do Pai</div><div class="field-value">${member.father_name || '---'}</div></div>
    <div class="field"><div class="field-label">Nome da Mãe</div><div class="field-value">${member.mother_name || '---'}</div></div>
  </div>

  <!-- Dados Profissionais -->
  <div class="section-title">Dados Profissionais</div>
  <div class="grid">
    <div class="field" style="grid-column:1/-1"><div class="field-label">Local de Trabalho</div><div class="field-value">${member.workplace_name || '---'}</div></div>
    <div class="field" style="grid-column:1/-1"><div class="field-label">Endereço</div><div class="field-value">${member.workplace_address || '---'}</div></div>
    <div class="field"><div class="field-label">Município/Estado</div><div class="field-value">${member.workplace_city ? `${member.workplace_city}/${member.workplace_state}` : '---'}</div></div>
    <div class="field"><div class="field-label">Função/Cargo</div><div class="field-value">${member.workplace_function || '---'}</div></div>
    <div class="field"><div class="field-label">Telefone do Trabalho</div><div class="field-value">${member.workplace_phone || '---'}</div></div>
    <div class="field"><div class="field-label">E-mail do Trabalho</div><div class="field-value">${member.workplace_email || '---'}</div></div>
  </div>

  <!-- Rodapé -->
  <div class="footer">
    <div class="footer-left">
      <strong>ANPPME</strong> — Associação Nacional de Pregoeiros e Agentes de Contratação<br/>
      CNPJ: 28.325.407/0001-08 · Rua Terezina, 1263 – Ji-Paraná/RO<br/>
      Documento gerado em ${format(new Date(), 'dd/MM/yyyy')} às ${format(new Date(), 'HH:mm')}<br/>
      <span class="auth-code">Código: ${authCode}</span><br/>
      Autenticidade: ${window.location.origin}/verificar
    </div>
    <div class="qr-block">
      <img src="${qrUrl}" style="width:20mm;height:20mm;" />
      <div class="qr-label">Verifique a autenticidade</div>
    </div>
  </div>
  <div class="page-num">1/1</div>

</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); setPrinting(false); }, 1000);
  };

  const authCode = genAuthCode(member);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ficha Cadastral — {member.full_name}</DialogTitle>
        </DialogHeader>

        {/* Preview Card */}
        <div className="rounded-xl border bg-white p-6 space-y-5 text-sm">
          {/* Header */}
          <div className="border-b-2 border-primary pb-4 flex items-center gap-4">
            <div className="flex flex-col items-center gap-1">
              <img src={LOGO_URL} alt="" className="h-9 object-contain" />
              <img src={LOGO_NAME} alt="" className="h-4 object-contain" />
            </div>
            <div className="flex-1">
              <p className="font-black text-primary text-base">ANPPME</p>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Associação Nacional de Pregoeiros e Agentes de Contratação<br/>
                CNPJ: 28.325.407/0001-08 · Rua Terezina, 1263 – Ji-Paraná/RO
              </p>
            </div>
            <p className="font-bold text-primary tracking-wider text-xs uppercase">Ficha Cadastral</p>
          </div>

          {/* Photo + Main info */}
          <div className="flex gap-4 items-start">
            <div className="w-24 h-32 rounded-lg overflow-hidden border shrink-0 bg-muted flex items-center justify-center">
              {member.photo_url ? <img src={member.photo_url} alt="Foto" className="w-full h-full object-cover" /> : <span className="text-xs text-muted-foreground">Sem foto</span>}
            </div>
            <div className="space-y-1">
              <p className="font-bold text-base text-primary">{member.full_name}</p>
              <p className="text-xs text-muted-foreground">{member.email}</p>
              <p className="text-xs text-muted-foreground">{member.phone}</p>
              {member.registration_number && <p className="text-xs font-mono font-semibold">Registro: {member.registration_number}</p>}
            </div>
          </div>

          {/* Data grid */}
          <div>
            <p className="text-[10px] font-bold text-primary uppercase tracking-wider bg-primary/5 px-2 py-1 rounded mb-2">Dados Pessoais</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
              <div><span className="text-muted-foreground">CPF: </span>{member.cpf}</div>
              <div><span className="text-muted-foreground">Nascimento: </span>{formatDateBR(member.birth_date)}</div>
              <div><span className="text-muted-foreground">Nacionalidade: </span>{member.nationality || 'Brasileira'}</div>
              <div><span className="text-muted-foreground">Natural de: </span>{member.birth_city}/{member.birth_state}</div>
              <div><span className="text-muted-foreground">Pai: </span>{member.father_name || '---'}</div>
              <div><span className="text-muted-foreground">Mãe: </span>{member.mother_name || '---'}</div>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-primary uppercase tracking-wider bg-primary/5 px-2 py-1 rounded mb-2">Dados Profissionais</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
              <div className="col-span-2"><span className="text-muted-foreground">Local: </span>{member.workplace_name}</div>
              <div><span className="text-muted-foreground">Função: </span>{member.workplace_function}</div>
              <div><span className="text-muted-foreground">Município: </span>{member.workplace_city}/{member.workplace_state}</div>
            </div>
          </div>

          {/* Auth footer */}
          <div className="border-t pt-3 flex items-end justify-between">
            <div className="text-[10px] text-muted-foreground space-y-0.5">
              <p className="font-semibold text-primary">ANPPME · Ficha Cadastral</p>
              <p>CNPJ: 28.325.407/0001-08</p>
              <p className="font-mono text-[9px] text-primary">{authCode}</p>
              <p>Emitido em: {format(new Date(), 'dd/MM/yyyy')} · Pág. 1/1</p>
            </div>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=64x64&data=${encodeURIComponent(`${window.location.origin}/verificar?code=${encodeURIComponent(authCode)}`)}&color=1e3a6e&bgcolor=ffffff&margin=2`}
              alt="QR" className="w-16 h-16"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handlePrint} disabled={printing}>
            {printing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Printer className="w-4 h-4 mr-2" />}
            Imprimir / Baixar PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
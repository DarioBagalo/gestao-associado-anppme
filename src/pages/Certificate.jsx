import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Shield, Download, AlertCircle, Loader2, CheckCircle2, RefreshCw, Ban } from 'lucide-react';
import { format, addDays, parseISO, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const LOGO_URL  = 'https://media.base44.com/images/public/69bdad4b62555d6f0c050afb/eb6f25876_LOGO_ANPPME_AZUL_SIMBOLO.png';
const LOGO_NAME = 'https://media.base44.com/images/public/69bdad4b62555d6f0c050afb/236232730_ANPPME_LOGO_OFICIAL_NOME.png';

function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 12; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
    if (i === 3 || i === 7) code += '-';
  }
  return code;
}

function printCertificate({ certificate, member }) {
  const verifyUrl = `${window.location.origin}/verificar-certidao?code=${encodeURIComponent(certificate.certificate_code)}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(verifyUrl)}&color=1e3a6e&bgcolor=ffffff&margin=4`;
  const issueFormatted  = format(parseISO(certificate.issue_date),  "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const expiryFormatted = format(parseISO(certificate.expiry_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  const win = window.open('', '_blank', 'width=900,height=1200');
  win.document.write(`<!DOCTYPE html><html><head><title>Certidão ANPPME</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
@page { size: A4 portrait; margin: 20mm; }
body { font-family:'Times New Roman',serif; color:#111; background:#fff; }
.page { max-width:170mm; margin:0 auto; }
.header { text-align:center; padding-bottom:8mm; border-bottom:2px solid #1e3a6e; margin-bottom:8mm; }
.logo { width:50px; height:50px; object-fit:contain; margin-bottom:4mm; }
.org-name { font-size:16pt; font-weight:bold; color:#1e3a6e; letter-spacing:2px; }
.org-sub { font-size:8pt; color:#555; margin-top:2mm; }
.doc-title { font-size:14pt; font-weight:bold; text-transform:uppercase; letter-spacing:3px; margin-top:5mm; }
.badge { display:inline-flex; align-items:center; gap:6px; background:#d1fae5; color:#065f46; border:1px solid #6ee7b7; padding:4px 12px; border-radius:20px; font-size:8pt; font-weight:bold; margin:4mm 0; }
.body-text { font-size:11pt; line-height:1.8; text-align:justify; margin-bottom:5mm; }
.info-grid { display:grid; grid-template-columns:1fr 1fr; gap:4mm; background:#f8fafc; border:1px solid #e2e8f0; border-radius:4mm; padding:6mm; margin:6mm 0; }
.info-label { font-size:7pt; color:#666; text-transform:uppercase; letter-spacing:0.5px; }
.info-value { font-size:10pt; font-weight:bold; margin-top:1mm; }
.code { font-family:monospace; color:#1e3a6e; }
.footer { margin-top:12mm; display:flex; justify-content:space-between; align-items:flex-end; }
.sig-block { text-align:center; }
.sig-line { border-bottom:1px solid #1e3a6e; width:160px; margin-bottom:2mm; }
.sig-name { font-size:9pt; font-weight:bold; color:#1e3a6e; }
.sig-title { font-size:7.5pt; color:#555; }
.qr-block { text-align:center; }
.qr-label { font-size:7pt; color:#555; margin-top:1.5mm; }
.watermark { text-align:center; margin-top:10mm; font-size:7pt; color:#aaa; border-top:1px solid #eee; padding-top:4mm; }
</style></head><body><div class="page">

  <div class="header" style="display:flex;align-items:center;gap:10mm;text-align:left;">
    <div style="display:flex;flex-direction:column;align-items:center;gap:2mm;">
      <img src="${LOGO_URL}" class="logo" style="width:45px;height:45px;" />
      <img src="${LOGO_NAME}" style="height:14px;object-fit:contain;" />
    </div>
    <div style="flex:1;">
      <div class="org-name" style="font-size:15pt;">ANPPME</div>
      <div class="org-sub">Associação Nacional de Pregoeiros e Agentes de Contratação<br/>CNPJ: 28.325.407/0001-08<br/>Rua Terezina, 1263 – Nova Brasília – CEP: 76.908-430 – Ji-Paraná – Rondônia</div>
    </div>
    <div style="text-align:right;">
      <div class="doc-title" style="font-size:11pt;">Certidão de Regularidade</div>
      <div class="badge" style="float:right;margin-top:2mm;">✓ SITUAÇÃO REGULAR</div>
    </div>
  </div>

  <p class="body-text">
    Certificamos que <strong>${certificate.member_name}</strong>, inscrito(a) no CPF sob o nº
    <strong>${certificate.member_cpf}</strong>, portador(a) do Registro de Associado nº
    <strong>${certificate.registration_number || '---'}</strong>, encontra-se em situação
    <strong>REGULAR</strong> junto à Associação Nacional de Pregoeiros e Agentes de Contratação — ANPPME,
    com o pagamento de suas obrigações associativas em dia.
  </p>

  <p class="body-text">
    A presente certidão é expedida para os fins que se fizerem necessários e tem validade de
    <strong>30 (trinta) dias</strong> contados a partir da data de sua emissão.
  </p>

  <div class="info-grid">
    <div>
      <div class="info-label">Data de Emissão</div>
      <div class="info-value">${issueFormatted}</div>
    </div>
    <div>
      <div class="info-label">Válida até</div>
      <div class="info-value">${expiryFormatted}</div>
    </div>
    <div style="grid-column:1/-1;">
      <div class="info-label">Código de Verificação</div>
      <div class="info-value code">${certificate.certificate_code}</div>
    </div>
  </div>

  <div class="footer">
    <div class="sig-block" style="text-align:left;">
      <div style="font-size:8pt;color:#444;line-height:1.7;">
        <strong style="color:#1e3a6e;">ANPPME</strong> — Associação Nacional de Pregoeiros e Agentes de Contratação<br/>
        CNPJ: 28.325.407/0001-08<br/>
        Rua Terezina, 1263 – Nova Brasília – CEP: 76.908-430 – Ji-Paraná – Rondônia<br/>
        Emissão e autenticação: <strong>${window.location.origin}/verificar-certidao</strong><br/>
        <span style="font-family:monospace;font-size:8pt;color:#1e3a6e;font-weight:bold;">${certificate.certificate_code}</span>
      </div>
      <div style="margin-top:3mm;font-size:7pt;color:#aaa;">Pág. 1/1 · Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}</div>
    </div>
    <div class="qr-block">
      <img src="${qrUrl}" style="width:22mm;height:22mm;" />
      <div class="qr-label">Escaneie para verificar autenticidade</div>
    </div>
  </div>

</div></body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 1000);
}

export default function Certificate() {
  const [member, setMember] = useState(null);
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    async function load() {
      const u = await base44.auth.me();
      const members = await base44.entities.Member.filter({ email: u.email });
      if (members.length > 0) {
        const m = members[0];
        setMember(m);
        if (m.status === 'active') {
          const certs = await base44.entities.Certificate.filter({ member_id: m.id }, '-created_date', 1);
          if (certs.length > 0) {
            const cert = certs[0];
            if (new Date(cert.expiry_date) >= new Date()) setCertificate(cert);
          }
        }
      }
      setLoading(false);
    }
    load();
  }, []);

  const isAnnuityOk = () => {
    if (!member?.active_until) return false;
    return !isBefore(parseISO(member.active_until), new Date());
  };

  const handleGenerate = async () => {
    if (member.status !== 'active') { toast.error('Cadastro não está ativo.'); return; }
    if (!isAnnuityOk()) { toast.error('Anuidade vencida. Regularize para emitir certidão.'); return; }
    setGenerating(true);
    const today = new Date();
    const expiry = addDays(today, 30);
    const cert = await base44.entities.Certificate.create({
      member_id: member.id,
      member_name: member.full_name,
      member_cpf: member.cpf,
      registration_number: member.registration_number || '',
      issue_date: format(today, 'yyyy-MM-dd'),
      expiry_date: format(expiry, 'yyyy-MM-dd'),
      certificate_code: generateCode(),
    });
    setCertificate(cert);
    setGenerating(false);
    toast.success('Certidão emitida com sucesso!');
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  if (member && (member.status === 'suspended' || member.status === 'rejected')) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Certidão de Regularidade</h1>
        <Card className="border-0 shadow-sm"><CardContent className="p-8 text-center">
          <Ban className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h3 className="font-semibold text-red-700">Cadastro {member.status === 'suspended' ? 'Suspenso' : 'Inativo'}</h3>
          <p className="text-sm text-muted-foreground mt-1">A certidão de regularidade não pode ser emitida nesta situação.</p>
        </CardContent></Card>
      </div>
    );
  }

  if (!member || member.status !== 'active') {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Certidão de Regularidade</h1>
        <Card className="border-0 shadow-sm"><CardContent className="p-8 text-center">
          <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold">Certidão indisponível</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {!member ? 'Complete seu cadastro para emitir certidões.' : 'Seu cadastro precisa estar ativo para emitir a certidão.'}
          </p>
        </CardContent></Card>
      </div>
    );
  }

  if (!isAnnuityOk()) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Certidão de Regularidade</h1>
        <Card className="border-0 shadow-sm bg-amber-50"><CardContent className="p-8 text-center">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h3 className="font-semibold text-amber-800">Anuidade Vencida</h3>
          <p className="text-sm text-amber-700 mt-1">Sua anuidade está vencida. A certidão só pode ser emitida com anuidade em dia.</p>
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Certidão de Regularidade</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Emita sua certidão junto à ANPPME</p>
      </div>

      {certificate ? (
        <div className="space-y-4">
          <Card className="border-0 shadow-lg bg-white max-w-2xl mx-auto">
            <CardContent className="p-8 md:p-12">
              <div className="text-center border-b-2 border-primary pb-6 mb-6">
                <img src={LOGO_URL} alt="ANPPME" className="w-12 h-12 mx-auto mb-2 object-contain" />
                <h2 className="text-xl font-bold text-primary tracking-wide">ANPPME</h2>
                <p className="text-xs text-muted-foreground mt-1">Associação Nacional de Pregoeiros e Agentes de Contratação</p>
                <h3 className="text-lg font-bold tracking-wider uppercase text-foreground mt-4">Certidão de Regularidade</h3>
                <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" /> SITUAÇÃO REGULAR
                </div>
              </div>
              <div className="space-y-4 text-sm leading-relaxed">
                <p className="text-justify">
                  Certificamos que <strong>{certificate.member_name}</strong>, inscrito(a) no CPF sob o nº{' '}
                  <strong>{certificate.member_cpf}</strong>, registrado(a) sob o nº{' '}
                  <strong>{certificate.registration_number || '---'}</strong>, encontra-se em situação{' '}
                  <strong className="text-emerald-700">REGULAR</strong> junto à ANPPME, com o pagamento de suas obrigações associativas em dia.
                </p>
                <p className="text-justify">A presente certidão tem validade de <strong>30 (trinta) dias</strong> contados a partir da data de emissão.</p>
              </div>
              <div className="mt-6 p-4 rounded-lg bg-muted/50 grid grid-cols-2 gap-4 text-xs">
                <div><p className="text-muted-foreground">Data de Emissão</p><p className="font-semibold mt-0.5">{format(parseISO(certificate.issue_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p></div>
                <div><p className="text-muted-foreground">Válida até</p><p className="font-semibold mt-0.5">{format(parseISO(certificate.expiry_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p></div>
                <div className="col-span-2"><p className="text-muted-foreground">Código de Verificação</p><p className="font-mono font-bold text-sm mt-0.5 text-primary">{certificate.certificate_code}</p></div>
              </div>
              <div className="mt-6 pt-4 border-t flex items-end justify-between">
                <div className="text-[10px] text-muted-foreground space-y-0.5 max-w-xs">
                  <p className="font-semibold text-primary text-xs">ANPPME — Associação Nacional de Pregoeiros e Agentes de Contratação</p>
                  <p>CNPJ: 28.325.407/0001-08 · Rua Terezina, 1263 – Ji-Paraná/RO</p>
                  <p>Emissão/autenticação: <span className="font-medium">{window.location.origin}/verificar-certidao</span></p>
                  <p className="font-mono font-bold text-primary">{certificate.certificate_code}</p>
                  <p>Pág. 1/1</p>
                </div>
                <div className="text-center shrink-0">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(`${window.location.origin}/verificar-certidao?code=${encodeURIComponent(certificate.certificate_code)}`)}&color=1e3a6e&bgcolor=ffffff&margin=2`}
                    alt="QR Code" className="w-20 h-20"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">Escaneie para verificar</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-center gap-3">
            <Button onClick={() => printCertificate({ certificate, member })}>
              <Download className="w-4 h-4 mr-2" />Salvar / Imprimir PDF
            </Button>
            <Button variant="outline" onClick={handleGenerate} disabled={generating}>
              {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Nova Certidão
            </Button>
          </div>
        </div>
      ) : (
        <Card className="border-0 shadow-sm"><CardContent className="p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-7 h-7 text-primary" />
          </div>
          <h3 className="font-semibold text-lg">Emitir Certidão de Regularidade</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">A certidão atesta que você está regular junto à ANPPME. Validade de 30 dias. Disponível apenas com anuidade em dia.</p>
          <Button onClick={handleGenerate} disabled={generating} className="mt-5">
            {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Shield className="w-4 h-4 mr-2" />}
            Emitir Certidão
          </Button>
        </CardContent></Card>
      )}
    </div>
  );
}
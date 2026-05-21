/**
 * Página pública de verificação e emissão de Certidão de Regularidade.
 * Acessível sem login. Permite autenticar por código e consultar por nome/registro.
 */
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle2, XCircle, Loader2, Shield, Search, AlertCircle } from 'lucide-react';
import { format, isBefore, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const LOGO_SYMBOL = 'https://media.base44.com/images/public/69bdad4b62555d6f0c050afb/eb6f25876_LOGO_ANPPME_AZUL_SIMBOLO.png';
const LOGO_NAME   = 'https://media.base44.com/images/public/69bdad4b62555d6f0c050afb/236232730_ANPPME_LOGO_OFICIAL_NOME.png';

export default function VerifyCertificate() {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [reg, setReg] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('code'); // 'code' | 'search'

  // Auto-verify if code comes in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const c = params.get('code');
    if (c) { setCode(c); verifyCode(c); }
  }, []);

  async function verifyCode(c) {
    const target = (c || code).trim().toUpperCase();
    if (!target) return;
    setLoading(true);
    setResult(null);
    const certs = await base44.entities.Certificate.filter({ certificate_code: target });
    if (certs.length === 0) {
      setResult({ valid: false, reason: 'Código não encontrado.' });
    } else {
      const cert = certs[0];
      // Event certificate (has event_id and status=generated)
      if (cert.event_id) {
        setResult({
          valid: cert.status === 'generated',
          isEventCert: true,
          cert,
          name: cert.member_name,
          cpf: cert.member_cpf,
          registration: cert.registration_number,
          eventTitle: cert.event_title,
          issueDate: cert.issue_date ? parseISO(cert.issue_date) : null,
        });
      } else {
        // Regularity certificate (has expiry_date)
        const expired = cert.expiry_date ? isBefore(parseISO(cert.expiry_date), new Date()) : false;
        setResult({
          valid: !expired,
          expired,
          cert,
          name: cert.member_name,
          cpf: cert.member_cpf,
          registration: cert.registration_number,
          issueDate: cert.issue_date ? parseISO(cert.issue_date) : null,
          expiryDate: cert.expiry_date ? parseISO(cert.expiry_date) : null,
        });
      }
    }
    setLoading(false);
  }

  async function searchMember() {
    if (!name && !reg) return;
    setLoading(true);
    setResult(null);
    let members = await base44.entities.Member.filter({ status: 'active' });
    const found = members.find(m => {
      const matchName = name ? m.full_name?.toLowerCase().includes(name.toLowerCase()) : true;
      const matchReg  = reg  ? m.registration_number === reg.trim() : true;
      return matchName && matchReg;
    });
    if (!found) {
      setResult({ valid: false, reason: 'Associado não encontrado ou cadastro inativo.' });
    } else {
      const certs = await base44.entities.Certificate.filter({ member_id: found.id }, '-created_date', 1);
      const valid = certs.length > 0 && !isBefore(parseISO(certs[0].expiry_date), new Date());
      if (!valid) {
        setResult({ valid: false, reason: `Associado encontrado, mas não há certidão válida emitida para ${found.full_name}.` });
      } else {
        const cert = certs[0];
        setResult({
          valid: true,
          cert,
          name: cert.member_name,
          cpf: cert.member_cpf,
          registration: cert.registration_number,
          issueDate: parseISO(cert.issue_date),
          expiryDate: parseISO(cert.expiry_date),
        });
      }
    }
    setLoading(false);
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f4f8 0%, #e8f0fe 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'flex-start', padding: '40px 16px',
      fontFamily: "'Segoe UI', Arial, sans-serif"
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
        <img src={LOGO_SYMBOL} alt="ANPPME" style={{ height: 56 }} />
        <div>
          <img src={LOGO_NAME} alt="ANPPME" style={{ height: 28, display: 'block' }} />
          <div style={{ fontSize: 11, color: '#666', marginTop: 3 }}>Verificação de Certidão de Regularidade</div>
        </div>
      </div>

      <div style={{
        background: 'white', borderRadius: 16,
        boxShadow: '0 8px 32px rgba(30,58,110,0.12)',
        maxWidth: 500, width: '100%',
        padding: '32px 28px', border: '1px solid rgba(30,58,110,0.08)'
      }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {[{ id: 'code', label: '🔑 Verificar por Código' }, { id: 'search', label: '🔍 Buscar por Nome/Registro' }].map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setResult(null); }}
              style={{
                flex: 1, padding: '8px 4px', border: 'none', borderRadius: 8, cursor: 'pointer',
                fontSize: 12, fontWeight: 600,
                background: tab === t.id ? '#1e3a6e' : '#f1f5f9',
                color: tab === t.id ? '#fff' : '#475569'
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'code' ? (
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
              Código de Verificação
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && verifyCode()}
                placeholder="Ex: ABCD-EFGH-1234"
                style={{
                  flex: 1, padding: '10px 14px', border: '1.5px solid #d1d5db',
                  borderRadius: 8, fontSize: 14, fontFamily: 'monospace',
                  outline: 'none', letterSpacing: 1
                }}
              />
              <button onClick={() => verifyCode()} disabled={loading || !code.trim()}
                style={{
                  padding: '10px 18px', background: '#1e3a6e', color: '#fff',
                  border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13
                }}>
                {loading ? '...' : 'Verificar'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Nome Completo</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Digite o nome do associado"
                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Nº de Registro</label>
              <input value={reg} onChange={e => setReg(e.target.value)} placeholder="Ex: 0001/2024"
                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <button onClick={searchMember} disabled={loading || (!name && !reg)}
              style={{
                padding: '10px 18px', background: '#1e3a6e', color: '#fff',
                border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13
              }}>
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        )}

        {/* Result */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '24px 0', color: '#666' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
            Verificando...
          </div>
        )}

        {result && !loading && (
          <div style={{ marginTop: 24, padding: '20px', borderRadius: 12, border: result.valid ? '1.5px solid #6ee7b7' : '1.5px solid #fca5a5', background: result.valid ? '#f0fdf4' : '#fef2f2' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              {result.valid
                ? <CheckCircle2 style={{ width: 28, height: 28, color: '#059669' }} />
                : <XCircle style={{ width: 28, height: 28, color: '#dc2626' }} />}
              <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: result.valid ? '#059669' : '#dc2626' }}>
                {result.valid
                  ? (result.isEventCert ? 'Certificado Válido' : 'Certidão Válida')
                  : (result.expired ? 'Certidão Vencida' : 'Inválido')}
                </div>
                {!result.valid && <div style={{ fontSize: 13, color: '#555', marginTop: 2 }}>{result.reason}</div>}
              </div>
            </div>

            {result.valid && result.cert && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                <div><span style={{ color: '#6b7280', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Nome</span><br /><strong style={{ color: '#1e3a6e' }}>{result.name}</strong></div>
                {result.isEventCert ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div><span style={{ color: '#6b7280', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Evento</span><br /><strong>{result.eventTitle}</strong></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div><span style={{ color: '#6b7280', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Código</span><br /><span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1e3a6e' }}>{result.cert.certificate_code}</span></div>
                      <div><span style={{ color: '#6b7280', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Emitido em</span><br />{result.issueDate ? format(result.issueDate, 'dd/MM/yyyy') : '---'}</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div><span style={{ color: '#6b7280', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Registro</span><br /><span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{result.registration || '---'}</span></div>
                    <div><span style={{ color: '#6b7280', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Código</span><br /><span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1e3a6e' }}>{result.cert.certificate_code}</span></div>
                    <div><span style={{ color: '#6b7280', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Emitida em</span><br />{result.issueDate ? format(result.issueDate, 'dd/MM/yyyy') : '---'}</div>
                    <div><span style={{ color: '#6b7280', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Válida até</span><br /><strong style={{ color: '#b45309' }}>{result.expiryDate ? format(result.expiryDate, 'dd/MM/yyyy') : '---'}</strong></div>
                  </div>
                )}
                <div style={{ marginTop: 4, padding: '8px 12px', background: '#d1fae5', borderRadius: 6, fontSize: 11, color: '#065f46', fontWeight: 600 }}>
                  ✓ {result.isEventCert ? 'Certificado autêntico' : 'Certidão autêntica'} verificado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm")}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ marginTop: 24, fontSize: 11, color: '#888', textAlign: 'center' }}>
        <Shield style={{ width: 13, height: 13, display: 'inline', marginRight: 4 }} />
        Verificação segura — ANPPME · Certidão de Regularidade e Certificados de Eventos<br />
        {window.location.origin}/verificar-certidao
      </div>
    </div>
  );
}
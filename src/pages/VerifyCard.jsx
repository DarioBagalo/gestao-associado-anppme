import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle2, XCircle, Loader2, Shield, AlertCircle, CreditCard } from 'lucide-react';
import { maskCPF } from '@/lib/formatters';
import { format, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const LOGO_SYMBOL = 'https://media.base44.com/images/public/69bdad4b62555d6f0c050afb/eb6f25876_LOGO_ANPPME_AZUL_SIMBOLO.png';
const LOGO_NAME   = 'https://media.base44.com/images/public/69bdad4b62555d6f0c050afb/236232730_ANPPME_LOGO_OFICIAL_NOME.png';

export default function VerifyCard() {
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verify() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      if (!code) {
        setResult({ valid: false, reason: 'Código não informado.' });
        setLoading(false);
        return;
      }

      // Try member card: ANPPME-{registration_number}-{id_suffix}
      if (code.startsWith('ANPPME-')) {
        const members = await base44.entities.Member.filter({ status: 'active' });
        const found = members.find(m => {
          const expected = `ANPPME-${m.registration_number || '0000'}-${m.id.slice(-6).toUpperCase()}`;
          return expected === code;
        });

        if (!found) {
          setResult({ valid: false, reason: 'Associado não encontrado ou carteira inválida.' });
        } else {
          const now = new Date();
          const activeUntil = found.active_until ? new Date(found.active_until) : null;
          const expired = activeUntil ? isBefore(activeUntil, now) : false;
          const memberTypeLabels = { participante: 'Sócio Participante', contribuinte: 'Sócio Contribuinte', benemerито: 'Sócio Benemérito' };
          setResult({
            type: 'card',
            valid: !expired,
            name: found.full_name,
            cpf: found.cpf,
            registration: found.registration_number,
            activeUntil,
            expired,
            photoUrl: found.photo_url || null,
            memberType: memberTypeLabels[found.member_type] || 'Sócio Participante',
            city: found.workplace_city || found.birth_city || '',
            state: found.workplace_state || found.birth_state || '',
          });
        }
        setLoading(false);
        return;
      }

      // Try certificate code
      const certs = await base44.entities.Certificate.filter({ certificate_code: code });
      if (certs.length > 0) {
        const cert = certs[0];
        const now = new Date();
        const expiry = new Date(cert.expiry_date);
        const expired = isBefore(expiry, now);
        setResult({
          type: 'certificate',
          valid: !expired,
          name: cert.member_name,
          cpf: cert.member_cpf,
          registration: cert.registration_number,
          issueDate: new Date(cert.issue_date),
          expiryDate: expiry,
          expired,
        });
        setLoading(false);
        return;
      }

      setResult({ valid: false, reason: 'Código não reconhecido.' });
      setLoading(false);
    }
    verify();
  }, []);

  const typeLabel = result?.type === 'certificate' ? 'Certidão de Regularidade' : 'Carteira de Associado';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f4f8 0%, #e8f0fe 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      fontFamily: "'Segoe UI', Arial, sans-serif"
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
        <img src={LOGO_SYMBOL} alt="ANPPME" style={{ height: 60 }} />
        <div>
          <img src={LOGO_NAME} alt="ANPPME" style={{ height: 30, display: 'block' }} />
          <div style={{ fontSize: 11, color: '#666', marginTop: 3 }}>Portal de Verificação de Autenticidade</div>
        </div>
      </div>

      <div style={{
        background: 'white',
        borderRadius: 16,
        boxShadow: '0 8px 32px rgba(30,58,110,0.12)',
        maxWidth: 460,
        width: '100%',
        padding: '36px 32px',
        border: '1px solid rgba(30,58,110,0.08)'
      }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '24px 0' }}>
            <Loader2 style={{ width: 40, height: 40, color: '#1e3a6e', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: '#666', fontSize: 14 }}>Verificando autenticidade...</p>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>

        ) : result?.valid ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            {/* Status badge */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 style={{ width: 36, height: 36, color: '#059669' }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#059669', margin: 0 }}>
                  {result.type === 'certificate' ? 'Certidão Válida' : 'Carteira Válida'}
                </h2>
                <p style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                  {typeLabel} — ANPPME
                </p>
              </div>
            </div>

            {/* Photo if card */}
            {result.type === 'card' && result.photoUrl && (
              <img
                src={result.photoUrl}
                alt="Foto do associado"
                style={{ width: 72, height: 90, objectFit: 'cover', borderRadius: 6, border: '2px solid #1e3a6e', display: 'block' }}
              />
            )}

            {/* Member data */}
            <div style={{
              width: '100%',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: 10,
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}>
              <div>
                <div style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5 }}>Nome do Associado</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#1e3a6e', marginTop: 3 }}>{result.name}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', fontWeight: 700 }}>Registro</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1e3a6e', fontFamily: 'monospace', marginTop: 3 }}>{result.registration || '---'}</div>
                </div>
                {result.cpf && (
                  <div>
                    <div style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', fontWeight: 700 }}>CPF</div>
                    <div style={{ fontSize: 13, color: '#333', fontFamily: 'monospace', marginTop: 3 }}>{maskCPF(result.cpf)}</div>
                  </div>
                )}
                {result.type === 'card' && result.memberType && (
                  <div>
                    <div style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', fontWeight: 700 }}>Tipo de Sócio</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1e3a6e', marginTop: 3 }}>{result.memberType}</div>
                  </div>
                )}
                {result.type === 'card' && result.city && (
                  <div>
                    <div style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', fontWeight: 700 }}>Município/Estado</div>
                    <div style={{ fontSize: 13, color: '#333', marginTop: 3 }}>{result.city}{result.state ? `/${result.state}` : ''}</div>
                  </div>
                )}
                {result.type === 'card' && result.activeUntil && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', fontWeight: 700 }}>Anuidade válida até</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#b45309', marginTop: 3 }}>{format(result.activeUntil, 'dd/MM/yyyy')}</div>
                  </div>
                )}
                <div style={{ gridColumn: '1 / -1', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '8px 12px', fontSize: 11, color: '#065f46' }}>
                  ✓ Documento verificado e validado pelo sistema ANPPME em {format(new Date(), "dd/MM/yyyy 'às' HH:mm")}
                </div>
                {result.type === 'certificate' && (
                  <>
                    <div>
                      <div style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', fontWeight: 700 }}>Emitida em</div>
                      <div style={{ fontSize: 13, color: '#333', marginTop: 3 }}>{format(result.issueDate, 'dd/MM/yyyy')}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', fontWeight: 700 }}>Válida até</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#b45309', marginTop: 3 }}>{format(result.expiryDate, 'dd/MM/yyyy')}</div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div style={{ fontSize: 11, color: '#059669', fontWeight: 600, textAlign: 'center' }}>
              ✓ Documento autêntico emitido pelo sistema ANPPME
            </div>
          </div>

        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <XCircle style={{ width: 36, height: 36, color: '#dc2626' }} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#dc2626', margin: 0 }}>
                {result?.expired ? 'Documento Vencido' : 'Documento Inválido'}
              </h2>
              <p style={{ fontSize: 13, color: '#555', marginTop: 6, lineHeight: 1.5 }}>
                {result?.expired
                  ? `A validade do documento de <strong>${result.name}</strong> expirou em ${result.activeUntil ? format(result.activeUntil, 'dd/MM/yyyy') : result.expiryDate ? format(result.expiryDate, 'dd/MM/yyyy') : '---'}.`
                  : result?.reason || 'Não foi possível verificar a autenticidade deste documento.'}
              </p>
            </div>
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 10,
              padding: '14px 18px',
              fontSize: 12,
              color: '#7f1d1d',
              width: '100%',
              textAlign: 'center',
              lineHeight: 1.6
            }}>
              Em caso de dúvidas, entre em contato com a ANPPME.<br />
              <strong>CNPJ: 28.325.407/0001-08</strong>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: 28, fontSize: 11, color: '#888', textAlign: 'center', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Shield style={{ width: 13, height: 13 }} />
        Verificação segura — ANPPME · Sistema oficial de autenticidade
      </div>
    </div>
  );
}
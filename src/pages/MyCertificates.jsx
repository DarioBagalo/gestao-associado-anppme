import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Award, Download, Loader2, AlertCircle, QrCode } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function MyCertificates() {
  const [member, setMember] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const u = await base44.auth.me();
      const members = await base44.entities.Member.filter({ email: u.email });
      if (members.length > 0) {
        const m = members[0];
        setMember(m);
        const certs = await base44.entities.Certificate.filter({ member_id: m.id }, '-created_date', 50);
        setCertificates(certs.filter(c => c.event_id && c.status === 'generated'));
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!member || member.status !== 'active') {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Meus Certificados</h1>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-10 text-center">
            <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold">Cadastro não ativo</h3>
            <p className="text-sm text-muted-foreground mt-1">Seu cadastro precisa estar ativo para acessar os certificados.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Meus Certificados</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Certificados de eventos que você participou</p>
      </div>

      {certificates.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-10 text-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Award className="w-7 h-7 text-primary" />
            </div>
            <h3 className="font-semibold text-lg">Nenhum certificado disponível</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              Seus certificados aparecerão aqui após a confirmação de presença nos eventos e geração pelo administrador.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {certificates.map(cert => (
            <Card key={cert.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5 text-primary" />
                  </div>
                  <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border-0">Disponível</Badge>
                </div>

                <h3 className="font-semibold text-sm leading-snug mb-1 line-clamp-2">{cert.event_title}</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Emitido em {cert.issue_date ? format(parseISO(cert.issue_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : '---'}
                </p>

                <div className="bg-muted/50 rounded-md p-2 mb-3">
                  <p className="text-[10px] text-muted-foreground mb-0.5">Código de Autenticação</p>
                  <p className="font-mono text-xs font-bold text-primary tracking-wider">{cert.certificate_code}</p>
                </div>

                <div className="flex gap-2">
                  {cert.file_url && (
                    <Button size="sm" className="flex-1 h-8 text-xs" asChild>
                      <a href={cert.file_url} target="_blank" rel="noreferrer" download>
                        <Download className="w-3.5 h-3.5 mr-1.5" /> Baixar PDF
                      </a>
                    </Button>
                  )}
                  <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" asChild title="Verificar autenticidade">
                    <a href={`/verificar-certidao?code=${encodeURIComponent(cert.certificate_code)}`} target="_blank" rel="noreferrer">
                      <QrCode className="w-3.5 h-3.5" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
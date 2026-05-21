import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Award, Loader2, Download, RefreshCw, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function GenerateCertificatesPanel({ event }) {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => { if (event) loadParticipants(); }, [event]);

  async function loadParticipants() {
    setLoading(true);
    const regs = await base44.entities.EventRegistration.filter({ event_id: event.id });
    setParticipants(regs);
    setLoading(false);
  }

  const attendedWithoutCert = participants.filter(p => p.attended && !p.certificate_url);
  const withCert = participants.filter(p => !!p.certificate_url);

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectAll = () => {
    setSelectedIds(attendedWithoutCert.map(p => p.id));
  };

  const handleGenerate = async () => {
    if (!event.certificate_template_front_url) {
      toast.error('Configure a arte do certificado antes de gerar.');
      return;
    }
    const ids = selectedIds.length > 0 ? selectedIds : null;
    const count = ids ? ids.length : attendedWithoutCert.length;
    if (count === 0) { toast.error('Nenhum participante selecionado.'); return; }

    if (!confirm(`Gerar ${count} certificado(s)? Esta ação enviará e-mails de notificação.`)) return;

    setGenerating(true);
    const res = await base44.functions.invoke('generateCertificate', {
      eventId: event.id,
      registrationIds: ids
    });

    if (res.data?.success) {
      toast.success(`${res.data.generated} certificado(s) gerado(s) com sucesso!`);
      setSelectedIds([]);
      loadParticipants();
    } else {
      toast.error(res.data?.error || 'Erro ao gerar certificados.');
    }
    setGenerating(false);
  };

  if (!event.certificate_template_front_url) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-amber-700">Configure o template do certificado</p>
          <p className="text-xs text-muted-foreground mt-1">
            Adicione a arte da frente do certificado na aba "Certificado" das configurações do evento.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{participants.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Inscritos</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{participants.filter(p => p.attended).length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Presença Confirmada</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{withCert.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Certificados Gerados</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      {attendedWithoutCert.length > 0 && (
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">{attendedWithoutCert.length}</strong> participante(s) com presença confirmada aguardando certificado.
          </p>
          <div className="flex gap-2">
            {attendedWithoutCert.length > 1 && (
              <Button variant="outline" size="sm" onClick={selectAll} className="text-xs h-8">
                Selecionar Todos
              </Button>
            )}
            <Button size="sm" onClick={handleGenerate} disabled={generating} className="text-xs h-8">
              {generating ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Award className="w-3.5 h-3.5 mr-1.5" />}
              {selectedIds.length > 0 ? `Gerar ${selectedIds.length} Selecionado(s)` : `Gerar ${attendedWithoutCert.length} Certificado(s)`}
            </Button>
          </div>
        </div>
      )}

      {/* Participant list */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Lista de Participantes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {participants.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum inscrito encontrado.</p>
          ) : (
            <div className="divide-y">
              {participants.map(p => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                  {p.attended && !p.certificate_url && (
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(p.id)}
                      onChange={() => toggleSelect(p.id)}
                      className="w-4 h-4 shrink-0"
                    />
                  )}
                  {(!p.attended || p.certificate_url) && <div className="w-4 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.member_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.member_email || 'Sem e-mail'}{p.member_cpf ? ` · CPF: ${p.member_cpf}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {p.attended ? (
                      <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border-0">
                        <CheckCircle2 className="w-2.5 h-2.5 mr-1" /> Presente
                      </Badge>
                    ) : (
                      <Badge className="text-[10px] bg-gray-100 text-gray-500 border-0">Ausente</Badge>
                    )}
                    {p.certificate_url && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                        <a href={p.certificate_url} target="_blank" rel="noreferrer" title="Baixar certificado">
                          <Download className="w-3.5 h-3.5 text-primary" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {withCert.length > 0 && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={loadParticipants} className="text-xs h-8">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Atualizar lista
          </Button>
        </div>
      )}
    </div>
  );
}
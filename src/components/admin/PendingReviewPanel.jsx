import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, FileText, Loader2, ExternalLink, ChevronDown, ChevronUp, Bell, User, Calendar } from 'lucide-react';
import { getStatusLabel, getStatusColor, generateRegistrationNumber } from '@/lib/formatters';
import { format } from 'date-fns';

const STATUS_NOTIF = {
  active: { title: '🎉 Cadastro Ativo!', message: 'Parabéns! Seu cadastro foi ativado. Você já pode emitir sua carteira e certidão de regularidade.', type: 'status_change' },
  approved: { title: '✅ Cadastro Aprovado!', message: 'Seu cadastro foi aprovado. Envie seus documentos para concluir o processo de associação.', type: 'status_change' },
  rejected: { title: '❌ Cadastro Não Aprovado', message: 'Infelizmente seu cadastro não foi aprovado. Verifique as observações do gestor.', type: 'status_change' },
  documents_pending: { title: '📎 Documentos em Análise', message: 'Seus documentos estão sendo analisados. Em breve você receberá uma resposta.', type: 'status_change' },
  suspended: { title: '⚠️ Cadastro Suspenso', message: 'Seu cadastro foi suspenso. Entre em contato com a secretaria para regularizar.', type: 'status_change' },
};

function MemberReviewCard({ member, allMembersCount, onRefresh }) {
  const [expanded, setExpanded]   = useState(false);
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [newStatus, setNewStatus] = useState(member.status);
  const [notes, setNotes]         = useState(member.admin_notes || '');
  const [regNumber, setRegNumber] = useState(member.registration_number || '');
  const [activeUntil, setActiveUntil] = useState(member.active_until || '');
  const [saving, setSaving]       = useState(false);

  const loadDocs = async () => {
    setLoadingDocs(true);
    const docs = await base44.entities.Document.filter({ member_id: member.id });
    setDocuments(docs);
    setLoadingDocs(false);
  };

  const handleExpand = () => {
    if (!expanded) loadDocs();
    setExpanded(!expanded);
    // Auto-generate reg number when activating
    if (!expanded && newStatus === 'active' && !regNumber) {
      setRegNumber(generateRegistrationNumber(allMembersCount + 1));
    }
  };

  const handleStatusChange = (val) => {
    setNewStatus(val);
    if (val === 'active' && !regNumber) {
      setRegNumber(generateRegistrationNumber(allMembersCount + 1));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const updateData = { status: newStatus, admin_notes: notes, registration_number: regNumber, active_until: activeUntil || null };
    if (newStatus === 'active' && !member.card_issue_date) {
      updateData.card_issue_date = format(new Date(), 'yyyy-MM-dd');
    }
    await base44.entities.Member.update(member.id, updateData);

    // Send notification if status changed
    if (newStatus !== member.status) {
      const notif = STATUS_NOTIF[newStatus];
      if (notif) {
        const message = newStatus === 'rejected' && notes
          ? `${notif.message} Motivo: ${notes}`
          : notif.message;
        await base44.entities.Notification.create({
          member_id: member.id,
          user_email: member.email,
          type: notif.type,
          title: notif.title,
          message,
          read: false,
          link: '/meu-cadastro',
        });
      }
    }

    toast.success('Associado atualizado e notificado!');
    setSaving(false);
    onRefresh();
  };

  const docStatusColor = { pending: 'bg-amber-100 text-amber-700', approved: 'bg-emerald-100 text-emerald-700', rejected: 'bg-red-100 text-red-700' };
  const docTypeLabel = { photo: 'Foto 3x4', work_proof: 'Comprovante', id_document: 'Identidade', signature: 'Assinatura', other: 'Outro' };

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <CardContent className="p-0">
        {/* Header row */}
        <button onClick={handleExpand} className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
              {member.full_name?.[0]}
            </div>
            <div>
              <p className="text-sm font-semibold">{member.full_name}</p>
              <p className="text-xs text-muted-foreground">{member.email} · {member.workplace_function}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge className={getStatusColor(member.status) + " border text-xs"}>{getStatusLabel(member.status)}</Badge>
            <span className="text-xs text-muted-foreground">{member.created_date && format(new Date(member.created_date), 'dd/MM/yyyy')}</span>
            {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </button>

        {expanded && (
          <div className="border-t p-4 space-y-5 bg-muted/20">
            {/* Personal summary */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div><span className="text-muted-foreground">CPF:</span> <span className="font-medium">{member.cpf}</span></div>
              <div><span className="text-muted-foreground">Telefone:</span> <span className="font-medium">{member.phone}</span></div>
              <div><span className="text-muted-foreground">Nascimento:</span> <span className="font-medium">{member.birth_date && format(new Date(member.birth_date), 'dd/MM/yyyy')}</span></div>
              <div className="col-span-2"><span className="text-muted-foreground">Local de Trabalho:</span> <span className="font-medium">{member.workplace_name}</span></div>
              <div><span className="text-muted-foreground">Função:</span> <span className="font-medium">{member.workplace_function}</span></div>
            </div>

            {/* Photo and Signature preview */}
            {(member.photo_url || member.signature_url) && (
              <div className="flex gap-4 flex-wrap">
                {member.photo_url && (
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Foto</p>
                    <img src={member.photo_url} alt="Foto" className="w-16 h-20 object-cover rounded border" />
                  </div>
                )}
                {member.signature_url && (
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Assinatura</p>
                    <img src={member.signature_url} alt="Assinatura" className="h-12 object-contain rounded border px-2 bg-white" />
                  </div>
                )}
              </div>
            )}

            {/* Documents */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Documentos Enviados</p>
              {loadingDocs ? (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              ) : documents.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhum documento enviado.</p>
              ) : (
                <div className="space-y-1.5">
                  {documents.map(doc => (
                    <div key={doc.id} className="flex items-center gap-2 p-2 rounded border bg-card text-xs">
                      <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="flex-1 truncate">{doc.title}</span>
                      <span className="text-muted-foreground">{docTypeLabel[doc.type] || doc.type}</span>
                      <Badge className={docStatusColor[doc.status] + " text-[10px] border"}>{doc.status === 'pending' ? 'Pendente' : doc.status === 'approved' ? 'Aprovado' : 'Rejeitado'}</Badge>
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon" className="h-6 w-6"><ExternalLink className="w-3 h-3" /></Button>
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Admin actions */}
            <div className="space-y-3 p-3 rounded-lg bg-card border">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Decisão do Gestor</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Novo Status</Label>
                  <Select value={newStatus} onValueChange={handleStatusChange}>
                    <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="approved">Aprovado – Aguardando Docs</SelectItem>
                      <SelectItem value="documents_pending">Documentos em Análise</SelectItem>
                      <SelectItem value="active">Ativo ✓</SelectItem>
                      <SelectItem value="rejected">Rejeitado ✗</SelectItem>
                      <SelectItem value="suspended">Suspenso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Nº Registro</Label>
                  <Input value={regNumber} onChange={e => setRegNumber(e.target.value)} placeholder="0000/2025" className="text-sm font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Validade Anuidade</Label>
                  <Input type="date" value={activeUntil} onChange={e => setActiveUntil(e.target.value)} className="text-sm" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Observações (serão enviadas ao associado em caso de rejeição)</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Motivo da aprovação/rejeição ou observações..." className="h-16 text-sm resize-none" />
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleSave} disabled={saving} className="gap-2">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bell className="w-3.5 h-3.5" />}
                  Salvar e Notificar Associado
                </Button>
                <p className="text-[11px] text-muted-foreground">Uma notificação será enviada automaticamente.</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function PendingReviewPanel({ members, onRefresh }) {
  const allMembersCount = members.length;

  if (members.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-12 text-center text-muted-foreground">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-emerald-400" />
          <p className="font-semibold">Nenhum cadastro pendente de análise!</p>
          <p className="text-sm mt-1">Todos os cadastros foram revisados.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <FileText className="w-4 h-4" />
        <span>{members.length} cadastro(s) aguardando análise</span>
      </div>
      {members.map(m => (
        <MemberReviewCard key={m.id} member={m} allMembersCount={allMembersCount} onRefresh={onRefresh} />
      ))}
    </div>
  );
}
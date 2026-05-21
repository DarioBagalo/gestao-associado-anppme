import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Calendar, Printer, CreditCard } from 'lucide-react';
import DocumentsPanel from '@/components/admin/DocumentsPanel';
import MemberFichaModal from '@/components/admin/MemberFichaModal';
import MemberCardModal from '@/components/admin/MemberCardModal';
import { getStatusLabel, getStatusColor, generateRegistrationNumber, generateRegistrationNumberFromConfig, getMemberTypeLabel } from '@/lib/formatters';
import { sendStatusChangeEmail } from '@/lib/emailService';
import { format } from 'date-fns';
import DateInput from '@/components/ui/DateInput';
import { formatDateBR, parseDateLocal } from '@/lib/dateUtils';

export default function MemberDetailModal({ member, allMembersCount, onClose, onUpdate }) {
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [newStatus, setNewStatus] = useState(member.status);
  const [newMemberType, setNewMemberType] = useState(member.member_type || 'participante');
  const [regNumber, setRegNumber] = useState(member.registration_number || '');
  const [notes, setNotes] = useState(member.admin_notes || '');
  const [activeUntil, setActiveUntil] = useState(member.active_until || '');
  const [saving, setSaving] = useState(false);
  const [showFicha, setShowFicha] = useState(false);
  const [showCard, setShowCard] = useState(false);

  useEffect(() => {
    async function loadDocs() {
      const docs = await base44.entities.Document.filter({ member_id: member.id });
      setDocuments(docs);
      setLoadingDocs(false);
    }
    loadDocs();
  }, [member.id]);

  // Auto-generate registration number when activating
  useEffect(() => {
    if (newStatus === 'active' && !regNumber) {
      loadNextRegNumber();
    }
  }, [newStatus]);

  const loadNextRegNumber = async () => {
    const settings = await base44.entities.AppSettings.filter({ key: 'registration_config' });
    if (settings.length > 0 && settings[0].registration_start_number) {
      const activeMembers = await base44.entities.Member.filter({ status: 'active' });
      const nextNum = settings[0].registration_start_number + activeMembers.length;
      setRegNumber(generateRegistrationNumberFromConfig(nextNum));
    } else {
      setRegNumber(generateRegistrationNumber(allMembersCount + 1));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const updateData = {
      status: newStatus,
      member_type: newMemberType,
      registration_number: regNumber,
      admin_notes: notes,
      active_until: activeUntil || null,
    };
    // Set card_issue_date when first activating
    if (newStatus === 'active' && !member.card_issue_date) {
      updateData.card_issue_date = format(new Date(), 'yyyy-MM-dd');
    }
    await base44.entities.Member.update(member.id, updateData);

    // Send email if status changed
    if (newStatus !== member.status) {
      try {
        await sendStatusChangeEmail(member.email, member.full_name, newStatus, notes);
      } catch (e) {
        console.warn('Email error:', e);
      }
    }
    toast.success('Associado atualizado com sucesso!');
    setSaving(false);
    onUpdate();
  };

  const refreshDocs = async () => {
    const docs = await base44.entities.Document.filter({ member_id: member.id });
    setDocuments(docs);
  };

  return (
    <>
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
              {member.full_name?.[0]}
            </div>
            <div>
              <p className="text-lg">{member.full_name}</p>
              <p className="text-xs font-normal text-muted-foreground">{member.cpf} · {member.email}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Personal Info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground text-xs">Telefone:</span><br />{member.phone}</div>
            <div><span className="text-muted-foreground text-xs">Nascimento:</span><br />{formatDateBR(member.birth_date)}</div>
            <div><span className="text-muted-foreground text-xs">Nacionalidade:</span><br />{member.nationality || '---'}</div>
            <div><span className="text-muted-foreground text-xs">Natural de:</span><br />{member.birth_city || '---'}/{member.birth_state || '---'}</div>
            <div><span className="text-muted-foreground text-xs">Pai:</span><br />{member.father_name || '---'}</div>
            <div><span className="text-muted-foreground text-xs">Mãe:</span><br />{member.mother_name || '---'}</div>
          </div>

          <Separator />

          {/* Work Info */}
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Dados Profissionais</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><span className="text-muted-foreground text-xs">Local de Trabalho:</span><br />{member.workplace_name}</div>
              <div className="col-span-2"><span className="text-muted-foreground text-xs">Endereço:</span><br />{member.workplace_address || '---'}</div>
              <div><span className="text-muted-foreground text-xs">Telefone:</span><br />{member.workplace_phone || '---'}</div>
              <div><span className="text-muted-foreground text-xs">E-mail:</span><br />{member.workplace_email || '---'}</div>
              <div className="col-span-2"><span className="text-muted-foreground text-xs">Função:</span><br /><strong>{member.workplace_function}</strong></div>
            </div>
          </div>

          <Separator />

          {/* Documents */}
          <div>
            <p className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-3">Documentos</p>
            <DocumentsPanel
              documents={documents}
              member={member}
              loadingDocs={loadingDocs}
              onRefresh={refreshDocs}
            />
          </div>

          <Separator />

          {/* Admin Actions */}
          <div className="space-y-3">
            <p className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Ações do Gestor</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente de Aprovação</SelectItem>
                    <SelectItem value="payment_pending">Pendente de Pagamento</SelectItem>
                    <SelectItem value="approved">Aprovado (Aguardando Docs)</SelectItem>
                    <SelectItem value="documents_pending">Documentos em Análise</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="rejected">Rejeitado</SelectItem>
                    <SelectItem value="suspended">Suspenso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tipo de Sócio</Label>
                <Select value={newMemberType} onValueChange={setNewMemberType}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="participante">Sócio Participante</SelectItem>
                    <SelectItem value="contribuinte">Sócio Contribuinte</SelectItem>
                    <SelectItem value="benemérito">Sócio Benemérito</SelectItem>
                    <SelectItem value="fundador">Sócio Fundador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Nº de Registro (auto)</Label>
                <Input value={regNumber} onChange={(e) => setRegNumber(e.target.value)} placeholder="0000/2024" className="text-sm font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1"><Calendar className="w-3 h-3" />Validade da Anuidade</Label>
                <DateInput value={activeUntil} onChange={(v) => setActiveUntil(v || '')} className="text-sm" />
              </div>
              {member.active_until && (
                <div className="space-y-1.5 flex items-end">
                  <div className="p-2.5 rounded-lg bg-muted/50 text-xs w-full">
                    <p className="text-muted-foreground">Anuidade atual</p>
                    <p className="font-semibold mt-0.5">{formatDateBR(member.active_until)}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Observações</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observações sobre o associado..." className="h-20 text-sm resize-none" />
            </div>
          </div>
        </div>

        <DialogFooter className="flex-wrap gap-2 sm:justify-between">
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setShowFicha(true)}>
              <Printer className="w-4 h-4 mr-2" />Ficha Cadastral
            </Button>
            <Button variant="outline" onClick={() => setShowCard(true)}>
              <CreditCard className="w-4 h-4 mr-2" />Visualizar Carteira
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Salvar Alterações
          </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    {showFicha && <MemberFichaModal member={member} onClose={() => setShowFicha(false)} />}
    {showCard && <MemberCardModal member={member} onClose={() => setShowCard(false)} />}
    </>
  );
}
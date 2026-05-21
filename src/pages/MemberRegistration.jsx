import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Save, Upload, FileText, AlertTriangle, Loader2, Calendar, Printer, MessageCircle, CreditCard } from 'lucide-react';
import MemberFichaModal from '@/components/admin/MemberFichaModal';
import MemberCardModal from '@/components/admin/MemberCardModal';
import MemberChat from '@/components/chat/MemberChat';
import PersonalInfoSection from '@/components/registration/PersonalInfoSection';
import WorkInfoSection from '@/components/registration/WorkInfoSection';
import DocumentUploadSection from '@/components/registration/DocumentUploadSection';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { getStatusLabel, getStatusColor } from '@/lib/formatters';
import { sendNewRegistrationEmail } from '@/lib/emailService';
import { format, parseISO, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function MemberRegistration() {
  const [user, setUser] = useState(null);
  const [member, setMember] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showFicha, setShowFicha] = useState(false);
  const [showCard, setShowCard] = useState(false);

  useEffect(() => {
    async function load() {
      const u = await base44.auth.me();
      setUser(u);
      const members = await base44.entities.Member.filter({ email: u.email });
      if (members.length > 0) {
        setMember(members[0]);
        setFormData(members[0]);
      } else {
        setFormData({ email: u.email, full_name: u.full_name || '', nationality: 'Brasileira' });
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async () => {
    if (!formData.full_name || !formData.cpf || !formData.birth_date || !formData.phone || !formData.email || !formData.mother_name || !formData.workplace_name || !formData.workplace_function) {
      toast.error('Preencha todos os campos obrigatórios (*)');
      return;
    }
    setSaving(true);
    if (member) {
      const { id, created_date, updated_date, created_by, ...updateData } = formData;
      // When active member edits, send back to pending
      if (member.status === 'active') {
        updateData.status = 'pending';
      }
      await base44.entities.Member.update(member.id, updateData);
      const updated = await base44.entities.Member.filter({ email: user.email });
      setMember(updated[0]);
      setFormData(updated[0]);
      if (member.status === 'active') {
        toast.info('Cadastro atualizado e enviado para re-aprovação do gestor.');
      } else {
        toast.success('Cadastro atualizado com sucesso!');
      }
    } else {
      const created = await base44.entities.Member.create({ ...formData, status: 'pending' });
      setMember(created);
      setFormData(created);
      toast.success('Cadastro enviado para aprovação!');
      // Notify admins
      try {
        const admins = await base44.entities.User.filter({ role: 'admin' });
        for (const admin of admins) {
          await sendNewRegistrationEmail(admin.email, formData.full_name, formData.email);
        }
      } catch (e) { console.warn('Email error:', e); }
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  const canUploadDocs = member && ['approved', 'documents_pending', 'active', 'pending'].includes(member.status);
  const isActive = member?.status === 'active';
  const isExpired = isActive && member.active_until && isBefore(parseISO(member.active_until), new Date());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cadastro de Associado</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Preencha seus dados para associação à ANPPME</p>
        </div>
        {member && (
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={getStatusColor(member.status) + " border font-medium text-xs"}>
              {getStatusLabel(member.status)}
            </Badge>
            {member.active_until && (
              <Badge variant="outline" className="text-xs font-normal">
                <Calendar className="w-3 h-3 mr-1" />
                {isExpired ? '⚠ Anuidade vencida' : `Anuidade: ${format(parseISO(member.active_until), 'dd/MM/yyyy')}`}
              </Badge>
            )}
            {member.status === 'active' && (
              <>
                <Button variant="outline" size="sm" onClick={() => setShowFicha(true)} className="h-7 text-xs">
                  <Printer className="w-3 h-3 mr-1" />Ficha Cadastral
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowCard(true)} className="h-7 text-xs">
                  <CreditCard className="w-3 h-3 mr-1" />Carteira
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {isActive && (
        <Card className="border-0 shadow-sm bg-blue-50/50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-700">
                <strong>Atenção:</strong> Ao salvar alterações, seu cadastro voltará para análise do gestor e precisará ser re-aprovado.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Registration Form */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6 space-y-8">
          <PersonalInfoSection data={formData} onChange={setFormData} />
          <Separator />
          <WorkInfoSection data={formData} onChange={setFormData} />
          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={saving} className="min-w-[180px]">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {member ? (isActive ? 'Salvar e Enviar para Re-aprovação' : 'Atualizar Cadastro') : 'Enviar Cadastro'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Document Upload */}
      {canUploadDocs && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              Documentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DocumentUploadSection memberId={member.id} memberStatus={member.status} member={member} />
          </CardContent>
        </Card>
      )}

      {/* Chat com a ANPPME */}
      {member && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              Fale com a ANPPME
            </CardTitle>
            <p className="text-xs text-muted-foreground">Envie dúvidas, documentos ou solicitações diretamente para nossa equipe.</p>
          </CardHeader>
          <CardContent>
            <MemberChat member={member} user={user} />
          </CardContent>
        </Card>
      )}

      {member && member.status === 'pending' && (
        <Card className="border-0 shadow-sm bg-amber-50/50">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm text-amber-900">Cadastro em análise</p>
                <p className="text-xs text-amber-700 mt-0.5">Seu cadastro está aguardando aprovação do gestor.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {member && member.status === 'rejected' && member.admin_notes && (
        <Card className="border-0 shadow-sm bg-red-50/50">
          <CardContent className="p-5">
            <p className="font-medium text-sm text-red-900">Motivo da rejeição:</p>
            <p className="text-xs text-red-700 mt-1">{member.admin_notes}</p>
          </CardContent>
        </Card>
      )}
      {showFicha && member && <MemberFichaModal member={member} onClose={() => setShowFicha(false)} />}
      {showCard && member && <MemberCardModal member={member} onClose={() => setShowCard(false)} />}
    </div>
  );
}
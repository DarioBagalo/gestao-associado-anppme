import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  CheckCircle2, XCircle, FileText, Loader2, ExternalLink,
  ImageIcon, PenLine, Briefcase, CreditCard, File, AlertCircle,
  Download, Eye, RotateCcw
} from 'lucide-react';
import { format } from 'date-fns';

const DOC_TYPE_CONFIG = {
  photo: { label: 'Foto 3x4', icon: ImageIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
  signature: { label: 'Assinatura', icon: PenLine, color: 'text-violet-600', bg: 'bg-violet-50' },
  work_proof: { label: 'Comprovante de Trabalho', icon: Briefcase, color: 'text-amber-600', bg: 'bg-amber-50' },
  id_document: { label: 'Documento de Identidade', icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  other: { label: 'Outro Documento', icon: File, color: 'text-gray-600', bg: 'bg-gray-50' },
};

const STATUS_CONFIG = {
  pending: { label: 'Pendente', class: 'bg-amber-100 text-amber-700 border-amber-200' },
  approved: { label: 'Aprovado', class: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Pendente de Correção', class: 'bg-red-100 text-red-700 border-red-200' },
};

function DocumentCard({ doc, member, onRefresh }) {
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState(doc.admin_notes || '');
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);

  const config = DOC_TYPE_CONFIG[doc.type] || DOC_TYPE_CONFIG.other;
  const Icon = config.icon;
  const isImage = doc.file_url && /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(doc.file_url);
  const isImageType = doc.type === 'photo' || doc.type === 'signature';

  const updateStatus = async (status) => {
    setSaving(true);
    await base44.entities.Document.update(doc.id, { status, admin_notes: notes });

    // Notify member if requesting correction
    if (status === 'rejected') {
      const docLabel = config.label;
      const reason = notes ? `\n\nMotivo: ${notes}` : '';
      await base44.integrations.Core.SendEmail({
        to: member.email,
        subject: `ANPPME – Correção necessária: ${docLabel}`,
        body: `<p>Olá, <strong>${member.full_name}</strong>!</p>
<p>O documento <strong>${docLabel}</strong> (${doc.title || ''}) precisa ser corrigido ou reenviado.${reason}</p>
<p>Acesse o portal para reenviar o arquivo atualizado.</p>
<br><p>Atenciosamente,<br><strong>Equipe ANPPME</strong></p>`,
      });
      // In-app notification
      await base44.entities.Notification.create({
        member_id: member.id,
        user_email: member.email,
        type: 'document_pending',
        title: `Documento precisa de correção: ${docLabel}`,
        message: notes
          ? `Seu documento "${docLabel}" precisa ser corrigido. Motivo: ${notes}`
          : `Seu documento "${docLabel}" precisa ser reenviado. Acesse seu cadastro para atualizar.`,
        read: false,
        link: '/meu-cadastro',
      });
      toast.success('Documento marcado e associado notificado.');
    } else {
      toast.success(status === 'approved' ? 'Documento aprovado!' : 'Status atualizado.');
    }

    setShowNotes(false);
    setSaving(false);
    onRefresh();
  };

  const saveNotes = async () => {
    setSaving(true);
    await base44.entities.Document.update(doc.id, { admin_notes: notes });
    toast.success('Observação salva.');
    setSaving(false);
    onRefresh();
  };

  return (
    <div className={`rounded-xl border text-sm overflow-hidden transition-all ${
      doc.status === 'approved' ? 'border-emerald-200 bg-emerald-50/20' :
      doc.status === 'rejected' ? 'border-red-200 bg-red-50/20' :
      'border-amber-200 bg-amber-50/20'
    }`}>
      {/* Header */}
      <div className="flex items-center gap-3 p-3">
        {/* Thumbnail or Icon */}
        <div className={`w-12 h-12 rounded-lg ${config.bg} flex items-center justify-center shrink-0 overflow-hidden border`}>
          {(isImage || isImageType) && doc.file_url ? (
            <img src={doc.file_url} alt="" className="w-12 h-12 object-cover" />
          ) : (
            <Icon className={`w-5 h-5 ${config.color}`} />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-xs truncate">{doc.title || config.label}</span>
            <Badge className={`text-[10px] border shrink-0 ${STATUS_CONFIG[doc.status]?.class}`}>
              {STATUS_CONFIG[doc.status]?.label}
            </Badge>
          </div>
          <span className="text-[11px] text-muted-foreground">{config.label}</span>
          {doc.created_date && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Enviado em {format(new Date(doc.created_date), 'dd/MM/yyyy HH:mm')}
            </p>
          )}
          {doc.admin_notes && (
            <p className="text-[10px] text-red-600 mt-0.5 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              {doc.admin_notes}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {(isImage || isImageType) && doc.file_url && (
            <Button variant="ghost" size="icon" className="h-7 w-7" title="Pré-visualizar" onClick={() => setPreview(v => !v)}>
              <Eye className="w-3.5 h-3.5" />
            </Button>
          )}
          <a href={doc.file_url} target="_blank" rel="noopener noreferrer" title="Abrir em nova aba">
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </a>
          <a href={doc.file_url} download title="Baixar arquivo">
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Download className="w-3.5 h-3.5" />
            </Button>
          </a>
        </div>
      </div>

      {/* Image Preview */}
      {preview && doc.file_url && (
        <div className="px-3 pb-3">
          <img src={doc.file_url} alt={doc.title} className="w-full max-h-48 object-contain rounded-lg border bg-white" />
        </div>
      )}

      {/* Notes field for rejection */}
      {showNotes && (
        <div className="px-3 pb-3 space-y-2 border-t pt-3">
          <Textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Descreva o que precisa ser corrigido ou reenviado..."
            className="h-16 text-xs resize-none"
          />
          <div className="flex gap-2">
            <Button size="sm" className="h-7 text-xs bg-red-600 hover:bg-red-700 text-white"
              onClick={() => updateStatus('rejected')} disabled={saving}>
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
              Solicitar correção e notificar
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowNotes(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Bottom action bar */}
      {!showNotes && (
        <div className="border-t flex divide-x">
          {doc.status !== 'approved' && (
            <button
              onClick={() => updateStatus('approved')}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50 transition-colors">
              <CheckCircle2 className="w-3.5 h-3.5" /> Aprovar
            </button>
          )}
          {doc.status === 'approved' && (
            <button
              onClick={() => updateStatus('pending')}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-medium text-amber-700 hover:bg-amber-50 transition-colors">
              <RotateCcw className="w-3.5 h-3.5" /> Desfazer aprovação
            </button>
          )}
          <button
            onClick={() => setShowNotes(true)}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-medium text-red-700 hover:bg-red-50 transition-colors">
            <XCircle className="w-3.5 h-3.5" /> Solicitar correção
          </button>
          {doc.admin_notes && (
            <button
              onClick={saveNotes}
              disabled={saving}
              className="flex items-center justify-center gap-1 px-3 py-1.5 text-[11px] font-medium text-muted-foreground hover:bg-muted transition-colors">
              Salvar obs.
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function DocumentsPanel({ documents, member, loadingDocs, onRefresh }) {
  const pending = documents.filter(d => d.status === 'pending').length;
  const rejected = documents.filter(d => d.status === 'rejected').length;
  const approved = documents.filter(d => d.status === 'approved').length;

  const approveAll = async () => {
    for (const doc of documents.filter(d => d.status === 'pending')) {
      await base44.entities.Document.update(doc.id, { status: 'approved' });
    }
    onRefresh();
    toast.success('Todos os documentos pendentes aprovados!');
  };

  if (loadingDocs) return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />;
  if (documents.length === 0) return <p className="text-xs text-muted-foreground">Nenhum documento enviado.</p>;

  return (
    <div className="space-y-3">
      {/* Summary bar */}
      <div className="flex items-center gap-3 text-xs flex-wrap">
        <span className="text-muted-foreground">{documents.length} arquivo{documents.length !== 1 ? 's' : ''}</span>
        {approved > 0 && <span className="text-emerald-700 font-medium">{approved} aprovado{approved !== 1 ? 's' : ''}</span>}
        {pending > 0 && <span className="text-amber-700 font-medium">{pending} pendente{pending !== 1 ? 's' : ''}</span>}
        {rejected > 0 && <span className="text-red-700 font-medium">{rejected} p/ correção</span>}
        {pending > 0 && (
          <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 text-emerald-700 border-emerald-200 hover:bg-emerald-50 ml-auto"
            onClick={approveAll}>
            <CheckCircle2 className="w-3 h-3 mr-1" /> Aprovar todos pendentes
          </Button>
        )}
      </div>

      {/* Document cards */}
      <div className="space-y-2">
        {documents.map(doc => (
          <DocumentCard key={doc.id} doc={doc} member={member} onRefresh={onRefresh} />
        ))}
      </div>
    </div>
  );
}
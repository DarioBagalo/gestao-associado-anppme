import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Upload, FileText, Loader2, Trash2, CheckCircle2, Clock, XCircle, Eye, RefreshCw, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const DOC_TYPES = [
  { value: 'photo',      label: 'Foto 3x4' },
  { value: 'signature',  label: 'Assinatura (imagem PNG/JPG)' },
  { value: 'work_proof', label: 'Comprovante de Trabalho' },
  { value: 'id_document',label: 'Documento de Identidade' },
  { value: 'other',      label: 'Outro Documento' },
];

export default function DocumentUploadSection({ memberId, member }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const [reuploadingId, setReuploadingId] = useState(null);
  const [docType, setDocType]     = useState('work_proof');
  const [docTitle, setDocTitle]   = useState('');
  const reuploadInputRef = useRef({});

  useEffect(() => { loadDocuments(); }, [memberId]);

  const loadDocuments = async () => {
    const docs = await base44.entities.Document.filter({ member_id: memberId });
    setDocuments(docs);
    setLoading(false);
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);

    const { file_url } = await base44.integrations.Core.UploadFile({ file });

    // Create document record
    await base44.entities.Document.create({
      member_id: memberId,
      type: docType,
      title: docTitle || DOC_TYPES.find(d => d.value === docType)?.label || 'Documento',
      file_url,
      status: 'pending',
    });

    // Sync photo_url / signature_url directly on Member so the card uses them immediately
    if (docType === 'photo') {
      await base44.entities.Member.update(memberId, { photo_url: file_url });
      toast.success('Foto enviada e atualizada na carteira!');
    } else if (docType === 'signature') {
      await base44.entities.Member.update(memberId, { signature_url: file_url });
      toast.success('Assinatura enviada e atualizada na carteira!');
    } else {
      toast.success('Documento enviado com sucesso!');
    }

    setDocTitle('');
    await loadDocuments();
    setUploading(false);
    e.target.value = '';
  };

  const handleDelete = async (docId) => {
    await base44.entities.Document.delete(docId);
    toast.success('Documento removido.');
    loadDocuments();
  };

  const handleReupload = async (e, doc) => {
    const file = e.target.files[0];
    if (!file) return;
    setReuploadingId(doc.id);

    const { file_url } = await base44.integrations.Core.UploadFile({ file });

    await base44.entities.Document.update(doc.id, {
      file_url,
      status: 'pending',
      admin_notes: '',
    });

    // Sync photo/signature on member
    if (doc.type === 'photo') await base44.entities.Member.update(memberId, { photo_url: file_url });
    if (doc.type === 'signature') await base44.entities.Member.update(memberId, { signature_url: file_url });

    // Notify admins
    try {
      const admins = await base44.entities.User.filter({ role: 'admin' });
      const memberName = member?.full_name || 'Associado';
      for (const admin of admins) {
        await base44.entities.Notification.create({
          member_id: memberId,
          user_email: admin.email,
          type: 'document_pending',
          title: 'Documento reenviado para análise',
          message: `${memberName} reenviou o documento "${doc.title}" que estava rejeitado. Verifique os documentos pendentes.`,
          read: false,
          link: '/admin',
        });
      }
    } catch (e) { console.warn('Notify error:', e); }

    toast.success('Documento reenviado! O gestor será notificado.');
    await loadDocuments();
    setReuploadingId(null);
    e.target.value = '';
  };

  const statusIcon  = { pending: <Clock className="w-3.5 h-3.5" />, approved: <CheckCircle2 className="w-3.5 h-3.5" />, rejected: <XCircle className="w-3.5 h-3.5" /> };
  const statusColor = { pending: 'bg-amber-100 text-amber-700 border-amber-200', approved: 'bg-emerald-100 text-emerald-700 border-emerald-200', rejected: 'bg-red-100 text-red-700 border-red-200' };
  const statusText  = { pending: 'Em Análise', approved: 'Aprovado', rejected: 'Rejeitado' };

  return (
    <div className="space-y-5">
      <div className="p-4 rounded-lg bg-muted/50 space-y-3">
        <p className="text-xs text-muted-foreground font-medium">
          Envie a <strong>Foto 3x4</strong> e a <strong>Assinatura</strong> para que apareçam na sua carteira de associado.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Tipo do Documento</Label>
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {DOC_TYPES.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Descrição (opcional)</Label>
            <Input value={docTitle} onChange={(e) => setDocTitle(e.target.value)} placeholder="Ex: Portaria nº 123/2024" className="text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Arquivo</Label>
            <div className="relative">
              <Input type="file" accept="image/*,.pdf,.doc,.docx" onChange={handleUpload} disabled={uploading} className="text-sm" />
              {uploading && <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-md"><Loader2 className="w-4 h-4 animate-spin text-primary" /></div>}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : documents.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Nenhum documento enviado ainda.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map(doc => (
            <div key={doc.id} className="rounded-lg border bg-card overflow-hidden">
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {(doc.type === 'photo' || doc.type === 'signature') && doc.file_url
                    ? <img src={doc.file_url} alt={doc.title} className="w-8 h-8 object-cover rounded border shrink-0" />
                    : <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                  }
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{doc.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {DOC_TYPES.find(d => d.value === doc.type)?.label}
                      {doc.created_date && (
                        <span className="ml-2 text-[10px]">
                          {format(new Date(doc.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                  <Badge className={statusColor[doc.status] + " border text-xs gap-1"}>
                    {statusIcon[doc.status]}{statusText[doc.status]}
                  </Badge>
                  {doc.status === 'rejected' && (
                    <>
                      <input
                        type="file"
                        accept="image/*,.pdf,.doc,.docx"
                        className="hidden"
                        ref={el => reuploadInputRef.current[doc.id] = el}
                        onChange={(e) => handleReupload(e, doc)}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs text-amber-700 border-amber-300 hover:bg-amber-50"
                        disabled={reuploadingId === doc.id}
                        onClick={() => reuploadInputRef.current[doc.id]?.click()}
                      >
                        {reuploadingId === doc.id
                          ? <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          : <RefreshCw className="w-3 h-3 mr-1" />}
                        Reenviar
                      </Button>
                    </>
                  )}
                  {doc.status !== 'approved' && doc.status !== 'rejected' && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(doc.id)}>
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  )}
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="w-3.5 h-3.5" /></Button>
                  </a>
                </div>
              </div>
              {doc.status === 'rejected' && doc.admin_notes && (
                <div className="mx-3 mb-3 px-3 py-2 rounded-md bg-red-50 border border-red-200 flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-red-700">Motivo da rejeição:</p>
                    <p className="text-xs text-red-600 mt-0.5">{doc.admin_notes}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
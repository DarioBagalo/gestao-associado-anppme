import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Upload, Loader2, Award } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const EMPTY_SIG = { signer_name: '', signer_role: '', signature_url: '', enabled: true };

export default function CertificateConfigTab({ form, setForm }) {
  const [uploadingField, setUploadingField] = React.useState(null);

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const signatures = form.signatures || [];

  const addSignature = () => {
    if (signatures.length >= 5) { toast.error('Máximo de 5 assinaturas.'); return; }
    f('signatures', [...signatures, { ...EMPTY_SIG }]);
  };

  const removeSignature = (i) => {
    f('signatures', signatures.filter((_, idx) => idx !== i));
  };

  const updateSignature = (i, key, value) => {
    const updated = signatures.map((s, idx) => idx === i ? { ...s, [key]: value } : s);
    f('signatures', updated);
  };

  const handleFileUpload = async (field, file) => {
    if (!file) return;
    setUploadingField(field);
    const result = await base44.integrations.Core.UploadFile({ file });
    if (field.startsWith('sig_')) {
      const idx = parseInt(field.split('_')[1]);
      updateSignature(idx, 'signature_url', result.file_url);
    } else {
      f(field, result.file_url);
    }
    setUploadingField(null);
    toast.success('Arquivo enviado!');
  };

  return (
    <div className="space-y-6">
      {/* Templates */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Award className="w-4 h-4 text-primary" /> Arte do Certificado
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs">Frente (imagem ou PDF)</Label>
            {form.certificate_template_front_url && (
              <img src={form.certificate_template_front_url} alt="Frente" className="w-full h-28 object-cover rounded-md border" />
            )}
            <div className="flex gap-2">
              <Input
                value={form.certificate_template_front_url || ''}
                onChange={e => f('certificate_template_front_url', e.target.value)}
                placeholder="URL da arte da frente..."
                className="text-xs"
              />
              <label className="cursor-pointer">
                <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => handleFileUpload('certificate_template_front_url', e.target.files[0])} />
                <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0" disabled={uploadingField === 'certificate_template_front_url'}>
                  {uploadingField === 'certificate_template_front_url' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                </Button>
              </label>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Verso (imagem ou PDF)</Label>
            {form.certificate_template_back_url && (
              <img src={form.certificate_template_back_url} alt="Verso" className="w-full h-28 object-cover rounded-md border" />
            )}
            <div className="flex gap-2">
              <Input
                value={form.certificate_template_back_url || ''}
                onChange={e => f('certificate_template_back_url', e.target.value)}
                placeholder="URL da arte do verso..."
                className="text-xs"
              />
              <label className="cursor-pointer">
                <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => handleFileUpload('certificate_template_back_url', e.target.files[0])} />
                <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0" disabled={uploadingField === 'certificate_template_back_url'}>
                  {uploadingField === 'certificate_template_back_url' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                </Button>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Certificate text fields */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Textos do Certificado</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs">Nome do Evento no Certificado</Label>
            <Input
              value={form.certificate_event_label || ''}
              onChange={e => f('certificate_event_label', e.target.value)}
              placeholder="Ex: LICITAÇÕES E CONTRATOS COM USO DE INTELIGÊNCIA ARTIFICIAL..."
            />
            <p className="text-[11px] text-muted-foreground">Texto que aparecerá em destaque no certificado (pode ser diferente do título).</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Cidade / Local</Label>
            <Input
              value={form.certificate_city || ''}
              onChange={e => f('certificate_city', e.target.value)}
              placeholder="Ex: Ji-Paraná-RO"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Data no Certificado</Label>
            <Input
              value={form.certificate_issue_date_label || ''}
              onChange={e => f('certificate_issue_date_label', e.target.value)}
              placeholder="Ex: 15 de abril de 2026"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Carga Horária (horas)</Label>
            <Input
              type="number"
              value={form.workload_hours || ''}
              onChange={e => f('workload_hours', +e.target.value)}
              placeholder="Ex: 24"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Texto de Participação</Label>
            <Input
              value={form.certificate_participation_label || ''}
              onChange={e => f('certificate_participation_label', e.target.value)}
              placeholder="Ex: pela participação no Curso"
            />
          </div>
        </div>
      </div>

      {/* Signatures */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Assinaturas ({signatures.filter(s => s.enabled).length} ativa{signatures.filter(s => s.enabled).length !== 1 ? 's' : ''})</h3>
          {signatures.length < 5 && (
            <Button type="button" variant="outline" size="sm" onClick={addSignature} className="text-xs h-7">
              <Plus className="w-3 h-3 mr-1" /> Adicionar Assinatura
            </Button>
          )}
        </div>

        {signatures.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4 border border-dashed rounded-lg">
            Nenhuma assinatura configurada. Adicione até 5 assinaturas.
          </p>
        )}

        <div className="space-y-3">
          {signatures.map((sig, i) => (
            <div key={i} className={`border rounded-lg p-3 space-y-3 transition-colors ${sig.enabled ? 'border-border bg-card' : 'border-dashed border-muted bg-muted/30'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="text-[10px] bg-primary/10 text-primary border-0">Ass. {i + 1}</Badge>
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sig.enabled}
                      onChange={e => updateSignature(i, 'enabled', e.target.checked)}
                      className="w-3.5 h-3.5"
                    />
                    Habilitada
                  </label>
                </div>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeSignature(i)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>

              {sig.enabled && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Nome Completo</Label>
                    <Input
                      value={sig.signer_name}
                      onChange={e => updateSignature(i, 'signer_name', e.target.value)}
                      placeholder="Ex: Fernandes Lucas da Costa"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Função/Cargo</Label>
                    <Input
                      value={sig.signer_role}
                      onChange={e => updateSignature(i, 'signer_role', e.target.value)}
                      placeholder="Ex: Presidente ANPPME"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Assinatura (PNG sem fundo)</Label>
                    <div className="flex items-center gap-2">
                      {sig.signature_url && (
                        <img src={sig.signature_url} alt="Assinatura" className="h-10 object-contain border rounded bg-white px-1" />
                      )}
                      <Input
                        value={sig.signature_url || ''}
                        onChange={e => updateSignature(i, 'signature_url', e.target.value)}
                        placeholder="URL da imagem ou envie abaixo..."
                        className="h-8 text-xs"
                      />
                      <label className="cursor-pointer shrink-0">
                        <input type="file" accept="image/png,image/webp" className="hidden" onChange={e => handleFileUpload(`sig_${i}`, e.target.files[0])} />
                        <Button type="button" variant="outline" size="icon" className="h-8 w-8" disabled={uploadingField === `sig_${i}`}>
                          {uploadingField === `sig_${i}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                        </Button>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {signatures.length > 0 && (
          <p className="text-[11px] text-muted-foreground mt-2">
            As assinaturas habilitadas serão centralizadas automaticamente na área de assinaturas do certificado.
          </p>
        )}
      </div>
    </div>
  );
}
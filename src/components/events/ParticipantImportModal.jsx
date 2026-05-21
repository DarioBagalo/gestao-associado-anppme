import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Upload, Loader2, CheckCircle2, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ParticipantImportModal({ event, open, onClose, onImported }) {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState([]);
  const [result, setResult] = useState(null);

  const handleFileChange = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setResult(null);

    // Preview: read as text for CSV
    if (f.name.endsWith('.csv')) {
      const text = await f.text();
      const lines = text.split('\n').filter(l => l.trim()).slice(0, 6);
      setPreview(lines);
    } else {
      setPreview([`Arquivo: ${f.name} (Excel - será processado no servidor)`]);
    }
  };

  const handleImport = async () => {
    if (!file) { toast.error('Selecione um arquivo.'); return; }
    setImporting(true);

    // Upload file first
    const uploadResult = await base44.integrations.Core.UploadFile({ file });

    // Extract data using AI extraction
    const extracted = await base44.integrations.Core.ExtractDataFromUploadedFile({
      file_url: uploadResult.file_url,
      json_schema: {
        type: "object",
        properties: {
          participants: {
            type: "array",
            items: {
              type: "object",
              properties: {
                full_name: { type: "string" },
                cpf: { type: "string" }
              },
              required: ["full_name"]
            }
          }
        }
      }
    });

    if (extracted.status !== 'success' || !extracted.output?.participants) {
      toast.error('Erro ao processar arquivo. Verifique o formato.');
      setImporting(false);
      return;
    }

    const participants = extracted.output.participants;
    let created = 0;
    let skipped = 0;

    for (const p of participants) {
      if (!p.full_name?.trim()) continue;

      // Check if already registered
      const existing = await base44.entities.EventRegistration.filter({
        event_id: event.id,
        member_name: p.full_name.trim()
      });

      if (existing.length > 0) { skipped++; continue; }

      await base44.entities.EventRegistration.create({
        event_id: event.id,
        event_title: event.title,
        member_id: `imported_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        member_name: p.full_name.trim(),
        member_email: '',
        member_cpf: p.cpf || '',
        status: 'confirmed',
        attended: false,
        imported_from_excel: true
      });
      created++;
    }

    setResult({ created, skipped, total: participants.length });
    setImporting(false);
    toast.success(`${created} participante(s) importado(s)!`);
    if (onImported) onImported();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            Importar Participantes — {event?.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium">Selecione o arquivo Excel ou CSV</p>
            <p className="text-xs text-muted-foreground mt-1">
              Colunas aceitas: <strong>NOME COMPLETO</strong> ou <strong>NOME COMPLETO + CPF</strong>
            </p>
            <label className="cursor-pointer mt-3 inline-block">
              <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileChange} />
              <Button type="button" variant="outline" size="sm" className="mt-2">
                {file ? `📄 ${file.name}` : 'Escolher arquivo'}
              </Button>
            </label>
          </div>

          {preview.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs font-medium mb-2 text-muted-foreground">Pré-visualização:</p>
              {preview.map((line, i) => (
                <p key={i} className="text-xs font-mono text-foreground leading-5">{line}</p>
              ))}
            </div>
          )}

          {result && (
            <div className="rounded-lg border p-3 space-y-1">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                <CheckCircle2 className="w-4 h-4" /> Importação concluída
              </div>
              <div className="flex gap-3 mt-2">
                <Badge className="bg-emerald-100 text-emerald-800 border-0">{result.created} importados</Badge>
                {result.skipped > 0 && <Badge className="bg-amber-100 text-amber-800 border-0">{result.skipped} já existiam</Badge>}
                <Badge className="bg-gray-100 text-gray-600 border-0">{result.total} no arquivo</Badge>
              </div>
            </div>
          )}

          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-blue-50 rounded-lg p-3">
            <AlertCircle className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
            <p>Participantes importados sem e-mail não receberão notificação automática. Após a confirmação de presença, os certificados poderão ser gerados manualmente.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={importing}>Fechar</Button>
          <Button onClick={handleImport} disabled={importing || !file || !!result}>
            {importing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Importar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
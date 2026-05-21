import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2, BookOpen } from 'lucide-react';

const EMPTY = { title: '', description: '', content_type: 'documento', file_url: '', thumbnail_url: '', category: '', is_published: true, member_types_allowed: [], order_index: 0 };
const TYPE_LABELS = { documento: 'Documento', artigo: 'Artigo', video: 'Vídeo', link: 'Link', outro: 'Outro' };

export default function LibraryAdmin() {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const all = await base44.entities.Content.list('order_index', 200);
    setContents(all);
    setLoading(false);
  }

  const openNew = () => { setEditing(null); setForm(EMPTY); setShowForm(true); };
  const openEdit = (c) => { setEditing(c); setForm({ ...c }); setShowForm(true); };

  const handleSave = async () => {
    if (!form.title) { toast.error('Título é obrigatório.'); return; }
    setSaving(true);
    if (editing) { await base44.entities.Content.update(editing.id, form); toast.success('Conteúdo atualizado!'); }
    else { await base44.entities.Content.create(form); toast.success('Conteúdo criado!'); }
    setSaving(false);
    setShowForm(false);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Excluir este conteúdo?')) return;
    await base44.entities.Content.delete(id);
    load();
  };

  const togglePublish = async (c) => {
    await base44.entities.Content.update(c.id, { is_published: !c.is_published });
    setContents(prev => prev.map(x => x.id === c.id ? { ...x, is_published: !x.is_published } : x));
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestão da Biblioteca</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Conteúdo exclusivo para associados</p>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Novo Conteúdo</Button>
      </div>

      {loading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        : contents.length === 0
          ? <Card className="border-0 shadow-sm"><CardContent className="p-10 text-center text-muted-foreground text-sm">Nenhum conteúdo cadastrado.</CardContent></Card>
          : <div className="space-y-2">
            {contents.map(c => (
              <Card key={c.id} className="border-0 shadow-sm">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{c.title}</span>
                      <Badge className="text-[10px] border-0 bg-gray-100 text-gray-600">{TYPE_LABELS[c.content_type]}</Badge>
                      {c.category && <Badge className="text-[10px] border-0 bg-blue-50 text-blue-600">{c.category}</Badge>}
                      {c.is_published ? <Badge className="text-[10px] border-0 bg-emerald-100 text-emerald-700">Publicado</Badge> : <Badge className="text-[10px] border-0 bg-gray-100 text-gray-500">Oculto</Badge>}
                    </div>
                    {c.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{c.description}</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => togglePublish(c)}>{c.is_published ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}</Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(c.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
      }

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Editar Conteúdo' : 'Novo Conteúdo'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Título *</Label>
              <Input value={form.title} onChange={e => f('title', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Tipo</Label>
                <Select value={form.content_type} onValueChange={v => f('content_type', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Categoria</Label>
                <Input value={form.category} onChange={e => f('category', e.target.value)} placeholder="Ex: Legislação" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Descrição</Label>
              <Textarea value={form.description} onChange={e => f('description', e.target.value)} className="h-16 resize-none" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">URL do Arquivo / Link</Label>
              <Input value={form.file_url} onChange={e => f('file_url', e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">URL da Miniatura</Label>
              <Input value={form.thumbnail_url} onChange={e => f('thumbnail_url', e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Ordem de Exibição</Label>
              <Input type="number" value={form.order_index} onChange={e => f('order_index', +e.target.value)} />
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" checked={!!form.is_published} onChange={e => f('is_published', e.target.checked)} className="w-4 h-4" />
              Publicado
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
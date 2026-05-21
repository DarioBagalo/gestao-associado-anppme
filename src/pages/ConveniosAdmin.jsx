import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Eye, EyeOff, Star, Building2, Loader2, GripVertical } from 'lucide-react';

const EMPTY = {
  name: '', logo_url: '', description: '', benefits: '', address: '',
  city: '', state: '', contact_phone: '', contact_email: '',
  whatsapp_number: '', website_url: '', social_media_url: '',
  category: '', discount_info: '', is_visible: true, is_featured: false, order_index: 0,
};

export default function ConveniosAdmin() {
  const [convenios, setConvenios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const all = await base44.entities.Convenio.list('order_index', 200);
    setConvenios(all);
    setLoading(false);
  };

  const openNew = () => { setForm({ ...EMPTY, order_index: convenios.length }); setEditing('new'); };
  const openEdit = (c) => { setForm({ ...EMPTY, ...c }); setEditing(c.id); };
  const closeModal = () => { setEditing(null); setForm(EMPTY); };

  const handleSave = async () => {
    if (!form.name || !form.description) { toast.error('Nome e descrição são obrigatórios.'); return; }
    setSaving(true);
    if (editing === 'new') {
      await base44.entities.Convenio.create(form);
      toast.success('Convênio criado!');
    } else {
      await base44.entities.Convenio.update(editing, form);
      toast.success('Convênio atualizado!');
    }
    await load();
    closeModal();
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Excluir este convênio?')) return;
    await base44.entities.Convenio.delete(id);
    toast.success('Convênio excluído.');
    load();
  };

  const toggleVisible = async (c) => {
    await base44.entities.Convenio.update(c.id, { is_visible: !c.is_visible });
    load();
  };

  const toggleFeatured = async (c) => {
    await base44.entities.Convenio.update(c.id, { is_featured: !c.is_featured });
    load();
  };

  const f = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestão de Convênios</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gerencie as parcerias e convênios da ANPPME</p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="w-4 h-4" /> Novo Convênio
        </Button>
      </div>

      <Card className="border-0 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : convenios.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhum convênio cadastrado ainda.</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={openNew}>Adicionar primeiro convênio</Button>
            </div>
          ) : (
            <div className="divide-y">
              {convenios.map(c => (
                <div key={c.id} className="flex items-center gap-3 p-4 hover:bg-muted/30">
                  <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                  {c.logo_url
                    ? <img src={c.logo_url} alt={c.name} className="w-10 h-10 object-contain rounded border bg-white p-0.5 shrink-0" />
                    : <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center shrink-0"><Building2 className="w-5 h-5 text-primary" /></div>
                  }
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{c.name}</p>
                      {c.is_featured && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />}
                      {!c.is_visible && <Badge variant="outline" className="text-[10px] shrink-0">Oculto</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{c.category || 'Sem categoria'} · {c.city || 'Sem cidade'}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" title={c.is_featured ? 'Remover destaque' : 'Destacar'} onClick={() => toggleFeatured(c)}>
                      <Star className={`w-4 h-4 ${c.is_featured ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground'}`} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" title={c.is_visible ? 'Ocultar' : 'Mostrar'} onClick={() => toggleVisible(c)}>
                      {c.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(c.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <Dialog open={!!editing} onOpenChange={closeModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing === 'new' ? 'Novo Convênio' : 'Editar Convênio'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <div className="md:col-span-2 space-y-1.5">
              <Label className="text-xs">Nome *</Label>
              <Input value={form.name} onChange={e => f('name', e.target.value)} placeholder="Nome da empresa/parceiro" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Categoria</Label>
              <Input value={form.category} onChange={e => f('category', e.target.value)} placeholder="Ex: Saúde, Educação..." />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Informação de Desconto</Label>
              <Input value={form.discount_info} onChange={e => f('discount_info', e.target.value)} placeholder="Ex: 10% de desconto" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">URL do Logotipo</Label>
              <Input value={form.logo_url} onChange={e => f('logo_url', e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Endereço</Label>
              <Input value={form.address} onChange={e => f('address', e.target.value)} placeholder="Endereço completo" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Cidade</Label>
              <Input value={form.city} onChange={e => f('city', e.target.value)} placeholder="Cidade" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Estado (UF)</Label>
              <Input value={form.state} onChange={e => f('state', e.target.value)} placeholder="RO" maxLength={2} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Telefone</Label>
              <Input value={form.contact_phone} onChange={e => f('contact_phone', e.target.value)} placeholder="(69) 99999-9999" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">E-mail</Label>
              <Input value={form.contact_email} onChange={e => f('contact_email', e.target.value)} placeholder="contato@empresa.com.br" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">WhatsApp (apenas dígitos)</Label>
              <Input value={form.whatsapp_number} onChange={e => f('whatsapp_number', e.target.value)} placeholder="69999124124" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Site</Label>
              <Input value={form.website_url} onChange={e => f('website_url', e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Rede Social</Label>
              <Input value={form.social_media_url} onChange={e => f('social_media_url', e.target.value)} placeholder="https://instagram.com/..." />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Ordem de Exibição</Label>
              <Input type="number" value={form.order_index} onChange={e => f('order_index', parseInt(e.target.value) || 0)} />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label className="text-xs">Descrição *</Label>
              <Textarea value={form.description} onChange={e => f('description', e.target.value)} placeholder="Descrição do convênio..." className="h-20 resize-none" />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label className="text-xs">Benefícios para Associados</Label>
              <Textarea value={form.benefits} onChange={e => f('benefits', e.target.value)} placeholder="Liste os benefícios para os associados..." className="h-24 resize-none" />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_visible} onCheckedChange={v => f('is_visible', v)} />
              <Label className="text-sm">Visível para associados</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_featured} onCheckedChange={v => f('is_featured', v)} />
              <Label className="text-sm">Destacar convênio</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Star, Eye, EyeOff, Loader2, Users, Calendar, CheckCircle2, Upload, Award, FileSpreadsheet } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import CertificateConfigTab from '@/components/events/CertificateConfigTab';
import ParticipantImportModal from '@/components/events/ParticipantImportModal';
import GenerateCertificatesPanel from '@/components/events/GenerateCertificatesPanel';

const EMPTY = { title: '', description: '', event_type: 'palestra', organizer: '', is_anppme: false, is_featured: false, is_published: false, start_date: '', end_date: '', start_time: '', location: '', city: '', state: '', is_online: false, cover_image_url: '', registration_link: '', max_participants: 0, price: 0, sponsor_name: '', sponsor_logo_url: '', google_calendar_link: '', certificate_template_front_url: '', certificate_template_back_url: '', certificate_event_label: '', certificate_city: '', certificate_issue_date_label: '', certificate_participation_label: '', workload_hours: 0, signatures: [] };
const TYPE_LABELS = { curso: 'Curso', palestra: 'Palestra', workshop: 'Workshop', reuniao: 'Reunião', outro: 'Evento' };

export default function EventsAdmin() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('events');
  const [participants, setParticipants] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [formTab, setFormTab] = useState('info');
  const [certEvent, setCertEvent] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const evs = await base44.entities.Event.list('-created_date', 200);
    setEvents(evs);
    setLoading(false);
  }

  const openNew = () => { setEditing(null); setForm(EMPTY); setFormTab('info'); setShowForm(true); };
  const openEdit = (ev) => { setEditing(ev); setForm({ ...ev, signatures: ev.signatures || [] }); setFormTab('info'); setShowForm(true); };

  const openCertificates = async (ev) => {
    setCertEvent(ev);
    const regs = await base44.entities.EventRegistration.filter({ event_id: ev.id });
    setParticipants(regs);
    setSelectedEvent(ev);
    setTab('certificates');
  };

  const handleSave = async () => {
    if (!form.title || !form.start_date) { toast.error('Título e data são obrigatórios.'); return; }
    setSaving(true);
    if (editing) {
      await base44.entities.Event.update(editing.id, form);
      toast.success('Evento atualizado!');
    } else {
      await base44.entities.Event.create(form);
      toast.success('Evento criado!');
    }
    setSaving(false);
    setShowForm(false);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Excluir este evento?')) return;
    await base44.entities.Event.delete(id);
    toast.success('Evento excluído.');
    load();
  };

  const togglePublish = async (ev) => {
    await base44.entities.Event.update(ev.id, { is_published: !ev.is_published });
    setEvents(prev => prev.map(e => e.id === ev.id ? { ...e, is_published: !e.is_published } : e));
  };

  const toggleFeatured = async (ev) => {
    const featuredCount = events.filter(e => e.is_featured && e.id !== ev.id).length;
    if (!ev.is_featured && featuredCount >= 2) { toast.error('Máximo de 2 eventos em destaque.'); return; }
    await base44.entities.Event.update(ev.id, { is_featured: !ev.is_featured });
    setEvents(prev => prev.map(e => e.id === ev.id ? { ...e, is_featured: !e.is_featured } : e));
  };

  const viewParticipants = async (ev) => {
    setSelectedEvent(ev);
    const regs = await base44.entities.EventRegistration.filter({ event_id: ev.id });
    setParticipants(regs);
    setTab('participants');
  };

  const markAttended = async (reg) => {
    await base44.entities.EventRegistration.update(reg.id, { attended: !reg.attended });
    setParticipants(prev => prev.map(r => r.id === reg.id ? { ...r, attended: !r.attended } : r));
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestão de Eventos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Crie e gerencie eventos para os associados</p>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Novo Evento</Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="events">Todos os Eventos</TabsTrigger>
          {selectedEvent && <TabsTrigger value="participants">Participantes — {selectedEvent.title}</TabsTrigger>}
          {certEvent && <TabsTrigger value="certificates"><Award className="w-3.5 h-3.5 mr-1" />Certificados — {certEvent.title}</TabsTrigger>}
        </TabsList>

        <TabsContent value="events" className="mt-4 space-y-3">
          {loading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            : events.length === 0 ? <Card className="border-0 shadow-sm"><CardContent className="p-10 text-center text-muted-foreground text-sm">Nenhum evento criado ainda.</CardContent></Card>
            : events.map(ev => (
              <Card key={ev.id} className="border-0 shadow-sm">
                <CardContent className="p-4 flex items-center gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{ev.title}</span>
                      <Badge className="text-[10px] border-0 bg-gray-100 text-gray-600">{TYPE_LABELS[ev.event_type]}</Badge>
                      {ev.is_anppme && <Badge className="text-[10px] border-0 bg-primary/10 text-primary">ANPPME</Badge>}
                      {ev.is_featured && <Badge className="text-[10px] border-0 bg-amber-100 text-amber-700">⭐ Destaque</Badge>}
                      {ev.is_published ? <Badge className="text-[10px] border-0 bg-emerald-100 text-emerald-700">Publicado</Badge> : <Badge className="text-[10px] border-0 bg-gray-100 text-gray-500">Rascunho</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      {ev.start_date ? format(parseISO(ev.start_date), "dd/MM/yyyy", { locale: ptBR }) : '---'}
                      {ev.city && <span>· {ev.city}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => viewParticipants(ev)} title="Ver participantes"><Users className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => openCertificates(ev)} title="Certificados"><Award className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleFeatured(ev)} title="Destaque"><Star className={`w-3.5 h-3.5 ${ev.is_featured ? 'text-amber-500' : ''}`} /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => togglePublish(ev)} title="Publicar"><>{ev.is_published ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}</></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(ev)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(ev.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))
          }
        </TabsContent>

        {selectedEvent && (
          <TabsContent value="participants" className="mt-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base">Inscritos — {selectedEvent.title}</CardTitle>
                <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => setShowImport(true)}>
                  <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" /> Importar Excel
                </Button>
              </CardHeader>
              <CardContent>
                {participants.length === 0
                  ? <p className="text-sm text-muted-foreground text-center py-6">Nenhum inscrito ainda.</p>
                  : <div className="divide-y">
                    {participants.map(r => (
                      <div key={r.id} className="flex items-center justify-between py-2.5 text-sm">
                        <div>
                          <p className="font-medium">{r.member_name}</p>
                          <p className="text-xs text-muted-foreground">{r.member_email || 'Sem e-mail'}{r.member_cpf ? ` · ${r.member_cpf}` : ''} · {r.status === 'confirmed' ? 'Confirmado' : r.status === 'waitlist' ? 'Lista de espera' : 'Cancelado'}</p>
                        </div>
                        <Button variant={r.attended ? 'default' : 'outline'} size="sm" className="text-xs h-7" onClick={() => markAttended(r)}>
                          {r.attended ? <><CheckCircle2 className="w-3 h-3 mr-1" />Presente</> : 'Marcar Presença'}
                        </Button>
                      </div>
                    ))}
                  </div>
                }
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {certEvent && (
          <TabsContent value="certificates" className="mt-4">
            <GenerateCertificatesPanel event={certEvent} />
          </TabsContent>
        )}
      </Tabs>

      {/* Import Modal */}
      {selectedEvent && (
        <ParticipantImportModal
          event={selectedEvent}
          open={showImport}
          onClose={() => setShowImport(false)}
          onImported={async () => {
            const regs = await base44.entities.EventRegistration.filter({ event_id: selectedEvent.id });
            setParticipants(regs);
          }}
        />
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Editar Evento' : 'Novo Evento'}</DialogTitle></DialogHeader>
          <Tabs value={formTab} onValueChange={setFormTab} className="w-full">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="info">Informações</TabsTrigger>
              <TabsTrigger value="certificate"><Award className="w-3.5 h-3.5 mr-1" />Certificado</TabsTrigger>
            </TabsList>
            <TabsContent value="certificate" className="pt-4">
              <CertificateConfigTab form={form} setForm={setForm} />
            </TabsContent>
            <TabsContent value="info">
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">Título *</Label>
                <Input value={form.title} onChange={e => f('title', e.target.value)} placeholder="Título do evento" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tipo</Label>
                <Select value={form.event_type} onValueChange={v => f('event_type', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Organizador/Promotor</Label>
                <Input value={form.organizer} onChange={e => f('organizer', e.target.value)} placeholder="Nome do organizador" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Data de Início *</Label>
                <Input type="date" value={form.start_date} onChange={e => f('start_date', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Data de Término</Label>
                <Input type="date" value={form.end_date} onChange={e => f('end_date', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Horário</Label>
                <Input type="time" value={form.start_time} onChange={e => f('start_time', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Local / Link</Label>
                <Input value={form.location} onChange={e => f('location', e.target.value)} placeholder="Local ou link da reunião" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Cidade</Label>
                <Input value={form.city} onChange={e => f('city', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Estado</Label>
                <Input value={form.state} onChange={e => f('state', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Vagas (0 = ilimitado)</Label>
                <Input type="number" value={form.max_participants} onChange={e => f('max_participants', +e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Preço (R$, 0 = gratuito)</Label>
                <Input type="number" value={form.price} onChange={e => f('price', +e.target.value)} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">Descrição</Label>
                <Textarea value={form.description} onChange={e => f('description', e.target.value)} className="h-20 resize-none" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">URL da Imagem de Capa</Label>
                <Input value={form.cover_image_url} onChange={e => f('cover_image_url', e.target.value)} placeholder="https://..." />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">Link Externo de Inscrição (parceiros)</Label>
                <Input value={form.registration_link} onChange={e => f('registration_link', e.target.value)} placeholder="https://..." />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">Link Google Calendar</Label>
                <Input value={form.google_calendar_link} onChange={e => f('google_calendar_link', e.target.value)} placeholder="https://calendar.google.com/..." />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Patrocinador</Label>
                <Input value={form.sponsor_name} onChange={e => f('sponsor_name', e.target.value)} placeholder="Nome do patrocinador" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Logo do Patrocinador (URL)</Label>
                <Input value={form.sponsor_logo_url} onChange={e => f('sponsor_logo_url', e.target.value)} placeholder="https://..." />
              </div>
            </div>
            <div className="flex flex-wrap gap-4 pt-2">
              {[['is_anppme', 'Evento ANPPME'], ['is_featured', '⭐ Destaque'], ['is_published', 'Publicado'], ['is_online', 'Online']].map(([k, label]) => (
                <label key={k} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="checkbox" checked={!!form[k]} onChange={e => f(k, e.target.checked)} className="w-4 h-4" />
                  {label}
                </label>
              ))}
            </div>
          </div>
          </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
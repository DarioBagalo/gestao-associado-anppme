import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Calendar, MapPin, Clock, Search, Star, CheckCircle2, Loader2, ExternalLink, Users } from 'lucide-react';
import { format, parseISO, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const EVENT_TYPE_LABELS = { curso: 'Curso', palestra: 'Palestra', workshop: 'Workshop', reuniao: 'Reunião', outro: 'Evento' };
const EVENT_TYPE_COLORS = { curso: 'bg-blue-100 text-blue-700', palestra: 'bg-violet-100 text-violet-700', workshop: 'bg-amber-100 text-amber-700', reuniao: 'bg-emerald-100 text-emerald-700', outro: 'bg-gray-100 text-gray-700' };

export default function Events() {
  const [user, setUser] = useState(null);
  const [member, setMember] = useState(null);
  const [events, setEvents] = useState([]);
  const [myRegs, setMyRegs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(null);

  useEffect(() => {
    async function load() {
      const u = await base44.auth.me();
      setUser(u);
      const members = await base44.entities.Member.filter({ email: u.email });
      const m = members[0] || null;
      setMember(m);
      const evs = await base44.entities.Event.filter({ is_published: true }, 'start_date', 100);
      setEvents(evs);
      if (m) {
        const regs = await base44.entities.EventRegistration.filter({ member_id: m.id });
        setMyRegs(regs);
      }
      setLoading(false);
    }
    load();
  }, []);

  const isRegistered = (eventId) => myRegs.some(r => r.event_id === eventId && r.status !== 'cancelled');

  const handleRSVP = async (ev) => {
    if (!member) { toast.error('Você precisa ter um cadastro ativo para se inscrever.'); return; }
    if (ev.registration_link) { window.open(ev.registration_link, '_blank'); return; }
    setRegistering(ev.id);
    if (isRegistered(ev.id)) {
      const reg = myRegs.find(r => r.event_id === ev.id && r.status !== 'cancelled');
      await base44.entities.EventRegistration.update(reg.id, { status: 'cancelled' });
      setMyRegs(prev => prev.map(r => r.id === reg.id ? { ...r, status: 'cancelled' } : r));
      toast.success('Inscrição cancelada.');
    } else {
      const reg = await base44.entities.EventRegistration.create({
        event_id: ev.id, event_title: ev.title,
        member_id: member.id, member_name: member.full_name, member_email: member.email,
        status: 'confirmed'
      });
      setMyRegs(prev => [...prev, reg]);
      toast.success('Inscrição confirmada!');
    }
    setRegistering(null);
  };

  const featured = events.filter(e => e.is_featured).slice(0, 2);
  const now = new Date();
  const upcoming = events.filter(e => !isBefore(parseISO(e.start_date), now) && !e.is_featured);
  const past     = events.filter(e => isBefore(parseISO(e.start_date), now));

  const filtered = (list) => list.filter(e => !search || e.title?.toLowerCase().includes(search.toLowerCase()) || e.organizer?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Eventos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Cursos, palestras, workshops e reuniões</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar eventos..." className="pl-9 w-56" />
        </div>
      </div>

      {/* Featured */}
      {featured.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-amber-500" />
            <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Em Destaque</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featured.map(ev => <EventCard key={ev.id} ev={ev} registered={isRegistered(ev.id)} onRSVP={handleRSVP} registering={registering === ev.id} featured />)}
          </div>
        </div>
      )}

      {/* Meus Eventos */}
      {myRegs.filter(r => r.status === 'confirmed').length > 0 && (
        <div>
          <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">Meus Eventos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {myRegs.filter(r => r.status === 'confirmed').map(reg => {
              const ev = events.find(e => e.id === reg.event_id);
              if (!ev) return null;
              return <EventCard key={ev.id} ev={ev} registered onRSVP={handleRSVP} registering={registering === ev.id} />;
            })}
          </div>
        </div>
      )}

      {/* Próximos */}
      {filtered(upcoming).length > 0 && (
        <div>
          <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">Próximos Eventos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered(upcoming).map(ev => <EventCard key={ev.id} ev={ev} registered={isRegistered(ev.id)} onRSVP={handleRSVP} registering={registering === ev.id} />)}
          </div>
        </div>
      )}

      {events.length === 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-muted-foreground">Nenhum evento publicado no momento.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function EventCard({ ev, registered, onRSVP, registering, featured }) {
  const isPast = isBefore(parseISO(ev.start_date), new Date());
  return (
    <Card className={`border-0 shadow-sm overflow-hidden ${featured ? 'ring-2 ring-amber-400' : ''}`}>
      {ev.cover_image_url && (
        <div className="h-32 overflow-hidden">
          <img src={ev.cover_image_url} alt={ev.title} className="w-full h-full object-cover" />
        </div>
      )}
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            <Badge className={EVENT_TYPE_COLORS[ev.event_type] + " text-[10px] border-0"}>{EVENT_TYPE_LABELS[ev.event_type]}</Badge>
            {ev.is_anppme && <Badge className="bg-primary/10 text-primary text-[10px] border-0">ANPPME</Badge>}
            {featured && <Badge className="bg-amber-100 text-amber-700 text-[10px] border-0">⭐ Destaque</Badge>}
          </div>
          {isPast && <Badge className="bg-gray-100 text-gray-500 text-[10px] border-0 shrink-0">Encerrado</Badge>}
        </div>

        <div>
          <h3 className="font-semibold text-sm leading-snug">{ev.title}</h3>
          {ev.organizer && <p className="text-xs text-muted-foreground mt-0.5">{ev.organizer}</p>}
        </div>

        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5"><Calendar className="w-3 h-3" />{format(parseISO(ev.start_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}{ev.start_time ? ` às ${ev.start_time}` : ''}</div>
          {ev.location && <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3" />{ev.is_online ? 'Online' : `${ev.location}${ev.city ? ` — ${ev.city}` : ''}`}</div>}
        </div>

        {ev.sponsor_name && (
          <div className="flex items-center gap-2 pt-1 border-t text-xs text-muted-foreground">
            {ev.sponsor_logo_url && <img src={ev.sponsor_logo_url} alt={ev.sponsor_name} className="h-5 object-contain" />}
            <span>Patrocinado por <strong>{ev.sponsor_name}</strong></span>
          </div>
        )}

        {!isPast && (
          <Button size="sm" className="w-full text-xs" variant={registered ? 'outline' : 'default'}
            onClick={() => onRSVP(ev)} disabled={registering}>
            {registering ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : registered ? <CheckCircle2 className="w-3 h-3 mr-1" /> : null}
            {ev.registration_link ? <><ExternalLink className="w-3 h-3 mr-1" />Inscrever-se</>
              : registered ? 'Cancelar Inscrição' : 'Confirmar Presença'}
          </Button>
        )}
        {ev.google_calendar_link && (
          <a href={ev.google_calendar_link} target="_blank" rel="noreferrer" className="block text-center text-xs text-primary underline-offset-2 hover:underline">
            + Adicionar ao Google Calendar
          </a>
        )}
      </CardContent>
    </Card>
  );
}
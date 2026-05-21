/**
 * Dashboard de Eventos para o Painel Administrativo.
 * Mostra métricas de eventos, inscrições e certificados.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Calendar, Users, Award, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import { format, parseISO, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TYPE_COLORS = { curso: '#3b82f6', palestra: '#8b5cf6', workshop: '#f59e0b', reuniao: '#10b981', outro: '#6b7280' };
const TYPE_LABELS = { curso: 'Curso', palestra: 'Palestra', workshop: 'Workshop', reuniao: 'Reunião', outro: 'Outro' };

export default function EventsDashboard() {
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [evs, regs, certs] = await Promise.all([
        base44.entities.Event.list('-start_date', 200),
        base44.entities.EventRegistration.list('-created_date', 500),
        base44.entities.Certificate.filter({ status: 'generated' }, '-created_date', 500),
      ]);
      setEvents(evs);
      setRegistrations(regs);
      setCertificates(certs);
      setLoading(false);
    }
    load();
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const totalEvents = events.length;
    const upcomingEvents = events.filter(e => e.start_date && !isBefore(parseISO(e.start_date), now)).length;
    const totalRegistrations = registrations.filter(r => r.status === 'confirmed').length;
    const totalAttended = registrations.filter(r => r.attended).length;
    const totalCertificates = certificates.length;
    return { totalEvents, upcomingEvents, totalRegistrations, totalAttended, totalCertificates };
  }, [events, registrations, certificates]);

  const typeChartData = useMemo(() => {
    const counts = {};
    events.forEach(e => {
      const t = e.event_type || 'outro';
      counts[t] = (counts[t] || 0) + 1;
    });
    return Object.entries(counts).map(([type, value]) => ({
      name: TYPE_LABELS[type] || type,
      value,
      fill: TYPE_COLORS[type] || '#6b7280',
    }));
  }, [events]);

  const topEvents = useMemo(() => {
    return events
      .map(ev => ({
        ...ev,
        regCount: registrations.filter(r => r.event_id === ev.id && r.status === 'confirmed').length,
        attendedCount: registrations.filter(r => r.event_id === ev.id && r.attended).length,
        certCount: certificates.filter(c => c.event_id === ev.id).length,
      }))
      .sort((a, b) => b.regCount - a.regCount)
      .slice(0, 8);
  }, [events, registrations, certificates]);

  const recentCerts = useMemo(() => certificates.slice(0, 6), [certificates]);

  if (loading) return <div className="flex items-center justify-center py-12"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const kpiCards = [
    { label: 'Total de Eventos', value: stats.totalEvents, icon: Calendar, color: 'text-primary', bg: 'bg-accent' },
    { label: 'Próximos Eventos', value: stats.upcomingEvents, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Inscrições Ativas', value: stats.totalRegistrations, icon: Users, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Presenças Confirmadas', value: stats.totalAttended, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Certificados Emitidos', value: stats.totalCertificates, icon: Award, color: 'text-violet-600', bg: 'bg-violet-50' },
    {
      label: 'Taxa de Presença',
      value: stats.totalRegistrations > 0 ? `${Math.round((stats.totalAttended / stats.totalRegistrations) * 100)}%` : '—',
      icon: TrendingUp, color: 'text-rose-600', bg: 'bg-rose-50'
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {kpiCards.map(card => (
          <Card key={card.label} className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center shrink-0`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground leading-tight">{card.label}</p>
                <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Eventos por Tipo</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={typeChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {typeChartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip formatter={(v) => [v, 'Eventos']} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Top Eventos por Inscrição</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topEvents.slice(0, 5)} layout="vertical" margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
                <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                <YAxis type="category" dataKey="title" tick={{ fontSize: 9 }} width={90}
                  tickFormatter={v => v?.length > 14 ? v.slice(0, 14) + '…' : v} />
                <Tooltip formatter={(v) => [v, 'Inscritos']} labelFormatter={l => l} />
                <Bar dataKey="regCount" name="Inscritos" fill="#1e3a6e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Events Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Resumo de Eventos</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Evento</th>
                  <th className="text-center px-3 py-2.5 font-medium text-muted-foreground">Data</th>
                  <th className="text-center px-3 py-2.5 font-medium text-muted-foreground">Inscritos</th>
                  <th className="text-center px-3 py-2.5 font-medium text-muted-foreground">Presenças</th>
                  <th className="text-center px-3 py-2.5 font-medium text-muted-foreground">Certificados</th>
                </tr>
              </thead>
              <tbody>
                {topEvents.map(ev => (
                  <tr key={ev.id} className="border-b hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-foreground truncate max-w-[200px]">{ev.title}</p>
                      <p className="text-muted-foreground capitalize">{TYPE_LABELS[ev.event_type] || ev.event_type}</p>
                    </td>
                    <td className="px-3 py-2.5 text-center text-muted-foreground">
                      {ev.start_date ? format(parseISO(ev.start_date), 'dd/MM/yy') : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-center font-semibold text-amber-600">{ev.regCount}</td>
                    <td className="px-3 py-2.5 text-center font-semibold text-emerald-600">{ev.attendedCount}</td>
                    <td className="px-3 py-2.5 text-center font-semibold text-violet-600">{ev.certCount}</td>
                  </tr>
                ))}
                {topEvents.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum evento encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Certificates */}
      {recentCerts.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Certificados Emitidos Recentemente</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {recentCerts.map(cert => (
                <div key={cert.id} className="flex items-center justify-between px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{cert.member_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{cert.event_title}</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-[10px] font-mono text-muted-foreground">{cert.certificate_code}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {cert.issue_date ? format(parseISO(cert.issue_date), 'dd/MM/yyyy') : '—'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
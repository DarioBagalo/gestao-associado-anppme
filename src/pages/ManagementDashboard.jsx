import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Users, TrendingUp, Calendar, AlertTriangle, CheckCircle2, Clock, DollarSign, Loader2, RefreshCw, Award } from 'lucide-react';
import EventsDashboard from '@/components/admin/EventsDashboard';
import { format, addDays, isBefore, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getStatusLabel, getStatusColor } from '@/lib/formatters';

const STATUS_COLORS = {
  active: '#10b981',
  pending: '#f59e0b',
  approved: '#3b82f6',
  documents_pending: '#8b5cf6',
  rejected: '#ef4444',
  suspended: '#6b7280',
};

export default function ManagementDashboard() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [expiringFilter, setExpiringFilter] = useState(30);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    async function load() {
      const u = await base44.auth.me();
      setUser(u);
      if (u.role !== 'admin') return;
      const all = await base44.entities.Member.list('-created_date', 500);
      setMembers(all);
      setLoading(false);
    }
    load();
  }, []);

  if (user && user.role !== 'admin') return <div className="text-center py-20 text-muted-foreground">Acesso restrito.</div>;

  const statusCounts = members.reduce((acc, m) => {
    acc[m.status] = (acc[m.status] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(statusCounts).map(([status, count]) => ({
    name: getStatusLabel(status),
    value: count,
    color: STATUS_COLORS[status] || '#999',
  }));

  // Monthly registrations (last 6 months)
  const now = new Date();
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const label = format(d, 'MMM/yy', { locale: ptBR });
    const count = members.filter(m => {
      const cd = new Date(m.created_date);
      return cd.getMonth() === d.getMonth() && cd.getFullYear() === d.getFullYear();
    }).length;
    return { label, count };
  });

  const today = new Date();
  const expiring = members.filter(m => {
    if (m.status !== 'active' || !m.active_until) return false;
    const exp = parseISO(m.active_until);
    return isBefore(exp, addDays(today, expiringFilter)) && !isBefore(exp, today);
  });
  const expired = members.filter(m => m.status === 'active' && m.active_until && isBefore(parseISO(m.active_until), today));

  const handleSuspendExpired = async () => {
    setUpdatingId('bulk');
    for (const m of expired) {
      await base44.entities.Member.update(m.id, { status: 'suspended' });
    }
    const all = await base44.entities.Member.list('-created_date', 500);
    setMembers(all);
    setUpdatingId(null);
    toast.success(`${expired.length} associado(s) suspenso(s) por vencimento da anuidade.`);
  };

  const handleReactivate = async (memberId, newActiveUntil) => {
    setUpdatingId(memberId);
    await base44.entities.Member.update(memberId, { status: 'active', active_until: newActiveUntil });
    const all = await base44.entities.Member.list('-created_date', 500);
    setMembers(all);
    setUpdatingId(null);
    toast.success('Associado reativado!');
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Controle de Gestão</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Visão geral da associação — ANPPME</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: members.length, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Ativos', value: statusCounts.active || 0, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Pendentes', value: (statusCounts.pending || 0) + (statusCounts.approved || 0) + (statusCounts.documents_pending || 0), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Suspensos', value: statusCounts.suspended || 0, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
        ].map(stat => (
          <Card key={stat.label} className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center shrink-0`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="payments">Anuidades</TabsTrigger>
          <TabsTrigger value="expiring">Vencimentos</TabsTrigger>
          <TabsTrigger value="events" className="gap-1.5"><Award className="w-3.5 h-3.5" /> Eventos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Cadastros por Mês</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Cadastros" fill="hsl(221,83%,30%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Status dos Associados</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={65} dataKey="value" label={({ name, value }) => `${value}`}>
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Legend iconSize={10} formatter={(v) => <span style={{ fontSize: 11 }}>{v}</span>} />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Últimos Cadastros</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {members.slice(0, 8).map(m => (
                  <div key={m.id} className="flex items-center justify-between px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{m.full_name}</p>
                      <p className="text-xs text-muted-foreground">{m.workplace_function}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={getStatusColor(m.status) + " border text-[10px]"}>{getStatusLabel(m.status)}</Badge>
                      <span className="text-[10px] text-muted-foreground">{format(new Date(m.created_date), 'dd/MM/yy')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="mt-4 space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Controle de Anuidades</CardTitle>
                {expired.length > 0 && (
                  <Button variant="destructive" size="sm" onClick={handleSuspendExpired} disabled={updatingId === 'bulk'}>
                    {updatingId === 'bulk' ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <AlertTriangle className="w-3.5 h-3.5 mr-2" />}
                    Suspender {expired.length} vencido(s)
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <PaymentControlTable members={members.filter(m => ['active', 'suspended'].includes(m.status))} onReactivate={handleReactivate} updatingId={updatingId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expiring" className="mt-4 space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <CardTitle className="text-sm">Vencendo em</CardTitle>
                <select className="text-xs border rounded px-2 py-1" value={expiringFilter} onChange={e => setExpiringFilter(Number(e.target.value))}>
                  <option value={7}>7 dias</option>
                  <option value={15}>15 dias</option>
                  <option value={30}>30 dias</option>
                  <option value={60}>60 dias</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              {expiring.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhum associado com vencimento neste período.</p>
              ) : (
                <div className="divide-y">
                  {expiring.map(m => (
                    <div key={m.id} className="flex items-center justify-between py-3">
                      <div><p className="text-sm font-medium">{m.full_name}</p><p className="text-xs text-muted-foreground">{m.registration_number}</p></div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-amber-600">{m.active_until && format(parseISO(m.active_until), 'dd/MM/yyyy')}</p>
                        <p className="text-[10px] text-muted-foreground">vencimento</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="mt-4">
          <EventsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PaymentControlTable({ members, onReactivate, updatingId }) {
  const [newDates, setNewDates] = useState({});

  return (
    <div className="space-y-2">
      {members.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Nenhum registro encontrado.</p>}
      {members.map(m => {
        const isExpired = m.active_until && isBefore(parseISO(m.active_until), new Date());
        return (
          <div key={m.id} className={`p-3 rounded-lg border ${isExpired || m.status === 'suspended' ? 'bg-red-50 border-red-200' : 'bg-card'}`}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-sm font-medium">{m.full_name}</p>
                <p className="text-xs text-muted-foreground">{m.registration_number} · {m.workplace_function}</p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground">Validade anuidade</p>
                  <p className={`text-xs font-semibold ${isExpired ? 'text-red-600' : 'text-foreground'}`}>
                    {m.active_until ? format(parseISO(m.active_until), 'dd/MM/yyyy') : '—'}
                    {isExpired && ' (vencida)'}
                  </p>
                </div>
                <Badge className={getStatusColor(m.status) + " border text-[10px]"}>{getStatusLabel(m.status)}</Badge>
                {(m.status === 'suspended' || isExpired) && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      className="h-7 text-xs w-36"
                      value={newDates[m.id] || ''}
                      onChange={e => setNewDates(p => ({ ...p, [m.id]: e.target.value }))}
                    />
                    <Button size="sm" className="h-7 text-xs" disabled={!newDates[m.id] || updatingId === m.id}
                      onClick={() => onReactivate(m.id, newDates[m.id])}>
                      {updatingId === m.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-1" />}
                      Reativar
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
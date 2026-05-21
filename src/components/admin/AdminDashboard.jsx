/**
 * Dashboard administrativo com gráficos Recharts e estatísticas em tempo real.
 */
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import { Users, CheckCircle2, Clock, AlertTriangle, Gift, CreditCard } from 'lucide-react';
import { format, parseISO, isBefore, addDays, getMonth, getDate } from 'date-fns';
import { getStatusLabel, getMemberTypeLabel } from '@/lib/formatters';

const STATUS_COLORS = {
  active: '#059669',
  pending: '#d97706',
  payment_pending: '#f59e0b',
  approved: '#3b82f6',
  documents_pending: '#8b5cf6',
  rejected: '#dc2626',
  suspended: '#6b7280',
};

const TYPE_COLORS = ['#1e3a6e', '#d97706', '#059669'];

export default function AdminDashboard({ members }) {
  const today = new Date();
  const currentMonth = getMonth(today);
  const currentDay = getDate(today);

  const stats = useMemo(() => {
    const active = members.filter(m => m.status === 'active').length;
    const pending = members.filter(m => ['pending', 'payment_pending', 'approved', 'documents_pending'].includes(m.status)).length;
    const suspended = members.filter(m => m.status === 'suspended').length;
    const rejected = members.filter(m => m.status === 'rejected').length;

    const expiringIn30 = members.filter(m => {
      if (!m.active_until || m.status !== 'active') return false;
      try {
        const exp = parseISO(m.active_until);
        return !isBefore(exp, today) && isBefore(exp, addDays(today, 30));
      } catch { return false; }
    }).length;

    const birthdayThisMonth = members.filter(m => {
      if (!m.birth_date) return false;
      try {
        const bd = parseISO(m.birth_date);
        return getMonth(bd) === currentMonth;
      } catch { return false; }
    }).length;

    return { active, pending, suspended, rejected, expiringIn30, birthdayThisMonth };
  }, [members]);

  const statusChartData = useMemo(() => {
    const counts = {};
    members.forEach(m => { counts[m.status] = (counts[m.status] || 0) + 1; });
    return Object.entries(counts).map(([status, count]) => ({
      name: getStatusLabel(status),
      total: count,
      fill: STATUS_COLORS[status] || '#94a3b8',
    }));
  }, [members]);

  const typeChartData = useMemo(() => {
    const counts = {};
    members.forEach(m => {
      const t = m.member_type || 'participante';
      counts[t] = (counts[t] || 0) + 1;
    });
    return Object.entries(counts).map(([type, value]) => ({
      name: getMemberTypeLabel(type),
      value,
    }));
  }, [members]);

  const monthlyData = useMemo(() => {
    const monthLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const counts = Array(12).fill(0);
    members.forEach(m => {
      if (!m.created_date) return;
      try {
        const d = new Date(m.created_date);
        counts[getMonth(d)] += 1;
      } catch {}
    });
    return monthLabels.map((label, i) => ({ label, total: counts[i] }));
  }, [members]);

  const kpiCards = [
    { label: 'Sócios Ativos', value: stats.active, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Pendências', value: stats.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Vencendo em 30 dias', value: stats.expiringIn30, icon: CreditCard, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Aniversariantes do Mês', value: stats.birthdayThisMonth, icon: Gift, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Suspensos', value: stats.suspended, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Total de Sócios', value: members.length, icon: Users, color: 'text-primary', bg: 'bg-accent' },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Status distribution */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={statusChartData} margin={{ left: -10, right: 4, top: 4, bottom: 4 }}>
                <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} angle={-25} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip formatter={(v) => [v, 'Sócios']} />
                <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                  {statusChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Type distribution */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Distribuição por Tipo de Sócio</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={typeChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {typeChartData.map((_, i) => (
                    <Cell key={i} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [v, 'Sócios']} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Monthly registrations */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Cadastros por Mês (ano corrente)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlyData} margin={{ left: -10, right: 4, top: 4, bottom: 4 }}>
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip formatter={(v) => [v, 'Novos sócios']} />
              <Bar dataKey="total" fill="#1e3a6e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
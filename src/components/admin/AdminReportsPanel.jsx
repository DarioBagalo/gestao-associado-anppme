import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, TrendingUp, Users, AlertTriangle, DollarSign, Loader2 } from 'lucide-react';
import { format, parseISO, isBefore, addDays, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function downloadCSV(rows, headers, filename) {
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function AdminReportsPanel({ members }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Payment.list('-payment_date', 1000).then(pays => {
      setPayments(pays);
      setLoading(false);
    });
  }, []);

  const today = new Date();

  // 1. Active members
  const activeMembers = members.filter(m => m.status === 'active');

  // 2. Monthly revenue (last 6 months)
  const last6 = eachMonthOfInterval({ start: subMonths(today, 5), end: today });
  const monthlyRevenue = last6.map(monthDate => {
    const start = startOfMonth(monthDate);
    const end   = endOfMonth(monthDate);
    const paid  = payments.filter(p => {
      if (p.status !== 'paid' || !p.payment_date) return false;
      const d = parseISO(p.payment_date);
      return d >= start && d <= end;
    });
    return {
      month: format(monthDate, 'MMM/yy', { locale: ptBR }),
      monthFull: format(monthDate, 'MMMM yyyy', { locale: ptBR }),
      count: paid.length,
      total: paid.reduce((s, p) => s + (p.amount || 0), 0),
    };
  });

  // 3. Expiring annuities (next 30 days)
  const expiring = members.filter(m => {
    if (m.status !== 'active' || !m.active_until) return false;
    const exp = parseISO(m.active_until);
    return !isBefore(exp, today) && isBefore(exp, addDays(today, 30));
  });

  // 4. Expired
  const expired = members.filter(m => m.active_until && isBefore(parseISO(m.active_until), today));

  const exportActiveMembers = () => {
    downloadCSV(
      activeMembers.map(m => [
        m.registration_number || '', m.full_name, m.cpf, m.email, m.phone || '',
        m.workplace_name, m.workplace_function, m.active_until || '',
        m.card_issue_date || '',
      ]),
      ['Registro', 'Nome', 'CPF', 'E-mail', 'Telefone', 'Local de Trabalho', 'Função', 'Validade Anuidade', 'Emissão Carteira'],
      `ativos_anppme_${format(today, 'yyyyMMdd')}.csv`
    );
  };

  const exportMonthlyRevenue = () => {
    const rows = [];
    payments.filter(p => p.status === 'paid').forEach(p => {
      rows.push([
        p.payment_date || '', p.member_name, p.type, p.description || '',
        (p.amount || 0).toFixed(2).replace('.', ','), p.reference_year || '',
      ]);
    });
    downloadCSV(
      rows,
      ['Data', 'Associado', 'Tipo', 'Descrição', 'Valor (R$)', 'Ano Ref.'],
      `arrecadacao_anppme_${format(today, 'yyyyMMdd')}.csv`
    );
  };

  const exportExpiring = () => {
    downloadCSV(
      expiring.map(m => [
        m.registration_number || '', m.full_name, m.cpf, m.email, m.phone || '',
        m.active_until || '',
      ]),
      ['Registro', 'Nome', 'CPF', 'E-mail', 'Telefone', 'Validade Anuidade'],
      `vencimentos_anppme_${format(today, 'yyyyMMdd')}.csv`
    );
  };

  const totalRevenue = payments.filter(p => p.status === 'paid').reduce((s, p) => s + (p.amount || 0), 0);

  return (
    <div className="space-y-5">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1"><Users className="w-4 h-4 text-emerald-600" /><p className="text-xs text-muted-foreground">Ativos</p></div>
            <p className="text-2xl font-bold text-emerald-700">{activeMembers.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1"><DollarSign className="w-4 h-4 text-primary" /><p className="text-xs text-muted-foreground">Total Arrecadado</p></div>
            <p className="text-xl font-bold text-primary">{totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4 text-amber-600" /><p className="text-xs text-muted-foreground">Venc. em 30 dias</p></div>
            <p className="text-2xl font-bold text-amber-600">{expiring.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4 text-red-600" /><p className="text-xs text-muted-foreground">Vencidas</p></div>
            <p className="text-2xl font-bold text-red-600">{expired.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Revenue Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Arrecadação por Mês (anuidades)
            </CardTitle>
            <Button variant="outline" size="sm" onClick={exportMonthlyRevenue} disabled={loading}>
              <Download className="w-3.5 h-3.5 mr-1" /> CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="divide-y">
              {monthlyRevenue.map(row => (
                <div key={row.month} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium capitalize">{row.monthFull}</p>
                    <p className="text-xs text-muted-foreground">{row.count} pagamento(s)</p>
                  </div>
                  <p className={`text-sm font-bold ${row.total > 0 ? 'text-emerald-700' : 'text-muted-foreground'}`}>
                    {row.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Members Report */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" /> Associados Ativos ({activeMembers.length})
            </CardTitle>
            <Button variant="outline" size="sm" onClick={exportActiveMembers}>
              <Download className="w-3.5 h-3.5 mr-1" /> CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y max-h-64 overflow-y-auto">
            {activeMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhum associado ativo.</p>
            ) : activeMembers.map(m => (
              <div key={m.id} className="flex items-center justify-between px-5 py-2.5">
                <div>
                  <p className="text-sm font-medium">{m.full_name}</p>
                  <p className="text-xs text-muted-foreground">{m.registration_number} · {m.workplace_function}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Válido até</p>
                  <p className={`text-xs font-semibold ${m.active_until && isBefore(parseISO(m.active_until), today) ? 'text-red-600' : 'text-foreground'}`}>
                    {m.active_until ? format(parseISO(m.active_until), 'dd/MM/yyyy') : '---'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Expiring Annuities */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" /> Vencendo em 30 dias ({expiring.length})
            </CardTitle>
            <Button variant="outline" size="sm" onClick={exportExpiring} disabled={expiring.length === 0}>
              <Download className="w-3.5 h-3.5 mr-1" /> CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {expiring.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhum vencimento nos próximos 30 dias.</p>
          ) : (
            <div className="divide-y">
              {expiring.map(m => (
                <div key={m.id} className="flex items-center justify-between px-5 py-2.5">
                  <div>
                    <p className="text-sm font-medium">{m.full_name}</p>
                    <p className="text-xs text-muted-foreground">{m.email}</p>
                  </div>
                  <Badge className="bg-amber-100 text-amber-700 border border-amber-200 text-xs">
                    {m.active_until && format(parseISO(m.active_until), 'dd/MM/yyyy')}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
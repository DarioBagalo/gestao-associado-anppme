import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Download, Receipt, CreditCard, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { format, parseISO, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TYPE_LABEL  = { anuidade: 'Anuidade', taxa_inscricao: 'Taxa de Inscrição', outros: 'Outros' };
const STATUS_COLOR = { paid: 'bg-emerald-100 text-emerald-700 border-emerald-200', pending: 'bg-amber-100 text-amber-700 border-amber-200', cancelled: 'bg-red-100 text-red-700 border-red-200' };
const STATUS_LABEL = { paid: 'Quitado', pending: 'Pendente', cancelled: 'Cancelado' };
const STATUS_ICON  = { paid: <CheckCircle2 className="w-3.5 h-3.5" />, pending: <Clock className="w-3.5 h-3.5" />, cancelled: <AlertCircle className="w-3.5 h-3.5" /> };

export default function MemberFinancial() {
  const [member, setMember]   = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const u = await base44.auth.me();
      const members = await base44.entities.Member.filter({ email: u.email });
      if (members.length > 0) {
        const m = members[0];
        setMember(m);
        const pays = await base44.entities.Payment.filter({ member_id: m.id }, '-payment_date', 50);
        setPayments(pays);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  if (!member) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
        <Card className="border-0 shadow-sm"><CardContent className="p-8 text-center">
          <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Complete seu cadastro para acessar o histórico financeiro.</p>
        </CardContent></Card>
      </div>
    );
  }

  const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + (p.amount || 0), 0);
  const pending   = payments.filter(p => p.status === 'pending');
  const isExpired = member.active_until && isBefore(parseISO(member.active_until), new Date());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Histórico Financeiro</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Pagamentos e anuidades — ANPPME</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Pago</p>
            <p className="text-xl font-bold text-emerald-700 mt-1">
              {totalPaid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Pendências</p>
            <p className="text-xl font-bold text-amber-600 mt-1">{pending.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Anuidade Válida até</p>
            <p className={`text-sm font-bold mt-1 ${isExpired ? 'text-red-600' : 'text-primary'}`}>
              {member.active_until ? format(parseISO(member.active_until), 'dd/MM/yyyy') : '---'}
              {isExpired && <span className="block text-[10px] font-normal">(vencida)</span>}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Nº de Registro</p>
            <p className="text-sm font-bold font-mono mt-1 text-primary">{member.registration_number || '---'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {isExpired && (
        <Card className="border-0 shadow-sm bg-red-50 border-red-200">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">Anuidade vencida</p>
              <p className="text-xs text-red-700 mt-0.5">Sua anuidade está vencida. Entre em contato com a ANPPME para renovação.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {pending.length > 0 && (
        <Card className="border-0 shadow-sm bg-amber-50 border-amber-200">
          <CardContent className="p-4 flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Você possui {pending.length} pagamento(s) pendente(s)</p>
              <p className="text-xs text-amber-700 mt-0.5">Entre em contato com a ANPPME para regularizar sua situação.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payments list */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="w-4 h-4 text-primary" />
            Histórico de Pagamentos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {payments.length === 0 ? (
            <div className="px-6 py-10 text-center text-muted-foreground">
              <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Nenhum pagamento registrado.</p>
              <p className="text-xs mt-1">Os registros serão adicionados pelo administrador.</p>
            </div>
          ) : (
            <div className="divide-y">
              {payments.map(p => (
                <div key={p.id} className="flex items-center justify-between px-6 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{TYPE_LABEL[p.type] || p.type}</p>
                      {p.reference_year && <span className="text-xs text-muted-foreground">({p.reference_year})</span>}
                    </div>
                    {p.description && <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {p.payment_date && format(parseISO(p.payment_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-bold text-foreground">
                      {(p.amount || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                    <Badge className={STATUS_COLOR[p.status] + " border text-xs gap-1"}>
                      {STATUS_ICON[p.status]}{STATUS_LABEL[p.status]}
                    </Badge>
                    {p.receipt_url && (
                      <a href={p.receipt_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Baixar comprovante">
                          <Download className="w-3.5 h-3.5" />
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm bg-muted/30">
        <CardContent className="p-4 text-xs text-muted-foreground text-center space-y-1">
          <p>Para dúvidas sobre pagamentos ou emissão de comprovantes, entre em contato com a secretaria da ANPPME.</p>
          <p className="font-mono">CNPJ: 28.325.407/0001-08</p>
        </CardContent>
      </Card>
    </div>
  );
}
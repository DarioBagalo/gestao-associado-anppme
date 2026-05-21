import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Users, Search, Loader2, Download, FileText, TrendingUp, Clock, AlertTriangle, LayoutDashboard, MessageCircle, Settings, Award } from 'lucide-react';
import EventsDashboard from '@/components/admin/EventsDashboard';
import { getStatusLabel, getStatusColor } from '@/lib/formatters';
import MemberAdminRow from '@/components/admin/MemberAdminRow';
import MemberDetailModal from '@/components/admin/MemberDetailModal';
import PendingReviewPanel from '@/components/admin/PendingReviewPanel';
import AdminReportsPanel from '@/components/admin/AdminReportsPanel';
import ReportsPanel from '@/components/admin/ReportsPanel';
import AdminDashboard from '@/components/admin/AdminDashboard';
import AdminChat from '@/components/chat/AdminChat';
import RegistrationSettings from '@/components/admin/RegistrationSettings';
import { format, parseISO, isBefore, addDays } from 'date-fns';
import PendingUsersSummaryCard from '@/components/admin/PendingUsersSummaryCard';

export default function AdminPanel() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('members');

  useEffect(() => {
    async function load() {
      const u = await base44.auth.me();
      setUser(u);
      if (u.role !== 'admin') return;
      await loadMembers();
    }
    load();
  }, []);

  const loadMembers = async () => {
    setLoading(true);
    const all = await base44.entities.Member.list('-created_date', 500);
    setMembers(all);
    setLoading(false);
  };

  const exportCSV = () => {
    const rows = filtered.map(m => [
      m.registration_number || '',
      m.full_name || '',
      m.cpf || '',
      m.email || '',
      m.phone || '',
      m.workplace_name || '',
      m.workplace_function || '',
      getStatusLabel(m.status),
      m.active_until || '',
      m.created_date ? format(new Date(m.created_date), 'dd/MM/yyyy') : '',
    ]);
    const header = ['Registro', 'Nome', 'CPF', 'E-mail', 'Telefone', 'Local de Trabalho', 'Função', 'Status', 'Validade Anuidade', 'Data Cadastro'];
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `associados_anppme_${format(new Date(), 'yyyyMMdd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Lista exportada em CSV!');
  };

  if (user && user.role !== 'admin') {
    return <div className="text-center py-20"><p className="text-muted-foreground">Acesso restrito a administradores.</p></div>;
  }

  const filtered = members.filter(m => {
    const matchSearch = !search ||
      m.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      m.cpf?.includes(search) ||
      m.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || m.status === statusFilter;
    const cd = m.created_date ? new Date(m.created_date) : null;
    const matchFrom = !dateFrom || (cd && cd >= new Date(dateFrom));
    const matchTo = !dateTo || (cd && cd <= new Date(dateTo + 'T23:59:59'));
    return matchSearch && matchStatus && matchFrom && matchTo;
  });

  const statusCounts = {
    all: members.length,
    pending: members.filter(m => m.status === 'pending').length,
    approved: members.filter(m => m.status === 'approved').length,
    documents_pending: members.filter(m => m.status === 'documents_pending').length,
    active: members.filter(m => m.status === 'active').length,
    rejected: members.filter(m => m.status === 'rejected').length,
    suspended: members.filter(m => m.status === 'suspended').length,
  };

  const pendingCount = statusCounts.pending + statusCounts.approved + statusCounts.documents_pending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Painel Administrativo</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gerencie os associados da ANPPME</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: statusCounts.all, color: 'text-primary' },
          { label: 'Pendentes', value: pendingCount, color: 'text-amber-700' },
          { label: 'Ativos', value: statusCounts.active, color: 'text-emerald-700' },
          { label: 'Suspensos/Rej.', value: statusCounts.suspended + statusCounts.rejected, color: 'text-red-700' },
        ].map(stat => (
          <Card key={stat.label} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pending Users Summary Card */}
      <PendingUsersSummaryCard onNavigateToPending={() => setActiveTab('pending')} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dashboard" className="gap-2">
            <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-2">
            <Users className="w-3.5 h-3.5" /> Todos
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="w-3.5 h-3.5" /> Análise
            {pendingCount > 0 && <Badge className="bg-amber-500 text-white text-[10px] px-1.5 py-0 h-4 ml-1">{pendingCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2">
            <TrendingUp className="w-3.5 h-3.5" /> Relatórios
          </TabsTrigger>
          <TabsTrigger value="export" className="gap-2">
            <FileText className="w-3.5 h-3.5" /> Exportar
          </TabsTrigger>
          <TabsTrigger value="chat" className="gap-2">
            <MessageCircle className="w-3.5 h-3.5" /> Chat
          </TabsTrigger>
          <TabsTrigger value="events" className="gap-2">
            <Award className="w-3.5 h-3.5" /> Eventos
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="w-3.5 h-3.5" /> Configurações
          </TabsTrigger>
        </TabsList>

        {/* DASHBOARD TAB */}
        <TabsContent value="dashboard" className="mt-4">
          <AdminDashboard members={members} />
        </TabsContent>

        {/* ALL MEMBERS TAB */}
        <TabsContent value="members" className="space-y-4 mt-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 space-y-3">
              <div className="flex flex-wrap gap-3">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Buscar por nome, CPF ou e-mail..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">De:</Label>
                  <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-9 text-xs w-32" />
                  <Label className="text-xs text-muted-foreground">Até:</Label>
                  <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-9 text-xs w-32" />
                </div>
              </div>
              <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                <TabsList className="h-8 flex-wrap">
                  <TabsTrigger value="all" className="text-xs">Todos ({statusCounts.all})</TabsTrigger>
                  <TabsTrigger value="pending" className="text-xs">Pendentes ({statusCounts.pending})</TabsTrigger>
                  <TabsTrigger value="approved" className="text-xs">Aprovados ({statusCounts.approved})</TabsTrigger>
                  <TabsTrigger value="documents_pending" className="text-xs">Docs ({statusCounts.documents_pending})</TabsTrigger>
                  <TabsTrigger value="active" className="text-xs">Ativos ({statusCounts.active})</TabsTrigger>
                  <TabsTrigger value="suspended" className="text-xs">Suspensos ({statusCounts.suspended})</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Nenhum associado encontrado.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filtered.map(member => (
                    <MemberAdminRow key={member.id} member={member} onClick={() => setSelectedMember(member)} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PENDING REVIEW TAB */}
        <TabsContent value="pending" className="mt-4">
          <PendingReviewPanel
            members={members.filter(m => ['pending', 'approved', 'documents_pending'].includes(m.status))}
            onRefresh={loadMembers}
          />
        </TabsContent>

        {/* REPORTS TAB */}
        <TabsContent value="reports" className="mt-4">
          <AdminReportsPanel members={members} />
        </TabsContent>

        {/* EXPORT TAB */}
        <TabsContent value="export" className="mt-4">
          <ReportsPanel members={members} />
        </TabsContent>

        {/* EVENTS TAB */}
        <TabsContent value="events" className="mt-4">
          <EventsDashboard />
        </TabsContent>

        {/* CHAT TAB */}
        <TabsContent value="chat" className="mt-4">
          <AdminChat adminUser={user} />
        </TabsContent>

        {/* SETTINGS TAB */}
        <TabsContent value="settings" className="mt-4">
          <RegistrationSettings />
        </TabsContent>
      </Tabs>

      {selectedMember && (
        <MemberDetailModal
          member={selectedMember}
          allMembersCount={members.length}
          onClose={() => setSelectedMember(null)}
          onUpdate={async () => { await loadMembers(); setSelectedMember(null); }}
        />
      )}
    </div>
  );
}
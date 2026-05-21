import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { FileDown, FileText, Sheet, Filter, Users } from 'lucide-react';
import { exportCSV, exportXLSX, exportPDF, getMemberReportColumns, ALL_MEMBER_COLUMNS } from '@/lib/exportUtils';
import { getStatusLabel, getMemberTypeLabel } from '@/lib/formatters';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos os status' },
  { value: 'pending', label: 'Pendente de Aprovação' },
  { value: 'payment_pending', label: 'Pendente de Pagamento' },
  { value: 'approved', label: 'Aprovado' },
  { value: 'documents_pending', label: 'Documentos em Análise' },
  { value: 'active', label: 'Ativo' },
  { value: 'rejected', label: 'Rejeitado' },
  { value: 'suspended', label: 'Suspenso' },
];

const MEMBER_TYPE_OPTIONS = [
  { value: 'all', label: 'Todos os tipos' },
  { value: 'participante', label: 'Sócio Participante' },
  { value: 'contribuinte', label: 'Sócio Contribuinte' },
  { value: 'benemerито', label: 'Sócio Benemérito' },
];

export default function ReportsPanel({ members }) {
  const [selectedColumns, setSelectedColumns] = useState(
    ALL_MEMBER_COLUMNS.map(c => c.key)
  );
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [generating, setGenerating] = useState(false);

  const toggleColumn = (key) => {
    setSelectedColumns(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const getFilteredData = () => {
    return members.filter(m => {
      const matchStatus = statusFilter === 'all' || m.status === statusFilter;
      const matchType = typeFilter === 'all' || m.member_type === typeFilter;
      const matchState = !stateFilter || (m.workplace_state || '').toLowerCase().includes(stateFilter.toLowerCase());
      const cd = m.created_date ? new Date(m.created_date) : null;
      const matchFrom = !dateFrom || (cd && cd >= new Date(dateFrom));
      const matchTo = !dateTo || (cd && cd <= new Date(dateTo + 'T23:59:59'));
      return matchStatus && matchType && matchState && matchFrom && matchTo;
    });
  };

  const getFilename = () => `associados_anppme_${format(new Date(), 'yyyyMMdd_HHmm')}`;

  const handleExport = async (type) => {
    const data = getFilteredData();
    if (data.length === 0) { toast.error('Nenhum dado encontrado com os filtros aplicados.'); return; }
    setGenerating(true);
    const columns = getMemberReportColumns(selectedColumns);
    const filename = getFilename();
    try {
      if (type === 'csv') exportCSV(data, columns, filename);
      else if (type === 'xlsx') exportXLSX(data, columns, filename);
      else if (type === 'pdf') exportPDF(data, columns, filename, 'Lista de Associados — ANPPME');
      // Log print history
      await base44.entities.PrintHistory.create({
        member_id: 'admin',
        member_name: 'Administrador',
        item_type: 'report',
        format: type.toUpperCase(),
      });
      toast.success(`Relatório exportado em ${type.toUpperCase()} com ${data.length} registro(s)!`);
    } catch (e) {
      toast.error('Erro ao gerar relatório.');
    }
    setGenerating(false);
  };

  const filteredCount = getFilteredData().length;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Filter className="w-4 h-4" /> Filtros do Relatório
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Tipo de Sócio</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MEMBER_TYPE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Estado (UF)</Label>
              <Input value={stateFilter} onChange={e => setStateFilter(e.target.value)} placeholder="Ex: RO" className="text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Período de Cadastro</Label>
              <div className="flex gap-1 items-center">
                <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="text-xs h-9" />
                <span className="text-xs text-muted-foreground">até</span>
                <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="text-xs h-9" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 border-t">
            <Users className="w-3.5 h-3.5" />
            <span><strong className="text-foreground">{filteredCount}</strong> registro(s) encontrado(s) com os filtros aplicados</span>
          </div>
        </CardContent>
      </Card>

      {/* Column Selection */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Colunas a Incluir no Relatório</CardTitle>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setSelectedColumns(ALL_MEMBER_COLUMNS.map(c => c.key))}>Todas</Button>
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setSelectedColumns([])}>Nenhuma</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {ALL_MEMBER_COLUMNS.map(col => (
              <div key={col.key} className="flex items-center gap-2">
                <Checkbox
                  id={col.key}
                  checked={selectedColumns.includes(col.key)}
                  onCheckedChange={() => toggleColumn(col.key)}
                />
                <Label htmlFor={col.key} className="text-xs cursor-pointer">{col.label}</Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Export Buttons */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-3 font-medium">Gerar Relatório ({filteredCount} registros, {selectedColumns.length} colunas)</p>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => handleExport('pdf')} disabled={generating} className="gap-2">
              <FileText className="w-4 h-4" /> PDF (Impressão)
            </Button>
            <Button onClick={() => handleExport('xlsx')} disabled={generating} variant="outline" className="gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50">
              <Sheet className="w-4 h-4" /> Excel (.xlsx)
            </Button>
            <Button onClick={() => handleExport('csv')} disabled={generating} variant="outline" className="gap-2">
              <FileDown className="w-4 h-4" /> CSV (dados)
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            PDF: para impressão · XLSX: para Excel/Google Sheets · CSV: para banco de dados e sistemas
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
import { getStatusLabel, getMemberTypeLabel } from './formatters';
import { format } from 'date-fns';

/**
 * Export data as CSV
 */
export function exportCSV(data, columns, filename) {
  const header = columns.map(c => `"${c.label}"`).join(',');
  const rows = data.map(row =>
    columns.map(c => {
      const val = c.getValue ? c.getValue(row) : (row[c.key] ?? '');
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',')
  );
  const csv = [header, ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename + '.csv');
}

/**
 * Export data as XLSX using SpreadsheetML (native Excel XML format)
 */
export function exportXLSX(data, columns, filename) {
  const escape = (val) => String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  const headerRow = columns.map(c =>
    `<Cell ss:StyleID="header"><Data ss:Type="String">${escape(c.label)}</Data></Cell>`
  ).join('');

  const dataRows = data.map(row =>
    `<Row>${columns.map(c => {
      const val = c.getValue ? c.getValue(row) : (row[c.key] ?? '');
      return `<Cell><Data ss:Type="String">${escape(val)}</Data></Cell>`;
    }).join('')}</Row>`
  ).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:x="urn:schemas-microsoft-com:office:excel">
 <Styles>
  <Style ss:ID="header">
   <Font ss:Bold="1"/>
   <Interior ss:Color="#1e3a6e" ss:Pattern="Solid"/>
   <Font ss:Color="#FFFFFF" ss:Bold="1"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Associados">
  <Table>
   <Row>${headerRow}</Row>
   ${dataRows}
  </Table>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  downloadBlob(blob, filename + '.xlsx');
}

/**
 * Export data as PDF (opens print dialog with formatted table)
 */
export function exportPDF(data, columns, filename, title = 'Relatório ANPPME') {
  const LOGO = 'https://media.base44.com/images/public/69bdad4b62555d6f0c050afb/eb6f25876_LOGO_ANPPME_AZUL_SIMBOLO.png';
  const now = format(new Date(), "dd/MM/yyyy 'às' HH:mm");

  const headerCells = columns.map(c => `<th>${c.label}</th>`).join('');
  const bodyRows = data.map(row =>
    `<tr>${columns.map(c => {
      const val = c.getValue ? c.getValue(row) : (row[c.key] ?? '---');
      return `<td>${val}</td>`;
    }).join('')}</tr>`
  ).join('');

  const win = window.open('', '_blank', 'width=1100,height=800');
  win.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
@page { size: A4 landscape; margin: 12mm; }
body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 9pt; color: #111; }
.header { display:flex; align-items:center; gap:12px; padding-bottom:8px; border-bottom:2px solid #1e3a6e; margin-bottom:10px; }
.header img { width:36px; height:36px; object-fit:contain; }
.header-text h1 { font-size:13pt; font-weight:800; color:#1e3a6e; }
.header-text p { font-size:8pt; color:#666; }
table { width:100%; border-collapse:collapse; margin-top:4px; }
th { background:#1e3a6e; color:#fff; font-weight:700; padding:6px 8px; text-align:left; font-size:8pt; }
td { padding:5px 8px; border-bottom:1px solid #e5e7eb; font-size:8pt; }
tr:nth-child(even) td { background:#f8fafc; }
.footer { margin-top:10px; font-size:7pt; color:#aaa; text-align:center; }
</style></head><body>
<div class="header">
  <img src="${LOGO}" />
  <div class="header-text">
    <h1>${title}</h1>
    <p>Gerado em: ${now} · Total: ${data.length} registro(s) · ANPPME — CNPJ: 28.325.407/0001-08</p>
  </div>
</div>
<table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>
<div class="footer">Documento gerado pelo sistema ANPPME · anppme@gmail.com · (69) 99912-4124</div>
</body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 800);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Standard column definitions for member reports
 */
export function getMemberReportColumns(selectedColumns) {
  const ALL_COLUMNS = [
    { key: 'registration_number', label: 'Registro' },
    { key: 'full_name', label: 'Nome Completo' },
    { key: 'cpf', label: 'CPF' },
    { key: 'email', label: 'E-mail' },
    { key: 'phone', label: 'Telefone' },
    { key: 'status', label: 'Status', getValue: (r) => getStatusLabel(r.status) },
    { key: 'member_type', label: 'Tipo de Sócio', getValue: (r) => getMemberTypeLabel(r.member_type) },
    { key: 'workplace_name', label: 'Local de Trabalho' },
    { key: 'workplace_function', label: 'Função' },
    { key: 'workplace_city', label: 'Município' },
    { key: 'workplace_state', label: 'Estado' },
    { key: 'active_until', label: 'Validade Anuidade', getValue: (r) => r.active_until ? format(new Date(r.active_until), 'dd/MM/yyyy') : '---' },
    { key: 'created_date', label: 'Data de Cadastro', getValue: (r) => r.created_date ? format(new Date(r.created_date), 'dd/MM/yyyy') : '---' },
    { key: 'birth_city', label: 'Município de Nascimento' },
    { key: 'birth_state', label: 'Estado de Nascimento' },
  ];
  if (!selectedColumns || selectedColumns.length === 0) return ALL_COLUMNS;
  return ALL_COLUMNS.filter(c => selectedColumns.includes(c.key));
}

export const ALL_MEMBER_COLUMNS = [
  { key: 'registration_number', label: 'Registro' },
  { key: 'full_name', label: 'Nome Completo' },
  { key: 'cpf', label: 'CPF' },
  { key: 'email', label: 'E-mail' },
  { key: 'phone', label: 'Telefone' },
  { key: 'status', label: 'Status' },
  { key: 'member_type', label: 'Tipo de Sócio' },
  { key: 'workplace_name', label: 'Local de Trabalho' },
  { key: 'workplace_function', label: 'Função' },
  { key: 'workplace_city', label: 'Município' },
  { key: 'workplace_state', label: 'Estado' },
  { key: 'active_until', label: 'Validade Anuidade' },
  { key: 'created_date', label: 'Data de Cadastro' },
  { key: 'birth_city', label: 'Município de Nascimento' },
  { key: 'birth_state', label: 'Estado de Nascimento' },
];
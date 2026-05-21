/**
 * Utilitários de data seguros para fuso horário.
 * 
 * O problema: new Date('1969-04-19') interpreta a string como UTC midnight,
 * o que ao exibir no Brasil (UTC-3) resulta em '18/04/1969'.
 * 
 * Solução: parsear a string YYYY-MM-DD como data local, não UTC.
 */

/**
 * Converte string 'YYYY-MM-DD' para objeto Date no fuso local (sem shift de timezone).
 * Equivalente a: new Date(ano, mês-1, dia) — sempre local.
 */
export function parseDateLocal(dateStr) {
  if (!dateStr) return null;
  // Se já for um objeto Date, retorna direto
  if (dateStr instanceof Date) return dateStr;
  // Tenta formato YYYY-MM-DD
  const m = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    return new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]));
  }
  // Fallback para outros formatos
  return new Date(dateStr);
}

/**
 * Formata objeto Date para 'DD/MM/YYYY' de forma segura.
 */
export function formatDateBR(dateOrStr) {
  const d = parseDateLocal(dateOrStr);
  if (!d || isNaN(d.getTime())) return '---';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Converte string 'DD/MM/YYYY' para 'YYYY-MM-DD' (para salvar no banco).
 * Retorna null se inválido.
 */
export function brDateToISO(brDate) {
  if (!brDate) return null;
  const m = brDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  // Valida a data
  const d = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd));
  if (
    d.getDate() !== parseInt(dd) ||
    d.getMonth() !== parseInt(mm) - 1 ||
    d.getFullYear() !== parseInt(yyyy)
  ) return null;
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Converte 'YYYY-MM-DD' para 'DD/MM/YYYY'.
 */
export function isoDateToBR(isoDate) {
  if (!isoDate) return '';
  const m = String(isoDate).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return '';
  return `${m[3]}/${m[2]}/${m[1]}`;
}
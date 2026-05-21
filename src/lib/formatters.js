export function formatCPF(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function formatPhone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function getStatusLabel(status) {
  const labels = {
    pending: 'Pendente de Aprovação',
    payment_pending: 'Pendente de Pagamento',
    approved: 'Aprovado – Aguardando Documentos',
    documents_pending: 'Documentos em Análise',
    active: 'Ativo',
    rejected: 'Rejeitado',
    suspended: 'Suspenso',
  };
  return labels[status] || status;
}

export function getStatusColor(status) {
  const colors = {
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    payment_pending: 'bg-orange-100 text-orange-800 border-orange-200',
    approved: 'bg-blue-100 text-blue-800 border-blue-200',
    documents_pending: 'bg-purple-100 text-purple-800 border-purple-200',
    active: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
    suspended: 'bg-gray-100 text-gray-800 border-gray-200',
  };
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
}

export function getMemberTypeLabel(type) {
  const labels = {
    participante: 'Sócio Participante',
    contribuinte: 'Sócio Contribuinte',
    'benemérito': 'Sócio Benemérito',
    'benemerито': 'Sócio Benemérito',
    fundador: 'Sócio Fundador',
  };
  return labels[type] || 'Sócio Participante';
}

export function getMemberTypeColor(type) {
  const colors = {
    participante: 'bg-gray-100 text-gray-800 border-gray-200',
    contribuinte: 'bg-blue-100 text-blue-800 border-blue-200',
    'benemérito': 'bg-amber-100 text-amber-800 border-amber-200',
    'benemerито': 'bg-amber-100 text-amber-800 border-amber-200',
    fundador: 'bg-violet-100 text-violet-800 border-violet-200',
  };
  return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200';
}

export function generateRegistrationNumberFromConfig(startNumber) {
  const year = new Date().getFullYear();
  const num = String(startNumber).padStart(4, '0');
  return `${num}/${year}`;
}

export function maskCPF(cpf) {
  if (!cpf) return '---';
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return cpf;
  return `${digits.slice(0, 2)}.xxx.xxx-${digits.slice(9)}`;
}

export function generateRegistrationNumber(sequenceNumber) {
  const year = new Date().getFullYear();
  const num = String(sequenceNumber).padStart(4, '0');
  return `${num}/${year}`;
}
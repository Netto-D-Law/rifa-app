export function formatMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

export function formatDataHora(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function padNumero(numero: number, total: number): string {
  return String(numero).padStart(String(total).length, '0');
}

export function maskNome(nome: string | null | undefined): string {
  if (!nome) return 'Comprador';
  const partes = nome.trim().split(/\s+/);
  const primeiro = partes[0] ?? '';
  const inicial = partes.length > 1 ? `${partes[partes.length - 1][0]}.` : '';
  return [primeiro, inicial].filter(Boolean).join(' ') || 'Comprador';
}

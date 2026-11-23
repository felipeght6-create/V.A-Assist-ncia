import { BudgetLineItem, CardMode, InstallmentRate, ServiceCategoryId, WorkOrderStatus } from '../types';

export function formatBRL(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(safe);
}

export function formatDateBR(isoOrYmd: string): string {
  if (!isoOrYmd) return '-';
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoOrYmd)) {
    const [y, m, d] = isoOrYmd.split('-');
    return `${d}/${m}/${y}`;
  }
  const d = new Date(isoOrYmd);
  if (Number.isNaN(d.getTime())) return isoOrYmd;
  return d.toLocaleDateString('pt-BR');
}

export function getTodayYMD(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDaysYMD(baseYmd: string, days: number): string {
  const [y, m, d] = baseYmd.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  dt.setDate(dt.getDate() + days);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

export const CATEGORY_LABELS: Record<ServiceCategoryId, string> = {
  telas: 'Troca de Telas',
  celulares: 'Consertos de Celulares',
  notebooks: 'Notebooks e Computadores',
  acessorios: 'Venda de Acessórios',
};

export const CATEGORY_SHORT_LABELS: Record<ServiceCategoryId, string> = {
  telas: 'Telas',
  celulares: 'Celulares',
  notebooks: 'Notebooks/PC',
  acessorios: 'Acessórios',
};

export const STATUS_LABELS: Record<WorkOrderStatus, string> = {
  aguardando: 'Aguardando Análise',
  orcamento: 'Orçamento Enviado',
  aprovado: 'Aprovado / Em Reparo',
  pronto: 'Pronto p/ Retirada',
  entregue: 'Entregue',
};

export const STATUS_ORDER: WorkOrderStatus[] = [
  'aguardando',
  'orcamento',
  'aprovado',
  'pronto',
  'entregue',
];

export interface CalculatedInstallment {
  installments: number;
  feePercent: number;
  total: number;
  perInstallment: number;
}

export interface BudgetTotals {
  partsSubtotal: number;
  laborSubtotal: number;
  grossSubtotal: number;
  cashDiscountPercent: number;
  cashDiscountAmount: number;
  cashTotal: number;
  installmentOptions: CalculatedInstallment[];
  selectedInstallment: CalculatedInstallment;
}

export function calculateBudgetTotals(
  items: BudgetLineItem[],
  cashDiscountPercent: number,
  cardRates: InstallmentRate[],
  selectedInstallments: number,
  cardMode: CardMode
): BudgetTotals {
  let partsSubtotal = 0;
  let laborSubtotal = 0;

  for (const item of items) {
    const qty = Math.max(1, Number(item.qty) || 1);
    partsSubtotal += (Number(item.partPrice) || 0) * qty;
    laborSubtotal += (Number(item.laborPrice) || 0) * qty;
  }

  const grossSubtotal = partsSubtotal + laborSubtotal;
  const safeDiscount = Math.max(0, Math.min(50, Number(cashDiscountPercent) || 0));
  const cashDiscountAmount = grossSubtotal * (safeDiscount / 100);
  const cashTotal = Math.max(0, grossSubtotal - cashDiscountAmount);

  const rates = cardRates.length > 0
    ? cardRates
    : [
        { installments: 1, feePercent: 3.5 },
        { installments: 2, feePercent: 5.2 },
        { installments: 3, feePercent: 6.5 },
        { installments: 6, feePercent: 9.8 },
        { installments: 10, feePercent: 13.5 },
        { installments: 12, feePercent: 15.9 },
      ];

  const installmentOptions: CalculatedInstallment[] = rates.map((r) => {
    const effectiveFee = cardMode === 'sem_juros' ? 0 : Math.max(0, Number(r.feePercent) || 0);
    const total = grossSubtotal * (1 + effectiveFee / 100);
    const perInstallment = total / Math.max(1, r.installments);
    return {
      installments: r.installments,
      feePercent: effectiveFee,
      total,
      perInstallment,
    };
  });

  const selectedInstallment =
    installmentOptions.find((opt) => opt.installments === selectedInstallments) ||
    installmentOptions[0];

  return {
    partsSubtotal,
    laborSubtotal,
    grossSubtotal,
    cashDiscountPercent: safeDiscount,
    cashDiscountAmount,
    cashTotal,
    installmentOptions,
    selectedInstallment,
  };
}

export function generateId(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

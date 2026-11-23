import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { Client, StoreProfile, WorkOrder, WorkOrderStatus } from '../types';
import {
  STATUS_LABELS,
  STATUS_ORDER,
  calculateBudgetTotals,
  formatBRL,
  formatDateBR,
} from '../utils/format';
import { generateBudgetPDF } from '../utils/pdfGenerator';

interface WorkOrdersViewProps {
  workOrders: WorkOrder[];
  clients: Client[];
  store: StoreProfile;
  onUpdateStatus: (orderId: string, status: WorkOrderStatus) => void;
  onUpdateNotes: (orderId: string, technicianNotes: string) => void;
  onOpenInBudget: (orderId: string) => void;
  onCreateNewOrder: () => void;
  onDeleteOrder: (orderId: string) => void;
}

export const WorkOrdersView: React.FC<WorkOrdersViewProps> = ({
  workOrders,
  clients,
  store,
  onUpdateStatus,
  onUpdateNotes,
  onOpenInBudget,
  onCreateNewOrder,
  onDeleteOrder,
}) => {
  const [statusFilter, setStatusFilter] = useState<'todas' | WorkOrderStatus>('todas');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(
    workOrders[0]?.id ?? null
  );

  const clientMap = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return workOrders.filter((o) => {
      if (statusFilter !== 'todas' && o.status !== statusFilter) return false;
      if (!q) return true;
      const client = clientMap.get(o.clientId);
      return (
        o.code.toLowerCase().includes(q) ||
        o.deviceBrandModel.toLowerCase().includes(q) ||
        o.reportedIssue.toLowerCase().includes(q) ||
        (client?.name.toLowerCase().includes(q) ?? false) ||
        (client?.phone.toLowerCase().includes(q) ?? false)
      );
    });
  }, [workOrders, statusFilter, search, clientMap]);

  const getNextStatus = (current: WorkOrderStatus): WorkOrderStatus | null => {
    const idx = STATUS_ORDER.indexOf(current);
    if (idx === -1 || idx >= STATUS_ORDER.length - 1) return null;
    return STATUS_ORDER[idx + 1];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
            Ordens de Serviço
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Acompanhe cada aparelho da entrada até a entrega com cálculo de peças e mão de obra
          </p>
        </div>

        <button
          type="button"
          onClick={onCreateNewOrder}
          className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[var(--accent)] text-[var(--accent-on)] text-sm font-semibold hover:bg-[var(--accent-hover)] active:scale-[0.98] transition-all inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Ordem de Serviço</span>
        </button>
      </div>

      {/* Search + Segmented Status Filter */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nº OS, cliente, aparelho ou defeito..."
            className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setStatusFilter('todas')}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              statusFilter === 'todas'
                ? 'bg-[var(--accent)] text-[var(--accent-on)]'
                : 'bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Todas ({workOrders.length})
          </button>
          {STATUS_ORDER.map((st) => {
            const count = workOrders.filter((o) => o.status === st).length;
            return (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  statusFilter === st
                    ? 'bg-[var(--accent)] text-[var(--accent-on)]'
                    : 'bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {STATUS_LABELS[st]} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-10 text-center space-y-3">
          <ClipboardCheck className="w-10 h-10 text-[var(--accent-text)] mx-auto" />
          <h3 className="font-display text-base font-bold text-[var(--text-primary)]">
            Nenhuma Ordem de Serviço encontrada
          </h3>
          <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto">
            Ajuste os filtros ou crie uma nova OS/Orçamento para acompanhar reparos e gerar o PDF A4.
          </p>
          <button
            type="button"
            onClick={onCreateNewOrder}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[var(--accent)] text-[var(--accent-on)] text-sm font-semibold hover:bg-[var(--accent-hover)] inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova OS / Orçamento</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const client = clientMap.get(order.clientId);
            const totals = calculateBudgetTotals(
              order.items,
              order.cashDiscountPercent,
              store.cardRates,
              order.selectedInstallments,
              order.cardMode
            );
            const isExpanded = expandedId === order.id;
            const currentStepIdx = STATUS_ORDER.indexOf(order.status);
            const nextStatus = getNextStatus(order.status);

            return (
              <article
                key={order.id}
                className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden"
              >
                <div
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-[var(--surface-2)] transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)] tabular-nums">
                      <span className="font-num font-bold text-[var(--accent-text)]">
                        {order.code}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-[var(--text-secondary)]">
                        {STATUS_LABELS[order.status]}
                      </span>
                      {order.deliveryForecast && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>Previsão {formatDateBR(order.deliveryForecast)}</span>
                        </>
                      )}
                    </div>
                    <h3 className="font-display text-base sm:text-lg font-bold text-[var(--text-primary)] truncate">
                      {order.deviceBrandModel}
                    </h3>
                    <p className="text-xs sm:text-sm text-[var(--text-muted)] truncate">
                      {client?.name || 'Cliente Balcão'}
                      {client?.phone ? ` · ${client.phone}` : ''}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                    <div className="text-left sm:text-right tabular-nums">
                      <p className="font-num text-base sm:text-lg font-bold text-[var(--text-primary)]">
                        {formatBRL(totals.cashTotal)}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {totals.selectedInstallment.installments}x{' '}
                        {formatBRL(totals.selectedInstallment.perInstallment)} no cartão
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenInBudget(order.id);
                      }}
                      className="min-h-[44px] px-4 py-2 rounded-xl bg-[var(--accent-soft)] text-[var(--accent-text)] hover:bg-[var(--accent)] hover:text-[var(--accent-on)] font-semibold text-xs sm:text-sm transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Editar / PDF</span>
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 sm:px-5 pb-5 pt-4 border-t border-[var(--border)] bg-[var(--surface-2)] space-y-5">
                    <div>
                      <p className="text-xs font-semibold text-[var(--text-muted)] mb-2.5">
                        Etapa do Atendimento (clique para atualizar)
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {STATUS_ORDER.map((st, idx) => {
                          const completed = idx <= currentStepIdx;
                          const isCurrent = st === order.status;
                          return (
                            <button
                              key={st}
                              type="button"
                              onClick={() => onUpdateStatus(order.id, st)}
                              className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 text-center cursor-pointer ${
                                isCurrent
                                  ? 'bg-[var(--accent)] text-[var(--accent-on)] border-[var(--accent)] shadow-xs'
                                  : completed
                                    ? 'bg-[var(--accent-soft)] text-[var(--accent-text)] border-[var(--border-strong)]'
                                    : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--accent)]'
                              }`}
                            >
                              {completed && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                              <span className="truncate">{STATUS_LABELS[st]}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-4 space-y-2.5">
                        <p className="text-xs font-bold text-[var(--accent-text)]">
                          RELATO E CHECKLIST DE ENTRADA
                        </p>
                        <p className="text-sm text-[var(--text-primary)]">{order.reportedIssue || '-'}</p>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--text-secondary)] pt-1">
                          <span>
                            Liga: <strong>{order.checklist.turnsOn ? 'Sim' : 'Não'}</strong>
                          </span>
                          <span>·</span>
                          <span>
                            Tela íntegra:{' '}
                            <strong>{order.checklist.screenIntact ? 'Sim' : 'Não'}</strong>
                          </span>
                          <span>·</span>
                          <span>
                            Conector OK:{' '}
                            <strong>{order.checklist.chargingPortOk ? 'Sim' : 'Não'}</strong>
                          </span>
                        </div>
                        <div className="pt-1">
                          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                            Laudo / Notas do Técnico
                          </label>
                          <textarea
                            rows={2}
                            value={order.technicianNotes}
                            onChange={(e) => onUpdateNotes(order.id, e.target.value)}
                            placeholder="Anotações técnicas sobre o reparo..."
                            className="w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                          />
                        </div>
                      </div>

                      <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-4 space-y-2.5">
                        <p className="text-xs font-bold text-[var(--accent-text)]">
                          PEÇAS E MÃO DE OBRA ({order.items.length} itens)
                        </p>
                        <div className="divide-y divide-[var(--border)] text-xs">
                          {order.items.map((item) => (
                            <div
                              key={item.id}
                              className="py-2 flex items-center justify-between gap-2"
                            >
                              <span className="text-[var(--text-primary)] font-medium truncate">
                                {item.qty}x {item.name}
                              </span>
                              <span className="font-num tabular-nums text-[var(--text-secondary)] shrink-0">
                                {formatBRL((item.partPrice + item.laborPrice) * item.qty)}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-muted)] tabular-nums">
                          <span>
                            Peças: <strong className="text-[var(--text-primary)]">{formatBRL(totals.partsSubtotal)}</strong>
                          </span>
                          <span>
                            Mão de obra: <strong className="text-[var(--text-primary)]">{formatBRL(totals.laborSubtotal)}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => onDeleteOrder(order.id)}
                        className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Excluir OS</span>
                      </button>

                      <div className="flex flex-wrap items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => generateBudgetPDF(order, client, store)}
                          className="min-h-[44px] px-4 py-2 rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text-primary)] text-xs sm:text-sm font-semibold hover:bg-[var(--surface-hover)] inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                        >
                          <FileText className="w-4 h-4 text-[var(--accent-text)]" />
                          <span>Baixar PDF A4</span>
                        </button>

                        {nextStatus && (
                          <button
                            type="button"
                            onClick={() => onUpdateStatus(order.id, nextStatus)}
                            className="min-h-[44px] px-4 py-2 rounded-xl bg-[var(--accent)] text-[var(--accent-on)] text-xs sm:text-sm font-semibold hover:bg-[var(--accent-hover)] inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                          >
                            <span>Avançar para: {STATUS_LABELS[nextStatus]}</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

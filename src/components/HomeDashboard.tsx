import React, { useMemo, useState } from 'react';
import {
  ChevronRight,
  ClipboardList,
  FilePlus2,
  FileText,
  FolderCog,
  Laptop,
  MonitorSmartphone,
  Plus,
  ShieldCheck,
  Trash2,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import {
  Client,
  ScreenCatalogItem,
  ServiceCategoryId,
  ServiceItem,
  StoreProfile,
  WorkOrder,
} from '../types';
import {
  CATEGORY_LABELS,
  FREE_PROTECTOR_DESCRIPTION,
  STATUS_LABELS,
  calculateBudgetTotals,
  formatBRL,
  formatDateBR,
  getPickupFeeAmount,
} from '../utils/format';
import { ScreenCatalogModal } from './ScreenCatalogModal';

interface HomeDashboardProps {
  store: StoreProfile;
  services: ServiceItem[];
  screenCatalog: ScreenCatalogItem[];
  clients: Client[];
  workOrders: WorkOrder[];
  draftOrder: WorkOrder;
  onAddServiceToDraft: (service: ServiceItem) => void;
  onAddScreenToDraft: (screen: ScreenCatalogItem) => void;
  onSaveScreen: (screen: ScreenCatalogItem) => void;
  onDeleteScreen: (id: string) => void;
  onRemoveLineFromDraft: (lineId: string) => void;
  onStartNewBudget: () => void;
  onOpenOrderInBudget: (orderId: string) => void;
  onNavigateTab: (tab: 'ordens' | 'agenda' | 'orcamento' | 'cadastros') => void;
  onNavigateToClients: () => void;
}

const CATEGORY_CARDS: {
  id: ServiceCategoryId;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: 'telas',
    title: 'TELAS',
    subtitle: 'iPhone, Samsung, Motorola e Xiaomi',
    icon: MonitorSmartphone,
  },
  {
    id: 'celulares',
    title: 'Consertos de Celulares',
    subtitle: 'Conector de carga, flex e bateria',
    icon: Wrench,
  },
  {
    id: 'notebooks',
    title: 'Notebooks e PCs',
    subtitle: 'Telas, teclados, manutenção e Windows',
    icon: Laptop,
  },
  {
    id: 'acessorios',
    title: 'Acessórios',
    subtitle: 'Capinhas, películas 3D, fontes e cabos',
    icon: ShieldCheck,
  },
];

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  store,
  services,
  screenCatalog,
  clients,
  workOrders,
  draftOrder,
  onAddServiceToDraft,
  onAddScreenToDraft,
  onSaveScreen,
  onDeleteScreen,
  onRemoveLineFromDraft,
  onStartNewBudget,
  onOpenOrderInBudget,
  onNavigateTab,
  onNavigateToClients,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategoryId | null>(null);
  const [screensModalOpen, setScreensModalOpen] = useState(false);

  const activeOrders = workOrders.filter((o) => o.status !== 'entregue');
  const clientMap = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);

  const draftTotals = useMemo(
    () =>
      calculateBudgetTotals(
        draftOrder.items,
        draftOrder.cashDiscountPercent,
        store.cardRates,
        draftOrder.selectedInstallments,
        draftOrder.cardMode,
        getPickupFeeAmount(draftOrder.pickupDeliveryFee)
      ),
    [
      draftOrder.items,
      draftOrder.cashDiscountPercent,
      draftOrder.pickupDeliveryFee,
      store.cardRates,
      draftOrder.selectedInstallments,
      draftOrder.cardMode,
    ]
  );

  const categoryServices = selectedCategory
    ? services.filter((s) => s.category === selectedCategory)
    : [];

  const quickActions = [
    {
      id: 'orcamento',
      title: 'Novo Orçamento A4',
      subtitle: 'Montar proposta e PDF',
      meta: `${draftOrder.items.length} item(ns) no rascunho`,
      icon: FilePlus2,
      onClick: () => onNavigateTab('orcamento'),
    },
    {
      id: 'ordens',
      title: 'Ordens de Serviço',
      subtitle: 'Status e garantia de 90 dias',
      meta: `${activeOrders.length} em andamento`,
      icon: ClipboardList,
      onClick: () => onNavigateTab('ordens'),
    },
    {
      id: 'clientes',
      title: 'Clientes',
      subtitle: 'Histórico e aparelhos salvos',
      meta: `${clients.length} ${clients.length === 1 ? 'cadastrado' : 'cadastrados'}`,
      icon: Users,
      onClick: onNavigateToClients,
    },
    {
      id: 'cadastros',
      title: 'Valores e Loja',
      subtitle: 'Editar preços, taxas e PIX',
      meta: `${services.length + screenCatalog.length} itens no catálogo`,
      icon: FolderCog,
      onClick: () => onNavigateTab('cadastros'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Professional Logo Showcase */}
      <section
        className="rounded-2xl border border-[var(--border)] px-6 py-6 flex flex-col items-center justify-center text-center gap-3 shadow-sm"
        style={{ background: 'var(--hero-bg)' }}
      >
        {store.logoUrl ? (
          <img
            src={store.logoUrl}
            alt={store.name}
            referrerPolicy="no-referrer"
            className="w-28 h-28 sm:w-32 sm:h-32 object-contain drop-shadow-md"
          />
        ) : (
          <span className="font-display text-2xl font-extrabold text-[var(--text-primary)]">
            {store.name}
          </span>
        )}
        <div className="flex flex-col items-center text-center space-y-1">
          <h1 className="font-display text-lg sm:text-xl font-bold tracking-tight text-[var(--text-primary)]">
            Central de Orçamentos
          </h1>
          <p className="text-sm font-semibold text-[var(--accent-text)]">
            Ordens de Serviço e Assistência Técnica
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            Celulares, Notebooks e Acessórios
          </p>
        </div>
      </section>

      {/* Block 1: Large Quick-Access Service Categories (TELAS opens 4 brands) */}
      <section aria-labelledby="categories-heading" className="space-y-3.5">
        <div className="flex items-baseline justify-between gap-4">
          <h2
            id="categories-heading"
            className="font-display text-lg sm:text-xl font-bold text-[var(--text-primary)]"
          >
            Escolha o Serviço para Orçar
          </h2>
          <span className="text-xs text-[var(--text-muted)] text-right">
            Toque em um bloco para abrir
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {CATEGORY_CARDS.map((cat, idx) => {
            const Icon = cat.icon;
            const catItems = draftOrder.items.filter((it) => it.category === cat.id);
            const catQty = catItems.reduce((acc, it) => acc + Math.max(1, it.qty), 0);
            const catSum = catItems.reduce(
              (acc, it) => acc + (it.partPrice + it.laborPrice) * Math.max(1, it.qty),
              0
            );
            const isHighlighted = catQty > 0 || (draftOrder.items.length === 0 && idx === 0);

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  if (cat.id === 'telas') {
                    setScreensModalOpen(true);
                  } else {
                    setSelectedCategory(cat.id);
                  }
                }}
                className={`group text-left rounded-2xl p-4 sm:p-5 transition-all active:scale-[0.99] flex flex-col justify-between gap-4 cursor-pointer min-h-[176px] border ${
                  isHighlighted
                    ? 'bg-[var(--surface)] border-[var(--accent)] shadow-sm'
                    : 'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--surface-2)]'
                }`}
              >
                <div className="flex items-start justify-between gap-2 w-full">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors shrink-0 ${
                      isHighlighted
                        ? 'bg-[var(--accent)] text-[var(--accent-on)]'
                        : 'bg-[var(--accent-soft)] border border-[var(--border)] text-[var(--accent-text)] group-hover:bg-[var(--accent)] group-hover:text-[var(--accent-on)]'
                    }`}
                  >
                    <Icon className="w-7 h-7" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent-text)] transition-colors shrink-0 mt-1" />
                </div>

                <div className="space-y-1">
                  <h3 className="font-display text-sm sm:text-base font-extrabold text-[var(--text-primary)] leading-snug">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                    {cat.subtitle}
                  </p>
                  <p
                    className={`text-xs pt-1.5 ${
                      catQty > 0
                        ? 'font-num text-[var(--accent-text)]'
                        : 'font-medium text-[var(--text-muted)]'
                    }`}
                  >
                    {catQty > 0
                      ? `${catQty} item(ns) · ${formatBRL(catSum)}`
                      : cat.id === 'telas'
                        ? `${screenCatalog.length} modelos · 4 marcas`
                        : 'Toque para adicionar'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Block 2: Quick Navigation Blocks */}
      <section aria-labelledby="quick-access-heading" className="space-y-3.5">
        <div className="flex items-baseline justify-between gap-4">
          <h2
            id="quick-access-heading"
            className="font-display text-lg sm:text-xl font-bold text-[var(--text-primary)]"
          >
            Acesso Rápido
          </h2>
          <span className="text-xs text-[var(--text-muted)] text-right">
            Atalhos do atendimento
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {quickActions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.id}
                type="button"
                onClick={act.onClick}
                className="group text-left rounded-2xl p-4 sm:p-5 bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--surface-2)] transition-all active:scale-[0.99] flex flex-col justify-between gap-3.5 cursor-pointer min-h-[144px]"
              >
                <div className="flex items-center justify-between gap-2 w-full">
                  <div className="w-12 h-12 rounded-xl bg-[var(--accent-soft)] border border-[var(--border)] text-[var(--accent-text)] group-hover:bg-[var(--accent)] group-hover:text-[var(--accent-on)] flex items-center justify-center transition-colors shrink-0">
                    <Icon className="w-6 h-6" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent-text)] shrink-0" />
                </div>

                <div className="space-y-0.5">
                  <h3 className="font-display text-sm sm:text-base font-bold text-[var(--text-primary)] leading-snug">
                    {act.title}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] line-clamp-1">
                    {act.subtitle}
                  </p>
                  <p className="text-[11px] font-num text-[var(--accent-text)] pt-1">
                    {act.meta}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Live Automatic Multi-Service Calculation Summary */}
      <section className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
          <div>
            <h2 className="font-display text-base font-bold text-[var(--text-primary)]">
              Cálculo Automático do Orçamento ({draftOrder.code})
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Cliente: <strong className="text-[var(--text-primary)]">{clientMap.get(draftOrder.clientId)?.name || clients[0]?.name || 'Não selecionado'}</strong> · O cálculo à vista e parcelado atualiza automaticamente
            </p>
          </div>
          <div className="flex items-center gap-4">
            {(draftOrder.items.length > 0 ||
              draftOrder.freeScreenProtector ||
              draftOrder.pickupDeliveryFee === 'taxa_10') && (
              <button
                type="button"
                onClick={onStartNewBudget}
                className="text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                Limpar
              </button>
            )}
            <button
              type="button"
              onClick={() => onNavigateTab('orcamento')}
              className="text-xs sm:text-sm font-semibold text-[var(--accent-text)] hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Editar &amp; Ver A4</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {(draftOrder.items.length > 0 ||
          draftOrder.freeScreenProtector ||
          draftTotals.pickupFee > 0) && (
          <div className="divide-y divide-[var(--border)]">
            {draftOrder.items.map((item) => (
              <div
                key={item.id}
                className="py-2.5 flex items-center justify-between gap-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-[var(--text-primary)] truncate">
                    <span className="font-num text-[var(--accent-text)] mr-1.5">
                      {item.qty}x
                    </span>
                    {item.name}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] font-num">
                    Peça: {formatBRL(item.partPrice * item.qty)} · Mão de Obra:{' '}
                    {formatBRL(item.laborPrice * item.qty)}
                  </p>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="font-num text-sm text-[var(--text-primary)]">
                    {formatBRL((item.partPrice + item.laborPrice) * item.qty)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveLineFromDraft(item.id)}
                    aria-label="Remover serviço"
                    className="min-h-[36px] min-w-[36px] rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {draftOrder.freeScreenProtector && (
              <div className="py-2.5 flex items-center justify-between gap-3 text-sm">
                <p className="font-semibold text-emerald-400 truncate">
                  {FREE_PROTECTOR_DESCRIPTION}
                </p>
                <span className="font-num text-xs text-emerald-400 shrink-0">
                  GRÁTIS (R$ 0,00)
                </span>
              </div>
            )}

            {draftTotals.pickupFee > 0 && (
              <div className="py-2.5 flex items-center justify-between gap-3 text-sm">
                <p className="font-semibold text-[var(--text-primary)] truncate">
                  Deslocamento — Busca do aparelho no endereço do cliente
                </p>
                <span className="font-num text-sm text-[var(--text-primary)] shrink-0">
                  {formatBRL(draftTotals.pickupFee)}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="rounded-xl bg-[var(--accent-soft)] border border-[var(--accent)] p-4">
            <p className="text-[11px] font-bold tracking-wide text-[var(--accent-text)] uppercase">
              Total À Vista (PIX / Dinheiro)
            </p>
            <p className="font-num text-2xl text-[var(--text-primary)] mt-1">
              {formatBRL(draftTotals.cashTotal)}
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-num">
              Desconto de {draftTotals.cashDiscountPercent}% aplicado nos serviços
              {draftTotals.pickupFee > 0
                ? ` · Deslocamento ${formatBRL(draftTotals.pickupFee)}`
                : ''}
            </p>
          </div>

          <div className="rounded-xl bg-[var(--surface-2)] border border-[var(--border-strong)] p-4">
            <p className="text-[11px] font-bold tracking-wide text-[var(--text-muted)] uppercase">
              Cartão de Crédito ({draftTotals.selectedInstallment.installments}x)
            </p>
            <p className="font-num text-2xl text-[var(--text-primary)] mt-1">
              {formatBRL(draftTotals.selectedInstallment.total)}
            </p>
            <p className="text-xs text-[var(--accent-text)] mt-0.5 font-num">
              {draftTotals.selectedInstallment.installments}x de{' '}
              {formatBRL(draftTotals.selectedInstallment.perInstallment)}
            </p>
          </div>
        </div>
      </section>

      {/* Active Work Orders Compact Overview */}
      <section className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <ClipboardList className="w-5 h-5 text-[var(--accent-text)]" />
            <h2 className="font-display text-base sm:text-lg font-bold text-[var(--text-primary)]">
              Ordens de Serviço Ativas
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('ordens')}
            className="text-xs sm:text-sm font-semibold text-[var(--accent-text)] hover:underline whitespace-nowrap shrink-0 cursor-pointer min-h-[40px] flex items-center"
          >
            Ver todas
          </button>
        </div>

        {activeOrders.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-[var(--text-muted)]">Nenhuma ordem de serviço em andamento.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {activeOrders.slice(0, 4).map((order) => {
              const client = clientMap.get(order.clientId);
              const totals = calculateBudgetTotals(
                order.items,
                order.cashDiscountPercent,
                store.cardRates,
                order.selectedInstallments,
                order.cardMode,
                getPickupFeeAmount(order.pickupDeliveryFee)
              );
              return (
                <div
                  key={order.id}
                  className="py-3.5 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                      <span className="font-num text-[var(--accent-text)]">
                        {order.code}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-medium text-[var(--text-secondary)]">
                        {STATUS_LABELS[order.status]}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate mt-0.5">
                      {order.deviceBrandModel || 'Aparelho não informado'}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] truncate">
                      {client?.name || 'Cliente Balcão'}
                      {order.deliveryForecast
                        ? ` · Previsão ${formatDateBR(order.deliveryForecast)}`
                        : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="font-num text-sm text-[var(--text-primary)]">
                        {formatBRL(totals.cashTotal)}
                      </p>
                      <p className="text-[11px] text-[var(--text-muted)]">à vista</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenOrderInBudget(order.id)}
                      aria-label={`Abrir orçamento PDF da ${order.code}`}
                      className="min-h-[44px] min-w-[44px] rounded-xl border border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] text-[var(--accent-text)] flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4-Brand TELAS Modal */}
      <ScreenCatalogModal
        open={screensModalOpen}
        onClose={() => setScreensModalOpen(false)}
        screens={screenCatalog}
        store={store}
        draftOrder={draftOrder}
        onSaveScreen={onSaveScreen}
        onDeleteScreen={onDeleteScreen}
        onAddScreenToBudget={onAddScreenToDraft}
        onOpenBudget={() => onNavigateTab('orcamento')}
      />

      {/* Multi-Service Picker Modal for other Categories */}
      {selectedCategory && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setSelectedCategory(null)}
        >
          <div
            className="bg-[var(--surface)] w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl shadow-xl border border-[var(--border-strong)] max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 sm:px-6 py-4 border-b border-[var(--border)] flex items-center justify-between gap-4">
              <div>
                <h3 className="font-display text-lg font-bold text-[var(--text-primary)]">
                  {CATEGORY_LABELS[selectedCategory]}
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Toque para somar um ou mais serviços ao orçamento atual
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                aria-label="Fechar janela"
                className="min-h-[44px] min-w-[44px] rounded-xl hover:bg-[var(--surface-hover)] flex items-center justify-center text-[var(--text-muted)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto divide-y divide-[var(--border)]">
              {categoryServices.map((srv) => {
                const total = srv.partPrice + srv.laborPrice;
                const addedCount = draftOrder.items
                  .filter((it) => it.serviceId === srv.id)
                  .reduce((acc, it) => acc + Math.max(1, it.qty), 0);

                return (
                  <div
                    key={srv.id}
                    className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">
                        {srv.name}
                        {addedCount > 0 && (
                          <span className="ml-2 text-xs font-num text-[var(--accent-text)]">
                            ({addedCount} adicionado)
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">{srv.description}</p>
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-1.5 text-xs text-[var(--text-secondary)] font-num">
                        <span>Peça: {formatBRL(srv.partPrice)}</span>
                        <span aria-hidden="true">·</span>
                        <span>Mão de obra: {formatBRL(srv.laborPrice)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <span className="font-num text-base text-[var(--accent-text)]">
                        {formatBRL(total)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onAddServiceToDraft(srv)}
                        className="min-h-[44px] px-4 py-2 rounded-xl bg-[var(--accent)] text-[var(--accent-on)] text-xs sm:text-sm font-semibold hover:bg-[var(--accent-hover)] whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Adicionar</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-5 sm:px-6 py-4 bg-[var(--surface-2)] border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs font-num text-[var(--text-primary)]">
                À Vista: {formatBRL(draftTotals.cashTotal)} · {draftTotals.selectedInstallment.installments}x{' '}
                {formatBRL(draftTotals.selectedInstallment.perInstallment)}
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory(null);
                  onNavigateTab('orcamento');
                }}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-[var(--accent)] text-[var(--accent-on)] text-sm font-semibold hover:bg-[var(--accent-hover)] whitespace-nowrap cursor-pointer"
              >
                Abrir Orçamento A4
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

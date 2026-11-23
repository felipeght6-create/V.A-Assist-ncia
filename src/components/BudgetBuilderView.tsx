import React, { useMemo, useState } from 'react';
import {
  Check,
  CreditCard,
  Download,
  Eye,
  FileText,
  MessageCircle,
  Plus,
  Printer,
  Save,
  Trash2,
  UserPlus,
  Wallet,
  X,
} from 'lucide-react';
import {
  BudgetLineItem,
  CardMode,
  Client,
  ServiceCategoryId,
  ServiceItem,
  StoreProfile,
  WorkOrder,
} from '../types';
import {
  CATEGORY_SHORT_LABELS,
  calculateBudgetTotals,
  formatBRL,
  generateId,
} from '../utils/format';
import { generateBudgetPDF } from '../utils/pdfGenerator';
import { A4PreviewSheet } from './A4PreviewSheet';

interface BudgetBuilderViewProps {
  draftOrder: WorkOrder;
  isExistingOrder: boolean;
  clients: Client[];
  services: ServiceItem[];
  store: StoreProfile;
  onChangeDraft: (order: WorkOrder) => void;
  onSaveAsWorkOrder: (order: WorkOrder) => void;
  onQuickCreateClient: (client: Client) => void;
}

export const BudgetBuilderView: React.FC<BudgetBuilderViewProps> = ({
  draftOrder,
  isExistingOrder,
  clients,
  services,
  store,
  onChangeDraft,
  onSaveAsWorkOrder,
  onQuickCreateClient,
}) => {
  const [mobileMode, setMobileMode] = useState<'edit' | 'preview'>('edit');
  const [catalogCat, setCatalogCat] = useState<'todos' | ServiceCategoryId>('todos');
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const [quickClientOpen, setQuickClientOpen] = useState(false);
  const [qcName, setQcName] = useState('');
  const [qcPhone, setQcPhone] = useState('');
  const [qcCpf, setQcCpf] = useState('');
  const [qcAddress, setQcAddress] = useState('');

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === draftOrder.clientId),
    [clients, draftOrder.clientId]
  );

  const totals = useMemo(
    () =>
      calculateBudgetTotals(
        draftOrder.items,
        draftOrder.cashDiscountPercent,
        store.cardRates,
        draftOrder.selectedInstallments,
        draftOrder.cardMode
      ),
    [
      draftOrder.items,
      draftOrder.cashDiscountPercent,
      store.cardRates,
      draftOrder.selectedInstallments,
      draftOrder.cardMode,
    ]
  );

  const filteredCatalog = useMemo(() => {
    if (catalogCat === 'todos') return services;
    return services.filter((s) => s.category === catalogCat);
  }, [services, catalogCat]);

  const addServiceToOrder = (srv: ServiceItem) => {
    const existingIdx = draftOrder.items.findIndex((it) => it.serviceId === srv.id);
    if (existingIdx >= 0) {
      const updated = [...draftOrder.items];
      updated[existingIdx] = {
        ...updated[existingIdx],
        qty: updated[existingIdx].qty + 1,
      };
      onChangeDraft({
        ...draftOrder,
        items: updated,
      });
      return;
    }
    const newItem: BudgetLineItem = {
      id: generateId('li'),
      serviceId: srv.id,
      name: srv.name,
      category: srv.category,
      qty: 1,
      partPrice: srv.partPrice,
      laborPrice: srv.laborPrice,
    };
    onChangeDraft({
      ...draftOrder,
      items: [...draftOrder.items, newItem],
    });
  };

  const addCustomLineItem = () => {
    const newItem: BudgetLineItem = {
      id: generateId('li'),
      name: 'Serviço / Peça Personalizada',
      category: 'celulares',
      qty: 1,
      partPrice: 0,
      laborPrice: 80,
    };
    onChangeDraft({
      ...draftOrder,
      items: [...draftOrder.items, newItem],
    });
  };

  const updateLineItem = (itemId: string, patch: Partial<BudgetLineItem>) => {
    onChangeDraft({
      ...draftOrder,
      items: draftOrder.items.map((it) =>
        it.id === itemId ? { ...it, ...patch } : it
      ),
    });
  };

  const removeLineItem = (itemId: string) => {
    onChangeDraft({
      ...draftOrder,
      items: draftOrder.items.filter((it) => it.id !== itemId),
    });
  };

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      await generateBudgetPDF(draftOrder, selectedClient, store);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleSaveOrder = () => {
    onSaveAsWorkOrder({
      ...draftOrder,
      updatedAt: new Date().toISOString(),
    });
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2200);
  };

  const handleShareWhatsApp = () => {
    const lines = [
      `*${store.name} — Orçamento ${draftOrder.code}*`,
      `Cliente: ${selectedClient?.name || 'Cliente'}`,
      `Equipamento: ${draftOrder.deviceBrandModel || '-'}`,
      '',
      '*Itens / Serviços:*',
      ...draftOrder.items.map(
        (it) =>
          `• ${it.qty}x ${it.name}: ${formatBRL((it.partPrice + it.laborPrice) * it.qty)} (Peça ${formatBRL(it.partPrice * it.qty)} + M.O. ${formatBRL(it.laborPrice * it.qty)})`
      ),
      '',
      `Total Peças: ${formatBRL(totals.partsSubtotal)}`,
      `Total Mão de Obra: ${formatBRL(totals.laborSubtotal)}`,
      `*À Vista (PIX/Dinheiro): ${formatBRL(totals.cashTotal)}*`,
      `*Cartão (${totals.selectedInstallment.installments}x): ${totals.selectedInstallment.installments}x de ${formatBRL(totals.selectedInstallment.perInstallment)} (Total ${formatBRL(totals.selectedInstallment.total)})*`,
      '',
      `Garantia: ${draftOrder.warrantyDays} dias.`,
    ];
    const phoneDigits = (selectedClient?.phone || '').replace(/\D/g, '');
    const waPrefix = phoneDigits.length >= 10 ? `https://wa.me/55${phoneDigits}` : 'https://wa.me/';
    const url = `${waPrefix}?text=${encodeURIComponent(lines.join('\n'))}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleQuickClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newClient: Client = {
      id: generateId('cli'),
      name: qcName.trim(),
      phone: qcPhone.trim(),
      email: '',
      cpfCnpj: qcCpf.trim(),
      address: qcAddress.trim(),
      notes: '',
      createdAt: new Date().toISOString(),
    };
    onQuickCreateClient(newClient);
    onChangeDraft({ ...draftOrder, clientId: newClient.id });
    setQcName('');
    setQcPhone('');
    setQcCpf('');
    setQcAddress('');
    setQuickClientOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Top Toolbar */}
      <div className="no-print flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4 sm:p-5">
        <div>
          <div className="flex items-center gap-2.5 text-xs text-[var(--text-muted)]">
            <span className="font-num font-bold text-[var(--accent-text)]">
              {draftOrder.code}
            </span>
            <span aria-hidden="true">·</span>
            <span>{isExistingOrder ? 'Editando OS Existente' : 'Novo Orçamento A4'}</span>
          </div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-[var(--text-primary)] mt-0.5">
            Orçamento &amp; Visualização A4
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleSaveOrder}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] text-xs sm:text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap cursor-pointer"
          >
            {savedFeedback ? (
              <>
                <Check className="w-4 h-4 text-[var(--accent-text)]" />
                <span className="text-[var(--accent-text)]">OS Salva</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-[var(--accent-text)]" />
                <span>{isExistingOrder ? 'Atualizar OS' : 'Salvar como OS'}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] text-xs sm:text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 text-[var(--accent-text)]" />
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="hidden sm:inline-flex min-h-[44px] px-4 py-2 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] text-xs sm:text-sm font-semibold items-center gap-2 whitespace-nowrap cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[var(--accent-text)]" />
            <span>Imprimir A4</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={pdfLoading}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-[var(--accent)] text-[var(--accent-on)] hover:bg-[var(--accent-hover)] active:scale-[0.98] transition-all text-xs sm:text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap cursor-pointer disabled:opacity-60"
          >
            <Download className="w-4 h-4" />
            <span>{pdfLoading ? 'Gerando...' : 'Baixar PDF (A4)'}</span>
          </button>
        </div>
      </div>

      {/* Mobile / Tablet Mode Switcher */}
      <div className="no-print xl:hidden flex items-center gap-1 p-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl">
        <button
          type="button"
          onClick={() => setMobileMode('edit')}
          className={`flex-1 min-h-[44px] px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer ${
            mobileMode === 'edit'
              ? 'bg-[var(--accent)] text-[var(--accent-on)] shadow-xs'
              : 'text-[var(--text-secondary)]'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Editar Valores</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileMode('preview')}
          className={`flex-1 min-h-[44px] px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer ${
            mobileMode === 'preview'
              ? 'bg-[var(--accent)] text-[var(--accent-on)] shadow-xs'
              : 'text-[var(--text-secondary)]'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>Visualizar PDF A4</span>
        </button>
      </div>

      {/* Main Two-Pane Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT PANE: Interactive Editor */}
        <div
          className={`no-print xl:col-span-6 space-y-5 ${
            mobileMode === 'preview' ? 'hidden xl:block' : 'block'
          }`}
        >
          {/* 1. Client & Device Card */}
          <section className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-base font-bold text-[var(--text-primary)]">
                1. Cliente e Equipamento
              </h2>
              <button
                type="button"
                onClick={() => setQuickClientOpen(true)}
                className="min-h-[38px] px-3 py-1.5 rounded-lg bg-[var(--accent-soft)] text-[var(--accent-text)] hover:opacity-85 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Novo Cliente</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Cliente
                </label>
                <select
                  value={draftOrder.clientId}
                  onChange={(e) =>
                    onChangeDraft({ ...draftOrder, clientId: e.target.value })
                  }
                  className="w-full min-h-[44px] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Aparelho / Marca e Modelo
                </label>
                <input
                  type="text"
                  value={draftOrder.deviceBrandModel}
                  onChange={(e) =>
                    onChangeDraft({ ...draftOrder, deviceBrandModel: e.target.value })
                  }
                  placeholder="Ex: iPhone 13 / Dell Inspiron 15"
                  className="w-full min-h-[44px] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Serial / IMEI
                </label>
                <input
                  type="text"
                  value={draftOrder.deviceSerial}
                  onChange={(e) =>
                    onChangeDraft({ ...draftOrder, deviceSerial: e.target.value })
                  }
                  placeholder="Opcional"
                  className="w-full min-h-[44px] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 font-num text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Defeito Relatado / Solicitação
                </label>
                <input
                  type="text"
                  value={draftOrder.reportedIssue}
                  onChange={(e) =>
                    onChangeDraft({ ...draftOrder, reportedIssue: e.target.value })
                  }
                  placeholder="Ex: Tela trincada, não carrega, Windows lento..."
                  className="w-full min-h-[44px] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Previsão de Entrega
                </label>
                <input
                  type="date"
                  value={draftOrder.deliveryForecast}
                  onChange={(e) =>
                    onChangeDraft({ ...draftOrder, deliveryForecast: e.target.value })
                  }
                  className="w-full min-h-[44px] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Garantia (dias)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={draftOrder.warrantyDays}
                    onChange={(e) =>
                      onChangeDraft({
                        ...draftOrder,
                        warrantyDays: Math.max(0, Number(e.target.value) || 0),
                      })
                    }
                    className="w-full min-h-[44px] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 font-num text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Validade (dias)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={draftOrder.validityDays}
                    onChange={(e) =>
                      onChangeDraft({
                        ...draftOrder,
                        validityDays: Math.max(1, Number(e.target.value) || 1),
                      })
                    }
                    className="w-full min-h-[44px] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 font-num text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* 2. Quick Service Picker + Editable Line Items */}
          <section className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-base font-bold text-[var(--text-primary)]">
                2. Peças, Serviços e Mão de Obra
              </h2>
              <button
                type="button"
                onClick={addCustomLineItem}
                className="min-h-[38px] px-3 py-1.5 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] text-xs font-semibold inline-flex items-center gap-1.5 border border-[var(--border)] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Item Avulso</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setCatalogCat('todos')}
                className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                  catalogCat === 'todos'
                    ? 'bg-[var(--accent)] text-[var(--accent-on)]'
                    : 'bg-[var(--surface-2)] text-[var(--text-secondary)]'
                }`}
              >
                Todos
              </button>
              {(Object.keys(CATEGORY_SHORT_LABELS) as ServiceCategoryId[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCatalogCat(cat)}
                  className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                    catalogCat === cat
                      ? 'bg-[var(--accent)] text-[var(--accent-on)]'
                      : 'bg-[var(--surface-2)] text-[var(--text-secondary)]'
                  }`}
                >
                  {CATEGORY_SHORT_LABELS[cat]}
                </button>
              ))}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {filteredCatalog.map((srv) => (
                <button
                  key={srv.id}
                  type="button"
                  onClick={() => addServiceToOrder(srv)}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] text-left shrink-0 transition-colors cursor-pointer"
                >
                  <p className="text-xs font-semibold text-[var(--text-primary)] whitespace-nowrap">
                    + {srv.name}
                  </p>
                  <p className="text-[11px] font-num text-[var(--accent-text)] tabular-nums">
                    {formatBRL(srv.partPrice + srv.laborPrice)}
                  </p>
                </button>
              ))}
            </div>

            <div className="space-y-3 pt-2">
              {draftOrder.items.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)] text-center py-6 border border-dashed border-[var(--border-strong)] rounded-xl">
                  Toque nos serviços acima para adicionar ao orçamento A4.
                </p>
              ) : (
                draftOrder.items.map((item) => {
                  const lineTotal =
                    (item.partPrice + item.laborPrice) * Math.max(1, item.qty);
                  return (
                    <div
                      key={item.id}
                      className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3.5 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) =>
                            updateLineItem(item.id, { name: e.target.value })
                          }
                          className="flex-1 min-h-[38px] rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-2.5 py-1 text-sm font-semibold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                        />
                        <button
                          type="button"
                          onClick={() => removeLineItem(item.id)}
                          aria-label="Remover item"
                          className="min-h-[38px] min-w-[38px] rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center shrink-0 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 items-end">
                        <div>
                          <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">
                            Qtd
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.qty}
                            onChange={(e) =>
                              updateLineItem(item.id, {
                                qty: Math.max(1, Number(e.target.value) || 1),
                              })
                            }
                            className="w-full min-h-[40px] rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-2.5 py-1 font-num text-sm text-[var(--text-primary)] tabular-nums focus:outline-none focus:border-[var(--accent)]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">
                            Peça (R$)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.partPrice}
                            onChange={(e) =>
                              updateLineItem(item.id, {
                                partPrice: Math.max(0, Number(e.target.value) || 0),
                              })
                            }
                            className="w-full min-h-[40px] rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-2.5 py-1 font-num text-sm text-[var(--text-primary)] tabular-nums focus:outline-none focus:border-[var(--accent)]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">
                            Mão Obra (R$)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.laborPrice}
                            onChange={(e) =>
                              updateLineItem(item.id, {
                                laborPrice: Math.max(0, Number(e.target.value) || 0),
                              })
                            }
                            className="w-full min-h-[40px] rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-2.5 py-1 font-num text-sm text-[var(--text-primary)] tabular-nums focus:outline-none focus:border-[var(--accent)]"
                          />
                        </div>

                        <div className="col-span-3 sm:col-span-1 text-right pb-1.5">
                          <span className="text-[11px] text-[var(--text-muted)] sm:hidden mr-2">
                            Subtotal:
                          </span>
                          <span className="font-num text-sm font-bold text-[var(--accent-text)] tabular-nums">
                            {formatBRL(lineTotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* 3. Payment Calculation: À Vista vs Cartão */}
          <section className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5 space-y-4">
            <h2 className="font-display text-base font-bold text-[var(--text-primary)]">
              3. Cálculo: À Vista e Cartão de Crédito
            </h2>

            <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-center tabular-nums">
              <div>
                <p className="text-[11px] text-[var(--text-muted)]">Peças</p>
                <p className="font-num text-sm font-bold text-[var(--text-primary)]">
                  {formatBRL(totals.partsSubtotal)}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[var(--text-muted)]">Mão de Obra</p>
                <p className="font-num text-sm font-bold text-[var(--text-primary)]">
                  {formatBRL(totals.laborSubtotal)}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[var(--text-muted)]">Bruto Total</p>
                <p className="font-num text-sm font-bold text-[var(--accent-text)]">
                  {formatBRL(totals.grossSubtotal)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* À Vista Settings */}
              <div className="rounded-xl border border-[var(--accent)] bg-[var(--accent-soft)] p-4 space-y-3">
                <div className="flex items-center gap-2 text-[var(--accent-text)] font-semibold text-sm">
                  <Wallet className="w-4 h-4" />
                  <span>À Vista (PIX / Dinheiro)</span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Desconto à Vista (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    step="0.5"
                    value={draftOrder.cashDiscountPercent}
                    onChange={(e) =>
                      onChangeDraft({
                        ...draftOrder,
                        cashDiscountPercent: Math.max(
                          0,
                          Math.min(50, Number(e.target.value) || 0)
                        ),
                      })
                    }
                    className="w-full min-h-[42px] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 font-num text-sm text-[var(--text-primary)] tabular-nums focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div className="pt-1 tabular-nums">
                  <p className="text-xs text-[var(--text-secondary)]">Valor Final À Vista:</p>
                  <p className="font-num text-xl font-bold text-[var(--text-primary)]">
                    {formatBRL(totals.cashTotal)}
                  </p>
                </div>
              </div>

              {/* Cartão Settings */}
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 space-y-3">
                <div className="flex items-center gap-2 text-[var(--text-primary)] font-semibold text-sm">
                  <CreditCard className="w-4 h-4 text-[var(--accent-text)]" />
                  <span>Cartão de Crédito</span>
                </div>

                <div className="flex items-center gap-1 p-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
                  <button
                    type="button"
                    onClick={() =>
                      onChangeDraft({ ...draftOrder, cardMode: 'com_taxa' as CardMode })
                    }
                    className={`flex-1 min-h-[34px] rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      draftOrder.cardMode === 'com_taxa'
                        ? 'bg-[var(--accent)] text-[var(--accent-on)] shadow-xs'
                        : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    Com Taxa
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onChangeDraft({ ...draftOrder, cardMode: 'sem_juros' as CardMode })
                    }
                    className={`flex-1 min-h-[34px] rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      draftOrder.cardMode === 'sem_juros'
                        ? 'bg-[var(--accent)] text-[var(--accent-on)] shadow-xs'
                        : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    Sem Juros
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Parcela em Destaque no PDF
                  </label>
                  <select
                    value={draftOrder.selectedInstallments}
                    onChange={(e) =>
                      onChangeDraft({
                        ...draftOrder,
                        selectedInstallments: Number(e.target.value) || 1,
                      })
                    }
                    className="w-full min-h-[42px] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 font-num text-sm text-[var(--text-primary)] tabular-nums focus:outline-none focus:border-[var(--accent)]"
                  >
                    {totals.installmentOptions.map((opt) => (
                      <option key={opt.installments} value={opt.installments}>
                        {opt.installments}x de {formatBRL(opt.perInstallment)} (Total{' '}
                        {formatBRL(opt.total)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-1 tabular-nums">
                  <p className="text-xs text-[var(--text-secondary)]">
                    Total em {totals.selectedInstallment.installments}x:
                  </p>
                  <p className="font-num text-lg font-bold text-[var(--text-primary)]">
                    {totals.selectedInstallment.installments}x{' '}
                    {formatBRL(totals.selectedInstallment.perInstallment)}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Observações Técnicas (exibidas no A4)
              </label>
              <textarea
                rows={2}
                value={draftOrder.technicianNotes}
                onChange={(e) =>
                  onChangeDraft({ ...draftOrder, technicianNotes: e.target.value })
                }
                placeholder="Ex: Aparelho entregue sem chip/cartão SD. Troca realizada com peça de primeira linha."
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
          </section>
        </div>

        {/* RIGHT PANE: Live A4 Preview */}
        <div
          className={`xl:col-span-6 space-y-3 ${
            mobileMode === 'edit' ? 'hidden xl:block' : 'block'
          }`}
        >
          <div className="no-print flex items-center justify-between text-xs text-[var(--text-muted)] px-1">
            <span className="font-semibold text-[var(--text-primary)]">
              Pré-visualização A4 (210 × 297 mm)
            </span>
            <span>Atualização em tempo real</span>
          </div>

          <div className="bg-[var(--surface-2)] p-2 sm:p-4 rounded-2xl border border-[var(--border)]">
            <A4PreviewSheet
              order={draftOrder}
              client={selectedClient}
              store={store}
            />
          </div>
        </div>
      </div>

      {/* Quick Inline Client Registration Modal */}
      {quickClientOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setQuickClientOpen(false)}
        >
          <form
            onSubmit={handleQuickClientSubmit}
            onClick={(e) => e.stopPropagation()}
            className="bg-[var(--surface)] w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-xl border border-[var(--border-strong)] overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-[var(--text-primary)]">
                Cadastro Rápido de Cliente
              </h3>
              <button
                type="button"
                onClick={() => setQuickClientOpen(false)}
                className="min-h-[44px] min-w-[44px] rounded-xl hover:bg-[var(--surface-hover)] flex items-center justify-center text-[var(--text-muted)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={qcName}
                  onChange={(e) => setQcName(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  WhatsApp / Telefone *
                </label>
                <input
                  type="text"
                  required
                  value={qcPhone}
                  onChange={(e) => setQcPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full min-h-[44px] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  CPF / CNPJ
                </label>
                <input
                  type="text"
                  value={qcCpf}
                  onChange={(e) => setQcCpf(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Endereço
                </label>
                <input
                  type="text"
                  value={qcAddress}
                  onChange={(e) => setQcAddress(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>
            <div className="px-5 py-4 bg-[var(--surface-2)] border-t border-[var(--border)] flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setQuickClientOpen(false)}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] text-sm font-semibold text-[var(--text-primary)] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="min-h-[44px] px-5 py-2 rounded-xl bg-[var(--accent)] text-[var(--accent-on)] text-sm font-semibold hover:bg-[var(--accent-hover)] cursor-pointer"
              >
                Cadastrar e Selecionar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

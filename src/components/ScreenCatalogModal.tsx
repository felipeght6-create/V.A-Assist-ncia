import React, { useMemo, useState } from 'react';
import {
  Check,
  Edit3,
  Plus,
  Search,
  ShieldCheck,
  Smartphone,
  Trash2,
  X,
} from 'lucide-react';
import {
  ScreenBrandId,
  ScreenCatalogItem,
  WorkOrder,
} from '../types';
import {
  SCREEN_BRANDS,
  SCREEN_WARRANTY_COVERAGE,
  SCREEN_WARRANTY_EXCLUSIONS,
  SCREEN_WARRANTY_LEGAL_NOTE,
} from '../data/seed';
import {
  SCREEN_BRAND_LABELS,
  formatBRL,
  generateId,
  getPickupFeeAmount,
  calculateBudgetTotals,
} from '../utils/format';
import { StoreProfile } from '../types';

interface ScreenBrandBadgeProps {
  brand: ScreenBrandId;
  active?: boolean;
}

export const ScreenBrandIcon: React.FC<ScreenBrandBadgeProps> = ({
  brand,
  active = false,
}) => {
  const baseClass = active
    ? 'bg-[var(--accent)] text-[var(--accent-on)]'
    : 'bg-[var(--accent-soft)] text-[var(--accent-text)] border border-[var(--border)]';

  if (brand === 'iphone') {
    return (
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${baseClass}`}>
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor" aria-hidden="true">
          <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.675.95 3.6.95.865 0 2.222-1.01 3.902-1.01.613 0 2.886.06 4.374 2.19-.13.09-2.383 1.37-2.383 4.19 0 3.26 2.854 4.42 2.955 4.45z" />
        </svg>
      </div>
    );
  }

  if (brand === 'samsung') {
    return (
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 font-display font-extrabold text-sm tracking-tight ${baseClass}`}>
        SAM
      </div>
    );
  }

  if (brand === 'motorola') {
    return (
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${baseClass}`}>
        <span className="w-7 h-7 rounded-full border-2 border-current flex items-center justify-center font-display font-extrabold text-sm leading-none">
          M
        </span>
      </div>
    );
  }

  return (
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 font-display font-extrabold text-sm tracking-tight ${baseClass}`}>
      mi
    </div>
  );
};

interface ScreenCatalogContentProps {
  screens: ScreenCatalogItem[];
  onSaveScreen: (item: ScreenCatalogItem) => void;
  onDeleteScreen: (id: string) => void;
  onAddScreenToBudget?: (item: ScreenCatalogItem) => void;
  draftOrder?: WorkOrder;
  initialBrand?: ScreenBrandId;
}

export const ScreenCatalogContent: React.FC<ScreenCatalogContentProps> = ({
  screens,
  onSaveScreen,
  onDeleteScreen,
  onAddScreenToBudget,
  draftOrder,
  initialBrand = 'iphone',
}) => {
  const [selectedBrand, setSelectedBrand] = useState<ScreenBrandId>(initialBrand);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ScreenCatalogItem | null>(null);

  const [fBrand, setFBrand] = useState<ScreenBrandId>(initialBrand);
  const [fModel, setFModel] = useState('');
  const [fType, setFType] = useState('');
  const [fPrice, setFPrice] = useState('');

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const [showWarrantyTerms, setShowWarrantyTerms] = useState(false);

  const countsByBrand = useMemo(() => {
    const map: Record<ScreenBrandId, number> = {
      iphone: 0,
      samsung: 0,
      motorola: 0,
      xiaomi: 0,
    };
    for (const item of screens) {
      map[item.brand] = (map[item.brand] || 0) + 1;
    }
    return map;
  }, [screens]);

  const brandScreens = useMemo(() => {
    const q = search.trim().toLowerCase();
    return screens
      .filter((item) => item.brand === selectedBrand)
      .filter((item) => {
        if (!q) return true;
        return (
          item.phoneModel.toLowerCase().includes(q) ||
          item.screenType.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.phoneModel.localeCompare(b.phoneModel, 'pt-BR'));
  }, [screens, selectedBrand, search]);

  const openNewForm = () => {
    setEditingItem(null);
    setFBrand(selectedBrand);
    setFModel('');
    setFType('');
    setFPrice('');
    setFormOpen(true);
  };

  const openEditForm = (item: ScreenCatalogItem) => {
    setEditingItem(item);
    setFBrand(item.brand);
    setFModel(item.phoneModel);
    setFType(item.screenType);
    setFPrice(String(item.price));
    setFormOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fModel.trim() || !fType.trim()) return;
    const saved: ScreenCatalogItem = {
      id: editingItem ? editingItem.id : generateId('scr'),
      brand: fBrand,
      phoneModel: fModel.trim(),
      screenType: fType.trim(),
      price: Math.max(0, Number(fPrice) || 0),
      warrantyDays: 90,
      createdAt: editingItem?.createdAt || new Date().toISOString(),
    };
    onSaveScreen(saved);
    setSelectedBrand(fBrand);
    setFormOpen(false);
    setEditingItem(null);
  };

  const handleAddToBudget = (item: ScreenCatalogItem) => {
    if (!onAddScreenToBudget) return;
    onAddScreenToBudget(item);
    setJustAddedId(item.id);
    setTimeout(() => {
      setJustAddedId((curr) => (curr === item.id ? null : curr));
    }, 1800);
  };

  const currentBrandMeta = SCREEN_BRANDS.find((b) => b.id === selectedBrand)!;

  return (
    <div className="space-y-4">
      {/* 4 Independent Brand Categories */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {SCREEN_BRANDS.map((b) => {
          const active = selectedBrand === b.id;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => {
                setSelectedBrand(b.id);
                setConfirmDeleteId(null);
                if (!editingItem) setFBrand(b.id);
              }}
              className={`rounded-2xl p-3 sm:p-3.5 border text-left transition-all flex items-center gap-3 cursor-pointer ${
                active
                  ? 'bg-[var(--surface-2)] border-[var(--accent)] shadow-xs'
                  : 'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--accent)]'
              }`}
            >
              <ScreenBrandIcon brand={b.id} active={active} />
              <div className="min-w-0">
                <p className="font-display text-sm font-bold text-[var(--text-primary)] truncate">
                  {b.label}
                </p>
                <p className="text-[11px] font-num text-[var(--text-muted)]">
                  {countsByBrand[b.id]}{' '}
                  {countsByBrand[b.id] === 1 ? 'modelo' : 'modelos'}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Brand Toolbar: Search + Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-[var(--surface-2)] rounded-xl border border-[var(--border)] p-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Buscar modelo ou tipo de tela ${currentBrandMeta.label}...`}
            className="w-full min-h-[42px] pl-9 pr-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
          />
        </div>
        <button
          type="button"
          onClick={openNewForm}
          className="min-h-[42px] px-4 py-2 rounded-lg bg-[var(--accent)] text-[var(--accent-on)] hover:bg-[var(--accent-hover)] text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Tela {currentBrandMeta.label}</span>
        </button>
      </div>

      {/* Register / Edit Screen Form */}
      {formOpen && (
        <form
          onSubmit={handleSaveForm}
          className="rounded-2xl border border-[var(--accent)] bg-[var(--surface-2)] p-4 space-y-3.5"
        >
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-display text-sm sm:text-base font-bold text-[var(--text-primary)]">
              {editingItem
                ? `Editar Tela — ${editingItem.phoneModel}`
                : `Novo Cadastro de Tela (${SCREEN_BRAND_LABELS[fBrand]})`}
            </h4>
            <button
              type="button"
              onClick={() => {
                setFormOpen(false);
                setEditingItem(null);
              }}
              aria-label="Cancelar cadastro"
              className="min-h-[36px] min-w-[36px] rounded-lg hover:bg-[var(--surface-hover)] flex items-center justify-center text-[var(--text-muted)] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Marca do Aparelho *
              </label>
              <select
                value={fBrand}
                onChange={(e) => setFBrand(e.target.value as ScreenBrandId)}
                className="w-full min-h-[42px] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
              >
                {SCREEN_BRANDS.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Modelo do Celular *
              </label>
              <input
                type="text"
                required
                value={fModel}
                onChange={(e) => setFModel(e.target.value)}
                placeholder="Ex: iPhone 13, Galaxy A54, Moto G54, Redmi Note 13"
                className="w-full min-h-[42px] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Modelo / Tipo da Tela Utilizada *
              </label>
              <input
                type="text"
                required
                value={fType}
                onChange={(e) => setFType(e.target.value)}
                placeholder="Ex: OLED Original, Super AMOLED, Incell Premium"
                className="w-full min-h-[42px] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Valor da Troca (R$) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={fPrice}
                  onChange={(e) => setFPrice(e.target.value)}
                  placeholder="0,00"
                  className="w-full min-h-[42px] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 font-num text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Garantia
                </label>
                <div className="w-full min-h-[42px] rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 font-num text-sm text-[var(--accent-text)] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>90 dias</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => {
                setFormOpen(false);
                setEditingItem(null);
              }}
              className="min-h-[40px] px-4 py-1.5 rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] text-xs font-semibold text-[var(--text-primary)] cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="min-h-[40px] px-5 py-1.5 rounded-xl bg-[var(--accent)] text-[var(--accent-on)] hover:bg-[var(--accent-hover)] text-xs font-semibold cursor-pointer"
            >
              {editingItem ? 'Salvar Alterações' : 'Salvar Cadastro'}
            </button>
          </div>
        </form>
      )}

      {/* List of Registered Models in Selected Brand */}
      {brandScreens.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface)] p-8 text-center space-y-3">
          <Smartphone className="w-9 h-9 text-[var(--accent-text)] mx-auto" />
          <div>
            <p className="font-display text-sm font-bold text-[var(--text-primary)]">
              Nenhuma tela encontrada em {currentBrandMeta.label}
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Cadastre novos modelos de {currentBrandMeta.label} e o tipo de tela para orçar em segundos.
            </p>
          </div>
          <button
            type="button"
            onClick={openNewForm}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-[var(--accent)] text-[var(--accent-on)] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Primeiro Modelo</span>
          </button>
        </div>
      ) : (
        <div className="divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          {brandScreens.map((item) => {
            const targetName = `Troca de Tela — ${SCREEN_BRAND_LABELS[item.brand]} ${item.phoneModel} (${item.screenType})`;
            const inBudgetQty = draftOrder
              ? draftOrder.items
                  .filter((it) => it.name === targetName)
                  .reduce((acc, it) => acc + Math.max(1, it.qty), 0)
              : 0;
            const isAdded = justAddedId === item.id;

            return (
              <div
                key={item.id}
                className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[var(--surface-2)]/60 transition-colors"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-[var(--accent-text)]">
                      {SCREEN_BRAND_LABELS[item.brand]}
                    </span>
                    <span aria-hidden="true" className="text-[var(--text-muted)]">·</span>
                    <h4 className="font-display text-sm sm:text-base font-bold text-[var(--text-primary)]">
                      {item.phoneModel}
                    </h4>
                    {inBudgetQty > 0 && (
                      <span className="text-xs font-num text-emerald-400">
                        ({inBudgetQty} no orçamento)
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[var(--text-secondary)]">
                    Tela: <strong className="text-[var(--text-primary)]">{item.screenType}</strong>
                    <span className="mx-2 text-[var(--text-muted)]">·</span>
                    <span className="inline-flex items-center gap-1 text-[var(--text-muted)]">
                      <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent-text)]" />
                      Garantia <span className="font-num text-[var(--text-primary)]">{item.warrantyDays || 90} dias</span>
                    </span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 shrink-0">
                  <span className="font-num text-base sm:text-lg text-[var(--accent-text)] mr-1">
                    {formatBRL(item.price)}
                  </span>

                  <button
                    type="button"
                    onClick={() => openEditForm(item)}
                    aria-label={`Editar ${item.phoneModel}`}
                    className="min-h-[38px] px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--accent)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>

                  {confirmDeleteId === item.id ? (
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteScreen(item.id);
                        setConfirmDeleteId(null);
                      }}
                      className="min-h-[38px] px-2.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirmar</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(item.id)}
                      aria-label={`Excluir ${item.phoneModel}`}
                      className="min-h-[38px] px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] hover:border-red-500/50 hover:text-red-400 text-xs font-medium text-[var(--text-muted)] inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Excluir</span>
                    </button>
                  )}

                  {onAddScreenToBudget && (
                    <button
                      type="button"
                      onClick={() => handleAddToBudget(item)}
                      className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
                        isAdded
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[var(--accent)] text-[var(--accent-on)] hover:bg-[var(--accent-hover)]'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Adicionada!</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>Orçar Tela</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Collapsible 90-Day Legal Warranty Rules */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3.5">
        <button
          type="button"
          onClick={() => setShowWarrantyTerms((v) => !v)}
          className="w-full flex items-center justify-between gap-2 text-left cursor-pointer"
        >
          <span className="inline-flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
            <ShieldCheck className="w-4 h-4 text-[var(--accent-text)] shrink-0" />
            <span>Regras da Garantia Legal de 90 Dias para Troca de Tela</span>
          </span>
          <span className="text-xs font-semibold text-[var(--accent-text)] shrink-0">
            {showWarrantyTerms ? 'Ocultar' : 'Ver regras'}
          </span>
        </button>

        {showWarrantyTerms && (
          <div className="mt-3 pt-3 border-t border-[var(--border)] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <p className="font-bold text-emerald-400">A garantia cobre:</p>
              <ul className="list-disc pl-4 space-y-0.5 text-[var(--text-secondary)]">
                {SCREEN_WARRANTY_COVERAGE.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            </div>
            <div className="space-y-1">
              <p className="font-bold text-rose-400">A garantia não cobre:</p>
              <ul className="list-disc pl-4 space-y-0.5 text-[var(--text-secondary)]">
                {SCREEN_WARRANTY_EXCLUSIONS.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            </div>
            <p className="sm:col-span-2 text-[11px] text-[var(--text-muted)] pt-1">
              {SCREEN_WARRANTY_LEGAL_NOTE}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

interface ScreenCatalogModalProps {
  open: boolean;
  onClose: () => void;
  screens: ScreenCatalogItem[];
  store: StoreProfile;
  draftOrder: WorkOrder;
  onSaveScreen: (item: ScreenCatalogItem) => void;
  onDeleteScreen: (id: string) => void;
  onAddScreenToBudget: (item: ScreenCatalogItem) => void;
  onOpenBudget: () => void;
  initialBrand?: ScreenBrandId;
}

export const ScreenCatalogModal: React.FC<ScreenCatalogModalProps> = ({
  open,
  onClose,
  screens,
  store,
  draftOrder,
  onSaveScreen,
  onDeleteScreen,
  onAddScreenToBudget,
  onOpenBudget,
  initialBrand = 'iphone',
}) => {
  if (!open) return null;

  const totals = calculateBudgetTotals(
    draftOrder.items,
    draftOrder.cashDiscountPercent,
    store.cardRates,
    draftOrder.selectedInstallments,
    draftOrder.cardMode,
    getPickupFeeAmount(draftOrder.pickupDeliveryFee)
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-[var(--surface)] w-full sm:max-w-3xl rounded-t-3xl sm:rounded-2xl shadow-2xl border border-[var(--border-strong)] max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 sm:px-6 py-4 border-b border-[var(--border)] flex items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-lg sm:text-xl font-bold text-[var(--text-primary)]">
              TELAS — Troca de Tela por Marca e Modelo
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Selecione a marca (iPhone, Samsung, Motorola ou Xiaomi), cadastre modelos e adicione ao orçamento com garantia de 90 dias
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar janela de telas"
            className="min-h-[44px] min-w-[44px] rounded-xl hover:bg-[var(--surface-hover)] flex items-center justify-center text-[var(--text-muted)] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <ScreenCatalogContent
            screens={screens}
            onSaveScreen={onSaveScreen}
            onDeleteScreen={onDeleteScreen}
            onAddScreenToBudget={onAddScreenToBudget}
            draftOrder={draftOrder}
            initialBrand={initialBrand}
          />
        </div>

        <div className="px-5 sm:px-6 py-4 bg-[var(--surface-2)] border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-num text-[var(--text-primary)]">
            À Vista: {formatBRL(totals.cashTotal)} · {totals.selectedInstallment.installments}x{' '}
            {formatBRL(totals.selectedInstallment.perInstallment)}
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenBudget();
            }}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-[var(--accent)] text-[var(--accent-on)] text-sm font-semibold hover:bg-[var(--accent-hover)] whitespace-nowrap cursor-pointer"
          >
            Abrir Orçamento A4
          </button>
        </div>
      </div>
    </div>
  );
};

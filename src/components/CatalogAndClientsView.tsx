import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Check,
  Edit3,
  FileText,
  Plus,
  Search,
  Trash2,
  Upload,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import {
  Client,
  ServiceCategoryId,
  ServiceItem,
  StoreProfile,
} from '../types';
import { CATEGORY_LABELS, formatBRL, generateId } from '../utils/format';
import { PWAAppInstallCard } from './PWAInstallBanner';

type SubTab = 'clientes' | 'servicos' | 'empresa';

interface CatalogAndClientsViewProps {
  clients: Client[];
  services: ServiceItem[];
  store: StoreProfile;
  initialSubTab?: SubTab | null;
  onClearInitialSubTab?: () => void;
  onSaveClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
  onSaveService: (service: ServiceItem) => void;
  onDeleteService: (id: string) => void;
  onUpdateStore: (store: StoreProfile) => void;
  onStartBudgetForClient: (clientId: string) => void;
  onStartBudgetForService: (service: ServiceItem) => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
  backupMessage?: string | null;
}

const SUBTAB_STORAGE_KEY = 'va_assistencia_catalog_subtab_v1';

export const CatalogAndClientsView: React.FC<CatalogAndClientsViewProps> = ({
  clients,
  services,
  store,
  initialSubTab,
  onClearInitialSubTab,
  onSaveClient,
  onDeleteClient,
  onSaveService,
  onDeleteService,
  onUpdateStore,
  onStartBudgetForClient,
  onStartBudgetForService,
  onExportBackup,
  onImportBackup,
  backupMessage,
}) => {
  const [subTab, setSubTab] = useState<SubTab>(() => {
    if (initialSubTab) return initialSubTab;
    try {
      const saved = sessionStorage.getItem(SUBTAB_STORAGE_KEY);
      if (saved === 'clientes' || saved === 'servicos' || saved === 'empresa') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'servicos';
  });
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<'todos' | ServiceCategoryId>('todos');
  const [clientSavedBanner, setClientSavedBanner] = useState<string | null>(null);

  useEffect(() => {
    if (initialSubTab) {
      setSubTab(initialSubTab);
      onClearInitialSubTab?.();
    }
  }, [initialSubTab, onClearInitialSubTab]);

  useEffect(() => {
    try {
      sessionStorage.setItem(SUBTAB_STORAGE_KEY, subTab);
    } catch {
      // ignore
    }
  }, [subTab]);

  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [cName, setCName] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cCpfCnpj, setCCpfCnpj] = useState('');
  const [cAddress, setCAddress] = useState('');
  const [cNotes, setCNotes] = useState('');

  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [sName, setSName] = useState('');
  const [sCategory, setSCategory] = useState<ServiceCategoryId>('telas');
  const [sDesc, setSDesc] = useState('');
  const [sPartPrice, setSPartPrice] = useState('0');
  const [sLaborPrice, setSLaborPrice] = useState('0');
  const [sWarranty, setSWarranty] = useState('90');
  const [sEstTime, setSEstTime] = useState('2 horas');

  const [storeSaved, setStoreSaved] = useState(false);

  const filteredClients = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.cpfCnpj.toLowerCase().includes(q)
    );
  }, [clients, search]);

  const filteredServices = useMemo(() => {
    const q = search.trim().toLowerCase();
    return services.filter((s) => {
      if (catFilter !== 'todos' && s.category !== catFilter) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
      );
    });
  }, [services, catFilter, search]);

  const openClientModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setCName(client.name);
      setCPhone(client.phone);
      setCEmail(client.email);
      setCCpfCnpj(client.cpfCnpj);
      setCAddress(client.address);
      setCNotes(client.notes);
    } else {
      setEditingClient(null);
      setCName('');
      setCPhone('');
      setCEmail('');
      setCCpfCnpj('');
      setCAddress('');
      setCNotes('');
    }
    setClientModalOpen(true);
  };

  const handleSaveClientForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName.trim()) return;
    const saved: Client = {
      id: editingClient ? editingClient.id : generateId('cli'),
      name: cName.trim(),
      phone: cPhone.trim(),
      email: cEmail.trim(),
      cpfCnpj: cCpfCnpj.trim(),
      address: cAddress.trim(),
      notes: cNotes.trim(),
      createdAt: editingClient ? editingClient.createdAt : new Date().toISOString(),
    };
    onSaveClient(saved);
    setSearch('');
    setClientModalOpen(false);
    setClientSavedBanner(`Cliente "${saved.name}" salvo no cadastro!`);
    setTimeout(() => setClientSavedBanner(null), 3500);
  };

  const openServiceModal = (srv?: ServiceItem) => {
    if (srv) {
      setEditingService(srv);
      setSName(srv.name);
      setSCategory(srv.category);
      setSDesc(srv.description);
      setSPartPrice(String(srv.partPrice));
      setSLaborPrice(String(srv.laborPrice));
      setSWarranty(String(srv.warrantyDays));
      setSEstTime(srv.estimatedTime);
    } else {
      setEditingService(null);
      setSName('');
      setSCategory(catFilter === 'todos' ? 'telas' : catFilter);
      setSDesc('');
      setSPartPrice('0');
      setSLaborPrice('0');
      setSWarranty(String(store.defaultWarrantyDays));
      setSEstTime('2 horas');
    }
    setServiceModalOpen(true);
  };

  const handleSaveServiceForm = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveService({
      id: editingService ? editingService.id : generateId('srv'),
      name: sName.trim(),
      category: sCategory,
      description: sDesc.trim(),
      partPrice: Math.max(0, Number(sPartPrice) || 0),
      laborPrice: Math.max(0, Number(sLaborPrice) || 0),
      warrantyDays: Math.max(0, Number(sWarranty) || 0),
      estimatedTime: sEstTime.trim() || 'A combinar',
    });
    setServiceModalOpen(false);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onUpdateStore({ ...store, logoUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
            Cadastros e Tabela de Valores
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Edite valores de peças e mão de obra, gerencie clientes e personalize os dados da sua loja no PDF
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl w-full md:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              setSubTab('servicos');
              setSearch('');
            }}
            className={`flex-1 md:flex-initial min-h-[42px] px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${
              subTab === 'servicos'
                ? 'bg-[var(--accent)] text-[var(--accent-on)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Serviços e Peças</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSubTab('clientes');
              setSearch('');
            }}
            className={`flex-1 md:flex-initial min-h-[42px] px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${
              subTab === 'clientes'
                ? 'bg-[var(--accent)] text-[var(--accent-on)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Clientes ({clients.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('empresa')}
            className={`flex-1 md:flex-initial min-h-[42px] px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${
              subTab === 'empresa'
                ? 'bg-[var(--accent)] text-[var(--accent-on)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Minha Empresa</span>
          </button>
        </div>
      </div>

      {/* TAB 1: SERVIÇOS E PEÇAS */}
      {subTab === 'servicos' && (
        <div className="space-y-4">
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar serviço ou acessório (ex: tela, conector, película 3D)..."
                  className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
              <button
                type="button"
                onClick={() => openServiceModal()}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[var(--accent)] text-[var(--accent-on)] text-sm font-semibold hover:bg-[var(--accent-hover)] inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Serviço / Item</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setCatFilter('todos')}
                className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                  catFilter === 'todos'
                    ? 'bg-[var(--accent)] text-[var(--accent-on)]'
                    : 'bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Todos ({services.length})
              </button>
              {(Object.keys(CATEGORY_LABELS) as ServiceCategoryId[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCatFilter(cat)}
                  className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                    catFilter === cat
                      ? 'bg-[var(--accent)] text-[var(--accent-on)]'
                      : 'bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {filteredServices.map((srv) => {
              const total = srv.partPrice + srv.laborPrice;
              return (
                <div
                  key={srv.id}
                  className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                      <span className="font-semibold text-[var(--accent-text)]">
                        {CATEGORY_LABELS[srv.category]}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>Garantia {srv.warrantyDays}d</span>
                      <span aria-hidden="true">·</span>
                      <span>{srv.estimatedTime}</span>
                    </div>
                    <h3 className="font-display text-base font-bold text-[var(--text-primary)]">
                      {srv.name}
                    </h3>
                    {srv.description && (
                      <p className="text-xs text-[var(--text-muted)]">{srv.description}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap sm:flex-nowrap items-end gap-3 shrink-0">
                    <div className="w-28">
                      <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">
                        Peça (R$)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={srv.partPrice}
                        onChange={(e) =>
                          onSaveService({
                            ...srv,
                            partPrice: Math.max(0, Number(e.target.value) || 0),
                          })
                        }
                        className="w-full min-h-[42px] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-2.5 py-1.5 font-num text-sm text-[var(--text-primary)] tabular-nums focus:outline-none focus:border-[var(--accent)]"
                      />
                    </div>

                    <div className="w-28">
                      <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">
                        Mão de Obra (R$)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={srv.laborPrice}
                        onChange={(e) =>
                          onSaveService({
                            ...srv,
                            laborPrice: Math.max(0, Number(e.target.value) || 0),
                          })
                        }
                        className="w-full min-h-[42px] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-2.5 py-1.5 font-num text-sm text-[var(--text-primary)] tabular-nums focus:outline-none focus:border-[var(--accent)]"
                      />
                    </div>

                    <div className="min-w-[100px] text-right pb-2">
                      <p className="text-[11px] text-[var(--text-muted)]">Total Base</p>
                      <p className="font-num text-base font-bold text-[var(--accent-text)] tabular-nums">
                        {formatBRL(total)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 pb-0.5">
                      <button
                        type="button"
                        onClick={() => onStartBudgetForService(srv)}
                        title="Gerar Orçamento com este item"
                        className="min-h-[42px] px-3 rounded-xl bg-[var(--accent-soft)] text-[var(--accent-text)] hover:bg-[var(--accent)] hover:text-[var(--accent-on)] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Orçar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openServiceModal(srv)}
                        aria-label="Editar serviço"
                        className="min-h-[42px] min-w-[42px] rounded-xl border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-secondary)] hover:text-[var(--accent-text)] flex items-center justify-center cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteService(srv.id)}
                        aria-label="Excluir serviço"
                        className="min-h-[42px] min-w-[42px] rounded-xl border border-[var(--border)] hover:border-red-400/50 text-[var(--text-muted)] hover:text-red-400 flex items-center justify-center cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: CLIENTES */}
      {subTab === 'clientes' && (
        <div className="space-y-4">
          {clientSavedBanner && (
            <div className="px-4 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-xs sm:text-sm font-semibold text-emerald-400 flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{clientSavedBanner}</span>
            </div>
          )}
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar cliente por nome, telefone ou CPF/CNPJ..."
                className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
            <button
              type="button"
              onClick={() => openClientModal()}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[var(--accent)] text-[var(--accent-on)] text-sm font-semibold hover:bg-[var(--accent-hover)] inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Cliente</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <h3 className="font-display text-base font-bold text-[var(--text-primary)]">
                    {client.name}
                  </h3>
                  <div className="text-xs text-[var(--text-secondary)] space-y-0.5">
                    <p>
                      <span className="text-[var(--text-muted)]">WhatsApp/Tel:</span>{' '}
                      <span className="font-medium text-[var(--text-primary)]">{client.phone || '-'}</span>
                    </p>
                    <p>
                      <span className="text-[var(--text-muted)]">CPF/CNPJ:</span>{' '}
                      <span className="font-num text-[var(--text-primary)]">{client.cpfCnpj || '-'}</span>
                    </p>
                    {client.address && (
                      <p>
                        <span className="text-[var(--text-muted)]">Endereço:</span> {client.address}
                      </p>
                    )}
                    {client.notes && (
                      <p className="text-[var(--text-muted)] pt-1">{client.notes}</p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openClientModal(client)}
                      className="min-h-[40px] px-3 py-1.5 rounded-xl border border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent-text)] inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteClient(client.id)}
                      aria-label="Excluir cliente"
                      className="min-h-[40px] min-w-[40px] rounded-xl text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onStartBudgetForClient(client.id)}
                    className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[var(--accent)] text-[var(--accent-on)] text-xs font-semibold hover:bg-[var(--accent-hover)] inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Novo Orçamento</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: MINHA EMPRESA */}
      {subTab === 'empresa' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
              <div>
                <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">
                  Dados da Assistência no PDF A4
                </h2>
                <p className="text-xs text-[var(--text-muted)]">
                  Estas informações aparecem automaticamente no cabeçalho e rodapé dos orçamentos em A4
                </p>
              </div>
              {storeSaved && (
                <span className="text-xs font-semibold text-[var(--accent-text)] inline-flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  Salvo
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
              <img
                src={store.logoUrl || '/assets/va-logo-circle.png'}
                alt={store.name}
                referrerPolicy="no-referrer"
                className="w-24 h-24 object-contain shrink-0"
              />
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[var(--text-primary)]">Logotipo da Empresa</p>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border-strong)] text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-hover)] inline-flex items-center gap-1.5 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Enviar outra logo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateStore({
                        ...store,
                        logoUrl: '/assets/va-logo-circle.png',
                      })
                    }
                    className="min-h-[40px] px-3 py-2 rounded-xl text-xs font-medium text-[var(--accent-text)] hover:bg-[var(--accent-soft)] cursor-pointer"
                  >
                    Usar logo V.A Assistência
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Nome da Empresa
                </label>
                <input
                  type="text"
                  value={store.name}
                  onChange={(e) => onUpdateStore({ ...store, name: e.target.value })}
                  className="w-full min-h-[44px] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  CNPJ ou CPF
                </label>
                <input
                  type="text"
                  value={store.cnpjCpf}
                  onChange={(e) => onUpdateStore({ ...store, cnpjCpf: e.target.value })}
                  className="w-full min-h-[44px] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Subtítulo / Especialidade
                </label>
                <input
                  type="text"
                  value={store.slogan}
                  onChange={(e) => onUpdateStore({ ...store, slogan: e.target.value })}
                  className="w-full min-h-[44px] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Telefone / WhatsApp
                </label>
                <input
                  type="text"
                  value={store.phone}
                  onChange={(e) => onUpdateStore({ ...store, phone: e.target.value })}
                  className="w-full min-h-[44px] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Chave PIX (exibida no A4)
                </label>
                <input
                  type="text"
                  value={store.pixKey}
                  onChange={(e) => onUpdateStore({ ...store, pixKey: e.target.value })}
                  className="w-full min-h-[44px] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Endereço
                </label>
                <input
                  type="text"
                  value={store.address}
                  onChange={(e) => onUpdateStore({ ...store, address: e.target.value })}
                  className="w-full min-h-[44px] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Bairro / Cidade - UF
                </label>
                <input
                  type="text"
                  value={store.cityState}
                  onChange={(e) => onUpdateStore({ ...store, cityState: e.target.value })}
                  className="w-full min-h-[44px] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Desconto Padrão À Vista (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  value={store.defaultCashDiscountPercent}
                  onChange={(e) =>
                    onUpdateStore({
                      ...store,
                      defaultCashDiscountPercent: Math.max(0, Math.min(50, Number(e.target.value) || 0)),
                    })
                  }
                  className="w-full min-h-[44px] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 font-num text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Garantia Padrão (dias)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={store.defaultWarrantyDays}
                    onChange={(e) =>
                      onUpdateStore({
                        ...store,
                        defaultWarrantyDays: Math.max(0, Number(e.target.value) || 0),
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
                    value={store.defaultValidityDays}
                    onChange={(e) =>
                      onUpdateStore({
                        ...store,
                        defaultValidityDays: Math.max(1, Number(e.target.value) || 1),
                      })
                    }
                    className="w-full min-h-[44px] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 font-num text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Termos de Garantia e Observações do Rodapé (PDF)
                </label>
                <textarea
                  rows={3}
                  value={store.footerNotes}
                  onChange={(e) => onUpdateStore({ ...store, footerNotes: e.target.value })}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setStoreSaved(true);
                  setTimeout(() => setStoreSaved(false), 2000);
                }}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[var(--accent)] text-[var(--accent-on)] text-sm font-semibold hover:bg-[var(--accent-hover)] cursor-pointer"
              >
                Salvar Alterações
              </button>
            </div>
          </div>

          {/* Card Machine Rates */}
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5 sm:p-6 space-y-4">
            <div>
              <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">
                Taxas da Maquininha (%)
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Percentual aplicado automaticamente no cálculo parcelado do orçamento
              </p>
            </div>

            <div className="space-y-2.5">
              {store.cardRates.map((rate, idx) => (
                <div
                  key={rate.installments}
                  className="flex items-center justify-between gap-3 py-1.5 border-b border-[var(--border)] last:border-0"
                >
                  <span className="text-sm font-semibold text-[var(--text-secondary)] tabular-nums">
                    {rate.installments}x no Cartão
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      max="60"
                      step="0.01"
                      value={rate.feePercent}
                      onChange={(e) => {
                        const updated = [...store.cardRates];
                        updated[idx] = {
                          ...rate,
                          feePercent: Math.max(0, Number(e.target.value) || 0),
                        };
                        onUpdateStore({ ...store, cardRates: updated });
                      }}
                      className="w-24 min-h-[38px] rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-2.5 py-1 text-right font-num text-sm text-[var(--text-primary)] tabular-nums focus:outline-none focus:border-[var(--accent)]"
                    />
                    <span className="text-xs text-[var(--text-muted)]">%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <PWAAppInstallCard
            onExportBackup={onExportBackup}
            onImportBackup={onImportBackup}
            backupMessage={backupMessage}
          />
        </div>
      )}

      {/* Client Modal */}
      {clientModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setClientModalOpen(false)}
        >
          <form
            onSubmit={handleSaveClientForm}
            onClick={(e) => e.stopPropagation()}
            className="bg-[var(--surface)] w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-xl border border-[var(--border-strong)] max-h-[90vh] flex flex-col overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">
                {editingClient ? 'Editar Cliente' : 'Cadastrar Cliente'}
              </h2>
              <button
                type="button"
                onClick={() => setClientModalOpen(false)}
                className="min-h-[44px] min-w-[44px] rounded-xl hover:bg-[var(--surface-hover)] flex items-center justify-center text-[var(--text-muted)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3.5 overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={cName}
                  onChange={(e) => setCName(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    WhatsApp / Telefone
                  </label>
                  <input
                    type="text"
                    value={cPhone}
                    onChange={(e) => setCPhone(e.target.value)}
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
                    value={cCpfCnpj}
                    onChange={(e) => setCCpfCnpj(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  value={cEmail}
                  onChange={(e) => setCEmail(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Endereço
                </label>
                <input
                  type="text"
                  value={cAddress}
                  onChange={(e) => setCAddress(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Observações
                </label>
                <textarea
                  rows={2}
                  value={cNotes}
                  onChange={(e) => setCNotes(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>
            <div className="px-5 py-4 bg-[var(--surface-2)] border-t border-[var(--border)] flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setClientModalOpen(false)}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] text-sm font-semibold text-[var(--text-primary)] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="min-h-[44px] px-5 py-2 rounded-xl bg-[var(--accent)] text-[var(--accent-on)] text-sm font-semibold hover:bg-[var(--accent-hover)] cursor-pointer"
              >
                Salvar Cliente
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Service Modal */}
      {serviceModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setServiceModalOpen(false)}
        >
          <form
            onSubmit={handleSaveServiceForm}
            onClick={(e) => e.stopPropagation()}
            className="bg-[var(--surface)] w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-xl border border-[var(--border-strong)] max-h-[90vh] flex flex-col overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">
                {editingService ? 'Editar Serviço / Item' : 'Novo Serviço ou Acessório'}
              </h2>
              <button
                type="button"
                onClick={() => setServiceModalOpen(false)}
                className="min-h-[44px] min-w-[44px] rounded-xl hover:bg-[var(--surface-hover)] flex items-center justify-center text-[var(--text-muted)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3.5 overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Nome do Serviço / Produto *
                </label>
                <input
                  type="text"
                  required
                  value={sName}
                  onChange={(e) => setSName(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Categoria
                </label>
                <select
                  value={sCategory}
                  onChange={(e) => setSCategory(e.target.value as ServiceCategoryId)}
                  className="w-full min-h-[44px] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                >
                  {(Object.keys(CATEGORY_LABELS) as ServiceCategoryId[]).map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORY_LABELS[cat]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Valor da Peça / Produto (R$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={sPartPrice}
                    onChange={(e) => setSPartPrice(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 font-num text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Valor da Mão de Obra (R$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={sLaborPrice}
                    onChange={(e) => setSLaborPrice(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 font-num text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Garantia (dias)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={sWarranty}
                    onChange={(e) => setSWarranty(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Tempo Estimado
                  </label>
                  <input
                    type="text"
                    value={sEstTime}
                    onChange={(e) => setSEstTime(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Descrição
                </label>
                <textarea
                  rows={2}
                  value={sDesc}
                  onChange={(e) => setSDesc(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>
            <div className="px-5 py-4 bg-[var(--surface-2)] border-t border-[var(--border)] flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setServiceModalOpen(false)}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] text-sm font-semibold text-[var(--text-primary)] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="min-h-[44px] px-5 py-2 rounded-xl bg-[var(--accent)] text-[var(--accent-on)] text-sm font-semibold hover:bg-[var(--accent-hover)] cursor-pointer"
              >
                Salvar Item
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

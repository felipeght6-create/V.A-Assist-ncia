import React, { useEffect, useState } from 'react';
import {
  CalendarClock,
  ClipboardList,
  FileText,
  FolderCog,
  Home,
} from 'lucide-react';
import {
  AppTab,
  Appointment,
  AppointmentStatus,
  Client,
  ServiceCategoryId,
  ServiceItem,
  StoreProfile,
  ThemeId,
  WorkOrder,
  WorkOrderStatus,
} from './types';
import {
  DEFAULT_STORE_PROFILE,
  INITIAL_APPOINTMENTS,
  INITIAL_CLIENTS,
  INITIAL_SERVICES,
  INITIAL_WORK_ORDERS,
} from './data/seed';
import {
  addDaysYMD,
  generateId,
  getTodayYMD,
} from './utils/format';
import { HomeDashboard } from './components/HomeDashboard';
import { WorkOrdersView } from './components/WorkOrdersView';
import { ScheduleView } from './components/ScheduleView';
import { BudgetBuilderView } from './components/BudgetBuilderView';
import { CatalogAndClientsView } from './components/CatalogAndClientsView';
import { ThemeSwitcher } from './components/ThemeSwitcher';
import {
  OfflineIndicator,
  PWAInstallMobilePrompt,
  PWAInstallSidebarButton,
} from './components/PWAInstallBanner';

const STORAGE_KEYS = {
  store: 'va_assistencia_store_v1',
  services: 'va_assistencia_services_v1',
  clients: 'va_assistencia_clients_v1',
  orders: 'va_assistencia_orders_v1',
  appointments: 'va_assistencia_appointments_v1',
  theme: 'va_assistencia_theme_v1',
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('inicio');
  const [theme, setTheme] = useState<ThemeId>(() =>
    loadFromStorage<ThemeId>(STORAGE_KEYS.theme, 'charcoal')
  );

  const [store, setStore] = useState<StoreProfile>(() => {
    const loaded = loadFromStorage(STORAGE_KEYS.store, DEFAULT_STORE_PROFILE);
    if (
      !loaded.logoUrl ||
      loaded.logoUrl === '/assets/aistudio/image_ba600ce3.png' ||
      loaded.logoUrl === '/assets/va-logo-transparent.png'
    ) {
      return { ...loaded, logoUrl: DEFAULT_STORE_PROFILE.logoUrl };
    }
    return loaded;
  });

  const [services, setServices] = useState<ServiceItem[]>(() =>
    loadFromStorage(STORAGE_KEYS.services, INITIAL_SERVICES)
  );
  const [clients, setClients] = useState<Client[]>(() =>
    loadFromStorage(STORAGE_KEYS.clients, INITIAL_CLIENTS)
  );
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(() =>
    loadFromStorage(STORAGE_KEYS.orders, INITIAL_WORK_ORDERS)
  );
  const [appointments, setAppointments] = useState<Appointment[]>(() =>
    loadFromStorage(STORAGE_KEYS.appointments, INITIAL_APPOINTMENTS)
  );

  const [schedulePresetCategory, setSchedulePresetCategory] =
    useState<ServiceCategoryId | null>(null);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
    }
    localStorage.setItem(STORAGE_KEYS.theme, JSON.stringify(theme));
  }, [theme]);

  const createBlankOrder = (overrides?: Partial<WorkOrder>): WorkOrder => {
    const nextNum = 1024 + workOrders.length + 1;
    const today = getTodayYMD();
    return {
      id: generateId('os'),
      code: `OS-${nextNum}`,
      clientId: clients[0]?.id ?? '',
      deviceBrandModel: '',
      deviceSerial: '',
      reportedIssue: '',
      technicianNotes: '',
      checklist: {
        turnsOn: true,
        screenIntact: true,
        chargingPortOk: true,
        passwordNote: '',
      },
      status: 'orcamento',
      items: [],
      cashDiscountPercent: store.defaultCashDiscountPercent,
      cardMode: 'com_taxa',
      selectedInstallments: 3,
      warrantyDays: store.defaultWarrantyDays,
      validityDays: store.defaultValidityDays,
      deliveryForecast: addDaysYMD(today, 1),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides,
    };
  };

  const [draftOrder, setDraftOrder] = useState<WorkOrder>(() =>
    INITIAL_WORK_ORDERS[0]
      ? { ...INITIAL_WORK_ORDERS[0] }
      : createBlankOrder()
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.store, JSON.stringify(store));
  }, [store]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.services, JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.clients, JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(workOrders));
  }, [workOrders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.appointments, JSON.stringify(appointments));
  }, [appointments]);

  const isExistingDraft = workOrders.some((o) => o.id === draftOrder.id);

  // Automatic multi-service add (sums quantity if already added or appends new line)
  const handleAddServiceToDraft = (srv: ServiceItem) => {
    setDraftOrder((prev) => {
      const existingIdx = prev.items.findIndex((it) => it.serviceId === srv.id);
      if (existingIdx >= 0) {
        const updated = [...prev.items];
        updated[existingIdx] = {
          ...updated[existingIdx],
          qty: updated[existingIdx].qty + 1,
        };
        return { ...prev, items: updated };
      }
      return {
        ...prev,
        items: [
          ...prev.items,
          {
            id: generateId('li'),
            serviceId: srv.id,
            name: srv.name,
            category: srv.category,
            qty: 1,
            partPrice: srv.partPrice,
            laborPrice: srv.laborPrice,
          },
        ],
      };
    });
  };

  const handleRemoveLineFromDraft = (lineId: string) => {
    setDraftOrder((prev) => ({
      ...prev,
      items: prev.items.filter((it) => it.id !== lineId),
    }));
  };

  const handleStartBudgetWithService = (srv?: ServiceItem) => {
    if (srv) {
      setDraftOrder(
        createBlankOrder({
          items: [
            {
              id: generateId('li'),
              serviceId: srv.id,
              name: srv.name,
              category: srv.category,
              qty: 1,
              partPrice: srv.partPrice,
              laborPrice: srv.laborPrice,
            },
          ],
          warrantyDays: srv.warrantyDays,
        })
      );
    } else {
      setDraftOrder(createBlankOrder());
    }
    setActiveTab('orcamento');
  };

  const handleOpenOrderInBudget = (orderId: string) => {
    const found = workOrders.find((o) => o.id === orderId);
    if (found) {
      setDraftOrder({ ...found, items: found.items.map((i) => ({ ...i })) });
      setActiveTab('orcamento');
    }
  };

  const handleSaveAsWorkOrder = (order: WorkOrder) => {
    setWorkOrders((prev) => {
      const exists = prev.some((o) => o.id === order.id);
      if (exists) {
        return prev.map((o) => (o.id === order.id ? order : o));
      }
      return [order, ...prev];
    });
  };

  const handleUpdateOrderStatus = (orderId: string, status: WorkOrderStatus) => {
    setWorkOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, status, updatedAt: new Date().toISOString() } : o
      )
    );
  };

  const handleUpdateOrderNotes = (orderId: string, technicianNotes: string) => {
    setWorkOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, technicianNotes, updatedAt: new Date().toISOString() }
          : o
      )
    );
  };

  const handleDeleteOrder = (orderId: string) => {
    setWorkOrders((prev) => prev.filter((o) => o.id !== orderId));
  };

  const handleSaveAppointment = (apt: Appointment) => {
    setAppointments((prev) => {
      const exists = prev.some((a) => a.id === apt.id);
      if (exists) {
        return prev.map((a) => (a.id === apt.id ? apt : a));
      }
      return [apt, ...prev];
    });
  };

  const handleUpdateAppointmentStatus = (id: string, status: AppointmentStatus) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );
  };

  const handleDeleteAppointment = (id: string) => {
    setAppointments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleConvertAppointmentToBudget = (apt: Appointment) => {
    const matchingSrv = services.find((s) => s.category === apt.category);
    const newOrder = createBlankOrder({
      clientId: apt.clientId,
      deviceBrandModel: apt.deviceBrandModel,
      reportedIssue: apt.serviceSummary,
      technicianNotes: apt.notes,
      deliveryForecast: apt.date,
      items: matchingSrv
        ? [
            {
              id: generateId('li'),
              serviceId: matchingSrv.id,
              name: matchingSrv.name,
              category: matchingSrv.category,
              qty: 1,
              partPrice: matchingSrv.partPrice,
              laborPrice: matchingSrv.laborPrice,
            },
          ]
        : [],
    });
    setDraftOrder(newOrder);
    setActiveTab('orcamento');
  };

  const handleSaveClient = (client: Client) => {
    setClients((prev) => {
      const exists = prev.some((c) => c.id === client.id);
      if (exists) {
        return prev.map((c) => (c.id === client.id ? client : c));
      }
      return [client, ...prev];
    });
  };

  const handleDeleteClient = (id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
  };

  const handleSaveService = (srv: ServiceItem) => {
    setServices((prev) => {
      const exists = prev.some((s) => s.id === srv.id);
      if (exists) {
        return prev.map((s) => (s.id === srv.id ? srv : s));
      }
      return [srv, ...prev];
    });
  };

  const handleDeleteService = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  const handleExportBackup = () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      store,
      services,
      clients,
      workOrders,
      appointments,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `va-assistencia-backup-${getTodayYMD()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupMessage('Backup exportado com sucesso!');
    setTimeout(() => setBackupMessage(null), 3500);
  };

  const handleImportBackup = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}'));
        if (parsed.store) setStore(parsed.store);
        if (Array.isArray(parsed.services)) setServices(parsed.services);
        if (Array.isArray(parsed.clients)) setClients(parsed.clients);
        if (Array.isArray(parsed.workOrders)) setWorkOrders(parsed.workOrders);
        if (Array.isArray(parsed.appointments)) setAppointments(parsed.appointments);
        setBackupMessage('Backup restaurado com sucesso neste dispositivo!');
        setTimeout(() => setBackupMessage(null), 4000);
      } catch {
        setBackupMessage('Arquivo inválido. Selecione um backup JSON da V.A Assistência.');
        setTimeout(() => setBackupMessage(null), 4000);
      }
    };
    reader.readAsText(file);
  };

  const navItems: {
    id: AppTab;
    label: string;
    shortLabel: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'inicio', label: 'Início', shortLabel: 'Início', icon: Home },
    { id: 'orcamento', label: 'Orçamento A4', shortLabel: 'Orçamento', icon: FileText },
    { id: 'ordens', label: 'Ordens de Serviço', shortLabel: 'Ordens', icon: ClipboardList },
    { id: 'agenda', label: 'Agendamentos', shortLabel: 'Agenda', icon: CalendarClock },
    { id: 'cadastros', label: 'Configurações', shortLabel: 'Config.', icon: FolderCog },
  ];

  const activeNav = navItems.find((n) => n.id === activeTab);

  return (
    <div className="min-h-screen text-[var(--text-primary)] flex flex-col lg:flex-row">
      {/* Desktop / Landscape Tablet Sidebar */}
      <aside className="no-print hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-[var(--surface)] border-r border-[var(--border)] z-30">
        <div className="px-5 py-5 border-b border-[var(--border)] flex items-center justify-center">
          {store.logoUrl ? (
            <img
              src={store.logoUrl}
              alt={store.name}
              referrerPolicy="no-referrer"
              className="w-20 h-20 object-contain drop-shadow-sm"
            />
          ) : (
            <span className="font-display font-extrabold text-base text-[var(--text-primary)] truncate">
              {store.name}
            </span>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full min-h-[46px] px-3.5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-3 transition-colors whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-[var(--accent)] text-[var(--accent-on)] shadow-xs'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <PWAInstallSidebarButton />
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Desktop Discreet Top Bar: ONLY Section Title + Discreet Theme Button (no extra button next to Tema) */}
        <header className="no-print hidden lg:flex sticky top-0 z-20 h-14 bg-[var(--nav-bg)] backdrop-blur-md border-b border-[var(--border)] px-8 items-center justify-between gap-6">
          <span className="text-sm font-semibold text-[var(--text-secondary)] whitespace-nowrap">
            {activeNav?.label}
          </span>

          <ThemeSwitcher currentTheme={theme} onSelectTheme={setTheme} />
        </header>

        {/* Mobile / Tablet Compact Top Bar: ONLY Logo + Discreet Theme Button */}
        <header className="no-print lg:hidden sticky top-0 z-30 h-14 bg-[var(--nav-bg)] backdrop-blur-md border-b border-[var(--border)] px-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('inicio')}
            className="flex items-center min-w-0 cursor-pointer"
          >
            {store.logoUrl ? (
              <img
                src={store.logoUrl}
                alt={store.name}
                referrerPolicy="no-referrer"
                className="w-10 h-10 object-contain shrink-0"
              />
            ) : (
              <span className="font-display font-extrabold text-sm text-[var(--text-primary)]">
                {store.name}
              </span>
            )}
          </button>

          <ThemeSwitcher currentTheme={theme} onSelectTheme={setTheme} />
        </header>

        {/* Viewport Content */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 pb-24 lg:pb-10">
          <OfflineIndicator />
          {activeTab === 'inicio' && (
            <HomeDashboard
              store={store}
              services={services}
              clients={clients}
              workOrders={workOrders}
              draftOrder={draftOrder}
              onAddServiceToDraft={handleAddServiceToDraft}
              onRemoveLineFromDraft={handleRemoveLineFromDraft}
              onStartNewBudget={() => setDraftOrder(createBlankOrder())}
              onOpenOrderInBudget={handleOpenOrderInBudget}
              onNavigateTab={(t) => setActiveTab(t)}
            />
          )}

          {activeTab === 'ordens' && (
            <WorkOrdersView
              workOrders={workOrders}
              clients={clients}
              store={store}
              onUpdateStatus={handleUpdateOrderStatus}
              onUpdateNotes={handleUpdateOrderNotes}
              onOpenInBudget={handleOpenOrderInBudget}
              onCreateNewOrder={() => handleStartBudgetWithService()}
              onDeleteOrder={handleDeleteOrder}
            />
          )}

          {activeTab === 'agenda' && (
            <ScheduleView
              appointments={appointments}
              clients={clients}
              initialOpenModalCategory={schedulePresetCategory}
              onClearInitialModal={() => setSchedulePresetCategory(null)}
              onSaveAppointment={handleSaveAppointment}
              onUpdateStatus={handleUpdateAppointmentStatus}
              onDeleteAppointment={handleDeleteAppointment}
              onConvertToBudget={handleConvertAppointmentToBudget}
            />
          )}

          {activeTab === 'orcamento' && (
            <BudgetBuilderView
              draftOrder={draftOrder}
              isExistingOrder={isExistingDraft}
              clients={clients}
              services={services}
              store={store}
              onChangeDraft={setDraftOrder}
              onSaveAsWorkOrder={handleSaveAsWorkOrder}
              onQuickCreateClient={handleSaveClient}
            />
          )}

          {activeTab === 'cadastros' && (
            <CatalogAndClientsView
              clients={clients}
              services={services}
              store={store}
              onSaveClient={handleSaveClient}
              onDeleteClient={handleDeleteClient}
              onSaveService={handleSaveService}
              onDeleteService={handleDeleteService}
              onUpdateStore={setStore}
              onStartBudgetForClient={(clientId) => {
                setDraftOrder(createBlankOrder({ clientId }));
                setActiveTab('orcamento');
              }}
              onStartBudgetForService={(srv) => handleStartBudgetWithService(srv)}
              onExportBackup={handleExportBackup}
              onImportBackup={handleImportBackup}
              backupMessage={backupMessage}
            />
          )}
        </main>
      </div>

      <PWAInstallMobilePrompt />

      {/* Mobile / Portrait Tablet Bottom Tab Bar (64px) */}
      <nav
        aria-label="Navegação principal"
        className="no-print lg:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-[var(--nav-bg)] backdrop-blur-md border-t border-[var(--border)] grid grid-cols-5 items-center"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`h-full flex flex-col items-center justify-center gap-0.5 px-1 transition-colors cursor-pointer ${
                active
                  ? 'text-[var(--accent-text)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-semibold tracking-tight whitespace-nowrap truncate max-w-full">
                {item.shortLabel}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

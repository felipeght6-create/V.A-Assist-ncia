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
  ScreenCatalogItem,
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
  INITIAL_SCREEN_CATALOG,
  INITIAL_SERVICES,
  INITIAL_WORK_ORDERS,
} from './data/seed';
import {
  SCREEN_BRAND_LABELS,
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
  screenCatalog: 'va_assistencia_screen_catalog_v1',
  clients: 'va_assistencia_clients_v1',
  orders: 'va_assistencia_orders_v1',
  appointments: 'va_assistencia_appointments_v1',
  draft: 'va_assistencia_draft_v1',
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

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage quota errors
  }
}

const ZERO_ALL_CLIENTS_V2_KEY = 'va_assistencia_zero_all_clients_v2';

function ensureCleanClientsResetOnce() {
  try {
    if (!localStorage.getItem(ZERO_ALL_CLIENTS_V2_KEY)) {
      saveToStorage(STORAGE_KEYS.clients, []);
      saveToStorage(STORAGE_KEYS.orders, []);
      saveToStorage(STORAGE_KEYS.appointments, []);
      localStorage.removeItem(STORAGE_KEYS.draft);
      localStorage.setItem(ZERO_ALL_CLIENTS_V2_KEY, '1');
    }
  } catch {
    // ignore storage errors
  }
}

export default function App() {
  ensureCleanClientsResetOnce();

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
  const [screenCatalog, setScreenCatalog] = useState<ScreenCatalogItem[]>(() =>
    loadFromStorage(STORAGE_KEYS.screenCatalog, INITIAL_SCREEN_CATALOG)
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
  const [catalogInitialSubTab, setCatalogInitialSubTab] =
    useState<'servicos' | 'telas' | 'clientes' | 'empresa' | null>(null);
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
    const warrantyDays = store.defaultWarrantyDays || 90;
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
      freeScreenProtector: false,
      pickupDeliveryFee: 'gratis',
      cashDiscountPercent: store.defaultCashDiscountPercent,
      cardMode: 'sem_juros',
      selectedInstallments: 3,
      warrantyDays,
      warrantyStartDate: today,
      warrantyEndDate: addDaysYMD(today, warrantyDays),
      validityDays: store.defaultValidityDays,
      deliveryForecast: addDaysYMD(today, 1),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides,
    };
  };

  const [draftOrder, setDraftOrder] = useState<WorkOrder>(() => {
    const storedDraft = loadFromStorage<WorkOrder | null>(STORAGE_KEYS.draft, null);
    if (storedDraft) return storedDraft;
    return createBlankOrder();
  });

  // Keep draftOrder.clientId valid whenever clients list changes
  useEffect(() => {
    const valid = clients.some((c) => c.id === draftOrder.clientId);
    if (!valid) {
      const fallbackId = clients[0]?.id ?? '';
      if (draftOrder.clientId !== fallbackId) {
        setDraftOrder((prev) => {
          if (clients.some((c) => c.id === prev.clientId)) return prev;
          const next = { ...prev, clientId: clients[0]?.id ?? '' };
          saveToStorage(STORAGE_KEYS.draft, next);
          return next;
        });
      }
    }
  }, [clients, draftOrder.clientId]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.store, store);
  }, [store]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.services, services);
  }, [services]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.screenCatalog, screenCatalog);
  }, [screenCatalog]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.clients, clients);
  }, [clients]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.orders, workOrders);
  }, [workOrders]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.appointments, appointments);
  }, [appointments]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.draft, draftOrder);
  }, [draftOrder]);

  const isExistingDraft = workOrders.some((o) => o.id === draftOrder.id);

  const orderHasContent = (order: WorkOrder): boolean =>
    order.items.length > 0 ||
    order.deviceBrandModel.trim() !== '' ||
    order.reportedIssue.trim() !== '' ||
    order.technicianNotes.trim() !== '';

  const syncOrderToWorkOrders = (order: WorkOrder) => {
    if (!order.clientId || !orderHasContent(order)) return;
    const stamped: WorkOrder = { ...order, updatedAt: new Date().toISOString() };
    setWorkOrders((prev) => {
      const exists = prev.some((o) => o.id === stamped.id);
      const next = exists
        ? prev.map((o) => (o.id === stamped.id ? stamped : o))
        : [stamped, ...prev];
      saveToStorage(STORAGE_KEYS.orders, next);
      return next;
    });
  };

  const handleChangeDraft = (nextOrder: WorkOrder) => {
    const stamped = { ...nextOrder, updatedAt: new Date().toISOString() };
    setDraftOrder(stamped);
    saveToStorage(STORAGE_KEYS.draft, stamped);
    syncOrderToWorkOrders(stamped);
  };

  const handleSwitchDraftClient = (newClientId: string) => {
    if (!newClientId) {
      handleChangeDraft({ ...draftOrder, clientId: '' });
      return;
    }
    if (!draftOrder.clientId) {
      // User added items before selecting a client: attach them to this client and save
      handleChangeDraft({ ...draftOrder, clientId: newClientId });
      return;
    }
    if (draftOrder.clientId === newClientId) return;

    // Ensure current client's order is saved before switching
    syncOrderToWorkOrders(draftOrder);

    // Load the selected client's latest saved order, or start a fresh order for them
    const clientOrders = workOrders
      .filter((o) => o.clientId === newClientId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    if (clientOrders[0]) {
      const loaded = {
        ...clientOrders[0],
        items: clientOrders[0].items.map((i) => ({ ...i })),
      };
      setDraftOrder(loaded);
      saveToStorage(STORAGE_KEYS.draft, loaded);
    } else {
      const fresh = createBlankOrder({ clientId: newClientId });
      setDraftOrder(fresh);
      saveToStorage(STORAGE_KEYS.draft, fresh);
    }
  };

  // Automatic multi-service add (sums quantity if already added or appends new line)
  const handleAddServiceToDraft = (srv: ServiceItem) => {
    setDraftOrder((prev) => {
      const existingIdx = prev.items.findIndex((it) => it.serviceId === srv.id);
      const nextItems =
        existingIdx >= 0
          ? prev.items.map((it, idx) =>
              idx === existingIdx ? { ...it, qty: it.qty + 1 } : it
            )
          : [
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
            ];
      const next: WorkOrder = {
        ...prev,
        items: nextItems,
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(STORAGE_KEYS.draft, next);
      syncOrderToWorkOrders(next);
      return next;
    });
  };

  const handleAddScreenToDraft = (screen: ScreenCatalogItem) => {
    const brandLabel = SCREEN_BRAND_LABELS[screen.brand];
    const lineName = `Troca de Tela — ${brandLabel} ${screen.phoneModel} (${screen.screenType})`;
    const today = getTodayYMD();

    setDraftOrder((prev) => {
      const existingIdx = prev.items.findIndex(
        (it) => it.serviceId === screen.id || it.name === lineName
      );
      const nextItems =
        existingIdx >= 0
          ? prev.items.map((it, idx) =>
              idx === existingIdx ? { ...it, qty: it.qty + 1 } : it
            )
          : [
              ...prev.items,
              {
                id: generateId('li'),
                serviceId: screen.id,
                name: lineName,
                category: 'telas' as ServiceCategoryId,
                qty: 1,
                partPrice: screen.price,
                laborPrice: 0,
              },
            ];
      const next: WorkOrder = {
        ...prev,
        deviceBrandModel:
          prev.deviceBrandModel.trim() || `${brandLabel} ${screen.phoneModel}`,
        reportedIssue:
          prev.reportedIssue.trim() || `Troca de tela (${screen.screenType})`,
        warrantyDays: 90,
        warrantyStartDate: prev.warrantyStartDate || today,
        warrantyEndDate:
          prev.warrantyStartDate && prev.warrantyEndDate
            ? prev.warrantyEndDate
            : addDaysYMD(prev.warrantyStartDate || today, 90),
        items: nextItems,
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(STORAGE_KEYS.draft, next);
      syncOrderToWorkOrders(next);
      return next;
    });
  };

  const handleStartBudgetWithScreen = (screen: ScreenCatalogItem) => {
    const brandLabel = SCREEN_BRAND_LABELS[screen.brand];
    const lineName = `Troca de Tela — ${brandLabel} ${screen.phoneModel} (${screen.screenType})`;
    const today = getTodayYMD();
    const fresh = createBlankOrder({
      deviceBrandModel: `${brandLabel} ${screen.phoneModel}`,
      reportedIssue: `Troca de tela (${screen.screenType})`,
      warrantyDays: 90,
      warrantyStartDate: today,
      warrantyEndDate: addDaysYMD(today, 90),
      items: [
        {
          id: generateId('li'),
          serviceId: screen.id,
          name: lineName,
          category: 'telas',
          qty: 1,
          partPrice: screen.price,
          laborPrice: 0,
        },
      ],
    });
    setDraftOrder(fresh);
    saveToStorage(STORAGE_KEYS.draft, fresh);
    setActiveTab('orcamento');
  };

  const handleSaveScreen = (screen: ScreenCatalogItem) => {
    setScreenCatalog((prev) => {
      const exists = prev.some((s) => s.id === screen.id);
      const next = exists
        ? prev.map((s) => (s.id === screen.id ? screen : s))
        : [screen, ...prev];
      saveToStorage(STORAGE_KEYS.screenCatalog, next);
      return next;
    });
  };

  const handleDeleteScreen = (id: string) => {
    setScreenCatalog((prev) => {
      const next = prev.filter((s) => s.id !== id);
      saveToStorage(STORAGE_KEYS.screenCatalog, next);
      return next;
    });
  };

  const handleRemoveLineFromDraft = (lineId: string) => {
    setDraftOrder((prev) => {
      const next: WorkOrder = {
        ...prev,
        items: prev.items.filter((it) => it.id !== lineId),
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(STORAGE_KEYS.draft, next);
      syncOrderToWorkOrders(next);
      return next;
    });
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
      const next = exists
        ? prev.map((o) => (o.id === order.id ? order : o))
        : [order, ...prev];
      saveToStorage(STORAGE_KEYS.orders, next);
      return next;
    });
  };

  const handleUpdateOrderStatus = (orderId: string, status: WorkOrderStatus) => {
    setWorkOrders((prev) => {
      const next = prev.map((o) =>
        o.id === orderId ? { ...o, status, updatedAt: new Date().toISOString() } : o
      );
      saveToStorage(STORAGE_KEYS.orders, next);
      return next;
    });
  };

  const handleUpdateOrderNotes = (orderId: string, technicianNotes: string) => {
    setWorkOrders((prev) => {
      const next = prev.map((o) =>
        o.id === orderId
          ? { ...o, technicianNotes, updatedAt: new Date().toISOString() }
          : o
      );
      saveToStorage(STORAGE_KEYS.orders, next);
      return next;
    });
  };

  const handleUpdateOrderWarranty = (
    orderId: string,
    warrantyStartDate: string,
    warrantyEndDate: string
  ) => {
    setWorkOrders((prev) => {
      const next = prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              warrantyStartDate,
              warrantyEndDate,
              updatedAt: new Date().toISOString(),
            }
          : o
      );
      saveToStorage(STORAGE_KEYS.orders, next);
      return next;
    });
  };

  const handleDeleteOrder = (orderId: string) => {
    setWorkOrders((prev) => {
      const next = prev.filter((o) => o.id !== orderId);
      saveToStorage(STORAGE_KEYS.orders, next);
      return next;
    });
  };

  const handleSaveAppointment = (apt: Appointment) => {
    setAppointments((prev) => {
      const exists = prev.some((a) => a.id === apt.id);
      const next = exists
        ? prev.map((a) => (a.id === apt.id ? apt : a))
        : [apt, ...prev];
      saveToStorage(STORAGE_KEYS.appointments, next);
      return next;
    });
  };

  const handleUpdateAppointmentStatus = (id: string, status: AppointmentStatus) => {
    setAppointments((prev) => {
      const next = prev.map((a) => (a.id === id ? { ...a, status } : a));
      saveToStorage(STORAGE_KEYS.appointments, next);
      return next;
    });
  };

  const handleDeleteAppointment = (id: string) => {
    setAppointments((prev) => {
      const next = prev.filter((a) => a.id !== id);
      saveToStorage(STORAGE_KEYS.appointments, next);
      return next;
    });
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
    saveToStorage(STORAGE_KEYS.draft, newOrder);
    setActiveTab('orcamento');
  };

  const handleSaveClient = (
    client: Client,
    options?: {
      initialServiceId?: string;
      customServiceText?: string;
      initialDevice?: string;
      isNew?: boolean;
      openBudgetAfter?: boolean;
    }
  ) => {
    setClients((prev) => {
      const exists = prev.some((c) => c.id === client.id);
      const next = exists
        ? prev.map((c) => (c.id === client.id ? client : c))
        : [client, ...prev];
      saveToStorage(STORAGE_KEYS.clients, next);
      return next;
    });

    const chosenSrv = options?.initialServiceId
      ? services.find((s) => s.id === options.initialServiceId)
      : undefined;
    const freeText = (options?.customServiceText ?? '').trim();
    const deviceText = (options?.initialDevice ?? '').trim();

    if (chosenSrv || (options?.isNew && (freeText || deviceText))) {
      const initialItems = chosenSrv
        ? [
            {
              id: generateId('li'),
              serviceId: chosenSrv.id,
              name: chosenSrv.name,
              category: chosenSrv.category,
              qty: 1,
              partPrice: chosenSrv.partPrice,
              laborPrice: chosenSrv.laborPrice,
            },
          ]
        : freeText
          ? [
              {
                id: generateId('li'),
                name: freeText,
                category: 'celulares' as ServiceCategoryId,
                qty: 1,
                partPrice: 0,
                laborPrice: 0,
              },
            ]
          : [];

      const createdOrder = createBlankOrder({
        clientId: client.id,
        deviceBrandModel: deviceText,
        reportedIssue: freeText,
        items: initialItems,
        warrantyDays: chosenSrv ? chosenSrv.warrantyDays : store.defaultWarrantyDays,
      });

      setWorkOrders((prev) => {
        const next = [createdOrder, ...prev];
        saveToStorage(STORAGE_KEYS.orders, next);
        return next;
      });

      if (options?.openBudgetAfter) {
        setDraftOrder(createdOrder);
        saveToStorage(STORAGE_KEYS.draft, createdOrder);
      }
      return;
    }

    if (options?.openBudgetAfter) {
      if (!draftOrder.clientId && orderHasContent(draftOrder)) {
        handleChangeDraft({ ...draftOrder, clientId: client.id });
      } else {
        syncOrderToWorkOrders(draftOrder);
        const fresh = createBlankOrder({ clientId: client.id });
        setDraftOrder(fresh);
        saveToStorage(STORAGE_KEYS.draft, fresh);
      }
    }
  };

  const handleDeleteClient = (id: string) => {
    setClients((prev) => {
      const next = prev.filter((c) => c.id !== id);
      saveToStorage(STORAGE_KEYS.clients, next);
      return next;
    });
  };

  const handleClearAllClients = () => {
    setClients([]);
    setWorkOrders([]);
    setAppointments([]);
    const blank = createBlankOrder({ clientId: '' });
    setDraftOrder(blank);
    saveToStorage(STORAGE_KEYS.clients, []);
    saveToStorage(STORAGE_KEYS.orders, []);
    saveToStorage(STORAGE_KEYS.appointments, []);
    saveToStorage(STORAGE_KEYS.draft, blank);
  };

  const handleSaveService = (srv: ServiceItem) => {
    setServices((prev) => {
      const exists = prev.some((s) => s.id === srv.id);
      const next = exists
        ? prev.map((s) => (s.id === srv.id ? srv : s))
        : [srv, ...prev];
      saveToStorage(STORAGE_KEYS.services, next);
      return next;
    });
  };

  const handleDeleteService = (id: string) => {
    setServices((prev) => {
      const next = prev.filter((s) => s.id !== id);
      saveToStorage(STORAGE_KEYS.services, next);
      return next;
    });
  };

  const handleExportBackup = () => {
    const payload = {
      version: 2,
      exportedAt: new Date().toISOString(),
      store,
      services,
      screenCatalog,
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
        if (Array.isArray(parsed.screenCatalog)) setScreenCatalog(parsed.screenCatalog);
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
              screenCatalog={screenCatalog}
              clients={clients}
              workOrders={workOrders}
              draftOrder={draftOrder}
              onAddServiceToDraft={handleAddServiceToDraft}
              onAddScreenToDraft={handleAddScreenToDraft}
              onSaveScreen={handleSaveScreen}
              onDeleteScreen={handleDeleteScreen}
              onRemoveLineFromDraft={handleRemoveLineFromDraft}
              onStartNewBudget={() => setDraftOrder(createBlankOrder())}
              onOpenOrderInBudget={handleOpenOrderInBudget}
              onNavigateTab={(t) => setActiveTab(t)}
              onNavigateToClients={() => {
                setCatalogInitialSubTab('clientes');
                setActiveTab('cadastros');
              }}
            />
          )}

          {activeTab === 'ordens' && (
            <WorkOrdersView
              workOrders={workOrders}
              clients={clients}
              store={store}
              onUpdateStatus={handleUpdateOrderStatus}
              onUpdateNotes={handleUpdateOrderNotes}
              onUpdateWarranty={handleUpdateOrderWarranty}
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
              workOrders={workOrders}
              services={services}
              screenCatalog={screenCatalog}
              store={store}
              onChangeDraft={handleChangeDraft}
              onSwitchClient={handleSwitchDraftClient}
              onSelectClientOrder={handleOpenOrderInBudget}
              onNewOrderForClient={(clientId) => {
                syncOrderToWorkOrders(draftOrder);
                const fresh = createBlankOrder({ clientId });
                setDraftOrder(fresh);
                saveToStorage(STORAGE_KEYS.draft, fresh);
              }}
              onSaveAsWorkOrder={handleSaveAsWorkOrder}
              onAddScreenToDraft={handleAddScreenToDraft}
              onSaveScreen={handleSaveScreen}
              onDeleteScreen={handleDeleteScreen}
              onQuickCreateClient={(client, opts) =>
                handleSaveClient(client, { ...opts, isNew: true, openBudgetAfter: true })
              }
              onOpenClientsTab={() => {
                setCatalogInitialSubTab('clientes');
                setActiveTab('cadastros');
              }}
            />
          )}

          {activeTab === 'cadastros' && (
            <CatalogAndClientsView
              clients={clients}
              workOrders={workOrders}
              services={services}
              screenCatalog={screenCatalog}
              store={store}
              initialSubTab={catalogInitialSubTab}
              onClearInitialSubTab={() => setCatalogInitialSubTab(null)}
              onSaveClient={handleSaveClient}
              onDeleteClient={handleDeleteClient}
              onClearAllClients={handleClearAllClients}
              onSaveService={handleSaveService}
              onDeleteService={handleDeleteService}
              onSaveScreen={handleSaveScreen}
              onDeleteScreen={handleDeleteScreen}
              onUpdateStore={setStore}
              onOpenOrderInBudget={handleOpenOrderInBudget}
              onStartBudgetForClient={(clientId) => {
                const clientOrders = workOrders
                  .filter((o) => o.clientId === clientId)
                  .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
                if (clientOrders[0]) {
                  handleOpenOrderInBudget(clientOrders[0].id);
                } else {
                  const fresh = createBlankOrder({ clientId });
                  setDraftOrder(fresh);
                  saveToStorage(STORAGE_KEYS.draft, fresh);
                  setActiveTab('orcamento');
                }
              }}
              onStartNewBudgetForClient={(clientId) => {
                const fresh = createBlankOrder({ clientId });
                setDraftOrder(fresh);
                saveToStorage(STORAGE_KEYS.draft, fresh);
                setActiveTab('orcamento');
              }}
              onStartBudgetForService={(srv) => handleStartBudgetWithService(srv)}
              onStartBudgetForScreen={handleStartBudgetWithScreen}
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

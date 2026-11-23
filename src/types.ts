export type ServiceCategoryId =
  | 'telas'
  | 'celulares'
  | 'notebooks'
  | 'acessorios';

export type ScreenBrandId = 'iphone' | 'samsung' | 'motorola' | 'xiaomi';

export interface ScreenCatalogItem {
  id: string;
  brand: ScreenBrandId;
  phoneModel: string;
  screenType: string;
  price: number;
  warrantyDays: number;
  createdAt?: string;
}

export type WorkOrderStatus =
  | 'aguardando'
  | 'orcamento'
  | 'aprovado'
  | 'pronto'
  | 'entregue';

export type AppointmentStatus =
  | 'agendado'
  | 'confirmado'
  | 'concluido'
  | 'cancelado';

export type CardMode = 'sem_juros' | 'com_taxa';

export type PickupDeliveryOption = 'gratis' | 'taxa_10';

export interface ServiceItem {
  id: string;
  name: string;
  category: ServiceCategoryId;
  description: string;
  partPrice: number;
  laborPrice: number;
  warrantyDays: number;
  estimatedTime: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  cpfCnpj: string;
  address: string;
  notes: string;
  createdAt: string;
}

export interface BudgetLineItem {
  id: string;
  serviceId?: string;
  name: string;
  category: ServiceCategoryId;
  qty: number;
  partPrice: number;
  laborPrice: number;
}

export interface DeviceChecklist {
  turnsOn: boolean;
  screenIntact: boolean;
  chargingPortOk: boolean;
  passwordNote: string;
}

export interface WorkOrder {
  id: string;
  code: string;
  clientId: string;
  deviceBrandModel: string;
  deviceSerial: string;
  reportedIssue: string;
  technicianNotes: string;
  checklist: DeviceChecklist;
  status: WorkOrderStatus;
  items: BudgetLineItem[];
  freeScreenProtector?: boolean;
  pickupDeliveryFee?: PickupDeliveryOption;
  cashDiscountPercent: number;
  cardMode: CardMode;
  selectedInstallments: number;
  warrantyDays: number;
  warrantyStartDate?: string;
  warrantyEndDate?: string;
  validityDays: number;
  deliveryForecast: string;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  deviceBrandModel: string;
  category: ServiceCategoryId;
  serviceSummary: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: AppointmentStatus;
  notes: string;
  linkedOrderId?: string;
}

export interface InstallmentRate {
  installments: number;
  feePercent: number;
}

export interface StoreProfile {
  name: string;
  slogan: string;
  cnpjCpf: string;
  phone: string;
  email: string;
  address: string;
  cityState: string;
  pixKey: string;
  logoUrl: string;
  defaultWarrantyDays: number;
  defaultValidityDays: number;
  defaultCashDiscountPercent: number;
  footerNotes: string;
  cardRates: InstallmentRate[];
}

export type AppTab =
  | 'inicio'
  | 'ordens'
  | 'agenda'
  | 'orcamento'
  | 'cadastros';

export type ThemeId = 'charcoal' | 'midnight' | 'graphite-gold' | 'light';

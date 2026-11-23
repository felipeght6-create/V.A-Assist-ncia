import {
  Appointment,
  Client,
  ScreenBrandId,
  ScreenCatalogItem,
  ServiceItem,
  StoreProfile,
  WorkOrder,
} from '../types';

export const DEFAULT_STORE_PROFILE: StoreProfile = {
  name: 'V.A Assistência',
  slogan: 'Especialista em Celulares, Notebooks, Computadores e Acessórios',
  cnpjCpf: '00.000.000/0001-00',
  phone: '(11) 99999-0000',
  email: 'contato@vaassistencia.com.br',
  address: 'Av. Principal, 450 — Sala 02',
  cityState: 'Centro — São Paulo / SP',
  pixKey: 'contato@vaassistencia.com.br',
  logoUrl: '/assets/va-logo-circle.png',
  defaultWarrantyDays: 90,
  defaultValidityDays: 7,
  defaultCashDiscountPercent: 5,
  footerNotes:
    'Orçamento válido pelo prazo informado acima. A garantia de 90 dias cobre exclusivamente a peça substituída e o serviço executado, não cobrindo danos físicos, umidade ou mau uso.',
  cardRates: [
    { installments: 1, feePercent: 3.49 },
    { installments: 2, feePercent: 5.2 },
    { installments: 3, feePercent: 6.49 },
    { installments: 4, feePercent: 7.8 },
    { installments: 5, feePercent: 8.9 },
    { installments: 6, feePercent: 9.99 },
    { installments: 10, feePercent: 13.49 },
    { installments: 12, feePercent: 15.89 },
  ],
};

export const INITIAL_SERVICES: ServiceItem[] = [
  // 1. Troca de Telas
  {
    id: 'srv_tela_android',
    name: 'Troca de Tela Completa (Celular Android)',
    category: 'telas',
    description: 'Substituição de módulo frontal completo (touch + display) com vedação e testes.',
    partPrice: 180,
    laborPrice: 120,
    warrantyDays: 90,
    estimatedTime: '2 horas',
  },
  {
    id: 'srv_tela_iphone',
    name: 'Troca de Tela / Display (iPhone)',
    category: 'telas',
    description: 'Troca de frontal OLED/Incell com transferência de sensores e True Tone.',
    partPrice: 280,
    laborPrice: 150,
    warrantyDays: 90,
    estimatedTime: '1h 30min',
  },
  {
    id: 'srv_tela_notebook',
    name: 'Troca de Tela de Notebook (LED / IPS)',
    category: 'telas',
    description: 'Substituição de painel 14" ou 15.6" HD/Full HD com verificação do cabo flat.',
    partPrice: 420,
    laborPrice: 140,
    warrantyDays: 90,
    estimatedTime: '1 dia útil',
  },

  // 2. Consertos de Celulares
  {
    id: 'srv_conector_carga',
    name: 'Troca de Conector de Carga',
    category: 'celulares',
    description: 'Substituição de conector USB-C, Micro-USB ou Lightning com teste de amperagem.',
    partPrice: 45,
    laborPrice: 95,
    warrantyDays: 90,
    estimatedTime: '2 horas',
  },
  {
    id: 'srv_conectores_flex',
    name: 'Troca de Conectores e Flex (Subplaca / Botões)',
    category: 'celulares',
    description: 'Reparo ou substituição de cabo flex principal, subplaca, biometria ou botões.',
    partPrice: 60,
    laborPrice: 110,
    warrantyDays: 90,
    estimatedTime: '3 horas',
  },
  {
    id: 'srv_bateria_cel',
    name: 'Troca de Bateria de Celular',
    category: 'celulares',
    description: 'Substituição de bateria nova com calibração e dupla-face original.',
    partPrice: 95,
    laborPrice: 85,
    warrantyDays: 90,
    estimatedTime: '1h 30min',
  },

  // 3. Assistência em Notebooks e Computadores
  {
    id: 'srv_diag_manut_pc',
    name: 'Diagnóstico e Manutenção Preventiva (Notebook/PC)',
    category: 'notebooks',
    description: 'Limpeza interna completa, higienização de cooler, troca de pasta térmica e revisão.',
    partPrice: 25,
    laborPrice: 135,
    warrantyDays: 90,
    estimatedTime: '1 dia útil',
  },
  {
    id: 'srv_teclado_notebook',
    name: 'Troca de Teclado de Notebook',
    category: 'notebooks',
    description: 'Substituição de teclado padrão ABNT2 (encaixe ou rebitado interno).',
    partPrice: 160,
    laborPrice: 130,
    warrantyDays: 90,
    estimatedTime: '1 dia útil',
  },
  {
    id: 'srv_diag_windows',
    name: 'Diagnóstico de Problemas no Windows',
    category: 'notebooks',
    description: 'Correção de erros do sistema, remoção de vírus, drivers, backup ou formatação.',
    partPrice: 0,
    laborPrice: 120,
    warrantyDays: 30,
    estimatedTime: '3 horas',
  },
  {
    id: 'srv_upgrade_ssd',
    name: 'Upgrade SSD + Instalação Windows',
    category: 'notebooks',
    description: 'Instalação física de SSD NVMe/SATA com sistema otimizado e backup.',
    partPrice: 210,
    laborPrice: 110,
    warrantyDays: 90,
    estimatedTime: '4 horas',
  },

  // 4. Venda de Acessórios
  {
    id: 'srv_capinha',
    name: 'Capinha Protetora (Anti-impacto / Silicone)',
    category: 'acessorios',
    description: 'Capa protetora reforçada com proteção de câmera e bordas elevadas.',
    partPrice: 35,
    laborPrice: 0,
    warrantyDays: 30,
    estimatedTime: 'Imediato',
  },
  {
    id: 'srv_pelicula_3d',
    name: 'Película 3D de Vidro Temperado',
    category: 'acessorios',
    description: 'Película 3D borda a borda com aplicação limpa sem bolhas.',
    partPrice: 30,
    laborPrice: 0,
    warrantyDays: 7,
    estimatedTime: 'Imediato',
  },
  {
    id: 'srv_pelicula_priv',
    name: 'Película de Privacidade',
    category: 'acessorios',
    description: 'Película de vidro anti-espionagem com aplicação inclusa.',
    partPrice: 45,
    laborPrice: 0,
    warrantyDays: 7,
    estimatedTime: 'Imediato',
  },
  {
    id: 'srv_carregador',
    name: 'Carregador Turbo Completo',
    category: 'acessorios',
    description: 'Fonte turbo homologada + cabo de alta velocidade.',
    partPrice: 85,
    laborPrice: 0,
    warrantyDays: 90,
    estimatedTime: 'Imediato',
  },
  {
    id: 'srv_cabo_usb',
    name: 'Cabo USB Reforçado (USB-C / Lightning / V8)',
    category: 'acessorios',
    description: 'Cabo de dados e carregamento rápido revestido em nylon.',
    partPrice: 35,
    laborPrice: 0,
    warrantyDays: 90,
    estimatedTime: 'Imediato',
  },
];

export const INITIAL_CLIENTS: Client[] = [];

export const INITIAL_WORK_ORDERS: WorkOrder[] = [];

export const INITIAL_APPOINTMENTS: Appointment[] = [];

export const SCREEN_BRANDS: {
  id: ScreenBrandId;
  label: string;
  tagline: string;
}[] = [
  { id: 'iphone', label: 'iPhone', tagline: 'Apple · iOS / Displays OLED & Incell' },
  { id: 'samsung', label: 'Samsung', tagline: 'Linha Galaxy A, M, S e J' },
  { id: 'motorola', label: 'Motorola', tagline: 'Linha Moto G, E e Edge' },
  { id: 'xiaomi', label: 'Xiaomi', tagline: 'Redmi, Redmi Note, Poco e Mi' },
];

export const SCREEN_WARRANTY_COVERAGE: string[] = [
  'Defeitos de fabricação da tela instalada.',
  'Falhas de funcionamento relacionadas à peça instalada.',
];

export const SCREEN_WARRANTY_EXCLUSIONS: string[] = [
  'Tela quebrada ou trincada após a entrega.',
  'Danos causados por quedas ou impactos.',
  'Contato com água ou umidade.',
  'Danos por mau uso ou pressão sobre a tela.',
  'Defeitos em outros componentes do aparelho.',
];

export const SCREEN_WARRANTY_LEGAL_NOTE =
  'Garantia legal de 90 dias aplicada conforme a legislação vigente (Código de Defesa do Consumidor — Lei nº 8.078/1990, Art. 26, II).';

export const INITIAL_SCREEN_CATALOG: ScreenCatalogItem[] = [
  // iPhone
  {
    id: 'scr_iph_11_incell',
    brand: 'iphone',
    phoneModel: 'iPhone 11',
    screenType: 'LCD Incell Premium',
    price: 290,
    warrantyDays: 90,
  },
  {
    id: 'scr_iph_12_oled',
    brand: 'iphone',
    phoneModel: 'iPhone 12 / 12 Pro',
    screenType: 'OLED Soft Premium',
    price: 450,
    warrantyDays: 90,
  },
  {
    id: 'scr_iph_13_oled',
    brand: 'iphone',
    phoneModel: 'iPhone 13',
    screenType: 'OLED Original China / Soft OLED',
    price: 520,
    warrantyDays: 90,
  },
  // Samsung
  {
    id: 'scr_sam_a14_orig',
    brand: 'samsung',
    phoneModel: 'Galaxy A14 / A15',
    screenType: 'Display Frontal Original Nacional',
    price: 260,
    warrantyDays: 90,
  },
  {
    id: 'scr_sam_a34_amoled',
    brand: 'samsung',
    phoneModel: 'Galaxy A34 / A54',
    screenType: 'Super AMOLED Original',
    price: 430,
    warrantyDays: 90,
  },
  {
    id: 'scr_sam_a52_amoled',
    brand: 'samsung',
    phoneModel: 'Galaxy A52 / A53',
    screenType: 'AMOLED Incell Premium',
    price: 340,
    warrantyDays: 90,
  },
  // Motorola
  {
    id: 'scr_mot_g24_orig',
    brand: 'motorola',
    phoneModel: 'Moto G24 / G34',
    screenType: 'Frontal LCD IPS Original',
    price: 240,
    warrantyDays: 90,
  },
  {
    id: 'scr_mot_g54_orig',
    brand: 'motorola',
    phoneModel: 'Moto G54 / G84',
    screenType: 'Frontal Full HD+ / pOLED',
    price: 330,
    warrantyDays: 90,
  },
  {
    id: 'scr_mot_edge30_poled',
    brand: 'motorola',
    phoneModel: 'Moto Edge 30 / Edge 40',
    screenType: 'pOLED Original',
    price: 540,
    warrantyDays: 90,
  },
  // Xiaomi
  {
    id: 'scr_xia_rn12_amoled',
    brand: 'xiaomi',
    phoneModel: 'Redmi Note 12',
    screenType: 'AMOLED Original',
    price: 350,
    warrantyDays: 90,
  },
  {
    id: 'scr_xia_rn13_amoled',
    brand: 'xiaomi',
    phoneModel: 'Redmi Note 13',
    screenType: 'AMOLED Original / Premium',
    price: 390,
    warrantyDays: 90,
  },
  {
    id: 'scr_xia_poco_x5_amoled',
    brand: 'xiaomi',
    phoneModel: 'Poco X5 / X6 Pro',
    screenType: 'AMOLED 120Hz Original',
    price: 460,
    warrantyDays: 90,
  },
];

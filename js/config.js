// ── SUPABASE CONFIG ───────────────────────────────────────
const SUPABASE_URL      = 'https://ozfmydiutupboupttkmz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_TcG2qZdwO5PQuJAJ701xtg_XArHPpsG';

// ── PINs: solo se guardan hashes, nunca el dígito real ─────
const PIN_SALT = 'gastos-hn-2026';
const ADMIN_PIN_HASH    = 'ac45faf608df85509393719a3a0328252ac5ca1f77d8e1e435de0e9303237ade';
const SHARELYN_PIN_HASH = '6115a92948fb8f1b2e5860a3dca8c6e07fc9b328d19ebb010f69d7102901fa87';
const TERESA_PIN_HASH   = 'b64806f18e83bfb929005a77d75b63f2c2f82fe5fadcc3f40116f6743166ec16';
const ARELY_PIN_HASH    = '7d744c7569c2db2a8163a478719233f077665a7ab0777a727b36c684f8bdaee9';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── SHARELYN: CATEGORÍAS DE GASTOS ───────────────────────
const CAT = {
  cafeteria:    {label:'☕ Cafeterías',     color:'#667eea', emoji:'☕'},
  restaurante:  {label:'🍔 Restaurantes',   color:'#f7971e', emoji:'🍔'},
  universidad:  {label:'📚 Universidad',    color:'#00b09b', emoji:'📚'},
  ropa:         {label:'👗 Ropa y Moda',    color:'#e040fb', emoji:'👗'},
  telefono:     {label:'📱 Teléfono',       color:'#26c6da', emoji:'📱'},
  suscripcion:  {label:'🎵 Suscripciones',  color:'#ff7043', emoji:'🎵'},
  supermercado: {label:'🛒 Supermercado',   color:'#66bb6a', emoji:'🛒'},
  seguros:      {label:'🏢 Seguros/Otros',  color:'#bdbdbd', emoji:'🏢'},
  efectivo:     {label:'💵 Efectivo ATM',   color:'#ffd740', emoji:'💵'},
  otros:        {label:'📦 Otros',          color:'#90a4ae', emoji:'📦'},
};

// ── TERESA: CATEGORÍAS DE CONSTRUCCIÓN ───────────────────
const TERESA_CAT = {
  zinc:         {label:'🪟 Láminas Zinc',   color:'#546e7a', emoji:'🪟'},
  escalera:     {label:'🪜 Escalera',       color:'#607d8b', emoji:'🪜'},
  cemento:      {label:'🧱 Cemento',        color:'#8d6e63', emoji:'🧱'},
  bloques:      {label:'🔲 Bloques',        color:'#795548', emoji:'🔲'},
  combustible:  {label:'⛽ Combustible',    color:'#f57c00', emoji:'⛽'},
  arena:        {label:'🏖️ Arena',          color:'#f9a825', emoji:'🏖️'},
  electricista: {label:'⚡ Electricista',   color:'#fdd835', emoji:'⚡'},
  albanil:      {label:'👷 Albañil',        color:'#ff8f00', emoji:'👷'},
  pintura:      {label:'🎨 Pintura',        color:'#ab47bc', emoji:'🎨'},
  herramientas: {label:'🔧 Herramientas',   color:'#455a64', emoji:'🔧'},
  otros:        {label:'📦 Otros',          color:'#90a4ae', emoji:'📦'},
};

// ── TERESA PERSONAL: CATEGORÍAS DE VIDA COTIDIANA ────────
const TERESA_PERSONAL_CAT = {
  supermercado: {label:'🛒 Supermercado',    color:'#66bb6a', emoji:'🛒'},
  restaurante:  {label:'🍽️ Restaurantes',    color:'#f7971e', emoji:'🍽️'},
  transporte:   {label:'🚗 Transporte',      color:'#42a5f5', emoji:'🚗'},
  hogar:        {label:'🏠 Hogar',           color:'#8d6e63', emoji:'🏠'},
  salud:        {label:'💊 Salud',           color:'#ef5350', emoji:'💊'},
  belleza:      {label:'💄 Belleza',         color:'#d4709a', emoji:'💄'},
  ropa:         {label:'👗 Ropa',            color:'#ab47bc', emoji:'👗'},
  servicios:    {label:'💡 Servicios',       color:'#ffd740', emoji:'💡'},
  diversion:    {label:'🎬 Diversión',       color:'#26c6da', emoji:'🎬'},
  familia:      {label:'👪 Familia',         color:'#f48fb1', emoji:'👪'},
  otros:        {label:'📦 Otros',           color:'#90a4ae', emoji:'📦'},
};

// ── ARELY: HOUSEHOLD EXPENSE CATEGORIES (1311 Old Robinson Trail) ──
const ARELY_CAT = {
  // ── Utilities ─────────────────────────────────────────
  electricity:  {label:'Electricity',       color:'#D06B8D', emoji:'⚡'},
  water:        {label:'Water',             color:'#42A5F5', emoji:'💧'},
  gas:          {label:'Gas',               color:'#FF7043', emoji:'🔥'},
  internet:     {label:'Internet / Cable',  color:'#7E57C2', emoji:'📡'},
  phone:        {label:'Phone',             color:'#26C6DA', emoji:'📱'},
  // ── Living ────────────────────────────────────────────
  groceries:    {label:'Groceries',         color:'#66BB6A', emoji:'🛒'},
  rent:         {label:'Rent / Mortgage',   color:'#8D6E63', emoji:'🏠'},
  dining:       {label:'Dining Out',        color:'#F7971E', emoji:'🍽️'},
  health:       {label:'Health / Medical',  color:'#EF5350', emoji:'💊'},
  clothing:     {label:'Clothing',          color:'#AB47BC', emoji:'👗'},
  sam:          {label:'Sam 🐾',            color:'#F2A0BB', emoji:'🐾', hasAvatar:true},
  // ── Home & Transport ──────────────────────────────────
  transport:    {label:'Transportation',    color:'#FFA726', emoji:'🚗'},
  maintenance:  {label:'Home Maintenance',  color:'#78909C', emoji:'🧹'},
  insurance:    {label:'Insurance',         color:'#5C6BC0', emoji:'🛡️'},
  entertainment:{label:'Entertainment',     color:'#EC407A', emoji:'🎬'},
  // ── Financial ─────────────────────────────────────────
  taxes:        {label:'Taxes',             color:'#B71C1C', emoji:'🏛️'},
  investments:  {label:'Investments',       color:'#1565C0', emoji:'📈'},
  mortgage_sav: {label:'Mortgage/Savings',  color:'#2E7D32', emoji:'🏦'},
  remittance:   {label:'Remittances',       color:'#E65100', emoji:'💸'},
  creditcard:   {label:'Credit Cards',      color:'#6A1B9A', emoji:'💳'},
  // ── Shopping & Transfers ──────────────────────────────
  amazon:       {label:'Amazon',            color:'#FF6F00', emoji:'🛍️'},
  transfer:     {label:'Transfers/Zelle',   color:'#006064', emoji:'📲'},
  bankfee:      {label:'Bank Fees',         color:'#37474F', emoji:'🏧'},
  other:        {label:'Other',             color:'#90A4AE', emoji:'📦'},
};

// ── ARELY: INCOME SOURCE TYPES ────────────────────────────────────────
const ARELY_INCOME_SOURCES = {
  payroll:      {label:'Payroll',           color:'#43A047', emoji:'💼'},
  transfer_in:  {label:'Transfer In',       color:'#00ACC1', emoji:'📲'},
  deposit:      {label:'Cash Deposit',      color:'#FB8C00', emoji:'🏧'},
  refund:       {label:'Refund / Credit',   color:'#1E88E5', emoji:'↩️'},
  income_other: {label:'Other Income',      color:'#8E24AA', emoji:'💰'},
};

const ALL_CATS = {...CAT, ...TERESA_CAT, ...TERESA_PERSONAL_CAT, ...ARELY_CAT};

// ── MÉTODOS DE PAGO ───────────────────────────────────────
const INCOME_METHODS = [
  {k:'cash',     label:'Efectivo',       icon:'💵'},
  {k:'transfer', label:'Transferencia',  icon:'📱'},
  {k:'check',    label:'Cheque',         icon:'📝'},
];
const EXPENSE_METHODS = [
  {k:'cash',     label:'Efectivo',       icon:'💵'},
  {k:'card',     label:'Tarjeta',        icon:'💳'},
  {k:'transfer', label:'Transferencia',  icon:'📱'},
  {k:'check',    label:'Cheque',         icon:'📝'},
];
const METHOD_LABEL = {
  cash:'💵 Efectivo', card:'💳 Tarjeta',
  transfer:'📱 Transferencia', check:'📝 Cheque',
};

// ── MESES ─────────────────────────────────────────────────
const MONTH_ORDER = {
  enero:1, febrero:2, marzo:3, abril:4, mayo:5, junio:6,
  julio:7, agosto:8, septiembre:9, octubre:10, noviembre:11, diciembre:12,
};
const MONTHS_ES = [
  '','Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];

// ── TODO: CATEGORÍAS POR USUARIO ─────────────────────────
const SHARELYN_TODO_CATS = [
  {k:'tarea',     label:'Tarea',      icon:'📚'},
  {k:'examen',    label:'Examen',     icon:'📝'},
  {k:'estudiar',  label:'Estudiar',   icon:'📖'},
  {k:'pagar',     label:'Pagar',      icon:'💳'},
  {k:'comprar',   label:'Comprar',    icon:'🛍️'},
  {k:'salud',     label:'Salud',      icon:'🏃'},
  {k:'reunion',   label:'Reunión',    icon:'📅'},
  {k:'otro',      label:'Otro',       icon:'💡'},
];

const TERESA_PERSONAL_TODO_CATS = [
  {k:'comprar',   label:'Comprar',    icon:'🛒'},
  {k:'pagar',     label:'Pagar',      icon:'💳'},
  {k:'cita',      label:'Cita médica',icon:'🏥'},
  {k:'hogar',     label:'Hogar',      icon:'🏠'},
  {k:'social',    label:'Social',     icon:'👥'},
  {k:'personal',  label:'Personal',   icon:'💆'},
  {k:'familiar',  label:'Familiar',   icon:'👪'},
  {k:'otro',      label:'Otro',       icon:'💡'},
];

const TERESA_TODO_CATS = [
  {k:'material',    label:'Comprar',    icon:'🛒'},
  {k:'proveedor',   label:'Proveedor',  icon:'📞'},
  {k:'trabajador',  label:'Obra',       icon:'👷'},
  {k:'presupuesto', label:'Presupuesto',icon:'📋'},
  {k:'visita',      label:'Visitar',    icon:'🏠'},
  {k:'fotos',       label:'Fotos',      icon:'📸'},
  {k:'pago',        label:'Pago',       icon:'💰'},
  {k:'entrega',     label:'Material',   icon:'📦'},
];

const ARELY_TODO_CATS = [
  {k:'bills',      label:'Bills',       icon:'💡'},
  {k:'shopping',   label:'Shopping',    icon:'🛒'},
  {k:'sam',        label:'Sam 🐾',      icon:'🐾'},
  {k:'cleaning',   label:'Cleaning',    icon:'🧹'},
  {k:'repairs',    label:'Repairs',     icon:'🔧'},
  {k:'appointment',label:'Appointment', icon:'📅'},
  {k:'personal',   label:'Personal',    icon:'💆'},
  {k:'other',      label:'Other',       icon:'💡'},
];

let arelySelectedTodoCat = '';

// ── ESTADO GLOBAL ─────────────────────────────────────────
let currentUser        = null;
let currentPerson      = 'sharelyn';
let currentTeresaMode  = 'obra';
let allTx              = [];
let teresaTx           = [];
let teresaPersonalTx   = [];
let currentFilter = 'all';
let currentYear   = null;
let taFilter      = 'all';
let tHistFilter   = 'all';
let donutChart    = null;
let barChart      = null;
let pendingTx     = [];
let selectedCat            = '';
let selectedIngresoMethod  = '';
let selectedGastoCat       = '';
let selectedGastoMethod    = '';
let currentReceiptData     = null;

// ── ARELY STATE ──────────────────────────────────────────
let arelyTx              = [];
let arelyBudget          = 0;
let arelySelectedCat     = '';
let arelyTrendChart      = null;
let arelyDonutChart      = null;

const MONTHS_EN = [
  '','January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

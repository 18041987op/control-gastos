// ── SUPABASE CONFIG ───────────────────────────────────────
const SUPABASE_URL      = 'https://ozfmydiutupboupttkmz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_TcG2qZdwO5PQuJAJ701xtg_XArHPpsG';
const ADMIN_PIN         = '1340';
const SHARELYN_PIN      = '1804';
const TERESA_PIN        = '2026';

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

const ALL_CATS = {...CAT, ...TERESA_CAT, ...TERESA_PERSONAL_CAT};

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
// Sharelyn es estudiante universitaria
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

// Teresa Personal - vida cotidiana adulta
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

// Teresa maneja un proyecto de remodelación de casas
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

// ── ESTADO GLOBAL ─────────────────────────────────────────
let currentUser        = null;   // 'admin' | 'sharelyn' | 'teresa'
let currentPerson      = 'sharelyn';
let currentTeresaMode  = 'obra'; // 'obra' | 'personal'
let allTx              = [];     // transacciones de Sharelyn
let teresaTx           = [];     // transacciones de Teresa (obra)
let teresaPersonalTx   = [];     // transacciones de Teresa Personal
let currentFilter = 'all';  // month: 'all' | 'enero' | ...
let currentYear   = null;   // integer, set on first load
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

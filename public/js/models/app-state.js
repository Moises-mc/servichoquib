// ── State ──────────────────────────────────────────────────────
const STATE = {
  user: null,
  token: localStorage.getItem('servilocal_token'),
  chatPartnerId: null,
  contacts: [],
  allContacts: [],
  chatTimer: null,
  activeView: 'dashboard',
  selectedRole: 'cliente',
  chatMessages: [],
  chatAttachment: null,
  bookings: [],
  currentService: null,
  bookingStep: 'form',
  categoryFilter: 'Todos',
};

// ── Data ───────────────────────────────────────────────────────
const CATEGORIES = ['Todos', 'Barbería', 'Carpintería', 'Técnico', 'Transporte', 'Oficios', 'Belleza', 'Tutorías'];

const API = String(window.SERVI_API_URL || `http://${window.location.hostname || '127.0.0.1'}:8000/api`).replace(/\/+$/, '');

let SERVICES = [];
const USERS_DATA = [];


STATE.editingServiceId = null;

const ADMIN_DATA = { loading: false, loaded: false, summary: {}, users: [], services: [], bookings: [] };

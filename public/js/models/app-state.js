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
  chatMessages: [
    { from: 'them', text: '¡Hola! Vi tu solicitud. ¿A qué hora te queda bien?', time: '10:30' },
    { from: 'me', text: 'Hola Carlos, ¿puedes a las 3pm hoy?', time: '10:32' },
    { from: 'them', text: 'Perfecto, a las 3pm te espero. ¿Es en mi local o a domicilio?', time: '10:33' },
    { from: 'me', text: 'En tu local mejor, ya conozco la dirección.', time: '10:35' },
    { from: 'them', text: '¡Listo! Te espero. El servicio incluye lavado y tratamiento sin costo adicional.', time: '10:36' },
  ],
  chatAttachment: null,
  bookings: [
    { id: 'b1', title: 'Corte y afeitado clásico', provider: 'Carlos Mena', client: 'Ana García', date: '2026-09-12', status: 'completado', total: 25000, commission: 2500 },
    { id: 'b2', title: 'Soporte técnico PC', provider: 'Marco Riascos', client: 'Ana García', date: '2026-09-14', status: 'confirmado', total: 50000, commission: 5000 },
    { id: 'b3', title: 'Clases de matemáticas', provider: 'Sandra Moya', client: 'Pedro Morales', date: '2026-09-15', status: 'pendiente', total: 30000, commission: 3000 },
  ],
  currentService: null,
  bookingStep: 'form',
  categoryFilter: 'Todos',
};

// ── Data ───────────────────────────────────────────────────────
const CATEGORIES = ['Todos', 'Barbería', 'Carpintería', 'Técnico', 'Transporte', 'Oficios', 'Belleza', 'Tutorías'];
const DEMO_USERS = {
  'ana@email.com': { id: 'c1', name: 'Ana García', email: 'ana@email.com', role: 'cliente', avatar: 'AG', location: 'Centro, Quibdó', password: 'ana12345' },
  'pedro@email.com': { id: 'c2', name: 'Pedro Morales', email: 'pedro@email.com', role: 'cliente', avatar: 'PM', location: 'Barrio Huapango', password: 'pedro12345' },
  'carlos@email.com': { id: 'p1', name: 'Carlos Mena', email: 'carlos@email.com', role: 'prestador', avatar: 'CM', location: 'Barrio Huapango', password: 'carlos12345', rating: 4.9 },
  'marco@email.com': { id: 'p4', name: 'Marco Riascos', email: 'marco@email.com', role: 'prestador', avatar: 'MR', location: 'Villa del Río', password: 'marco12345', rating: 4.6 },
  'sandra@email.com': { id: 'p6', name: 'Sandra Moya', email: 'sandra@email.com', role: 'prestador', avatar: 'SM', location: 'Virtual', password: 'sandra12345', rating: 4.9 },
  'lucia@email.com': { id: 'p2', name: 'Lucía Torres', email: 'lucia@email.com', role: 'prestador', avatar: 'LT', location: 'Centro, Quibdó', password: 'lucia12345', rating: 4.8 },
  'jesus@email.com': { id: 'p3', name: 'Jesús Palomino', email: 'jesus@email.com', role: 'prestador', avatar: 'JP', location: 'Sector Kennedy, Quibdó', password: 'jesus12345', rating: 4.7 },
  'andres@email.com': { id: 'p5', name: 'Andrés Córdoba', email: 'andres@email.com', role: 'prestador', avatar: 'AC', location: 'Toda la ciudad', password: 'andres12345', rating: 4.5 },
  'fabio@email.com': { id: 'p7', name: 'Fabio Lemos', email: 'fabio@email.com', role: 'prestador', avatar: 'FL', location: 'Quibdó y alrededores', password: 'fabio12345', rating: 4.4 },
  'gloria@email.com': { id: 'p8', name: 'Gloria Pino', email: 'gloria@email.com', role: 'prestador', avatar: 'GP', location: 'Todo Quibdó', password: 'gloria12345', rating: 4.7 },
  'admin@servicios.co': { id: 'a1', name: 'Administrador', email: 'admin@servicios.co', role: 'admin', avatar: 'AD', location: 'Servi Choquib HQ', password: 'admin12345' },
};
const API = String(window.SERVI_API_URL || '').trim().replace(/\/+$/, '');

let SERVICES = [
  { id: 's1', provider: 'Carlos Mena', avatar: 'CM', category: 'Barbería', title: 'Corte y afeitado clásico', desc: 'Corte moderno con máquina y tijeras, afeitado con navaja y tratamiento capilar incluido. Experiencia de 8 años.', price: 25000, unit: 'por servicio', rating: 4.9, reviews: 143, location: 'Barrio Huapango, Quibdó', img: 'photo-1503951914875-452162b0f3f1', available: true },
  { id: 's2', provider: 'Lucía Torres', avatar: 'LT', category: 'Belleza', title: 'Peinado y tratamiento capilar', desc: 'Peinados para eventos, tratamientos hidratantes, alisado y tintes. Atención a domicilio disponible.', price: 35000, unit: 'por sesión', rating: 4.8, reviews: 89, location: 'Centro, Quibdó', img: 'photo-1560066984-138dadb4c035', available: true },
  { id: 's3', provider: 'Jesús Palomino', avatar: 'JP', category: 'Carpintería', title: 'Muebles a medida y reparaciones', desc: 'Fabricación de muebles en madera, reparación de puertas, ventanas y estantes. Trabajo garantizado.', price: 80000, unit: 'por día', rating: 4.7, reviews: 56, location: 'Sector Kennedy, Quibdó', img: 'photo-1558618666-fcd25c85cd64', available: true },
  { id: 's4', provider: 'Marco Riascos', avatar: 'MR', category: 'Técnico', title: 'Soporte técnico PC y celulares', desc: 'Reparación de computadores, instalación de software, recuperación de datos y pantallas móviles.', price: 50000, unit: 'por visita', rating: 4.6, reviews: 201, location: 'Villa del Río, Quibdó', img: 'photo-1518770660439-4636190af475', available: true },
  { id: 's5', provider: 'Andrés Córdoba', avatar: 'AC', category: 'Transporte', title: 'Transporte urbano y encomiendas', desc: 'Servicio de moto-taxi, mensajería y entrega de domicilios en toda la ciudad. Disponible 24h.', price: 5000, unit: 'por trayecto', rating: 4.5, reviews: 378, location: 'Toda la ciudad', img: 'photo-1449965408869-eaa3f722e40d', available: true },
  { id: 's6', provider: 'Sandra Moya', avatar: 'SM', category: 'Tutorías', title: 'Clases de matemáticas y física', desc: 'Refuerzo escolar y universitario en álgebra, cálculo y física. Metodología personalizada.', price: 30000, unit: 'por hora', rating: 4.9, reviews: 64, location: 'A domicilio / Virtual', img: 'photo-1434030216411-0b793f4b4173', available: true },
  { id: 's7', provider: 'Fabio Lemos', avatar: 'FL', category: 'Oficios', title: 'Plomería y fontanería', desc: 'Instalación y reparación de tuberías, grifos y baños. Materiales incluidos en el presupuesto.', price: 60000, unit: 'por servicio', rating: 4.4, reviews: 92, location: 'Quibdó y alrededores', img: 'photo-1558618047-3c8c76ca7d13', available: false },
  { id: 's8', provider: 'Gloria Pino', avatar: 'GP', category: 'Oficios', title: 'Servicio de limpieza del hogar', desc: 'Limpieza profunda de casas, apartamentos y oficinas. Incluye insumos y equipos.', price: 45000, unit: 'por visita', rating: 4.7, reviews: 117, location: 'Todo Quibdó', img: 'photo-1581578731548-c64695cc6952', available: true },
];

// IDs de propietario usados por el adaptador local cuando el backend no está disponible.
SERVICES.forEach((service, index) => { service.ownerId = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'][index]; });

const USERS_DATA = [
  { id: 'c1', name: 'Ana García', email: 'ana@email.com', role: 'cliente', avatar: 'AG', location: 'Centro, Quibdó' },
  { id: 'c2', name: 'Pedro Morales', email: 'pedro@email.com', role: 'cliente', avatar: 'PM', location: 'Barrio Huapango' },
  { id: 'p1', name: 'Carlos Mena', email: 'carlos@email.com', role: 'prestador', avatar: 'CM', location: 'Barrio Huapango', rating: 4.9 },
  { id: 'p2', name: 'Lucía Torres', email: 'lucia@email.com', role: 'prestador', avatar: 'LT', location: 'Centro, Quibdó', rating: 4.8 },
  { id: 'p3', name: 'Jesús Palomino', email: 'jesus@email.com', role: 'prestador', avatar: 'JP', location: 'Sector Kennedy, Quibdó', rating: 4.7 },
  { id: 'p4', name: 'Marco Riascos', email: 'marco@email.com', role: 'prestador', avatar: 'MR', location: 'Villa del Río', rating: 4.6 },
  { id: 'p5', name: 'Andrés Córdoba', email: 'andres@email.com', role: 'prestador', avatar: 'AC', location: 'Toda la ciudad', rating: 4.5 },
  { id: 'p6', name: 'Sandra Moya', email: 'sandra@email.com', role: 'prestador', avatar: 'SM', location: 'Virtual', rating: 4.9 },
  { id: 'p7', name: 'Fabio Lemos', email: 'fabio@email.com', role: 'prestador', avatar: 'FL', location: 'Quibdó y alrededores', rating: 4.4 },
  { id: 'p8', name: 'Gloria Pino', email: 'gloria@email.com', role: 'prestador', avatar: 'GP', location: 'Todo Quibdó', rating: 4.7 },
  { id: 'a1', name: 'Administrador', email: 'admin@servicios.co', role: 'admin', avatar: 'AD', location: 'Servi Choquib HQ' },
];


STATE.editingServiceId = null;

import { hashPassword } from '../../src/utils/password-hasher.js';
import { UserModel } from '../../src/models/user.model.js';
import { ServiceModel } from '../../src/models/service.model.js';
import { BookingModel } from '../../src/models/booking.model.js';
import { MessageModel } from '../../src/models/message.model.js';
import { env } from '../../src/config/env.js';

const DEMO_ACCOUNTS = [
  { id: 'c1', name: 'Ana García', email: 'ana@email.com', role: 'cliente', avatar: 'AG', location: 'Centro, Quibdó', password: 'ana12345' },
  { id: 'c2', name: 'Pedro Morales', email: 'pedro@email.com', role: 'cliente', avatar: 'PM', location: 'Barrio Huapango', password: 'pedro12345' },
  { id: 'p1', name: 'Carlos Mena', email: 'carlos@email.com', role: 'prestador', avatar: 'CM', location: 'Barrio Huapango', rating: 4.9, password: 'carlos12345' },
  { id: 'p2', name: 'Lucía Torres', email: 'lucia@email.com', role: 'prestador', avatar: 'LT', location: 'Centro, Quibdó', rating: 4.8, password: 'lucia12345' },
  { id: 'p3', name: 'Jesús Palomino', email: 'jesus@email.com', role: 'prestador', avatar: 'JP', location: 'Sector Kennedy, Quibdó', rating: 4.7, password: 'jesus12345' },
  { id: 'p4', name: 'Marco Riascos', email: 'marco@email.com', role: 'prestador', avatar: 'MR', location: 'Villa del Río', rating: 4.6, password: 'marco12345' },
  { id: 'p5', name: 'Andrés Córdoba', email: 'andres@email.com', role: 'prestador', avatar: 'AC', location: 'Toda la ciudad', rating: 4.5, password: 'andres12345' },
  { id: 'p6', name: 'Sandra Moya', email: 'sandra@email.com', role: 'prestador', avatar: 'SM', location: 'Virtual', rating: 4.9, password: 'sandra12345' },
  { id: 'p7', name: 'Fabio Lemos', email: 'fabio@email.com', role: 'prestador', avatar: 'FL', location: 'Quibdó y alrededores', rating: 4.4, password: 'fabio12345' },
  { id: 'p8', name: 'Gloria Pino', email: 'gloria@email.com', role: 'prestador', avatar: 'GP', location: 'Todo Quibdó', rating: 4.7, password: 'gloria12345' },
  { id: 'a1', name: 'Administrador', email: 'admin@servicios.co', role: 'admin', avatar: 'AD', location: 'Servi Choquib HQ', password: 'admin12345' },
];

const DEMO_SERVICES = [
  { id: 's1', ownerId: 'p1', provider: 'Carlos Mena', avatar: 'CM', category: 'Barbería', title: 'Corte y afeitado clásico', desc: 'Corte moderno con máquina y tijeras, afeitado con navaja y tratamiento capilar incluido. Experiencia de 8 años.', price: 25000, unit: 'por servicio', rating: 4.9, reviews: 143, location: 'Barrio Huapango, Quibdó', img: 'photo-1503951914875-452162b0f3f1', available: true },
  { id: 's2', ownerId: 'p2', provider: 'Lucía Torres', avatar: 'LT', category: 'Belleza', title: 'Peinado y tratamiento capilar', desc: 'Peinados para eventos, tratamientos hidratantes, alisado y tintes. Atención a domicilio disponible.', price: 35000, unit: 'por sesión', rating: 4.8, reviews: 89, location: 'Centro, Quibdó', img: 'photo-1560066984-138dadb4c035', available: true },
  { id: 's3', ownerId: 'p3', provider: 'Jesús Palomino', avatar: 'JP', category: 'Carpintería', title: 'Muebles a medida y reparaciones', desc: 'Fabricación de muebles en madera, reparación de puertas, ventanas y estantes. Trabajo garantizado.', price: 80000, unit: 'por día', rating: 4.7, reviews: 56, location: 'Sector Kennedy, Quibdó', img: 'photo-1558618666-fcd25c85cd64', available: true },
  { id: 's4', ownerId: 'p4', provider: 'Marco Riascos', avatar: 'MR', category: 'Técnico', title: 'Soporte técnico PC y celulares', desc: 'Reparación de computadores, instalación de software, recuperación de datos y pantallas móviles.', price: 50000, unit: 'por visita', rating: 4.6, reviews: 201, location: 'Villa del Río, Quibdó', img: 'photo-1518770660439-4636190af475', available: true },
  { id: 's5', ownerId: 'p5', provider: 'Andrés Córdoba', avatar: 'AC', category: 'Transporte', title: 'Transporte urbano y encomiendas', desc: 'Servicio de moto-taxi, mensajería y entrega de domicilios en toda la ciudad. Disponible 24h.', price: 5000, unit: 'por trayecto', rating: 4.5, reviews: 378, location: 'Toda la ciudad', img: 'photo-1449965408869-eaa3f722e40d', available: true },
  { id: 's6', ownerId: 'p6', provider: 'Sandra Moya', avatar: 'SM', category: 'Tutorías', title: 'Clases de matemáticas y física', desc: 'Refuerzo escolar y universitario en álgebra, cálculo y física. Metodología personalizada.', price: 30000, unit: 'por hora', rating: 4.9, reviews: 64, location: 'A domicilio / Virtual', img: 'photo-1434030216411-0b793f4b4173', available: true },
  { id: 's7', ownerId: 'p7', provider: 'Fabio Lemos', avatar: 'FL', category: 'Oficios', title: 'Plomería y fontanería', desc: 'Instalación y reparación de tuberías, grifos y baños. Materiales incluidos en el presupuesto.', price: 60000, unit: 'por servicio', rating: 4.4, reviews: 92, location: 'Quibdó y alrededores', img: 'photo-1558618047-3c8c76ca7d13', available: false },
  { id: 's8', ownerId: 'p8', provider: 'Gloria Pino', avatar: 'GP', category: 'Oficios', title: 'Servicio de limpieza del hogar', desc: 'Limpieza profunda de casas, apartamentos y oficinas. Incluye insumos y equipos.', price: 45000, unit: 'por visita', rating: 4.7, reviews: 117, location: 'Todo Quibdó', img: 'photo-1581578731548-c64695cc6952', available: true },
];

const DEMO_BOOKINGS = [
  { id: 'b1', service_id: 's1', client_id: 'c1', provider_id: 'p1', note: '', title: 'Corte y afeitado clásico', provider: 'Carlos Mena', client: 'Ana García', date: '2026-09-08', status: 'completado', total: 25000, commission: 2500, paid: 1, payment_amount: 22500 },
  { id: 'b2', service_id: 's4', client_id: 'c1', provider_id: 'p4', note: '', title: 'Soporte técnico PC y celulares', provider: 'Marco Riascos', client: 'Ana García', date: '2026-09-14', status: 'confirmado', total: 50000, commission: 5000, paid: 0, payment_amount: 0 },
  { id: 'b3', service_id: 's6', client_id: 'c2', provider_id: 'p6', note: '', title: 'Clases de matemáticas y física', provider: 'Sandra Moya', client: 'Pedro Morales', date: '2026-09-15', status: 'pendiente', total: 30000, commission: 3000, paid: 0, payment_amount: 0 },
];

export async function seedDemoData() {
  if (env.nodeEnv === 'production') {
    throw new Error('seedDemoData no debe ejecutarse en producción. Establece SEED_DEMO_DATA=false en las variables de entorno de Vercel.');
  }
  for (const { password, ...account } of DEMO_ACCOUNTS) {
    if (!(await UserModel.findById(account.id))) {
      await UserModel.create({ ...account, email: account.email.toLowerCase(), passwordHash: await hashPassword(password) });
    }
  }
  for (const service of DEMO_SERVICES) {
    if (!(await ServiceModel.findById(service.id))) await ServiceModel.create(service);
  }
  for (const booking of DEMO_BOOKINGS) {
    if (!(await BookingModel.findById(booking.id))) await BookingModel.create(booking);
  }

  const demoMessages = [
    ['p1', 'c1', '¡Hola! Vi tu solicitud. ¿A qué hora te queda bien?'],
    ['c1', 'p1', 'Hola Carlos, ¿puedes a las 3pm hoy?'],
    ['p1', 'c1', 'Perfecto, a las 3pm te espero. ¿Es en mi local o a domicilio?'],
    ['c1', 'p1', 'En tu local mejor, ya conozco la dirección.'],
    ['p1', 'c1', '¡Listo! Te espero. El servicio incluye lavado y tratamiento sin costo adicional.'],
  ];
  for (let index = 0; index < demoMessages.length; index += 1) {
    const [senderId, receiverId, text] = demoMessages[index];
    if (!(await MessageModel.findById(`demo_m${index + 1}`))) {
      const sender = await UserModel.findById(senderId);
      await MessageModel.create({ id: `demo_m${index + 1}`, sender_id: senderId, receiver_id: receiverId, sender_name: sender.name, text, attachment: null });
    }
  }
}

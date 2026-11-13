import { UserModel } from '../models/user.model.js';
import { ServiceModel } from '../models/service.model.js';
import { BookingModel } from '../models/booking.model.js';
import { HttpError } from '../utils/http-error.js';

export async function dashboard(_req, res) {
  const [rawUsers, services, bookings] = await Promise.all([
    UserModel.findAll(), ServiceModel.findAll(), BookingModel.findAll(),
  ]);
  const users = rawUsers.map(UserModel.toPublic);
  const activeUsers = users.filter(user => user.isActive !== false);
  const paidBookings = bookings.filter(booking => Number(booking.paid) === 1 && Number(booking.payment_amount) > 0);
  const commissionRevenue = paidBookings.reduce((sum, booking) => sum + Number(booking.commission || 0), 0);
  const totalPaid = paidBookings.reduce((sum, booking) => sum + Number(booking.payment_amount || 0), 0);
  const summary = {
    users: users.length,
    activeUsers: activeUsers.length,
    clients: users.filter(user => user.role === 'cliente').length,
    providers: users.filter(user => user.role === 'prestador').length,
    admins: users.filter(user => user.role === 'admin').length,
    services: services.length,
    activeServices: services.filter(service => service.available).length,
    bookings: bookings.length,
    pendingBookings: bookings.filter(booking => booking.status === 'pendiente').length,
    completedBookings: bookings.filter(booking => booking.status === 'completado').length,
    paidTransactions: paidBookings.length,
    totalPaid,
    commissionRevenue,
  };
  return res.json({ summary, users, services, bookings });
}

export async function setUserStatus(req, res) {
  const user = await UserModel.findById(req.params.id);
  if (!user) throw new HttpError(404, 'Usuario no encontrado.');
  if (String(user.id) === String(req.user.id)) throw new HttpError(400, 'No puedes suspender tu propia cuenta.');
  if (user.role === 'admin') throw new HttpError(403, 'Por seguridad, no se puede suspender una cuenta administradora desde este panel.');
  const isActive = req.body.isActive === true;
  const updated = await UserModel.update(user, { isActive });
  return res.json({ user: UserModel.toPublic(updated), message: isActive ? 'Cuenta reactivada.' : 'Cuenta suspendida.' });
}

export async function setServiceStatus(req, res) {
  const service = await ServiceModel.findById(req.params.id);
  if (!service) throw new HttpError(404, 'Servicio no encontrado.');
  const updated = await ServiceModel.update(service, { available: req.body.available === true });
  return res.json({ service: updated, message: updated.available ? 'Servicio activado.' : 'Servicio desactivado.' });
}

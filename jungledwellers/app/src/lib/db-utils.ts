import mongoose from 'mongoose';
import { IUser } from '@/models/User';
import { IClient } from '@/models/Client';
import { ISafari } from '@/models/Safari';
import { IBooking } from '@/models/Booking';
import { IInvoice } from '@/models/Invoice';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

// Database connection helper with caching
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function getDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      return mongooseInstance.connection;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// User utilities
export async function createUser(userData: Partial<IUser>) {
  await getDB();
  const User = (await import('@/models/User')).default;
  return new User(userData);
}

export async function findUserByEmail(email: string) {
  await getDB();
  const User = (await import('@/models/User')).default;
  return User.findOne({ email });
}

export async function findUsers(query: any = {}, limit = 10, skip = 0) {
  await getDB();
  const User = (await import('@/models/User')).default;
  return User.find(query)
    .select('-password')
    .limit(limit)
    .skip(skip)
    .sort({ createdAt: -1 });
}

export async function findUserById(id: string) {
  await getDB();
  const User = (await import('@/models/User')).default;
  return User.findById(id).select('-password');
}

// Client utilities
export async function createClient(clientData: Partial<IClient>) {
  await getDB();
  const Client = (await import('@/models/Client')).default;
  return new Client(clientData);
}

export async function findClients(query: any = {}, limit = 10, skip = 0) {
  await getDB();
  const Client = (await import('@/models/Client')).default;
  return Client.find(query)
    .populate('createdBy', 'name email')
    .limit(limit)
    .skip(skip)
    .sort({ createdAt: -1 });
}

export async function findClientById(id: string) {
  await getDB();
  const Client = (await import('@/models/Client')).default;
  return Client.findById(id).populate('createdBy', 'name email');
}

// Safari utilities
export async function createSafari(safariData: Partial<ISafari>) {
  await getDB();
  const Safari = (await import('@/models/Safari')).default;
  return new Safari(safariData);
}

export async function findSafaris(query: any = {}, limit = 10, skip = 0) {
  await getDB();
  const Safari = (await import('@/models/Safari')).default;
  return Safari.find(query)
    .populate('createdBy', 'name email')
    .limit(limit)
    .skip(skip)
    .sort({ createdAt: -1 });
}

export async function findSafariById(id: string) {
  await getDB();
  const Safari = (await import('@/models/Safari')).default;
  return Safari.findById(id).populate('createdBy', 'name email');
}

// Booking utilities
export async function createBooking(bookingData: Partial<IBooking>) {
  await getDB();
  const Booking = (await import('@/models/Booking')).default;
  return new Booking(bookingData);
}

export async function findBookings(query: any = {}, limit = 10, skip = 0) {
  await getDB();
  const Booking = (await import('@/models/Booking')).default;
  return Booking.find(query)
    .populate('safari', 'title duration basePrice currency')
    .populate('client', 'name email phone')
    .populate('createdBy', 'name email')
    .limit(limit)
    .skip(skip)
    .sort({ createdAt: -1 });
}

export async function findBookingById(id: string) {
  await getDB();
  const Booking = (await import('@/models/Booking')).default;
  return Booking.findById(id)
    .populate('safari')
    .populate('client')
    .populate('createdBy', 'name email');
}

// Invoice utilities
export async function createInvoice(invoiceData: Partial<IInvoice>) {
  await getDB();
  const Invoice = (await import('@/models/Invoice')).default;
  return new Invoice(invoiceData);
}

export async function findInvoices(query: any = {}, limit = 10, skip = 0) {
  await getDB();
  const Invoice = (await import('@/models/Invoice')).default;
  return Invoice.find(query)
    .populate('client', 'name email phone')
    .populate('safari', 'title duration')
    .populate('booking', 'bookingNumber startDate endDate')
    .populate('createdBy', 'name email')
    .limit(limit)
    .skip(skip)
    .sort({ createdAt: -1 });
}

export async function findInvoiceById(id: string) {
  await getDB();
  const Invoice = (await import('@/models/Invoice')).default;
  return Invoice.findById(id)
    .populate('client')
    .populate('safari')
    .populate('booking')
    .populate('createdBy', 'name email');
}

// Dashboard statistics
export async function getDashboardStats() {
  await getDB();
  const Safari = (await import('@/models/Safari')).default;
  const Booking = (await import('@/models/Booking')).default;
  const Invoice = (await import('@/models/Invoice')).default;
  const Client = (await import('@/models/Client')).default;

  const [totalSafaris, activeBookings, pendingInvoices, totalRevenue] = await Promise.all([
    Safari.countDocuments({ isActive: true }),
    Booking.countDocuments({ status: { $in: ['pending', 'confirmed'] } }),
    Invoice.countDocuments({ status: { $in: ['draft', 'sent', 'overdue'] } }),
    Invoice.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ])
  ]);

  return {
    totalSafaris,
    activeBookings,
    pendingInvoices,
    totalRevenue: totalRevenue[0]?.total || 0
  };
}

import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db-utils';
import Booking from '@/models/Booking';
import mongoose from 'mongoose';

// GET /api/bookings - List bookings with search and pagination
export async function GET(request: NextRequest) {
  try {
    await getDB();
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build search query
    const searchQuery: any = {};
    
    if (search) {
      searchQuery.$or = [
        { bookingNumber: { $regex: search, $options: 'i' } },
        { 'client.name': { $regex: search, $options: 'i' } },
        { 'safari.title': { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      searchQuery.status = status;
    }

    // Get bookings with pagination and populate references
    const bookings = await Booking.find(searchQuery)
      .populate('client', 'name email phone company')
      .populate('safari', 'title description duration basePrice currency')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const total = await Booking.countDocuments(searchQuery);

    return NextResponse.json({
      success: true,
      data: bookings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

// POST /api/bookings - Create new booking
export async function POST(request: NextRequest) {
  try {
    await getDB();
    
    const body = await request.json();
    const {
      clientId,
      safariId,
      startDate,
      endDate,
      pax,
      totalPrice,
      currency = 'USD',
      depositAmount,
      balanceAmount,
      status = 'pending',
      specialRequests = '',
      paymentStatus = 'pending',
      paymentMethod
    } = body;

    // Validate required fields
    if (!clientId || !safariId || !startDate || !endDate || !pax || !totalPrice) {
      return NextResponse.json(
        { success: false, error: 'Client, Safari, dates, pax, and total price are required' },
        { status: 400 }
      );
    }

    // Get client to retrieve emergency contact using raw MongoDB
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not available');
    }
    const clientsCollection = db.collection('clients');
    
    const client = await clientsCollection.findOne({ _id: new mongoose.Types.ObjectId(clientId) });
    
    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 400 }
      );
    }

    // Validate emergency contact exists on client
    if (!client.emergencyContact || !client.emergencyContact.name || !client.emergencyContact.phone || !client.emergencyContact.relationship) {
      return NextResponse.json(
        { success: false, error: 'Client must have emergency contact information before creating booking' },
        { status: 400 }
      );
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) {
      return NextResponse.json(
        { success: false, error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Generate booking number
    const bookingNumber = `JD-${Date.now().toString().slice(-6)}`;

    // Create new booking
    const booking = new Booking({
      bookingNumber,
      client: new mongoose.Types.ObjectId(clientId),
      safari: new mongoose.Types.ObjectId(safariId),
      startDate: start,
      endDate: end,
      pax: parseInt(pax),
      totalPrice: parseFloat(totalPrice),
      currency,
      depositAmount: parseFloat(depositAmount) || 0,
      balanceAmount: parseFloat(balanceAmount) || (parseFloat(totalPrice) - (parseFloat(depositAmount) || 0)),
      status,
      specialRequests,
      emergencyContact: {
        name: client.emergencyContact.name,
        phone: client.emergencyContact.phone,
        relationship: client.emergencyContact.relationship
      },
      paymentStatus,
      paymentMethod,
      createdBy: new mongoose.Types.ObjectId() // TODO: Get from auth context
    });

    await booking.save();

    // Populate the booking for response
    await booking.populate([
      { path: 'client', select: 'name email phone company' },
      { path: 'safari', select: 'title description duration basePrice currency' }
    ]);

    return NextResponse.json({
      success: true,
      data: booking,
      message: 'Booking created successfully'
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}

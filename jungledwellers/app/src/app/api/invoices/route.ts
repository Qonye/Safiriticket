import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db-utils';
import Invoice from '@/models/Invoice';
import mongoose from 'mongoose';

// GET /api/invoices - List invoices with search and pagination
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
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { 'client.name': { $regex: search, $options: 'i' } },
        { 'booking.bookingNumber': { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      searchQuery.status = status;
    }

    // Get invoices with pagination and populate references
    const invoices = await Invoice.find(searchQuery)
      .populate('client', 'name email phone company address')
      .populate('booking', 'bookingNumber startDate endDate pax')
      .populate('safari', 'name destination duration basePrice')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const total = await Invoice.countDocuments(searchQuery);

    return NextResponse.json({
      success: true,
      data: invoices,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}

// POST /api/invoices - Create new invoice
export async function POST(request: NextRequest) {
  try {
    await getDB();
    
    const body = await request.json();
    const {
      clientId,
      bookingId,
      safariId,
      invoiceDate,
      dueDate,
      items,
      subtotal,
      taxRate = 0,
      taxAmount = 0,
      totalAmount,
      notes = '',
      terms = '',
      status = 'draft'
    } = body;

    // Validate required fields
    if (!clientId || !safariId || !invoiceDate || !dueDate || !items || !totalAmount) {
      return NextResponse.json(
        { success: false, error: 'Client, Safari, dates, items, and total amount are required' },
        { status: 400 }
      );
    }

    // Validate dates
    const invoice = new Date(invoiceDate);
    const due = new Date(dueDate);
    
    if (due < invoice) {
      return NextResponse.json(
        { success: false, error: 'Due date must be after invoice date' },
        { status: 400 }
      );
    }

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;

    // Create new invoice
    const invoiceData = new Invoice({
      invoiceNumber,
      client: new mongoose.Types.ObjectId(clientId),
      booking: bookingId ? new mongoose.Types.ObjectId(bookingId) : undefined,
      safari: new mongoose.Types.ObjectId(safariId),
      invoiceDate: invoice,
      dueDate: due,
      items: items || [],
      subtotal: parseFloat(subtotal) || 0,
      taxRate: parseFloat(taxRate) || 0,
      taxAmount: parseFloat(taxAmount) || 0,
      totalAmount: parseFloat(totalAmount),
      notes,
      terms,
      status,
      createdBy: new mongoose.Types.ObjectId() // TODO: Get from auth context
    });

    await invoiceData.save();

    // Populate the invoice for response
    await invoiceData.populate([
      { path: 'client', select: 'name email phone company address' },
      { path: 'booking', select: 'bookingNumber startDate endDate pax' },
      { path: 'safari', select: 'name destination duration basePrice' }
    ]);

    return NextResponse.json({
      success: true,
      data: invoiceData,
      message: 'Invoice created successfully'
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create invoice' },
      { status: 500 }
    );
  }
}

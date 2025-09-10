import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db-utils';
import Invoice from '@/models/Invoice';
import Booking from '@/models/Booking';
import mongoose from 'mongoose';

// POST /api/invoices/generate-from-booking - Generate invoice from booking
export async function POST(request: NextRequest) {
  try {
    await getDB();
    
    const body = await request.json();
    const { bookingId, invoiceDate, dueDate, notes = '', terms = '' } = body;

    // Validate required fields
    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    // Get booking with populated data
    const booking = await Booking.findById(bookingId)
      .populate('client', 'name email phone company address')
      .populate('safari', 'name destination duration basePrice description inclusions exclusions itinerary accommodation activities transportation meals parkFees guides')
      .lean() as any;

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if invoice already exists for this booking
    const existingInvoice = await Invoice.findOne({ booking: bookingId });
    if (existingInvoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice already exists for this booking' },
        { status: 400 }
      );
    }

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;

    // Create invoice items from safari data
    const items = [];

    // Base safari package
    items.push({
      description: `${booking.safari.name} - ${booking.safari.destination}`,
      quantity: booking.pax,
      unitPrice: booking.safari.basePrice,
      total: booking.safari.basePrice * booking.pax,
      category: 'Safari Package'
    });

    // Add inclusions as detailed items (even if no price)
    if (booking.safari.inclusions && booking.safari.inclusions.length > 0) {
      booking.safari.inclusions.forEach((inclusion: any) => {
        if (inclusion.trim()) {
          items.push({
            description: `Included: ${inclusion}`,
            quantity: booking.pax,
            unitPrice: 0, // Inclusions are included in base price
            total: 0,
            category: 'Inclusions'
          });
        }
      });
    }

    // Add exclusions as detailed items (for transparency)
    if (booking.safari.exclusions && booking.safari.exclusions.length > 0) {
      booking.safari.exclusions.forEach((exclusion: any) => {
        if (exclusion.trim()) {
          items.push({
            description: `Not Included: ${exclusion}`,
            quantity: 1,
            unitPrice: 0, // Exclusions are informational
            total: 0,
            category: 'Exclusions'
          });
        }
      });
    }

    // Add itinerary as detailed items
    if (booking.safari.itinerary && booking.safari.itinerary.length > 0) {
      booking.safari.itinerary.forEach((day: any) => {
        if (day.title && day.description) {
          items.push({
            description: `Day ${day.day}: ${day.title}`,
            quantity: 1,
            unitPrice: 0, // Itinerary is included in base price
            total: 0,
            category: 'Itinerary'
          });
          // Add day description as a sub-item
          if (day.description.trim()) {
            items.push({
              description: `  ${day.description}`,
              quantity: 1,
              unitPrice: 0,
              total: 0,
              category: 'Itinerary Details'
            });
          }
        }
      });
    }

    // Add accommodation items if available
    if (booking.safari.accommodation && booking.safari.accommodation.length > 0) {
      booking.safari.accommodation.forEach((acc: any) => {
        if (acc.name && acc.price > 0) {
          items.push({
            description: `Accommodation: ${acc.name} (${acc.location})`,
            quantity: acc.nights || 1,
            unitPrice: acc.price,
            total: acc.price * (acc.nights || 1),
            category: 'Accommodation'
          });
        }
      });
    }

    // Add activities if available
    if (booking.safari.activities && booking.safari.activities.length > 0) {
      booking.safari.activities.forEach((activity: any) => {
        if (activity.name && activity.price > 0) {
          items.push({
            description: `Activity: ${activity.name}`,
            quantity: booking.pax,
            unitPrice: activity.price,
            total: activity.price * booking.pax,
            category: 'Activities'
          });
        }
      });
    }

    // Add transportation if available
    if (booking.safari.transportation && booking.safari.transportation.length > 0) {
      booking.safari.transportation.forEach((transport: any) => {
        if (transport.type && transport.price > 0) {
          items.push({
            description: `Transportation: ${transport.type}`,
            quantity: 1,
            unitPrice: transport.price,
            total: transport.price,
            category: 'Transportation'
          });
        }
      });
    }

    // Add meals if available
    if (booking.safari.meals && booking.safari.meals.length > 0) {
      booking.safari.meals.forEach((meal: any) => {
        if (meal.type && meal.price > 0) {
          items.push({
            description: `Meals: ${meal.type}`,
            quantity: booking.pax,
            unitPrice: meal.price,
            total: meal.price * booking.pax,
            category: 'Meals'
          });
        }
      });
    }

    // Add park fees if available
    if (booking.safari.parkFees && booking.safari.parkFees.length > 0) {
      booking.safari.parkFees.forEach((park: any) => {
        if (park.park && park.price > 0) {
          items.push({
            description: `Park Fees: ${park.park}`,
            quantity: booking.pax,
            unitPrice: park.price,
            total: park.price * booking.pax,
            category: 'Park Fees'
          });
        }
      });
    }

    // Add guides if available
    if (booking.safari.guides && booking.safari.guides.length > 0) {
      booking.safari.guides.forEach((guide: any) => {
        if (guide.name && guide.price > 0) {
          items.push({
            description: `Guide: ${guide.name} (${guide.type})`,
            quantity: 1,
            unitPrice: guide.price,
            total: guide.price,
            category: 'Guides'
          });
        }
      });
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const taxRate = 0; // No tax for now, can be configured later
    const taxAmount = subtotal * (taxRate / 100);
    const totalAmount = subtotal + taxAmount;

    // Set default dates if not provided
    const invoiceDateObj = invoiceDate ? new Date(invoiceDate) : new Date();
    const dueDateObj = dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    // Create new invoice
    const invoice = new Invoice({
      invoiceNumber,
      client: booking.client._id,
      booking: booking._id,
      safari: booking.safari._id,
      invoiceDate: invoiceDateObj,
      dueDate: dueDateObj,
      items,
      subtotal,
      taxRate,
      taxAmount,
      totalAmount,
      notes: notes || `Generated from booking ${booking.bookingNumber}`,
      terms: terms || 'Payment due within 30 days of invoice date.',
      status: 'draft',
      createdBy: new mongoose.Types.ObjectId() // TODO: Get from auth context
    });

    await invoice.save();

    // Populate the invoice for response
    await invoice.populate([
      { path: 'client', select: 'name email phone company address' },
      { path: 'booking', select: 'bookingNumber startDate endDate pax specialRequests' },
      { path: 'safari', select: 'name destination duration basePrice description inclusions exclusions itinerary' }
    ]);

    return NextResponse.json({
      success: true,
      data: invoice,
      message: 'Invoice generated successfully from booking'
    });
  } catch (error) {
    console.error('Error generating invoice from booking:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate invoice from booking' },
      { status: 500 }
    );
  }
}

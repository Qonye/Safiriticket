import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db-utils';
import Booking from '@/models/Booking';

// GET /api/bookings/[id] - Get single booking
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getDB();
    
    const { id } = await params;
    const booking = await Booking.findById(id)
      .populate('client', 'name email phone company address')
      .populate('safari', 'name destination duration basePrice description inclusions exclusions itinerary')
      .populate('createdBy', 'name email')
      .lean();
    
    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch booking' },
      { status: 500 }
    );
  }
}

// PUT /api/bookings/[id] - Update booking
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await getDB();
    
    const body = await request.json();
    const {
      startDate,
      endDate,
      pax,
      totalPrice,
      depositAmount,
      status,
      notes,
      specialRequests
    } = body;

    // Validate dates if provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (start >= end) {
        return NextResponse.json(
          { success: false, error: 'End date must be after start date' },
          { status: 400 }
        );
      }
    }

    // Update booking
    const updateData: any = {};
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate) updateData.endDate = new Date(endDate);
    if (pax) updateData.pax = parseInt(pax);
    if (totalPrice) updateData.totalPrice = parseFloat(totalPrice);
    if (depositAmount !== undefined) updateData.depositAmount = parseFloat(depositAmount);
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (specialRequests !== undefined) updateData.specialRequests = specialRequests;

    const booking = await Booking.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'client', select: 'name email phone company' },
      { path: 'safari', select: 'name destination duration basePrice' }
    ]);

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: booking,
      message: 'Booking updated successfully'
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update booking' },
      { status: 500 }
    );
  }
}

// DELETE /api/bookings/[id] - Delete booking
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await getDB();
    
    const { id: deleteId } = await params;
    const booking = await Booking.findByIdAndDelete(deleteId);
    
    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Booking deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting booking:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete booking' },
      { status: 500 }
    );
  }
}

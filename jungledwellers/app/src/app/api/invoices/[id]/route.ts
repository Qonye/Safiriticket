import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db-utils';
import Invoice from '@/models/Invoice';

// GET /api/invoices/[id] - Get single invoice
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await getDB();
    
    const invoice = await Invoice.findById(params.id)
      .populate('client', 'name email phone company address')
      .populate('booking', 'bookingNumber startDate endDate pax specialRequests')
      .populate('safari', 'name destination duration basePrice description inclusions exclusions itinerary')
      .populate('createdBy', 'name email')
      .lean();
    
    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invoice' },
      { status: 500 }
    );
  }
}

// PUT /api/invoices/[id] - Update invoice
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await getDB();
    
    const body = await request.json();
    const {
      invoiceDate,
      dueDate,
      items,
      subtotal,
      taxRate,
      taxAmount,
      totalAmount,
      notes,
      terms,
      status
    } = body;

    // Validate dates if provided
    if (invoiceDate && dueDate) {
      const invoice = new Date(invoiceDate);
      const due = new Date(dueDate);
      
      if (due < invoice) {
        return NextResponse.json(
          { success: false, error: 'Due date must be after invoice date' },
          { status: 400 }
        );
      }
    }

    // Update invoice
    const updateData: any = {};
    if (invoiceDate) updateData.invoiceDate = new Date(invoiceDate);
    if (dueDate) updateData.dueDate = new Date(dueDate);
    if (items) updateData.items = items;
    if (subtotal !== undefined) updateData.subtotal = parseFloat(subtotal);
    if (taxRate !== undefined) updateData.taxRate = parseFloat(taxRate);
    if (taxAmount !== undefined) updateData.taxAmount = parseFloat(taxAmount);
    if (totalAmount !== undefined) updateData.totalAmount = parseFloat(totalAmount);
    if (notes !== undefined) updateData.notes = notes;
    if (terms !== undefined) updateData.terms = terms;
    if (status) updateData.status = status;

    const invoice = await Invoice.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'client', select: 'name email phone company address' },
      { path: 'booking', select: 'bookingNumber startDate endDate pax' },
      { path: 'safari', select: 'name destination duration basePrice' }
    ]);

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: invoice,
      message: 'Invoice updated successfully'
    });
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update invoice' },
      { status: 500 }
    );
  }
}

// DELETE /api/invoices/[id] - Delete invoice
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await getDB();
    
    const invoice = await Invoice.findByIdAndDelete(params.id);
    
    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Invoice deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete invoice' },
      { status: 500 }
    );
  }
}

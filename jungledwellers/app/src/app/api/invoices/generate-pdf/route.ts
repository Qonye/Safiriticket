import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fillInvoiceTemplate, generateInvoiceDataFromBooking, InvoiceData } from '@/lib/pdf-utils';
import Booking from '@/models/Booking';
import Safari from '@/models/Safari';
import Client from '@/models/Client';
import Invoice from '@/models/Invoice';

export async function POST(request: NextRequest) {
  try {
    const { invoiceId, bookingId } = await request.json();

    if (!invoiceId && !bookingId) {
      return NextResponse.json(
        { error: 'Either invoiceId or bookingId is required' },
        { status: 400 }
      );
    }

    let invoiceData: InvoiceData;

    if (bookingId) {
      // Generate invoice from booking
      const booking = await Booking.findById(bookingId)
        .populate('safari')
        .populate('client')
        .lean() as any;

      if (!booking) {
        return NextResponse.json(
          { error: 'Booking not found' },
          { status: 404 }
        );
      }

      invoiceData = generateInvoiceDataFromBooking(booking, booking.safari, booking.client);
    } else if (invoiceId) {
      // Generate invoice from existing invoice data
      const invoice = await Invoice.findById(invoiceId)
        .populate('client')
        .populate('safari')
        .populate('booking')
        .lean() as any;

      if (!invoice) {
        return NextResponse.json(
          { error: 'Invoice not found' },
          { status: 404 }
        );
      }

      // Convert invoice data to the format expected by the template
      invoiceData = {
        number: invoice.invoiceNumber,
        clientName: invoice.client?.name || 'Unknown Client',
        clientEmail: invoice.client?.email || '',
        dueDate: new Date(invoice.dueDate).toLocaleDateString(),
        items: invoice.items || [],
        subtotal: invoice.subtotal || 0,
        tax: invoice.taxAmount || 0,
        total: invoice.total || 0, // Use 'total' not 'totalAmount'
        currency: invoice.currency || 'USD',
        createdBy: 'System', // This should come from the user session
        creationDate: new Date(invoice.createdAt).toLocaleDateString(), // Use 'createdAt' not 'invoiceDate'
        paymentDetails: {
          accountName: 'JUNGLE DWELLERS LTD',
          accountNumber: '0254001002',
          bankName: 'DIAMOND TRUST BANK',
          swiftCode: 'DTKEKENA',
          currency: invoice.currency || 'USD',
          additionalInfo: '(Please use your name or invoice number as payment reference)'
        }
      };
    } else {
      return NextResponse.json(
        { error: 'Either invoiceId or bookingId is required' },
        { status: 400 }
      );
    }

    // Read the invoice template
    const templatePath = join(process.cwd(), 'src', 'templates', 'invoice.html');
    const template = readFileSync(templatePath, 'utf8');

    // Fill the template with invoice data
    const filledTemplate = fillInvoiceTemplate(template, invoiceData);

    // Return the HTML for PDF generation
    return new NextResponse(filledTemplate, {
      headers: {
        'Content-Type': 'text/html',
      },
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}

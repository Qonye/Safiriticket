import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db-utils';
import PaymentPreset from '@/models/PaymentPreset';

// GET /api/payment-presets - List payment presets
export async function GET(request: NextRequest) {
  try {
    await getDB();
    
    const { searchParams } = new URL(request.url);
    const currency = searchParams.get('currency');
    const activeOnly = searchParams.get('active') !== 'false'; // Default to active only

    // Build query
    const query: any = {};
    if (currency) {
      query.currency = currency;
    }
    if (activeOnly) {
      query.isActive = true;
    }

    // Get payment presets
    const presets = await PaymentPreset.find(query)
      .sort({ isDefault: -1, name: 1 }) // Default presets first, then alphabetical
      .lean();

    return NextResponse.json({
      success: true,
      data: presets
    });
  } catch (error) {
    console.error('Error fetching payment presets:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payment presets' },
      { status: 500 }
    );
  }
}

// POST /api/payment-presets - Create payment preset
export async function POST(request: NextRequest) {
  try {
    await getDB();
    
    const body = await request.json();
    const {
      name,
      accountName,
      accountNumber,
      bankName,
      swiftCode,
      currency,
      additionalInfo,
      isDefault = false
    } = body;

    // Validate required fields
    if (!name || !accountName || !accountNumber || !bankName || !swiftCode || !currency) {
      return NextResponse.json(
        { success: false, error: 'Name, account name, account number, bank name, SWIFT code, and currency are required' },
        { status: 400 }
      );
    }

    // If setting as default, unset other defaults for this currency
    if (isDefault) {
      await PaymentPreset.updateMany(
        { currency, isDefault: true },
        { isDefault: false }
      );
    }

    // Create new payment preset
    const preset = new PaymentPreset({
      name,
      accountName,
      accountNumber,
      bankName,
      swiftCode,
      currency,
      additionalInfo: additionalInfo || '(Please use your name or invoice number as payment reference)',
      isDefault,
      isActive: true
    });

    await preset.save();

    return NextResponse.json({
      success: true,
      data: preset,
      message: 'Payment preset created successfully'
    });
  } catch (error) {
    console.error('Error creating payment preset:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create payment preset' },
      { status: 500 }
    );
  }
}

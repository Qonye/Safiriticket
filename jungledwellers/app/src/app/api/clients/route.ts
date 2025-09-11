import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db-utils';
import Client from '@/models/Client';
import mongoose from 'mongoose';

// GET /api/clients - List clients with search and pagination
export async function GET(request: NextRequest) {
  try {
    await getDB();
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build search query
    const searchQuery = search
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } },
            { company: { $regex: search, $options: 'i' } }
          ]
        }
      : {};

    // Get clients with pagination
    const clients = await Client.find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const total = await Client.countDocuments(searchQuery);

    return NextResponse.json({
      success: true,
      data: clients,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch clients' },
      { status: 500 }
    );
  }
}

// POST /api/clients - Create new client
export async function POST(request: NextRequest) {
  try {
    await getDB();
    
    const body = await request.json();
    const { name, email, phone, company, address, emergencyContact, notes } = body;
    
    // Debug logging
    console.log('Creating client with data:', { name, email, phone, company, address, emergencyContact, notes });

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Check if client with email already exists
    const existingClient = await Client.findOne({ email });
    if (existingClient) {
      return NextResponse.json(
        { success: false, error: 'Client with this email already exists' },
        { status: 400 }
      );
    }

    // Create new client
    const clientData: any = {
      name,
      email,
      phone: phone || undefined,
      company: company || undefined,
      notes: notes || undefined,
      createdBy: new mongoose.Types.ObjectId() // TODO: Get from auth context
    };

    // Handle address object
    if (address && typeof address === 'object') {
      clientData.address = {
        street: address.street || undefined,
        city: address.city || undefined,
        state: address.state || undefined,
        country: address.country || undefined,
        postalCode: address.postalCode || undefined
      };
    }

    // Handle emergency contact object
    if (emergencyContact && typeof emergencyContact === 'object') {
      if (emergencyContact.name || emergencyContact.phone || emergencyContact.relationship) {
        const emergencyContactData: any = {};
        if (emergencyContact.name) emergencyContactData.name = emergencyContact.name;
        if (emergencyContact.phone) emergencyContactData.phone = emergencyContact.phone;
        if (emergencyContact.relationship) emergencyContactData.relationship = emergencyContact.relationship;
        
        clientData.emergencyContact = emergencyContactData;
      }
    }

    const client = new Client(clientData);
    await client.save();

    return NextResponse.json({
      success: true,
      data: client,
      message: 'Client created successfully'
    });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create client' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db-utils';
import Client from '@/models/Client';
import mongoose from 'mongoose';

// GET /api/clients/[id] - Get single client
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getDB();
    
    const { id } = await params;
    
    // Try without .lean() first to see if that's the issue
    const client = await Client.findById(id);
    
    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }

    
    // Convert to plain object for response
    const clientData = client.toObject();

    return NextResponse.json({
      success: true,
      data: clientData
    });
  } catch (error) {
    console.error('Error fetching client:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch client' },
      { status: 500 }
    );
  }
}

// PUT /api/clients/[id] - Update client
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getDB();
    
    const { id } = await params;
    const body = await request.json();
    const { name, email, phone, company, address, emergencyContact, notes } = body;
    

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Check if client with email already exists (excluding current client)
    const existingClient = await Client.findOne({ 
      email, 
      _id: { $ne: id } 
    });
    
    if (existingClient) {
      return NextResponse.json(
        { success: false, error: 'Client with this email already exists' },
        { status: 400 }
      );
    }

    // Update client
    const updateData: any = {
      name,
      email,
      phone: phone || undefined,
      company: company || undefined,
      notes: notes || undefined
    };

    // Handle address object
    if (address && typeof address === 'object') {
      updateData.address = {
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
        
        updateData.emergencyContact = emergencyContactData;
      }
    }

    
    // Use raw MongoDB collection for update
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not available');
    }
    const collection = db.collection('clients');
    
    await collection.updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: updateData }
    );
    
    // Fetch the updated client
    const client = await Client.findById(id);

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }


    return NextResponse.json({
      success: true,
      data: client,
      message: 'Client updated successfully'
    });
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update client' },
      { status: 500 }
    );
  }
}

// DELETE /api/clients/[id] - Delete client
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getDB();
    
    const { id } = await params;
    const client = await Client.findByIdAndDelete(id);
    
    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Client deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete client' },
      { status: 500 }
    );
  }
}

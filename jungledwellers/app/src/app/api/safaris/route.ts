import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db-utils';
import Safari from '@/models/Safari';
import mongoose from 'mongoose';

// GET /api/safaris - List safaris with search and pagination
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
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { tags: { $regex: search, $options: 'i' } }
          ]
        }
      : {};

    // Get safaris with pagination
    const safaris = await Safari.find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const total = await Safari.countDocuments(searchQuery);

    return NextResponse.json({
      success: true,
      data: safaris,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching safaris:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch safaris' },
      { status: 500 }
    );
  }
}

// POST /api/safaris - Create new safari
export async function POST(request: NextRequest) {
  try {
    await getDB();
    
    const body = await request.json();
    const {
      title,
      description,
      duration,
      minPax,
      maxPax,
      basePrice,
      currency = 'USD',
      inclusions,
      exclusions,
      itinerary,
      tags,
      isActive = true
    } = body;

    // Validate required fields
    if (!title || !description || !duration || !minPax || !maxPax || !basePrice) {
      return NextResponse.json(
        { success: false, error: 'Title, description, duration, minPax, maxPax, and basePrice are required' },
        { status: 400 }
      );
    }

    // Create new safari
    const safari = new Safari({
      title,
      description,
      duration: parseInt(duration),
      minPax: parseInt(minPax),
      maxPax: parseInt(maxPax),
      basePrice: parseFloat(basePrice),
      currency,
      inclusions: inclusions || [],
      exclusions: exclusions || [],
      itinerary: itinerary || [],
      tags: tags || [],
      isActive,
      createdBy: new mongoose.Types.ObjectId() // TODO: Get from auth context
    });

    await safari.save();

    return NextResponse.json({
      success: true,
      data: safari,
      message: 'Safari created successfully'
    });
  } catch (error) {
    console.error('Error creating safari:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create safari' },
      { status: 500 }
    );
  }
}

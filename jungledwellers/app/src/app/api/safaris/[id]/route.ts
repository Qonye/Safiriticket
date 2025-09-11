import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db-utils';
import Safari from '@/models/Safari';

// GET /api/safaris/[id] - Get single safari
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getDB();
    
    const { id } = await params;
    const safari = await Safari.findById(id)
      .populate('createdBy', 'name email')
      .lean();
    
    if (!safari) {
      return NextResponse.json(
        { success: false, error: 'Safari not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: safari
    });
  } catch (error) {
    console.error('Error fetching safari:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch safari' },
      { status: 500 }
    );
  }
}

// PUT /api/safaris/[id] - Update safari
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await getDB();
    
    const body = await request.json();
    const {
      name,
      description,
      destination,
      duration,
      maxPax,
      basePrice,
      inclusions,
      exclusions,
      itinerary,
      accommodation,
      activities,
      transportation,
      meals,
      parkFees,
      guides,
      isActive
    } = body;

    // Validate required fields
    if (!name || !description || !destination || !duration || !maxPax || !basePrice) {
      return NextResponse.json(
        { success: false, error: 'Name, description, destination, duration, maxPax, and basePrice are required' },
        { status: 400 }
      );
    }

    // Update safari
    const safari = await Safari.findByIdAndUpdate(
      id,
      {
        name,
        description,
        destination,
        duration: parseInt(duration),
        maxPax: parseInt(maxPax),
        basePrice: parseFloat(basePrice),
        inclusions: inclusions || [],
        exclusions: exclusions || [],
        itinerary: itinerary || [],
        accommodation: accommodation || [],
        activities: activities || [],
        transportation: transportation || [],
        meals: meals || [],
        parkFees: parkFees || [],
        guides: guides || [],
        isActive: isActive !== undefined ? isActive : true
      },
      { new: true, runValidators: true }
    );

    if (!safari) {
      return NextResponse.json(
        { success: false, error: 'Safari not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: safari,
      message: 'Safari updated successfully'
    });
  } catch (error) {
    console.error('Error updating safari:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update safari' },
      { status: 500 }
    );
  }
}

// DELETE /api/safaris/[id] - Delete safari
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getDB();
    
    const { id: deleteId } = await params;
    const safari = await Safari.findByIdAndDelete(deleteId);
    
    if (!safari) {
      return NextResponse.json(
        { success: false, error: 'Safari not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Safari deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting safari:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete safari' },
      { status: 500 }
    );
  }
}

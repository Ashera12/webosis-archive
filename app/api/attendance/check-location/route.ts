import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in meters
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lng = parseFloat(searchParams.get('lng') || '0');

    if (!lat || !lng) {
      return NextResponse.json(
        { success: false, error: 'Missing latitude or longitude' },
        { status: 400 }
      );
    }

    // Get active school location config
    const { data: schoolConfig, error } = await supabase
      .from('school_location_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (error || !schoolConfig) {
      return NextResponse.json(
        { success: false, error: 'School location not configured' },
        { status: 404 }
      );
    }

    // Calculate distance from school
    const distance = calculateDistance(
      lat,
      lng,
      schoolConfig.latitude,
      schoolConfig.longitude
    );

    const within = distance <= schoolConfig.radius_meters;

    return NextResponse.json({
      success: true,
      within,
      distance: Math.round(distance),
      schoolName: schoolConfig.location_name,
      allowedRadius: schoolConfig.radius_meters,
    });
  } catch (error: any) {
    console.error('Check location error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

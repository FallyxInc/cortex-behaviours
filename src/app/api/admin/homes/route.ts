import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const rootRef = adminDb.ref('/');
    const snapshot = await rootRef.once('value');
    
    if (!snapshot.exists()) {
      return NextResponse.json({
        success: true,
        homes: []
      });
    }

    const data = snapshot.val();
    const homes: string[] = [];

    for (const key in data) {
      if (key === 'users' || key === 'reviews') {
        continue;
      }

      const homeData = data[key];
      if (homeData && typeof homeData === 'object' && 'behaviours' in homeData) {
        homes.push(key);
      }
    }

    return NextResponse.json({
      success: true,
      homes: homes.sort()
    });

  } catch (error: any) {
    console.error('Error fetching homes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch homes', details: error.message },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pollId } = await params;
    const body = await request.json();
    const { option_id } = body;

    if (!option_id) {
      return NextResponse.json(
        { error: 'Option ID is required' },
        { status: 400 }
      );
    }

    // Get user session to detect role
    const session = await auth();
    let voterRole = 'anonymous';
    let voterId = null;

    if (session?.user) {
      voterId = session.user.id;
      // Get user role from users table
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();
      
      if (userData?.role) {
        voterRole = userData.role;
      }
    } else {
      // Anonymous voter - use IP or generate unique ID
      const forwarded = request.headers.get('x-forwarded-for');
      const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
      voterId = `anon_${ip}`;
    }

    console.log(`[polls/vote] User: ${voterId}, Role: ${voterRole}, Option: ${option_id}`);

    // Check if user already voted (if logged in)
    if (session?.user) {
      const { data: existingVote } = await supabase
        .from('poll_votes')
        .select('id')
        .eq('poll_id', pollId)
        .eq('user_id', session.user.id)
        .single();

      if (existingVote) {
        return NextResponse.json(
          { error: 'You have already voted in this poll' },
          { status: 400 }
        );
      }
    }

    // Record the vote
    const { error: voteError } = await supabase
      .from('poll_votes')
      .insert({
        poll_id: pollId,
        option_id: option_id,
        user_id: session?.user?.id || null,
        voter_role: voterRole,
        voter_identifier: voterId,
      });

    if (voteError) {
      console.error('[polls/vote] Error recording vote:', voteError);
      // If poll_votes table doesn't exist, just increment the counter
    }

    // Increment vote count on the option
    const { data: option, error: fetchError } = await supabase
      .from('poll_options')
      .select('votes')
      .eq('id', option_id)
      .single();

    if (fetchError) {
      console.error('[polls/vote] Error fetching option:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch option' },
        { status: 500 }
      );
    }

    const { error: updateError } = await supabase
      .from('poll_options')
      .update({ votes: (option.votes || 0) + 1 })
      .eq('id', option_id);

    if (updateError) {
      console.error('[polls/vote] Error updating votes:', updateError);
      return NextResponse.json(
        { error: 'Failed to update vote count' },
        { status: 500 }
      );
    }

    // Get updated poll results
    const { data: pollOptions } = await supabase
      .from('poll_options')
      .select('*')
      .eq('poll_id', pollId)
      .order('order_index', { ascending: true });

    return NextResponse.json({
      success: true,
      voterRole,
      options: pollOptions || [],
    });
  } catch (error: any) {
    console.error('[polls/vote] Exception:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

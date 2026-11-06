import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

async function getAuthUser(req: NextRequest) {
  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

/**
 * GET /api/conversations/[id]
 * Only the two participants (buyer or artist) can read a conversation.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const conversationId = params.id;
    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required.' }, { status: 400 });
    }

    // 1. Fetch conversation
    const { data: conversation, error: convErr } = await supabaseAdmin
      .from('conversations')
      .select(`
        id,
        created_at,
        artwork_id,
        buyer_id,
        artist_id,
        artworks (
          id,
          title,
          price,
          image_url,
          medium,
          sold,
          is_digital
        ),
        buyer:users!conversations_buyer_id_fkey (
          id,
          name,
          email
        ),
        artist:users!conversations_artist_id_fkey (
          id,
          name,
          shop_name,
          email
        )
      `)
      .eq('id', conversationId)
      .single();

    if (convErr || !conversation) {
      return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });
    }

    // 2. Strict participant check (Requirement 2: Only the two participants can read a conversation)
    if (conversation.buyer_id !== user.id && conversation.artist_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to view this conversation.' },
        { status: 403 }
      );
    }

    // 3. Fetch all messages in chronological order
    const { data: messages, error: msgErr } = await supabaseAdmin
      .from('messages')
      .select(`
        id,
        conversation_id,
        sender_id,
        body,
        created_at,
        read_at,
        sender:users (
          id,
          name,
          shop_name
        )
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (msgErr) {
      console.error('Error fetching messages:', msgErr);
    }

    // 4. Mark incoming unread messages as read
    try {
      await supabaseAdmin
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id)
        .is('read_at', null);
    } catch (readErr) {
      console.error('Error marking messages as read:', readErr);
    }

    return NextResponse.json({
      success: true,
      conversation: {
        ...conversation,
        isBuyer: conversation.buyer_id === user.id,
      },
      messages: messages || [],
      currentUserId: user.id,
    });
  } catch (err: any) {
    console.error('GET /api/conversations/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

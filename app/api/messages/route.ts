import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { checkMessageContent } from '@/lib/moderation';
import { sendMessageNotificationEmail } from '@/lib/email';

async function getAuthUser(req: NextRequest) {
  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

/**
 * GET /api/messages
 * Returns all conversations for the authenticated user (as buyer or artist)
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Query conversations where user is buyer or artist
    const { data: conversations, error } = await supabaseAdmin
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
          sold
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
      .or(`buyer_id.eq.${user.id},artist_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      // Return empty list if table not yet created
      return NextResponse.json({ success: true, conversations: [] });
    }

    // Fetch the latest message for each conversation
    const convList = await Promise.all(
      (conversations || []).map(async (conv: any) => {
        const { data: latestMsgs } = await supabaseAdmin
          .from('messages')
          .select('id, body, created_at, sender_id, read_at')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1);

        const latest = latestMsgs?.[0] || null;
        return {
          ...conv,
          latestMessage: latest,
          isBuyer: conv.buyer_id === user.id,
        };
      })
    );

    return NextResponse.json({ success: true, conversations: convList });
  } catch (err: any) {
    console.error('GET /api/messages error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/messages
 * 1. Creates or opens a conversation for an artwork: { artworkId }
 * 2. Sends a message in a conversation: { conversationId, body }
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Please log in to continue.' }, { status: 401 });
    }

    const payload = await req.json().catch(() => ({}));
    const { artworkId, conversationId, body } = payload;

    // -------------------------------------------------------------
    // CASE A: Create or Open a conversation from an artwork
    // -------------------------------------------------------------
    if (artworkId && !body) {
      // Fetch artwork to get artist_id
      const { data: artwork, error: artErr } = await supabaseAdmin
        .from('artworks')
        .select('id, title, artist_id')
        .eq('id', artworkId)
        .single();

      if (artErr || !artwork) {
        return NextResponse.json({ error: 'Artwork not found.' }, { status: 404 });
      }

      if (artwork.artist_id === user.id) {
        return NextResponse.json(
          { error: 'You cannot start a conversation with yourself as the creator.' },
          { status: 400 }
        );
      }

      // Check for existing conversation (Requirement 1: each buyer has one conversation per artwork)
      const { data: existing } = await supabaseAdmin
        .from('conversations')
        .select('id')
        .eq('artwork_id', artworkId)
        .eq('buyer_id', user.id)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ success: true, conversationId: existing.id, existing: true });
      }

      // Insert new conversation
      const { data: created, error: createErr } = await supabaseAdmin
        .from('conversations')
        .insert({
          artwork_id: artworkId,
          buyer_id: user.id,
          artist_id: artwork.artist_id,
        })
        .select('id')
        .single();

      if (createErr) {
        console.error('Error creating conversation:', createErr);
        return NextResponse.json({ error: 'Failed to create conversation.' }, { status: 500 });
      }

      return NextResponse.json({ success: true, conversationId: created.id, existing: false });
    }

    // -------------------------------------------------------------
    // CASE B: Sending a Message
    // -------------------------------------------------------------
    let targetConvId = conversationId;

    // If artworkId was passed along with body, resolve conversationId
    if (!targetConvId && artworkId) {
      const { data: existing } = await supabaseAdmin
        .from('conversations')
        .select('id')
        .eq('artwork_id', artworkId)
        .eq('buyer_id', user.id)
        .maybeSingle();

      if (existing) {
        targetConvId = existing.id;
      } else {
        const { data: artwork } = await supabaseAdmin
          .from('artworks')
          .select('artist_id')
          .eq('id', artworkId)
          .single();

        if (artwork) {
          const { data: newConv } = await supabaseAdmin
            .from('conversations')
            .insert({
              artwork_id: artworkId,
              buyer_id: user.id,
              artist_id: artwork.artist_id,
            })
            .select('id')
            .single();

          if (newConv) targetConvId = newConv.id;
        }
      }
    }

    if (!targetConvId) {
      return NextResponse.json({ error: 'Conversation ID is required.' }, { status: 400 });
    }

    // Fetch conversation details and verify participant
    const { data: conversation, error: convErr } = await supabaseAdmin
      .from('conversations')
      .select(`
        id,
        artwork_id,
        buyer_id,
        artist_id,
        artworks (
          id,
          title
        )
      `)
      .eq('id', targetConvId)
      .single();

    if (convErr || !conversation) {
      return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });
    }

    // Authorization: Only the two participants can send messages in a conversation
    if (conversation.buyer_id !== user.id && conversation.artist_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied: You are not a participant in this conversation.' },
        { status: 403 }
      );
    }

    const trimmedBody = String(body || '').trim();

    // Requirement 3: Limit each message to 1000 characters
    if (!trimmedBody) {
      return NextResponse.json({ error: 'Message cannot be empty.' }, { status: 400 });
    }
    if (trimmedBody.length > 1000) {
      return NextResponse.json(
        { error: `Message exceeds the 1000 character limit (${trimmedBody.length}/1000).` },
        { status: 400 }
      );
    }

    // Requirement 3: Limit each sender to 20 messages per hour, counted from the messages table
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentCount, error: countErr } = await supabaseAdmin
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('sender_id', user.id)
      .gte('created_at', oneHourAgo);

    if (!countErr && typeof recentCount === 'number' && recentCount >= 20) {
      return NextResponse.json(
        { error: 'You have reached the limit of 20 messages per hour. Please wait before sending more messages.' },
        { status: 429 }
      );
    }

    // Requirement 4: Block messages that contain phone numbers or email addresses, and tell the user why
    const moderation = checkMessageContent(trimmedBody);
    if (moderation.blocked) {
      return NextResponse.json(
        {
          error: moderation.reason || 'Contact information is not permitted. Keep all conversations on Artelio.',
          moderationBlocked: true,
        },
        { status: 400 }
      );
    }

    // Insert message into messages table
    const { data: insertedMsg, error: insertErr } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: targetConvId,
        sender_id: user.id,
        body: trimmedBody,
      })
      .select('id, conversation_id, sender_id, body, created_at, read_at')
      .single();

    if (insertErr) {
      console.error('Error inserting message:', insertErr);
      return NextResponse.json({ error: 'Failed to send message.' }, { status: 500 });
    }

    // Requirement 5: Email the other person when a new message arrives, using lib/email.ts if it exists
    const recipientId = conversation.buyer_id === user.id ? conversation.artist_id : conversation.buyer_id;

    try {
      const { data: recipientUser } = await supabaseAdmin
        .from('users')
        .select('email, name, shop_name')
        .eq('id', recipientId)
        .single();

      const { data: senderUser } = await supabaseAdmin
        .from('users')
        .select('name, shop_name')
        .eq('id', user.id)
        .single();

      if (recipientUser?.email) {
        const senderName = senderUser?.shop_name || senderUser?.name || 'Artelio Member';
        const recipientName = recipientUser?.shop_name || recipientUser?.name || 'Collector';
        const artworkTitle = (conversation.artworks as any)?.title || 'Artwork';

        await sendMessageNotificationEmail({
          to: recipientUser.email,
          recipientName,
          senderName,
          artworkTitle,
          messagePreview: trimmedBody.slice(0, 300),
          conversationId: targetConvId,
        });
      }
    } catch (emailErr) {
      console.error('Failed to send message notification email:', emailErr);
      // Non-fatal: email failure does not block message delivery
    }

    return NextResponse.json({
      success: true,
      message: insertedMsg,
    });
  } catch (err: any) {
    console.error('POST /api/messages error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

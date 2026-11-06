'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { checkMessageContent } from '@/lib/moderation';

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
  sender?: {
    id: string;
    name: string | null;
    shop_name: string | null;
  };
};

type ConversationDetail = {
  id: string;
  artwork_id: string;
  buyer_id: string;
  artist_id: string;
  isBuyer: boolean;
  artworks: {
    id: string;
    title: string;
    price: number;
    image_url: string | null;
    medium: string | null;
    sold: boolean;
    is_digital: boolean;
  };
  buyer: {
    id: string;
    name: string | null;
    email: string | null;
  };
  artist: {
    id: string;
    name: string | null;
    shop_name: string | null;
    email: string | null;
  };
};

export default function ConversationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const conversationId = params.id;

  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  // Message composer state
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  async function loadConversation() {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const user = sessionData.session?.user;

      if (!token || !user) {
        router.push('/login');
        return;
      }

      setCurrentUserId(user.id);

      const res = await fetch(`/api/conversations/${conversationId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 403) {
        setForbidden(true);
        setLoading(false);
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to load conversation.');
        setLoading(false);
        return;
      }

      setConversation(data.conversation);
      setMessages(data.messages || []);
      setLoading(false);
      setTimeout(scrollToBottom, 100);
    } catch (err: any) {
      console.error('Error fetching conversation:', err);
      setErrorMessage(err.message || 'Network error.');
      setLoading(false);
    }
  }

  useEffect(() => {
    loadConversation();
  }, [conversationId]);

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    const trimmed = text.trim();
    if (!trimmed) return;

    // Requirement 3: Limit each message to 1000 characters
    if (trimmed.length > 1000) {
      setErrorMessage(`Message is too long (${trimmed.length}/1000 characters). Please shorten it.`);
      return;
    }

    // Requirement 4: Block phone numbers or emails and tell the user why
    const mod = checkMessageContent(trimmed);
    if (mod.blocked) {
      setErrorMessage(mod.reason || 'Direct contact details (phone numbers or emails) are not allowed.');
      return;
    }

    setSending(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setErrorMessage('Session expired. Please log in again.');
        setSending(false);
        return;
      }

      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversationId,
          body: trimmed,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to send message.');
        setSending(false);
        return;
      }

      // Add to messages list
      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
      } else {
        await loadConversation();
      }

      setText('');
      setTimeout(scrollToBottom, 50);
    } catch (err: any) {
      console.error('Failed to send message:', err);
      setErrorMessage('Network error sending message. Please try again.');
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-20 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#F83758] border-t-transparent" />
        <p className="mt-4 text-xs font-bold text-[#626262]">Loading studio conversation…</p>
      </main>
    );
  }

  if (forbidden) {
    return (
      <main className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 shadow-xs">
          <span className="text-3xl">🚫</span>
          <h1 className="mt-3 font-serif text-lg font-bold text-rose-950">Access Restricted</h1>
          <p className="mt-2 text-xs text-rose-800">
            Only the buyer and artist who are participants can view this conversation.
          </p>
          <Link
            href="/messages"
            className="mt-5 inline-block rounded-xl bg-[#F83758] px-5 py-2 text-xs font-bold text-white shadow-stylish-btn"
          >
            Back to Messages
          </Link>
        </div>
      </main>
    );
  }

  if (!conversation) {
    return (
      <main className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-lg font-bold text-[#17223B]">Conversation Not Found</h1>
        <p className="mt-2 text-xs text-[#626262]">{errorMessage || 'This thread may have been removed.'}</p>
        <Link href="/messages" className="mt-4 inline-block text-xs font-bold text-[#F83758] hover:underline">
          &larr; Return to Inbox
        </Link>
      </main>
    );
  }

  const isBuyer = conversation.buyer_id === currentUserId;
  const otherPartyName = isBuyer
    ? conversation.artist?.shop_name || conversation.artist?.name || 'Studio Artist'
    : conversation.buyer?.name || 'Collector';
  const otherPartyRole = isBuyer ? 'Verified Artist' : 'Art Collector';

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 md:px-6 flex flex-col h-[calc(100vh-140px)] min-h-[580px]">
      {/* Top Header & Breadcrumb */}
      <div className="mb-3 flex items-center justify-between border-b border-[#F0F0F0] pb-3">
        <div className="flex items-center gap-3">
          <Link
            href="/messages"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F3F3F3] text-xs font-bold text-[#17223B] hover:bg-gray-200 transition"
            title="Back to inbox"
          >
            &larr;
          </Link>
          <div>
            <h1 className="font-serif text-base md:text-lg font-bold text-[#17223B] flex items-center gap-2">
              <span>{otherPartyName}</span>
              <span className="rounded-full bg-[#F3F3F3] px-2 py-0.5 text-[10px] font-medium text-[#626262]">
                {otherPartyRole}
              </span>
            </h1>
            <p className="text-[11px] text-[#A8A8A9]">Direct Atelier Dialogue</p>
          </div>
        </div>

        <Link
          href={`/artwork/${conversation.artworks?.id}`}
          target="_blank"
          className="rounded-lg border border-[#DEDBDB] bg-white px-3 py-1.5 text-xs font-bold text-[#17223B] hover:border-[#F83758] hover:text-[#F83758] transition shadow-2xs"
        >
          View Artwork Listing ↗
        </Link>
      </div>

      {/* Artwork Context Pill Bar */}
      <div className="mb-3 flex items-center justify-between rounded-xl border border-[#E8E8E8] bg-[#FAFAFA] p-3 text-xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-[#DEDBDB] bg-white">
            {conversation.artworks?.image_url ? (
              <Image
                src={conversation.artworks.image_url}
                alt={conversation.artworks.title || 'Artwork'}
                fill
                className="object-cover"
                sizes="40px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm">🎨</div>
            )}
          </div>
          <div className="min-w-0 truncate">
            <span className="font-bold text-[#17223B] truncate block">
              {conversation.artworks?.title || 'Fine Art Piece'}
            </span>
            <span className="text-[11px] text-[#626262]">
              ₹{conversation.artworks?.price?.toLocaleString('en-IN') || '0'} • {conversation.artworks?.medium || 'Original'}
            </span>
          </div>
        </div>

        {conversation.artworks?.sold ? (
          <span className="rounded-md bg-black/80 px-2 py-0.5 text-[10px] font-bold text-white shrink-0">
            SOLD
          </span>
        ) : (
          <Link
            href={`/checkout/${conversation.artworks?.id}`}
            className="rounded-md bg-[#F83758] px-3 py-1 text-xs font-bold text-white shadow-stylish-btn hover:bg-[#E02244] transition shrink-0"
          >
            Buy Piece
          </Link>
        )}
      </div>

      {/* Requirement 6 Note: Keep all conversations on Artelio */}
      <div className="mb-3 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3.5 py-2 text-[11px] text-amber-900 flex items-center justify-between gap-2">
        <span>
          🛡️ <strong>Keep all conversations on Artelio.</strong> Sharing off-platform phone numbers or emails is blocked to protect your purchases and creator escrow.
        </span>
      </div>

      {/* Message History Scroll Container */}
      <div className="flex-1 overflow-y-auto space-y-3 p-4 rounded-2xl border border-[#E8E8E8] bg-white">
        {messages.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#A8A8A9]">
            <span className="text-2xl block mb-2">👋</span>
            Start the conversation regarding this artwork. Ask about provenance, framing, or delivery.
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.sender_id === currentUserId;

            return (
              <div
                key={m.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                    isMe
                      ? 'bg-[#17223B] text-white rounded-br-xs'
                      : 'bg-[#F3F3F3] text-[#17223B] rounded-bl-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                </div>
                <span className="mt-1 text-[10px] text-[#A8A8A9] px-1">
                  {new Date(m.created_at).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Validation / Moderation Error Banner */}
      {errorMessage && (
        <div className="mt-2 rounded-xl border border-rose-300 bg-rose-50 p-2.5 text-xs text-rose-800 flex items-center justify-between">
          <span>⚠️ {errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-500 hover:text-rose-800 font-bold ml-2 text-sm"
          >
            &times;
          </button>
        </div>
      )}

      {/* Message Composer */}
      <form onSubmit={handleSendMessage} className="mt-3">
        <div className="relative">
          <textarea
            rows={3}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            maxLength={1000}
            placeholder="Write your message to the artist (max 1000 characters). Keep all conversations on Artelio..."
            className="w-full rounded-2xl border border-[#DEDBDB] bg-[#FAFAFA] p-3.5 pr-24 text-xs sm:text-sm text-[#17223B] placeholder-[#A8A8A9] focus:bg-white focus:border-[#F83758] focus:outline-none transition resize-none shadow-xs"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
          />

          <div className="absolute right-3 bottom-3 flex items-center gap-2">
            <span className={`text-[10px] font-mono ${text.length > 900 ? 'text-[#F83758] font-bold' : 'text-[#A8A8A9]'}`}>
              {text.length}/1000
            </span>

            <button
              type="submit"
              disabled={sending || !text.trim()}
              className="rounded-xl bg-[#F83758] hover:bg-[#E02244] px-4 py-2 text-xs font-bold text-white shadow-stylish-btn transition active:scale-95 disabled:opacity-50"
            >
              {sending ? 'Sending…' : 'Send'}
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}

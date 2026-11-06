'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

type Conversation = {
  id: string;
  created_at: string;
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
  latestMessage: {
    id: string;
    body: string;
    created_at: string;
    sender_id: string;
    read_at: string | null;
  } | null;
};

export default function MessagesInboxPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadInbox() {
      setLoading(true);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        const user = sessionData.session?.user;

        if (!token || !user) {
          router.push('/login');
          return;
        }

        setCurrentUserId(user.id);

        const res = await fetch('/api/messages', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (active && res.ok && Array.isArray(data.conversations)) {
          setConversations(data.conversations);
        }
      } catch (err) {
        console.error('Failed to load inbox:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadInbox();

    return () => {
      active = false;
    };
  }, [router]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#F0F0F0] pb-5">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-black text-[#17223B]">
            Studio Messages
          </h1>
          <p className="mt-1 text-xs text-[#626262]">
            Direct inquiries and studio dialogue regarding original fine art.
          </p>
        </div>

        <Link
          href="/browse"
          className="self-start sm:self-auto rounded-xl border border-[#DEDBDB] bg-white px-4 py-2 text-xs font-bold text-[#17223B] hover:border-[#F83758] hover:text-[#F83758] transition shadow-xs"
        >
          Explore Catalog &rarr;
        </Link>
      </div>

      {/* Requirement 6 Note: Keep all conversations on Artelio */}
      <div className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs text-amber-900 flex items-start gap-3">
        <span className="text-base leading-none">🛡️</span>
        <div>
          <strong className="font-bold text-amber-950">Keep all conversations on Artelio.</strong>
          <p className="mt-0.5 text-amber-900/90 leading-relaxed">
            Direct off-platform payment or contact exchanges void Artelio Escrow, authentication certificates, and delivery insurance guarantees.
          </p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#F83758] border-t-transparent" />
          <p className="mt-4 text-xs font-bold text-[#626262]">Loading conversations…</p>
        </div>
      ) : conversations.length === 0 ? (
        <div className="mx-auto max-w-md rounded-2xl border border-[#DEDBDB] bg-white p-10 text-center shadow-xs">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FDF0F3] text-3xl">
            💬
          </div>
          <h2 className="mt-4 font-serif text-lg font-bold text-[#17223B]">No Messages Yet</h2>
          <p className="mt-2 text-xs leading-relaxed text-[#626262]">
            Connect directly with verified creators. Click &ldquo;Message the artist&rdquo; on any artwork listing to inquire about technique, custom framing, or delivery.
          </p>
          <Link
            href="/browse"
            className="mt-6 inline-block rounded-xl bg-[#F83758] px-6 py-2.5 text-xs font-bold text-white shadow-stylish-btn hover:bg-[#E02244] transition"
          >
            Browse Artworks
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map((conv) => {
            const isBuyer = conv.buyer_id === currentUserId;
            const otherPartyName = isBuyer
              ? conv.artist?.shop_name || conv.artist?.name || 'Studio Artist'
              : conv.buyer?.name || 'Collector';
            const roleBadge = isBuyer ? 'Creator Studio' : 'Collector';
            const hasUnread =
              conv.latestMessage &&
              conv.latestMessage.sender_id !== currentUserId &&
              !conv.latestMessage.read_at;

            return (
              <Link
                key={conv.id}
                href={`/messages/${conv.id}`}
                className={`group flex items-center justify-between gap-4 rounded-2xl border p-4 sm:p-5 transition shadow-xs hover:shadow-stylish-card ${
                  hasUnread
                    ? 'border-[#F83758]/40 bg-[#FDF0F3]/30'
                    : 'border-[#E8E8E8] bg-white hover:border-[#DEDBDB]'
                }`}
              >
                {/* Artwork Thumbnail + Other Party + Message snippet */}
                <div className="flex items-center gap-4 min-w-0">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-[#DEDBDB] bg-[#F9F9F9]">
                    {conv.artworks?.image_url ? (
                      <Image
                        src={conv.artworks.image_url}
                        alt={conv.artworks.title || 'Artwork'}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xl bg-[#FDF0F3]">
                        🎨
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-serif text-sm font-bold text-[#17223B] truncate group-hover:text-[#F83758] transition">
                        {otherPartyName}
                      </span>
                      <span className="rounded-full bg-[#F3F3F3] px-2 py-0.5 text-[10px] font-semibold text-[#626262]">
                        {roleBadge}
                      </span>
                      {hasUnread && (
                        <span className="h-2 w-2 rounded-full bg-[#F83758]" title="Unread message" />
                      )}
                    </div>

                    <p className="mt-0.5 text-xs text-[#A8A8A9] truncate">
                      Re: <strong className="text-[#17223B] font-medium">{conv.artworks?.title || 'Artwork Piece'}</strong>
                      {conv.artworks?.price ? ` • ₹${conv.artworks.price.toLocaleString('en-IN')}` : ''}
                    </p>

                    <p className={`mt-1 text-xs truncate max-w-md ${hasUnread ? 'font-bold text-[#17223B]' : 'text-[#626262]'}`}>
                      {conv.latestMessage
                        ? conv.latestMessage.body
                        : 'No messages exchanged yet. Click to start conversation.'}
                    </p>
                  </div>
                </div>

                {/* Date & Arrow */}
                <div className="flex items-center gap-3 shrink-0">
                  {conv.latestMessage && (
                    <span className="text-[11px] text-[#A8A8A9] hidden sm:inline">
                      {new Date(conv.latestMessage.created_at).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  )}
                  <span className="text-[#A8A8A9] group-hover:text-[#F83758] group-hover:translate-x-0.5 transition-all">
                    &rarr;
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}

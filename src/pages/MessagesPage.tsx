import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Send, Loader2, ArrowLeft, Search, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Conversation, Message, Profile, ProviderProfile } from '@/types';
import { formatRelativeTime } from '@/lib/utils';

export default function MessagesPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickReplies = [
    'Bonjour, merci pour votre message. Je vous réponds rapidement.',
    'Bonjour ! Je suis disponible pour en discuter. Pouvez-vous me donner plus de détails ?',
    'Merci pour votre intérêt. Je peux vous proposer un devis, pourriez-vous me préciser vos besoins ?',
    'Bonjour, je suis actuellement sur mission mais je vous réponds dès que possible.',
  ];

  const [showQuickReplies, setShowQuickReplies] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    loadConversations();
  }, [user]);

  async function loadConversations() {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    const convs = data as Conversation[] ?? [];

    // Load other participant profiles
    const enriched = await Promise.all(
      convs.map(async (conv) => {
        const otherId = conv.participant_a === user.id ? conv.participant_b : conv.participant_a;
        const { data: otherUser } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', otherId)
          .maybeSingle();

        const { data: otherProvider } = await supabase
          .from('provider_profiles')
          .select('*')
          .eq('user_id', otherId)
          .maybeSingle();

        return {
          ...conv,
          other_user: otherUser as Profile | null,
          other_provider: otherProvider as ProviderProfile | null,
        };
      })
    );

    setConversations(enriched);
    setLoading(false);
  }

  async function loadMessages(conv: Conversation) {
    setSelectedConv(conv);
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: true });

    setMessages(data as Message[] ?? []);

    // Mark unread messages as read
    if (user) {
      const unread = (data as Message[] ?? []).filter(
        (m) => m.sender_id !== user.id && !m.read_at
      );
      for (const m of unread) {
        await supabase.from('messages').update({ read_at: new Date().toISOString() }).eq('id', m.id);
      }
    }

    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  async function sendMessage() {
    if (!user || !selectedConv || !newMessage.trim()) return;
    setSending(true);

    const { data: msg } = await supabase
      .from('messages')
      .insert({
        conversation_id: selectedConv.id,
        sender_id: user.id,
        content: newMessage.trim(),
      })
      .select('*')
      .single();

    if (msg) {
      setMessages([...messages, msg as Message]);
      setNewMessage('');
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
      loadConversations();
    }
    setSending(false);
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="mb-4 text-2xl font-bold text-neutral-900">Messagerie</h1>

      <div className="card flex h-[calc(100vh-200px)] overflow-hidden">
        {/* Conversations list */}
        <div className={`w-full border-r border-neutral-200 md:w-80 ${selectedConv ? 'hidden md:block' : ''}`}>
          <div className="border-b border-neutral-200 p-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                className="input-field pl-9 py-2"
              />
            </div>
          </div>

          <div className="overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <MessageSquare size={40} className="text-neutral-300" />
                <p className="mt-3 text-sm text-neutral-500">Aucune conversation</p>
                <p className="text-xs text-neutral-400">Contactez un prestataire pour commencer</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => loadMessages(conv)}
                  className={`flex w-full items-center gap-3 border-b border-neutral-100 p-3 text-left transition-colors hover:bg-neutral-50 ${
                    selectedConv?.id === conv.id ? 'bg-primary-50' : ''
                  }`}
                >
                  {conv.other_user?.avatar_url ? (
                    <img src={conv.other_user.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                      {conv.other_user?.full_name?.[0]?.toUpperCase() ?? conv.other_provider?.business_name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-neutral-900">
                      {conv.other_provider?.business_name ?? conv.other_user?.full_name ?? 'Utilisateur'}
                    </p>
                    <p className="truncate text-xs text-neutral-500">
                      {conv.last_message_preview ?? 'Nouvelle conversation'}
                    </p>
                  </div>
                  {conv.last_message_at && (
                    <span className="text-xs text-neutral-400">{formatRelativeTime(conv.last_message_at)}</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat area */}
        {selectedConv ? (
          <div className="flex flex-1 flex-col">
            <div className="flex items-center gap-3 border-b border-neutral-200 p-4">
              <button
                onClick={() => setSelectedConv(null)}
                className="text-neutral-400 hover:text-neutral-600 md:hidden"
              >
                <ArrowLeft size={20} />
              </button>
              {selectedConv.other_user?.avatar_url ? (
                <img src={selectedConv.other_user.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                  {selectedConv.other_user?.full_name?.[0]?.toUpperCase() ?? '?'}
                </div>
              )}
              <div>
                <p className="font-semibold text-neutral-900">
                  {selectedConv.other_provider?.business_name ?? selectedConv.other_user?.full_name}
                </p>
                {selectedConv.other_provider?.headline && (
                  <p className="text-xs text-neutral-500">{selectedConv.other_provider.headline}</p>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-neutral-50 p-4">
              <div className="mx-auto max-w-2xl space-y-3">
                {messages.map((msg) => {
                  const isOwn = msg.sender_id === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                          isOwn
                            ? 'bg-primary-600 text-white'
                            : 'bg-white text-neutral-900 shadow-sm'
                        }`}
                      >
                        <p>{msg.content}</p>
                        <p className={`mt-1 text-xs ${isOwn ? 'text-primary-200' : 'text-neutral-400'}`}>
                          {formatRelativeTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="border-t border-neutral-200 p-4">
              <div className="mb-2 flex flex-wrap gap-2">
                <button
                  onClick={() => setShowQuickReplies(!showQuickReplies)}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-primary-600 transition-colors hover:bg-primary-50"
                >
                  <Zap size={12} />
                  Réponses rapides
                </button>
                {showQuickReplies && quickReplies.map((qr, i) => (
                  <button
                    key={i}
                    onClick={() => { setNewMessage(qr); setShowQuickReplies(false); }}
                    className="rounded-lg bg-neutral-100 px-2.5 py-1 text-xs text-neutral-600 transition-colors hover:bg-neutral-200"
                  >
                    {qr.length > 40 ? qr.slice(0, 40) + '...' : qr}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  className="input-field flex-1"
                  placeholder="Écrivez votre message..."
                />
                <button
                  onClick={sendMessage}
                  disabled={sending || !newMessage.trim()}
                  className="btn-primary px-3 py-2.5"
                >
                  {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden flex-1 items-center justify-center md:flex">
            <div className="text-center">
              <MessageSquare size={48} className="mx-auto text-neutral-300" />
              <p className="mt-4 text-sm text-neutral-500">Sélectionnez une conversation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

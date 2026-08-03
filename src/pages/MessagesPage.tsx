import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Loader2, ArrowLeft, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getConversations, type Conversation } from '@/services/messageService';
import { formatRelativeTime } from '@/lib/utils';
import MessageThread from '@/components/MessageThread';

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);

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
    const data = await getConversations(user.id);
    setConversations(data);
    setLoading(false);
  }

  function selectConversation(conv: Conversation) {
    setSelectedConv(conv);
  }

  function goBack() {
    setSelectedConv(null);
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
                  onClick={() => selectConversation(conv)}
                  className={`flex w-full items-center gap-3 border-b border-neutral-100 p-3 text-left transition-colors hover:bg-neutral-50 ${
                    selectedConv?.id === conv.id ? 'bg-primary-50' : ''
                  }`}
                >
                  {conv.other_user?.avatar_url ? (
                    <img src={conv.other_user.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                      {conv.other_user?.full_name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-neutral-900">
                      {conv.other_user?.full_name ?? 'Utilisateur'}
                    </p>
                    <p className="truncate text-xs text-neutral-500">
                      {conv.last_message?.content ?? 'Nouvelle conversation'}
                    </p>
                  </div>
                  {conv.unread_count && conv.unread_count > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-xs text-white">
                      {conv.unread_count}
                    </span>
                  )}
                  {conv.updated_at && (
                    <span className="text-xs text-neutral-400">{formatRelativeTime(conv.updated_at)}</span>
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
                onClick={goBack}
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
                  {selectedConv.other_user?.full_name}
                </p>
              </div>
            </div>

            <MessageThread
              conversationId={selectedConv.id}
              otherUserId={selectedConv.other_user?.id || ''}
              otherUserName={selectedConv.other_user?.full_name || 'Utilisateur'}
            />
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


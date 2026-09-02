import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MessageSquare, Send, Loader2, ArrowLeft, Search, Zap, Paperclip, X, Image, File } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import type { Conversation, Message, Profile, ProviderProfile, MessageAttachment } from '@/types';
import { formatRelativeTime } from '@/lib/utils';

export default function MessagesPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const quickReplies = [
    t.provider.message.quickReplies.reply1,
    t.provider.message.quickReplies.reply2,
    t.provider.message.quickReplies.reply3,
    t.provider.message.quickReplies.reply4,
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

  useEffect(() => {
    const conversationId = searchParams.get('conversationId');
    if (!conversationId || !conversations.length || selectedConv) return;

    const conversation = conversations.find((conv) => conv.id === conversationId);
    if (conversation) {
      loadMessages(conversation);
    }
  }, [searchParams, conversations, selectedConv]);

  // Real-time subscription for new messages
  useEffect(() => {
    if (!user || !selectedConv) return;

    const channel = supabase
      .channel(`messages:${selectedConv.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConv.id}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => [...prev, newMsg]);
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 50);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConv.id}`,
        },
        (payload) => {
          const updatedMsg = payload.new as Message;
          setMessages((prev) =>
            prev.map((msg) => (msg.id === updatedMsg.id ? updatedMsg : msg))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedConv]);

  // Real-time subscription for conversations
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  async function loadConversations() {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('conversations')
      .select('id, participant_a, participant_b, last_message_preview, last_message_at, created_at')
      .or(
        `participant_a.eq.${user.id},participant_b.eq.${user.id}`
      )
      .order('last_message_at', { ascending: false });

    const convs = data as Conversation[] ?? [];

    // Load other participant profiles
    const enriched = await Promise.all(
      convs.map(async (conv) => {
        const otherId = conv.participant_a === user.id ? conv.participant_b : conv.participant_a;
        const { data: otherUser } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .eq('id', otherId)
          .maybeSingle();

        const { data: otherProvider } = await supabase
          .from('provider_profiles')
          .select('id, business_name, headline, avatar_url')
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
      .select('id, conversation_id, sender_id, content, created_at, read_at, attachments:message_attachments(id, file_name, file_url, file_type, file_size, created_at)')
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

  async function uploadFile(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `message-attachments/${user?.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('attachments')
      .getPublicUrl(filePath);

    return publicUrl;
  }

  async function sendMessage() {
    if (!user || !selectedConv || (!newMessage.trim() && attachments.length === 0)) return;
    setSending(true);
    setUploading(true);

    try {
      const attachmentData: MessageAttachment[] = [];

      // Upload files
      for (const file of attachments) {
        const fileUrl = await uploadFile(file);
        const { data: attachment } = await supabase
          .from('message_attachments')
          .insert({
            file_name: file.name,
            file_url: fileUrl,
            file_type: file.type,
            file_size: file.size,
          })
          .select('*')
          .single();
        
        if (attachment) {
          attachmentData.push(attachment as MessageAttachment);
        }
      }

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
        // Link attachments to message
        for (const attachment of attachmentData) {
          await supabase
            .from('message_attachments')
            .update({ message_id: msg.id })
            .eq('id', attachment.id);
        }

        const messageWithAttachments = {
          ...msg,
          attachments: attachmentData,
        } as Message;

        setMessages([...messages, messageWithAttachments]);
        setNewMessage('');
        setAttachments([]);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 50);
        loadConversations();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
      setUploading(false);
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        alert('File size exceeds 10MB limit');
        return false;
      }
      return true;
    });
    setAttachments([...attachments, ...validFiles]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return Image;
    return File;
  };

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const name = conv.other_provider?.business_name ?? conv.other_user?.full_name ?? '';
    const preview = conv.last_message_preview ?? '';
    return name.toLowerCase().includes(query) || preview.toLowerCase().includes(query);
  });

  const handleTyping = (value: string) => {
    setNewMessage(value);
    // Could emit typing indicator here
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
      <h1 className="mb-4 text-2xl font-bold text-neutral-900">{t.messages.title}</h1>

      <div className="card flex h-[calc(100vh-180px)] min-h-[500px] overflow-hidden flex-col md:flex-row">
        {/* Conversations list */}
        <div className={`w-full border-b border-neutral-200 md:border-b-0 md:border-r md:w-80 ${selectedConv ? 'hidden md:flex' : 'flex'} flex-col`}>
          <div className="border-b border-neutral-200 p-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.common.search}
                className="input-field pl-9 py-2"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <MessageSquare size={40} className="text-neutral-300" />
                <p className="mt-3 text-sm text-neutral-500">
                  {searchQuery ? t.search.noResults : t.messages.noConversations}
                </p>
                <p className="text-xs text-neutral-400 mt-1">
                  {searchQuery ? t.messages.tryDifferentSearch : t.messages.contactProviderToStart}
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                if (!user) return null;
                const otherId = conv.participant_a === user.id ? conv.participant_b : conv.participant_a;
                const isOnline = onlineUsers.has(otherId);
                return (
                  <button
                    key={conv.id}
                    onClick={() => loadMessages(conv)}
                    className={`flex w-full items-center gap-3 border-b border-neutral-100 p-3 text-left transition-colors hover:bg-neutral-50 ${
                      selectedConv?.id === conv.id ? 'bg-primary-50' : ''
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      {conv.other_user?.avatar_url ? (
                        <img src={conv.other_user.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                          {conv.other_user?.full_name?.[0]?.toUpperCase() ?? conv.other_provider?.business_name?.[0]?.toUpperCase() ?? '?'}
                        </div>
                      )}
                      {isOnline && (
                        <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-success-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="truncate text-sm font-semibold text-neutral-900">
                          {conv.other_provider?.business_name ?? conv.other_user?.full_name ?? t.messages.user}
                        </p>
                        {conv.last_message_at && (
                          <span className="text-xs text-neutral-400 flex-shrink-0 ml-2">{formatRelativeTime(conv.last_message_at, locale)}</span>
                        )}
                      </div>
                      <p className="truncate text-xs text-neutral-500">
                        {conv.last_message_preview ?? t.provider.message.newConversation}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat area */}
        {selectedConv ? (
          <div className="flex flex-1 flex-col min-w-0">
            <div className="flex items-center gap-3 border-b border-neutral-200 p-4 flex-shrink-0">
              <button
                onClick={() => setSelectedConv(null)}
                className="text-neutral-400 hover:text-neutral-600 md:hidden flex-shrink-0"
              >
                <ArrowLeft size={20} />
              </button>
              {selectedConv.other_user?.avatar_url ? (
                <img src={selectedConv.other_user.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700 flex-shrink-0">
                  {selectedConv.other_user?.full_name?.[0]?.toUpperCase() ?? '?'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-neutral-900 truncate">
                  {selectedConv.other_provider?.business_name ?? selectedConv.other_user?.full_name}
                </p>
                {selectedConv.other_provider?.headline && (
                  <p className="text-xs text-neutral-500 truncate">{selectedConv.other_provider.headline}</p>
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
                        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                          isOwn
                            ? 'bg-primary-600 text-white'
                            : 'bg-white text-neutral-900 shadow-sm'
                        }`}
                      >
                        {msg.content && (
                          <p className="break-words">{msg.content}</p>
                        )}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {msg.attachments.map((attachment) => {
                              const FileIcon = getFileIcon(attachment.file_type);
                              return (
                                <div key={attachment.id} className="flex items-center gap-2">
                                  {attachment.file_type.startsWith('image/') ? (
                                    <img
                                      src={attachment.file_url}
                                      alt={attachment.file_name}
                                      className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90"
                                      onClick={() => window.open(attachment.file_url, '_blank')}
                                    />
                                  ) : (
                                    <a
                                      href={attachment.file_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 bg-neutral-100/20 rounded-lg px-3 py-2 hover:bg-neutral-100/30 transition-colors"
                                    >
                                      <FileIcon size={16} />
                                      <span className="truncate">{attachment.file_name}</span>
                                    </a>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                        <p className={`mt-1 text-xs ${isOwn ? 'text-primary-200' : 'text-neutral-400'}`}>
                          {formatRelativeTime(msg.created_at, locale)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="border-t border-neutral-200 p-4 flex-shrink-0">
              {/* Attachments preview */}
              {attachments.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 bg-neutral-100 rounded-lg px-3 py-2">
                      <Paperclip size={14} className="text-neutral-500" />
                      <span className="text-sm text-neutral-700 truncate max-w-[150px]">{file.name}</span>
                      <button
                        onClick={() => removeAttachment(index)}
                        className="text-neutral-400 hover:text-error-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mb-2 flex flex-wrap gap-2">
                <button
                  onClick={() => setShowQuickReplies(!showQuickReplies)}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-primary-600 transition-colors hover:bg-primary-50"
                >
                  <Zap size={12} />
                  {t.messages.quickReplies}
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-100"
                >
                  <Paperclip size={12} />
                  {t.messages.attachFile}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                />
                {showQuickReplies && (
                  <div className="flex flex-wrap gap-2 w-full">
                    {quickReplies.map((qr, i) => (
                      <button
                        key={i}
                        onClick={() => { setNewMessage(qr); setShowQuickReplies(false); }}
                        className="rounded-lg bg-neutral-100 px-2.5 py-1 text-xs text-neutral-600 transition-colors hover:bg-neutral-200"
                      >
                        {qr.length > 40 ? qr.slice(0, 40) + '...' : qr}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => handleTyping(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  className="input-field flex-1"
                  placeholder={t.provider.message.writeMessage}
                />
                <button
                  onClick={sendMessage}
                  disabled={sending || uploading || (!newMessage.trim() && attachments.length === 0)}
                  className="btn-primary px-3 py-2.5 flex-shrink-0"
                >
                  {sending || uploading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </div>
              {isTyping && (
                <div className="flex items-center gap-1 text-xs text-neutral-500 mt-2">
                  <div className="flex gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="h-1.5 w-1.5 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="h-1.5 w-1.5 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span>{t.messages.typing}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center">
            <div className="text-center px-4">
              <MessageSquare size={48} className="mx-auto text-neutral-300" />
              <p className="mt-4 text-sm text-neutral-500">{t.messages.selectConversation}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

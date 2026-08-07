import { useEffect, useState, useRef } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getMessages, sendMessage, markMessagesAsRead, subscribeToMessages, type Message } from '@/services/messageService';

interface MessageThreadProps {
  conversationId: string;
  otherUserId: string;
  otherUserName: string;
}

export default function MessageThread({ conversationId, otherUserId, otherUserName }: MessageThreadProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();

    // Subscribe to new messages
    const unsubscribe = subscribeToMessages(conversationId, (newMsg) => {
      setMessages(prev => [...prev, newMsg]);
      scrollToBottom();
      
      // Mark as read if message is from other user
      if (newMsg.sender_id !== user?.id) {
        markMessagesAsRead(conversationId, user!.id);
      }
    });

    return () => unsubscribe();
  }, [conversationId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function loadMessages() {
    setLoading(true);
    const data = await getMessages(conversationId);
    setMessages(data);
    
    // Mark all messages as read
    if (user) {
      await markMessagesAsRead(conversationId, user.id);
    }
    
    setLoading(false);
    scrollToBottom();
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !user || sending) return;

    setSending(true);
    const message = await sendMessage(conversationId, user.id, newMessage.trim());
    
    if (message) {
      setMessages(prev => [...prev, message]);
      setNewMessage('');
      scrollToBottom();
    }
    
    setSending(false);
  }

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={24} className="animate-spin text-primary-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-neutral-500">Commencez la conversation avec {otherUserName}</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.sender_id === user?.id;
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                    isOwn
                      ? 'bg-primary-600 text-white'
                      : 'bg-neutral-100 text-neutral-900'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p
                    className={`mt-1 text-xs ${
                      isOwn ? 'text-primary-200' : 'text-neutral-400'
                    }`}
                  >
                    {new Date(message.created_at).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="border-t border-neutral-200 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Écrivez votre message..."
            className="input-field flex-1"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="btn-primary px-4"
          >
            {sending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

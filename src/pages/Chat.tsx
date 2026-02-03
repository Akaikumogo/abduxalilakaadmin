import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { chatApi, type Conversation, type ChatMessage } from '@/services/api';
import { PageLoading, Skeleton } from '@/components/ui/Loading';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

// Format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Hozir';
  if (diffMins < 60) return `${diffMins} daqiqa oldin`;
  if (diffHours < 24) return `${diffHours} soat oldin`;
  if (diffDays < 7) return `${diffDays} kun oldin`;
  
  return date.toLocaleDateString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// Format message time
function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('uz-UZ', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Format message date for grouping
function formatMessageDate(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Bugun';
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Kecha';
  }
  
  return date.toLocaleDateString('uz-UZ', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

// Conversation list item
const ConversationItem = memo(function ConversationItem({
  conversation,
  isActive,
  onClick,
}: {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={onClick}
      className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
        isActive ? 'bg-primary-50 border-l-4 border-l-primary-500' : 'hover:bg-gray-50'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-medium shrink-0">
          {conversation.odId.charAt(0).toUpperCase()}
        </div>
        
        <div className="flex-1 min-w-0">
          {/* User ID and time */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-medium text-dark-800 truncate text-sm">
              {conversation.odId.length > 20 
                ? conversation.odId.slice(0, 8) + '...' + conversation.odId.slice(-8)
                : conversation.odId
              }
            </span>
            <span className="text-xs text-dark-400 shrink-0">
              {formatRelativeTime(conversation.lastMessageTime)}
            </span>
          </div>
          
          {/* Last message */}
          <div className="flex items-center gap-2">
            <p className="text-sm text-dark-500 truncate flex-1">
              {conversation.lastMessageIsUser ? '' : '✓ '}
              {conversation.lastMessage}
            </p>
            
            {/* Unread badge */}
            {conversation.unreadCount > 0 && (
              <span className="bg-accent-500 text-white text-xs font-medium px-2 py-0.5 rounded-full shrink-0">
                {conversation.unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

// Chat message bubble
const MessageBubble = memo(function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.isUser;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex ${isUser ? 'justify-start' : 'justify-end'} mb-3`}
    >
      <div
        className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
          isUser
            ? 'bg-gray-100 text-dark-800 rounded-bl-md'
            : 'bg-primary-500 text-white rounded-br-md'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
        <div className={`flex items-center justify-end gap-1 mt-1 ${isUser ? 'text-dark-400' : 'text-primary-100'}`}>
          <span className="text-xs">{formatMessageTime(message.createdAt)}</span>
          {!isUser && (
            <span className="text-xs">
              {message.isRead ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
});

// Empty state
function EmptyConversations() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-dark-800 mb-2">Hozircha chatlar yo'q</h3>
      <p className="text-dark-500 text-sm">Mijozlar xabar yuborganda shu yerda ko'rinadi</p>
    </div>
  );
}

// No chat selected state
function NoChatSelected() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gray-50">
      <div className="w-24 h-24 rounded-full bg-white shadow-soft flex items-center justify-center mb-4">
        <svg className="w-12 h-12 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
        </svg>
      </div>
      <h3 className="text-xl font-medium text-dark-800 mb-2">Chat tanlang</h3>
      <p className="text-dark-500">Chap tomondan chatni tanlang</p>
    </div>
  );
}

export function Chat() {
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Fetch conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ['chat-conversations'],
    queryFn: chatApi.getConversations,
    refetchInterval: 5000, // Poll every 5 seconds
  });

  // Fetch chat history
  const { data: chatHistory, isLoading: historyLoading, refetch: refetchHistory } = useQuery({
    queryKey: ['chat-history', selectedUserId],
    queryFn: () => selectedUserId ? chatApi.getChatHistory(selectedUserId) : null,
    enabled: !!selectedUserId,
    refetchInterval: 3000, // Poll every 3 seconds when chat is open
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: ({ odId, message }: { odId: string; message: string }) =>
      chatApi.sendReply(odId, message),
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['chat-history'] });
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
    },
    onError: () => {
      toast.error('Xabar yuborishda xatolik');
    },
  });

  // Delete conversation mutation
  const deleteConversationMutation = useMutation({
    mutationFn: (odId: string) => chatApi.deleteConversation(odId),
    onSuccess: () => {
      toast.success('Chat o\'chirildi');
      setSelectedUserId(null);
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
    },
    onError: () => {
      toast.error('O\'chirishda xatolik');
    },
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory?.messages]);

  // Focus input when chat selected
  useEffect(() => {
    if (selectedUserId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [selectedUserId]);

  // Handle send message
  const handleSendMessage = useCallback(() => {
    if (!selectedUserId || !newMessage.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate({ odId: selectedUserId, message: newMessage.trim() });
  }, [selectedUserId, newMessage, sendMessageMutation]);

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Filter conversations by search
  const filteredConversations = conversations.filter(conv =>
    conv.odId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group messages by date
  const groupedMessages = chatHistory?.messages.reduce((groups, message) => {
    const date = formatMessageDate(message.createdAt);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, ChatMessage[]>) || {};

  // Calculate total unread
  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  if (conversationsLoading) {
    return <PageLoading />;
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Chatlar</h1>
          <p className="text-dark-500 mt-1">
            {conversations.length} ta suhbat {totalUnread > 0 && `• ${totalUnread} ta yangi xabar`}
          </p>
        </div>
      </div>

      {/* Chat container */}
      <div className="flex-1 flex bg-white rounded-2xl shadow-soft overflow-hidden">
        {/* Conversations sidebar */}
        <div className="w-80 border-r border-gray-200 flex flex-col">
          {/* Search */}
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <input
                type="text"
                placeholder="Qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Conversations list */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <EmptyConversations />
            ) : (
              <AnimatePresence>
                {filteredConversations.map((conv) => (
                  <ConversationItem
                    key={conv.odId}
                    conversation={conv}
                    isActive={conv.odId === selectedUserId}
                    onClick={() => setSelectedUserId(conv.odId)}
                  />
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          {selectedUserId ? (
            <>
              {/* Chat header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-medium">
                    {selectedUserId.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-medium text-dark-800">
                      {selectedUserId.length > 30 
                        ? selectedUserId.slice(0, 12) + '...' + selectedUserId.slice(-12)
                        : selectedUserId
                      }
                    </h3>
                    <p className="text-xs text-dark-400">
                      {chatHistory?.total || 0} ta xabar
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => setDeleteDialogOpen(true)}
                  className="p-2 text-dark-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Chatni o'chirish"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                {historyLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                        <Skeleton className={`h-16 ${i % 2 === 0 ? 'w-48' : 'w-64'} rounded-2xl`} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <AnimatePresence>
                    {Object.entries(groupedMessages).map(([date, messages]) => (
                      <div key={date}>
                        {/* Date separator */}
                        <div className="flex items-center justify-center my-4">
                          <span className="px-3 py-1 bg-white text-dark-400 text-xs rounded-full shadow-sm">
                            {date}
                          </span>
                        </div>
                        
                        {/* Messages */}
                        {messages.map((message) => (
                          <MessageBubble key={message.id} message={message} />
                        ))}
                      </div>
                    ))}
                  </AnimatePresence>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-gray-100 bg-white">
                <div className="flex items-end gap-3">
                  <textarea
                    ref={inputRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Xabar yozing..."
                    rows={1}
                    className="flex-1 px-4 py-3 bg-gray-50 border-0 rounded-xl text-sm resize-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
                    style={{ maxHeight: '120px' }}
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendMessageMutation.isPending}
                    className="p-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {sendMessageMutation.isPending ? (
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                  </motion.button>
                </div>
              </div>
            </>
          ) : (
            <NoChatSelected />
          )}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={() => {
          if (selectedUserId) {
            deleteConversationMutation.mutate(selectedUserId);
          }
          setDeleteDialogOpen(false);
        }}
        title="Chatni o'chirish"
        message="Bu chat va barcha xabarlar o'chiriladi. Davom etasizmi?"
        confirmText="O'chirish"
        variant="danger"
      />
    </div>
  );
}

export default Chat;

import React, { useState, useEffect, useRef } from 'react';

interface Chat {
  id: string;
  studentId: string;
  studentName: string;
  lastMessage: string;
  lastMessageBy: string;
  unreadAdmin: number;
  unreadStudent: number;
  updatedAt: string;
  createdAt: string;
}

interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderType: 'student' | 'admin';
  message: string;
  createdAt: string;
}

interface Props {
  showToast: (m: string, type?: 'success' | 'error') => void;
}

const ChatSupport: React.FC<Props> = ({ showToast }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<any>(null);

  useEffect(() => {
    fetchChats();
    const chatPoll = setInterval(fetchChats, 5000);
    return () => {
      clearInterval(chatPoll);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id);
      markRead(selectedChat.id);
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => {
        fetchMessages(selectedChat.id);
      }, 3000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [selectedChat?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchChats = async () => {
    try {
      const res = await fetch('/api/chats');
      const data = await res.json();
      setChats(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (chatId: string) => {
    try {
      const res = await fetch(`/api/chats/${chatId}/messages`);
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const markRead = async (chatId: string) => {
    try {
      await fetch(`/api/chats/${chatId}/read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ readerType: 'admin' })
      });
      setChats(prev => prev.map(c => c.id === chatId ? { ...c, unreadAdmin: 0 } : c));
    } catch (e) {}
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/chats/${selectedChat.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: 'admin',
          senderName: 'Admin',
          senderType: 'admin',
          message: newMessage.trim()
        })
      });
      if (res.ok) {
        setNewMessage('');
        await fetchMessages(selectedChat.id);
        fetchChats();
      }
    } catch (error) {
      showToast('Failed to send message', 'error');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const formatMsgTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const totalUnread = chats.reduce((sum, c) => sum + (c.unreadAdmin || 0), 0);

  const filteredChats = chats.filter(c =>
    c.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 h-[calc(100vh-180px)] min-h-[500px] flex animate-fade-in overflow-hidden">
      <div className="w-96 border-r border-gray-100 flex flex-col bg-gray-50/30">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h4 className="text-sm font-black text-navy uppercase tracking-widest">Chats</h4>
              {totalUnread > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full">{totalUnread}</span>
              )}
            </div>
            <span className="text-[10px] text-gray-400 font-bold">{chats.length} conversations</span>
          </div>
          <div className="relative">
            <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search students..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-navy/10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy"></div>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="text-center py-16 px-6">
              <span className="material-icons-outlined text-5xl text-gray-200">forum</span>
              <p className="text-xs text-gray-400 mt-3 font-medium">
                {searchQuery ? 'No matching chats found' : 'No conversations yet'}
              </p>
              <p className="text-[10px] text-gray-300 mt-1">Student messages will appear here</p>
            </div>
          ) : (
            filteredChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={`w-full flex items-center gap-3 px-5 py-4 border-b border-gray-50 transition-all hover:bg-white ${
                  selectedChat?.id === chat.id ? 'bg-navy/5 border-l-4 border-l-navy' : ''
                }`}
              >
                <div className="relative shrink-0">
                  <div className="w-11 h-11 bg-gradient-to-br from-[#1A237E] to-[#303F9F] rounded-full flex items-center justify-center shadow-md">
                    <span className="text-white font-black text-sm">
                      {chat.studentName?.charAt(0)?.toUpperCase() || 'S'}
                    </span>
                  </div>
                  {(chat.unreadAdmin || 0) > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow">
                      {chat.unreadAdmin}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex justify-between items-center">
                    <p className={`text-xs font-black truncate ${chat.unreadAdmin ? 'text-navy' : 'text-gray-700'}`}>
                      {chat.studentName || 'Student'}
                    </p>
                    <span className="text-[9px] text-gray-400 shrink-0 ml-2">{formatTime(chat.updatedAt)}</span>
                  </div>
                  <p className={`text-[11px] truncate mt-0.5 ${chat.unreadAdmin ? 'text-gray-700 font-bold' : 'text-gray-400'}`}>
                    {chat.lastMessageBy === 'admin' && <span className="text-blue-500">You: </span>}
                    {chat.lastMessage || 'No messages yet'}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white">
        {selectedChat ? (
          <>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-4 bg-white shadow-sm">
              <div className="w-10 h-10 bg-gradient-to-br from-[#1A237E] to-[#303F9F] rounded-full flex items-center justify-center">
                <span className="text-white font-black text-sm">
                  {selectedChat.studentName?.charAt(0)?.toUpperCase() || 'S'}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-black text-navy">{selectedChat.studentName}</p>
                <p className="text-[10px] text-gray-400">Student ID: {selectedChat.studentId}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 bg-[#F8F9FA]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23e2e8f0\' fill-opacity=\'0.15\'%3E%3Cpath d=\'M20 20.5V18H0v-2h20v-2H0V12h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v20h2V0h2v20.5z\'/%3E%3C/g%3E%3C/svg%3E")' }}>
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <span className="material-icons-outlined text-6xl text-gray-200">chat_bubble_outline</span>
                    <p className="text-sm text-gray-400 mt-3">No messages yet</p>
                    <p className="text-[10px] text-gray-300 mt-1">Send a reply to start the conversation</p>
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex mb-3 ${msg.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.senderType === 'student' && (
                      <div className="w-7 h-7 bg-gray-300 rounded-full flex items-center justify-center mr-2 mt-1 shrink-0">
                        <span className="text-white text-[10px] font-bold">{msg.senderName?.charAt(0)?.toUpperCase() || 'S'}</span>
                      </div>
                    )}
                    <div className={`max-w-[70%] px-4 py-2.5 shadow-sm ${
                      msg.senderType === 'admin'
                        ? 'bg-[#1A237E] text-white rounded-2xl rounded-br-md'
                        : 'bg-white text-gray-800 rounded-2xl rounded-bl-md border border-gray-100'
                    }`}>
                      <p className="text-sm leading-relaxed">{msg.message}</p>
                      <p className={`text-[9px] mt-1 text-right ${
                        msg.senderType === 'admin' ? 'text-white/50' : 'text-gray-400'
                      }`}>
                        {formatMsgTime(msg.createdAt)}
                      </p>
                    </div>
                    {msg.senderType === 'admin' && (
                      <div className="w-7 h-7 bg-[#1A237E] rounded-full flex items-center justify-center ml-2 mt-1 shrink-0">
                        <span className="text-white text-[9px] font-black">A1</span>
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-white">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Type your reply..."
                  className="flex-1 px-5 py-3 bg-gray-100 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-navy/20 text-sm"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="px-6 py-3 bg-navy text-white rounded-2xl text-sm font-bold disabled:opacity-40 hover:bg-[#303F9F] transition-colors flex items-center gap-2 shadow-lg shadow-navy/20"
                >
                  <span className="material-icons-outlined text-lg">{sending ? 'progress_activity' : 'send'}</span>
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-30">
            <span className="material-icons-outlined text-[100px]">forum</span>
            <p className="font-black mt-6 uppercase tracking-[0.3em] text-sm">Select a Conversation</p>
            <p className="text-xs text-gray-400 mt-2">Choose a student chat from the left panel</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSupport;

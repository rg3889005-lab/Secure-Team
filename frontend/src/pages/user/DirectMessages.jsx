import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  MessageSquare,
  Search,
  Plus,
  Send,
  User,
  Users,
  Check,
  CheckCheck,
  Circle,
  Loader2,
  X,
  Clock,
  Sparkles,
  Lock
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { chatService, userService } from '../../services';
import toast from 'react-hot-toast';

export default function DirectMessages() {
  const { user } = useAuth();
  const { socket, isUserOnline } = useSocket();
  const [searchParams] = useSearchParams();

  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typingName, setTypingName] = useState(null);

  // New Chat Modal
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch all user conversations
  const fetchConversations = useCallback(async () => {
    try {
      setLoadingConv(true);
      const res = await chatService.getConversations();
      const list = res.data?.data || res.data?.conversations || (Array.isArray(res.data) ? res.data : []);
      setConversations(list);

      // Select first or url param target
      const targetUserId = searchParams.get('userId');
      if (targetUserId && list.length > 0) {
        const found = list.find((c) =>
          c.participants?.some((p) => (p._id || p) === targetUserId)
        );
        if (found) {
          setActiveConv(found);
          return;
        }
      }

      if (list.length > 0 && !activeConv) {
        setActiveConv(list[0]);
      }
    } catch {
      setConversations([]);
    } finally {
      setLoadingConv(false);
    }
  }, [searchParams, activeConv]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // If URL has target user, search and open
  useEffect(() => {
    const targetUserId = searchParams.get('userId');
    if (!targetUserId || !user) return;

    const startWithUser = async () => {
      try {
        const res = await chatService.createConversation({ recipientId: targetUserId });
        const conv = res.data?.data || res.data?.conversation;
        if (conv) {
          setActiveConv(conv);
          fetchConversations();
        }
      } catch {}
    };

    startWithUser();
  }, [searchParams, user, fetchConversations]);

  // Load messages when activeConv changes
  useEffect(() => {
    if (!activeConv?._id) return;

    const loadMessages = async () => {
      try {
        setLoadingMessages(true);
        const res = await chatService.getMessages(activeConv._id);
        const list = res.data?.data || res.data?.messages || (Array.isArray(res.data) ? res.data : []);
        setMessages(list);
        await chatService.markAsRead(activeConv._id);
      } catch {
        setMessages([]);
      } finally {
        setLoadingMessages(false);
        setTimeout(scrollToBottom, 50);
      }
    };

    loadMessages();

    // Join DM room via socket
    if (socket) {
      socket.emit('dm:join', { conversationId: activeConv._id });
    }

    return () => {
      if (socket && activeConv._id) {
        socket.emit('dm:leave', { conversationId: activeConv._id });
      }
    };
  }, [activeConv?._id, socket]);

  // Socket real-time listeners for active DM
  useEffect(() => {
    if (!socket) return;

    const handleNewDM = (newMsg) => {
      if (newMsg.conversation === activeConv?._id || newMsg.conversation?._id === activeConv?._id) {
        setMessages((prev) => [...prev, newMsg]);
        setTimeout(scrollToBottom, 50);
        chatService.markAsRead(activeConv._id).catch(() => {});
      }
      // Refresh list to update snippet
      fetchConversations();
    };

    const handleDMTyping = ({ userId: tUserId, user: tUser }) => {
      if (tUserId !== user?._id) {
        setTypingName(tUser?.name || 'Someone');
      }
    };

    const handleDMStopTyping = () => {
      setTypingName(null);
    };

    const handleDMNotification = (notif) => {
      fetchConversations();
    };

    socket.on('dm:message', handleNewDM);
    socket.on('dm:typing', handleDMTyping);
    socket.on('dm:stop_typing', handleDMStopTyping);
    socket.on('dm:notification', handleDMNotification);

    return () => {
      socket.off('dm:message', handleNewDM);
      socket.off('dm:typing', handleDMTyping);
      socket.off('dm:stop_typing', handleDMStopTyping);
      socket.off('dm:notification', handleDMNotification);
    };
  }, [socket, activeConv?._id, user?._id, fetchConversations]);

  // Send Direct Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !activeConv?._id || sendingMsg) return;

    const content = messageText.trim();
    setMessageText('');
    setSendingMsg(true);

    try {
      const res = await chatService.sendMessage(activeConv._id, { content });
      const created = res.data?.data || res.data?.message;
      if (created && (!socket || !socket.connected)) {
        setMessages((prev) => [...prev, created]);
      }
      fetchConversations();
    } catch (err) {
      toast.error('Failed to send direct message');
      setMessageText(content);
    } finally {
      setSendingMsg(false);
      if (socket && activeConv?._id) {
        socket.emit('dm:stop_typing', { conversationId: activeConv._id });
      }
      setTimeout(scrollToBottom, 50);
    }
  };

  const handleInputChange = (e) => {
    setMessageText(e.target.value);
    if (socket && activeConv?._id) {
      socket.emit('dm:typing', { conversationId: activeConv._id });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('dm:stop_typing', { conversationId: activeConv._id });
      }, 2000);
    }
  };

  // Search users to start new chat
  const handleSearchUsers = async (query) => {
    setUserSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchingUsers(true);
    try {
      const res = await userService.searchUsers({ search: query.trim() });
      const usersList = res.data?.data || res.data?.users || (Array.isArray(res.data) ? res.data : []);
      // Filter out self
      setSearchResults(usersList.filter((u) => u._id !== user?._id));
    } catch {
      setSearchResults([]);
    } finally {
      setSearchingUsers(false);
    }
  };

  // Start conversation with selected user
  const handleSelectUserToChat = async (targetUser) => {
    try {
      const res = await chatService.createConversation({ recipientId: targetUser._id });
      const conv = res.data?.data || res.data?.conversation;
      setShowNewChatModal(false);
      setUserSearchQuery('');
      setSearchResults([]);

      if (conv) {
        setActiveConv(conv);
        setConversations((prev) => [conv, ...prev.filter((c) => c._id !== conv._id)]);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start conversation');
    }
  };

  // Helper to extract other participant from a conversation
  const getOtherParticipant = (conv) => {
    if (!conv || !conv.participants) return null;
    return conv.participants.find((p) => (p._id || p) !== user?._id) || conv.participants[0];
  };

  const activeOtherUser = getOtherParticipant(activeConv);
  const activeIsOnline = activeOtherUser?._id ? isUserOnline(activeOtherUser._id) : false;

  const filteredConversations = conversations.filter((c) => {
    const other = getOtherParticipant(c);
    if (!other) return false;
    const nameMatch = (other.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const emailMatch = (other.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    return nameMatch || emailMatch;
  });

  return (
    <div style={{
      display: 'flex',
      height: 'calc(100vh - 140px)',
      minHeight: 550,
      background: 'var(--bg-card)',
      borderRadius: 'var(--radius-xl)',
      border: '1px solid var(--border)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)'
    }}>
      {/* Left Sidebar: Conversations List */}
      <div style={{
        width: 340,
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-sidebar)'
      }}>
        {/* Header & New Message Button */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}>
              Direct Messages
            </h2>
            <button
              onClick={() => setShowNewChatModal(true)}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'var(--primary)',
                color: '#fff',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-glow)'
              }}
              title="Start New Direct Message"
            >
              <Plus size={18} />
            </button>
          </div>

          {/* Search Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            background: 'var(--bg-input)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)'
          }}>
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                width: '100%',
                fontSize: '0.825rem',
                color: 'var(--text)'
              }}
            />
          </div>
        </div>

        {/* Conversations Scroll Area */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loadingConv ? (
            <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>
              <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
              <span style={{ fontSize: '0.8rem' }}>Loading conversations...</span>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <MessageSquare size={32} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
              <p style={{ margin: 0, fontSize: '0.85rem' }}>No conversations found</p>
              <button
                onClick={() => setShowNewChatModal(true)}
                style={{
                  marginTop: 12,
                  fontSize: '0.8rem',
                  color: 'var(--primary)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                + Start a direct message
              </button>
            </div>
          ) : (
            filteredConversations.map((c) => {
              const other = getOtherParticipant(c);
              const isSelected = activeConv?._id === c._id;
              const online = other?._id ? isUserOnline(other._id) : false;
              const unread = c.unreadCounts?.[user?._id] || 0;

              return (
                <div
                  key={c._id}
                  onClick={() => setActiveConv(c)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px 18px',
                    cursor: 'pointer',
                    background: isSelected ? 'var(--primary-light)' : 'transparent',
                    borderLeft: isSelected ? '3px solid var(--primary)' : '3px solid transparent',
                    borderBottom: '1px solid var(--border)',
                    transition: 'background 0.15s ease'
                  }}
                >
                  {/* Avatar + Online Indicator */}
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.9rem'
                    }}>
                      {other?.name?.charAt(0) || 'U'}
                    </div>
                    {online && (
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: 11,
                        height: 11,
                        borderRadius: '50%',
                        background: 'var(--success)',
                        border: '2px solid var(--bg-card)'
                      }} />
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                      <span style={{
                        fontSize: '0.875rem',
                        fontWeight: isSelected ? 700 : 600,
                        color: 'var(--text)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {other?.name || 'Workspace User'}
                      </span>
                      {c.lastActivity && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {new Date(c.lastActivity).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        color: unread > 0 ? 'var(--text)' : 'var(--text-muted)',
                        fontWeight: unread > 0 ? 700 : 400,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: 180
                      }}>
                        {c.lastMessage?.content || other?.email || 'Start chatting...'}
                      </span>
                      {unread > 0 && (
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: 999,
                          background: 'var(--primary)',
                          color: '#fff',
                          fontSize: '0.65rem',
                          fontWeight: 700
                        }}>
                          {unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Main Pane: Active Conversation */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-card)' }}>
        {activeConv && activeOtherUser ? (
          <>
            {/* Header */}
            <div style={{
              padding: '14px 24px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--bg-input)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.9rem'
                  }}>
                    {activeOtherUser.name?.charAt(0) || 'U'}
                  </div>
                  {activeIsOnline && (
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: 'var(--success)',
                      border: '2px solid var(--bg-card)'
                    }} />
                  )}
                </div>

                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--text)' }}>
                    {activeOtherUser.name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>{activeIsOnline ? 'Active Now' : 'Offline'}</span>
                    <span>•</span>
                    <span>{activeOtherUser.email}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <Lock size={12} color="var(--primary)" />
                <span>1-to-1 Direct Messaging</span>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 14
            }}>
              {loadingMessages ? (
                <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-muted)' }}>
                  <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                  <p style={{ fontSize: '0.85rem' }}>Loading message history...</p>
                </div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-muted)' }}>
                  <MessageSquare size={40} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                  <h4 style={{ margin: '0 0 4px 0', color: 'var(--text)' }}>Direct Message Started</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>
                    Messages exchanged here are confidential between you and {activeOtherUser.name}.
                  </p>
                </div>
              ) : (
                messages.map((m) => {
                  const senderId = m.sender?._id || m.sender;
                  const isMe = senderId === user?._id;

                  return (
                    <div
                      key={m._id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMe ? 'flex-end' : 'flex-start'
                      }}
                    >
                      <div style={{
                        maxWidth: '70%',
                        padding: '10px 16px',
                        borderRadius: 'var(--radius)',
                        background: isMe ? 'var(--primary)' : 'var(--bg-input)',
                        color: isMe ? '#fff' : 'var(--text)',
                        fontSize: '0.875rem',
                        lineHeight: 1.5,
                        boxShadow: 'var(--shadow-sm)',
                        wordBreak: 'break-word'
                      }}>
                        {m.content}
                      </div>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        marginTop: 4,
                        fontSize: '0.7rem',
                        color: 'var(--text-light)'
                      }}>
                        <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {isMe && <CheckCheck size={12} color="var(--primary)" />}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Typing Indicator */}
            {typingName && (
              <div style={{ padding: '0 24px 6px', fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                {typingName} is typing...
              </div>
            )}

            {/* Input Form */}
            <form
              onSubmit={handleSendMessage}
              style={{
                padding: 16,
                borderTop: '1px solid var(--border)',
                display: 'flex',
                gap: 12,
                background: 'var(--bg-card)'
              }}
            >
              <input
                type="text"
                placeholder={`Message ${activeOtherUser.name}...`}
                value={messageText}
                onChange={handleInputChange}
                style={{
                  flex: 1,
                  padding: '11px 16px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  color: 'var(--text)',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                disabled={sendingMsg || !messageText.trim()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '10px 20px',
                  background: 'var(--primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  opacity: messageText.trim() ? 1 : 0.6
                }}
              >
                <Send size={16} /> Send
              </button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: 'center', margin: 'auto', padding: 40, color: 'var(--text-muted)' }}>
            <MessageSquare size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <h3 style={{ margin: '0 0 6px 0', color: 'var(--text)' }}>Your Direct Messages</h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.875rem', maxWidth: 360 }}>
              Select a conversation from the left or search for any team member to start a confidential 1-to-1 direct message.
            </p>
            <button
              onClick={() => setShowNewChatModal(true)}
              style={{
                padding: '9px 18px',
                background: 'var(--primary)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              Start New Message
            </button>
          </div>
        )}
      </div>

      {/* New Message / User Picker Modal */}
      {showNewChatModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            width: '100%',
            maxWidth: 440,
            padding: 24,
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}>
                New Direct Message
              </h3>
              <button
                onClick={() => setShowNewChatModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 14px',
              background: 'var(--bg-input)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              marginBottom: 16
            }}>
              <Search size={16} color="var(--text-muted)" />
              <input
                type="text"
                autoFocus
                placeholder="Search registered user by name or email..."
                value={userSearchQuery}
                onChange={(e) => handleSearchUsers(e.target.value)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  width: '100%',
                  fontSize: '0.875rem',
                  color: 'var(--text)'
                }}
              />
            </div>

            {/* Results */}
            <div style={{ maxHeight: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {searchingUsers ? (
                <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>
                  <Loader2 size={20} className="animate-spin" style={{ margin: '0 auto 6px' }} />
                  <span style={{ fontSize: '0.8rem' }}>Searching workspace users...</span>
                </div>
              ) : searchResults.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', margin: '20px 0' }}>
                  {userSearchQuery ? 'No matching users found.' : 'Type a name or email to search.'}
                </p>
              ) : (
                searchResults.map((u) => {
                  const online = isUserOnline(u._id);
                  return (
                    <div
                      key={u._id}
                      onClick={() => handleSelectUserToChat(u)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 12px',
                        borderRadius: 'var(--radius)',
                        cursor: 'pointer',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-input)',
                        transition: 'background 0.15s'
                      }}
                    >
                      <div style={{ position: 'relative' }}>
                        <div style={{
                          width: 34,
                          height: 34,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.85rem'
                        }}>
                          {u.name?.charAt(0) || 'U'}
                        </div>
                        {online && (
                          <div style={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            width: 9,
                            height: 9,
                            borderRadius: '50%',
                            background: 'var(--success)',
                            border: '1.5px solid var(--bg-card)'
                          }} />
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>{u.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

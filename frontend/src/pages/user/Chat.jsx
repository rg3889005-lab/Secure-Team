import { useState, useEffect, useRef } from 'react';
import {
  Send,
  MessageSquare,
  Users,
  Search,
  Plus,
  Circle,
  Hash,
  Smile,
  Paperclip,
  Check,
  CheckCheck
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { chatService } from '../../services';
import toast from 'react-hot-toast';

export default function Chat() {
  const { user } = useAuth();
  const { socket, onlineUsers, isUserOnline } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversations
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const res = await chatService.getConversations();
        const convList = res.data?.data || res.data?.conversations || (Array.isArray(res.data) ? res.data : []);
        setConversations(convList);
        if (convList.length > 0 && !activeConv) {
          setActiveConv(convList[0]);
        }
      } catch {
        // Fallback demo channel if empty
        const defaultChannel = {
          _id: 'general-channel',
          name: 'General Discussion',
          isGroup: true,
          participants: [],
        };
        setConversations([defaultChannel]);
        setActiveConv(defaultChannel);
      }
    };
    loadConversations();
  }, []);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeConv) return;

    const loadMessages = async () => {
      try {
        const res = await chatService.getMessages(activeConv._id);
        const msgList = res.data?.data || res.data?.messages || (Array.isArray(res.data) ? res.data : []);
        setMessages(msgList);
      } catch {
        setMessages([
          {
            _id: '1',
            sender: { _id: 'sys', name: 'System Bot' },
            content: `Welcome to the ${activeConv.name || 'channel'}! Start collaborating in real-time.`,
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    };
    loadMessages();

    // Join room via socket
    if (socket && activeConv._id) {
      socket.emit('chat:join', { conversationId: activeConv._id });
    }

    return () => {
      if (socket && activeConv._id) {
        socket.emit('chat:leave', { conversationId: activeConv._id });
      }
    };
  }, [activeConv, socket]);

  // Listen for socket chat events
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
      if (msg.conversation === activeConv?._id || msg.conversationId === activeConv?._id) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    const handleUserTyping = ({ userId, conversationId }) => {
      if (conversationId === activeConv?._id && userId !== user?._id) {
        setTypingUsers((prev) => new Set([...prev, userId]));
      }
    };

    const handleUserStopTyping = ({ userId, conversationId }) => {
      if (conversationId === activeConv?._id) {
        setTypingUsers((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      }
    };

    socket.on('chat:message', handleNewMessage);
    socket.on('chat:typing', handleUserTyping);
    socket.on('chat:stop_typing', handleUserStopTyping);

    return () => {
      socket.off('chat:message', handleNewMessage);
      socket.off('chat:typing', handleUserTyping);
      socket.off('chat:stop_typing', handleUserStopTyping);
    };
  }, [socket, activeConv, user]);

  const handleTyping = (e) => {
    setMessageText(e.target.value);
    if (!socket || !activeConv) return;

    socket.emit('chat:typing', { conversationId: activeConv._id });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('chat:stop_typing', { conversationId: activeConv._id });
    }, 1500);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !activeConv) return;

    const text = messageText.trim();
    setMessageText('');

    const optimisticMsg = {
      _id: Date.now().toString(),
      conversation: activeConv._id,
      sender: {
        _id: user?._id || 'me',
        name: user?.name || 'Me',
      },
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    // Emit via socket
    if (socket) {
      socket.emit('chat:message', {
        conversationId: activeConv._id,
        content: text,
      });
      socket.emit('chat:stop_typing', { conversationId: activeConv._id });
    }
  };

  return (
    <div style={{
      height: 'calc(100vh - 120px)',
      display: 'flex',
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-xl)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)'
    }}>
      {/* Left Conversations Sidebar */}
      <div style={{
        width: 300,
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-sidebar)'
      }}>
        {/* Search header */}
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--bg-hover)',
            padding: '8px 12px',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)'
          }}>
            <Search size={16} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '0.85rem',
                color: 'var(--text)',
                width: '100%',
                fontFamily: 'inherit'
              }}
            />
          </div>
        </div>

        {/* Conversations List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {conversations.map((conv) => {
            const isActive = activeConv?._id === conv._id;
            return (
              <button
                key={conv._id}
                onClick={() => setActiveConv(conv)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 'var(--radius)',
                  border: 'none',
                  background: isActive ? 'var(--primary-light)' : 'transparent',
                  color: isActive ? 'var(--primary)' : 'var(--text)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s'
                }}
              >
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius)',
                  background: isActive ? 'var(--primary)' : 'var(--bg-hover)',
                  color: isActive ? '#fff' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  flexShrink: 0
                }}>
                  {conv.isGroup ? <Hash size={18} /> : <Users size={18} />}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {conv.name || 'Team Chat'}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                    {conv.lastMessage?.content || 'Click to open conversation'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
        {/* Chat Header */}
        <div style={{
          height: 64,
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-card)',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 'var(--radius)',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Hash size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>
                {activeConv?.name || 'General Channel'}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }} />
                <span>Active workspace session</span>
              </div>
            </div>
          </div>
        </div>

        {/* Message Stream */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}>
          {messages.map((msg, index) => {
            const isMe = msg.sender?._id === user?._id || msg.sender?._id === 'me';
            return (
              <div
                key={msg._id || index}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '75%',
                  alignSelf: isMe ? 'flex-end' : 'flex-start'
                }}
              >
                {!isMe && (
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, paddingLeft: 4 }}>
                    {msg.sender?.name || 'User'}
                  </span>
                )}
                <div style={{
                  padding: '12px 16px',
                  borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: isMe ? 'var(--primary)' : 'var(--bg-card)',
                  color: isMe ? '#ffffff' : 'var(--text)',
                  border: isMe ? 'none' : '1px solid var(--border)',
                  boxShadow: 'var(--shadow-sm)',
                  fontSize: '0.9rem',
                  lineHeight: 1.5,
                  wordBreak: 'break-word'
                }}>
                  {msg.content}
                </div>
                <span style={{
                  fontSize: '0.65rem',
                  color: 'var(--text-light)',
                  marginTop: 4,
                  padding: '0 4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  {isMe && <CheckCheck size={12} color="var(--primary)" />}
                </span>
              </div>
            );
          })}

          {typingUsers.size > 0 && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="animate-pulse">Someone is typing...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Box */}
        <form
          onSubmit={handleSendMessage}
          style={{
            padding: '16px 24px',
            background: 'var(--bg-card)',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}
        >
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'var(--bg-input)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '10px 16px'
          }}>
            <input
              type="text"
              placeholder={`Message #${activeConv?.name || 'channel'}...`}
              value={messageText}
              onChange={handleTyping}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                width: '100%',
                fontSize: '0.9rem',
                color: 'var(--text)',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={!messageText.trim()}
            style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius)',
              background: 'var(--primary)',
              color: '#fff',
              border: 'none',
              cursor: messageText.trim() ? 'pointer' : 'not-allowed',
              opacity: messageText.trim() ? 1 : 0.6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-glow)',
              transition: 'all 0.15s ease'
            }}
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}

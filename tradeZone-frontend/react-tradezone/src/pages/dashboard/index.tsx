import { useCallback, memo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { logoutUser } from '../../redux/slices/authSlice';
import LiveChart from '../../components/LiveChart';
import { io, Socket } from 'socket.io-client';
import config from '../../config/env';

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  receiverId?: string;
  roomId?: string;
  createdAt: Date;
  readAt?: Date;
  messageType?: 'text' | 'image' | 'file' | 'system';
}

interface OnlineUser {
  userId: string;
  userName: string;
  socketId: string;
}

const Dashboard = memo(function Dashboard() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const handleLogout = useCallback(() => {
    dispatch(logoutUser());
    navigate('/');
  }, [dispatch, navigate]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!user) return;

    console.log('🔌 Attempting to connect to chat server...');
    const newSocket = io(config.API_BASE_URL, {
      auth: {
        user: {
          userId: user.id,
          userName: user.name,
        },
      },
      transports: ['websocket', 'polling'],
      timeout: 10000,
      withCredentials: true,
      forceNew: true,
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to chat server');
      setConnectionStatus('connected');
      newSocket.emit('getOnlineUsers');
      
      // Load previous messages
      fetch(`${config.API_BASE_URL}/chat/messages`)
        .then(response => response.json())
        .then(data => {
          console.log('📚 Loaded previous messages:', data);
          if (Array.isArray(data)) {
            setMessages(data);
          }
        })
        .catch(error => {
          console.error('❌ Error loading messages:', error);
        });
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from chat server');
      setConnectionStatus('disconnected');
    });

    newSocket.on('connect_error', (error) => {
      console.log('❌ Connection error:', error);
      setConnectionStatus('error');
    });

    newSocket.on('onlineUsers', (users: OnlineUser[]) => {
      console.log('👥 Online users received:', users);
      setOnlineUsers(users.filter(u => u.userId !== user.id));
    });

    newSocket.on('newMessage', (message: Message) => {
      console.log('💬 New message received:', message);
      setMessages(prev => {
        // Check if this is a response to our own message (replace temp message)
        const tempMessageIndex = prev.findIndex(msg => 
          msg.id.startsWith('temp-') && 
          msg.content === message.content && 
          msg.senderId === message.senderId
        );
        
        if (tempMessageIndex !== -1) {
          // Replace temp message with real message
          const newMessages = [...prev];
          newMessages[tempMessageIndex] = message;
          return newMessages;
        } else {
          // Add new message from other users
          return [...prev, message];
        }
      });
      
      // Mark messages as read if it's a direct message to current user
      if (message.receiverId === user.id && !message.readAt) {
        newSocket.emit('markMessagesAsRead', { senderId: message.senderId });
      }
    });

    newSocket.on('messageSent', (message: Message) => {
      console.log('✅ Message sent confirmation:', message);
      // Replace temp message with confirmed message
      setMessages(prev => {
        const tempMessageIndex = prev.findIndex(msg => 
          msg.id.startsWith('temp-') && 
          msg.content === message.content && 
          msg.senderId === message.senderId
        );
        
        if (tempMessageIndex !== -1) {
          const newMessages = [...prev];
          newMessages[tempMessageIndex] = message;
          return newMessages;
        }
        return prev;
      });
    });

    newSocket.on('messagesRead', (data: { readerId: string; readerName: string }) => {
      setMessages(prev => prev.map(msg => 
        msg.senderId === data.readerId && !msg.readAt 
          ? { ...msg, readAt: new Date() }
          : msg
      ));
    });

    newSocket.on('userOnline', (user: OnlineUser) => {
      setOnlineUsers(prev => {
        const exists = prev.find(u => u.userId === user.userId);
        if (!exists) {
          return [...prev, user];
        }
        return prev;
      });
    });

    newSocket.on('userOffline', (user: OnlineUser) => {
      setOnlineUsers(prev => prev.filter(u => u.userId !== user.userId));
    });

    newSocket.on('userTyping', (data: { userId: string; userName: string; isTyping: boolean }) => {
      if (data.isTyping) {
        setTypingUsers(prev => [...prev, data.userName]);
      } else {
        setTypingUsers(prev => prev.filter(name => name !== data.userName));
      }
    });

    newSocket.on('systemMessage', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [user]);

  const sendMessage = useCallback(() => {
    console.log('📤 Send message called with:', { 
      message: newMessage,
      hasSocket: !!socket, 
      hasUser: !!user,
      socketConnected: socket?.connected
    });

    if (!newMessage.trim()) {
      console.log('❌ Message is empty');
      return;
    }

    if (!socket) {
      console.log('❌ Socket not available');
      return;
    }

    if (!user) {
      console.log('❌ User not available');
      return;
    }

    if (!socket.connected) {
      console.log('❌ Socket not connected');
      return;
    }

    const messageData = {
      content: newMessage,
      messageType: 'text' as const,
    };

    console.log('📤 Emitting sendMessage event:', messageData);
    
    // Add message to UI immediately for better UX
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      content: newMessage,
      senderId: user.id,
      senderName: user.name,
      createdAt: new Date(),
      messageType: 'text',
    };
    
    setMessages(prev => [...prev, tempMessage]);
    
    // Set timeout to remove temp message if not confirmed within 5 seconds
    setTimeout(() => {
      setMessages(prev => {
        const messageExists = prev.find(msg => 
          msg.id.startsWith('temp-') && 
          msg.content === tempMessage.content && 
          msg.senderId === tempMessage.senderId
        );
        
        if (messageExists) {
          console.log('⚠️ Removing unconfirmed temp message:', tempMessage.content);
          return prev.filter(msg => msg.id !== tempMessage.id);
        }
        return prev;
      });
    }, 5000);
    
    try {
      socket.emit('sendMessage', messageData, (response: any) => {
        console.log('📤 Message send response:', response);
        if (response?.error) {
          console.error('❌ Error sending message:', response.error);
          // Remove temp message if there's an error
          setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
        }
      });
      
      // Clear the input immediately for better UX
      setNewMessage('');
      setIsTyping(false);
    } catch (error) {
      console.error('❌ Error emitting message:', error);
      // Remove temp message if there's an error
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
    }
  }, [newMessage, socket, user]);

  const handleTyping = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (!socket) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', { isTyping: true });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('typing', { isTyping: false });
    }, 1000);
  }, [socket, isTyping]);

  const formatTime = useCallback((date: Date) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  }, []);

  const formatDate = useCallback((date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffTime = Math.abs(now.getTime() - messageDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Today';
    } else if (diffDays === 2) {
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return messageDate.toLocaleDateString([], { weekday: 'long' });
    } else {
      return messageDate.toLocaleDateString();
    }
  }, []);

  const getMessageStatus = useCallback((message: Message) => {
    if (message.senderId === user?.id) {
      if (message.readAt) {
        return '✓✓ Read';
      } else if (message.receiverId) {
        return '✓ Delivered';
      }
    }
    return '';
  }, [user]);

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Top Header with Logout */}
      <div className="bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-white">Trading Dashboard</h1>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </div>
            <div>
              <p className="text-white text-sm font-medium">
                {user?.name || 'User'}
              </p>
              <p className="text-gray-400 text-xs">
                {user?.email || 'user@example.com'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-400">
            {onlineUsers.length} online
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content - Chart and Chat */}
      <div className="flex-1 flex">
        {/* Chart Section - 70% */}
        <div className="w-[70%]">
          <LiveChart key="live-chart" />
        </div>

        {/* Chat Section - 30% */}
        <div className="w-[30%] bg-gray-800 border-l border-gray-700 flex flex-col">
                     {/* Chat Header */}
           <div className="p-4 border-b border-gray-700">
             <div className="flex justify-between items-center mb-2">
               <h2 className="text-lg font-bold text-white">Global Chat</h2>
               <div className="flex items-center space-x-2">
                 <div className={`w-2 h-2 rounded-full ${
                   connectionStatus === 'connected' ? 'bg-green-400' :
                   connectionStatus === 'connecting' ? 'bg-yellow-400' :
                   connectionStatus === 'error' ? 'bg-red-400' : 'bg-gray-400'
                 }`}></div>
                 <div className="text-sm text-green-400">
                   {onlineUsers.length + 1} online
                 </div>
               </div>
             </div>
             
             {/* Online Users */}
             <div className="flex flex-wrap gap-1 mb-2">
               <div className="flex items-center space-x-1">
                 <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                 <span className="text-xs text-gray-300">You</span>
               </div>
               {onlineUsers.map((onlineUser) => (
                 <div key={onlineUser.userId} className="flex items-center space-x-1">
                   <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                   <span className="text-xs text-gray-300">{onlineUser.userName}</span>
                 </div>
               ))}
             </div>
             
             {typingUsers.length > 0 && (
               <p className="text-sm text-gray-400">
                 {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
               </p>
             )}
             
             {/* Debug Info */}
             <div className="text-xs text-gray-500 mt-1">
               Status: {connectionStatus} | Socket: {socket?.connected ? 'Connected' : 'Disconnected'} | ID: {socket?.id || 'None'}
               {connectionStatus === 'error' && (
                 <button 
                   onClick={() => window.location.reload()}
                   className="ml-2 text-blue-400 hover:text-blue-300"
                 >
                   Reconnect
                 </button>
               )}
             </div>
           </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message, index) => {
              const showDate = index === 0 || 
                new Date(message.createdAt).toDateString() !== 
                new Date(messages[index - 1]?.createdAt).toDateString();

              return (
                <div key={message.id}>
                  {showDate && (
                    <div className="text-center text-xs text-gray-500 my-2">
                      {formatDate(message.createdAt)}
                    </div>
                  )}
                  <div className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}>
                                         <div
                       className={`max-w-[85%] px-3 py-2 rounded-lg ${
                         message.messageType === 'system'
                           ? 'bg-yellow-600 text-white mx-auto'
                           : message.senderId === user?.id
                           ? message.id.startsWith('temp-') 
                             ? 'bg-blue-400 text-white opacity-75' // Temporary message styling
                             : 'bg-blue-600 text-white'
                           : 'bg-gray-700 text-gray-300'
                       }`}
                     >
                      {message.messageType !== 'system' && (
                        <div className="text-xs font-medium mb-1">{message.senderName}</div>
                      )}
                      <div className="text-sm">{message.content}</div>
                                             <div className="flex items-center justify-between text-xs opacity-75 mt-1">
                         <span>{formatTime(message.createdAt)}</span>
                         {message.id.startsWith('temp-') ? (
                           <span className="ml-2 text-yellow-300">Sending...</span>
                         ) : getMessageStatus(message) ? (
                           <span className="ml-2">{getMessageStatus(message)}</span>
                         ) : null}
                       </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={handleTyping}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type your message..."
                className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default Dashboard;

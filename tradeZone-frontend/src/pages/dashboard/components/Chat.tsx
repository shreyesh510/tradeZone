import { useCallback, useState, useEffect, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '../../../redux/hooks';
import { io, Socket } from 'socket.io-client';
import config from '../../../config/env';
import { generateOpenAIResponse } from '../../../redux/thunks/openai/openAI';
import { useSettings } from '../../../contexts/SettingsContext';

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  createdAt: Date;
  messageType?: 'text' | 'system';
}

interface OnlineUser {
  userId: string;
  userName: string;
  socketId: string;
}

interface ChatProps {
  onlineUsers: OnlineUser[];
  setOnlineUsers: (users: OnlineUser[]) => void;
}

const Chat = ({ onlineUsers, setOnlineUsers }: ChatProps) => {
  const { settings } = useSettings();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
  const [aiMode, setAiMode] = useState<boolean>(false);
  const [showAiWarning, setShowAiWarning] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const { loading: aiLoading, error: aiError } = useAppSelector((state) => state.openai);

  // Use settings for theme
  const isDarkMode = settings.theme === 'dark';

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const toggleEmojiPicker = useCallback(() => {
    setShowEmojiPicker(prev => !prev);
  }, []);

  const addToRecentEmojis = useCallback((emoji: string) => {
    setRecentEmojis(prev => {
      const newRecent = [emoji, ...prev.filter(e => e !== emoji)].slice(0, 30);
      localStorage.setItem('recentEmojis', JSON.stringify(newRecent));
      return newRecent;
    });
  }, []);

  const handleAiToggle = useCallback(() => {
    // For backward compatibility: if isAiFeatureEnabled is undefined, allow AI (existing users)
    const hasAiAccess = user?.isAiFeatureEnabled !== false;
    
    if (!hasAiAccess && !aiMode) {
      // User trying to enable AI but doesn't have permission
      setShowAiWarning(true);
      setTimeout(() => setShowAiWarning(false), 3000); // Hide warning after 3 seconds
      return;
    }
    setAiMode(prev => !prev);
  }, [user?.isAiFeatureEnabled, aiMode]);

  const onEmojiClick = useCallback((emoji: string) => {
    setNewMessage(prev => prev + emoji);
    addToRecentEmojis(emoji);
    setShowEmojiPicker(false);
  }, [addToRecentEmojis]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load recent emojis from localStorage on component mount
  useEffect(() => {
    const savedRecentEmojis = localStorage.getItem('recentEmojis');
    if (savedRecentEmojis) {
      try {
        setRecentEmojis(JSON.parse(savedRecentEmojis));
      } catch (error) {
        console.error('Error loading recent emojis:', error);
      }
    }
  }, []);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  // Emoji data organized by categories
  const emojiCategories = {
    recent: recentEmojis,
    smileys: [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
      '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
      '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
      '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
      '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
      '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗'
    ],
    gestures: [
      '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞',
      '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍',
      '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝'
    ],
    hearts: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
      '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️'
    ]
  };

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
      
      // Request previous in-memory messages from server
      newSocket.emit('getMessages');
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

    newSocket.on('userOnline', (user: OnlineUser) => {
      setOnlineUsers((prev: OnlineUser[]) => {
        const exists = prev.find((u: OnlineUser) => u.userId === user.userId);
        if (!exists) {
          return [...prev, user];
        }
        return prev;
      });
    });

    newSocket.on('userOffline', (user: OnlineUser) => {
      setOnlineUsers((prev: OnlineUser[]) => prev.filter((u: OnlineUser) => u.userId !== user.userId));
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
  }, [user, setOnlineUsers]);

  const sendAIMessage = useCallback(async () => {
    if (!newMessage.trim() || !user) return;

    const userMessage: Message = {
      id: `ai-user-${Date.now()}`,
      content: newMessage,
      senderId: user.id,
      senderName: user.name,
      createdAt: new Date(),
      messageType: 'text',
    };

    // Add user message to chat immediately
    setMessages(prev => [...prev, userMessage]);
    
    const prompt = newMessage;
    setNewMessage('');
    setIsTyping(false);

    try {
      // Dispatch OpenAI API call
      const result = await dispatch(generateOpenAIResponse({ 
        prompt,
        systemMessage: "You are a helpful AI assistant in a cryptocurrency trading chat. Provide concise, helpful responses about trading, market analysis, or general questions. Keep responses under 150 words."
      }));

      if (generateOpenAIResponse.fulfilled.match(result)) {
        // Add AI response message
        const aiMessage: Message = {
          id: `ai-response-${Date.now()}`,
          content: result.payload.message,
          senderId: 'ai-assistant',
          senderName: '🤖 AI Assistant',
          createdAt: new Date(),
          messageType: 'text',
        };
        
        setMessages(prev => [...prev, aiMessage]);
      } else if (generateOpenAIResponse.rejected.match(result)) {
        // Handle error
        const errorMessage: Message = {
          id: `ai-error-${Date.now()}`,
          content: `❌ AI Error: ${result.payload || 'Failed to get AI response'}`,
          senderId: 'system',
          senderName: 'System',
          createdAt: new Date(),
          messageType: 'system',
        };
        
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('❌ Error calling OpenAI:', error);
      const errorMessage: Message = {
        id: `ai-error-${Date.now()}`,
        content: '❌ Failed to get AI response. Please try again.',
        senderId: 'system',
        senderName: 'System',
        createdAt: new Date(),
        messageType: 'system',
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
  }, [newMessage, user, dispatch]);

  const sendMessage = useCallback(() => {
    // If AI mode is on, send to OpenAI instead of chat
    if (aiMode) {
      sendAIMessage();
      return;
    }

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
  }, [newMessage, socket, user, aiMode, sendAIMessage]);

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

  return (
    <div className={`w-full md:w-[30%] flex flex-col h-full ${
      isDarkMode 
        ? 'bg-gray-800 md:border-l border-gray-700' 
        : 'bg-white md:border-l border-gray-200'
    }`}>
      {/* Chat Header */}
      <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex justify-between items-center mb-2">
          <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Global Chat</h2>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-400' :
              connectionStatus === 'connecting' ? 'bg-yellow-400' :
              connectionStatus === 'error' ? 'bg-red-400' : 'bg-gray-400'
            }`}></div>
            <div className={`text-sm ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
              {onlineUsers.length + 1} online
            </div>
          </div>
        </div>
        
        {/* AI Mode Toggle */}
        <div className="flex items-center justify-between mb-2">
          <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>AI Mode</span>
          <div className="relative">
            <button
              onClick={handleAiToggle}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                aiMode ? 'bg-blue-600' : 'bg-gray-600'
              } ${user?.isAiFeatureEnabled === false ? 'opacity-50' : ''}`}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 ${
                  aiMode ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
            
            {/* AI Permission Warning */}
            {showAiWarning && (
              <div className="absolute top-6 right-0 z-50 bg-red-600 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                AI feature not available for your account
                <div className="absolute -top-1 right-2 w-0 h-0 border-l-2 border-r-2 border-b-2 border-transparent border-b-red-600"></div>
              </div>
            )}
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
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
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
            <div key={`${message.id}-${index}`}>
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
                      : message.senderId === 'ai-assistant'
                      ? 'bg-purple-600 text-white border-l-4 border-purple-400'
                      : message.senderId === user?.id
                      ? message.id.startsWith('temp-') 
                        ? 'bg-blue-400 text-white opacity-75' // Temporary message styling
                        : 'bg-blue-600 text-white'
                      : isDarkMode
                        ? 'bg-gray-700 text-gray-300'
                        : 'bg-gray-200 text-gray-800'
                  }`}
                >
                 {message.messageType !== 'system' && (
                   <div className="text-xs font-medium mb-1">{message.senderName}</div>
                 )}
                 <div className="text-sm">{message.content}</div>
                 <div className="flex items-center justify-between text-xs opacity-75 mt-1">
                    <span>{formatTime(message.createdAt)}</span>
                    {message.id.startsWith('temp-') && (
                      <span className="ml-2 text-yellow-300">Sending...</span>
                    )}
                  </div>
               </div>
             </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className={`p-4 border-t relative ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div 
            ref={emojiPickerRef}
            className={`absolute bottom-full left-4 mb-2 rounded-lg shadow-lg p-4 w-80 z-50 ${
              isDarkMode 
                ? 'bg-gray-800 border border-gray-600' 
                : 'bg-white border border-gray-300'
            }`}
          >
            <div className="mb-3">
              <div className="flex space-x-2 mb-2">
                {Object.keys(emojiCategories).map((category) => (
                  <button
                    key={category}
                    className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 capitalize"
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="max-h-48 overflow-y-auto">
              {/* Recent Emojis */}
              {recentEmojis.length > 0 && (
                <div className="mb-4">
                  <h4 className={`text-xs mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Recent</h4>
                  <div className="grid grid-cols-8 gap-1">
                    {recentEmojis.slice(0, 16).map((emoji, index) => (
                      <button
                        key={index}
                        onClick={() => onEmojiClick(emoji)}
                        className="p-2 hover:bg-gray-700 rounded text-lg"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Smileys */}
              <div className="mb-4">
                <h4 className={`text-xs mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Smileys</h4>
                <div className="grid grid-cols-8 gap-1">
                  {emojiCategories.smileys.map((emoji, index) => (
                    <button
                      key={index}
                      onClick={() => onEmojiClick(emoji)}
                      className="p-2 hover:bg-gray-700 rounded text-lg"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Gestures */}
              <div className="mb-4">
                <h4 className={`text-xs mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Gestures</h4>
                <div className="grid grid-cols-8 gap-1">
                  {emojiCategories.gestures.map((emoji, index) => (
                    <button
                      key={index}
                      onClick={() => onEmojiClick(emoji)}
                      className="p-2 hover:bg-gray-700 rounded text-lg"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Hearts */}
              <div>
                <h4 className={`text-xs mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Hearts</h4>
                <div className="grid grid-cols-8 gap-1">
                  {emojiCategories.hearts.map((emoji, index) => (
                    <button
                      key={index}
                      onClick={() => onEmojiClick(emoji)}
                      className="p-2 hover:bg-gray-700 rounded text-lg"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex space-x-2">
          <button
            onClick={toggleEmojiPicker}
            className="text-yellow-400 hover:text-yellow-300 p-2 transition-colors duration-200"
            title="Add emoji"
          >
            😊
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={aiMode ? "Ask AI anything..." : "Type your message..."}
            className={`flex-1 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 text-sm ${
              aiMode 
                ? `bg-purple-700 text-white focus:ring-purple-500 border border-purple-600` 
                : isDarkMode
                  ? 'bg-gray-700 text-white focus:ring-blue-500'
                  : 'bg-gray-100 text-gray-900 focus:ring-blue-500 border border-gray-300'
            }`}
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || (aiMode && aiLoading)}
            className={`px-3 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm ${
              aiMode
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {aiMode ? (aiLoading ? '🤖' : 'Ask AI') : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;

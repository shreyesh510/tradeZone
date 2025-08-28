import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppSelector } from '../redux/hooks';
import { io, Socket } from 'socket.io-client';
import config from '../config/env';

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

interface UserChatSummary {
  userId: string;
  userName: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
  isOnline: boolean;
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [chatSummaries, setChatSummaries] = useState<UserChatSummary[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [currentView, setCurrentView] = useState<'global' | 'direct'>('global');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const { user } = useAppSelector((state) => state.auth);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!user) return;

    const newSocket = io(config.API_BASE_URL, {
      auth: {
        user: {
          userId: user.id,
          userName: user.name,
        },
      },
    });

    newSocket.on('connect', () => {
      console.log('Connected to chat server');
      newSocket.emit('getOnlineUsers');
      newSocket.emit('getUserChatSummary');
    });

    newSocket.on('onlineUsers', (users: OnlineUser[]) => {
      setOnlineUsers(users.filter(u => u.userId !== user.id));
    });

    newSocket.on('userChatSummary', (summaries: UserChatSummary[]) => {
      setChatSummaries(summaries);
    });

    newSocket.on('newMessage', (message: Message) => {
      setMessages(prev => [...prev, message]);
      
      // Mark messages as read if it's a direct message to current user
      if (message.receiverId === user.id && !message.readAt) {
        newSocket.emit('markMessagesAsRead', { senderId: message.senderId });
      }
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
      
      setChatSummaries(prev => prev.map(summary => 
        summary.userId === user.userId 
          ? { ...summary, isOnline: true }
          : summary
      ));
    });

    newSocket.on('userOffline', (user: OnlineUser) => {
      setOnlineUsers(prev => prev.filter(u => u.userId !== user.userId));
      
      setChatSummaries(prev => prev.map(summary => 
        summary.userId === user.userId 
          ? { ...summary, isOnline: false }
          : summary
      ));
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
    if (!newMessage.trim() || !socket || !user) return;

    const messageData = {
      content: newMessage,
      receiverId: selectedUser,
      messageType: 'text' as const,
    };

    socket.emit('sendMessage', messageData);
    setNewMessage('');
    setIsTyping(false);
    
    // Clear typing indicator
    if (selectedUser) {
      socket.emit('typing', { receiverId: selectedUser, isTyping: false });
    }
  }, [newMessage, socket, user, selectedUser]);

  const handleTyping = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (!socket || !selectedUser) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', { receiverId: selectedUser, isTyping: true });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('typing', { receiverId: selectedUser, isTyping: false });
    }, 1000);
  }, [socket, selectedUser, isTyping]);

  const sendDirectMessage = useCallback((receiverId: string) => {
    setSelectedUser(receiverId);
    setCurrentView('direct');
    
    // Mark messages as read when opening chat
    if (socket) {
      socket.emit('markMessagesAsRead', { senderId: receiverId });
    }
  }, [socket]);

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
    <div className="h-screen bg-gray-900 flex">
      {/* Chat Summaries Sidebar */}
      <div className="w-1/4 bg-gray-800 border-r border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Chats</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentView('global')}
              className={`px-3 py-1 rounded text-sm ${
                currentView === 'global'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Global
            </button>
            <button
              onClick={() => setCurrentView('direct')}
              className={`px-3 py-1 rounded text-sm ${
                currentView === 'direct'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Direct
            </button>
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {currentView === 'global' ? (
            <div
              onClick={() => setSelectedUser(null)}
              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                !selectedUser
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">Global Chat</span>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
            </div>
          ) : (
            chatSummaries.map((summary) => (
              <div
                key={summary.userId}
                onClick={() => sendDirectMessage(summary.userId)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedUser === summary.userId
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${summary.isOnline ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                    <span className="font-medium">{summary.userName}</span>
                  </div>
                  {summary.unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {summary.unreadCount}
                    </span>
                  )}
                </div>
                {summary.lastMessage && (
                  <div className="text-xs opacity-75 mt-1 truncate">
                    {summary.lastMessage}
                  </div>
                )}
                {summary.lastMessageTime && (
                  <div className="text-xs opacity-50 mt-1">
                    {formatTime(summary.lastMessageTime)}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Online Users */}
        <div className="p-4 border-t border-gray-700">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Online Users</h3>
          <div className="space-y-1">
            {onlineUsers.map((user) => (
              <div key={user.userId} className="flex items-center space-x-2 text-sm text-gray-300">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>{user.userName}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-gray-800 border-b border-gray-700 p-4">
          <h1 className="text-xl font-bold text-white">
            {currentView === 'global' 
              ? 'Global Chat' 
              : selectedUser 
                ? `Chat with ${chatSummaries.find(s => s.userId === selectedUser)?.userName || 'User'}`
                : 'Select a chat'
            }
          </h1>
          {typingUsers.length > 0 && (
            <p className="text-sm text-gray-400 mt-1">
              {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </p>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => {
            const showDate = index === 0 || 
              new Date(message.createdAt).toDateString() !== 
              new Date(messages[index - 1]?.createdAt).toDateString();

            return (
              <div key={message.id}>
                {showDate && (
                  <div className="text-center text-xs text-gray-500 my-4">
                    {formatDate(message.createdAt)}
                  </div>
                )}
                <div className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.messageType === 'system'
                        ? 'bg-yellow-600 text-white mx-auto'
                        : message.senderId === user?.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300'
                    }`}
                  >
                    {message.messageType !== 'system' && (
                      <div className="text-sm font-medium mb-1">{message.senderName}</div>
                    )}
                    <div className="text-sm">{message.content}</div>
                    <div className="flex items-center justify-between text-xs opacity-75 mt-1">
                      <span>{formatTime(message.createdAt)}</span>
                      {getMessageStatus(message) && (
                        <span className="ml-2">{getMessageStatus(message)}</span>
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
        <div className="bg-gray-800 border-t border-gray-700 p-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={handleTyping}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type your message..."
              className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;

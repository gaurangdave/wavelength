'use client';

import { useState, useEffect, useRef } from 'react';
import WebRTCManager, { type Participant, type WebRTCMessage } from '@/lib/webrtc';

interface Message {
  id?: number;
  content: string;
  created_at: string;
  messageId?: string;
  isP2P?: boolean;
}

export default function HelloWebRTCPage() {
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [userName, setUserName] = useState('');
  const [createRoomName, setCreateRoomName] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentRoomName, setCurrentRoomName] = useState<string>('');
  const [currentUserName, setCurrentUserName] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [messagePollingInterval, setMessagePollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [lastMessageCheck, setLastMessageCheck] = useState<Date>(new Date());

  const webRTCManagerRef = useRef<WebRTCManager | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const initializeWebRTC = (userName: string) => {
    if (webRTCManagerRef.current) {
      webRTCManagerRef.current.leaveRoom();
    }

    const manager = new WebRTCManager(userName);
    
    manager.onConnectionStateChange((connected) => {
      setIsConnected(connected);
    });

    manager.onParticipantsUpdate((participants) => {
      setParticipants(participants);
    });

    manager.onErrorOccurred((error) => {
      setError(error.message);
      setIsLoading(false);
    });

    manager.onPeerMessage((message: WebRTCMessage) => {
      const newMsg: Message = {
        content: `${message.userName}: ${message.content}`,
        created_at: message.timestamp,
        messageId: message.messageId,
        isP2P: true,
      };
      setMessages((prev) => [...prev, newMsg]);
      scrollToBottom();
    });

    webRTCManagerRef.current = manager;
    return manager;
  };

  const handleJoinRoom = async () => {
    if (!roomName.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const userNameForRoom = `User-${Date.now()}`;
      const manager = initializeWebRTC(userNameForRoom);

      const { roomId, participants: roomParticipants } = await manager.joinRoom(roomName);
      setCurrentRoom(roomId);
      setCurrentRoomName(roomName);
      setCurrentUserName(userNameForRoom);
      setParticipants(roomParticipants);
      setShowJoinModal(false);
      setRoomName('');
      
      // Load existing messages
      await loadMessages(roomId);
      
      // Start polling for new messages
      startMessagePolling(roomId);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRoom = async () => {
    if (!userName.trim() || !createRoomName.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const manager = initializeWebRTC(userName);

      const { roomId, participants: roomParticipants } = await manager.createRoom(createRoomName);
      setCurrentRoom(roomId);
      setCurrentRoomName(createRoomName);
      setCurrentUserName(userName);
      setParticipants(roomParticipants);
      setShowCreateForm(false);
      setUserName('');
      setCreateRoomName('');
      
      // Load existing messages
      await loadMessages(roomId);
      
      // Start polling for new messages
      startMessagePolling(roomId);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (roomId: string) => {
    try {
      const response = await fetch(`/api/messages?roomId=${roomId}`);
      if (response.ok) {
        const { messages } = await response.json();
        const dbMessages = (messages || []).map((msg: any) => ({
          ...msg,
          isP2P: false,
        }));
        setMessages(dbMessages);
        setLastMessageCheck(new Date());
        scrollToBottom();
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const startMessagePolling = (roomId: string) => {
    if (messagePollingInterval) {
      clearInterval(messagePollingInterval);
    }

    const interval = setInterval(async () => {
      await pollForNewMessages(roomId);
    }, 2000); // Poll every 2 seconds for new messages

    setMessagePollingInterval(interval);
  };

  const pollForNewMessages = async (roomId: string) => {
    try {
      const response = await fetch(`/api/messages?roomId=${roomId}&after=${lastMessageCheck.toISOString()}`);
      if (response.ok) {
        const { messages } = await response.json();
        if (messages && messages.length > 0) {
          const newDbMessages = messages.map((msg: any) => ({
            ...msg,
            isP2P: false,
          }));
          
          setMessages((prev) => {
            // Filter out duplicates based on content and timestamp
            const existingContents = new Set(prev.map(m => `${m.content}-${m.created_at}`));
            const uniqueNewMessages = newDbMessages.filter((msg: Message) => 
              !existingContents.has(`${msg.content}-${msg.created_at}`)
            );
            
            if (uniqueNewMessages.length > 0) {
              scrollToBottom();
              return [...prev, ...uniqueNewMessages];
            }
            return prev;
          });
          
          setLastMessageCheck(new Date());
        }
      }
    } catch (error) {
      console.error('Error polling for new messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentRoom || isSendingMessage) return;

    setIsSendingMessage(true);
    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX
    
    try {
      // Try to send via P2P first
      let sentViaP2P = false;
      if (webRTCManagerRef.current) {
        sentViaP2P = webRTCManagerRef.current.sendMessage(messageContent);
        
        if (sentViaP2P) {
          // Add message to local state immediately
          const p2pMessage: Message = {
            content: `${currentUserName}: ${messageContent}`,
            created_at: new Date().toISOString(),
            messageId: `local-${Date.now()}`,
            isP2P: true,
          };
          setMessages((prev) => [...prev, p2pMessage]);
          scrollToBottom();
        }
      }

      // Always save to database for persistence and non-connected users
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: currentRoom,
          userName: currentUserName,
          content: messageContent,
        }),
      });

      if (!response.ok && !sentViaP2P) {
        // If both P2P and database failed, show error and restore message
        setError('Failed to send message');
        setNewMessage(messageContent);
      }
    } catch (error) {
      if (!webRTCManagerRef.current?.sendMessage(messageContent)) {
        setError('Failed to send message');
        setNewMessage(messageContent);
      }
    } finally {
      setIsSendingMessage(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleLeaveRoom = async () => {
    if (messagePollingInterval) {
      clearInterval(messagePollingInterval);
      setMessagePollingInterval(null);
    }
    
    if (webRTCManagerRef.current) {
      await webRTCManagerRef.current.leaveRoom();
      setCurrentRoom(null);
      setCurrentRoomName('');
      setCurrentUserName('');
      setParticipants([]);
      setMessages([]);
      setIsConnected(false);
      setNewMessage('');
    }
  };

  useEffect(() => {
    return () => {
      if (messagePollingInterval) {
        clearInterval(messagePollingInterval);
      }
      if (webRTCManagerRef.current) {
        webRTCManagerRef.current.leaveRoom();
      }
    };
  }, [messagePollingInterval]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (currentRoom) {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">#{currentRoomName}</h1>
                <p className="text-gray-600">Welcome, {currentUserName}!</p>
                <p className="text-sm text-gray-500">
                  Status: <span className={`font-semibold ${isConnected ? 'text-green-600' : 'text-yellow-600'}`}>
                    {isConnected ? 'Connected' : 'Connecting...'}
                  </span>
                </p>
              </div>
              <button
                onClick={handleLeaveRoom}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
              >
                Leave Room
              </button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
              <p className="font-semibold">Error:</p>
              <p>{error}</p>
              <button 
                onClick={() => setError(null)}
                className="mt-2 text-sm underline hover:no-underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Chat Interface */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
            {/* Messages Area */}
            <div className="lg:col-span-3 bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b">
                <h3 className="font-semibold text-gray-800">Messages</h3>
              </div>
              
              {/* Messages List */}
              <div className="h-96 overflow-y-auto p-4 space-y-3">
                {messages.map((message, index) => (
                  <div key={message.id || message.messageId || index} className="flex flex-col">
                    <div className={`rounded-lg p-3 ${message.isP2P ? 'bg-blue-50 border border-blue-200' : 'bg-gray-100'}`}>
                      <p className="text-gray-800">{message.content}</p>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-gray-500">
                          {new Date(message.created_at).toLocaleTimeString()}
                        </p>
                        {message.isP2P && (
                          <span className="text-xs text-blue-600 font-medium">P2P</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {messages.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Message Input */}
              <div className="border-t p-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isSendingMessage}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={isSendingMessage || !newMessage.trim()}
                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold px-4 py-2 rounded-lg transition duration-300"
                  >
                    {isSendingMessage ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </div>
            </div>

            {/* Participants Sidebar */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b">
                <h3 className="font-semibold text-gray-800">
                  Participants ({participants.length})
                </h3>
              </div>
              <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg"
                  >
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {participant.user_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {participant.user_name}
                        {participant.user_name === currentUserName && ' (You)'}
                      </p>
                      <p className={`text-xs ${
                        participant.is_connected ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {participant.is_connected ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>
                ))}
                {participants.length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-4">
                    No participants
                  </p>
                )}
              </div>
            </div>
          </div>


        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          HelloWebRTC
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Test P2P connections with WebRTC
        </p>
        
        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            <p className="text-sm">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="mt-1 text-xs underline hover:no-underline"
            >
              Dismiss
            </button>
          </div>
        )}
        
        <div className="space-y-4">
          <button
            onClick={() => setShowJoinModal(true)}
            disabled={isLoading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold py-3 px-6 rounded-lg transition duration-300"
          >
            {isLoading ? 'Loading...' : 'Join a Room'}
          </button>
          
          <button
            onClick={() => setShowCreateForm(true)}
            disabled={isLoading}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-semibold py-3 px-6 rounded-lg transition duration-300"
          >
            {isLoading ? 'Loading...' : 'Create a Room'}
          </button>
        </div>
      </div>

      {/* Join Room Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm mx-4">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Join a Room</h2>
            <input
              type="text"
              placeholder="Enter room name"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
              disabled={isLoading}
            />
            <div className="flex space-x-3">
              <button
                onClick={handleJoinRoom}
                disabled={isLoading || !roomName.trim()}
                className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
              >
                {isLoading ? 'Joining...' : 'Join'}
              </button>
              <button
                onClick={() => {
                  setShowJoinModal(false);
                  setRoomName('');
                }}
                disabled={isLoading}
                className="flex-1 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Room Form */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm mx-4">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Create a Room</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User Name
                </label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={isLoading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room Name
                </label>
                <input
                  type="text"
                  placeholder="Enter room name"
                  value={createRoomName}
                  onChange={(e) => setCreateRoomName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleCreateRoom}
                disabled={isLoading || !userName.trim() || !createRoomName.trim()}
                className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
              >
                {isLoading ? 'Creating...' : 'Create Room'}
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setUserName('');
                  setCreateRoomName('');
                }}
                disabled={isLoading}
                className="flex-1 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

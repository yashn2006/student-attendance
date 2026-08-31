import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  Paperclip,
  Smile,
  CheckCheck,
  Search,
  Users,
  User,
  FileText
} from 'lucide-react';
import { mockChatThreads, mockChatMessages } from '../../data/mockData';
import { ChatMessage, ChatThread } from '../../types';

export const FacultyChatView: React.FC = () => {
  const [threads] = useState<ChatThread[]>(mockChatThreads);
  const [selectedThreadId, setSelectedThreadId] = useState<string>(mockChatThreads[0].id);
  const [messages, setMessages] = useState<ChatMessage[]>(mockChatMessages);
  const [newMessageText, setNewMessageText] = useState('');

  const activeThread = threads.find((t) => t.id === selectedThreadId) || threads[0];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;

    const myMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      senderId: 'fac_101',
      senderName: 'Dr. Robert Smith',
      senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      text: newMessageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMine: true
    };

    setMessages((prev) => [...prev, myMsg]);
    setNewMessageText('');

    // Simulated automated response after 2 seconds
    setTimeout(() => {
      const autoResp: ChatMessage = {
        id: 'msg_auto_' + Date.now(),
        senderId: 'fac_202',
        senderName: 'Prof. Desai',
        senderAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
        text: 'Received! I will verify the schedule and confirm back shortly.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMine: false
      };
      setMessages((prev) => [...prev, autoResp]);
    }, 2000);
  };

  return (
    <div className="space-y-6 pb-24 font-['Poppins',sans-serif]">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[640px]">
        {/* Left 1-Col: Channels & Direct Messages List */}
        <div className="glass-card rounded-3xl p-4 border border-slate-200/80 flex flex-col justify-between overflow-hidden">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900 font-['Plus_Jakarta_Sans']">
                Messages
              </h3>
              <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                4 Threads
              </span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search conversations..."
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-2 overflow-y-auto max-h-[480px] pr-1">
              {threads.map((thread) => (
                <div
                  key={thread.id}
                  onClick={() => setSelectedThreadId(thread.id)}
                  className={`p-3 rounded-2xl transition-all cursor-pointer border ${
                    selectedThreadId === thread.id
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                      : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={thread.avatar}
                      alt={thread.name}
                      className="w-10 h-10 rounded-xl object-cover ring-2 ring-white"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs truncate">{thread.name}</h4>
                        <span className="text-[10px] opacity-70 shrink-0">{thread.lastTime}</span>
                      </div>
                      <p className="text-[11px] opacity-80 truncate mt-0.5">{thread.lastMessage}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 2-Cols: Active Chat Room */}
        <div className="md:col-span-2 glass-card rounded-3xl p-5 border border-slate-200/80 flex flex-col justify-between h-full">
          {/* Chat Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <img
                src={activeThread.avatar}
                alt={activeThread.name}
                className="w-10 h-10 rounded-xl object-cover ring-2 ring-indigo-500/30"
              />
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">{activeThread.name}</h3>
                <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {activeThread.membersCount
                    ? `${activeThread.membersCount} Members • ${activeThread.onlineCount} Online`
                    : 'Active Now'}
                </p>
              </div>
            </div>
          </div>

          {/* Chat Messages Feed */}
          <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[80%] ${msg.isMine ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {!msg.isMine && (
                  <img src={msg.senderAvatar} alt={msg.senderName} className="w-8 h-8 rounded-xl object-cover shrink-0" />
                )}

                <div
                  className={`p-3.5 rounded-2xl text-xs space-y-1 ${
                    msg.isMine
                      ? 'bg-indigo-600 text-white rounded-br-xs shadow-md shadow-indigo-600/20'
                      : 'bg-slate-100 text-slate-800 rounded-bl-xs'
                  }`}
                >
                  {!msg.isMine && (
                    <span className="block font-bold text-[10px] text-indigo-700">{msg.senderName}</span>
                  )}
                  <p className="leading-relaxed font-medium">{msg.text}</p>

                  {msg.attachment && (
                    <div className="mt-2 p-2 rounded-xl bg-white/20 border border-white/30 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span className="font-bold truncate">{msg.attachment.name}</span>
                    </div>
                  )}

                  <span className="block text-[9px] opacity-70 text-right mt-1">{msg.timestamp}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Message Input Box */}
          <form onSubmit={handleSendMessage} className="pt-3 border-t border-slate-100 flex items-center gap-2">
            <button type="button" className="p-2 text-slate-400 hover:text-slate-600 rounded-xl bg-slate-100">
              <Paperclip className="w-4 h-4" />
            </button>

            <input
              type="text"
              placeholder="Write a message..."
              value={newMessageText}
              onChange={(e) => setNewMessageText(e.target.value)}
              className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <button
              type="submit"
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/20 flex items-center gap-1"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

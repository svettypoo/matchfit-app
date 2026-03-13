'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '../../../components/BottomNav';

export default function MessagesPage() {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const userId = useRef(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('mf_user') || '{}');
    userId.current = user.id;
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadMessages() {
    const user = JSON.parse(localStorage.getItem('mf_user') || '{}');
    try {
      const res = await fetch(`/api/players/${user.id}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim()) return;
    setSending(true);
    const user = JSON.parse(localStorage.getItem('mf_user') || '{}');
    try {
      const res = await fetch(`/api/players/${user.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: input.trim() }),
      });
      if (res.ok) {
        setInput('');
        loadMessages();
      }
    } catch (err) {
      console.error(err);
    }
    setSending(false);
  }

  function formatTime(dateStr) {
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  let lastDate = '';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold">C</div>
        <div>
          <h1 className="font-bold text-sm text-gray-900">Coach</h1>
          <p className="text-xs text-gray-400">Messages</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-20 space-y-1">
        {loading ? (
          <div className="text-center py-12">
            <svg className="animate-spin h-8 w-8 text-green-600 mx-auto mb-2" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" /></svg>
            <p className="text-gray-500">No messages yet</p>
            <p className="text-gray-400 text-sm">Send a message to your coach</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const dateLabel = formatDate(msg.created_at);
            const showDate = dateLabel !== lastDate;
            lastDate = dateLabel;
            const isPlayer = msg.sender_id === userId.current;
            return (
              <div key={msg.id || i}>
                {showDate && (
                  <div className="text-center my-3">
                    <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">{dateLabel}</span>
                  </div>
                )}
                <div className={`flex ${isPlayer ? 'justify-end' : 'justify-start'} mb-1`}>
                  <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                    isPlayer
                      ? 'bg-green-600 text-white rounded-br-md'
                      : 'bg-white text-gray-900 rounded-bl-md shadow-sm border border-gray-100'
                  }`}>
                    <p className="text-sm">{msg.content}</p>
                    <p className={`text-xs mt-1 ${isPlayer ? 'text-green-200' : 'text-gray-400'}`}>
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-3">
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-full focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm"
            placeholder="Type a message..."
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}

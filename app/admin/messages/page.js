'use client';

import { useState, useEffect, useRef } from 'react';

export default function CoachMessagesPage() {
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const messagesEndRef = useRef(null);
  const coachId = useRef(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('mf_user') || '{}');
    coachId.current = user.id;
    loadPlayers();
  }, []);

  useEffect(() => {
    if (selectedPlayer) loadMessages(selectedPlayer.id);
  }, [selectedPlayer]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadPlayers() {
    const user = JSON.parse(localStorage.getItem('mf_user') || '{}');
    try {
      const res = await fetch(`/api/coach/players?coach_id=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setPlayers(data.players || []);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  async function loadMessages(playerId) {
    try {
      const res = await fetch(`/api/coach/messages/${playerId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim() || !selectedPlayer) return;
    setSending(true);
    try {
      await fetch(`/api/coach/messages/${selectedPlayer.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: input.trim(), sender_id: coachId.current }),
      });
      setInput('');
      loadMessages(selectedPlayer.id);
    } catch (err) {
      console.error(err);
    }
    setSending(false);
  }

  async function sendAnnouncement() {
    if (!announcement.trim()) return;
    try {
      await fetch('/api/coach/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: announcement.trim(), coach_id: coachId.current }),
      });
      setAnnouncement('');
      setShowAnnouncement(false);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-4">
      {/* Player List */}
      <div className="lg:w-72 flex-shrink-0 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        <div className="p-3 border-b">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900 text-sm">Players</h3>
            <button onClick={() => setShowAnnouncement(true)}
              className="text-xs bg-green-600 text-white px-2 py-1 rounded-md font-medium hover:bg-green-700">
              Announce
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8"><svg className="animate-spin h-6 w-6 text-green-600 mx-auto" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>
          ) : players.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">No players</p>
          ) : (
            players.map(p => (
              <button key={p.id} onClick={() => setSelectedPlayer(p)}
                className={`w-full px-3 py-3 flex items-center gap-3 border-b border-gray-50 hover:bg-gray-50 transition-all ${
                  selectedPlayer?.id === p.id ? 'bg-green-50' : ''
                }`}>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm">
                  {p.name?.[0]}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{p.name}</div>
                  <div className="text-xs text-gray-400">{p.position || 'Player'}</div>
                </div>
                {p.unread > 0 && (
                  <span className="w-5 h-5 bg-green-500 text-white text-xs rounded-full flex items-center justify-center">{p.unread}</span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        {!selectedPlayer ? (
          <div className="flex-1 flex items-center justify-center text-center p-8">
            <div>
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" /></svg>
              <h3 className="font-semibold text-gray-900 mb-1">Select a player</h3>
              <p className="text-gray-500 text-sm">Choose a player from the list to start messaging</p>
            </div>
          </div>
        ) : (
          <>
            <div className="px-4 py-3 border-b flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm">
                {selectedPlayer.name?.[0]}
              </div>
              <div>
                <div className="font-semibold text-sm text-gray-900">{selectedPlayer.name}</div>
                <div className="text-xs text-gray-400">{selectedPlayer.position || 'Player'}</div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-8">No messages yet. Send the first one!</p>
              ) : (
                messages.map((msg, i) => {
                  const isCoach = msg.sender_id === coachId.current;
                  return (
                    <div key={msg.id || i} className={`flex ${isCoach ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                        isCoach ? 'bg-green-600 text-white rounded-br-md' : 'bg-gray-100 text-gray-900 rounded-bl-md'
                      }`}>
                        <p className="text-sm">{msg.content}</p>
                        <p className={`text-xs mt-1 ${isCoach ? 'text-green-200' : 'text-gray-400'}`}>
                          {new Date(msg.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={sendMessage} className="p-3 border-t flex gap-2">
              <input type="text" value={input} onChange={e => setInput(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-green-500 outline-none text-sm"
                placeholder="Type a message..." />
              <button type="submit" disabled={!input.trim() || sending}
                className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white disabled:opacity-50">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
              </button>
            </form>
          </>
        )}
      </div>

      {/* Announcement Modal */}
      {showAnnouncement && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="font-bold text-gray-900 mb-3">Team Announcement</h3>
            <p className="text-sm text-gray-500 mb-3">This message will be sent to all players.</p>
            <textarea value={announcement} onChange={e => setAnnouncement(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none resize-none h-32"
              placeholder="Type your announcement..." />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowAnnouncement(false)} className="flex-1 py-2 bg-gray-100 rounded-lg font-medium">Cancel</button>
              <button onClick={sendAnnouncement} className="flex-1 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700">
                Send to All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

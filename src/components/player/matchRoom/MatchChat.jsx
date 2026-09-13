import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { playerDbService } from '../../../services/playerDbService';

export function MatchChat({ matchId, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  const matchRoomId = `match_${matchId}`;

  useEffect(() => {
    const unsub = playerDbService.subscribeMatchMessages(matchRoomId, (msgs) => {
      setMessages(msgs || []);
    });
    return () => unsub();
  }, [matchRoomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || isSending) return;
    const msgText = text.trim();
    setText('');
    setIsSending(true);

    try {
      await playerDbService.sendMatchMessage(matchRoomId, {
        senderId: currentUser.uid,
        senderName: currentUser.name,
        senderAvatar: currentUser.avatar,
        text: msgText
      });
    } catch (err) {
      console.error('Mesaj gönderme hatası:', err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-[420px] sm:h-[480px] flex-col rounded-3xl border border-white/5 bg-[#0C0F17] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3 bg-[#111420]">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-[#8eff71]" />
          <span className="font-montserrat text-xs font-bold text-white">Maç Odası Sohbeti</span>
        </div>
        <span className="text-[10px] text-white/40">{messages.length} mesaj</span>
      </div>

      {/* Messages List Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-white/30">
            <MessageSquare className="h-8 w-8 mb-2 stroke-1" />
            <p className="text-xs font-semibold">Henüz mesaj yazılmadı.</p>
            <p className="text-[10px] text-white/20 mt-0.5">Takım arkadaşlarına merhaba de!</p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.senderId === currentUser.uid;
            return (
              <div
                key={m.id}
                className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <img
                  src={m.senderAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                  alt={m.senderName || 'Oyuncu'}
                  className="h-7 w-7 rounded-lg object-cover ring-1 ring-white/10 shrink-0"
                />
                <div className={`max-w-[75%] ${isMe ? 'items-end text-right' : 'items-start text-left'}`}>
                  <span className="text-[9px] font-bold text-white/40 block mb-0.5 px-1">
                    {m.senderName || 'Oyuncu'}
                  </span>
                  <div
                    className={`rounded-2xl px-3.5 py-2 text-xs font-medium leading-relaxed ${
                      isMe
                        ? 'bg-[#8eff71] text-[#064200] rounded-tr-none font-semibold'
                        : 'bg-[#191E2C] text-white rounded-tl-none'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Box */}
      <form onSubmit={handleSend} className="border-t border-white/5 p-3 bg-[#111420] flex items-center gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Takıma mesaj yaz..."
          className="flex-1 rounded-xl border border-white/5 bg-[#171B26] px-3.5 py-2.5 text-xs text-white placeholder:text-white/30 focus:border-[#8eff71]/40 focus:outline-none transition"
        />
        <button
          type="submit"
          disabled={!text.trim() || isSending}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#8eff71] text-[#064200] shadow-[0_0_15px_rgba(142,255,113,0.2)] hover:brightness-110 disabled:opacity-40 transition"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Share2, 
  MapPin, 
  Clock, 
  Users, 
  MessageSquare, 
  CreditCard, 
  Shield, 
  ExternalLink,
  Check
} from 'lucide-react';
import { InteractivePitch } from './InteractivePitch';
import { MatchChat } from './MatchChat';
import { PaymentBreakdown } from './PaymentBreakdown';
import { playerDbService } from '../../../services/playerDbService';
import { usePlayerAuth } from '../../../context/PlayerAuthContext';

export function MatchRoomModal({ matchId, isOpen, onClose }) {
  const { currentUser } = usePlayerAuth();
  const [matchData, setMatchData] = useState(null);
  const [activeTab, setActiveTab] = useState('pitch'); // 'pitch' | 'chat' | 'payment'
  const [copied, setCopied] = useState(false);
  const [loadingSlot, setLoadingSlot] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Subscribe to real-time match data
  useEffect(() => {
    if (!matchId || !isOpen) return;
    const unsub = playerDbService.subscribeMatch(matchId, (data) => {
      if (data) setMatchData(data);
    });
    return () => unsub();
  }, [matchId, isOpen]);

  if (!isOpen) return null;

  const match = matchData || {
    id: matchId,
    arena: 'Beşiktaş Arena',
    city: 'İstanbul',
    district: 'Beşiktaş',
    dateTime: 'Bugün, 21:00',
    mode: '7v7',
    fee: 150,
    totalFee: 2100,
    joinedPlayersCount: 1,
    totalRequiredPlayers: 14,
    slots: {}
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoinSlot = async (slotKey, slotLabel) => {
    setLoadingSlot(slotKey);
    setErrorMessage('');
    try {
      await playerDbService.joinMatchSlot(match.id, slotKey, {
        uid: currentUser.uid,
        name: currentUser.name,
        avatar: currentUser.avatar,
        position: slotLabel
      });
    } catch (err) {
      setErrorMessage(err.message || 'Mevkiye katılırken bir sorun oluştu.');
    } finally {
      setLoadingSlot(null);
    }
  };

  const handleLeaveSlot = async (slotKey) => {
    setLoadingSlot(slotKey);
    setErrorMessage('');
    try {
      await playerDbService.leaveMatchSlot(match.id, slotKey, currentUser.uid);
    } catch (err) {
      setErrorMessage(err.message || 'Mevkiden ayrılırken bir sorun oluştu.');
    } finally {
      setLoadingSlot(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/85 p-2 sm:p-4 backdrop-blur-md">
      <div className="relative flex h-[94vh] max-h-[900px] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#090C14] shadow-2xl">
        {/* ─── MODAL HEADER ─── */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/5 bg-[#10131E] px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8eff71]/15 text-[#8eff71]">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-montserrat text-base sm:text-lg font-black text-white">
                  {match.arena}
                </h2>
                <span className="rounded bg-[#8eff71]/20 px-2 py-0.5 text-[10px] font-black text-[#8eff71]">
                  {match.mode || '7v7'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-white/50 mt-0.5">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-[#8eff71]" />
                  {match.dateTime}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {match.city}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white hover:bg-white/10 transition"
            >
              {copied ? <Check className="h-4 w-4 text-[#8eff71]" /> : <Share2 className="h-4 w-4" />}
              <span className="hidden sm:inline">{copied ? 'Kopyalandı!' : 'Maçı Paylaş'}</span>
            </button>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Error notification banner */}
        {errorMessage && (
          <div className="bg-[#ff7351]/15 border-b border-[#ff7351]/30 px-4 py-2 text-xs font-bold text-[#ff7351] text-center">
            {errorMessage}
          </div>
        )}

        {/* ─── TAB SWITCHER ─── */}
        <div className="flex shrink-0 border-b border-white/5 bg-[#0D101A] px-4 sm:px-6">
          <button
            onClick={() => setActiveTab('pitch')}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-black uppercase tracking-wider transition ${
              activeTab === 'pitch'
                ? 'border-[#8eff71] text-[#8eff71]'
                : 'border-transparent text-white/40 hover:text-white'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Kadro & Saha</span>
            <span className="rounded-full bg-white/10 px-1.5 py-0.2 text-[9px]">
              {match.joinedPlayersCount || 0}/{match.totalRequiredPlayers || 14}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-black uppercase tracking-wider transition ${
              activeTab === 'chat'
                ? 'border-[#8eff71] text-[#8eff71]'
                : 'border-transparent text-white/40 hover:text-white'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Maç Sohbeti</span>
          </button>

          <button
            onClick={() => setActiveTab('payment')}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-black uppercase tracking-wider transition ${
              activeTab === 'payment'
                ? 'border-[#8eff71] text-[#8eff71]'
                : 'border-transparent text-white/40 hover:text-white'
            }`}
          >
            <CreditCard className="h-4 w-4" />
            <span>Ödeme & Masraf</span>
          </button>
        </div>

        {/* ─── TAB BODY CONTENT ─── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#070A10]">
          {activeTab === 'pitch' && (
            <InteractivePitch
              match={match}
              currentUser={currentUser}
              onJoinSlot={handleJoinSlot}
              onLeaveSlot={handleLeaveSlot}
              loadingSlot={loadingSlot}
            />
          )}

          {activeTab === 'chat' && (
            <MatchChat
              matchId={match.id}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'payment' && (
            <PaymentBreakdown
              match={match}
              currentUser={currentUser}
            />
          )}
        </div>
      </div>
    </div>
  );
}

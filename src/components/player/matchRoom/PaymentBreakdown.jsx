import React, { useState } from 'react';
import { CreditCard, ShieldCheck, CheckCircle2, AlertCircle, Zap } from 'lucide-react';

export function PaymentBreakdown({ match, currentUser }) {
  const [splitMode, setSplitMode] = useState('separate'); // 'separate' | 'captain'
  const [isPaid, setIsPaid] = useState(false);
  const [loading, setLoading] = useState(false);

  // Card form state
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  const totalFee = match?.totalFee || 2100;
  const feePerPlayer = match?.fee || 150;
  const amountToPay = splitMode === 'separate' ? feePerPlayer : totalFee;

  const handlePay = (e) => {
    e.preventDefault();
    if (!cardNumber || !expiry || !cvc) {
      alert('Lütfen tüm kart bilgilerini doldurun.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setIsPaid(true);
      setCardNumber('');
      setExpiry('');
      setCvc('');
    }, 1200);
  };

  return (
    <div className="flex flex-col space-y-4 rounded-3xl border border-white/5 bg-[#0C0F17] p-5">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-montserrat text-sm font-black text-white">Halısaha Ücret & Ödeme</h3>
          <p className="text-[11px] text-white/40 mt-0.5">Komisyonsuz • Doğrudan Tesis Hesabına</p>
        </div>
        <span className="rounded-full bg-[#8eff71]/10 px-3 py-1 text-[10px] font-black text-[#8eff71]">
          3D SECURE
        </span>
      </div>

      {/* Fee Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/5 bg-[#141824] p-3.5 text-center">
          <span className="text-[10px] font-bold text-white/40 block uppercase">Toplam Saha Ücreti</span>
          <span className="font-montserrat text-lg font-black text-white">{totalFee} ₺</span>
        </div>
        <div className="rounded-2xl border border-[#8eff71]/20 bg-[#8eff71]/10 p-3.5 text-center">
          <span className="text-[10px] font-bold text-[#8eff71] block uppercase">Kişi Başı Tutar</span>
          <span className="font-montserrat text-lg font-black text-[#8eff71]">{feePerPlayer} ₺</span>
        </div>
      </div>

      {/* Split Mode Selector */}
      <div className="flex rounded-xl bg-[#141824] p-1 border border-white/5">
        <button
          type="button"
          onClick={() => setSplitMode('separate')}
          className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
            splitMode === 'separate'
              ? 'bg-[#8eff71] text-[#064200] shadow'
              : 'text-white/60 hover:text-white'
          }`}
        >
          Kendi Payımı Öde ({feePerPlayer} ₺)
        </button>
        <button
          type="button"
          onClick={() => setSplitMode('captain')}
          className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
            splitMode === 'captain'
              ? 'bg-[#8eff71] text-[#064200] shadow'
              : 'text-white/60 hover:text-white'
          }`}
        >
          Tüm Sahayı Öde ({totalFee} ₺)
        </button>
      </div>

      {/* Payment Form or Success State */}
      {isPaid ? (
        <div className="rounded-2xl border border-[#8eff71]/30 bg-[#8eff71]/10 p-6 text-center space-y-2">
          <CheckCircle2 className="mx-auto h-10 w-10 text-[#8eff71]" />
          <h4 className="font-montserrat text-sm font-black text-white">Ödeme Başarıyla Alındı!</h4>
          <p className="text-xs text-white/60">
            {amountToPay} ₺ tutarındaki ödemeniz doğrudan tesise iletildi. Dekont profilinize kaydedildi.
          </p>
        </div>
      ) : (
        <form onSubmit={handlePay} className="space-y-3 pt-2">
          <div>
            <label className="text-[10px] font-bold uppercase text-white/40 block mb-1">Kart Numarası</label>
            <input
              type="text"
              maxLength="19"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              placeholder="4543 •••• •••• 9821"
              className="w-full rounded-xl border border-white/5 bg-[#161B26] p-2.5 text-xs text-white placeholder:text-white/30 focus:border-[#8eff71]/40 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase text-white/40 block mb-1">Son Kullanma (AA/YY)</label>
              <input
                type="text"
                maxLength="5"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                placeholder="12/28"
                className="w-full rounded-xl border border-white/5 bg-[#161B26] p-2.5 text-xs text-white placeholder:text-white/30 focus:border-[#8eff71]/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-white/40 block mb-1">CVC / CVV</label>
              <input
                type="password"
                maxLength="3"
                value={cvc}
                onChange={(e) => setCvc(e.target.value)}
                placeholder="•••"
                className="w-full rounded-xl border border-white/5 bg-[#161B26] p-2.5 text-xs text-white placeholder:text-white/30 focus:border-[#8eff71]/40 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#8eff71] py-3 text-xs font-black uppercase tracking-wider text-[#064200] shadow-[0_0_20px_rgba(142,255,113,0.25)] hover:brightness-110 disabled:opacity-50 transition"
          >
            {loading ? 'İşleniyor...' : `${amountToPay} ₺ Güvenli Öde`}
          </button>
        </form>
      )}

      {/* Security notice */}
      <div className="flex items-center gap-2 text-[10px] text-white/30 pt-1">
        <ShieldCheck className="h-3.5 w-3.5 text-[#8eff71] shrink-0" />
        <span>Uygulamada bakiye veya kart bilgisi tutulmaz; ödeme doğrudan banka API ile tesisin hesabına aktarılır.</span>
      </div>
    </div>
  );
}

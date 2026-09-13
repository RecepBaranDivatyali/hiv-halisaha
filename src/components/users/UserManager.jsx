import React, { useState } from 'react';
import { Users, Search, Star, Shield, ArrowUpRight, Ban, CheckCircle2 } from 'lucide-react';
import { UserDetailModal } from './UserDetailModal';

export function UserManager({ users = [], onRefresh }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [search, setSearch] = useState('');
  const [posFilter, setPosFilter] = useState('all');

  const filteredUsers = users.filter((u) => {
    const matchesPos = posFilter === 'all' || u.position === posFilter;
    const matchesSearch =
      !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.city?.toLowerCase().includes(search.toLowerCase());

    return matchesPos && matchesSearch;
  });

  return (
    <div className="space-y-6 p-8">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-montserrat text-2xl font-black tracking-tight text-white">OYUNCULAR & ÜYELER</h2>
          <p className="text-xs text-white/50">Kayıtlı futbolcu profillerini, mevkilerini ve güvenilirlik puanlarını yönetin</p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col gap-4 rounded-2xl border border-white/5 bg-[#12141C] p-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Position Tabs */}
        <div className="flex flex-wrap gap-2">
          {['all', 'Kaleci', 'Defans', 'Orta Saha', 'Forvet'].map((pos) => (
            <button
              key={pos}
              onClick={() => setPosFilter(pos)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                posFilter === pos
                  ? 'bg-[#8eff71] text-[#064200]'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              {pos === 'all' ? 'Tüm Mevkiler' : pos}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="İsim, e-posta veya şehir..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full sm:w-64 rounded-xl border border-white/5 bg-[#171A24] pl-10 pr-4 text-xs font-medium text-white placeholder:text-white/40 focus:border-[#8eff71]/40 focus:outline-none"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#12141C]/90 backdrop-blur-xl">
        {filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Users className="h-12 w-12 text-white/20" />
            <p className="mt-3 text-sm font-bold text-white/60">Kullanıcı bulunamadı</p>
            <p className="text-xs text-white/40">Arama kriterlerinizi değiştirebilirsiniz.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/5 bg-white/[0.02] text-[10px] font-black uppercase tracking-wider text-white/40">
                <tr>
                  <th className="px-6 py-4">Oyuncu</th>
                  <th className="px-6 py-4">Mevki</th>
                  <th className="px-6 py-4">Şehir</th>
                  <th className="px-6 py-4">Rating</th>
                  <th className="px-6 py-4">Güvenilirlik</th>
                  <th className="px-6 py-4">Durum</th>
                  <th className="px-6 py-4 text-right">İncele</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map((u) => (
                  <tr
                    key={u.id || u.uid}
                    onClick={() => setSelectedUser(u)}
                    className="cursor-pointer transition hover:bg-white/5"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                          alt={u.name}
                          className="h-9 w-9 rounded-xl border border-white/10 object-cover"
                        />
                        <div>
                          <div className="font-bold text-white">{u.name || 'İsimsiz Sporcu'}</div>
                          <div className="text-[10px] text-white/40">{u.email || 'E-posta yok'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-lg bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white/80">
                        {u.position || 'Orta Saha'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white/70 font-medium">{u.city || 'İstanbul'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 font-bold text-[#8eff71]">
                        <Star className="h-3.5 w-3.5 fill-[#8eff71]" />
                        <span>{(u.rating || 5.0).toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">%{u.trustScore || 98}</span>
                        <div className="h-1.5 w-12 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full bg-[#8eff71]"
                            style={{ width: `${u.trustScore || 98}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {u.isBanned ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-[#ff7351]/20 px-2 py-0.5 text-[10px] font-extrabold uppercase text-[#ff7351]">
                          <Ban className="h-3 w-3" />
                          Engelli
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-[#8eff71]/20 px-2 py-0.5 text-[10px] font-extrabold uppercase text-[#8eff71]">
                          <CheckCircle2 className="h-3 w-3" />
                          Aktif
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition">
                        <ArrowUpRight className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <UserDetailModal
        user={selectedUser}
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        onUpdate={onRefresh}
      />
    </div>
  );
}

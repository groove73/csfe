'use client';

import { useEffect, useState } from 'react';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { API_BASE_URL } from '@/lib/api';

interface StationDetailProps {
    station: any;
    onClose: () => void;
}

export function StationDetail({ station, onClose }: StationDetailProps) {
    const { user, guestToken } = useAuth();
    const [chargers, setChargers] = useState<any[]>(station.chargers || []);
    const [loading, setLoading] = useState(true);

    const mergeChargerData = (realTimeData: any[]) => {
        const metaChargers = station.chargers || [];
        const rtMap = new Map((realTimeData || []).map(rt => [rt.chgerId, rt]));

        return metaChargers.map((meta: any) => {
            const rt = rtMap.get(meta.chgerId) || {};
            return {
                ...meta,
                ...rt,
                chgerTypeNm: rt.chgerTypeNm && rt.chgerTypeNm !== '기타' ? rt.chgerTypeNm : (meta.chgerTypeNm || rt.chgerTypeNm || '기타'),
                statNm: rt.statNm || meta.statNm || '상태미확인',
                stat: rt.stat || meta.stat || '0',
                output: rt.output || meta.output,
                method: rt.method || meta.method,
                location: (rt.location && rt.location !== 'null' ? rt.location : null) || (meta.location && meta.location !== 'null' ? meta.location : null),
                limitYn: rt.limitYn || meta.limitYn || 'N',
                limitDetail: rt.limitDetail || meta.limitDetail || ''
            };
        });
    };

    const fetchChargerStatus = async () => {
        setLoading(true);
        try {
            const headers: Record<string, string> = {};
            if (user) {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
            } else if (guestToken) {
                headers['Authorization'] = `Bearer ${guestToken}`;
            }

            const res = await fetch(`${API_BASE_URL}/api/stations/${station.statId}/chargers`, { headers });
            if (!res.ok) throw new Error('Fetch failed');
            const realTimeData = await res.json();
            setChargers(mergeChargerData(realTimeData));
        } catch (err) {
            console.error('Error fetching charger status:', err);
            setChargers(mergeChargerData([]));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!station) return;
        fetchChargerStatus();
        const interval = setInterval(fetchChargerStatus, 60000);
        return () => clearInterval(interval);
    }, [station]);

    const getStatColor = (stat: string) => {
        switch (stat) {
            case '1': return 'bg-red-500/10 text-red-500 border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.1)]';
            case '2': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.1)]';
            case '3': return 'bg-blue-500/10 text-blue-500 border-blue-500/40 shadow-[0_0_12px_rgba(59,130,246,0.1)]';
            case '4': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
            case '5': return 'bg-orange-500/10 text-orange-500 border-orange-500/40 shadow-[0_0_12px_rgba(249,115,22,0.1)]';
            default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#0a0f1d] border-l border-slate-800 shadow-2xl animate-in slide-in-from-right duration-300">
            <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-4 pt-6 bg-slate-900/40 sticky top-0 z-10 backdrop-blur-xl">
                <div className="flex-1 min-w-0 pr-4">
                    <CardTitle className="text-xl font-black text-white tracking-tight leading-tight">{station.statNm}</CardTitle>
                    <div className="flex items-center gap-2 mt-1.5">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,1)]"></span>
                        <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em] opacity-80">
                            {station.busiNm}
                        </p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="group rounded-xl flex-shrink-0 bg-white/5 hover:bg-red-500 border border-white/5 hover:border-red-400 transition-all duration-300 w-10 h-10"
                >
                    <span className="text-slate-400 group-hover:text-white font-bold text-lg transition-colors">✕</span>
                </Button>
            </CardHeader>

            <ScrollArea className="flex-1">
                <div className="p-6 space-y-6 pb-20">
                    <section>
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2.5">
                            <span className="w-1 h-3.5 bg-blue-500 rounded-full"></span>
                            LOCATION INFO
                        </h3>
                        <div className="space-y-4 bg-[#161e31]/40 p-6 rounded-[2rem] border border-white/5 shadow-xl backdrop-blur-sm">
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest opacity-60">STATION NAME</p>
                                    <p className="text-base text-white font-black drop-shadow-sm">{station.statNm}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest opacity-60">ADDRESS</p>
                                    <p className="text-[13px] text-slate-300 leading-snug font-bold">
                                        {station.addr} {station.addrDetail && station.addrDetail !== 'null' ? station.addrDetail : ''}
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6 border-t border-white/5 pt-4">
                                <div className="space-y-1">
                                    <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest opacity-60">AGENCY</p>
                                    <p className="text-[13px] text-white font-black">{station.bnm || '-'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest opacity-60">CONTACT</p>
                                    <p className="text-[13px] text-blue-400 font-black tracking-tighter">{station.busiCall || '-'}</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2.5">
                            <span className="w-1 h-3.5 bg-blue-500 rounded-full"></span>
                            FACILITY INFO
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-[#161e31]/40 rounded-3xl border border-white/5 text-center shadow-lg">
                                <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest opacity-60 mb-2">USE TIME</p>
                                <p className="text-[13px] font-black text-white">{station.useTime || '-'}</p>
                            </div>
                            <div className={`p-4 rounded-3xl border transition-all duration-500 text-center shadow-lg ${station.parkingFree === 'Y'
                                ? 'bg-emerald-500/5 border-emerald-500/20'
                                : 'bg-[#161e31]/40 border-white/5 opacity-80'
                                }`}>
                                <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest opacity-60 mb-2">PARKING</p>
                                <p className={`text-[13px] font-black ${station.parkingFree === 'Y' ? 'text-emerald-400' : 'text-slate-300'}`}>
                                    {station.parkingFree === 'Y' ? 'FREE' : 'PAID'}
                                </p>
                            </div>
                        </div>
                        {station.note && station.note !== 'null' && (
                            <div className="mt-4 p-4 bg-amber-500/10 text-amber-100 text-[11px] rounded-2xl border border-amber-500/20 font-bold leading-normal shadow-inner">
                                <div className="flex gap-3">
                                    <span className="flex-shrink-0">📝</span>
                                    <span>{station.note}</span>
                                </div>
                            </div>
                        )}
                    </section>

                    <section>
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.35em] flex items-center gap-3">
                                <span className="w-2 h-5 bg-blue-500 rounded-sm shadow-[0_0_15px_rgba(59,130,246,0.5)]"></span>
                                REAL-TIME STATUS
                            </h3>
                            <div className="flex items-center gap-3">
                                {loading && (
                                    <div className="flex items-center gap-2 px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full animate-in fade-in duration-500">
                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping"></div>
                                        <span className="text-[9px] font-black text-blue-500 tracking-tight">SYNCING</span>
                                    </div>
                                )}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={fetchChargerStatus}
                                    className="h-8 px-4 text-[10px] font-black bg-white/5 hover:bg-blue-600 text-blue-100 tracking-wider border border-white/10 hover:border-blue-400 rounded-xl transition-all active:scale-95"
                                >
                                    REFRESH
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {chargers && chargers.length > 0 ? (
                                chargers.map((charger: any) => {
                                    const statColor = getStatColor(charger.stat);
                                    const isRestricted = charger.limitYn === 'Y';
                                    return (
                                        <div key={charger.chgerId} className="group relative p-5 bg-[#161e31]/30 border border-white/5 rounded-[2rem] hover:border-blue-500/30 hover:bg-[#161e31]/50 transition-all duration-500 shadow-xl overflow-hidden">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-mono text-[11px] bg-white/10 text-blue-300 px-3 py-1.5 rounded-lg font-black border border-white/10">#{charger.chgerId}</span>
                                                    <span className="text-base font-black text-white drop-shadow-sm">{charger.chgerTypeNm}</span>
                                                </div>
                                                <Badge variant="outline" className={`${statColor} font-black px-4 py-1.5 text-[10px] rounded-xl whitespace-nowrap tracking-tight`}>
                                                    {charger.statNm}
                                                </Badge>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex items-end justify-between gap-4">
                                                    <div className="space-y-3 flex-1">
                                                        <div className="flex items-center gap-3">
                                                            {charger.output && <span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-xl border border-blue-500/20 text-[11px] font-black">{charger.output}kW</span>}
                                                            {charger.method && <span className="text-white font-black text-[13px] px-3 border-l-2 border-slate-700/50">{charger.method}</span>}
                                                        </div>
                                                        {charger.location && charger.location !== 'null' && (
                                                            <div className="text-[11px] text-slate-300 font-bold flex items-center gap-2.5 bg-white/5 p-2.5 rounded-xl border border-white/5">
                                                                <span className="text-blue-500">📍</span>
                                                                {charger.location}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className={`flex flex-col items-center justify-center px-4 py-2 rounded-2xl border transition-all duration-500 min-w-[120px] ${isRestricted
                                                        ? 'bg-red-500/15 border-red-500/40 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                                                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)]'}`}>
                                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] mb-1 opacity-80">{isRestricted ? 'Restricted' : 'Open Access'}</span>
                                                        <p className="text-[12px] font-black text-center leading-tight">
                                                            {charger.limitDetail || (isRestricted ? 'Restriction applied' : 'No restrictions')}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">LAST SYNC</span>
                                                        <span className="text-[12px] text-slate-300 font-black tabular-nums opacity-90 tracking-tight">
                                                            {charger.statUpdDt?.replace(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1-$2-$3 $4:$5')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 bg-[#161e31]/30 rounded-[3rem] border border-dashed border-white/5 gap-6">
                                    <div className="text-6xl opacity-10 animate-pulse">⚡</div>
                                    <div className="text-center space-y-2">
                                        <p className="text-lg font-black text-white">Searching Chargers</p>
                                        <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase opacity-70">Securing data stream...</p>
                                    </div>
                                    <Button onClick={fetchChargerStatus} className="h-11 px-10 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl shadow-xl transition-all active:scale-95 leading-none">RETRY</Button>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </ScrollArea>
        </div>
    );
}

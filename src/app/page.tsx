'use client';

import { useEffect, useState, useRef, useMemo, ChangeEvent, Suspense } from 'react';
import { MapComponent } from '@/components/MapComponent';
import { StationDetail } from '@/components/StationDetail';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Building2, Zap, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { API_BASE_URL } from '@/lib/api';

const REGION_CENTERS: Record<string, { lat: number, lng: number }> = {
  '11': { lat: 37.5665, lng: 126.9780 }, // Seoul
  '26': { lat: 35.1796, lng: 129.0756 }, // Busan
  '27': { lat: 35.8714, lng: 128.6014 }, // Daegu
  '28': { lat: 37.4563, lng: 126.7052 }, // Incheon
  '29': { lat: 35.1595, lng: 126.8526 }, // Gwangju
  '30': { lat: 36.3504, lng: 127.3845 }, // Daejeon
  '31': { lat: 35.5384, lng: 129.3114 }, // Ulsan
  '36': { lat: 36.4800, lng: 127.2890 }, // Sejong
  '41': { lat: 37.2750, lng: 127.0093 }, // Gyeonggi
  '42': { lat: 37.8854, lng: 127.7298 }, // Gangwon
  '43': { lat: 36.6358, lng: 127.4913 }, // Chungbuk
  '44': { lat: 36.6588, lng: 126.6730 }, // Chungnam
  '45': { lat: 35.8205, lng: 127.1088 }, // Jeonbuk
  '46': { lat: 34.8160, lng: 126.4630 }, // Jeonnam
  '47': { lat: 36.5760, lng: 128.5058 }, // Gyeongbuk
  '48': { lat: 35.2376, lng: 128.6919 }, // Gyeongnam
  '50': { lat: 33.4996, lng: 126.5312 }, // Jeju
};

const HomeContent = () => {
  const { user, isGuest, guestToken, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [stations, setStations] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterKeyword, setFilterKeyword] = useState('');
  const [zcode, setZcode] = useState('11'); // Seoul as initial
  const [regions, setRegions] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [selectedStation, setSelectedStation] = useState<any>(null);
  const [stationDetail, setStationDetail] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const lastParamsRef = useRef({ zcode: '' });

  const searchParams = useSearchParams();
  const code = searchParams.get('code');

  useEffect(() => {
    const handleAuth = async () => {
      if (code) {
        // If there is a code, try to exchange it for a session
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          // If successful, the AuthContext will pick up the change
          // Remove the code from the URL for cleaner history
          const newUrl = window.location.pathname;
          window.history.replaceState({}, '', newUrl);
          return;
        }
      }

      // Standard auth check
      if (!authLoading && !user && !isGuest) {
        router.push('/login');
      }
    };

    handleAuth();
  }, [user, isGuest, authLoading, router, code]);

  // Fetch regions on mount
  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/stations/regions`);
        if (res.ok) {
          const text = await res.text();
          const data = text ? JSON.parse(text) : {};
          setRegions(data);
        }
      } catch (err) {
        console.error('Failed to fetch regions:', err);
      }
    };
    fetchRegions();
  }, []);

  // Initial load handled by zcode change, but only if auth is ready
  useEffect(() => {
    if (!authLoading && (user || isGuest)) {
      handleSearch();
    }
  }, [zcode, user, isGuest, authLoading]);

  const handleSearch = async () => {
    // Only search if authenticated or guest, and not already loading auth
    if (authLoading || (!user && !isGuest)) {
      return;
    }

    // Prevent duplicate calls for same region
    if (lastParamsRef.current.zcode === zcode) {
      return;
    }

    setLoading(true);
    try {
      lastParamsRef.current = { zcode };

      // Move map to region center
      const center = REGION_CENTERS[zcode];
      if (center) {
        setSelectedStation({
          id: `region-${zcode}`,
          center: center
        });
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (user) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }
      } else if (guestToken) {
        headers['Authorization'] = `Bearer ${guestToken}`;
      }

      const res = await fetch(`${API_BASE_URL}/api/stations?zcode=${zcode}`, { headers });

      if (res.status === 403 || res.status === 429) {
        const msg = res.status === 429
          ? 'Rate limit reached (5 searches/min). Please wait a moment.'
          : 'Guest limit reached. Please log in for more.';
        setError(msg);
        setStations([]);
        return;
      }

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}: ${res.statusText}`);
      }

      const text = await res.text();
      const data = text ? JSON.parse(text) : [];
      if (Array.isArray(data)) {
        setStations(data);
        setFilterKeyword(search);
      } else {
        setStations([]);
      }
    } catch (err) {
      console.error('Search error:', err);
      setStations([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredStations = useMemo(() => {
    if (!filterKeyword) return stations;
    const lowerKeyword = filterKeyword.toLowerCase();
    return stations.filter(s => s.statNm?.toLowerCase().includes(lowerKeyword));
  }, [stations, filterKeyword]);

  const handleStationClick = (station: any) => {
    setSelectedStation({
      id: `${station.statId}-${station.chgerId}`,
      center: { lat: Number(station.lat), lng: Number(station.lng) }
    });
    setStationDetail(station);
  };

  const commitFilter = () => {
    setFilterKeyword(search);
  };

  return (
    <main className="flex flex-col md:flex-row min-h-screen bg-[#0a0f1d] text-slate-100 font-sans overflow-hidden">
      {/* Sidebar Search */}
      <div className="w-full md:w-[420px] p-4 md:p-6 flex flex-col gap-4 md:gap-6 bg-[#111827]/80 backdrop-blur-xl border-b md:border-b-0 md:border-r border-white/5 shadow-2xl z-20 shrink-0">
        <header className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)]">
              <Zap className="text-white w-5 h-5 md:w-6 md:h-6 fill-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-white leading-tight">
                EV CONNECT
              </h1>
              <p className="text-blue-400 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Real-time Station Finder</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 py-1 px-3 rounded-lg hidden md:flex items-center gap-2">
                <UserIcon className="w-3 h-3" />
                <span className="text-[10px] font-bold truncate max-w-[100px]">{user.email}</span>
              </Badge>
            ) : isGuest && (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20 py-1 px-3 rounded-lg hidden md:flex items-center gap-2">
                <span className="text-[10px] font-heavy">GUEST MODE</span>
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="text-slate-400 hover:text-white hover:bg-white/5 rounded-xl h-9 w-9"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {error && (
          <div className="bg-amber-500/10 border-2 border-amber-500/20 p-5 rounded-2xl text-amber-400 animate-in fade-in slide-in-from-top-4 duration-500 shadow-[0_0_30px_rgba(245,158,11,0.1)]">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="bg-amber-500 rounded-lg p-1.5 shrink-0">
                  <Zap className="w-4 h-4 text-[#0a0f1d] fill-[#0a0f1d]" />
                </div>
                <p className="text-sm font-black uppercase tracking-tight leading-tight">
                  Guest Limit Reached
                </p>
              </div>
              <p className="text-[11px] font-bold text-amber-500/80 leading-relaxed pl-1">
                You've used all 5 guest searches. Please sign in to continue enjoying EV CONNECT with unlimited access.
              </p>
              <Button
                onClick={() => router.push('/login')}
                className="w-full mt-1 bg-amber-500 hover:bg-amber-400 text-[#0a0f1d] font-black h-10 rounded-xl transition-all active:scale-[0.98] text-[11px] uppercase tracking-wider"
              >
                Sign In Now
              </Button>
            </div>
          </div>
        )}
        <section className="space-y-4 flex-1 flex flex-col overflow-hidden">
          <div className="bg-white/5 p-3 md:p-4 rounded-2xl md:rounded-3xl border border-white/5">
            <div className="flex flex-col gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Region</label>
                <select
                  value={zcode}
                  onChange={(e) => setZcode(e.target.value)}
                  className="w-full bg-[#1f2937] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none cursor-pointer"
                >
                  {Object.entries(regions).sort(([a], [b]) => a.localeCompare(b)).map(([code, name]) => (
                    <option key={code} value={code}>{name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Station Name</label>
                <div className="relative">
                  <Input
                    placeholder="e.g. 한전, 강남"
                    value={search}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && commitFilter()}
                    className="bg-[#1f2937] border-white/10 text-white rounded-xl h-11 pl-4 pr-10 font-bold placeholder:text-slate-600 focus-visible:ring-blue-500"
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                </div>
              </div>

              <Button
                onClick={commitFilter}
                disabled={loading}
                className="w-full h-12 bg-blue-600 hover:bg-blue-50 text-white hover:text-blue-900 font-black rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-blue-900/20"
              >
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  <span>SEARCH STATIONS</span>
                </div>
              </Button>
            </div>
          </div>

          <ScrollArea className="h-[40vh] md:h-[calc(100vh-360px)] px-1">
            <div className="space-y-3 pb-6">
              {filteredStations && filteredStations.length > 0 ? (
                filteredStations.map((station: any) => (
                  <Card
                    key={`${station.statId}-${station.chgerId}`}
                    className={`group relative overflow-hidden bg-[#1f2937]/40 border-white/5 hover:border-blue-500/50 hover:bg-[#1f2937]/60 transition-all duration-300 cursor-pointer rounded-2xl shadow-xl ${selectedStation?.id === `${station.statId}-${station.chgerId}` ? 'ring-2 ring-blue-500 bg-[#1f2937]/80' : ''
                      }`}
                    onClick={() => handleStationClick(station)}
                  >
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-sm font-black text-white leading-snug group-hover:text-blue-400 transition-colors">
                          {station.statNm}
                        </CardTitle>
                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-none text-[9px] font-black px-2 py-0.5 rounded-lg shrink-0">
                          {station.chargers?.length || 1} UNIT
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-3">
                      <div className="flex items-start gap-2 text-[11px] text-slate-400 leading-tight">
                        <MapPin className="shrink-0 w-3 h-3 mt-0.5 text-blue-500/60" />
                        <p className="line-clamp-2">{station.addr}</p>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1">
                        <Badge variant="outline" className={`text-[9px] font-extrabold border-white/5 px-2 py-0.5 rounded-md ${station.parkingFree === 'Y' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/5 text-slate-500'
                          }`}>
                          {station.parkingFree === 'Y' ? 'FREE PARKING' : 'PAID PARKING'}
                        </Badge>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/5 rounded-md border border-white/5">
                          <Building2 className="w-2.5 h-2.5 text-slate-500" />
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                            {station.busiNm}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
                    <Search className="w-8 h-8 text-slate-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-black text-slate-400 uppercase tracking-wider">No stations found</p>
                    <p className="text-[10px] text-slate-500 font-bold">Try adjusting your search filters</p>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </section>
      </div>

      {/* Map View */}
      <div className={`flex-1 relative transition-all duration-500 min-h-[40vh] md:min-h-0 ${stationDetail ? 'md:mr-[420px]' : ''}`}>
        <MapComponent
          stations={filteredStations}
          center={selectedStation?.center || undefined}
          selectedId={selectedStation?.id}
        />

        {/* Detail Overlay Trigger Indicator */}
        {!stationDetail && selectedStation && (
          <div className="absolute right-4 md:right-6 top-4 md:top-6 animate-bounce">
            <div className="bg-blue-600 text-white text-[9px] md:text-[10px] font-black px-3 md:px-4 py-1.5 md:py-2 rounded-full shadow-2xl border border-white/20">
              CLICK STATION FOR DETAILS
            </div>
          </div>
        )}
      </div>

      {/* Detail Slide-out */}
      {stationDetail && (
        <div className="w-full md:w-[420px] h-full fixed right-0 top-0 z-50 animate-in slide-in-from-right duration-500 ease-out shadow-[-20px_0_50px_rgba(0,0,0,0.5)]">
          <StationDetail
            station={stationDetail}
            onClose={() => setStationDetail(null)}
          />
        </div>
      )}
    </main>
  );
};

export default function Page() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0f1d] text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center animate-pulse shadow-[0_0_30px_rgba(37,99,235,0.4)]">
            <Zap className="text-white w-6 h-6 fill-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white/80">
            EV CONNECT
          </h1>
        </div>
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}

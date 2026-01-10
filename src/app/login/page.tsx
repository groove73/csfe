'use client';

import { useAuth } from '@/components/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Zap, Chrome } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
    const { user, isGuest, loginWithGoogle, continueAsGuest, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && (user || isGuest)) {
            router.push('/');
        }
    }, [user, isGuest, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0f1d] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#0a0f1d] flex items-center justify-center p-4">
            <div className="max-w-md w-full space-y-8 bg-[#111827]/80 backdrop-blur-xl p-8 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-600/20 rounded-full blur-[100px]"></div>
                <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-600/20 rounded-full blur-[100px]"></div>

                <div className="text-center space-y-6 relative">
                    <div className="flex justify-center">
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(37,99,235,0.4)]">
                            <Zap className="text-white w-10 h-10 fill-white" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-3xl font-black tracking-tight text-white leading-tight">
                            EV CONNECT
                        </h1>
                        <p className="text-slate-400 text-sm font-medium">
                            Start finding charging stations near you.
                        </p>
                    </div>
                </div>

                <div className="space-y-4 relative">
                    <Button
                        onClick={loginWithGoogle}
                        className="w-full h-14 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-2xl transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-3"
                    >
                        <Chrome className="w-5 h-5" />
                        <span>Continue with Google</span>
                    </Button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-white/10" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-[#111827]/80 px-2 text-slate-500">Or continue as guest</span>
                        </div>
                    </div>

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            const email = (e.currentTarget.elements.namedItem('email') as HTMLInputElement).value;
                            continueAsGuest(email);
                        }}
                        className="space-y-3"
                    >
                        <Input
                            name="email"
                            type="email"
                            placeholder="Enter your email"
                            required
                            className="bg-[#1f2937] border-white/10 text-white rounded-xl h-12 px-4 focus-visible:ring-blue-500 placeholder:text-slate-600"
                        />
                        <Button
                            type="submit"
                            variant="outline"
                            className="w-full h-12 bg-white/5 border-white/10 hover:bg-white/10 text-white font-bold rounded-2xl transition-all active:scale-[0.98]"
                        >
                            Start Guest Session
                        </Button>
                    </form>

                    <p className="text-[10px] text-center text-slate-500 font-medium px-4">
                        Guest mode allows up to 5 searches. Log in for unlimited access and more features.
                    </p>
                </div>

                <div className="pt-4 text-center">
                    <p className="text-[10px] text-blue-400 font-black uppercase tracking-[0.2em] opacity-80">
                        Real-time Station Finder
                    </p>
                </div>
            </div>
        </main>
    );
}

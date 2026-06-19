import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export function LoginPage() {
    const { signIn } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const submittedEmail = String(formData.get('email') || email).trim();
        const submittedPassword = String(formData.get('password') || password);
        setEmail(submittedEmail);
        setPassword(submittedPassword);
        setError('');
        setLoading(true);

        try {
            await signIn(submittedEmail, submittedPassword);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const labelClass = "text-[rgba(255,255,255,0.48)] font-medium font-['Inter_Tight'] text-[12px] leading-[20px] tracking-[0.04em] uppercase";
    const inputClass = "px-4 py-3 rounded-[12px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white font-['Inter'] text-[14px] leading-[1.6] focus:outline-none focus:border-[rgba(255,255,255,0.24)] transition-colors placeholder:text-[rgba(255,255,255,0.32)]";

    return (
        <div className="min-h-screen bg-[#161616] flex items-center justify-center px-4">
            {/* Background Blurs */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-[6%] -left-[490px] w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(0,174,239,0.5)_0%,rgba(0,174,239,0)_70%)] blur-[210px] mix-blend-screen opacity-100" />
                <div className="absolute top-[30%] -right-[490px] w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(102,45,145,0.5)_0%,rgba(102,45,145,0)_70%)] blur-[210px] mix-blend-screen opacity-100" />
            </div>

            {/* Login Card */}
            <div
                className="relative z-10 w-full max-w-[400px] rounded-[24px] overflow-hidden"
                style={{
                    background: 'linear-gradient(217.06deg, #191719 21.52%, #171C1F 102.2%)',
                    border: '1px solid transparent',
                    backgroundImage: 'linear-gradient(217.06deg, #191719 21.52%, #171C1F 102.2%), linear-gradient(267.73deg, #3F3069 1.5%, #2E6449 99.17%)',
                    backgroundOrigin: 'border-box',
                    backgroundClip: 'padding-box, border-box',
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-center px-[24px] py-[16px] border-b border-[#2c2a30]">
                    <img src={`${import.meta.env.BASE_URL}logo-dark.svg`} alt="Lespal" className="w-[90px] h-[44px]" />
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-[36px] flex flex-col gap-6">
                    <h1 className="text-white font-['Inter_Tight'] font-semibold text-[24px] text-center">
                        Welcome back
                    </h1>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-[12px] px-4 py-3 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col gap-2">
                        <label className={labelClass}>Email</label>
                        <input
                            name="email"
                            autoComplete="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className={inputClass}
                            placeholder="you@example.com"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className={labelClass}>Password</label>
                        <input
                            name="password"
                            autoComplete="current-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            className={inputClass}
                            placeholder="••••••••"
                        />
                    </div>

                    <Button type="submit" disabled={loading} className="w-full h-[48px]">
                        {loading ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            'Sign in'
                        )}
                    </Button>
                </form>
            </div>
        </div>
    );
}

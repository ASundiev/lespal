import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export function LoginPage() {
    const { signIn, signUp } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('student'); // 'student' or 'teacher'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            if (isLogin) {
                await signIn(email, password);
            } else {
                // Sign up
                const { data, error: signUpError } = await signUp(email, password);
                if (signUpError) throw signUpError;

                // Create user profile with selected role
                if (data?.user) {
                    const { error: profileError } = await supabase
                        .from('user_profiles')
                        .insert({
                            id: data.user.id,
                            email: email,
                            role: role
                        });

                    if (profileError) {
                        console.warn('Failed to create profile:', profileError);
                        // Don't throw - user can still use the app, profile just won't have role
                    }
                }

                setMessage('Check your email for confirmation link!');
            }
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
                        {isLogin ? 'Welcome back' : 'Create account'}
                    </h1>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-[12px] px-4 py-3 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {message && (
                        <div className="bg-green-500/10 border border-green-500/30 rounded-[12px] px-4 py-3 text-green-400 text-sm">
                            {message}
                        </div>
                    )}

                    <div className="flex flex-col gap-2">
                        <label className={labelClass}>Email</label>
                        <input
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
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            className={inputClass}
                            placeholder="••••••••"
                        />
                    </div>

                    {/* Role Selection - only shown during signup */}
                    {!isLogin && (
                        <div className="flex flex-col gap-2">
                            <label className={labelClass}>I am a...</label>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setRole('student')}
                                    className={`flex-1 px-4 py-3 rounded-full border transition-all font-medium text-[14px] ${role === 'student'
                                            ? 'bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.24)] text-white'
                                            : 'bg-transparent border-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.48)] hover:bg-[rgba(255,255,255,0.04)]'
                                        }`}
                                >
                                    Student
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRole('teacher')}
                                    className={`flex-1 px-4 py-3 rounded-full border transition-all font-medium text-[14px] ${role === 'teacher'
                                            ? 'bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.24)] text-white'
                                            : 'bg-transparent border-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.48)] hover:bg-[rgba(255,255,255,0.04)]'
                                        }`}
                                >
                                    Teacher
                                </button>
                            </div>
                        </div>
                    )}

                    <Button type="submit" disabled={loading} className="w-full h-[48px]">
                        {loading ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            isLogin ? 'Sign in' : 'Sign up'
                        )}
                    </Button>

                    <button
                        type="button"
                        onClick={() => { setIsLogin(!isLogin); setError(''); setMessage(''); }}
                        className="text-[rgba(255,255,255,0.48)] hover:text-white text-sm transition-colors"
                    >
                        {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                    </button>
                </form>
            </div>
        </div>
    );
}

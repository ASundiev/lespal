import React, { useState, useEffect } from 'react';
import { Copy, Plus, Check, Users } from 'lucide-react';
import * as sharingApi from '@/lib/sharingApi';

// Shared styles matching AddSongModal
const labelClass = "text-[rgba(255,255,255,0.48)] font-medium font-['Inter_Tight'] text-[12px] leading-[20px] tracking-[0.04em] uppercase";
const inputClass = "px-4 py-3 rounded-[12px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white font-['Inter'] text-[14px] leading-[1.6] focus:outline-none focus:border-[rgba(255,255,255,0.24)] transition-colors placeholder:text-[rgba(255,255,255,0.32)]";
const buttonOutlineClass = "px-6 py-3 rounded-full border border-[rgba(255,255,255,0.12)] text-[rgba(255,255,255,0.8)] hover:bg-[rgba(255,255,255,0.04)] transition-colors text-[14px] font-medium disabled:opacity-50";

export function TeacherPanel({ onStudentSelect, selectedStudentId }) {
    const [students, setStudents] = useState([]);
    const [inviteCodes, setInviteCodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const [studentData, codeData] = await Promise.all([
                sharingApi.getMyStudents(),
                sharingApi.getMyInviteCodes()
            ]);
            setStudents(studentData);
            setInviteCodes(codeData);
        } catch (e) {
            console.warn('Failed to load teacher data:', e);
        } finally {
            setLoading(false);
        }
    }

    async function handleGenerateCode() {
        setGenerating(true);
        try {
            const newCode = await sharingApi.createInviteCode();
            setInviteCodes(prev => [newCode, ...prev]);
        } catch (e) {
            alert('Failed to generate code: ' + e.message);
        } finally {
            setGenerating(false);
        }
    }

    function copyCode(code) {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    const activeCode = inviteCodes.find(c => !c.used_by && new Date(c.expires_at) > new Date());

    return (
        <div className="flex flex-col gap-6">
            {/* Student Selector */}
            {students.length > 0 && (
                <div className="flex flex-col gap-2">
                    <label className={labelClass}>View Student Data</label>
                    <div className="flex items-center gap-3">
                        <Users size={16} className="text-[rgba(255,255,255,0.48)]" />
                        <select
                            value={selectedStudentId || ''}
                            onChange={(e) => onStudentSelect(e.target.value || null)}
                            className={`${inputClass} flex-1`}
                        >
                            <option value="">My Data</option>
                            {students.map(s => (
                                <option key={s.student_id} value={s.student_id}>
                                    Student {s.student_id.slice(0, 8)}...
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {/* Invite Code Section */}
            <div className="flex flex-col gap-2">
                <label className={labelClass}>Invite Code</label>
                {activeCode ? (
                    <div className="flex items-center gap-3">
                        <div className={`${inputClass} flex-1 flex items-center justify-between`}>
                            <code className="text-white font-mono tracking-wider">{activeCode.code}</code>
                            <button
                                onClick={() => copyCode(activeCode.code)}
                                className="text-[rgba(255,255,255,0.48)] hover:text-white transition-colors ml-2"
                            >
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleGenerateCode}
                            disabled={generating}
                            className={buttonOutlineClass}
                        >
                            <Plus size={14} className="inline mr-2" />
                            {generating ? 'Generating...' : 'Generate Invite Code'}
                        </button>
                    </div>
                )}
                <p className="text-[rgba(255,255,255,0.48)] text-[12px]">
                    Share this code with your student to link your accounts.
                </p>
            </div>
        </div>
    );
}

export function StudentLinkPanel() {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [teachers, setTeachers] = useState([]);

    useEffect(() => {
        sharingApi.getMyTeachers().then(setTeachers).catch(console.warn);
    }, []);

    async function handleRedeem() {
        if (!code.trim()) return;
        setLoading(true);
        try {
            await sharingApi.redeemInviteCode(code.trim());
            alert('Successfully linked to teacher!');
            setCode('');
            // Refresh teachers list
            const updated = await sharingApi.getMyTeachers();
            setTeachers(updated);
        } catch (e) {
            alert('Failed: ' + e.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleUnlink() {
        if (!window.confirm('Are you sure you want to disconnect from your teacher? You will need a new invite code to reconnect.')) return;
        setLoading(true);
        try {
            for (const t of teachers) {
                await sharingApi.unlinkTeacher(t.teacher_id);
            }
            // Refresh teachers list
            const updated = await sharingApi.getMyTeachers();
            setTeachers(updated);
        } catch (e) {
            alert('Failed: ' + e.message);
        } finally {
            setLoading(false);
        }
    }

    if (teachers.length > 0) {
        return (
            <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                    <Check size={18} className="text-green-400" />
                    <span className="text-[rgba(255,255,255,0.64)] text-[14px]">
                        Linked to teacher
                    </span>
                </div>
                <button
                    onClick={handleUnlink}
                    disabled={loading}
                    className="text-red-400 hover:text-red-300 text-[12px] font-medium transition-colors"
                >
                    {loading ? 'Unlinking...' : 'Disconnect'}
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
                <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="Enter code"
                    maxLength={6}
                    className={`${inputClass} w-[140px] font-mono text-center tracking-widest uppercase`}
                />
                <button
                    onClick={handleRedeem}
                    disabled={loading || code.length < 6}
                    className={buttonOutlineClass}
                >
                    {loading ? 'Linking...' : 'Link'}
                </button>
            </div>
        </div>
    );
}

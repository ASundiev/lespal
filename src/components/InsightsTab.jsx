import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Music, Calendar, Flame, RefreshCcw, Search, AlertCircle, CheckCircle2, Sparkles, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { analyzeLessonNotes } from '../lib/gemini';



export function InsightsTab({ songs, lessons, geminiApiKey }) {
  const [aiInsights, setAiInsights] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiError, setAiError] = useState(null);

  // Cache key based on last 10 lesson notes
  const notesHash = useMemo(() => {
    const sorted = [...lessons].sort((a, b) => new Date(b.date) - new Date(a.date));
    return sorted.slice(0, 10).map(l => l.notes || "").join('|');
  }, [lessons]);

  // AI analysis effect
  useEffect(() => {
    if (!geminiApiKey || !notesHash || lessons.length === 0) return;

    const cacheKey = `ai_insight_${notesHash}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        setAiInsights(JSON.parse(cached));
        return;
      } catch (e) {
        localStorage.removeItem(cacheKey);
      }
    }

    async function runAnalysis() {
      setAnalyzing(true);
      setAiError(null);
      try {
        const result = await analyzeLessonNotes(geminiApiKey, lessons);
        setAiInsights(result);
        localStorage.setItem(cacheKey, JSON.stringify(result));
      } catch (err) {
        setAiError(err.message);
      } finally {
        setAnalyzing(false);
      }
    }

    runAnalysis();
  }, [geminiApiKey, notesHash, lessons]);

  const stats = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Filter data
    const lessonsThisYear = lessons.filter(l => new Date(l.date).getFullYear() === currentYear);

    // Most Rehearsed Songs (all time)
    const rehearsalCounts = {};
    lessons.forEach(l => {
      const ids = String(l.topics || "").split(",").filter(Boolean);
      ids.forEach(id => {
        rehearsalCounts[id] = (rehearsalCounts[id] || 0) + 1;
      });
    });

    const topRehearsedIds = Object.entries(rehearsalCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    const topRehearsedSongs = topRehearsedIds.map(([id, count]) => {
      const song = songs.find(s => String(s.id) === id);
      return {
        title: song?.title || "Unknown",
        count
      };
    });

    // Consecutive weeks streak
    const lessonDates = lessons
      .map(l => new Date(l.date))
      .filter(d => !isNaN(d))
      .sort((a, b) => b - a); // Newest first

    let streak = 0;
    if (lessonDates.length > 0) {
      const getWeekKey = (date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 4 - (d.getDay() || 7));
        const yearStart = new Date(d.getFullYear(), 0, 1);
        const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        return `${d.getFullYear()}-W${weekNo}`;
      };

      const weeksWithLessons = new Set(lessonDates.map(getWeekKey));
      const sortedWeeks = Array.from(weeksWithLessons).sort().reverse();

      // Calculate current streak
      const today = new Date();
      let currentWeek = getWeekKey(today);
      let lastWeek = getWeekKey(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000));

      // If no lesson this week and none last week, streak is 0
      if (!weeksWithLessons.has(currentWeek) && !weeksWithLessons.has(lastWeek)) {
        streak = 0;
      } else {
        let checkWeek = weeksWithLessons.has(currentWeek) ? currentWeek : lastWeek;
        let checkDate = new Date(lessonDates.find(d => getWeekKey(d) === checkWeek));

        streak = 0;
        while (weeksWithLessons.has(getWeekKey(checkDate))) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 7);
        }
      }
    }

    const finalBottlenecks = aiInsights?.bottlenecks?.map(label => [label, null]) || [];

    // Top Artists
    const artistCounts = {};
    songs.forEach(s => {
      if (s.artist) {
        artistCounts[s.artist] = (artistCounts[s.artist] || 0) + 1;
      }
    });
    const topArtists = Object.entries(artistCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    // Song status distribution
    const statusCounts = songs.reduce((acc, s) => {
      const status = s.status === 'recorded' ? 'studied' : s.status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    // Mastered songs (studied, includes legacy recorded)
    const masteredCount = songs.filter(s => s.status === 'studied' || s.status === 'recorded').length;

    // Handled above via aiInsights

    return {
      lessonsThisYear: lessonsThisYear.length,
      masteredCount,
      topRehearsedSongs,
      streak,
      holdingMeBack: finalBottlenecks,
      topArtists,
      statusCounts,
      aiSummary: aiInsights?.summary
    };
  }, [songs, lessons, aiInsights]);

  const cardStyle = {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '24px',
    backdropFilter: 'blur(10px)',
  };

  return (
    <div className="mx-auto max-w-[1440px] px-[36px] pt-[40px] space-y-[40px] pb-24">

      {analyzing && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[rgba(255,255,255,0.48)] text-sm">
            <Loader2 className="animate-spin" size={16} />
            <span className="font-medium">AI Analyzing notes...</span>
          </div>
        </div>
      )}

      {aiError && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-center gap-3 text-sm">
          <AlertCircle size={18} />
          <span>AI Error: {aiError}</span>
        </div>
      )}

      {stats.aiSummary && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={cardStyle}
          className="p-8 border-emerald-500/20 bg-emerald-500/[0.02]"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Sparkles className="text-emerald-400" size={20} />
            </div>
            <div>
              <h3 className="text-emerald-400 font-bold text-xs uppercase tracking-widest mb-2">AI Progress Insight</h3>
              <p className="text-white text-xl font-medium leading-[1.6] leading-relaxed italic">
                "{stats.aiSummary}"
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Calendar className="text-blue-400" />}
          label="Lessons this year"
          value={stats.lessonsThisYear}
          subtext="Keep it up!"
        />
        <StatCard
          icon={<Flame className="text-orange-500" />}
          label="Weekly Streak"
          value={`${stats.streak} wks`}
          subtext="Consecutive practice"
        />
        <StatCard
          icon={<Music className="text-emerald-400" />}
          label="Mastered Songs"
          value={stats.masteredCount}
          subtext="Studied"
        />
        <StatCard
          icon={<RefreshCcw className="text-purple-400" />}
          label="Most Rehearsed"
          value={stats.topRehearsedSongs[0]?.title || "None yet"}
          subtext={stats.topRehearsedSongs.length > 1
            ? `Also: ${stats.topRehearsedSongs.slice(1, 3).map(s => s.title).join(", ")}`
            : `${stats.topRehearsedSongs[0]?.count || 0} lessons total`
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Semantic Analysis: Technique Themes (AI ONLY) */}
        {geminiApiKey ? (
          <>
            <Card style={cardStyle} className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-white">What's holding you back?</CardTitle>
              </CardHeader>
              <CardContent>
                {analyzing ? (
                  <div className="flex flex-col items-center justify-center py-12 text-[rgba(255,255,255,0.3)] gap-3">
                    <Loader2 className="animate-spin" size={32} />
                    <p className="text-sm font-medium">Gemini 3 is identifying recurring issues...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {stats.holdingMeBack.length > 0 ? (
                      stats.holdingMeBack.map(([phrase]) => {
                        const parts = phrase.split(':');
                        const theme = parts[0];
                        const description = parts.slice(1).join(':');

                        return (
                          <div key={phrase} className="flex items-start gap-3 text-[rgba(255,255,255,0.7)] px-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-400/40 mt-2 shrink-0" />
                            <span className="flex-1 text-sm leading-relaxed">
                              {parts.length > 1 ? (
                                <>
                                  <span className="font-bold text-[rgba(255,255,255,1)]">{theme}:</span>
                                  {description}
                                </>
                              ) : (
                                phrase
                              )}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-[rgba(255,255,255,0.3)] italic">No recurring issues detected yet - keep it clean!</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card style={cardStyle}>
                <CardHeader>
                  <CardTitle className="text-white">Top Artists</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.topArtists.map(([artist, count], idx) => (
                      <div key={artist} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-[rgba(255,255,255,0.2)] font-mono text-sm">0{idx + 1}</span>
                          <span className="text-white font-medium">{artist}</span>
                        </div>
                        <span className="text-[rgba(255,255,255,0.48)] text-sm">{count} songs</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <>
            <Card style={cardStyle} className="lg:col-span-2 relative overflow-hidden group">
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] pointer-events-none group-hover:bg-emerald-500/10 transition-all duration-700" />

              <CardContent className="flex flex-col items-center justify-center py-[60px] space-y-6 text-center">
                <div className="w-16 h-16 rounded-[24px] bg-emerald-500/10 flex items-center justify-center mb-2">
                  <Sparkles className="text-emerald-400" size={32} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-white tracking-tight">Unlock Smart Insights</h3>
                  <p className="text-[rgba(255,255,255,0.48)] text-sm max-w-[320px] mx-auto leading-relaxed">
                    Connect Gemini 3 to automatically identify bottlenecks and get summaries from your notes.
                  </p>
                </div>
                <Badge variant="outline" className="text-emerald-400 border-emerald-400/20 px-4 py-1.5 rounded-full bg-emerald-500/5 font-bold uppercase tracking-widest text-[10px]">
                  Powered by Gemini 3
                </Badge>
              </CardContent>
            </Card>

            <Card style={cardStyle}>
              <CardHeader>
                <CardTitle className="text-white">Top Artists</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.topArtists.map(([artist, count], idx) => (
                    <div key={artist} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-[rgba(255,255,255,0.2)] font-mono text-sm">0{idx + 1}</span>
                        <span className="text-white font-medium">{artist}</span>
                      </div>
                      <span className="text-[rgba(255,255,255,0.48)] text-sm">{count} songs</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, subtext }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '24px',
        backdropFilter: 'blur(10px)',
      }}
      className="p-6 flex flex-col gap-4"
    >
      <div className="w-10 h-10 rounded-xl bg-[rgba(255,255,255,0.05)] flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-[13px] font-medium text-[rgba(255,255,255,0.48)] uppercase tracking-wider">{label}</p>
        <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
        <p className="text-[11px] text-[rgba(255,255,255,0.32)] mt-1">{subtext}</p>
      </div>
    </motion.div>
  );
}

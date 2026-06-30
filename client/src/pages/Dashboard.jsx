import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { apiRequest } from '../utils/api';
import GlassCard from '../components/GlassCard';
import { CardSkeleton, ChartSkeleton } from '../components/LoadingSkeleton';
import { useNotification } from '../context/NotificationContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flame, 
  Trophy, 
  FileText, 
  Lightbulb, 
  Calendar, 
  History, 
  Plus,
  Play,
  ArrowUpRight,
  Clock,
  ExternalLink,
  Trash2,
  Sparkles,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

const Dashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const [analytics, setAnalytics] = useState(null);
  const [history, setHistory] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studyInput, setStudyInput] = useState('');

  // Modal schedule states
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [schedCompany, setSchedCompany] = useState('');
  const [schedType, setSchedType] = useState('Technical');
  const [schedDate, setSchedDate] = useState('');
  const [schedNotes, setSchedNotes] = useState('');
  const [schedSaving, setSchedSaving] = useState(false);

  const { addToast } = useNotification();

  const fetchDashboardData = async () => {
    try {
      const [analyticsData, historyData, scheduleData] = await Promise.all([
        apiRequest('/analytics'),
        apiRequest('/interviews/history'),
        apiRequest('/schedule')
      ]);
      setAnalytics(analyticsData);
      setHistory(historyData);
      setSchedules(scheduleData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleAddStudyHours = async (e) => {
    e.preventDefault();
    if (!studyInput || isNaN(studyInput)) return;
    try {
      const updated = await apiRequest('/analytics/study-hours', {
        method: 'POST',
        body: JSON.stringify({ hours: Number(studyInput) })
      });
      setAnalytics(updated);
      setStudyInput('');
      addToast('Hours Logged', `Successfully logged ${studyInput} study hours.`, 'success');
    } catch (err) {
      console.error(err);
      addToast('Error logging hours', err.message, 'error');
    }
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    if (!schedCompany || !schedDate) {
      addToast('Validation Error', 'Company name and scheduled date are required.', 'warning');
      return;
    }

    setSchedSaving(true);
    try {
      const res = await apiRequest('/schedule', {
        method: 'POST',
        body: JSON.stringify({
          companyName: schedCompany,
          type: schedType,
          scheduledDate: schedDate,
          notes: schedNotes
        })
      });
      addToast('Slot Scheduled', res.message, 'success');
      
      if (res.googleCalendarUrl) {
        window.open(res.googleCalendarUrl, '_blank');
      }

      setSchedules(prev => [...prev, { ...res.schedule, googleCalendarUrl: res.googleCalendarUrl }]);
      
      setSchedCompany('');
      setSchedNotes('');
      setSchedDate('');
      setShowScheduleModal(false);
    } catch (err) {
      addToast('Scheduling Failed', err.message, 'error');
    } finally {
      setSchedSaving(false);
    }
  };

  const handleCancelSchedule = async (id) => {
    if (!confirm('Are you sure you want to cancel this scheduled mock session?')) return;
    try {
      await apiRequest(`/schedule/${id}`, { method: 'DELETE' });
      addToast('Slot Cancelled', 'The scheduled mock slot was removed.', 'info');
      setSchedules(prev => prev.filter(s => s._id !== id));
    } catch (err) {
      addToast('Cancellation Failed', err.message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton /><ChartSkeleton />
        </div>
      </div>
    );
  }

  // Format Data for Recharts
  const studyData = analytics?.dailyStudyHours?.length > 0
    ? analytics.dailyStudyHours.map(d => ({ name: d.date.split('-')[2], hours: d.hours }))
    : [
        { name: 'Mon', hours: 1.5 },
        { name: 'Tue', hours: 2.0 },
        { name: 'Wed', hours: 0.5 },
        { name: 'Thu', hours: 3.0 },
        { name: 'Fri', hours: 1.2 },
        { name: 'Sat', hours: 2.5 },
        { name: 'Sun', hours: 4.0 }
      ];

  const skillData = analytics?.skillProgress?.length > 0
    ? analytics.skillProgress.map(s => ({ subject: s.skillName, A: s.rating, fullMark: 100 }))
    : [
        { subject: 'HR Skills', A: 75, fullMark: 100 },
        { subject: 'Technical', A: 68, fullMark: 100 },
        { subject: 'System Design', A: 50, fullMark: 100 },
        { subject: 'Behavioral', A: 85, fullMark: 100 },
        { subject: 'Algorithms', A: 60, fullMark: 100 }
      ];

  const scoreTrendData = analytics?.interviewScoreHistory?.length > 0
    ? analytics.interviewScoreHistory.map((h, i) => ({ name: `Session ${i+1}`, score: h.score }))
    : [
        { name: 'S1', score: 62 },
        { name: 'S2', score: 68 },
        { name: 'S3', score: 75 },
        { name: 'S4', score: 82 }
      ];

  // Calculate Averages and High Scores
  const totalInterviews = history.length;
  const avgInterviewScore = totalInterviews > 0
    ? Math.round(history.reduce((acc, h) => acc + h.overallScore, 0) / totalInterviews)
    : 72;

  const latestResumeScore = analytics?.resumeImprovementTrend?.length > 0
    ? analytics.resumeImprovementTrend[analytics.resumeImprovementTrend.length - 1].score
    : 0;

  // Recommendations builder
  const getRecommendations = () => {
    const recs = [];
    if (latestResumeScore < 70) {
      recs.push({ text: 'Optimize resume layout and keyword matches to pass ATS thresholds.', link: '/resume-analyzer' });
    }
    if (totalInterviews === 0) {
      recs.push({ text: 'Begin your first AI Mock Interview simulation (HR or Technical).', link: '/mock-interview' });
    } else {
      recs.push({ text: 'Review weak algorithms skills from your dashboard analytics chart.', link: '/coding-practice' });
    }
    recs.push({ text: 'Read through the preparation guide for target tech companies.', link: '/company-prep' });
    return recs.slice(0, 3);
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">
            Welcome, <span className="text-gradient-ai">{user?.profile?.name || 'User'}</span>
          </h2>
          <p className="text-xs text-brand-textSec mt-1">Here is a summary of your AI learning progress, scores, and upcoming mock schedules.</p>
        </div>

        <button
          onClick={() => navigate('/mock-interview')}
          className="px-5 py-3 rounded-xl btn-primary text-xs font-extrabold flex items-center gap-2 max-w-max"
        >
          <Play className="h-4.5 w-4.5 fill-white" />
          <span>Launch AI Simulator</span>
        </button>
      </div>
      
      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Streak card */}
        <GlassCard hoverable className="flex items-center gap-5 border-white/5 bg-brand-card">
          <div className="p-4 rounded-2xl bg-brand-amber/10 text-brand-amber border border-brand-amber/20 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            <Flame className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-brand-textSec uppercase tracking-widest">{t('streak')}</p>
            <h3 className="text-2xl font-black text-white mt-0.5">{user?.streak?.currentStreak || 0} Days</h3>
            <span className="text-[9px] text-brand-emerald font-semibold flex items-center gap-1 mt-0.5">
              Daily study streak active
            </span>
          </div>
        </GlassCard>

        {/* Avg Interview card */}
        <GlassCard hoverable className="flex items-center gap-5 border-white/5 bg-brand-card">
          <div className="p-4 rounded-2xl bg-brand-indigo/10 text-brand-indigo border border-brand-indigo/20 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-brand-textSec uppercase tracking-widest">{t('overallScore')}</p>
            <h3 className="text-2xl font-black text-white mt-0.5">{avgInterviewScore}%</h3>
            <span className="text-[9px] text-brand-indigo font-semibold flex items-center gap-1 mt-0.5">
              Across {totalInterviews} sessions completed
            </span>
          </div>
        </GlassCard>

        {/* Resume ATS score card */}
        <GlassCard hoverable className="flex items-center gap-5 border-white/5 bg-brand-card">
          <div className="p-4 rounded-2xl bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-brand-textSec uppercase tracking-widest">{t('resumeScore')}</p>
            <h3 className="text-2xl font-black text-white mt-0.5">
              {latestResumeScore > 0 ? `${latestResumeScore}%` : 'N/A'}
            </h3>
            <span className="text-[9px] text-brand-cyan font-semibold flex items-center gap-1 mt-0.5">
              {latestResumeScore > 0 ? 'Resume fully scanned' : 'Upload resume PDF to grade'}
            </span>
          </div>
        </GlassCard>

      </div>

      {/* Main Charts & Analytics Block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Study Hours Area Chart */}
        <GlassCard className="col-span-2 flex flex-col justify-between h-[360px] border-white/5 bg-brand-card">
          <div className="flex justify-between items-center pb-2">
            <div>
              <h4 className="font-bold text-sm text-white uppercase tracking-wider">Study & Prep Hours</h4>
              <p className="text-brand-textSec text-[11px] mt-0.5">Accumulated learning activity minutes</p>
            </div>
            
            {/* Direct Hour increment input form */}
            <form onSubmit={handleAddStudyHours} className="flex gap-2 items-center">
              <input
                type="number"
                step="0.5"
                placeholder="1.5"
                value={studyInput}
                onChange={e => setStudyInput(e.target.value)}
                className="w-20 px-3 py-1.5 rounded-lg bg-brand-dark border border-white/5 text-xs text-white placeholder-brand-textSec/40 focus:outline-none focus:border-brand-indigo/40"
              />
              <button
                type="submit"
                className="p-2 rounded-lg bg-brand-indigo text-white hover:bg-brand-indigo/90 transition-colors flex items-center justify-center shadow-lg shadow-brand-indigo/25"
                title="Log Hours Today"
              >
                <Plus className="h-4 w-4" />
              </button>
            </form>
          </div>

          <div className="h-[240px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={studyData}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#9CA3AF" opacity={0.6} fontSize={10} tickLine={false} />
                <YAxis stroke="#9CA3AF" opacity={0.6} fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '16px', color: '#FFFFFF' }}
                  labelStyle={{ color: '#9CA3AF', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="hours" stroke="#6366F1" strokeWidth={2} fillOpacity={1} fill="url(#colorHours)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Skill progress Radar Chart */}
        <GlassCard className="flex flex-col justify-between h-[360px] border-white/5 bg-brand-card">
          <div>
            <h4 className="font-bold text-sm text-white uppercase tracking-wider">Skill Competence</h4>
            <p className="text-brand-textSec text-[11px] mt-0.5">Skill coverage ratings</p>
          </div>

          <div className="h-[240px] w-full flex items-center justify-center mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" radius="70%" data={skillData}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="subject" stroke="#9CA3AF" fontSize={9} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="rgba(255,255,255,0.2)" fontSize={8} />
                <Radar name="Proficiency" dataKey="A" stroke="#06B6D4" fill="#06B6D4" fillOpacity={0.25} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

      </div>

      {/* Row 3: Actionable Cards, schedule, history */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recommendations list */}
        <GlassCard className="flex flex-col gap-4 border-white/5 bg-brand-card">
          <h4 className="font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-brand-amber animate-pulse" />
            {t('recommendations')}
          </h4>
          <div className="flex flex-col gap-3">
            {getRecommendations().map((rec, i) => (
              <Link
                key={i}
                to={rec.link}
                className="p-3.5 rounded-xl border border-white/5 hover:border-brand-indigo/35 bg-white/[0.01] hover:bg-brand-indigo/[0.02] transition-all flex items-center justify-between text-xs text-brand-textSec hover:text-white group"
              >
                <span className="pr-4 leading-relaxed">{rec.text}</span>
                <ArrowUpRight className="h-4 w-4 text-brand-textSec group-hover:text-brand-indigo transition-colors flex-shrink-0" />
              </Link>
            ))}
          </div>
        </GlassCard>

        {/* Schedule List */}
        <GlassCard className="flex flex-col gap-4 border-white/5 bg-brand-card">
          <h4 className="font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
            <Calendar className="h-5 w-5 text-brand-cyan" />
            Upcoming Mock Rounds
          </h4>
          <div className="flex flex-col gap-3 max-h-[195px] overflow-y-auto pr-1 flex-1">
            {schedules.length === 0 ? (
              <p className="text-[11px] text-brand-textSec py-8 text-center">No upcoming rounds scheduled.</p>
            ) : (
              schedules.map(sched => (
                <div key={sched._id} className="p-3 rounded-xl border border-white/5 bg-white/[0.01] flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`p-1.5 rounded-lg border text-[8px] font-black uppercase tracking-wider ${
                      sched.type === 'Technical' ? 'border-brand-indigo/20 text-brand-indigo bg-brand-indigo/10' : 'border-brand-amber/20 text-brand-amber bg-brand-amber/10'
                    }`}>
                      {sched.type.substring(0, 4)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold truncate text-white">{sched.companyName} Mock</p>
                      <p className="text-[10px] text-brand-textSec mt-0.5 flex items-center gap-1">
                        <Clock className="h-3 w-3 text-brand-indigo" />
                        {new Date(sched.scheduledDate).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a
                      href={sched.googleCalendarUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-brand-textSec hover:text-brand-indigo transition-colors"
                      title="Add to Google Calendar"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    <button
                      onClick={() => handleCancelSchedule(sched._id)}
                      className="p-1.5 rounded-lg bg-white/[0.03] hover:bg-brand-rose/10 border border-white/5 text-brand-rose transition-colors"
                      title="Cancel Booking"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                </div>
              ))
            )}
          </div>
          <button
            onClick={() => setShowScheduleModal(true)}
            className="w-full py-2.5 rounded-xl border border-white/5 hover:border-brand-cyan/40 bg-white/[0.01] hover:bg-brand-cyan/[0.02] text-xs text-brand-textSec hover:text-brand-cyan font-bold transition-all flex items-center justify-center gap-1.5 mt-auto"
          >
            <Plus className="h-4 w-4" /> Book New Mock Round
          </button>
        </GlassCard>

        {/* History List */}
        <GlassCard className="flex flex-col gap-4 border-white/5 bg-brand-card">
          <h4 className="font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
            <History className="h-5 w-5 text-brand-emerald" />
            {t('recentHistory')}
          </h4>
          <div className="flex flex-col gap-3 max-h-[250px] overflow-y-auto pr-1 flex-1">
            {history.length === 0 ? (
              <p className="text-[11px] text-brand-textSec py-8 text-center">No interviews completed yet.</p>
            ) : (
              history.map(item => (
                <div key={item._id} className="p-3.5 rounded-xl border border-white/5 bg-white/[0.01] flex items-center justify-between text-xs hover:border-white/10 transition-colors">
                  <div className="min-w-0 mr-2">
                    <p className="font-bold text-white truncate">{item.interviewId?.type || 'Technical'} Mock</p>
                    <span className="text-[10px] text-brand-textSec mt-0.5 block">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    <div className="text-right mr-1">
                      <p className="font-black text-brand-emerald">{item.overallScore}%</p>
                      <span className="text-[9px] text-brand-textSec uppercase font-bold tracking-wider">Score</span>
                    </div>
                    
                    {item.pdfReportPath && (
                      <a
                        href={`/api${item.pdfReportPath}`}
                        download
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-brand-textSec hover:text-brand-indigo transition-colors"
                        title="Download PDF Scorecard"
                      >
                        <FileText className="h-3.5 w-3.5" />
                      </a>
                    )}
 
                    <Link
                      to={`/mock-interview/result/${item.interviewId?._id || item._id}`}
                      className="p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-brand-textSec hover:text-brand-indigo transition-all"
                      title="View Online"
                    >
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>

      </div>

      {/* SCHEDULE INTERVIEW MODAL */}
      <AnimatePresence>
        {showScheduleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Modal backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowScheduleModal(false)}
              className="absolute inset-0 bg-brand-dark/80 backdrop-blur-md"
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="w-full max-w-md glass-panel p-6 rounded-[20px] border-white/5 bg-brand-darkSec flex flex-col gap-5 relative z-10"
            >
              <button
                onClick={() => setShowScheduleModal(false)}
                className="absolute top-4 right-4 text-brand-textSec hover:text-white transition-colors text-xs font-bold p-1 hover:bg-white/5 rounded"
              >
                ✕
              </button>

              <form onSubmit={handleSaveSchedule} className="space-y-4">
                <div className="flex flex-col gap-1 text-center border-b border-white/5 pb-3">
                  <h3 className="text-base font-black text-white flex items-center justify-center gap-2">
                    <Calendar className="h-5 w-5 text-brand-indigo" /> Schedule Practice Round
                  </h3>
                  <p className="text-[10px] text-brand-textSec">Configure target parameters for your upcoming session</p>
                </div>

                <div className="space-y-3.5 text-xs text-brand-textSec leading-relaxed">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-[10px] uppercase text-brand-textSec">Company Target Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Microsoft / Google / TCS"
                      value={schedCompany}
                      onChange={e => setSchedCompany(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-brand-dark border border-white/5 focus:outline-none focus:border-brand-indigo/40 text-white placeholder-brand-textSec/30"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-[10px] uppercase text-brand-textSec">Interview Profile Track</label>
                    <select
                      value={schedType}
                      onChange={e => setSchedType(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-brand-dark border border-white/5 focus:outline-none focus:border-brand-indigo/40 text-white"
                    >
                      <option value="Technical">Technical Round</option>
                      <option value="HR">HR & Cultural Round</option>
                      <option value="System Design">System Design Round</option>
                      <option value="Behavioral">Behavioral Round</option>
                      <option value="Coding">Coding Round</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-[10px] uppercase text-brand-textSec">Scheduled Date & Time</label>
                    <input
                      type="datetime-local"
                      required
                      value={schedDate}
                      onChange={e => setSchedDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-brand-dark border border-white/5 focus:outline-none focus:border-brand-indigo/40 text-white"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-[10px] uppercase text-brand-textSec">Candidate Target Notes</label>
                    <textarea
                      rows={3}
                      placeholder="E.g. Focus on graph algorithms and tree traversal designs"
                      value={schedNotes}
                      onChange={e => setSchedNotes(e.target.value)}
                      className="w-full p-2.5 rounded-lg bg-brand-dark border border-white/5 focus:outline-none focus:border-brand-indigo/40 text-white resize-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={schedSaving}
                  className="w-full mt-4 py-3 rounded-xl btn-primary text-xs font-extrabold flex items-center justify-center gap-1.5"
                >
                  {schedSaving ? 'Saving Round...' : 'Schedule & Open Google Calendar'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Dashboard;


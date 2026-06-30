import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import GlassCard from '../components/GlassCard';
import { useNotification } from '../context/NotificationContext';
import { ListSkeleton } from '../components/LoadingSkeleton';
import { 
  Users, 
  UserPlus, 
  Send, 
  FileText, 
  Award, 
  ChevronRight, 
  Copy,
  FolderOpen,
  Volume2,
  RefreshCw,
  Star
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const RecruiterDashboard = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteType, setInviteType] = useState('Technical');
  const [inviting, setInviting] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  
  // Modal states for inspecting a candidate's full report
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);

  const { addToast } = useNotification();

  const fetchCandidates = async () => {
    try {
      const data = await apiRequest('/recruiter/candidates');
      setCandidates(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  // Dynamic metrics computations
  const totalInvited = candidates.length;
  const completedRounds = candidates.filter(c => c.status === 'completed').length;
  const pendingRounds = candidates.filter(c => c.status === 'pending').length;

  const statusRatioData = [
    { name: 'Completed', value: completedRounds, color: '#10B981' },
    { name: 'Pending', value: pendingRounds, color: '#F59E0B' }
  ];

  const scoreBrackets = { 'Below 60': 0, '60 - 75': 0, '75 - 90': 0, '90+': 0 };
  candidates.forEach(c => {
    if (c.status === 'completed' && c.score !== undefined) {
      if (c.score < 60) scoreBrackets['Below 60']++;
      else if (c.score < 75) scoreBrackets['60 - 75']++;
      else if (c.score < 90) scoreBrackets['75 - 90']++;
      else scoreBrackets['90+']++;
    }
  });

  const scoreBracketData = Object.keys(scoreBrackets).map(key => ({
    bracket: key,
    count: scoreBrackets[key]
  }));

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setInviting(true);
    setGeneratedLink('');

    try {
      const res = await apiRequest('/recruiter/invite', {
        method: 'POST',
        body: JSON.stringify({ email: inviteEmail, type: inviteType })
      });

      addToast('Invite Sent', res.message, 'success');
      setGeneratedLink(res.inviteLink);
      setInviteEmail('');
      fetchCandidates(); // Reload candidates listing
    } catch (err) {
      addToast('Invite Failed', err.message, 'error');
    } finally {
      setInviting(false);
    }
  };

  const copyLinkToClipboard = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      addToast('Link Copied', 'Invitation URL copied to clipboard.', 'success');
    }
  };

  const inspectReport = (report) => {
    setSelectedReport(report);
    setShowReportModal(true);
  };

  if (loading) {
    return <ListSkeleton rows={4} />;
  }

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="border-b border-white/5 pb-4">
        <h2 className="text-2xl font-black text-white flex items-center gap-2">
          <Users className="h-6 w-6 text-brand-indigo" /> Recruiter Assessment Panel
        </h2>
        <p className="text-xs text-brand-textSec">Invite candidate emails, create custom rounds, and audit AI evaluation scorecards</p>
      </div>

      {/* Telemetry Observability Graphics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Campaign completion Card */}
        <GlassCard className="flex flex-col gap-3 justify-between border-white/5 bg-brand-card p-5">
          <div>
            <h4 className="font-bold text-xs text-white uppercase tracking-wider">Completion Metrics</h4>
            <p className="text-brand-textSec text-[10px]">Invite conversion track stats</p>
          </div>
          <div className="h-[120px] w-full flex items-center justify-center">
            {totalInvited === 0 ? (
              <p className="text-xs text-brand-textSec py-6">No candidates invited yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusRatioData}
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={45}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusRatioData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0b0f19', borderColor: '#1e293b', borderRadius: '8px', fontSize: '10px' }} />
                  <Legend verticalAlign="bottom" height={24} iconSize={6} iconType="circle" wrapperStyle={{ fontSize: '9px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>

        {/* Candidate rankings brackets */}
        <GlassCard className="md:col-span-2 flex flex-col gap-3 justify-between border-white/5 bg-brand-card p-5">
          <div>
            <h4 className="font-bold text-xs text-white uppercase tracking-wider">Candidate Score Range Brackets</h4>
            <p className="text-brand-textSec text-[10px]">Distribution of overall mock score percentages</p>
          </div>
          <div className="h-[120px] w-full">
            {completedRounds === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-xs text-brand-textSec py-6">Waiting for completed candidate interviews.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreBracketData}>
                  <XAxis dataKey="bracket" stroke="#64748b" fontSize={9} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={9} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0b0f19', borderColor: '#1e293b', borderRadius: '8px', fontSize: '10px' }} />
                  <Bar dataKey="count" fill="#6366F1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Campaign Invite Form */}
        <div className="flex flex-col gap-6">
          <GlassCard className="border-white/5 bg-brand-card">
            <h4 className="font-bold text-xs text-white uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <UserPlus className="h-4.5 w-4.5 text-brand-indigo" /> Invite Candidate
            </h4>
            
            <form onSubmit={handleSendInvite} className="space-y-4 text-xs text-brand-textSec leading-relaxed">
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-white">Candidate Email</label>
                <input
                  type="email"
                  required
                  placeholder="candidate@university.edu"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-brand-dark border border-white/5 focus:outline-none focus:border-brand-indigo/40 text-white placeholder-brand-textSec/30"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-white">Interview Profile Track</label>
                <select
                  value={inviteType}
                  onChange={e => setInviteType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-brand-dark border border-white/5 focus:outline-none focus:border-brand-indigo/40 text-brand-textSec"
                >
                  <option value="Technical">Technical Round</option>
                  <option value="HR">HR & Cultural Round</option>
                  <option value="System Design">System Design Round</option>
                  <option value="Behavioral">Behavioral Round</option>
                  <option value="Coding">Coding Round</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={inviting}
                className="w-full py-3 rounded-xl btn-primary text-white font-extrabold transition-all flex items-center justify-center gap-1.5 mt-2"
              >
                {inviting ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Sending Invite...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Dispatch Invitation
                  </>
                )}
              </button>
            </form>

            {/* Generated invite link fallback displays */}
            {generatedLink && (
              <div className="mt-4 p-3 rounded-xl border border-brand-indigo/25 bg-brand-indigo/[0.02] flex items-center justify-between text-xs gap-3">
                <span className="truncate text-brand-indigo font-medium font-mono text-[9px]">{generatedLink}</span>
                <button
                  onClick={copyLinkToClipboard}
                  className="p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-brand-textSec hover:text-white transition-all flex-shrink-0"
                  title="Copy Invite URL"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </GlassCard>
        </div>

        {/* Invited Candidates Table queue */}
        <div className="lg:col-span-2">
          <GlassCard className="border-white/5 bg-brand-card">
            <h4 className="font-bold text-xs text-white uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <FolderOpen className="h-4.5 w-4.5 text-brand-cyan" /> Evaluation Pipeline
            </h4>
            
            <div className="overflow-x-auto w-full border border-white/5 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-brand-textSec font-bold bg-white/[0.01]">
                    <th className="py-3.5 px-4 uppercase tracking-wider text-[10px]">Candidate</th>
                    <th className="py-3.5 px-4 uppercase tracking-wider text-[10px]">Round Track</th>
                    <th className="py-3.5 px-4 uppercase tracking-wider text-[10px]">Overall Score</th>
                    <th className="py-3.5 px-4 uppercase tracking-wider text-[10px]">Tech / Comm / Conf</th>
                    <th className="py-3.5 px-4 text-right uppercase tracking-wider text-[10px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-brand-textSec">
                  {candidates.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-brand-textSec/60">
                        No invitations completed yet. Use the sidebar form to invite candidates.
                      </td>
                    </tr>
                  ) : (
                    candidates.map(item => (
                      <tr key={item._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-white">{item.userId?.profile?.name || 'Candidate'}</p>
                          <p className="text-[10px] text-brand-textSec mt-0.5">{item.userId?.email}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-white">{item.interviewId?.type}</span>
                          <span className="text-[10px] text-brand-textSec/60 block mt-0.5">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-brand-emerald">{item.overallScore}%</td>
                        <td className="py-3.5 px-4 font-semibold">
                          {item.technicalScore}% / {item.communicationScore}% / {item.confidenceScore}%
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <a
                              href={`/api/interviews/result/${item.interviewId?._id || item._id}/pdf`}
                              download
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 rounded-lg btn-secondary text-[10px] font-bold text-white transition-all flex items-center gap-1"
                              title="Download PDF Scorecard"
                            >
                              <FileText className="h-3 w-3" /> PDF
                            </a>
                            <button
                              onClick={() => inspectReport(item)}
                              className="px-3 py-1.5 rounded-lg btn-primary text-[10px] font-extrabold text-white transition-all flex items-center gap-1"
                            >
                              Inspect Audit <ChevronRight className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>

      </div>

      {/* CANDIDATE SCORECARD INSPECTOR MODAL */}
      <AnimatePresence>
        {showReportModal && selectedReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/85 backdrop-blur-md p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-3xl bg-brand-card p-6 rounded-[20px] border border-white/5 flex flex-col gap-5 relative max-h-[90vh] overflow-y-auto shadow-[0_0_50px_rgba(0,0,0,0.5)]"
            >
              <button
                onClick={() => setShowReportModal(false)}
                className="absolute top-4.5 right-4.5 text-brand-textSec hover:text-white text-xs font-bold"
              >
                ✕
              </button>

              {/* Modal Title */}
              <div className="border-b border-white/5 pb-4 flex justify-between items-end pr-8">
                <div>
                  <h3 className="text-base font-black text-white">
                    Audit Report: {selectedReport.userId?.profile?.name}
                  </h3>
                  <p className="text-[10px] text-brand-textSec mt-0.5">
                    Round: {selectedReport.interviewId?.type} Mock • Email: {selectedReport.userId?.email}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-brand-emerald">{selectedReport.overallScore}%</span>
                  <span className="text-[9px] text-brand-textSec uppercase font-bold block">Overall Rating</span>
                </div>
              </div>

              {/* Scorecard grids */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-xs">
                <div className="p-3.5 rounded-xl border border-white/5 bg-white/[0.01]">
                  <p className="text-brand-textSec uppercase font-bold text-[9px] tracking-wider">Technical Score</p>
                  <p className="text-lg font-black text-white mt-1">{selectedReport.technicalScore}%</p>
                </div>
                <div className="p-3.5 rounded-xl border border-white/5 bg-white/[0.01]">
                  <p className="text-brand-textSec uppercase font-bold text-[9px] tracking-wider">Communication</p>
                  <p className="text-lg font-black text-white mt-1">{selectedReport.communicationScore}%</p>
                </div>
                <div className="p-3.5 rounded-xl border border-white/5 bg-white/[0.01]">
                  <p className="text-brand-textSec uppercase font-bold text-[9px] tracking-wider">Confidence Index</p>
                  <p className="text-lg font-black text-white mt-1">{selectedReport.confidenceScore}%</p>
                </div>
                <div className="p-3.5 rounded-xl border border-white/5 bg-white/[0.01]">
                  <p className="text-brand-textSec uppercase font-bold text-[9px] tracking-wider">Test Date</p>
                  <p className="text-xs font-bold text-white mt-2.5">
                    {new Date(selectedReport.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Detailed AI feedback summary */}
              <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] text-xs">
                <h5 className="font-bold text-brand-indigo mb-1.5 uppercase tracking-wider text-[10px]">AI Evaluator Summary</h5>
                <p className="text-brand-textSec leading-relaxed">{selectedReport.detailedFeedback}</p>
              </div>

              {/* Solutions transcripts details */}
              <div className="space-y-4 text-xs">
                <h5 className="font-bold text-brand-cyan uppercase tracking-wider border-b border-white/5 pb-2 flex items-center gap-1.5 text-[10px]">
                  <Award className="h-4.5 w-4.5 text-brand-cyan" /> Evaluation Solved Transcripts
                </h5>
                
                <div className="space-y-3">
                  {selectedReport.suggestedAnswers.map((item, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-white/5 bg-white/[0.01] space-y-2">
                      <p className="font-bold text-white">Q: {item.question}</p>
                      <p className="text-brand-textSec leading-relaxed">
                        <span className="text-brand-indigo font-bold block mb-1">Suggested Better Answer:</span> {item.betterAnswer}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default RecruiterDashboard;


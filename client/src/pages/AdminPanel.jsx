import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import GlassCard from '../components/GlassCard';
import { useNotification } from '../context/NotificationContext';
import { ShieldAlert, Users, Database, Send, Plus, Trash2, Award, Info, HardDrive, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('overview'); // overview, users, coding, announcement
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [challenges, setChallenges] = useState([]);
  
  // Announcement Form
  const [annTitle, setAnnTitle] = useState('');
  const [annMsg, setAnnMsg] = useState('');
  
  // Custom Challenge Form
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('Easy');
  const [description, setDescription] = useState('');
  const [jsTemplate, setJsTemplate] = useState('');
  const [pyTemplate, setPyTemplate] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useNotification();

  const fetchOverview = async () => {
    try {
      const data = await apiRequest('/admin/overview');
      setOverview(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await apiRequest('/admin/users');
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchChallenges = async () => {
    try {
      const data = await apiRequest('/coding/challenges');
      setChallenges(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAllAdminData = async () => {
    setLoading(true);
    await Promise.all([fetchOverview(), fetchUsers(), fetchChallenges()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const handleUpdateRole = async (userId, role) => {
    try {
      await apiRequest('/admin/users/role', {
        method: 'POST',
        body: JSON.stringify({ userId, role })
      });
      addToast('Role Updated', 'User privileges altered successfully.', 'success');
      fetchUsers();
    } catch (err) {
      addToast('Update Failed', err.message, 'error');
    }
  };

  const handleSendAnnouncement = async (e) => {
    e.preventDefault();
    if (!annTitle || !annMsg) return;
    setSubmitting(true);
    try {
      const res = await apiRequest('/admin/announcement', {
        method: 'POST',
        body: JSON.stringify({ title: annTitle, message: annMsg })
      });
      addToast('Announcement Dispatched', res.message, 'success');
      setAnnTitle('');
      setAnnMsg('');
    } catch (err) {
      addToast('Dispatch Failed', err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateChallenge = async (e) => {
    e.preventDefault();
    if (!title || !category || !description) return;
    setSubmitting(true);
    
    const newChallenge = {
      title,
      category,
      difficulty,
      description,
      codeTemplates: {
        javascript: jsTemplate || `function ${title.charAt(0).toLowerCase() + title.slice(1).replace(/\s+/g, '')}() {\n  \n}`,
        python: pyTemplate || `def ${title.toLowerCase().replace(/\s+/g, '_')}():\n    pass`,
        java: `public class Solution {\n    \n}`,
        cpp: `class Solution {\npublic:\n    \n};`
      },
      testCases: [
        { input: "()", expectedOutput: "true" }
      ],
      solution: {
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        explanation: "Algorithmic optimization explanation."
      }
    };

    try {
      await apiRequest('/admin/challenges', {
        method: 'POST',
        body: JSON.stringify(newChallenge)
      });
      addToast('Challenge Added', 'New coding question published successfully.', 'success');
      setTitle('');
      setCategory('');
      setDescription('');
      setJsTemplate('');
      setPyTemplate('');
      fetchChallenges();
    } catch (err) {
      addToast('Creation Failed', err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteChallenge = async (id) => {
    if (!confirm('Are you sure you want to remove this coding challenge?')) return;
    try {
      await apiRequest(`/admin/challenges/${id}`, { method: 'DELETE' });
      addToast('Challenge Removed', 'Question deleted from bank.', 'info');
      fetchChallenges();
    } catch (err) {
      addToast('Delete Failed', err.message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <RefreshCw className="h-8 w-8 text-brand-indigo animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="border-b border-white/5 pb-4">
        <h2 className="text-2xl font-black text-white flex items-center gap-2">
          <ShieldAlert className="h-6 w-6 text-brand-rose" /> Admin Console
        </h2>
        <p className="text-xs text-brand-textSec">Manage developer lists, publications databases, and send platform announcements</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/5 pb-2.5 overflow-x-auto text-xs">
        {[
          { id: 'overview', label: 'System Overview', icon: HardDrive },
          { id: 'users', label: 'User Manager', icon: Users },
          { id: 'coding', label: 'Coding Bank CRUD', icon: Database },
          { id: 'announcement', label: 'Dispatch Alerts', icon: Send }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all border ${
              activeTab === t.id 
                ? 'bg-brand-indigo/10 border-brand-indigo/35 text-white' 
                : 'text-brand-textSec border-transparent hover:text-white'
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Outlets */}
      <div className="text-xs">
        
        {/* 1. OVERVIEW TAB */}
        {activeTab === 'overview' && overview && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <GlassCard className="text-center border-white/5 bg-brand-card py-5">
                <span className="text-[10px] text-brand-textSec font-bold uppercase tracking-widest">Active Accounts</span>
                <h3 className="text-2xl font-black text-white mt-2">{overview.totals.users}</h3>
              </GlassCard>
              <GlassCard className="text-center border-white/5 bg-brand-card py-5">
                <span className="text-[10px] text-brand-textSec font-bold uppercase tracking-widest">Resumes Parsed</span>
                <h3 className="text-2xl font-black text-white mt-2">{overview.totals.resumes}</h3>
              </GlassCard>
              <GlassCard className="text-center border-white/5 bg-brand-card py-5">
                <span className="text-[10px] text-brand-textSec font-bold uppercase tracking-widest">Mocks Completed</span>
                <h3 className="text-2xl font-black text-white mt-2">{overview.totals.interviews}</h3>
              </GlassCard>
              <GlassCard className="text-center border-white/5 bg-brand-card py-5">
                <span className="text-[10px] text-brand-textSec font-bold uppercase tracking-widest">API Call Success</span>
                <h3 className="text-2xl font-black text-brand-emerald mt-2">{overview.apiUsage.successRate}%</h3>
              </GlassCard>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GlassCard className="border-white/5 bg-brand-card flex flex-col gap-3">
                <h4 className="font-bold text-white uppercase tracking-widest mb-1">Billing Tier Distro</h4>
                <div className="space-y-2 leading-relaxed text-brand-textSec">
                  <p className="flex justify-between border-b border-white/5 pb-2"><span>Free Tier:</span> <span className="font-bold text-white">{overview.subscriptions.free}</span></p>
                  <p className="flex justify-between border-b border-white/5 pb-2"><span>Pro Tier:</span> <span className="font-bold text-white">{overview.subscriptions.pro}</span></p>
                  <p className="flex justify-between"><span>Premium Tier:</span> <span className="font-bold text-white">{overview.subscriptions.premium}</span></p>
                </div>
              </GlassCard>
              <GlassCard className="border-white/5 bg-brand-card flex flex-col gap-3">
                <h4 className="font-bold text-white uppercase tracking-widest mb-1">Response Latency</h4>
                <div className="space-y-2 leading-relaxed text-brand-textSec">
                  <p className="flex justify-between border-b border-white/5 pb-2"><span>Average Latency:</span> <span className="font-bold text-brand-emerald">{overview.apiUsage.averageLatencyMs} ms</span></p>
                  <p className="flex justify-between"><span>Total Requests Today:</span> <span className="font-bold text-white">{overview.apiUsage.totalRequestsToday} calls</span></p>
                </div>
              </GlassCard>
            </div>
          </div>
        )}

        {/* 2. USERS TAB */}
        {activeTab === 'users' && (
          <GlassCard className="border-white/5 bg-brand-card">
            <h3 className="font-bold text-sm text-white mb-3 uppercase tracking-wider">User Directory</h3>
            <div className="overflow-x-auto w-full border border-white/5 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-brand-textSec font-bold bg-white/[0.01]">
                    <th className="py-3.5 px-4 uppercase tracking-wider text-[10px]">Name</th>
                    <th className="py-3.5 px-4 uppercase tracking-wider text-[10px]">Email</th>
                    <th className="py-3.5 px-4 uppercase tracking-wider text-[10px]">Billing Plan</th>
                    <th className="py-3.5 px-4 uppercase tracking-wider text-[10px]">System Access</th>
                    <th className="py-3.5 px-4 text-right uppercase tracking-wider text-[10px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-brand-textSec">
                  {users.map(u => (
                    <tr key={u._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 font-bold text-white">{u.profile.name}</td>
                      <td className="py-3 px-4">{u.email}</td>
                      <td className="py-3 px-4 uppercase font-extrabold text-[10px] text-brand-indigo">{u.subscription?.plan}</td>
                      <td className="py-3 px-4 uppercase font-bold text-[10px]">{u.role}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleUpdateRole(u._id, u.role === 'admin' ? 'user' : 'admin')}
                          className="px-3 py-1.5 rounded-lg btn-secondary text-[10px] font-bold text-white transition-all"
                        >
                          Toggle Admin
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}

        {/* 3. CODING CRUD TAB */}
        {activeTab === 'coding' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Create problem form */}
            <div className="lg:col-span-1">
              <GlassCard className="border-white/5 bg-brand-card flex flex-col gap-4">
                <h4 className="font-bold text-xs text-white uppercase tracking-widest border-b border-white/5 pb-2">Publish Problem</h4>
                <form onSubmit={handleCreateChallenge} className="space-y-3.5 flex flex-col text-brand-textSec">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-white">Challenge Title</label>
                    <input
                      type="text"
                      required
                      placeholder="Fibonacci Sequence"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      className="px-3.5 py-2 rounded-xl bg-brand-dark border border-white/5 text-xs text-white focus:outline-none focus:border-brand-indigo/40"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-white">Topic Category</label>
                    <input
                      type="text"
                      required
                      placeholder="Recursion"
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="px-3.5 py-2 rounded-xl bg-brand-dark border border-white/5 text-xs text-white focus:outline-none focus:border-brand-indigo/40"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-white">Difficulty</label>
                    <select
                      value={difficulty}
                      onChange={e => setDifficulty(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-brand-dark border border-white/5 text-xs text-brand-textSec focus:outline-none focus:border-brand-indigo/40"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-white">Problem Prompt Description</label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Given N, compute the nth term..."
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      className="p-3 rounded-xl bg-brand-dark border border-white/5 text-xs text-white placeholder-brand-textSec/30 focus:outline-none focus:border-brand-indigo/40 resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="py-3 rounded-xl btn-primary text-white font-extrabold text-xs transition-all text-center flex items-center justify-center gap-1.5 mt-2"
                  >
                    <Plus className="h-4 w-4" /> Publish Challenge
                  </button>
                </form>
              </GlassCard>
            </div>

            {/* List and delete card */}
            <div className="lg:col-span-2">
              <GlassCard className="border-white/5 bg-brand-card">
                <h4 className="font-bold text-xs text-white uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Database className="h-4 w-4 text-brand-indigo" /> Active Question Database
                </h4>
                <div className="space-y-2 overflow-y-auto max-h-[420px] pr-1">
                  {challenges.map(ch => (
                    <div key={ch._id} className="p-3.5 rounded-xl border border-white/5 bg-white/[0.01] flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-white">{ch.title}</p>
                        <p className="text-[10px] text-brand-textSec mt-0.5">{ch.category} • {ch.difficulty}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteChallenge(ch._id)}
                        className="p-1.5 rounded-lg hover:bg-brand-rose/10 text-brand-textSec hover:text-brand-rose transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>

          </div>
        )}

        {/* 4. DISPATCH ANNOUNCEMENT TAB */}
        {activeTab === 'announcement' && (
          <div className="max-w-2xl mx-auto">
            <GlassCard className="border-white/5 bg-brand-card flex flex-col gap-4">
              <h3 className="font-bold text-xs text-white border-b border-white/5 pb-2 flex items-center gap-1.5 uppercase tracking-wider">
                <Info className="h-4.5 w-4.5 text-brand-cyan animate-pulse" /> Broadcast System Alert
              </h3>
              
              <form onSubmit={handleSendAnnouncement} className="space-y-4 flex flex-col text-brand-textSec">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-white">Alert Title Header</label>
                  <input
                    type="text"
                    required
                    placeholder="Scheduled Maintenance Window"
                    value={annTitle}
                    onChange={e => setAnnTitle(e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl bg-brand-dark border border-white/5 text-xs text-white focus:outline-none focus:border-brand-indigo/40"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-white">Announcement Message Details</label>
                  <textarea
                    rows={6}
                    required
                    placeholder="We will be updating the server systems on July 10 at 2:00 AM UTC. Mocks will be offline."
                    value={annMsg}
                    onChange={e => setAnnMsg(e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl bg-brand-dark border border-white/5 text-xs text-white focus:outline-none focus:border-brand-indigo/40 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="py-3 rounded-xl btn-primary text-white font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 mt-2"
                >
                  <Send className="h-4 w-4" /> Send Announcement
                </button>
              </form>
            </GlassCard>
          </div>
        )}

      </div>

    </div>
  );
};

export default AdminPanel;


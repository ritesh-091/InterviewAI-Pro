import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { apiRequest } from '../utils/api';
import GlassCard from '../components/GlassCard';
import { useNotification } from '../context/NotificationContext';
import { CardSkeleton } from '../components/LoadingSkeleton';

// CodeMirror 6 Core and Extensions
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { cpp } from '@codemirror/lang-cpp';
import { java } from '@codemirror/lang-java';
import { vscodeDark, vscodeLight } from '@uiw/codemirror-theme-vscode';

import { 
  Play, 
  Terminal, 
  CheckCircle, 
  XCircle, 
  Award, 
  BookOpen, 
  Layers,
  Code,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Moon,
  Sun,
  Type,
  Tag,
  Bookmark,
  Heart,
  FileText,
  MessageSquare,
  Sparkles,
  Calendar,
  Zap,
  TrendingUp,
  Maximize2,
  Minimize2,
  Download,
  Copy,
  RotateCcw,
  Trophy,
  ClipboardList
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = [
  "All Topics",
  "Arrays",
  "Strings",
  "Linked List",
  "Stack",
  "Queue",
  "Trees",
  "BST",
  "Graphs",
  "Greedy",
  "Dynamic Programming",
  "Recursion",
  "Bit Manipulation",
  "Math",
  "Binary Search",
  "Sliding Window",
  "HashMap",
  "Heap"
];

const COMPANIES = [
  "All Companies",
  "Google",
  "Amazon",
  "Microsoft",
  "Facebook",
  "Apple",
  "Netflix",
  "TCS",
  "Infosys",
  "Wipro",
  "Accenture"
];

const STUDY_SHEETS = [
  { id: 'all', name: 'All Problems' },
  { id: 'blind75', name: 'Blind 75' },
  { id: 'neetcode150', name: 'NeetCode 150' },
  { id: 'striver', name: 'Striver SDE Sheet' },
  { id: 'babbar', name: 'Love Babbar Sheet' }
];

const DEFAULT_TEMPLATES = {
  c: `#include <stdio.h>

int main() {
    // Write your code here

    return 0;
}`,
  cpp: `#include <iostream>
using namespace std;

int main() {
    // Write your code here

    return 0;
}`,
  java: `public class Main {
    public static void main(String[] args) {
        // Write your code here
    }
}`,
  python: `def solve():
    # Write your code here
    pass

if __name__ == "__main__":
    solve()`,
  javascript: `function solve() {
    // Write your code here
}

solve();`
};

const CodingPractice = () => {
  const [challenges, setChallenges] = useState([]);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [view, setView] = useState('dashboard'); // dashboard, editor, contests, sheets, achievements, leaderboard
  
  // Filtering & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Topics');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [selectedCompany, setSelectedCompany] = useState('All Companies');
  const [selectedSheet, setSelectedSheet] = useState('all');

  // Interactive Tabs inside workspace
  const [workspaceTab, setWorkspaceTab] = useState('description'); // description, submissions, discussion, notes
  const [consoleTab, setConsoleTab] = useState('testcases'); // testcases, ai_assistant

  // Resizable Panel Coordinates
  const [leftWidth, setLeftWidth] = useState(38);
  const [editorHeight, setEditorHeight] = useState(62);
  const [isResizingWidth, setIsResizingWidth] = useState(false);
  const [isResizingHeight, setIsResizingHeight] = useState(false);

  // Fullscreen, Theme, Font editor configurations
  const [editorTheme, setEditorTheme] = useState('vs-dark');
  const [fontSize, setFontSize] = useState(14);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // User coding stats, streaks, heatmap data
  const [progressStats, setProgressStats] = useState({
    easySolved: 0,
    mediumSolved: 0,
    hardSolved: 0,
    totalSolved: 0,
    streakCount: 0,
    streakDates: [],
    bookmarked: [],
    favorites: [],
    recentlySolved: [],
    leaderboard: []
  });

  // Discussions and Notes states
  const [discussions, setDiscussions] = useState([]);
  const [commentInput, setCommentInput] = useState('');
  const [replyInput, setReplyInput] = useState({});
  const [replyTargetId, setReplyTargetId] = useState(null);
  const [notesInput, setNotesInput] = useState('');
  
  // AI assistant response states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiOutput, setAiOutput] = useState('');

  const containerRef = useRef(null);
  const rightContainerRef = useRef(null);
  const workspaceRef = useRef(null);
  const lastTemplateRef = useRef('');

  const { addToast } = useNotification();

  // Load progress dashboard metrics
  const fetchProgress = async () => {
    try {
      const data = await apiRequest('/coding/analytics/progress');
      setProgressStats(data);
    } catch (err) {
      console.error('Progress metrics error:', err.message);
    }
  };

  // Load challenges
  const fetchChallenges = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'All Topics') params.append('category', selectedCategory);
      if (selectedDifficulty !== 'All') params.append('difficulty', selectedDifficulty);
      if (selectedCompany !== 'All Companies') params.append('company', selectedCompany);
      if (selectedSheet !== 'all') params.append('sheet', selectedSheet);
      if (searchTerm) params.append('search', searchTerm);

      const data = await apiRequest(`/coding/challenges?${params.toString()}`);
      setChallenges(data);
    } catch (err) {
      console.error(err);
      addToast('Error loading challenges', err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedDifficulty, selectedCompany, selectedSheet, searchTerm, addToast]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchChallenges();
  };

  useEffect(() => {
    fetchChallenges();
    fetchProgress();
  }, [selectedCategory, selectedDifficulty, selectedCompany, selectedSheet]);

  // Load Notes & Discussions on Workspace Mount
  useEffect(() => {
    if (selectedChallenge) {
      // Notes
      apiRequest(`/coding/challenges/${selectedChallenge._id}/notes`)
        .then(res => setNotesInput(res.content || ''))
        .catch(err => console.error('Notes get error:', err.message));

      // Discussions
      apiRequest(`/coding/challenges/${selectedChallenge._id}/discussions`)
        .then(res => setDiscussions(res))
        .catch(err => console.error('Discussions get error:', err.message));
    }
  }, [selectedChallenge]);

  // Map selected language to CodeMirror language extension
  const getLanguageExtension = useCallback((lang) => {
    switch (lang) {
      case 'javascript': return [javascript()];
      case 'python': return [python()];
      case 'cpp':
      case 'c': return [cpp()];
      case 'java': return [java()];
      default: return [javascript()];
    }
  }, []);

  // Open Challenge workspace
  const handleOpenChallenge = (ch) => {
    setSelectedChallenge(ch);
    setResults(null);
    setAiOutput('');
    setWorkspaceTab('description');
    setConsoleTab('testcases');
    
    const tmpl = DEFAULT_TEMPLATES[language] || DEFAULT_TEMPLATES.javascript;
    setCode(tmpl);
    lastTemplateRef.current = tmpl;
    setView('editor');
  };

  const handleLanguageChange = (lang) => {
    if (code && code !== lastTemplateRef.current) {
      if (!window.confirm("You have modified your code. Changing the language will discard your changes. Do you want to proceed?")) {
        return;
      }
    }
    setLanguage(lang);
    const tmpl = DEFAULT_TEMPLATES[lang] || DEFAULT_TEMPLATES.javascript;
    setCode(tmpl);
    lastTemplateRef.current = tmpl;
  };

  const handleResetCode = () => {
    if (window.confirm("Are you sure you want to reset the editor to the default template?")) {
      const tmpl = DEFAULT_TEMPLATES[language] || DEFAULT_TEMPLATES.javascript;
      setCode(tmpl);
      lastTemplateRef.current = tmpl;
    }
  };

  // Clipboard copies
  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    addToast('Copied to Clipboard!', 'Your editor code is ready to paste.', 'success');
  };

  // Download code as file helper
  const handleDownloadCode = () => {
    const extensions = { javascript: 'js', python: 'py', cpp: 'cpp', java: 'java', c: 'c' };
    const ext = extensions[language] || 'txt';
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedChallenge?.title.replace(/\s+/g, '_')}_solution.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
    addToast('File Downloaded!', 'Source code saved to your local machine.', 'success');
  };

  // Bookmark problem handler
  const handleToggleBookmark = async (chId) => {
    try {
      const res = await apiRequest(`/coding/challenges/${chId}/bookmark`, { method: 'POST' });
      setProgressStats(prev => ({ ...prev, bookmarked: res.bookmarks }));
      addToast(res.isBookmarked ? 'Bookmarked!' : 'Bookmark Removed', '', 'info');
    } catch (err) {
      addToast('Error', err.message, 'error');
    }
  };

  // Favorite problem handler
  const handleToggleFavorite = async (chId) => {
    try {
      const res = await apiRequest(`/coding/challenges/${chId}/favorite`, { method: 'POST' });
      setProgressStats(prev => ({ ...prev, favorites: res.favorites }));
      addToast(res.isFavorite ? 'Added to Favorites' : 'Removed from Favorites', '', 'info');
    } catch (err) {
      addToast('Error', err.message, 'error');
    }
  };

  // Save Notes handler
  const handleSaveNotes = async () => {
    if (!selectedChallenge) return;
    try {
      await apiRequest(`/coding/challenges/${selectedChallenge._id}/notes`, {
        method: 'POST',
        body: JSON.stringify({ content: notesInput })
      });
      addToast('Notes Saved Successfully', 'Your annotations are updated.', 'success');
    } catch (err) {
      addToast('Error saving notes', err.message, 'error');
    }
  };

  // Post Discussion comment
  const handlePostComment = async () => {
    if (!commentInput.trim()) return;
    try {
      const res = await apiRequest(`/coding/challenges/${selectedChallenge._id}/discussions`, {
        method: 'POST',
        body: JSON.stringify({ content: commentInput })
      });
      setDiscussions(prev => [res, ...prev]);
      setCommentInput('');
      addToast('Comment Posted!', '', 'success');
    } catch (err) {
      addToast('Error posting comment', err.message, 'error');
    }
  };

  // Post Comment Reply
  const handlePostReply = async (commentId) => {
    const text = replyInput[commentId];
    if (!text || !text.trim()) return;
    try {
      const res = await apiRequest(`/coding/challenges/${selectedChallenge._id}/discussions/${commentId}/reply`, {
        method: 'POST',
        body: JSON.stringify({ content: text })
      });
      setDiscussions(prev => prev.map(d => d._id === commentId ? res : d));
      setReplyInput(prev => ({ ...prev, [commentId]: '' }));
      setReplyTargetId(null);
      addToast('Reply Posted!', '', 'success');
    } catch (err) {
      addToast('Error posting reply', err.message, 'error');
    }
  };

  // AI Prompt triggers
  const triggerAiAssistant = async (endpoint, payloadName) => {
    setAiLoading(true);
    setConsoleTab('ai_assistant');
    setAiOutput('Querying Gemini model AI engine to analyze your code...');
    
    try {
      const res = await apiRequest(`/coding/ai/${endpoint}`, {
        method: 'POST',
        body: JSON.stringify({
          code,
          language,
          title: selectedChallenge?.title
        })
      });
      setAiOutput(res[payloadName]);
    } catch (err) {
      addToast('AI Service Error', err.message, 'error');
      setAiOutput(`Failed to fetch AI insights: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleRunCode = async () => {
    if (!selectedChallenge) return;
    setSubmitting(true);
    setResults(null);
    setWorkspaceTab('submissions');

    try {
      const res = await apiRequest(`/coding/challenges/${selectedChallenge._id}/run`, {
        method: 'POST',
        body: JSON.stringify({ code, language })
      });

      setResults(res);
      if (res.allPassed) {
        addToast('All Tests Passed!', 'Good job! Check explanation walkthrough.', 'success');
        fetchProgress();
      } else {
        addToast('Tests Failed', 'Review outputs in the submissions console.', 'warning');
      }
    } catch (err) {
      addToast('Execution Error', err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Daily Challenge trigger
  const handleOpenDailyChallenge = async () => {
    try {
      const res = await apiRequest('/coding/daily-challenge');
      handleOpenChallenge(res);
    } catch (err) {
      addToast('Error fetching daily challenge', err.message, 'error');
    }
  };

  // Random problem trigger
  const handleOpenRandomChallenge = async () => {
    try {
      const res = await apiRequest('/coding/random-challenge');
      const data = await apiRequest(`/coding/challenges/${res.id}`);
      handleOpenChallenge(data);
    } catch (err) {
      addToast('Error fetching random challenge', err.message, 'error');
    }
  };

  // Resizable Panel Draggers
  const handleWidthMouseDown = (e) => {
    e.preventDefault();
    setIsResizingWidth(true);
  };

  const handleHeightMouseDown = (e) => {
    e.preventDefault();
    setIsResizingHeight(true);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizingWidth && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
        if (newWidth > 20 && newWidth < 80) setLeftWidth(newWidth);
      }
      
      if (isResizingHeight && rightContainerRef.current) {
        const containerRect = rightContainerRef.current.getBoundingClientRect();
        const newHeight = ((e.clientY - containerRect.top) / containerRect.height) * 100;
        if (newHeight > 20 && newHeight < 80) setEditorHeight(newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsResizingWidth(false);
      setIsResizingHeight(false);
    };

    if (isResizingWidth || isResizingHeight) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingWidth, isResizingHeight]);

  // Generates GitHub-style coding contributions calendar heatmap grid
  const heatmapGrid = useMemo(() => {
    const cells = [];
    const today = new Date();
    // 53 weeks = 371 days
    for (let dayOffset = 370; dayOffset >= 0; dayOffset--) {
      const day = new Date();
      day.setDate(today.getDate() - dayOffset);
      const dayStr = day.toISOString().split('T')[0];
      const hasSolved = progressStats.streakDates?.includes(dayStr);
      cells.push({ date: dayStr, solved: hasSolved });
    }
    return cells;
  }, [progressStats.streakDates]);

  return (
    <div className="space-y-6 font-outfit text-brand-textSec">
      
      {/* Top Header Navigation tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-white/5 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 rounded-lg bg-brand-indigo/10 border border-brand-indigo/25 text-brand-indigo shadow-[0_0_12px_rgba(99,102,241,0.2)]">
              <Code className="h-5 w-5" />
            </span>
            <h2 className="text-2xl font-black text-white tracking-tight">Coding Practice Hub</h2>
          </div>
          <p className="text-xs text-brand-textSec">Completely redesigned CodeMirror 6 SaaS-quality DSA coding sandbox playground</p>
        </div>

        <div className="flex flex-wrap gap-2 mt-4 lg:mt-0">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
            { id: 'arena', label: 'Problems Arena', icon: ClipboardList },
            { id: 'contests', label: 'Contests', icon: Trophy },
            { id: 'achievements', label: 'Achievements', icon: Award },
            { id: 'leaderboard', label: 'Standings', icon: Award }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setView(tab.id);
                setSelectedChallenge(null);
                setIsFullscreen(false);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                view === tab.id
                  ? 'bg-brand-indigo border-brand-indigo text-white shadow-lg shadow-brand-indigo/25'
                  : 'bg-white/[0.02] border-white/5 text-brand-textSec hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <tab.icon className="h-4 w-4" /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* DASHBOARD TAB SCREEN */}
      {view === 'dashboard' && (
        <div className="space-y-6">
          {/* Progress overview stats row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Streak Counter */}
            <GlassCard className="border-white/5 bg-brand-card/70 p-5 flex flex-col justify-between h-40">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-xs text-brand-textSec/50 uppercase tracking-widest font-black mb-1">Solved Streak</h4>
                  <span className="text-3xl font-black text-white tracking-tight">{progressStats.streakCount} Days</span>
                </div>
                <Zap className="h-6 w-6 text-brand-amber animate-pulse" />
              </div>
              <p className="text-[10px] text-brand-textSec/60">Solve questions daily to increment streaks count standings.</p>
            </GlassCard>

            {/* Solved counters breakdown */}
            <GlassCard className="border-white/5 bg-brand-card/70 p-5 flex flex-col justify-between h-40 col-span-2">
              <div>
                <h4 className="text-xs text-brand-textSec/50 uppercase tracking-widest font-black mb-3">Questions Solved Counters</h4>
                <div className="grid grid-cols-3 gap-2.5 text-center">
                  <div className="bg-brand-emerald/10 border border-brand-emerald/20 p-2 rounded-xl">
                    <span className="text-lg font-black text-brand-emerald block">{progressStats.easySolved}</span>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-brand-textSec/70">Easy</span>
                  </div>
                  <div className="bg-brand-amber/10 border border-brand-amber/20 p-2 rounded-xl">
                    <span className="text-lg font-black text-brand-amber block">{progressStats.mediumSolved}</span>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-brand-textSec/70">Medium</span>
                  </div>
                  <div className="bg-brand-rose/10 border border-brand-rose/20 p-2 rounded-xl">
                    <span className="text-lg font-black text-brand-rose block">{progressStats.hardSolved}</span>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-brand-textSec/70">Hard</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center text-[10px] border-t border-white/5 pt-2 mt-2">
                <span className="font-bold text-white">Total Completed: {progressStats.totalSolved} / 306</span>
                <span className="text-brand-indigo font-bold">{Math.round((progressStats.totalSolved / 306) * 100)}% Complete</span>
              </div>
            </GlassCard>

            {/* Challenge helpers buttons */}
            <GlassCard className="border-white/5 bg-brand-card/70 p-5 flex flex-col justify-between h-40">
              <div>
                <h4 className="text-xs text-brand-textSec/50 uppercase tracking-widest font-black mb-2">Practice Shortcuts</h4>
                <div className="space-y-2">
                  <button 
                    onClick={handleOpenDailyChallenge}
                    className="w-full py-2 bg-brand-indigo text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 shadow-md hover:bg-brand-indigo/90 transition-all"
                  >
                    <Calendar className="h-3.5 w-3.5" /> Daily Challenge
                  </button>
                  <button 
                    onClick={handleOpenRandomChallenge}
                    className="w-full py-2 bg-white/[0.04] border border-white/5 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 hover:bg-white/[0.08] transition-all"
                  >
                    <RotateCcw className="h-3.5 w-3.5 animate-spin" /> Random Problem
                  </button>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* GitHub-style Coding submission Heatmap contribution grid */}
          <GlassCard className="border-white/5 bg-brand-card/70 p-5">
            <h3 className="font-bold text-xs text-white uppercase tracking-widest mb-3 flex items-center gap-2">
              <Calendar className="h-4.5 w-4.5 text-brand-indigo" /> Coding Practice Activity Heatmap
            </h3>
            <div className="flex flex-wrap gap-1 overflow-x-auto py-1 scrollbar-thin h-28 max-w-full">
              {heatmapGrid.map((c, i) => (
                <div
                  key={i}
                  title={`Date: ${c.date}`}
                  className={`w-3.5 h-3.5 rounded flex-shrink-0 transition-all ${
                    c.solved 
                      ? 'bg-brand-indigo shadow-[0_0_6px_rgba(99,102,241,0.6)]' 
                      : 'bg-white/[0.03] border border-white/5 hover:bg-white/[0.07]'
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-between items-center text-[10px] text-brand-textSec/50 mt-2">
              <span>Heatmap displaying submissions calendar over the past year.</span>
              <div className="flex gap-2 items-center">
                <span>Less</span>
                <span className="w-3 h-3 rounded bg-white/[0.03] border border-white/5 inline-block" />
                <span className="w-3 h-3 rounded bg-brand-indigo inline-block" />
                <span>More</span>
              </div>
            </div>
          </GlassCard>

          {/* Bookmarks, favorites, recently solved panels */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recently Solved */}
            <GlassCard className="border-white/5 bg-brand-card/70 p-5">
              <h3 className="font-bold text-xs text-white uppercase tracking-widest mb-3.5 flex items-center gap-2">
                <Bookmark className="h-4 w-4 text-brand-indigo" /> Recently Solved
              </h3>
              <div className="space-y-2.5 max-h-56 overflow-y-auto scrollbar-thin">
                {progressStats.recentlySolved.length === 0 ? (
                  <p className="text-xs text-brand-textSec/40 italic py-2">No problems solved yet.</p>
                ) : (
                  progressStats.recentlySolved.map((rec, i) => (
                    <div key={i} className="flex justify-between items-center text-xs p-2 border border-white/5 rounded-lg bg-white/[0.01]">
                      <span className="font-bold text-white/90 truncate max-w-[160px]">Challenge Solved</span>
                      <span className="text-[10px] text-brand-textSec/50">{new Date(rec.solvedAt).toLocaleDateString()}</span>
                    </div>
                  ))
                )}
              </div>
            </GlassCard>

            {/* Bookmarked */}
            <GlassCard className="border-white/5 bg-brand-card/70 p-5">
              <h3 className="font-bold text-xs text-white uppercase tracking-widest mb-3.5 flex items-center gap-2">
                <Tag className="h-4 w-4 text-brand-amber" /> Bookmarked Problems
              </h3>
              <div className="space-y-2.5 max-h-56 overflow-y-auto scrollbar-thin">
                {progressStats.bookmarked.length === 0 ? (
                  <p className="text-xs text-brand-textSec/40 italic py-2">No bookmarked problems.</p>
                ) : (
                  progressStats.bookmarked.map((bId) => (
                    <div 
                      key={bId} 
                      onClick={() => {
                        const challenge = challenges.find(ch => ch._id === bId);
                        if (challenge) handleOpenChallenge(challenge);
                      }}
                      className="cursor-pointer hover:bg-white/[0.03] transition-all flex justify-between items-center text-xs p-2.5 border border-white/5 rounded-lg bg-white/[0.01]"
                    >
                      <span className="font-bold text-white truncate max-w-[170px]">{bId}</span>
                      <Bookmark className="h-3.5 w-3.5 text-brand-indigo fill-brand-indigo flex-shrink-0" />
                    </div>
                  ))
                )}
              </div>
            </GlassCard>

            {/* Favorites */}
            <GlassCard className="border-white/5 bg-brand-card/70 p-5">
              <h3 className="font-bold text-xs text-white uppercase tracking-widest mb-3.5 flex items-center gap-2">
                <Heart className="h-4 w-4 text-brand-rose" /> Favorite Problems
              </h3>
              <div className="space-y-2.5 max-h-56 overflow-y-auto scrollbar-thin">
                {progressStats.favorites.length === 0 ? (
                  <p className="text-xs text-brand-textSec/40 italic py-2">No favorite problems.</p>
                ) : (
                  progressStats.favorites.map((fId) => (
                    <div 
                      key={fId}
                      onClick={() => {
                        const challenge = challenges.find(ch => ch._id === fId);
                        if (challenge) handleOpenChallenge(challenge);
                      }}
                      className="cursor-pointer hover:bg-white/[0.03] transition-all flex justify-between items-center text-xs p-2.5 border border-white/5 rounded-lg bg-white/[0.01]"
                    >
                      <span className="font-bold text-white truncate max-w-[170px]">{fId}</span>
                      <Heart className="h-3.5 w-3.5 text-brand-rose fill-brand-rose flex-shrink-0" />
                    </div>
                  ))
                )}
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {/* PROBLEMS ARENA FILTER AND GRID SCREEN */}
      {view === 'arena' && (
        <div className="space-y-6">
          {/* Advanced Filter Toolbar */}
          <GlassCard className="border-white/5 bg-brand-card/70 p-4">
            <div className="flex flex-col gap-4">
              {/* Study Sheets Tabs Bar */}
              <div className="flex flex-wrap border-b border-white/5 pb-2 gap-1.5">
                {STUDY_SHEETS.map(sheet => (
                  <button
                    key={sheet.id}
                    onClick={() => setSelectedSheet(sheet.id)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
                      selectedSheet === sheet.id
                        ? 'bg-brand-indigo/10 border-brand-indigo/35 text-brand-indigo shadow-[0_0_12px_rgba(99,102,241,0.15)]'
                        : 'bg-white/[0.01] border-white/5 text-brand-textSec hover:text-white'
                    }`}
                  >
                    {sheet.name}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4 items-center">
                {/* Search input */}
                <div className="relative w-full md:w-1/3">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-brand-textSec/60" />
                  <input
                    type="text"
                    placeholder="Search problem title..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-white placeholder-brand-textSec/45 focus:outline-none focus:border-brand-indigo/40 focus:ring-1 focus:ring-brand-indigo/20 transition-all"
                  />
                </div>

                {/* Category Dropdown */}
                <div className="w-full md:w-1/4">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-brand-dark border border-white/5 text-xs text-brand-textSec px-3 py-2.5 rounded-xl focus:outline-none focus:border-brand-indigo/40"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat} className="bg-brand-dark">{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Difficulty Dropdown */}
                <div className="w-full md:w-1/6">
                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    className="w-full bg-brand-dark border border-white/5 text-xs text-brand-textSec px-3 py-2.5 rounded-xl focus:outline-none focus:border-brand-indigo/40"
                  >
                    <option value="All" className="bg-brand-dark">All Difficulties</option>
                    <option value="Easy" className="bg-brand-dark">Easy</option>
                    <option value="Medium" className="bg-brand-dark">Medium</option>
                    <option value="Hard" className="bg-brand-dark">Hard</option>
                  </select>
                </div>

                {/* Company Dropdown */}
                <div className="w-full md:w-1/5">
                  <select
                    value={selectedCompany}
                    onChange={(e) => setSelectedCompany(e.target.value)}
                    className="w-full bg-brand-dark border border-white/5 text-xs text-brand-textSec px-3 py-2.5 rounded-xl focus:outline-none focus:border-brand-indigo/40"
                  >
                    {COMPANIES.map(comp => (
                      <option key={comp} value={comp} className="bg-brand-dark">{comp}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-brand-indigo/10 border border-brand-indigo/25 text-brand-indigo hover:bg-brand-indigo hover:text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <SlidersHorizontal className="h-4 w-4" /> Filter
                </button>
              </form>
            </div>
          </GlassCard>

          {/* Tabular Problems List */}
          {loading ? (
            <CardSkeleton className="h-[450px]" />
          ) : challenges.length === 0 ? (
            <GlassCard className="text-center py-16 border-white/5">
              <p className="text-sm text-brand-textSec/60 mb-2">No coding challenges found matching your filter parameters.</p>
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('All Topics');
                  setSelectedDifficulty('All');
                  setSelectedCompany('All Companies');
                  setSelectedSheet('all');
                }}
                className="text-xs text-brand-indigo hover:underline font-bold"
              >
                Clear all filters
              </button>
            </GlassCard>
          ) : (
            <GlassCard className="border-white/5 bg-brand-card/45 p-0 overflow-hidden">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/5 text-brand-textSec/60 font-bold bg-white/[0.01]">
                      <th className="py-4 px-5 uppercase tracking-wider text-[10px]">Title</th>
                      <th className="py-4 px-5 uppercase tracking-wider text-[10px]">Difficulty</th>
                      <th className="py-4 px-5 uppercase tracking-wider text-[10px]">Category</th>
                      <th className="py-4 px-5 uppercase tracking-wider text-[10px]">Bookmark</th>
                      <th className="py-4 px-5 text-right uppercase tracking-wider text-[10px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-brand-textSec">
                    {challenges.map(ch => {
                      const isBookmarked = progressStats.bookmarked?.includes(ch._id);
                      return (
                        <tr key={ch._id} className="hover:bg-white/[0.015] transition-colors">
                          <td className="py-4 px-5 font-bold text-white">
                            <span 
                              onClick={() => handleOpenChallenge(ch)}
                              className="cursor-pointer hover:text-brand-indigo transition-colors"
                            >
                              {ch.title}
                            </span>
                          </td>
                          <td className="py-4 px-5">
                            <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border ${
                              ch.difficulty === 'Easy' ? 'bg-brand-emerald/10 border-brand-emerald/20 text-brand-emerald' :
                              ch.difficulty === 'Medium' ? 'bg-brand-amber/10 border-brand-amber/20 text-brand-amber' :
                              'bg-brand-rose/10 border-brand-rose/20 text-brand-rose'
                            }`}>
                              {ch.difficulty}
                            </span>
                          </td>
                          <td className="py-4 px-5 text-white/60">{ch.category}</td>
                          <td className="py-4 px-5">
                            <button onClick={() => handleToggleBookmark(ch._id)}>
                              <Bookmark className={`h-4.5 w-4.5 transition-all ${isBookmarked ? 'text-brand-indigo fill-brand-indigo' : 'text-brand-textSec/40'}`} />
                            </button>
                          </td>
                          <td className="py-4 px-5 text-right">
                            <button
                              onClick={() => handleOpenChallenge(ch)}
                              className="py-1 px-3 bg-brand-indigo text-white font-bold text-[10px] rounded hover:bg-brand-indigo/90 transition-all shadow-md shadow-brand-indigo/10"
                            >
                              Solve Problem
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          )}
        </div>
      )}

      {/* CONTEST TAB SCREEN */}
      {view === 'contests' && (
        <div className="space-y-6">
          <GlassCard className="border-white/5 bg-brand-card/70 p-5">
            <h3 className="font-bold text-sm text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-brand-amber animate-bounce" /> Coding Contests Landing Arena
            </h3>
            <p className="text-xs leading-relaxed text-brand-textSec/80 mb-5">
              Participate in weekly competitive coding contests to test speed, complexity metrics, and standings indexes.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contest Card 1 */}
              <div className="p-4 border border-white/5 rounded-xl bg-white/[0.01] flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-sm text-white">InterviewAI Weekly Contest 42</h4>
                    <span className="text-[8px] bg-brand-rose/15 border border-brand-rose/30 text-brand-rose px-2 py-0.5 rounded uppercase font-black tracking-wider">Upcoming</span>
                  </div>
                  <p className="text-xs text-brand-textSec/60">Duration: 90 Minutes | 4 Coding Problems</p>
                </div>
                <div className="mt-4 flex justify-between items-center text-[10px] text-brand-textSec/50 border-t border-white/5 pt-2">
                  <span>Start Time: Tomorrow 8:00 PM</span>
                  <button disabled className="px-3 py-1 bg-white/[0.03] border border-white/5 rounded font-bold text-white/50 cursor-not-allowed">Register</button>
                </div>
              </div>

              {/* Contest Card 2 */}
              <div className="p-4 border border-white/5 rounded-xl bg-white/[0.01] flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-sm text-white">Biweekly Speedrun Challenge 18</h4>
                    <span className="text-[8px] bg-brand-emerald/15 border border-brand-emerald/30 text-brand-emerald px-2 py-0.5 rounded uppercase font-black tracking-wider">Completed</span>
                  </div>
                  <p className="text-xs text-brand-textSec/60">Duration: 60 Minutes | 3 Coding Problems</p>
                </div>
                <div className="mt-4 flex justify-between items-center text-[10px] text-brand-textSec/50 border-t border-white/5 pt-2">
                  <span>Finished: 3 days ago</span>
                  <button onClick={() => setView('arena')} className="px-3 py-1 bg-brand-indigo text-white rounded font-bold hover:bg-brand-indigo/90 transition-all">Solve Archive</button>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* ACHIEVEMENTS TAB SCREEN */}
      {view === 'achievements' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: 'Code Solver', description: 'Evaluate and pass all test cases on any coding problem.', icon: Award, progress: 100, unlocked: true },
            { title: 'Algorithms Specialist', description: 'Solve 20 algorithms challenges.', icon: Trophy, progress: 30, unlocked: false },
            { title: 'Daily Streak Champion', description: 'Maintain a consecutive solving streak of 5 days.', icon: Zap, progress: progressStats.streakCount * 20, unlocked: progressStats.streakCount >= 5 }
          ].map((ach, idx) => (
            <GlassCard key={idx} className={`border-white/5 bg-brand-card/70 p-5 flex flex-col justify-between h-44 ${ach.unlocked ? '' : 'opacity-65'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-sm text-white mb-1">{ach.title}</h4>
                  <p className="text-[11px] text-brand-textSec/60 leading-relaxed pr-6">{ach.description}</p>
                </div>
                <ach.icon className={`h-7 w-7 ${ach.unlocked ? 'text-brand-amber animate-pulse' : 'text-white/20'}`} />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] font-bold">
                  <span className={ach.unlocked ? 'text-brand-indigo' : 'text-brand-textSec/50'}>{ach.unlocked ? 'UNLOCKED' : 'IN PROGRESS'}</span>
                  <span>{ach.progress}%</span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-indigo rounded-full transition-all duration-500" style={{ width: `${ach.progress}%` }} />
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* LEADERBOARD STANDINGS TAB SCREEN */}
      {view === 'leaderboard' && (
        <div className="max-w-3xl mx-auto">
          <GlassCard className="border-white/5 bg-brand-card">
            <h3 className="font-bold text-sm text-white mb-5 flex items-center gap-2.5 uppercase tracking-wider">
              <Award className="h-5 w-5 text-brand-amber animate-pulse" /> Competitive Practice Standings
            </h3>
            
            <div className="overflow-x-auto w-full border border-white/5 rounded-xl bg-white/[0.01]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-brand-textSec font-bold bg-white/[0.02]">
                    <th className="py-3.5 px-4 uppercase tracking-wider text-[10px]">Rank</th>
                    <th className="py-3.5 px-4 uppercase tracking-wider text-[10px]">Candidate Developer</th>
                    <th className="py-3.5 px-4 uppercase tracking-wider text-[10px]">Solved Problems</th>
                    <th className="py-3.5 px-4 text-right uppercase tracking-wider text-[10px]">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-brand-textSec">
                  {progressStats.leaderboard?.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-brand-textSec/50">Solve challenges to record score standings points!</td>
                    </tr>
                  ) : (
                    progressStats.leaderboard?.map((player, index) => (
                      <tr key={index} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white/50">{index + 1}</td>
                        <td className="py-3.5 px-4 flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-brand-indigo/20 border border-brand-indigo/35 flex items-center justify-center font-bold text-brand-indigo uppercase text-[10px]">
                            {player.name.charAt(0)}
                          </div>
                          <span className="font-bold text-white">{player.name}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-white font-medium">{player.totalSolved}</span>
                          <span className="text-[10px] text-brand-textSec/60 ml-1.5">
                            ({player.easySolved}E / {player.mediumSolved}M / {player.hardSolved}H)
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-brand-indigo">{player.score} pts</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </GlassCard>
        </div>
      )}

      {/* CORE WORKSPACE SPLIT PANEL VIEW */}
      {view === 'editor' && selectedChallenge && (
        <div 
          ref={workspaceRef}
          className={`flex flex-col lg:flex-row w-full gap-0 border border-white/5 rounded-2xl overflow-hidden bg-brand-darkSec/50 backdrop-blur-xl transition-all ${
            isFullscreen ? 'fixed inset-0 z-50 h-screen w-screen rounded-none bg-brand-dark/95' : 'h-[680px]'
          }`}
        >
          {/* Left panel: Description, Discussions, Notes, Submissions */}
          <div 
            style={{ width: isFullscreen ? '30%' : `${leftWidth}%` }}
            className="flex flex-col h-full border-r border-white/5 bg-brand-dark/20 overflow-hidden"
          >
            {/* Left Panel Tabs selectors */}
            <div className="flex border-b border-white/5 bg-brand-card/25 p-1 gap-1">
              {[
                { id: 'description', label: 'Problem Details', icon: Code },
                { id: 'submissions', label: 'Submissions', icon: ClipboardList },
                { id: 'discussion', label: 'Discussion', icon: MessageSquare },
                { id: 'notes', label: 'Notes', icon: FileText }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setWorkspaceTab(tab.id)}
                  className={`flex-1 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all ${
                    workspaceTab === tab.id
                      ? 'bg-brand-indigo text-white shadow-md shadow-brand-indigo/15'
                      : 'text-brand-textSec/60 hover:text-white'
                  }`}
                >
                  <tab.icon className="h-3 w-3" /> {tab.label}
                </button>
              ))}
            </div>

            {/* Left Panel Content */}
            <div className="flex-1 p-5 overflow-y-auto scrollbar-thin leading-relaxed text-xs">
              
              {/* Tab: Problem Description */}
              {workspaceTab === 'description' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-start border-b border-white/5 pb-3">
                    <div>
                      <h3 className="font-black text-base text-white">{selectedChallenge.title}</h3>
                      <span className="text-[10px] text-brand-indigo font-bold bg-brand-indigo/10 border border-brand-indigo/25 px-2 py-0.5 rounded mt-1.5 inline-block">
                        {selectedChallenge.category}
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      selectedChallenge.difficulty === 'Easy' ? 'bg-brand-emerald/10 border-brand-emerald/20 text-brand-emerald' :
                      selectedChallenge.difficulty === 'Medium' ? 'bg-brand-amber/10 border-brand-amber/20 text-brand-amber' :
                      'bg-brand-rose/10 border-brand-rose/20 text-brand-rose'
                    }`}>
                      {selectedChallenge.difficulty}
                    </span>
                  </div>

                  {/* Bookmark and Favorite buttons inside workspace */}
                  <div className="flex gap-2 border-b border-white/5 pb-3">
                    <button 
                      onClick={() => handleToggleBookmark(selectedChallenge._id)}
                      className="px-2.5 py-1 bg-white/[0.03] border border-white/5 rounded text-[10px] font-bold flex items-center gap-1 hover:text-white"
                    >
                      <Bookmark className={`h-3.5 w-3.5 ${progressStats.bookmarked?.includes(selectedChallenge._id) ? 'text-brand-indigo fill-brand-indigo' : ''}`} /> Bookmark
                    </button>
                    <button 
                      onClick={() => handleToggleFavorite(selectedChallenge._id)}
                      className="px-2.5 py-1 bg-white/[0.03] border border-white/5 rounded text-[10px] font-bold flex items-center gap-1 hover:text-white"
                    >
                      <Heart className={`h-3.5 w-3.5 ${progressStats.favorites?.includes(selectedChallenge._id) ? 'text-brand-rose fill-brand-rose' : ''}`} /> Favorite
                    </button>
                  </div>

                  {/* Company Pill Badges */}
                  {selectedChallenge.companyTags && selectedChallenge.companyTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="text-[9px] text-brand-textSec/50 uppercase font-black mr-1">Asked In:</span>
                      {selectedChallenge.companyTags.map(tag => (
                        <span key={tag} className="text-[9px] font-bold px-2 py-0.5 rounded bg-white/[0.04] border border-white/5 text-white/70">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Description Markdown statement */}
                  <div className="whitespace-pre-line text-brand-textSec/90 leading-relaxed font-outfit">
                    {selectedChallenge.description}
                  </div>
                </div>
              )}

              {/* Tab: Submissions results */}
              {workspaceTab === 'submissions' && (
                <div className="space-y-4">
                  {results ? (
                    <div className="space-y-3">
                      <div className={`p-3.5 rounded-xl border font-bold flex items-center gap-2 ${
                        results.allPassed ? 'bg-brand-emerald/10 border-brand-emerald/20 text-brand-emerald' : 'bg-brand-rose/10 border-brand-rose/20 text-brand-rose'
                      }`}>
                        {results.allPassed ? (
                          <>
                            <CheckCircle className="h-5 w-5" /> All Test Cases Evaluated Successfully!
                          </>
                        ) : (
                          <>
                            <XCircle className="h-5 w-5" /> Test Case Evaluation Failed.
                          </>
                        )}
                      </div>

                      <div className="space-y-2">
                        {results.results?.map((r, i) => (
                          <div key={i} className="p-3 bg-white/[0.01] border border-white/5 rounded-xl font-mono text-[11px] space-y-1">
                            <div className="flex justify-between border-b border-white/5 pb-1 text-white/40">
                              <span>Test Case {i + 1}</span>
                              <span className={r.passed ? 'text-brand-emerald' : 'text-brand-rose'}>{r.passed ? 'PASSED' : 'FAILED'}</span>
                            </div>
                            <p><span className="text-white/40">Input:</span> {r.input}</p>
                            <p><span className="text-white/40">Expected:</span> {r.expected}</p>
                            <p><span className="text-white/40">Actual:</span> {r.actual}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-brand-textSec/40 italic py-6 text-center">Compile and run your solution code to evaluate test cases.</p>
                  )}
                </div>
              )}

              {/* Tab: Discussions section */}
              {workspaceTab === 'discussion' && (
                <div className="space-y-4">
                  {/* Write comment */}
                  <div className="space-y-2">
                    <textarea
                      placeholder="Post a constructive comment on this challenge..."
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      className="w-full p-2 bg-white/[0.02] border border-white/5 rounded-xl text-xs focus:outline-none focus:border-brand-indigo/40 h-16 resize-none"
                    />
                    <button
                      onClick={handlePostComment}
                      className="px-3 py-1.5 bg-brand-indigo text-white font-bold text-[10px] rounded hover:bg-brand-indigo/90 transition-all shadow-md"
                    >
                      Post Comment
                    </button>
                  </div>

                  {/* Comments lists */}
                  <div className="space-y-3.5 mt-4 divide-y divide-white/5">
                    {discussions.map(disc => (
                      <div key={disc._id} className="pt-3.5 space-y-2">
                        <div className="flex justify-between text-[10px] text-brand-textSec/50 font-bold">
                          <span className="text-white">{disc.userName}</span>
                          <span>{new Date(disc.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-brand-textSec/80">{disc.content}</p>
                        
                        {/* Replies */}
                        {disc.replies && disc.replies.length > 0 && (
                          <div className="ml-5 mt-2 border-l border-white/5 pl-3.5 space-y-2">
                            {disc.replies.map((reply, rIdx) => (
                              <div key={rIdx} className="space-y-1">
                                <div className="flex justify-between text-[9px] text-brand-textSec/40 font-bold">
                                  <span className="text-white/70">{reply.userName}</span>
                                  <span>{new Date(reply.createdAt).toLocaleDateString()}</span>
                                </div>
                                <p className="text-[11px] text-brand-textSec/75">{reply.content}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Reply trigger */}
                        <div className="mt-1">
                          {replyTargetId === disc._id ? (
                            <div className="flex gap-2 items-center mt-2 pl-5">
                              <input
                                type="text"
                                placeholder="Write reply..."
                                value={replyInput[disc._id] || ''}
                                onChange={(e) => setReplyInput(prev => ({ ...prev, [disc._id]: e.target.value }))}
                                className="flex-1 p-1 bg-white/[0.03] border border-white/5 rounded text-[11px] focus:outline-none"
                              />
                              <button 
                                onClick={() => handlePostReply(disc._id)}
                                className="px-2.5 py-1 bg-brand-indigo text-white rounded text-[9px] font-bold"
                              >
                                Reply
                              </button>
                              <button 
                                onClick={() => setReplyTargetId(null)}
                                className="text-[9px] text-brand-textSec hover:text-white"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => setReplyTargetId(disc._id)}
                              className="text-[9px] text-brand-indigo hover:underline mt-1 block"
                            >
                              Reply to thread
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab: Personal Notes */}
              {workspaceTab === 'notes' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-[10px] text-white/50 uppercase tracking-widest">Study Notes Editor</h4>
                  <textarea
                    placeholder="Write down details, complexity annotations, or algorithms pointers for study reference..."
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    className="w-full h-80 p-3 bg-white/[0.02] border border-white/5 rounded-xl font-mono text-[11px] focus:outline-none focus:border-brand-indigo/40 resize-none leading-relaxed"
                  />
                  <button
                    onClick={handleSaveNotes}
                    className="w-full py-2 bg-brand-indigo text-white font-bold text-xs rounded-xl shadow-md hover:bg-brand-indigo/90 transition-all flex items-center justify-center gap-1"
                  >
                    <FileText className="h-4 w-4" /> Save Annotations
                  </button>
                </div>
              )}

            </div>
          </div>

          {/* Draggable panel width divider */}
          <div 
            className="w-1.5 cursor-col-resize hover:bg-brand-indigo bg-white/5 transition-colors h-full flex items-center justify-center group"
            onMouseDown={handleWidthMouseDown}
          >
            <div className="h-6 w-1 rounded bg-white/10 group-hover:bg-white/40"></div>
          </div>

          {/* Right Panel: Workspace CodeMirror 6 Editor & Console Output */}
          <div 
            ref={rightContainerRef}
            style={{ width: isFullscreen ? '70%' : `${100 - leftWidth}%` }}
            className="flex flex-col h-full overflow-hidden bg-brand-dark/10"
          >
            
            {/* Editor Code Playgrounds */}
            <div 
              style={{ height: `${editorHeight}%` }}
              className="flex flex-col min-h-[150px] p-4 overflow-hidden border-b border-white/5 bg-brand-card/10"
            >
              {/* Toolbar */}
              <div className="flex flex-wrap justify-between items-center border-b border-white/5 pb-3 mb-3 gap-2 flex-shrink-0">
                <div className="flex flex-wrap gap-2 items-center">
                  {/* Language selection */}
                  <select
                    value={language}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="bg-brand-dark border border-white/5 text-xs font-bold text-brand-textSec px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-brand-indigo/40"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="cpp">C++</option>
                    <option value="java">Java</option>
                    <option value="c">C</option>
                  </select>

                  {/* Theme toggles */}
                  <button
                    onClick={() => setEditorTheme(prev => prev === 'vs-dark' ? 'light' : 'vs-dark')}
                    title="Toggle Editor Theme"
                    className="p-1.5 bg-brand-dark border border-white/5 rounded-lg text-brand-textSec hover:text-white transition-colors"
                  >
                    {editorTheme === 'vs-dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </button>

                  {/* Font Size selectors */}
                  <div className="flex items-center gap-1.5 px-2 bg-brand-dark border border-white/5 rounded-lg text-brand-textSec text-[10px] font-bold">
                    <Type className="h-3.5 w-3.5" />
                    <select 
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      className="bg-transparent border-none text-[10px] font-bold focus:outline-none pr-1"
                    >
                      {[12, 13, 14, 15, 16, 18, 20].map(sz => (
                        <option key={sz} value={sz} className="bg-brand-dark">{sz}px</option>
                      ))}
                    </select>
                  </div>

                  {/* Editor Utility Buttons (Reset, Copy, Download) */}
                  <button 
                    onClick={handleResetCode} 
                    title="Reset Template Code"
                    className="p-1.5 bg-brand-dark border border-white/5 rounded-lg text-brand-textSec hover:text-white transition-colors flex items-center"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                  <button 
                    onClick={handleCopyCode} 
                    title="Copy Editor Code"
                    className="p-1.5 bg-brand-dark border border-white/5 rounded-lg text-brand-textSec hover:text-white transition-colors flex items-center"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button 
                    onClick={handleDownloadCode} 
                    title="Download Code File"
                    className="p-1.5 bg-brand-dark border border-white/5 rounded-lg text-brand-textSec hover:text-white transition-colors flex items-center"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                  <button 
                    onClick={() => setIsFullscreen(prev => !prev)} 
                    title="Toggle Fullscreen Workspace"
                    className="p-1.5 bg-brand-dark border border-white/5 rounded-lg text-brand-textSec hover:text-white transition-colors flex items-center"
                  >
                    {isFullscreen ? <Minimize2 className="h-3.5 w-3.5 text-brand-indigo" /> : <Maximize2 className="h-3.5 w-3.5" />}
                  </button>
                </div>

                <button
                  onClick={handleRunCode}
                  disabled={submitting}
                  className="py-1.5 px-4 rounded-lg bg-brand-indigo hover:bg-brand-indigo/90 disabled:bg-brand-indigo/60 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-lg shadow-brand-indigo/25"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5 fill-white text-white" />
                      Run Code
                    </>
                  )}
                </button>
              </div>

              {/* CodeMirror Editor Instance */}
              <div className="flex-1 w-full rounded-xl overflow-hidden border border-white/5 shadow-inner bg-[#1e1e1e] flex flex-col relative h-[calc(100%-55px)]">
                <CodeMirror
                  value={code}
                  height="100%"
                  theme={editorTheme === 'vs-dark' ? vscodeDark : vscodeLight}
                  extensions={getLanguageExtension(language)}
                  onChange={(val) => setCode(val)}
                  style={{
                    fontSize: `${fontSize}px`,
                    fontFamily: 'Consolas, Courier New, monospace',
                    height: '100%',
                    width: '100%'
                  }}
                />
                <span className="absolute bottom-2 right-4 text-[9px] uppercase tracking-widest font-black text-brand-indigo/40 pointer-events-none select-none px-2 py-0.5 rounded border border-brand-indigo/10 bg-brand-indigo/5">
                  CodeMirror 6 Engine
                </span>
              </div>
            </div>

            {/* Vertical drag height divider */}
            <div 
              className="h-1.5 cursor-row-resize hover:bg-brand-indigo bg-white/5 transition-colors w-full flex items-center justify-center group"
              onMouseDown={handleHeightMouseDown}
            >
              <div className="w-8 h-1 rounded bg-white/10 group-hover:bg-white/40"></div>
            </div>

            {/* Lower panel: Console test cases / AI evaluation insights */}
            <div 
              style={{ height: `${100 - editorHeight}%` }}
              className="flex-1 p-4 overflow-y-auto scrollbar-thin flex flex-col min-h-[120px] bg-brand-dark/15"
            >
              {/* Lower Console Tabs selectors */}
              <div className="flex border-b border-white/5 pb-2 mb-3.5 gap-2 items-center justify-between flex-shrink-0">
                <div className="flex gap-2">
                  <button 
                    onClick={() => setConsoleTab('testcases')}
                    className={`py-1 px-3 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                      consoleTab === 'testcases' ? 'bg-brand-indigo/15 text-brand-indigo border border-brand-indigo/35' : 'text-brand-textSec/50 hover:text-white'
                    }`}
                  >
                    <Terminal className="h-3.5 w-3.5" /> Compiler Console
                  </button>
                  <button 
                    onClick={() => setConsoleTab('ai_assistant')}
                    className={`py-1 px-3 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                      consoleTab === 'ai_assistant' ? 'bg-brand-indigo/15 text-brand-indigo border border-brand-indigo/35' : 'text-brand-textSec/50 hover:text-white'
                    }`}
                  >
                    <Sparkles className="h-3.5 w-3.5" /> AI Gemini Assistant
                  </button>
                </div>
                
                {/* AI Prompts Shortcuts inside Editor toolbar */}
                {consoleTab === 'ai_assistant' && (
                  <div className="flex gap-1.5">
                    <button 
                      onClick={() => triggerAiAssistant('hint', 'hint')}
                      className="px-2 py-0.5 bg-white/[0.03] border border-white/5 hover:text-white rounded text-[9px] font-bold"
                    >
                      AI Hint
                    </button>
                    <button 
                      onClick={() => triggerAiAssistant('explain', 'explanation')}
                      className="px-2 py-0.5 bg-white/[0.03] border border-white/5 hover:text-white rounded text-[9px] font-bold"
                    >
                      AI Explain Code
                    </button>
                    <button 
                      onClick={() => triggerAiAssistant('optimize', 'optimizedCode')}
                      className="px-2 py-0.5 bg-white/[0.03] border border-white/5 hover:text-white rounded text-[9px] font-bold"
                    >
                      AI Optimize
                    </button>
                    <button 
                      onClick={() => triggerAiAssistant('complexity', 'complexity')}
                      className="px-2 py-0.5 bg-white/[0.03] border border-white/5 hover:text-white rounded text-[9px] font-bold"
                    >
                      AI Big-O Complexity
                    </button>
                  </div>
                )}
              </div>

              {/* Console Tabs Contents */}
              
              {/* Tab Content: Compiler Console outputs */}
              {consoleTab === 'testcases' && (
                <div className="space-y-3">
                  {results ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {results.results?.map((r, i) => (
                        <div
                          key={i}
                          className={`p-3 rounded-xl border flex items-center justify-between text-xs font-semibold ${
                            r.passed ? 'bg-brand-emerald/10 border-brand-emerald/20 text-brand-emerald' : 'bg-brand-rose/10 border-brand-rose/20 text-brand-rose'
                          }`}
                        >
                          <span>Test Case {i + 1}</span>
                          {r.passed ? <CheckCircle className="h-4.5 w-4.5" /> : <XCircle className="h-4.5 w-4.5" />}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-brand-textSec/40 py-6 text-center">Run code to compile templates and print outputs.</p>
                  )}
                </div>
              )}

              {/* Tab Content: AI Assistant response text */}
              {consoleTab === 'ai_assistant' && (
                <div className="p-4 rounded-xl border border-brand-indigo/15 bg-brand-indigo/[0.01] min-h-[80px] text-xs leading-relaxed space-y-2 scrollbar-thin overflow-y-auto">
                  {aiLoading ? (
                    <div className="flex items-center gap-2 text-brand-indigo animate-pulse">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Gemini model processing evaluation parameters...</span>
                    </div>
                  ) : (
                    <div className="whitespace-pre-line text-brand-textSec font-mono text-[11px] select-text">
                      {aiOutput || 'Ask Gemini to get coding walkthrough annotations, algorithmic optimize blocks, or detailed complexity metrics.'}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CodingPractice;

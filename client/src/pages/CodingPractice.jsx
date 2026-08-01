import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { apiRequest } from '../utils/api';
import GlassCard from '../components/GlassCard';
import { useNotification } from '../context/NotificationContext';
import { CardSkeleton } from '../components/LoadingSkeleton';

// CodeMirror 6 Core & Extensions Imports
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
  Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = [
  "All Topics",
  "Arrays",
  "Strings",
  "Linked Lists",
  "Stacks",
  "Queues",
  "Trees",
  "Graphs",
  "Dynamic Programming",
  "Recursion",
  "Searching",
  "Sorting",
  "Bit Manipulation",
  "Greedy",
  "Backtracking"
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

// Standard SaaS-quality starter templates for each programming language
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
  const [leaderboard, setLeaderboard] = useState([]);
  const [view, setView] = useState('editor'); // editor, leaderboard
  
  // Editor and Panel configs
  const [editorTheme, setEditorTheme] = useState('vs-dark');
  const [fontSize, setFontSize] = useState(14);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Topics');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [selectedCompany, setSelectedCompany] = useState('All Companies');

  // Resizable panel states (percentages)
  const [leftWidth, setLeftWidth] = useState(38); // split width %
  const [editorHeight, setEditorHeight] = useState(62); // split height %
  const [isResizingWidth, setIsResizingWidth] = useState(false);
  const [isResizingHeight, setIsResizingHeight] = useState(false);

  const containerRef = useRef(null);
  const rightContainerRef = useRef(null);
  const lastTemplateRef = useRef('');
  
  const { addToast } = useNotification();

  // Map selected language to CodeMirror language extension plugin
  const getLanguageExtension = useCallback((lang) => {
    switch (lang) {
      case 'javascript':
        return [javascript()];
      case 'python':
        return [python()];
      case 'cpp':
      case 'c':
        return [cpp()];
      case 'java':
        return [java()];
      default:
        return [javascript()];
    }
  }, []);

  // Load challenges from server
  const fetchChallenges = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'All Topics') params.append('category', selectedCategory);
      if (selectedDifficulty !== 'All') params.append('difficulty', selectedDifficulty);
      if (selectedCompany !== 'All Companies') params.append('company', selectedCompany);
      if (searchTerm) params.append('search', searchTerm);

      const data = await apiRequest(`/coding/challenges?${params.toString()}`);
      setChallenges(data);
      if (data.length > 0) {
        const active = data.find(ch => ch._id === selectedChallenge?._id) || data[0];
        setSelectedChallenge(active);
        
        // Initial template loading
        const initialTemplate = DEFAULT_TEMPLATES[language] || DEFAULT_TEMPLATES.javascript;
        setCode(initialTemplate);
        lastTemplateRef.current = initialTemplate;
      } else {
        setSelectedChallenge(null);
        setCode('');
        lastTemplateRef.current = '';
      }
    } catch (err) {
      console.error(err);
      addToast('Error loading challenges', err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedDifficulty, selectedCompany, searchTerm, language, selectedChallenge?._id, addToast]);

  const fetchLeaderboard = async () => {
    try {
      const data = await apiRequest('/coding/leaderboard');
      setLeaderboard(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, [selectedCategory, selectedDifficulty, selectedCompany]);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchChallenges();
  };

  const handleChallengeChange = (ch) => {
    if (code && code !== lastTemplateRef.current) {
      if (!window.confirm("You have modified your code. Switching challenges will discard your changes. Do you want to proceed?")) {
        return;
      }
    }
    setSelectedChallenge(ch);
    setResults(null);
    const tmpl = DEFAULT_TEMPLATES[language] || DEFAULT_TEMPLATES.javascript;
    setCode(tmpl);
    lastTemplateRef.current = tmpl;
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

  const handleRunCode = async () => {
    if (!selectedChallenge) return;
    setSubmitting(true);
    setResults(null);

    try {
      const res = await apiRequest(`/coding/challenges/${selectedChallenge._id}/run`, {
        method: 'POST',
        body: JSON.stringify({
          challengeId: selectedChallenge._id,
          code,
          language
        })
      });

      setResults(res);
      if (res.allPassed) {
        addToast('All Tests Passed!', 'Great job! Complexity analysis unlocked.', 'success');
        fetchLeaderboard();
      } else {
        addToast('Tests Failed', 'Review console output to debug errors.', 'warning');
      }
    } catch (err) {
      addToast('Execution Error', err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Drag handlers for splitting width
  const handleWidthMouseDown = (e) => {
    e.preventDefault();
    setIsResizingWidth(true);
  };

  // Drag handlers for splitting height
  const handleHeightMouseDown = (e) => {
    e.preventDefault();
    setIsResizingHeight(true);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizingWidth && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
        if (newWidth > 20 && newWidth < 80) {
          setLeftWidth(newWidth);
        }
      }
      
      if (isResizingHeight && rightContainerRef.current) {
        const containerRect = rightContainerRef.current.getBoundingClientRect();
        const newHeight = ((e.clientY - containerRect.top) / containerRect.height) * 100;
        if (newHeight > 20 && newHeight < 80) {
          setEditorHeight(newHeight);
        }
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

  return (
    <div className="space-y-6 font-outfit text-brand-textSec">
      
      {/* Top redline layout header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-white/5 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 rounded-lg bg-brand-indigo/10 border border-brand-indigo/25 text-brand-indigo shadow-[0_0_12px_rgba(99,102,241,0.2)]">
              <Code className="h-4.5 w-4.5" />
            </span>
            <h2 className="text-2xl font-black text-white tracking-tight">Coding Practice Arena</h2>
          </div>
          <p className="text-xs text-brand-textSec">Write, compile, and run DSA solutions on our high-performance compilers</p>
        </div>

        <div className="flex gap-3 mt-4 lg:mt-0">
          <button
            onClick={() => setView('editor')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 ${
              view === 'editor'
                ? 'bg-brand-indigo border-brand-indigo text-white shadow-lg shadow-brand-indigo/25'
                : 'bg-white/[0.02] border-white/5 text-brand-textSec hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Terminal className="h-4 w-4" /> Workspace Playground
          </button>
          <button
            onClick={() => {
              setView('leaderboard');
              fetchLeaderboard();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 ${
              view === 'leaderboard'
                ? 'bg-brand-indigo border-brand-indigo text-white shadow-lg shadow-brand-indigo/25'
                : 'bg-white/[0.02] border-white/5 text-brand-textSec hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Award className="h-4 w-4" /> Global Standings
          </button>
        </div>
      </div>

      {view === 'editor' && (
        <>
          {/* Advanced Filter Toolbar */}
          <GlassCard className="border-white/5 bg-brand-card/70 p-4">
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
                  className="w-full bg-white/[0.03] border border-white/5 text-xs text-brand-textSec px-3 py-2.5 rounded-xl focus:outline-none focus:border-brand-indigo/40"
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
                  className="w-full bg-white/[0.03] border border-white/5 text-xs text-brand-textSec px-3 py-2.5 rounded-xl focus:outline-none focus:border-brand-indigo/40"
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
                  className="w-full bg-white/[0.03] border border-white/5 text-xs text-brand-textSec px-3 py-2.5 rounded-xl focus:outline-none focus:border-brand-indigo/40"
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
          </GlassCard>

          {/* Core Resizable IDE Layout */}
          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <CardSkeleton /><CardSkeleton className="col-span-2 h-[450px]" />
            </div>
          ) : challenges.length === 0 ? (
            <GlassCard className="text-center py-16 border-white/5">
              <p className="text-sm text-brand-textSec/60 mb-2">No coding challenges found matching your filter parameters.</p>
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('All Topics');
                  setSelectedDifficulty('All');
                  setSelectedCompany('All Companies');
                }}
                className="text-xs text-brand-indigo hover:underline font-bold"
              >
                Clear all filters
              </button>
            </GlassCard>
          ) : (
            <div 
              ref={containerRef}
              className="flex flex-col lg:flex-row w-full gap-0 border border-white/5 rounded-2xl overflow-hidden bg-brand-darkSec/50 backdrop-blur-xl h-[680px]"
            >
              
              {/* Left Panel: Problems List & Detail specifications */}
              <div 
                style={{ width: `${leftWidth}%` }}
                className="flex flex-col h-full border-r border-white/5 bg-brand-dark/20 overflow-hidden"
              >
                {/* Upper section: Scrollable problem selector */}
                <div className="p-4 border-b border-white/5 flex flex-col gap-2 max-h-[220px] overflow-y-auto bg-brand-card/25 scrollbar-thin">
                  <h4 className="font-bold text-[10px] text-white/50 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                    <Tag className="h-3 w-3" /> Problems ({challenges.length})
                  </h4>
                  <div className="space-y-1.5">
                    {challenges.map(ch => (
                      <div
                        key={ch._id}
                        onClick={() => handleChallengeChange(ch)}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          selectedChallenge?._id === ch._id
                            ? 'border-brand-indigo/60 bg-brand-indigo/10 shadow-[inset_0_0_12px_rgba(99,102,241,0.08)]'
                            : 'border-white/5 hover:border-white/10 bg-white/[0.01]'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <p className={`text-xs font-bold truncate ${selectedChallenge?._id === ch._id ? 'text-white' : 'text-white/80'}`}>{ch.title}</p>
                          <span className="text-[9px] text-brand-textSec/60 font-medium block mt-0.5">{ch.category}</span>
                        </div>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${
                          ch.difficulty === 'Easy' ? 'bg-brand-emerald/10 border-brand-emerald/20 text-brand-emerald' :
                          ch.difficulty === 'Medium' ? 'bg-brand-amber/10 border-brand-amber/20 text-brand-amber' :
                          'bg-brand-rose/10 border-brand-rose/20 text-brand-rose'
                        }`}>
                          {ch.difficulty}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Lower section: Problem Description details */}
                {selectedChallenge && (
                  <div className="flex-1 p-5 overflow-y-auto leading-relaxed scrollbar-thin flex flex-col gap-4">
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

                    {/* Company Pill Badges */}
                    {selectedChallenge.companyTags && selectedChallenge.companyTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 items-center">
                        <span className="text-[9px] text-brand-textSec/50 uppercase font-black mr-1">Ask In:</span>
                        {selectedChallenge.companyTags.map(tag => (
                          <span key={tag} className="text-[9px] font-bold px-2 py-0.5 rounded bg-white/[0.04] border border-white/5 text-white/70">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Description Markup text */}
                    <div className="text-xs text-brand-textSec/90 whitespace-pre-line leading-relaxed font-outfit pr-1">
                      {selectedChallenge.description}
                    </div>
                  </div>
                )}
              </div>

              {/* Horizontal drag resizer bar */}
              <div 
                className="w-1.5 cursor-col-resize hover:bg-brand-indigo bg-white/5 transition-colors h-full flex items-center justify-center group"
                onMouseDown={handleWidthMouseDown}
              >
                <div className="h-6 w-1 rounded bg-white/10 group-hover:bg-white/40"></div>
              </div>

              {/* Right Panel: Workspace CodeMirror 6 Editor & Output Console */}
              <div 
                ref={rightContainerRef}
                style={{ width: `${100 - leftWidth}%` }}
                className="flex flex-col h-full overflow-hidden bg-brand-dark/10"
              >
                
                {/* Upper section: Code Editor Playground */}
                <div 
                  style={{ height: `${editorHeight}%` }}
                  className="flex flex-col min-h-[150px] p-4 overflow-hidden border-b border-white/5 bg-brand-card/10"
                >
                  {/* Editor Top Control Bar */}
                  <div className="flex flex-wrap justify-between items-center border-b border-white/5 pb-3 mb-3 gap-2">
                    
                    {/* Language and Preferences dropdowns */}
                    <div className="flex gap-2">
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

                      <button
                        onClick={() => setEditorTheme(prev => prev === 'vs-dark' ? 'light' : 'vs-dark')}
                        title="Toggle Editor Theme"
                        className="p-1.5 bg-brand-dark border border-white/5 rounded-lg text-brand-textSec hover:text-white transition-colors"
                      >
                        {editorTheme === 'vs-dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                      </button>

                      {/* Font Size controls */}
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

                  {/* CodeMirror 6 Mount Container */}
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

                {/* Vertical drag resizer bar */}
                <div 
                  className="h-1.5 cursor-row-resize hover:bg-brand-indigo bg-white/5 transition-colors w-full flex items-center justify-center group"
                  onMouseDown={handleHeightMouseDown}
                >
                  <div className="w-8 h-1 rounded bg-white/10 group-hover:bg-white/40"></div>
                </div>

                {/* Lower section: Console Output Logs */}
                <div 
                  style={{ height: `${100 - editorHeight}%` }}
                  className="flex-1 p-4 overflow-y-auto scrollbar-thin flex flex-col min-h-[120px] bg-brand-dark/15"
                >
                  <h4 className="font-bold text-[10px] text-white/50 uppercase tracking-widest mb-3.5 flex items-center gap-2">
                    <Terminal className="h-3.5 w-3.5 text-brand-indigo" /> Console Results Panel
                  </h4>
                  
                  {results ? (
                    <div className="space-y-4">
                      
                      {/* Summary list */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {results.results.map((r, i) => (
                          <div
                            key={i}
                            className={`p-3 rounded-xl border flex items-center justify-between text-xs font-semibold ${
                              r.passed 
                                ? 'bg-brand-emerald/10 border-brand-emerald/20 text-brand-emerald' 
                                : 'bg-brand-rose/10 border-brand-rose/20 text-brand-rose'
                            }`}
                          >
                            <span>Test Case {i + 1}</span>
                            {r.passed ? <CheckCircle className="h-4.5 w-4.5" /> : <XCircle className="h-4.5 w-4.5" />}
                          </div>
                        ))}
                      </div>

                      {/* Execution Output Details */}
                      <div className="space-y-2">
                        {results.results.map((r, i) => (
                          <div key={i} className="p-3 bg-white/[0.01] border border-white/5 rounded-xl text-[11px] font-mono leading-relaxed space-y-1">
                            <div className="text-white/40 border-b border-white/5 pb-1 flex justify-between">
                              <span>CASE {i + 1}</span>
                              <span className={r.passed ? 'text-brand-emerald' : 'text-brand-rose'}>
                                {r.passed ? 'PASSED' : 'FAILED'}
                              </span>
                            </div>
                            <p><span className="text-white/40">Input:</span> {r.input}</p>
                            <p><span className="text-white/40">Expected:</span> {r.expected}</p>
                            <p><span className="text-white/40">Output:</span> {r.actual}</p>
                          </div>
                        ))}
                      </div>

                      {/* Debugger output logs if errors exist */}
                      {results.results.some(r => r.error) && (
                        <div className="p-3.5 rounded-xl border border-brand-rose/20 bg-brand-rose/5 text-xs text-brand-rose">
                          <p className="font-bold mb-1">Debugger Errors Logs:</p>
                          <pre className="font-mono text-[11px] whitespace-pre-wrap leading-relaxed">
                            {results.results.find(r => r.error).error}
                          </pre>
                        </div>
                      )}

                      {/* Solution displays if successful */}
                      {results.allPassed && results.solution && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 rounded-xl border border-brand-indigo/20 bg-brand-indigo/[0.01] flex flex-col gap-3"
                        >
                          <div className="flex gap-4 items-center">
                            <span className="flex items-center gap-1 text-[9px] text-brand-indigo font-bold bg-brand-indigo/10 px-2.5 py-0.5 rounded border border-brand-indigo/25">
                              <Layers className="h-3.5 w-3.5" /> Time: {results.solution.timeComplexity}
                            </span>
                            <span className="flex items-center gap-1 text-[9px] text-brand-indigo font-bold bg-brand-indigo/10 px-2.5 py-0.5 rounded border border-brand-indigo/25">
                              <BookOpen className="h-3.5 w-3.5" /> Space: {results.solution.spaceComplexity}
                            </span>
                          </div>
                          <p className="text-xs text-brand-textSec leading-relaxed">
                            <span className="font-bold text-brand-indigo block mb-1">AI Solution Walkthrough:</span>
                            {results.solution.explanation}
                          </p>
                        </motion.div>
                      )}

                    </div>
                  ) : (
                    <p className="text-xs text-brand-textSec/40 py-6 text-center">Compile and run your code to view the test case evaluation logs.</p>
                  )}

                </div>
              </div>

            </div>
          )}
        </>
      )}

      {view === 'leaderboard' && (
        /* Leaderboard table */
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-3xl mx-auto"
        >
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
                  {leaderboard.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-brand-textSec/50">No leaderboard entries available yet. Solve problems to record score points!</td>
                    </tr>
                  ) : (
                    leaderboard.map((player, index) => (
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
        </motion.div>
      )}

    </div>
  );
};

export default CodingPractice;

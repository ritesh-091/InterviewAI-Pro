import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import GlassCard from '../components/GlassCard';
import { useNotification } from '../context/NotificationContext';
import { CardSkeleton } from '../components/LoadingSkeleton';
import Editor from '@monaco-editor/react';
import { 
  Play, 
  Terminal, 
  CheckCircle, 
  XCircle, 
  Award, 
  BookOpen, 
  Layers,
  ArrowRight,
  Code,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  
  const { addToast } = useNotification();

  const fetchChallenges = async () => {
    try {
      const data = await apiRequest('/coding/challenges');
      setChallenges(data);
      if (data.length > 0) {
        setSelectedChallenge(data[0]);
        setCode(data[0].codeTemplates.javascript);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
    fetchLeaderboard();
  }, []);

  const handleChallengeChange = (ch) => {
    setSelectedChallenge(ch);
    setLanguage('javascript');
    setCode(ch.codeTemplates.javascript);
    setResults(null);
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    if (selectedChallenge) {
      // Map standard key representations
      const templates = selectedChallenge.codeTemplates;
      const key = lang === 'cpp' ? 'cpp' : lang;
      setCode(templates[key] || templates.javascript);
    }
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
        fetchLeaderboard(); // Reload points standings
      } else {
        addToast('Tests Failed', 'Review outputs console for debugger logs.', 'warning');
      }
    } catch (err) {
      addToast('Execution Error', err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <CardSkeleton /><CardSkeleton className="col-span-2" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header coordinates */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-4">
        <div>
          <h2 className="text-2xl font-black text-white">Coding Practice Arena</h2>
          <p className="text-xs text-brand-textSec">Solve DSA algorithmic structures inside our online sandbox environment</p>
        </div>

        <div className="flex gap-3 mt-4 md:mt-0">
          <button
            onClick={() => setView('editor')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              view === 'editor'
                ? 'bg-brand-indigo border-brand-indigo text-white shadow-lg shadow-brand-indigo/25'
                : 'bg-white/[0.02] border-white/5 text-brand-textSec hover:text-white'
            }`}
          >
            Playground IDE
          </button>
          <button
            onClick={() => {
              setView('leaderboard');
              fetchLeaderboard();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              view === 'leaderboard'
                ? 'bg-brand-indigo border-brand-indigo text-white shadow-lg shadow-brand-indigo/25'
                : 'bg-white/[0.02] border-white/5 text-brand-textSec hover:text-white'
            }`}
          >
            Points Leaderboard
          </button>
        </div>
      </div>

      {view === 'editor' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Question panels list & detail specifications */}
          <div className="flex flex-col gap-6">
            
            {/* List selectors card */}
            <GlassCard className="border-white/5 bg-brand-card">
              <h4 className="font-bold text-xs text-white uppercase tracking-widest mb-3">Problems List</h4>
              <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                {challenges.map(ch => (
                  <div
                    key={ch._id}
                    onClick={() => handleChallengeChange(ch)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      selectedChallenge?._id === ch._id
                        ? 'border-brand-indigo bg-brand-indigo/10'
                        : 'border-white/5 hover:border-white/10 bg-white/[0.01]'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-white">{ch.title}</p>
                      <span className="text-[10px] text-brand-textSec font-medium">{ch.category}</span>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                      ch.difficulty === 'Easy' ? 'bg-brand-emerald/10 border-brand-emerald/20 text-brand-emerald' :
                      ch.difficulty === 'Medium' ? 'bg-brand-amber/10 border-brand-amber/20 text-brand-amber' :
                      'bg-brand-rose/10 border-brand-rose/20 text-brand-rose'
                    }`}>
                      {ch.difficulty}
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Description details card */}
            {selectedChallenge && (
              <GlassCard className="border-white/5 bg-brand-card flex-1 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-sm text-white">{selectedChallenge.title}</h3>
                  <span className="text-[10px] text-brand-textSec font-bold uppercase tracking-wider">{selectedChallenge.category}</span>
                </div>
                <div className="text-xs text-brand-textSec leading-relaxed font-outfit whitespace-pre-line border-t border-white/5 pt-3">
                  {selectedChallenge.description}
                </div>
              </GlassCard>
            )}

          </div>

          {/* Monaco Editor playground */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            <GlassCard className="border-white/5 flex flex-col h-[480px] p-4 bg-brand-card">
              
              {/* Header toolbar */}
              <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-3">
                
                {/* Language drop */}
                <select
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="bg-brand-dark border border-white/5 text-xs font-bold text-brand-textSec px-3 py-1.5 rounded-lg focus:outline-none focus:border-brand-indigo/40"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                </select>

                <button
                  onClick={handleRunCode}
                  disabled={submitting}
                  className="py-2 px-5 rounded-lg bg-brand-indigo hover:bg-brand-indigo/90 disabled:bg-brand-indigo/60 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-lg shadow-brand-indigo/25"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5 fill-white text-white" />
                      Run Code
                    </>
                  )}
                </button>
              </div>

              {/* Monaco IDE Mount */}
              <div className="flex-1 w-full rounded-xl overflow-hidden border border-white/5">
                <Editor
                  height="100%"
                  language={language}
                  theme="vs-dark"
                  value={code}
                  onChange={(val) => setCode(val)}
                  options={{
                    fontSize: 13,
                    minimap: { enabled: false },
                    automaticLayout: true,
                    tabSize: 2,
                    fontFamily: 'Consolas, monospace',
                  }}
                />
              </div>

            </GlassCard>

            {/* Test outputs console logs */}
            <GlassCard className="border-white/5 bg-brand-card">
              <h4 className="font-bold text-xs text-brand-textSec uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Terminal className="h-4 w-4 text-brand-textSec" />
                Console Results Panel
              </h4>
              
              {results ? (
                <div className="space-y-4">
                  
                  {/* Summary list */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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

                  {/* Executed errors details */}
                  {results.results.some(r => r.error) && (
                    <div className="p-3.5 rounded-xl border border-brand-rose/20 bg-brand-rose/5 text-xs text-brand-rose">
                      <p className="font-bold mb-1">Debugger Errors Logs:</p>
                      <pre className="font-mono text-[11px] whitespace-pre-wrap">
                        {results.results.find(r => r.error).error}
                      </pre>
                    </div>
                  )}

                  {/* Solution display if successful */}
                  {results.allPassed && results.solution && (
                    <div className="mt-3 p-4 rounded-xl border border-brand-indigo/20 bg-brand-indigo/[0.01] flex flex-col gap-3">
                      <div className="flex gap-4 items-center">
                        <span className="flex items-center gap-1 text-[10px] text-brand-indigo font-bold bg-brand-indigo/10 px-2 py-0.5 rounded border border-brand-indigo/25">
                          <Layers className="h-3.5 w-3.5" /> Time: {results.solution.timeComplexity}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-brand-indigo font-bold bg-brand-indigo/10 px-2 py-0.5 rounded border border-brand-indigo/25">
                          <BookOpen className="h-3.5 w-3.5" /> Space: {results.solution.spaceComplexity}
                        </span>
                      </div>
                      <p className="text-xs text-brand-textSec leading-relaxed">
                        <span className="font-bold text-brand-indigo block mb-1">AI Solution Explanation:</span>
                        {results.solution.explanation}
                      </p>
                    </div>
                  )}

                </div>
              ) : (
                <p className="text-xs text-brand-textSec/60 py-4 text-center">Compile code to view test case pass rates.</p>
              )}

            </GlassCard>

          </div>

        </div>
      ) : (
        /* Leaderboard table */
        <div className="max-w-3xl mx-auto">
          <GlassCard className="border-white/5 bg-brand-card">
            <h3 className="font-bold text-sm text-white mb-4 flex items-center gap-2 uppercase tracking-wider">
              <Award className="h-5 w-5 text-brand-amber animate-pulse" /> Competitive Practice Standings
            </h3>
            
            <div className="overflow-x-auto w-full border border-white/5 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-brand-textSec font-bold bg-white/[0.01]">
                    <th className="py-3.5 px-4 uppercase tracking-wider text-[10px]">Rank</th>
                    <th className="py-3.5 px-4 uppercase tracking-wider text-[10px]">Candidate Developer</th>
                    <th className="py-3.5 px-4 uppercase tracking-wider text-[10px]">Solved Problems</th>
                    <th className="py-3.5 px-4 text-right uppercase tracking-wider text-[10px]">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-brand-textSec">
                  {leaderboard.map((player, index) => (
                    <tr key={index} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white/50">{index + 1}</td>
                      <td className="py-3.5 px-4 flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-brand-indigo/25 border border-brand-indigo/35 flex items-center justify-center font-bold text-brand-indigo uppercase text-[10px]">
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
                  ))}
                </tbody>
              </table>
            </div>

          </GlassCard>
        </div>
      )}

    </div>
  );
};

export default CodingPractice;


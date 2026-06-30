import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import GlassCard from '../components/GlassCard';
import { ListSkeleton } from '../components/LoadingSkeleton';
import { useNotification } from '../context/NotificationContext';
import { 
  Upload, 
  FileText, 
  AlertCircle, 
  FileDown, 
  Trash2,
  CheckCircle,
  HelpCircle,
  Briefcase,
  Layers,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { 
  RadialBarChart, 
  RadialBar, 
  ResponsiveContainer 
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const ResumeAnalyzer = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [activeAnalysis, setActiveAnalysis] = useState(null);
  const { addToast } = useNotification();

  // Advanced comparison states
  const [mode, setMode] = useState('audit'); // audit, compare
  const [jobDescription, setJobDescription] = useState('');
  const [compareResult, setCompareResult] = useState(null);

  const fetchResumes = async () => {
    try {
      const data = await apiRequest('/resumes');
      setHistory(data);
      if (data.length > 0 && !activeAnalysis) {
        setActiveAnalysis(data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.type === 'application/pdf') {
        setFile(selected);
        addToast('File Selected', `${selected.name} is ready for scanning.`, 'info');
      } else {
        addToast('File Error', 'Only PDF formats are supported for resume scanning.', 'warning');
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await apiRequest('/resumes/upload', {
        method: 'POST',
        body: formData
      });
      addToast('Upload Complete', 'Resume text extracted and ATS scores calculated!', 'success');
      setHistory(prev => [res, ...prev]);
      setActiveAnalysis(res);
      setFile(null);
    } catch (err) {
      addToast('Analysis Failed', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async (e) => {
    e.preventDefault();
    if (!file) {
      addToast('Missing Resume', 'Please upload a PDF resume file first.', 'warning');
      return;
    }
    if (!jobDescription.trim()) {
      addToast('Missing JD', 'Please paste a target job description description.', 'warning');
      return;
    }

    setLoading(true);
    setCompareResult(null);

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('jobDescription', jobDescription);

    try {
      const res = await apiRequest('/resumes/compare', {
        method: 'POST',
        body: formData
      });
      addToast('Comparison Complete', 'Realistic job fit matching scores calculated!', 'success');
      setCompareResult(res);
      setFile(null);
    } catch (err) {
      addToast('Comparison Failed', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this resume report?')) return;
    try {
      await apiRequest(`/resumes/${id}`, { method: 'DELETE' });
      addToast('Report Deleted', 'Analysis history removed.', 'info');
      const updatedHistory = history.filter(r => r._id !== id);
      setHistory(updatedHistory);
      if (activeAnalysis?._id === id) {
        setActiveAnalysis(updatedHistory[0] || null);
      }
    } catch (err) {
      addToast('Delete Failed', err.message, 'error');
    }
  };

  // Format Recharts dial data
  const scoreDialData = activeAnalysis ? [
    { name: 'ATS Score', value: activeAnalysis.atsScore, fill: '#6366F1' }
  ] : [];

  const compareDialData = compareResult ? [
    { name: 'Match Score', value: compareResult.atsScore, fill: '#06B6D4' }
  ] : [];

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-4">
        <div>
          <h2 className="text-2xl font-black text-white">Resume ATS Analyzer</h2>
          <p className="text-xs text-brand-textSec">Optimize resumes, resolve grammar elements, and add keywords for scanners</p>
        </div>
      </div>

      {/* Mode switches */}
      <div className="flex border-b border-white/5 pb-px">
        <button
          onClick={() => setMode('audit')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all mr-6 flex items-center gap-1.5 ${
            mode === 'audit'
              ? 'border-brand-indigo text-brand-indigo font-extrabold'
              : 'border-transparent text-brand-textSec hover:text-white'
          }`}
        >
          <Layers className="h-4 w-4" /> Resume ATS Audit
        </button>
        <button
          onClick={() => setMode('compare')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${
            mode === 'compare'
              ? 'border-brand-indigo text-brand-indigo font-extrabold'
              : 'border-transparent text-brand-textSec hover:text-white'
          }`}
        >
          <Briefcase className="h-4 w-4" /> Compare with Job Description
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Upload Controllers */}
        <div className="flex flex-col gap-6">
          
          {/* Uploader Card */}
          <GlassCard className="border-white/5 bg-brand-card">
            <h4 className="font-bold text-xs text-white uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <Upload className="h-4 w-4 text-brand-indigo" />
              {mode === 'audit' ? 'Upload Resume' : 'Target Position Audit'}
            </h4>
            
            <form onSubmit={mode === 'audit' ? handleUpload : handleCompare} className="space-y-4">
              
              {/* Drag drop zone */}
              <div className="border-2 border-dashed border-white/10 hover:border-brand-indigo/50 rounded-[20px] p-6 flex flex-col items-center justify-center text-center gap-2 cursor-pointer transition-all relative bg-white/[0.01] hover:bg-white/[0.03]">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <FileText className="h-8 w-8 text-brand-textSec mb-1" />
                <span className="text-xs font-bold text-white">
                  {file ? file.name : 'Choose PDF file'}
                </span>
                <span className="text-[10px] text-brand-textSec/60">Max size 5MB (PDF only)</span>
              </div>

              {/* Paste JD if compare mode */}
              {mode === 'compare' && (
                <div className="flex flex-col gap-1.5 text-xs">
                  <label className="font-bold text-brand-textSec uppercase tracking-wider text-[10px]">Target Job Description</label>
                  <textarea
                    rows={5}
                    required
                    placeholder="Paste job details, requirements, core technologies, and keywords list here..."
                    value={jobDescription}
                    onChange={e => setJobDescription(e.target.value)}
                    className="w-full p-3.5 rounded-xl bg-brand-dark border border-white/5 focus:outline-none focus:border-brand-indigo/40 text-white resize-none text-xs placeholder-brand-textSec/30"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl btn-primary text-xs font-extrabold flex items-center justify-center gap-1.5"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Calculating...
                  </>
                ) : mode === 'audit' ? (
                  'Execute AI Scan'
                ) : (
                  'Compare Resume Suitability'
                )}
              </button>

            </form>
          </GlassCard>

          {/* History Queue (Visible in audit mode) */}
          {mode === 'audit' && (
            <GlassCard className="border-white/5 bg-brand-card flex-grow flex flex-col">
              <h4 className="font-bold text-xs text-white uppercase tracking-widest mb-3">Scan History</h4>
              <div className="space-y-2 overflow-y-auto max-h-[280px] flex-1 pr-1">
                {history.length === 0 ? (
                  <p className="text-[11px] text-brand-textSec py-8 text-center">No uploads scanned yet.</p>
                ) : (
                  history.map(item => (
                    <div
                      key={item._id}
                      onClick={() => setActiveAnalysis(item)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        activeAnalysis?._id === item._id
                          ? 'border-brand-indigo bg-brand-indigo/10'
                          : 'border-white/5 hover:border-white/10 bg-white/[0.01]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="h-4.5 w-4.5 text-brand-textSec flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{item.originalName}</p>
                          <span className="text-[10px] text-brand-textSec">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-brand-indigo">{item.atsScore}%</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(item._id);
                          }}
                          className="p-1.5 rounded-lg hover:bg-brand-rose/10 text-brand-textSec hover:text-brand-rose transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </GlassCard>
          )}

        </div>

        {/* Right Side: Detailed Metrics Display */}
        <div className="lg:col-span-2">
          {loading ? (
            <GlassCard className="h-full flex items-center justify-center border-white/5 bg-brand-card">
              <div className="flex flex-col items-center gap-4 py-16 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-indigo"></div>
                <h4 className="font-bold text-sm text-white">Evaluating ATS score...</h4>
                <p className="text-xs text-brand-textSec max-w-sm">Comparing parser text matrices, classifying missing competencies, and compiling detailed reports.</p>
              </div>
            </GlassCard>
          ) : mode === 'audit' ? (
            activeAnalysis ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Score Dial Gauge */}
                <GlassCard className="md:col-span-1 border-white/5 bg-brand-card flex flex-col justify-between items-center text-center">
                  <div>
                    <h4 className="font-bold text-xs text-white uppercase tracking-widest">ATS score</h4>
                    <p className="text-[10px] text-brand-textSec mt-1">Applicant matching rate</p>
                  </div>

                  <div className="h-[160px] w-full relative flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart 
                        cx="50%" 
                        cy="50%" 
                        innerRadius="80%" 
                        outerRadius="100%" 
                        barSize={12} 
                        data={scoreDialData} 
                        startAngle={90} 
                        endAngle={-270}
                      >
                        <RadialBar minAngle={15} background clockWise dataKey="value" />
                      </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="absolute flex flex-col justify-center items-center">
                      <span className="text-3xl font-black text-white">{activeAnalysis.atsScore}</span>
                      <span className="text-[10px] text-brand-textSec font-bold uppercase">/ 100</span>
                    </div>
                  </div>

                  {activeAnalysis.pdfReportPath ? (
                    <a
                      href={`/api${activeAnalysis.pdfReportPath}`}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2.5 rounded-xl btn-primary text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      <FileDown className="h-4.5 w-4.5" /> Improvement Report
                    </a>
                  ) : (
                    <div className="w-full py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] text-brand-textSec/60 font-bold uppercase tracking-wider">
                      Audit Complete
                    </div>
                  )}
                </GlassCard>

                {/* Feedbacks Grid */}
                <div className="md:col-span-2 flex flex-col gap-6">
                  
                  <GlassCard className="border-white/5 bg-brand-card">
                    <h4 className="font-bold text-xs text-white uppercase tracking-widest mb-3">Missing Skills & Tools</h4>
                    <div className="flex flex-wrap gap-2">
                      {activeAnalysis.feedback.missingSkills.length === 0 ? (
                        <span className="text-xs text-brand-textSec">No missing skills detected!</span>
                      ) : (
                        activeAnalysis.feedback.missingSkills.map((skill, index) => (
                          <span
                            key={index}
                            className="px-2.5 py-1 rounded-lg bg-brand-rose/10 border border-brand-rose/20 text-brand-rose text-xs font-semibold"
                          >
                            {skill}
                          </span>
                        ))
                      )}
                    </div>
                  </GlassCard>

                  <GlassCard className="border-white/5 bg-brand-card">
                    <h4 className="font-bold text-xs text-white uppercase tracking-widest mb-3">Keyword Optimizations</h4>
                    <div className="space-y-3">
                      {activeAnalysis.feedback.keywordOptimization.map((item, index) => (
                        <div key={index} className="flex gap-3 text-xs leading-relaxed">
                          <AlertCircle className="h-4.5 w-4.5 text-brand-cyan flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-extrabold text-brand-cyan">Add "{item.keyword}":</span>
                            <span className="text-brand-textSec ml-1">{item.reason}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </GlassCard>

                  <GlassCard className="border-white/5 bg-brand-card">
                    <h4 className="font-bold text-xs text-white uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-brand-indigo" /> Suitable Job Roles
                    </h4>
                    <div className="space-y-3">
                      {activeAnalysis.feedback.roleSuitability.map((roleInfo, index) => (
                        <div key={index} className="flex items-center justify-between text-xs p-3 rounded-xl bg-white/[0.01] border border-white/5 hover:border-white/10 transition-colors">
                          <div>
                            <p className="font-bold text-white">{roleInfo.role}</p>
                            <p className="text-[10px] text-brand-textSec mt-0.5">{roleInfo.reason}</p>
                          </div>
                          <span className="font-extrabold text-brand-indigo bg-brand-indigo/10 px-2 py-0.5 rounded text-[11px]">
                            {roleInfo.score}% match
                          </span>
                        </div>
                      ))}
                    </div>
                  </GlassCard>

                </div>

              </div>
            ) : (
              <GlassCard className="h-full flex items-center justify-center border-white/5 bg-brand-card py-16">
                <div className="flex flex-col items-center text-center gap-2 max-w-sm">
                  <HelpCircle className="h-10 w-10 text-brand-textSec/40 mb-2" />
                  <h4 className="font-bold text-sm text-white">No Active Resume Selection</h4>
                  <p className="text-xs text-brand-textSec">
                    Upload a PDF resume or click an entry in the scan history log to check ATS feedback.
                  </p>
                </div>
              </GlassCard>
            )
          ) : (
            // COMPARISON REPORTING ZONE
            compareResult ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Score Dial Gauge */}
                <GlassCard className="md:col-span-1 border-white/5 bg-brand-card flex flex-col justify-between items-center text-center">
                  <div>
                    <h4 className="font-bold text-xs text-white uppercase tracking-widest">Match suitability</h4>
                    <p className="text-[10px] text-brand-textSec mt-1">Match with target description</p>
                  </div>

                  <div className="h-[160px] w-full relative flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart 
                        cx="50%" 
                        cy="50%" 
                        innerRadius="80%" 
                        outerRadius="100%" 
                        barSize={12} 
                        data={compareDialData} 
                        startAngle={90} 
                        endAngle={-270}
                      >
                        <RadialBar minAngle={15} background clockWise dataKey="value" />
                      </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="absolute flex flex-col justify-center items-center">
                      <span className="text-3xl font-black text-white">{compareResult.atsScore}</span>
                      <span className="text-[10px] text-brand-textSec font-bold uppercase">% Match</span>
                    </div>
                  </div>

                  <div className="w-full py-2.5 rounded-xl bg-brand-cyan/10 border border-brand-cyan/20 text-[10px] text-brand-cyan font-bold uppercase tracking-wider">
                    Matching complete
                  </div>
                </GlassCard>

                {/* Match detailed listings */}
                <div className="md:col-span-2 flex flex-col gap-6">
                  
                  {/* Matched / Missing Keywords */}
                  <GlassCard className="border-white/5 bg-brand-card space-y-4">
                    <div>
                      <h4 className="font-bold text-xs text-white uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <CheckCircle className="h-4 w-4 text-brand-emerald" /> Matched JD Keywords
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {compareResult.matchedKeywords.length === 0 ? (
                          <span className="text-xs text-brand-textSec italic">No matched keywords found.</span>
                        ) : (
                          compareResult.matchedKeywords.map((kw, i) => (
                            <span key={i} className="px-2.5 py-1 rounded bg-brand-emerald/10 border border-brand-emerald/25 text-brand-emerald text-[10px] font-bold">
                              {kw}
                            </span>
                          ))
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-xs text-white uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <AlertCircle className="h-4 w-4 text-brand-rose" /> Missing JD Keywords
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {compareResult.missingKeywords.length === 0 ? (
                          <span className="text-xs text-brand-textSec italic">No missing keywords found! Excellent job.</span>
                        ) : (
                          compareResult.missingKeywords.map((kw, i) => (
                            <span key={i} className="px-2.5 py-1 rounded bg-brand-rose/10 border border-brand-rose/25 text-brand-rose text-[10px] font-bold">
                              {kw}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </GlassCard>

                  {/* Tailored Resume Bullet Points */}
                  <GlassCard className="border-white/5 bg-brand-card">
                    <h4 className="font-bold text-xs text-white uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <Sparkles className="h-4.5 w-4.5 text-brand-indigo" /> Tailored Impact Statements
                    </h4>
                    <p className="text-[10px] text-brand-textSec mb-3">Copy and insert these custom statements into your resume to bypass ATS screeners:</p>
                    <div className="space-y-3.5 text-xs text-brand-textSec leading-relaxed">
                      {compareResult.tailoredResumeBullets?.map((bullet, i) => (
                        <div key={i} className="p-3.5 rounded-xl border border-white/5 bg-white/[0.01] flex gap-2.5 items-start">
                          <span className="text-brand-indigo font-bold mt-0.5">•</span>
                          <span>{bullet}</span>
                        </div>
                      ))}
                    </div>
                  </GlassCard>

                </div>

              </div>
            ) : (
              <GlassCard className="h-full flex items-center justify-center border-white/5 bg-brand-card py-16">
                <div className="flex flex-col items-center text-center gap-2 max-w-sm">
                  <HelpCircle className="h-10 w-10 text-brand-textSec/40 mb-2" />
                  <h4 className="font-bold text-sm text-white">No JD Comparison Performed</h4>
                  <p className="text-xs text-brand-textSec">
                    Upload your resume PDF and paste the target position details in the sidebar to check matching metrics.
                  </p>
                </div>
              </GlassCard>
            )
          )}
        </div>

      </div>

    </div>
  );
};

export default ResumeAnalyzer;


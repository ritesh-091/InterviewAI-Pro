import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import GlassCard from '../components/GlassCard';
import { ListSkeleton } from '../components/LoadingSkeleton';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { Building2, Layers, HelpCircle, CheckSquare, MessageCircle, FileText, Sparkles, Star, RefreshCw, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CompanyPrep = () => {
  const { user, refreshUser } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [selectedName, setSelectedName] = useState('TCS');
  const [companyDetails, setCompanyDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('process'); // process, faq, topics, hr, blogs
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Post experience states
  const [expRole, setExpRole] = useState('');
  const [expRating, setExpRating] = useState(5);
  const [expContent, setExpContent] = useState('');
  const [submittingExp, setSubmittingExp] = useState(false);

  const { addToast } = useNotification();
  const navigate = useNavigate();

  const fetchCompanies = async () => {
    try {
      const data = await apiRequest('/companies');
      setCompanies(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyDetails = async (name) => {
    setDetailsLoading(true);
    try {
      const data = await apiRequest(`/companies/${name}`);
      setCompanyDetails(data);
    } catch (err) {
      addToast('Error Loading', err.message, 'error');
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (selectedName) {
      fetchCompanyDetails(selectedName);
    }
  }, [selectedName]);

  const handleCompanyChange = (name) => {
    setSelectedName(name);
    setActiveTab('process');
  };

  const handleToggleBookmark = async () => {
    if (!companyDetails) return;
    try {
      const res = await apiRequest(`/companies/${companyDetails.name}/bookmark`, { method: 'POST' });
      addToast('Bookmark updated', res.bookmarked ? 'Company added to bookmarks.' : 'Company removed from bookmarks.', 'success');
      await refreshUser();
    } catch (err) {
      addToast('Error', err.message, 'error');
    }
  };

  const handleToggleProgress = async () => {
    if (!companyDetails) return;
    try {
      const nextStatus = isPrepared ? 'in-progress' : 'completed';
      const res = await apiRequest(`/companies/${companyDetails.name}/progress`, {
        method: 'POST',
        body: JSON.stringify({ status: nextStatus })
      });
      addToast('Progress updated', nextStatus === 'completed' ? 'Marked company prep as completed!' : 'Marked company prep as in-progress.', 'success');
      await refreshUser();
    } catch (err) {
      addToast('Error', err.message, 'error');
    }
  };

  const handleAddExperience = async (e) => {
    e.preventDefault();
    if (!companyDetails || !expRole || !expContent) return;
    setSubmittingExp(true);
    try {
      const res = await apiRequest(`/companies/${companyDetails.name}/experience`, {
        method: 'POST',
        body: JSON.stringify({
          role: expRole,
          rating: expRating,
          content: expContent
        })
      });
      addToast('Experience Shared', res.message, 'success');
      
      setCompanyDetails(prev => ({
        ...prev,
        previousExperiences: [res.experience, ...prev.previousExperiences]
      }));

      setExpRole('');
      setExpContent('');
      setExpRating(5);
    } catch (err) {
      addToast('Post Failed', err.message, 'error');
    } finally {
      setSubmittingExp(false);
    }
  };

  if (loading) {
    return <ListSkeleton rows={5} />;
  }

  // Complete list of companies required
  const companyList = [
    'TCS', 'Infosys', 'Wipro', 'Accenture', 'Cognizant', 
    'Capgemini', 'Deloitte', 'IBM', 'Microsoft', 'Google', 'Amazon'
  ];

  const filteredCompanyList = companyList.filter(name => 
    name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isBookmarked = user?.bookmarks?.includes(companyDetails?.name);
  const isPrepared = user?.companyProgress?.some(p => p.name.toLowerCase() === companyDetails?.name?.toLowerCase() && p.status === 'completed');

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="border-b border-white/5 pb-4">
        <h2 className="text-2xl font-black text-white">Company Prep Roadmaps</h2>
        <p className="text-xs text-brand-textSec">Deep dive into recruitment stages, solved aptitude topics, and HR banks of target brands</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Selection side panel */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <GlassCard className="border-white/5 bg-brand-card flex flex-col gap-3">
            <h4 className="font-bold text-xs text-white uppercase tracking-widest flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-brand-indigo" /> Target Brand
            </h4>

            {/* Sidebar search input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-brand-textSec" />
              <input
                type="text"
                placeholder="Search brands..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-white placeholder-brand-textSec/30 focus:outline-none focus:border-brand-indigo/40"
              />
            </div>

            <div className="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto pr-1">
              {filteredCompanyList.map(name => (
                <button
                  key={name}
                  onClick={() => handleCompanyChange(name)}
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-bold text-left transition-all border ${
                    selectedName.toLowerCase() === name.toLowerCase()
                      ? 'bg-brand-indigo/10 text-white border-brand-indigo/30 shadow-[0_0_15px_rgba(99,102,241,0.05)]'
                      : 'hover:bg-white/[0.02] text-brand-textSec hover:text-white border-transparent'
                  }`}
                >
                  {name} Guides
                </button>
              ))}
              {filteredCompanyList.length === 0 && (
                <p className="text-[10px] text-brand-textSec/60 text-center py-4">No matching brands found.</p>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Detailed modules panel */}
        <div className="lg:col-span-3">
          {detailsLoading ? (
            <GlassCard className="h-full flex items-center justify-center border-white/5 bg-brand-card py-16">
              <div className="flex flex-col items-center gap-3">
                <RefreshCw className="h-6 w-6 text-brand-indigo animate-spin" />
                <p className="text-xs text-brand-textSec">Loading module coordinates...</p>
              </div>
            </GlassCard>
          ) : companyDetails ? (
            <GlassCard className="border-white/5 bg-brand-card flex flex-col gap-5 p-5">
              
              {/* BRAND TOP HEADER */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/5 pb-4 gap-3">
                <div>
                  <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                    {companyDetails.name} <span className="text-[9px] text-brand-indigo bg-brand-indigo/10 border border-brand-indigo/25 px-2 py-0.5 rounded font-black uppercase tracking-wider">Recruiting Path</span>
                  </h3>
                  <p className="text-xs text-brand-textSec mt-0.5">Customized preparation guidelines and questions lists</p>
                </div>
                
                <div className="flex items-center gap-2.5 mt-2 md:mt-0 flex-wrap">
                  <button
                    onClick={handleToggleBookmark}
                    className={`py-2 px-3.5 rounded-xl border text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                      isBookmarked
                        ? 'bg-brand-indigo/15 border-brand-indigo/35 text-white'
                        : 'bg-white/[0.02] border-white/5 text-brand-textSec hover:text-white'
                    }`}
                    title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Company'}
                  >
                    <Star className={`h-3.5 w-3.5 ${isBookmarked ? 'fill-brand-indigo text-brand-indigo' : ''}`} />
                    <span>{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
                  </button>

                  <button
                    onClick={handleToggleProgress}
                    className={`py-2 px-3.5 rounded-xl border text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                      isPrepared
                        ? 'bg-brand-emerald/15 border-brand-emerald/35 text-brand-emerald'
                        : 'bg-white/[0.02] border-white/5 text-brand-textSec hover:text-white'
                    }`}
                  >
                    <CheckSquare className="h-3.5 w-3.5" />
                    <span>{isPrepared ? 'Prepared' : 'Mark Prepared'}</span>
                  </button>

                  <button
                    onClick={() => navigate('/mock-interview')}
                    className="py-2.5 px-4.5 rounded-xl btn-primary text-xs font-extrabold flex items-center gap-1.5"
                  >
                    <Sparkles className="h-3.5 w-3.5" /> Start Mock Round
                  </button>
                </div>
              </div>

              {/* TABS SELECTORS */}
              <div className="flex gap-2 border-b border-white/5 pb-2.5 overflow-x-auto text-xs">
                {[
                  { id: 'process', label: 'Interview Process', icon: Layers },
                  { id: 'faq', label: 'FAQs', icon: HelpCircle },
                  { id: 'topics', label: 'Syllabus Topics', icon: CheckSquare },
                  { id: 'hr', label: 'HR Questions', icon: MessageCircle },
                  { id: 'blogs', label: 'Solved Blogs', icon: FileText }
                ].map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all flex-shrink-0 border ${
                        activeTab === tab.id
                          ? 'bg-brand-indigo/10 border-brand-indigo/35 text-white'
                          : 'text-brand-textSec border-transparent hover:text-white'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* TAB OUTLET CONTENT */}
              <div className="text-xs text-brand-textSec leading-relaxed min-h-[220px]">
                
                {/* 1. PROCESS TAB */}
                {activeTab === 'process' && (
                  <div className="space-y-4">
                    {companyDetails.interviewProcess.map((step, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-white/5 bg-white/[0.01] flex gap-4 items-start">
                        <div className="h-6 w-6 rounded-full bg-brand-indigo/10 border border-brand-indigo/25 flex items-center justify-center font-bold text-brand-indigo flex-shrink-0 mt-0.5 text-[10px]">
                          {step.stepNumber}
                        </div>
                        <div>
                          <p className="font-bold text-white">{step.title}</p>
                          <p className="text-brand-textSec mt-1.5 leading-relaxed">{step.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 2. FAQ TAB */}
                {activeTab === 'faq' && (
                  <div className="space-y-4">
                    {companyDetails.faq.length === 0 ? (
                      <p className="text-brand-textSec py-6 text-center">No FAQs registered for this company.</p>
                    ) : (
                      companyDetails.faq.map((item, idx) => (
                        <div key={idx} className="p-4 rounded-xl border border-white/5 bg-white/[0.01] space-y-1.5">
                          <p className="font-bold text-white">Q: {item.question}</p>
                          <p className="text-brand-textSec leading-relaxed">A: {item.answer}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 3. SYLLABUS TOPICS TAB */}
                {activeTab === 'topics' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01]">
                      <h5 className="font-bold text-white mb-3 border-b border-white/5 pb-2 uppercase tracking-wider text-[10px]">Aptitude & Cognitive Topics</h5>
                      <ul className="space-y-2 mt-2">
                        {companyDetails.aptitudeTopics.map((top, idx) => (
                          <li key={idx} className="flex gap-2 items-center text-brand-textSec">
                            <span className="text-brand-indigo font-bold">•</span> {top}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01]">
                      <h5 className="font-bold text-white mb-3 border-b border-white/5 pb-2 uppercase tracking-wider text-[10px]">Technical Syllabus</h5>
                      <ul className="space-y-2 mt-2">
                        {companyDetails.technicalTopics.map((top, idx) => (
                          <li key={idx} className="flex gap-2 items-center text-brand-textSec">
                            <span className="text-brand-indigo font-bold">•</span> {top}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* 4. HR QUESTIONS TAB */}
                {activeTab === 'hr' && (
                  <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] space-y-3">
                    <h5 className="font-bold text-white border-b border-white/5 pb-2 uppercase tracking-wider mb-2 text-[10px]">Frequently Asked HR Prompts</h5>
                    <div className="space-y-2 mt-2">
                      {companyDetails.hrQuestions.map((q, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-brand-dark border border-white/5 text-white font-medium">
                          {q}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. SOLVED EXPERIENCE BLOGS TAB */}
                {activeTab === 'blogs' && (
                  <div className="space-y-4">
                    
                    {/* Add Experience Form */}
                    <form onSubmit={handleAddExperience} className="p-4 rounded-xl border border-white/5 bg-white/[0.01] space-y-3">
                      <h5 className="font-bold text-white text-[10px] uppercase tracking-wider">Share Your Interview Experience</h5>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          required
                          placeholder="Your prospective role (e.g. SDE 1)"
                          value={expRole}
                          onChange={e => setExpRole(e.target.value)}
                          className="px-3.5 py-2.5 rounded-xl bg-brand-dark border border-white/5 text-xs text-white placeholder-brand-textSec/30 focus:outline-none focus:border-brand-indigo/40"
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-brand-textSec">Rating:</span>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(stars => (
                              <Star
                                key={stars}
                                onClick={() => setExpRating(stars)}
                                className={`h-4 w-4 cursor-pointer transition-all ${
                                  stars <= expRating ? 'fill-brand-amber text-brand-amber' : 'text-white/15 hover:text-white/30'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      <textarea
                        required
                        placeholder="Detail your interview rounds, question topics, HR behavior..."
                        rows={3}
                        value={expContent}
                        onChange={e => setExpContent(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-brand-dark border border-white/5 text-xs text-white placeholder-brand-textSec/30 focus:outline-none focus:border-brand-indigo/40"
                      />

                      <button
                        type="submit"
                        disabled={submittingExp}
                        className="py-2 px-4 rounded-xl btn-primary text-xs font-bold disabled:bg-brand-indigo/50"
                      >
                        {submittingExp ? 'Posting...' : 'Post Experience'}
                      </button>
                    </form>

                    {companyDetails.previousExperiences.length === 0 ? (
                      <p className="text-brand-textSec py-6 text-center">No experiences shared yet. Be the first!</p>
                    ) : (
                      companyDetails.previousExperiences.map((blog, idx) => (
                        <div key={idx} className="p-4 rounded-xl border border-white/5 bg-white/[0.01] flex flex-col gap-2">
                          <div className="flex justify-between items-center text-[10px] text-brand-textSec">
                            <span className="font-bold text-white">{blog.userName} - {blog.role}</span>
                            <span>{new Date(blog.date).toLocaleDateString()}</span>
                          </div>
                          <p className="text-white leading-relaxed italic mt-1">"{blog.content}"</p>
                          <div className="flex items-center gap-1.5 mt-2">
                            <span className="text-[10px] text-brand-textSec">Candidate Rating:</span>
                            <span className="text-brand-amber font-bold flex gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${i < blog.rating ? 'fill-brand-amber text-brand-amber' : 'text-white/10'}`}
                                />
                              ))}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

              </div>

            </GlassCard>
          ) : (
            <GlassCard className="h-full flex items-center justify-center border-white/5 bg-brand-card py-16">
              <p className="text-xs text-brand-textSec">No company details loaded.</p>
            </GlassCard>
          )}
        </div>

      </div>

    </div>
  );
};

export default CompanyPrep;


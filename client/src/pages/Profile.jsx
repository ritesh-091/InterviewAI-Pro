import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';
import { useNotification } from '../context/NotificationContext';
import { 
  User, 
  Mail, 
  Github, 
  Linkedin, 
  Award, 
  Briefcase, 
  Plus, 
  Trash2, 
  Save,
  BookOpen,
  RefreshCw,
  Zap
} from 'lucide-react';

const Profile = () => {
  const { user, updateUserProfile } = useAuth();
  const { addToast } = useNotification();
  
  // State variables mapped from current user profile context
  const [name, setName] = useState(user?.profile?.name || '');
  const [title, setTitle] = useState(user?.profile?.title || '');
  const [github, setGithub] = useState(user?.profile?.github || '');
  const [linkedin, setLinkedin] = useState(user?.profile?.linkedin || '');
  
  const [skills, setSkills] = useState(user?.profile?.skills || []);
  const [skillInput, setSkillInput] = useState('');

  const [education, setEducation] = useState(user?.profile?.education || []);
  const [school, setSchool] = useState('');
  const [degree, setDegree] = useState('');
  const [year, setYear] = useState('');

  const [projects, setProjects] = useState(user?.profile?.projects || []);
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projectTechs, setProjectTechs] = useState('');
  const [projectLink, setProjectLink] = useState('');

  const [saving, setSaving] = useState(false);

  const handleAddSkill = (e) => {
    e.preventDefault();
    const clean = skillInput.trim();
    if (clean && !skills.includes(clean)) {
      setSkills(prev => [...prev, clean]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill) => {
    setSkills(prev => prev.filter(s => s !== skill));
  };

  const handleAddEducation = (e) => {
    e.preventDefault();
    if (!school || !degree || !year) return;
    setEducation(prev => [...prev, { institution: school, degree, year }]);
    setSchool('');
    setDegree('');
    setYear('');
  };

  const handleRemoveEducation = (index) => {
    setEducation(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddProject = (e) => {
    e.preventDefault();
    if (!projectTitle || !projectDesc) return;
    const techs = projectTechs.split(',').map(t => t.trim()).filter(Boolean);
    setProjects(prev => [...prev, {
      title: projectTitle,
      description: projectDesc,
      technologies: techs,
      link: projectLink
    }]);
    setProjectTitle('');
    setProjectDesc('');
    setProjectTechs('');
    setProjectLink('');
  };

  const handleRemoveProject = (index) => {
    setProjects(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateUserProfile({
        name,
        title,
        skills,
        education,
        projects,
        github,
        linkedin
      });
      addToast('Profile Updated', 'Your settings have been saved successfully.', 'success');
    } catch (err) {
      console.error(err);
      addToast('Update Failed', err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-4">
        <div>
          <h2 className="text-2xl font-black text-white">Profile Settings</h2>
          <p className="text-xs text-brand-textSec">Manage developer tags, academics, projects list, and social link paths</p>
        </div>
        <button
          onClick={handleSaveProfile}
          disabled={saving}
          className="mt-4 md:mt-0 py-2.5 px-6 rounded-xl btn-primary text-xs font-extrabold flex items-center gap-1.5"
        >
          {saving ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Saving Profile...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Profile
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Core Coordinates card */}
        <div className="flex flex-col gap-6">
          <GlassCard className="border-white/5 bg-brand-card flex flex-col gap-4">
            <h4 className="font-bold text-xs text-white uppercase tracking-widest border-b border-white/5 pb-2">Core Info</h4>
            
            <div className="flex flex-col gap-4 text-xs">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-brand-textSec font-bold">Display Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-brand-textSec/50" />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-brand-dark border border-white/5 focus:outline-none focus:border-brand-indigo/40 text-white placeholder-brand-textSec/30"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-brand-textSec font-bold">Professional Title</label>
                <div className="relative">
                  <Briefcase className="absolute left-3.5 top-3 h-4 w-4 text-brand-textSec/50" />
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-brand-dark border border-white/5 focus:outline-none focus:border-brand-indigo/40 text-white placeholder-brand-textSec/30"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-brand-textSec font-bold">GitHub URL</label>
                <div className="relative">
                  <Github className="absolute left-3.5 top-3 h-4 w-4 text-brand-textSec/50" />
                  <input
                    type="text"
                    value={github}
                    placeholder="https://github.com/username"
                    onChange={e => setGithub(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-brand-dark border border-white/5 focus:outline-none focus:border-brand-indigo/40 text-white placeholder-brand-textSec/30"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-brand-textSec font-bold">LinkedIn URL</label>
                <div className="relative">
                  <Linkedin className="absolute left-3.5 top-3 h-4 w-4 text-brand-textSec/50" />
                  <input
                    type="text"
                    value={linkedin}
                    placeholder="https://linkedin.com/in/username"
                    onChange={e => setLinkedin(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-brand-dark border border-white/5 focus:outline-none focus:border-brand-indigo/40 text-white placeholder-brand-textSec/30"
                  />
                </div>
              </div>

            </div>
          </GlassCard>

          {/* Technical Skills card */}
          <GlassCard className="border-white/5 bg-brand-card flex flex-col gap-3">
            <h4 className="font-bold text-xs text-white uppercase tracking-widest border-b border-white/5 pb-2">Skills Inventory</h4>
            
            {/* Input tag */}
            <form onSubmit={handleAddSkill} className="flex gap-2">
              <input
                type="text"
                placeholder="React, Java, MySQL..."
                value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                className="flex-grow px-3 py-2 rounded-xl bg-brand-dark border border-white/5 text-xs text-white placeholder-brand-textSec/30 focus:outline-none focus:border-brand-indigo/40"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl btn-primary text-xs font-bold"
              >
                Add
              </button>
            </form>

            <div className="flex flex-wrap gap-2 mt-2">
              {skills.map(s => (
                <span
                  key={s}
                  onClick={() => handleRemoveSkill(s)}
                  className="px-2.5 py-1 rounded-lg bg-brand-indigo/10 border border-brand-indigo/20 text-brand-indigo text-[10px] font-bold cursor-pointer hover:bg-brand-rose/10 hover:border-brand-rose/25 hover:text-brand-rose transition-colors"
                  title="Click to remove"
                >
                  {s} ✕
                </span>
              ))}
            </div>
          </GlassCard>

          {/* Achievements & Badges Card */}
          <GlassCard className="border-white/5 bg-brand-card flex flex-col gap-3">
            <h4 className="font-bold text-xs text-white uppercase tracking-widest border-b border-white/5 pb-2">Unlocked Achievements</h4>
            <div className="flex flex-col gap-2 mt-1.5 text-xs">
              {(!user?.profile?.achievements || user.profile.achievements.length === 0) ? (
                <span className="text-brand-textSec italic">No achievements unlocked yet. Solve coding runs or complete mocks to earn badges!</span>
              ) : (
                user.profile.achievements.map((ach) => (
                  <div
                    key={ach}
                    className="p-3 rounded-xl border border-brand-indigo/15 bg-brand-indigo/[0.02] flex items-center justify-between text-white"
                  >
                    <span className="font-bold flex items-center gap-1.5"><Zap className="h-4 w-4 text-brand-indigo" /> {ach}</span>
                    <span className="text-[9px] text-brand-indigo bg-brand-indigo/10 border border-brand-indigo/25 px-2 py-0.5 rounded font-black uppercase tracking-wider">Unlocked</span>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </div>

        {/* Education & Projects details columns */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Education Form details */}
          <GlassCard className="border-white/5 bg-brand-card flex flex-col gap-4">
            <h4 className="font-bold text-xs text-white uppercase tracking-widest border-b border-white/5 pb-2 flex items-center gap-1.5">
              <BookOpen className="h-4.5 w-4.5 text-brand-indigo" /> Academic Timeline
            </h4>
            
            <form onSubmit={handleAddEducation} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div className="md:col-span-2 flex flex-col gap-1 text-[11px]">
                <label className="text-brand-textSec font-bold">Institution</label>
                <input
                  type="text"
                  required
                  placeholder="Stanford University"
                  value={school}
                  onChange={e => setSchool(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-brand-dark border border-white/5 text-xs text-white focus:outline-none focus:border-brand-indigo/40"
                />
              </div>
              <div className="flex flex-col gap-1 text-[11px]">
                <label className="text-brand-textSec font-bold">Degree / Major</label>
                <input
                  type="text"
                  required
                  placeholder="B.S. CS"
                  value={degree}
                  onChange={e => setDegree(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-brand-dark border border-white/5 text-xs text-white focus:outline-none focus:border-brand-indigo/40"
                />
              </div>
              <div className="flex gap-2 items-center w-full">
                <div className="flex flex-col gap-1 text-[11px] flex-grow">
                  <label className="text-brand-textSec font-bold">Year</label>
                  <input
                    type="text"
                    required
                    placeholder="2025"
                    value={year}
                    onChange={e => setYear(e.target.value)}
                    className="px-2 py-2 rounded-lg bg-brand-dark border border-white/5 text-xs text-white focus:outline-none focus:border-brand-indigo/40"
                  />
                </div>
                <button
                  type="submit"
                  className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-brand-indigo hover:text-white transition-all flex-shrink-0"
                  title="Add education"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </form>

            <div className="space-y-2 mt-2">
              {education.map((edu, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border border-white/5 bg-white/[0.01] flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-white">{edu.degree}</p>
                    <p className="text-brand-textSec mt-0.5">{edu.institution} • {edu.year}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveEducation(idx)}
                    className="p-1.5 rounded-lg hover:bg-brand-rose/10 text-brand-textSec hover:text-brand-rose transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Projects timeline card */}
          <GlassCard className="border-white/5 bg-brand-card flex flex-col gap-4">
            <h4 className="font-bold text-xs text-white uppercase tracking-widest border-b border-white/5 pb-2 flex items-center gap-1.5">
              <Award className="h-4.5 w-4.5 text-brand-indigo" /> Projects Repository
            </h4>

            <form onSubmit={handleAddProject} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1 text-[11px]">
                  <label className="text-brand-textSec font-bold">Project Name</label>
                  <input
                    type="text"
                    placeholder="E-commerce Engine"
                    value={projectTitle}
                    onChange={e => setProjectTitle(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-brand-dark border border-white/5 text-xs text-white focus:outline-none focus:border-brand-indigo/40"
                  />
                </div>
                <div className="flex flex-col gap-1 text-[11px]">
                  <label className="text-brand-textSec font-bold">Technologies (Comma separated)</label>
                  <input
                    type="text"
                    placeholder="React, Redis, PostgreSQL"
                    value={projectTechs}
                    onChange={e => setProjectTechs(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-brand-dark border border-white/5 text-xs text-white focus:outline-none focus:border-brand-indigo/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                <div className="md:col-span-2 flex flex-col gap-1 text-[11px]">
                  <label className="text-brand-textSec font-bold">Project Description</label>
                  <input
                    type="text"
                    placeholder="Built a high-performance system serving 10k users..."
                    value={projectDesc}
                    onChange={e => setProjectDesc(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-brand-dark border border-white/5 text-xs text-white focus:outline-none focus:border-brand-indigo/40"
                  />
                </div>
                <div className="flex flex-col gap-1 text-[11px]">
                  <label className="text-brand-textSec font-bold">Repository Link</label>
                  <input
                    type="text"
                    placeholder="https://github.com/..."
                    value={projectLink}
                    onChange={e => setProjectLink(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-brand-dark border border-white/5 text-xs text-white focus:outline-none focus:border-brand-indigo/40"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl btn-secondary hover:bg-white/5 text-white transition-all flex items-center justify-center gap-1 text-xs font-bold"
                >
                  <Plus className="h-4 w-4" /> Add Project
                </button>
              </div>
            </form>

            <div className="space-y-3 mt-2">
              {projects.map((proj, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-white/5 bg-white/[0.01] flex flex-col gap-2 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-white">{proj.title}</p>
                      {proj.link && (
                        <a href={proj.link} target="_blank" rel="noreferrer" className="text-[10px] text-brand-indigo hover:underline">
                          Repository URL
                        </a>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveProject(idx)}
                      className="p-1.5 rounded-lg hover:bg-brand-rose/10 text-brand-textSec hover:text-brand-rose transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-brand-textSec leading-relaxed font-outfit">{proj.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {proj.technologies.map(t => (
                      <span key={t} className="px-2 py-0.5 rounded bg-brand-dark border border-white/5 text-[9px] font-bold text-brand-textSec">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

        </div>

      </div>

    </div>
  );
};

export default Profile;


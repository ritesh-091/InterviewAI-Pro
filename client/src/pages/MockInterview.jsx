import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import GlassCard from '../components/GlassCard';
import { useNotification } from '../context/NotificationContext';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  ArrowRight,
  TrendingUp,
  MessageSquare,
  Award,
  BookOpen,
  ChevronRight,
  Home,
  RefreshCw,
  Clock,
  Play
} from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import io from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';

const MockInterview = () => {
  const [step, setStep] = useState('select'); // select, interview, result
  const [type, setType] = useState('Technical'); // HR, Technical, System Design, Behavioral, Coding
  const [interview, setInterview] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Speech Recognition States
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState(null);
  
  // Text-To-Speech States
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Audio Playback Recording States
  const [mediaStream, setMediaStream] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordings, setRecordings] = useState([]);

  const { addToast } = useNotification();
  const navigate = useNavigate();
  const { interviewId } = useParams();
  const [searchParams] = useSearchParams();
  const sessionParam = searchParams.get('session');

  // Real-time WebSocket states
  const [socket, setSocket] = useState(null);
  const [evaluatorStatus, setEvaluatorStatus] = useState('listening');
  const [evaluatorMsg, setEvaluatorMsg] = useState('AI is listening closely...');

  // Load past results directly if parameters exist in route
  useEffect(() => {
    if (interviewId) {
      const fetchResult = async () => {
        setLoading(true);
        try {
          const res = await apiRequest(`/interviews/result/${interviewId}`);
          setResult(res);
          setStep('result');
        } catch (err) {
          addToast('Error Loading Result', err.message, 'error');
        } finally {
          setLoading(false);
        }
      };
      fetchResult();
    }
  }, [interviewId]);

  // WebSockets Connection Lifecycle Hook
  useEffect(() => {
    if (step === 'interview' && interview?._id) {
      const socketUrl = window.location.origin.includes('localhost') 
        ? 'http://localhost:5000' 
        : (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : window.location.origin);

      const socketConn = io(socketUrl, { transports: ['websocket'] });
      setSocket(socketConn);

      socketConn.emit('join-session', interview._id);

      socketConn.on('evaluator-status', (data) => {
        setEvaluatorStatus(data.status);
        setEvaluatorMsg(data.message);
      });

      return () => {
        socketConn.disconnect();
      };
    }
  }, [step, interview?._id]);

  // Invites Landing Query Session Loader Hook
  useEffect(() => {
    const checkInviteSession = async () => {
      if (sessionParam && step === 'select') {
        setLoading(true);
        try {
          const res = await apiRequest(`/interviews/${sessionParam}`);
          setInterview(res);
          setCurrentQuestion(res.questions[res.currentIndex || 0].question);
          setType(res.type);
          setStep('interview');
          addToast('Session Loaded', `Recruiter invited Mock ${res.type} Round loaded.`, 'success');
        } catch (err) {
          addToast('Session Error', 'Could not load invited interview round.', 'error');
        } finally {
          setLoading(false);
        }
      }
    };
    checkInviteSession();
  }, [sessionParam]);

  // Initialize Speech Recognition on mount
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        setAnswerText(prev => prev + ' ' + transcript);
      };

      rec.onerror = (e) => {
        console.error('Speech Recognition Error:', e);
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      setRecognition(rec);
    }
  }, []);

  const toggleRecording = () => {
    if (!recognition) {
      addToast('Browser Error', 'Speech recognition is not supported in this browser.', 'warning');
      return;
    }

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
      if (socket && interview?._id) {
        socket.emit('candidate-status', { room: interview._id, status: 'paused' });
      }
    } else {
      recognition.start();
      setIsRecording(true);
      if (socket && interview?._id) {
        socket.emit('candidate-status', { room: interview._id, status: 'speaking' });
      }
      addToast('Microphone Active', 'Recording your response. Speak clearly.', 'info');
    }
  };

  const [lastBlob, setLastBlob] = useState(null);

  const startRecordingForQuestion = (stream) => {
    if (!stream) return;
    try {
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setLastBlob(blob);
        const url = URL.createObjectURL(blob);
        setRecordings(prev => [...prev, url]);
      };
      recorder.start();
      setMediaRecorder(recorder);
    } catch (err) {
      console.error('Failed to start media recorder:', err);
    }
  };

  const handleSpeak = (text) => {
    if (!('speechSynthesis' in window)) {
      addToast('Browser Error', 'Text-to-speech is not supported in this browser.', 'warning');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleStart = async () => {
    setLoading(true);
    let stream = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMediaStream(stream);
    } catch (streamErr) {
      console.warn('Microphone stream blocked for replay features:', streamErr);
    }

    try {
      const res = await apiRequest('/interviews/start', {
        method: 'POST',
        body: JSON.stringify({ type })
      });
      setInterview(res);
      setCurrentQuestion(res.questions[0].question);
      setStep('interview');
      addToast('Session Started', `Mock ${type} Interview loaded. Good luck!`, 'success');
      
      setRecordings([]); // Clear any previous recordings
      setLastBlob(null);

      if (stream) {
        startRecordingForQuestion(stream);
      }

      // Auto-read first question
      setTimeout(() => handleSpeak(res.questions[0].question), 800);
    } catch (err) {
      addToast('Start Failed', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!answerText.trim()) {
      addToast('Missing Answer', 'Please speak or type a response first.', 'warning');
      return;
    }

    setLoading(true);
    
    // Notify socket evaluating state
    if (socket && interview?._id) {
      socket.emit('candidate-status', { room: interview._id, status: 'evaluating' });
    }

    // Stop recording and speaking if active
    if (isRecording) recognition.stop();
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    // Stop MediaRecorder to save audio blob URL
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }

    // Small delay to ensure mediaRecorder triggers onstop and populates lastBlob
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      const formData = new FormData();
      formData.append('interviewId', interview._id);
      formData.append('answer', answerText);
      if (lastBlob) {
        formData.append('audio', lastBlob, `answer_${interview.currentIndex}.webm`);
      }

      const res = await apiRequest('/interviews/answer', {
        method: 'POST',
        body: formData
      });

      setAnswerText('');
      setLastBlob(null);

      if (res.isFinished) {
        if (mediaStream) {
          mediaStream.getTracks().forEach(t => t.stop());
        }
        setResult(res.result);
        setStep('result');
        addToast('Interview Completed', 'Final grades compiled successfully!', 'success');
      } else {
        setCurrentQuestion(res.nextQuestion);
        setInterview(prev => ({
          ...prev,
          currentIndex: res.currentIndex,
          questions: [...prev.questions.slice(0, -1), res.evaluatedQuestion, { question: res.nextQuestion }]
        }));
        
        addToast('Answer Saved', 'Evaluation saved. Loading next question.', 'success');
        
        // Notify socket thinking state
        if (socket && interview?._id) {
          socket.emit('candidate-status', { room: interview._id, status: 'thinking' });
        }

        // Start recording next question
        if (mediaStream) {
          setTimeout(() => {
            startRecordingForQuestion(mediaStream);
          }, 500);
        }

        // Auto-read next question
        setTimeout(() => handleSpeak(res.nextQuestion), 1000);
      }
    } catch (err) {
      addToast('Submission Failed', err.message, 'error');
      if (mediaStream) {
        startRecordingForQuestion(mediaStream);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="border-b border-white/5 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-black text-white">AI Mock Interview Simulator</h2>
          <p className="text-xs text-brand-textSec">Practice under technical, system design, or behavioral tracks with voice features</p>
        </div>
      </div>

      {/* STEP 1: Select Type */}
      {step === 'select' && (
        <div className="max-w-2xl mx-auto py-6">
          <GlassCard className="border-white/5 flex flex-col gap-6 bg-brand-card">
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-bold text-white uppercase tracking-wider">Select Interview Profile</h3>
              <p className="text-xs text-brand-textSec">Choose a focused track to practice. AI asks 5 questions sequentially.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'HR', desc: 'Behavior, cultural, salary negotiations, relocation limits.' },
                { name: 'Technical', desc: 'React, NodeJS, DB architectures, memory stacks.' },
                { name: 'System Design', desc: 'URL shorteners, distributed caching, messaging servers.' },
                { name: 'Behavioral', desc: 'Conflict management, project bottlenecks, tight timelines.' },
                { name: 'Coding', desc: 'Algorithmic layouts, data structures, complexities.' }
              ].map(profile => (
                <div
                  key={profile.name}
                  onClick={() => setType(profile.name)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col gap-1.5 ${
                    type === profile.name
                      ? 'border-brand-indigo bg-brand-indigo/10 shadow-[0_0_20px_rgba(99,102,241,0.1)]'
                      : 'border-white/5 hover:border-white/10 bg-white/[0.01]'
                  }`}
                >
                  <span className="font-extrabold text-sm text-white">{profile.name} Track</span>
                  <span className="text-[11px] text-brand-textSec leading-normal">{profile.desc}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleStart}
              disabled={loading}
              className="w-full py-3.5 rounded-xl btn-primary font-bold text-xs flex items-center justify-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {loading ? 'Starting Session...' : 'Launch Simulation'}
            </button>
          </GlassCard>
        </div>
      )}

      {/* STEP 2: Live Interview Interface */}
      {step === 'interview' && interview && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Avatar Panel & Transcription Feed */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <GlassCard className="border-white/5 aspect-video md:aspect-square flex flex-col justify-between items-center bg-brand-card relative overflow-hidden">
              <div className="absolute top-4 left-4 px-2.5 py-0.5 rounded-full bg-brand-indigo/10 border border-brand-indigo/35 text-brand-indigo text-[9px] uppercase font-black tracking-widest animate-pulse">
                Live Simulator
              </div>
              
              {/* Graphic Animated AI Face Circle */}
              <div className="flex-1 flex items-center justify-center">
                <div className={`h-28 w-28 rounded-full bg-brand-indigo/10 border-2 border-brand-indigo/30 flex items-center justify-center transition-all duration-300 ${
                  isSpeaking ? 'scale-105 border-brand-indigo shadow-[0_0_30px_rgba(99,102,241,0.3)]' : ''
                }`}>
                  <div className={`h-20 w-20 rounded-full bg-brand-indigo/20 flex items-center justify-center font-black text-brand-indigo text-xl border border-brand-indigo/20 ${
                    isSpeaking ? 'animate-pulse' : ''
                  }`}>
                    AI
                  </div>
                </div>
              </div>

              {/* Voice Wave Animation */}
              {isSpeaking && (
                <div className="flex items-end gap-1 mb-4 h-6">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-brand-indigo rounded voice-wave-bar"
                      style={{
                        height: '100%',
                        animationDelay: `${i * 150}ms`,
                      }}
                    />
                  ))}
                </div>
              )}

              <div className="w-full border-t border-white/5 p-3.5 flex justify-between items-center text-xs text-brand-textSec">
                <span>Question {interview.currentIndex + 1} of 5</span>
                <span className="font-bold text-brand-indigo uppercase tracking-wider">{type} Round</span>
              </div>
            </GlassCard>
          </div>

          {/* Dialog Chat Response Inputs */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <GlassCard className="border-white/5 flex flex-col gap-6 flex-grow bg-brand-card">
              
              {/* Active question dialog prompt */}
              <div className="p-4.5 rounded-2xl border border-white/5 bg-white/[0.01] flex flex-col gap-3 relative">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-brand-textSec font-bold uppercase tracking-widest flex items-center gap-2">
                    Interviewer Prompt
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium bg-brand-indigo/10 text-brand-indigo border border-brand-indigo/20">
                      Status: {evaluatorMsg}
                    </span>
                  </span>
                  <button
                    onClick={() => handleSpeak(currentQuestion)}
                    className={`p-2 rounded-xl border transition-all ${
                      isSpeaking 
                        ? 'bg-brand-rose/10 border-brand-rose/20 text-brand-rose hover:bg-brand-rose/25' 
                        : 'bg-white/[0.03] border-white/5 text-brand-textSec hover:text-white'
                    }`}
                    title={isSpeaking ? 'Stop Speaking' : 'Read Question Aloud'}
                  >
                    {isSpeaking ? <VolumeX className="h-4.5 w-4.5" /> : <Volume2 className="h-4.5 w-4.5" />}
                  </button>
                </div>
                <p className="text-white text-sm font-semibold leading-relaxed font-outfit">{currentQuestion}</p>
              </div>

              {/* Text / Voice input form */}
              <form onSubmit={handleSubmitAnswer} className="space-y-4 flex-grow flex flex-col justify-between">
                <div className="flex flex-col gap-2 flex-grow">
                  <label className="text-[10px] font-bold text-brand-textSec uppercase tracking-widest">Your Response</label>
                  <textarea
                    rows={6}
                    required
                    placeholder="Type or click the microphone to speak your response..."
                    value={answerText}
                    onChange={(e) => {
                      setAnswerText(e.target.value);
                      if (socket && interview?._id) {
                        socket.emit('candidate-status', { room: interview._id, status: 'speaking' });
                      }
                    }}
                    className="w-full flex-grow p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-xs text-white focus:outline-none focus:border-brand-indigo/40 transition-colors placeholder-brand-textSec/30 resize-none min-h-[140px]"
                  />
                </div>

                <div className="flex justify-between items-center gap-4 border-t border-white/5 pt-4">
                  {/* Mic trigger toggle */}
                  <button
                    type="button"
                    onClick={toggleRecording}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-center gap-2 text-xs font-bold ${
                      isRecording
                        ? 'bg-brand-rose border-brand-rose text-white shadow-[0_0_15px_rgba(239,68,68,0.25)] animate-pulse'
                        : 'bg-white/[0.03] border-white/5 text-brand-textSec hover:text-white hover:bg-white/[0.08]'
                    }`}
                  >
                    {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    {isRecording ? 'Recording...' : 'Speak Response'}
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="py-3 px-6 rounded-xl btn-primary text-xs font-extrabold flex items-center justify-center gap-1.5"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        Evaluating...
                      </>
                    ) : (
                      <>
                        Submit Response
                        <ChevronRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>

            </GlassCard>
          </div>

        </div>
      )}

      {/* STEP 3: Report scorecard view */}
      {step === 'result' && result && (
        <div className="space-y-6 max-w-4xl mx-auto">
          
          {/* Main Average Score Banner */}
          <GlassCard className="border-white/5 grid grid-cols-2 md:grid-cols-4 gap-6 text-center bg-brand-card">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-brand-textSec uppercase font-bold tracking-widest">Overall Score</span>
              <h3 className="text-3xl font-black text-brand-emerald">{result.overallScore}%</h3>
            </div>
            <div className="flex flex-col gap-1 border-l border-white/5">
              <span className="text-[10px] text-brand-textSec uppercase font-bold tracking-widest">Communication</span>
              <h3 className="text-3xl font-black text-white">{result.communicationScore}%</h3>
            </div>
            <div className="flex flex-col gap-1 border-l border-white/5">
              <span className="text-[10px] text-brand-textSec uppercase font-bold tracking-widest">Technical Skill</span>
              <h3 className="text-3xl font-black text-white">{result.technicalScore}%</h3>
            </div>
            <div className="flex flex-col gap-1 border-l border-white/5">
              <span className="text-[10px] text-brand-textSec uppercase font-bold tracking-widest">Confidence Index</span>
              <h3 className="text-3xl font-black text-white">{result.confidenceScore}%</h3>
            </div>
          </GlassCard>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Feedbacks details */}
            <div className="md:col-span-2 flex flex-col gap-6">
              
              <GlassCard className="border-white/5 flex flex-col gap-3 bg-brand-card">
                <h4 className="font-bold text-sm text-white uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="h-4.5 w-4.5 text-brand-indigo" /> Executive Feedback
                </h4>
                <p className="text-xs text-brand-textSec leading-relaxed whitespace-pre-wrap">{result.detailedFeedback}</p>
              </GlassCard>

              {/* Suggestions per question */}
              <GlassCard className="border-white/5 flex flex-col gap-3 bg-brand-card">
                <h4 className="font-bold text-sm text-white uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="h-4.5 w-4.5 text-brand-cyan" /> Solution Recommendations
                </h4>
                <div className="space-y-4">
                  {result.suggestedAnswers.map((item, index) => (
                    <div key={index} className="p-4 rounded-xl bg-white/[0.01] border border-white/5 text-xs space-y-3">
                      <p className="font-bold text-white">Q: {item.question}</p>
                      
                      {(recordings[index] || result.interviewId?.questions?.[index]?.recordingUrl) && (
                        <div className="flex items-center gap-3 bg-white/[0.02] p-2.5 rounded-xl border border-white/5 w-full max-w-md">
                          <span className="text-[9px] text-brand-indigo font-bold uppercase tracking-widest flex-shrink-0">Replay answer:</span>
                          <audio controls src={recordings[index] || result.interviewId.questions[index].recordingUrl} className="h-7 w-full max-w-sm accent-brand-indigo" />
                        </div>
                      )}

                      <p className="text-brand-textSec leading-relaxed">
                        <span className="text-brand-indigo font-bold block mb-1">Suggested Better Answer:</span> {item.betterAnswer}
                      </p>
                    </div>
                  ))}
                </div>
              </GlassCard>

            </div>

            {/* Side column: Areas of Improvement */}
            <div className="flex flex-col gap-6">
              <GlassCard className="border-white/5 flex flex-col gap-4 bg-brand-card">
                <h4 className="font-bold text-sm text-white uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="h-4.5 w-4.5 text-brand-rose" /> Focus Areas
                </h4>
                <div className="flex flex-col gap-3 text-xs leading-relaxed text-brand-textSec">
                  {result.improvementAreas.map((area, i) => (
                    <div key={i} className="flex gap-2.5 items-start">
                      <span className="text-brand-rose font-bold mt-0.5">•</span>
                      <span>{area}</span>
                    </div>
                  ))}
                </div>
              </GlassCard>

              <button
                onClick={() => navigate('/')}
                className="w-full py-3.5 rounded-xl btn-secondary text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Home className="h-4 w-4" /> Go back to Dashboard
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default MockInterview;


import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Context Providers
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider } from './context/AuthContext';

// Components
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy-loaded Pages
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ResumeAnalyzer = lazy(() => import('./pages/ResumeAnalyzer'));
const MockInterview = lazy(() => import('./pages/MockInterview'));
const CodingPractice = lazy(() => import('./pages/CodingPractice'));
const CareerCoach = lazy(() => import('./pages/CareerCoach'));
const CompanyPrep = lazy(() => import('./pages/CompanyPrep'));
const Profile = lazy(() => import('./pages/Profile'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const RecruiterDashboard = lazy(() => import('./pages/RecruiterDashboard'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-400 font-medium animate-pulse">Loading InterviewAI Pro...</p>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <NotificationProvider>
        <LanguageProvider>
          <ThemeProvider>
            <AuthProvider>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  
                  {/* Public Auth Routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/verify-email" element={<VerifyEmail />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />

                  {/* Secure Protected Workspace Routes */}
                  <Route
                    path="/*"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <Suspense fallback={<PageLoader />}>
                            <Routes>
                              <Route path="/" element={<Dashboard />} />
                              <Route path="/resume-analyzer" element={<ResumeAnalyzer />} />
                              <Route path="/mock-interview" element={<MockInterview />} />
                              <Route path="/mock-interview/result/:interviewId" element={<MockInterview />} />
                              <Route path="/coding-practice" element={<CodingPractice />} />
                              <Route path="/career-coach" element={<CareerCoach />} />
                              <Route path="/company-prep" element={<CompanyPrep />} />
                              <Route path="/profile" element={<Profile />} />
                              
                              {/* Recruiter Only Route */}
                              <Route
                                path="/recruiter"
                                element={
                                  <ProtectedRoute recruiterOnly>
                                    <RecruiterDashboard />
                                  </ProtectedRoute>
                                }
                              />

                              {/* Admin Only Route */}
                              <Route
                                path="/admin"
                                element={
                                  <ProtectedRoute adminOnly>
                                    <AdminPanel />
                                  </ProtectedRoute>
                                }
                              />
                            </Routes>
                          </Suspense>
                        </Layout>
                      </ProtectedRoute>
                    }
                  />

                </Routes>
              </Suspense>
            </AuthProvider>
          </ThemeProvider>
        </LanguageProvider>
      </NotificationProvider>
    </Router>
  );
}

export default App;

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Context Providers
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider } from './context/AuthContext';

// Components
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import ResumeAnalyzer from './pages/ResumeAnalyzer';
import MockInterview from './pages/MockInterview';
import CodingPractice from './pages/CodingPractice';
import CareerCoach from './pages/CareerCoach';
import CompanyPrep from './pages/CompanyPrep';
import Profile from './pages/Profile';
import Subscriptions from './pages/Subscriptions';
import AdminPanel from './pages/AdminPanel';
import RecruiterDashboard from './pages/RecruiterDashboard';

function App() {
  return (
    <Router>
      <NotificationProvider>
        <LanguageProvider>
          <ThemeProvider>
            <AuthProvider>
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
                        <Routes>
                          <Route path="/" element={<Dashboard />} />
                          <Route path="/resume-analyzer" element={<ResumeAnalyzer />} />
                          <Route path="/mock-interview" element={<MockInterview />} />
                          <Route path="/mock-interview/result/:interviewId" element={<MockInterview />} />
                          <Route path="/coding-practice" element={<CodingPractice />} />
                          <Route path="/career-coach" element={<CareerCoach />} />
                          <Route path="/company-prep" element={<CompanyPrep />} />
                          <Route path="/profile" element={<Profile />} />
                          <Route path="/subscriptions" element={<Subscriptions />} />
                          
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
                      </Layout>
                    </ProtectedRoute>
                  }
                />

              </Routes>
            </AuthProvider>
          </ThemeProvider>
        </LanguageProvider>
      </NotificationProvider>
    </Router>
  );
}

export default App;

import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

const CompanyHome = lazy(() => import('./pages/CompanyHome/CompanyHome'));
const TalentFeed = lazy(() => import('./pages/TalentFeed/TalentFeed'));
const InterviewRequests = lazy(() => import('./pages/InterviewRequests/InterviewRequests'));

const Loading = () => (
  <div style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:'#0a0a0f' }}>
    <Loader2 size={36} style={{ color:'#6366f1', animation:'spin 1s linear infinite' }} />
  </div>
);

export default function CompanyDashboard() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/dashboard" element={<CompanyHome />} />
        <Route path="/talent"    element={<TalentFeed />} />
        <Route path="/interviews" element={<InterviewRequests />} />
        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/company/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}

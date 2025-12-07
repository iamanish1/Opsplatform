import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './features/landing';
import StudentAuth from './features/auth/pages/StudentAuth/StudentAuth';
import CompanyLogin from './features/auth/pages/CompanyLogin/CompanyLogin';
import CompanySignup from './features/auth/pages/CompanySignup/CompanySignup';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth/student" element={<StudentAuth />} />
        <Route path="/auth/company/login" element={<CompanyLogin />} />
        <Route path="/auth/company/signup" element={<CompanySignup />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;


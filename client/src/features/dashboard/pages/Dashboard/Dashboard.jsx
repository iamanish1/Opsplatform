import { memo } from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout';
import DashboardOverview from '../../components/DashboardOverview/DashboardOverview';
import LessonsSection from '../../components/LessonsSection/LessonsSection';
import ProjectsSection from '../../components/ProjectsSection/ProjectsSection';
import SubmissionsSection from '../../components/SubmissionsSection/SubmissionsSection';
import PortfolioSection from '../../components/PortfolioSection/PortfolioSection';
import Lessons from '../Lessons/Lessons';
import LessonDetail from '../LessonDetail/LessonDetail';
import Projects from '../Projects/Projects';
import ProjectDetail from '../ProjectDetail/ProjectDetail';
import Submissions from '../Submissions/Submissions';
import SubmissionDetail from '../SubmissionDetail/SubmissionDetail';
import Portfolios from '../Portfolios/Portfolios';
import Settings from '../Settings/Settings';
import styles from './Dashboard.module.css';

const Dashboard = memo(() => {
  return (
    <Routes>
      {/* Main Dashboard */}
      <Route
        path="/"
        element={
          <DashboardLayout>
            <div className={styles.dashboardContent}>
              {/* Overview Section - Top Stats Cards */}
              <DashboardOverview />

              {/* Lessons Module Section */}
              <LessonsSection />

              {/* Projects Section */}
              <ProjectsSection />

              {/* Submissions & PR Tracking */}
              <SubmissionsSection />

              {/* Portfolio & Certificates */}
              <PortfolioSection />
            </div>
          </DashboardLayout>
        }
      />

      {/* Lessons Routes */}
      <Route path="/lessons" element={<Lessons />} />
      <Route path="/lessons/:id" element={<LessonDetail />} />

      {/* Projects Routes */}
      <Route path="/projects" element={<Projects />} />
      <Route path="/projects/:id" element={<ProjectDetail />} />

      {/* Submissions Routes */}
      <Route path="/submissions" element={<Submissions />} />
      <Route path="/submissions/:id" element={<SubmissionDetail />} />

      {/* Portfolios Routes */}
      <Route path="/portfolios" element={<Portfolios />} />

      {/* Settings Route */}
      <Route path="/settings" element={<Settings />} />
    </Routes>
  );
});

Dashboard.displayName = 'Dashboard';

export default Dashboard;

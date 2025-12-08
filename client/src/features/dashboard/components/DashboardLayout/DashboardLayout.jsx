import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import DashboardHeader from '../DashboardHeader/DashboardHeader';
import Sidebar from '../Sidebar/Sidebar';
import useReducedMotion from '../../../../hooks/useReducedMotion';
import styles from './DashboardLayout.module.css';

const DashboardLayout = memo(({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const location = useLocation();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className={styles.dashboardLayout}>
      {/* Animated Background */}
      <div className={styles.background}>
        <div className={`${styles.gradientOrb} ${styles.orb1}`}></div>
        <div className={`${styles.gradientOrb} ${styles.orb2}`}></div>
        <div className={`${styles.gradientOrb} ${styles.orb3}`}></div>
      </div>

      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={toggleSidebar}
        mobileMenuOpen={mobileMenuOpen}
        onMobileMenuToggle={toggleMobileMenu}
        currentPath={location.pathname}
      />

      {/* Main Content Area */}
      <div className={`${styles.mainContent} ${!sidebarOpen ? styles.mainContentExpanded : ''}`}>
        {/* Header */}
        <DashboardHeader 
          onMenuClick={toggleMobileMenu}
          sidebarOpen={sidebarOpen}
          onSidebarToggle={toggleSidebar}
        />

        {/* Page Content */}
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
});

DashboardLayout.displayName = 'DashboardLayout';

export default DashboardLayout;

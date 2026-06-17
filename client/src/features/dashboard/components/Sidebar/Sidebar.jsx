import { memo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../../../contexts/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  FolderKanban,
  FileCode,
  Award,
  Settings,
  Zap,
  X,
  LogOut,
  User,
  Inbox,
} from 'lucide-react';
import useReducedMotion from '../../../../hooks/useReducedMotion';
import styles from './Sidebar.module.css';

const Sidebar = memo(({ isOpen, onToggle, mobileMenuOpen, onMobileMenuToggle, currentPath }) => {
  const prefersReducedMotion = useReducedMotion();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: BookOpen, label: 'Lessons', path: '/dashboard/lessons' },
    { icon: FolderKanban, label: 'Projects', path: '/dashboard/projects' },
    { icon: FileCode, label: 'Submissions', path: '/dashboard/submissions' },
    { icon: Award, label: 'Portfolio', path: '/dashboard/portfolios' },
    { icon: Inbox, label: 'Interviews', path: '/dashboard/interviews' },
    { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
  ];

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <motion.div
          className={styles.mobileOverlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onMobileMenuToggle}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : styles.sidebarCollapsed} ${mobileMenuOpen ? styles.mobileOpen : ''}`}
        initial={prefersReducedMotion ? {} : { x: -280 }}
        animate={prefersReducedMotion ? {} : { x: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Logo Section */}
        <div className={styles.logoSection}>
          <Link to="/dashboard" className={styles.logo}>
            <motion.div
              className={styles.logoIcon}
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <Zap size={28} />
            </motion.div>
            {isOpen && (
              <motion.span
                className={styles.logoText}
                initial={prefersReducedMotion ? {} : { opacity: 0, x: -10 }}
                animate={prefersReducedMotion ? {} : { opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                DevHubs
              </motion.span>
            )}
          </Link>
          {mobileMenuOpen && (
            <button
              className={styles.closeButton}
              onClick={onMobileMenuToggle}
              aria-label="Close menu"
            >
              <X size={24} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className={styles.nav}>
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <motion.div
                key={item.path}
                initial={prefersReducedMotion ? {} : { opacity: 0, x: -20 }}
                animate={prefersReducedMotion ? {} : { opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  to={item.path}
                  className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      onMobileMenuToggle();
                    }
                  }}
                >
                  <div className={styles.navIcon}>
                    <Icon size={20} />
                  </div>
                  {isOpen && (
                    <motion.span
                      className={styles.navLabel}
                      initial={prefersReducedMotion ? {} : { opacity: 0 }}
                      animate={prefersReducedMotion ? {} : { opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      {item.label}
                    </motion.span>
                  )}
                  {active && <div className={styles.activeIndicator} />}
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* User Profile Section */}
        <div className={styles.userSection}>
          <div className={styles.userProfile}>
            <div className={styles.userAvatar}>
              {user?.avatar
                ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                : <User size={16} />}
            </div>
            {isOpen && (
              <motion.div
                className={styles.userInfo}
                initial={prefersReducedMotion ? {} : { opacity: 0 }}
                animate={prefersReducedMotion ? {} : { opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                <div className={styles.userName}>{user?.name || user?.githubUsername || 'Student'}</div>
                <div className={styles.userEmail}>{user?.email || (user?.githubUsername ? `@${user.githubUsername}` : '')}</div>
              </motion.div>
            )}
          </div>
          {isOpen && (
            <motion.button
              className={styles.logoutBtn}
              onClick={handleLogout}
              initial={prefersReducedMotion ? {} : { opacity: 0 }}
              animate={prefersReducedMotion ? {} : { opacity: 1 }}
              transition={{ delay: 0.2 }}
              title="Logout"
            >
              <LogOut size={15} />
              <span>Logout</span>
            </motion.button>
          )}
        </div>
      </motion.aside>
    </>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;

import { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, User, Settings, LogOut, Menu, X, ChevronDown } from 'lucide-react';
import { fadeIn, scaleIn } from '../../../../utils/animations';
import useReducedMotion from '../../../../hooks/useReducedMotion';
import { useAuth } from '../../../../contexts/AuthContext';
import styles from './DashboardHeader.module.css';

const DashboardHeader = memo(({ onMenuClick, sidebarOpen, onSidebarToggle }) => {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth/student');
    setUserMenuOpen(false);
  };

  const notifications = [
    { id: 1, message: 'Your PR #124 has been reviewed', time: '5m ago', unread: true },
    { id: 2, message: 'New lesson available: Kubernetes Advanced', time: '1h ago', unread: true },
    { id: 3, message: 'Portfolio generated successfully', time: '2h ago', unread: false },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <button
          className={styles.menuButton}
          onClick={onMenuClick}
          aria-label="Toggle menu"
        >
          <Menu size={24} />
        </button>
        <h1 className={styles.pageTitle}>Dashboard</h1>
      </div>

      <div className={styles.headerRight}>
        {/* Notifications */}
        <div className={styles.notificationWrapper}>
          <button
            className={styles.notificationButton}
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            aria-label="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <motion.span
                className={styles.notificationBadge}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500 }}
              >
                {unreadCount}
              </motion.span>
            )}
          </button>

          <AnimatePresence>
            {notificationsOpen && (
              <motion.div
                className={styles.notificationDropdown}
                initial={prefersReducedMotion ? {} : { opacity: 0, y: -10, scale: 0.95 }}
                animate={prefersReducedMotion ? {} : { opacity: 1, y: 0, scale: 1 }}
                exit={prefersReducedMotion ? {} : { opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <div className={styles.notificationHeader}>
                  <h3>Notifications</h3>
                  <button
                    className={styles.closeDropdown}
                    onClick={() => setNotificationsOpen(false)}
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className={styles.notificationList}>
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      className={`${styles.notificationItem} ${notification.unread ? styles.unread : ''}`}
                      initial={prefersReducedMotion ? {} : { opacity: 0, x: -10 }}
                      animate={prefersReducedMotion ? {} : { opacity: 1, x: 0 }}
                      whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                    >
                      <div className={styles.notificationContent}>
                        <p className={styles.notificationMessage}>{notification.message}</p>
                        <span className={styles.notificationTime}>{notification.time}</span>
                      </div>
                      {notification.unread && (
                        <div className={styles.unreadDot} />
                      )}
                    </motion.div>
                  ))}
                </div>
                {notifications.length === 0 && (
                  <div className={styles.emptyState}>
                    <p>No notifications</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Menu */}
        <div className={styles.userMenuWrapper}>
          <button
            className={styles.userMenuButton}
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            aria-label="User menu"
          >
            <div className={styles.userAvatar}>
              <User size={18} />
            </div>
            <ChevronDown size={16} className={styles.chevron} />
          </button>

          <AnimatePresence>
            {userMenuOpen && (
              <>
                <motion.div
                  className={styles.userMenuOverlay}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setUserMenuOpen(false)}
                />
                <motion.div
                  className={styles.userMenuDropdown}
                  initial={prefersReducedMotion ? {} : { opacity: 0, y: -10, scale: 0.95 }}
                  animate={prefersReducedMotion ? {} : { opacity: 1, y: 0, scale: 1 }}
                  exit={prefersReducedMotion ? {} : { opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className={styles.userMenuHeader}>
                    <div className={styles.userMenuAvatar}>
                      <User size={24} />
                    </div>
                    <div className={styles.userMenuInfo}>
                      <p className={styles.userMenuName}>{user?.name || 'User'}</p>
                      <p className={styles.userMenuEmail}>{user?.email || user?.githubUsername || 'user@example.com'}</p>
                    </div>
                  </div>
                  <div className={styles.userMenuDivider} />
                  <div className={styles.userMenuItems}>
                    <button className={styles.userMenuItem}>
                      <User size={16} />
                      <span>Profile</span>
                    </button>
                    <button className={styles.userMenuItem}>
                      <Settings size={16} />
                      <span>Settings</span>
                    </button>
                    <div className={styles.userMenuDivider} />
                    <button 
                      className={`${styles.userMenuItem} ${styles.logoutItem}`}
                      onClick={handleLogout}
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
});

DashboardHeader.displayName = 'DashboardHeader';

export default DashboardHeader;

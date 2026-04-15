import { memo, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, User, Settings, LogOut, Menu, X, ChevronDown, CheckCheck, Trash2 } from 'lucide-react';
import useReducedMotion from '../../../../hooks/useReducedMotion';
import { useAuth } from '../../../../contexts/AuthContext';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification } from '../../../../services/notificationsApi';
import styles from './DashboardHeader.module.css';

const NOTIF_TYPE_LABEL = {
  SCORE_READY:          'Score ready',
  PORTFOLIO_READY:      'Portfolio ready',
  INTERVIEW_REQUESTED:  'Interview request',
  INTERVIEW_UPDATE:     'Interview update',
};

const timeAgo = (date) => {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const DashboardHeader = memo(({ onMenuClick }) => {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const pollRef = useRef(null);

  const fetchUnread = useCallback(async () => {
    try {
      const data = await getUnreadCount();
      setUnreadCount(data.count ?? data.unreadCount ?? 0);
    } catch { /* silent */ }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoadingNotifs(true);
    try {
      const data = await getNotifications({ limit: 10 });
      setNotifications(data.notifications || data || []);
      const cnt = (data.notifications || data || []).filter(n => !n.read).length;
      setUnreadCount(cnt);
    } catch { /* silent */ }
    finally { setLoadingNotifs(false); }
  }, []);

  // Poll unread count every 30s
  useEffect(() => {
    fetchUnread();
    pollRef.current = setInterval(fetchUnread, 30000);
    return () => clearInterval(pollRef.current);
  }, [fetchUnread]);

  // Fetch list when panel opens
  useEffect(() => {
    if (notificationsOpen) fetchNotifications();
  }, [notificationsOpen, fetchNotifications]);

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch { /* silent */ }
  };

  const handleMarkRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* silent */ }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch { /* silent */ }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setUserMenuOpen(false);
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <button className={styles.menuButton} onClick={onMenuClick} aria-label="Toggle menu">
          <Menu size={24} />
        </button>
        <h1 className={styles.pageTitle}>Dashboard</h1>
      </div>

      <div className={styles.headerRight}>
        {/* Notifications */}
        <div className={styles.notificationWrapper}>
          <button
            className={styles.notificationButton}
            onClick={() => { setNotificationsOpen(v => !v); setUserMenuOpen(false); }}
            aria-label="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <motion.span className={styles.notificationBadge} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500 }}>
                {unreadCount > 9 ? '9+' : unreadCount}
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
                transition={{ duration: 0.15 }}
              >
                <div className={styles.notificationHeader}>
                  <h3>Notifications {unreadCount > 0 && <span className={styles.unreadCount}>{unreadCount}</span>}</h3>
                  <div className={styles.notifHeaderActions}>
                    {unreadCount > 0 && (
                      <button className={styles.markAllBtn} onClick={handleMarkAllRead} title="Mark all as read">
                        <CheckCheck size={15} />
                      </button>
                    )}
                    <button className={styles.closeDropdown} onClick={() => setNotificationsOpen(false)}>
                      <X size={16} />
                    </button>
                  </div>
                </div>

                <div className={styles.notificationList}>
                  {loadingNotifs && (
                    <div className={styles.notifLoading}>Loading...</div>
                  )}
                  {!loadingNotifs && notifications.length === 0 && (
                    <div className={styles.emptyState}>
                      <Bell size={24} style={{ opacity: 0.3 }} />
                      <p>No notifications yet</p>
                    </div>
                  )}
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`${styles.notificationItem} ${!n.read ? styles.unread : ''}`}
                      onClick={() => !n.read && handleMarkRead(n.id)}
                    >
                      <div className={styles.notificationContent}>
                        {n.type && <span className={styles.notifType}>{NOTIF_TYPE_LABEL[n.type] || n.type}</span>}
                        <p className={styles.notificationMessage}>{n.title || n.message}</p>
                        {n.message && n.title && <p className={styles.notifBody}>{n.message}</p>}
                        <span className={styles.notificationTime}>{timeAgo(n.createdAt)}</span>
                      </div>
                      <div className={styles.notifActions}>
                        {!n.read && <div className={styles.unreadDot} />}
                        <button className={styles.deleteNotifBtn} onClick={(e) => handleDelete(e, n.id)} title="Delete">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Menu */}
        <div className={styles.userMenuWrapper}>
          <button
            className={styles.userMenuButton}
            onClick={() => { setUserMenuOpen(v => !v); setNotificationsOpen(false); }}
            aria-label="User menu"
          >
            <div className={styles.userAvatar}>
              {user?.avatar
                ? <img src={user.avatar} alt={user?.name || 'User'} className={styles.avatarImage} />
                : <User size={18} />}
            </div>
            <ChevronDown size={16} className={styles.chevron} />
          </button>

          <AnimatePresence>
            {userMenuOpen && (
              <>
                <motion.div className={styles.userMenuOverlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setUserMenuOpen(false)} />
                <motion.div
                  className={styles.userMenuDropdown}
                  initial={prefersReducedMotion ? {} : { opacity: 0, y: -10, scale: 0.95 }}
                  animate={prefersReducedMotion ? {} : { opacity: 1, y: 0, scale: 1 }}
                  exit={prefersReducedMotion ? {} : { opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className={styles.userMenuHeader}>
                    <div className={styles.userMenuAvatar}>
                      {user?.avatar
                        ? <img src={user.avatar} alt="" className={styles.avatarImageLarge} />
                        : <User size={24} />}
                    </div>
                    <div className={styles.userMenuInfo}>
                      <p className={styles.userMenuName}>{user?.name || user?.githubUsername || 'User'}</p>
                      <p className={styles.userMenuEmail}>{user?.email || `@${user?.githubUsername}` || ''}</p>
                    </div>
                  </div>
                  <div className={styles.userMenuDivider} />
                  <div className={styles.userMenuItems}>
                    <Link to="/dashboard/settings" className={styles.userMenuItem} onClick={() => setUserMenuOpen(false)}>
                      <Settings size={16} /><span>Settings</span>
                    </Link>
                    <div className={styles.userMenuDivider} />
                    <button className={`${styles.userMenuItem} ${styles.logoutItem}`} onClick={handleLogout}>
                      <LogOut size={16} /><span>Logout</span>
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

import { memo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Users, Send, Building2,
  Settings, Zap, X, LogOut
} from 'lucide-react';
import { useAuth } from '../../../../contexts/AuthContext';
import styles from './CompanySidebar.module.css';

const navItems = [
  { icon: LayoutDashboard, label: 'Overview',         path: '/company/dashboard' },
  { icon: Users,           label: 'Talent Feed',      path: '/company/talent' },
  { icon: Send,            label: 'Interview Requests', path: '/company/interviews' },
  { icon: Building2,       label: 'Company Profile',  path: '/company/profile' },
  { icon: Settings,        label: 'Settings',         path: '/company/settings' },
];

const CompanySidebar = memo(({ isOpen, mobileOpen, onMobileClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const isActive = (path) =>
    path === '/company/dashboard'
      ? location.pathname === '/company/dashboard'
      : location.pathname.startsWith(path);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      {mobileOpen && <div className={styles.overlay} onClick={onMobileClose} />}
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : styles.collapsed} ${mobileOpen ? styles.mobileOpen : ''}`}>
        {/* Logo */}
        <div className={styles.logoSection}>
          <Link to="/company/dashboard" className={styles.logo}>
            <motion.div className={styles.logoIcon} whileHover={{ scale: 1.1, rotate: 5 }}>
              <Zap size={26} />
            </motion.div>
            {isOpen && <span className={styles.logoText}>DevHubs</span>}
          </Link>
          {mobileOpen && (
            <button className={styles.closeBtn} onClick={onMobileClose}>
              <X size={22} />
            </button>
          )}
        </div>

        {isOpen && (
          <div className={styles.companyBadge}>
            <Building2 size={13} />
            <span>Company Portal</span>
          </div>
        )}

        {/* Nav */}
        <nav className={styles.nav}>
          {navItems.map((item, i) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <motion.div key={item.path} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <Link
                  to={item.path}
                  className={`${styles.navItem} ${active ? styles.active : ''}`}
                  onClick={() => { if (window.innerWidth < 1024) onMobileClose?.(); }}
                >
                  <div className={styles.navIcon}><Icon size={20} /></div>
                  {isOpen && <span className={styles.navLabel}>{item.label}</span>}
                  {active && <div className={styles.activeDot} />}
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* User section */}
        <div className={styles.userSection}>
          {isOpen && (
            <div className={styles.userInfo}>
              <div className={styles.userAvatar}>
                {user?.avatar
                  ? <img src={user.avatar} alt="" className={styles.avatarImg} />
                  : <Building2 size={18} />}
              </div>
              <div className={styles.userText}>
                <div className={styles.userName}>{user?.company?.companyName || user?.name || 'Company'}</div>
                <div className={styles.userEmail}>{user?.email || ''}</div>
              </div>
            </div>
          )}
          <button className={styles.logoutBtn} onClick={handleLogout} title="Logout">
            <LogOut size={18} />
            {isOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
});

CompanySidebar.displayName = 'CompanySidebar';
export default CompanySidebar;

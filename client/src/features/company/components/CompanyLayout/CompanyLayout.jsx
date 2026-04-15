import { memo, useState } from 'react';
import { Menu } from 'lucide-react';
import CompanySidebar from '../CompanySidebar/CompanySidebar';
import styles from './CompanyLayout.module.css';

const CompanyLayout = memo(({ children, title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className={styles.layout}>
      <CompanySidebar
        isOpen={sidebarOpen}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className={`${styles.content} ${sidebarOpen ? styles.contentExpanded : styles.contentCollapsed}`}>
        <header className={styles.topbar}>
          <button className={styles.menuBtn} onClick={() => { if (window.innerWidth < 1024) setMobileOpen(true); else setSidebarOpen(v => !v); }}>
            <Menu size={22} />
          </button>
          {title && <h1 className={styles.pageTitle}>{title}</h1>}
        </header>
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
});

CompanyLayout.displayName = 'CompanyLayout';
export default CompanyLayout;

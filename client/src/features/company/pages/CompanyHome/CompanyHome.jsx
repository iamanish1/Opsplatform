import { memo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Send, TrendingUp, Zap, ArrowRight, Star, Shield } from 'lucide-react';
import CompanyLayout from '../../components/CompanyLayout/CompanyLayout';
import { getTalentFeed, getInterviewRequests } from '../../../../services/companyApi';
import { useAuth } from '../../../../contexts/AuthContext';
import { fadeInUp, staggerContainer } from '../../../../utils/animations';
import styles from './CompanyHome.module.css';

const StatCard = ({ icon: Icon, label, value, color, sublabel }) => (
  <motion.div className={styles.statCard} variants={fadeInUp}>
    <div className={styles.statIcon} style={{ background: `${color}22`, color }}>
      <Icon size={22} />
    </div>
    <div className={styles.statContent}>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
      {sublabel && <div className={styles.statSub}>{sublabel}</div>}
    </div>
  </motion.div>
);

const DeveloperCard = memo(({ dev }) => {
  const score = dev.score?.totalScore ?? 0;
  const badge = dev.score?.badge || 'RED';
  const badgeColor = badge === 'GREEN' ? '#10b981' : badge === 'YELLOW' ? '#f59e0b' : '#ef4444';

  return (
    <motion.div className={styles.devCard} variants={fadeInUp}>
      <div className={styles.devHeader}>
        <div className={styles.devAvatar}>
          {dev.avatar
            ? <img src={dev.avatar} alt={dev.name} className={styles.devAvatarImg} />
            : <div className={styles.devAvatarFallback}>{(dev.name || dev.githubUsername || 'D')[0].toUpperCase()}</div>}
        </div>
        <div className={styles.devInfo}>
          <div className={styles.devName}>{dev.name || dev.githubUsername}</div>
          {dev.githubUsername && <div className={styles.devUsername}>@{dev.githubUsername}</div>}
        </div>
        <div className={styles.devScore} style={{ color: badgeColor }}>
          <Star size={12} />
          <span>{score}</span>
        </div>
      </div>
      <div className={styles.devBadge} style={{ background: `${badgeColor}22`, color: badgeColor, borderColor: `${badgeColor}44` }}>
        <Shield size={11} />{badge === 'GREEN' ? 'Top Talent' : badge === 'YELLOW' ? 'Rising Star' : 'In Progress'}
      </div>
      {dev.portfolios?.[0]?.slug && (
        <Link to={`/portfolio/${dev.portfolios[0].slug}`} className={styles.viewPortfolio} target="_blank">
          View Portfolio <ArrowRight size={13} />
        </Link>
      )}
    </motion.div>
  );
});
DeveloperCard.displayName = 'DeveloperCard';

const CompanyHome = memo(() => {
  const { user } = useAuth();
  const [topTalent, setTopTalent] = useState([]);
  const [stats, setStats] = useState({ totalTalent: 0, greenTalent: 0, pendingRequests: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getTalentFeed({ badge: 'GREEN', limit: 6 }),
      getTalentFeed({ limit: 1 }),
      getInterviewRequests('PENDING'),
    ])
      .then(([green, all, requests]) => {
        setTopTalent(green.developers || green.talent || []);
        setStats({
          greenTalent: green.total ?? (green.developers || []).length,
          totalTalent: all.total ?? 0,
          pendingRequests: requests.requests?.length ?? requests.total ?? 0,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const companyName = user?.company?.companyName || user?.name || 'Company';

  return (
    <CompanyLayout title="Dashboard">
      <motion.div className={styles.page} variants={staggerContainer} initial="hidden" animate="visible">

        {/* Welcome */}
        <motion.div className={styles.welcome} variants={fadeInUp}>
          <div>
            <h1 className={styles.welcomeTitle}>Welcome back, <span className={styles.gradient}>{companyName}</span></h1>
            <p className={styles.welcomeSub}>Find verified developers. Skip the noise. Hire with confidence.</p>
          </div>
          <Link to="/company/talent" className={styles.primaryCta}>
            <Users size={18} />Browse Talent Feed
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div className={styles.statsGrid} variants={staggerContainer}>
          <StatCard icon={Users}     label="Verified Developers"  value={loading ? '—' : stats.totalTalent}    color="#6366f1" sublabel="in the talent pool" />
          <StatCard icon={Star}      label="Top Talent (GREEN)"   value={loading ? '—' : stats.greenTalent}    color="#10b981" sublabel="ready to hire" />
          <StatCard icon={Send}      label="Pending Requests"     value={loading ? '—' : stats.pendingRequests} color="#f59e0b" sublabel="awaiting response" />
          <StatCard icon={TrendingUp} label="Avg Trust Score"     value="82"                                    color="#8b5cf6" sublabel="across platform" />
        </motion.div>

        {/* Top talent preview */}
        <motion.div variants={fadeInUp}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}><Zap size={18} />Top Talent This Week</h2>
            <Link to="/company/talent" className={styles.seeAll}>See all <ArrowRight size={14} /></Link>
          </div>
          {loading ? (
            <div className={styles.loadingGrid}>
              {[...Array(6)].map((_, i) => <div key={i} className={styles.skeletonCard} />)}
            </div>
          ) : topTalent.length > 0 ? (
            <motion.div className={styles.talentGrid} variants={staggerContainer}>
              {topTalent.slice(0, 6).map((dev) => (
                <DeveloperCard key={dev.id} dev={dev} />
              ))}
            </motion.div>
          ) : (
            <div className={styles.emptyState}>
              <Users size={40} />
              <p>No verified developers found yet.</p>
              <Link to="/company/talent" className={styles.emptyAction}>Browse Talent Feed</Link>
            </div>
          )}
        </motion.div>

      </motion.div>
    </CompanyLayout>
  );
});

CompanyHome.displayName = 'CompanyHome';
export default CompanyHome;

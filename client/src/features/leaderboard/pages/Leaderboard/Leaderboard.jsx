import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Trophy, Star, Shield, GitPullRequest, MapPin,
  ExternalLink, Zap, Users, ArrowRight, Loader2, Crown
} from 'lucide-react';
import { fadeInUp, staggerContainer } from '../../../../utils/animations';
import styles from './Leaderboard.module.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const fetchLeaderboard = async (badge = 'GREEN', limit = 20) => {
  const res = await fetch(`${API_BASE}/leaderboard?badge=${badge}&limit=${limit}`);
  if (!res.ok) throw new Error('Failed to load leaderboard');
  return res.json();
};

const RANK_COLORS = ['#f59e0b', '#9ca3af', '#b45309'];
const BADGE_OPTIONS = [
  { value: 'GREEN',  label: 'Top Talent',  color: '#10b981' },
  { value: 'YELLOW', label: 'Rising Stars', color: '#f59e0b' },
  { value: 'RED',    label: 'In Progress', color: '#ef4444' },
];

const DeveloperRow = ({ dev, rank }) => {
  const score = dev.score?.totalScore ?? 0;
  const badge = dev.score?.badge || 'RED';
  const badgeColor = badge === 'GREEN' ? '#10b981' : badge === 'YELLOW' ? '#f59e0b' : '#ef4444';
  const isTop3 = rank <= 3;

  return (
    <motion.div
      className={`${styles.devRow} ${isTop3 ? styles.topRow : ''}`}
      variants={fadeInUp}
      whileHover={{ scale: 1.01, translateX: 4 }}
      transition={{ duration: 0.15 }}
    >
      {/* Rank */}
      <div className={styles.rankCell}>
        {rank <= 3 ? (
          <Crown size={20} style={{ color: RANK_COLORS[rank - 1] }} />
        ) : (
          <span className={styles.rankNum}>{rank}</span>
        )}
      </div>

      {/* Developer */}
      <div className={styles.devCell}>
        <div className={styles.avatarWrap}>
          {dev.avatar
            ? <img src={dev.avatar} alt={dev.name} className={styles.avatar} />
            : <div className={styles.avatarFallback}>{(dev.name || dev.githubUsername || 'D')[0].toUpperCase()}</div>}
          <Shield size={10} className={styles.verifiedMark} title="AI Verified" />
        </div>
        <div className={styles.devMeta}>
          <span className={styles.devName}>{dev.name || dev.githubUsername || 'Developer'}</span>
          {dev.githubUsername && (
            <a href={`https://github.com/${dev.githubUsername}`} target="_blank" rel="noopener noreferrer" className={styles.ghHandle}>
              <GitPullRequest size={11} />@{dev.githubUsername}
            </a>
          )}
          {dev.location && <span className={styles.location}><MapPin size={11} />{dev.location}</span>}
        </div>
      </div>

      {/* Project */}
      <div className={styles.projectCell}>
        {dev.latestProject?.projectTitle && (
          <span className={styles.projectTitle}>{dev.latestProject.projectTitle}</span>
        )}
      </div>

      {/* Score */}
      <div className={styles.scoreCell}>
        <motion.div
          className={styles.scoreCircle}
          style={{ borderColor: badgeColor, color: badgeColor }}
          initial={{ scale: 0.8 }} animate={{ scale: 1 }}
        >
          <span className={styles.scoreNum}>{score}</span>
        </motion.div>
        <div className={styles.scorePct}>
          <div className={styles.scoreBar}>
            <motion.div
              className={styles.scoreBarFill}
              style={{ background: badgeColor }}
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 0.8, delay: 0.1 }}
            />
          </div>
        </div>
      </div>

      {/* Action */}
      <div className={styles.actionCell}>
        {dev.portfolioSlug && (
          <Link to={`/portfolio/${dev.portfolioSlug}`} className={styles.viewBtn}>
            View <ExternalLink size={12} />
          </Link>
        )}
      </div>
    </motion.div>
  );
};

export default function Leaderboard() {
  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeBadge, setActiveBadge] = useState('GREEN');

  useEffect(() => {
    setLoading(true);
    fetchLeaderboard(activeBadge)
      .then((data) => {
        setDevelopers(data.developers || []);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [activeBadge]);

  return (
    <div className={styles.page}>
      <div className={styles.ambient} />

      {/* Nav */}
      <nav className={styles.nav}>
        <Link to="/" className={styles.brand}><Zap size={22} /><span>DevHubs</span></Link>
        <div className={styles.navRight}>
          <Link to="/auth/student" className={styles.navLink}>For Developers</Link>
          <Link to="/auth/company/login" className={styles.navCta}>Hire Talent <ArrowRight size={14} /></Link>
        </div>
      </nav>

      <motion.main className={styles.main} variants={staggerContainer} initial="hidden" animate="visible">

        {/* Hero */}
        <motion.div className={styles.hero} variants={fadeInUp}>
          <div className={styles.heroBadge}><Trophy size={14} />AI-Verified Leaderboard</div>
          <h1 className={styles.heroTitle}>Top Developer Talent</h1>
          <p className={styles.heroSub}>
            Ranked by AI-generated Trust Score across 10 categories. Every score is earned, not self-reported.
          </p>
          <div className={styles.heroStats}>
            <div className={styles.heroStat}><Users size={16} /><span>{developers.length}+ verified developers</span></div>
            <div className={styles.heroStat}><Shield size={16} /><span>AI-powered scoring</span></div>
            <div className={styles.heroStat}><Star size={16} /><span>Real project reviews</span></div>
          </div>
        </motion.div>

        {/* Filter tabs */}
        <motion.div className={styles.filterRow} variants={fadeInUp}>
          {BADGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`${styles.filterTab} ${activeBadge === opt.value ? styles.filterTabActive : ''}`}
              style={activeBadge === opt.value ? { borderColor: opt.color, color: opt.color, background: `${opt.color}18` } : {}}
              onClick={() => setActiveBadge(opt.value)}
            >
              <Star size={13} />{opt.label}
            </button>
          ))}
        </motion.div>

        {/* Table */}
        <motion.div className={styles.tableWrap} variants={fadeInUp}>
          {/* Header */}
          <div className={styles.tableHeader}>
            <div className={styles.rankCell}>#</div>
            <div className={styles.devCell}>Developer</div>
            <div className={styles.projectCell}>Project</div>
            <div className={styles.scoreCell}>Trust Score</div>
            <div className={styles.actionCell} />
          </div>

          {loading ? (
            <div className={styles.loading}><Loader2 size={32} className={styles.spin} /><p>Loading leaderboard...</p></div>
          ) : error ? (
            <div className={styles.errorState}><p>{error}</p></div>
          ) : developers.length === 0 ? (
            <div className={styles.empty}>
              <Trophy size={40} />
              <p>No developers in this category yet. Be the first!</p>
              <Link to="/auth/student" className={styles.emptyAction}>Get Started</Link>
            </div>
          ) : (
            <motion.div className={styles.rows} variants={staggerContainer}>
              {developers.map((dev, i) => (
                <DeveloperRow key={dev.id} dev={dev} rank={i + 1} />
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* CTA banner */}
        <motion.div className={styles.cta} variants={fadeInUp}>
          <div className={styles.ctaLeft}>
            <h2>Want to appear on the leaderboard?</h2>
            <p>Complete a project, get AI-reviewed, earn your Trust Score.</p>
          </div>
          <div className={styles.ctaRight}>
            <Link to="/auth/student" className={styles.ctaStudentBtn}><Zap size={16} />Join as Developer</Link>
            <Link to="/auth/company/login" className={styles.ctaCompanyBtn}><Users size={16} />Hire from Here</Link>
          </div>
        </motion.div>

      </motion.main>

      <footer className={styles.footer}>
        <p>Powered by <Link to="/">DevHubs</Link> — AI Talent Assurance Engine</p>
      </footer>
    </div>
  );
}

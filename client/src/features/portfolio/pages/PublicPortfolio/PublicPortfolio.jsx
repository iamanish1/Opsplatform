import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  GitPullRequest, ExternalLink, Code, FileText,
  TrendingUp, AlertCircle, Clock, Shield, Zap, Users,
  Copy, CheckCircle2, Linkedin, Twitter, ArrowLeft, Loader2,
  Star, MapPin, Calendar
} from 'lucide-react';
import { getPortfolioBySlug } from '../../../../services/portfolioApi';
import { fadeInUp, staggerContainer } from '../../../../utils/animations';
import ProofCard from '../../../../components/ProofCard/ProofCard';
import styles from './PublicPortfolio.module.css';

const BADGE_CONFIG = {
  GREEN:  { label: 'Top Talent',    color: '#10b981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)' },
  YELLOW: { label: 'Rising Star',   color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)' },
  RED:    { label: 'In Progress',   color: '#ef4444', bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.3)'  },
};

const CATEGORIES = [
  { key: 'codeQuality',     label: 'Code Quality',     icon: Code },
  { key: 'problemSolving',  label: 'Problem Solving',  icon: TrendingUp },
  { key: 'bugRisk',         label: 'Bug Risk',         icon: AlertCircle },
  { key: 'devopsExecution', label: 'DevOps Execution', icon: Zap },
  { key: 'optimization',    label: 'Optimization',     icon: TrendingUp },
  { key: 'documentation',   label: 'Documentation',    icon: FileText },
  { key: 'gitMaturity',     label: 'Git Maturity',     icon: GitPullRequest },
  { key: 'collaboration',   label: 'Collaboration',    icon: Users },
  { key: 'deliverySpeed',   label: 'Delivery Speed',   icon: Clock },
  { key: 'security',        label: 'Security',         icon: Shield },
];

const ScoreRing = ({ score }) => {
  const radius = 54;
  const circ = 2 * Math.PI * radius;
  const filled = (score / 100) * circ;
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <svg width="140" height="140" viewBox="0 0 140 140" className={styles.ring}>
      <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
      <motion.circle
        cx="70" cy="70" r={radius} fill="none"
        stroke={color} strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - filled }}
        transition={{ duration: 1.4, ease: 'easeOut', delay: 0.3 }}
        transform="rotate(-90 70 70)"
      />
      <text x="70" y="64" textAnchor="middle" fill="white" fontSize="28" fontWeight="700">{score}</text>
      <text x="70" y="83" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="12">/100</text>
    </svg>
  );
};

const CategoryBar = ({ label, icon: Icon, value }) => {
  const pct = (value / 10) * 100;
  const color = value >= 8 ? '#10b981' : value >= 6 ? '#f59e0b' : '#ef4444';
  return (
    <div className={styles.catRow}>
      <div className={styles.catLabel}>
        <Icon size={14} />
        <span>{label}</span>
      </div>
      <div className={styles.catBar}>
        <motion.div
          className={styles.catFill}
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
        />
      </div>
      <span className={styles.catScore} style={{ color }}>{value}/10</span>
    </div>
  );
};

export default function PublicPortfolio() {
  const { slug } = useParams();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getPortfolioBySlug(slug)
      .then((data) => {
        setPortfolio(data.portfolio ?? data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Portfolio not found');
        setLoading(false);
      });
  }, [slug]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (platform) => {
    const url = window.location.href;
    const text = `Check out this verified developer portfolio on DevHubs!`;
    if (platform === 'linkedin') window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
    if (platform === 'twitter') window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  };

  if (loading) {
    return (
      <div className={styles.loadingPage}>
        <Loader2 size={48} className={styles.spinner} />
        <p>Loading portfolio...</p>
      </div>
    );
  }

  if (error || !portfolio) {
    return (
      <div className={styles.errorPage}>
        <AlertCircle size={56} className={styles.errorIcon} />
        <h2>Portfolio Not Found</h2>
        <p>{error || 'This portfolio link may be invalid or has been removed.'}</p>
        <Link to="/" className={styles.homeLink}><ArrowLeft size={16} /> Back to DevHubs</Link>
      </div>
    );
  }

  const user = portfolio.user || {};
  const score = portfolio.score || {};
  const submission = portfolio.submission || {};
  const project = submission?.project || portfolio.portfolioJson?.project || {};
  const badge = score.badge || 'RED';
  const totalScore = score.totalScore ?? 0;
  const badgeConf = BADGE_CONFIG[badge] || BADGE_CONFIG.RED;
  const repoUrl = submission.repoUrl || portfolio.portfolioJson?.submission?.repoUrl;

  return (
    <div className={styles.page}>
      {/* Ambient glow */}
      <div className={styles.glow} style={{ background: `radial-gradient(ellipse at 50% 0%, ${badgeConf.color}22 0%, transparent 60%)` }} />

      {/* Nav */}
      <nav className={styles.nav}>
        <Link to="/" className={styles.navBrand}>
          <Zap size={22} /><span>DevHubs</span>
        </Link>
        <div className={styles.navActions}>
          <button className={styles.shareBtn} onClick={handleCopy} title="Copy link">
            {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
            <span>{copied ? 'Copied!' : 'Copy link'}</span>
          </button>
          <button className={styles.shareBtn} onClick={() => handleShare('linkedin')} title="LinkedIn">
            <Linkedin size={16} />
          </button>
          <button className={styles.shareBtn} onClick={() => handleShare('twitter')} title="Twitter">
            <Twitter size={16} />
          </button>
          <Link to="/auth/company/login" className={styles.hireCta}>
            <Users size={16} /><span>Hire This Developer</span>
          </Link>
        </div>
      </nav>

      <motion.main className={styles.main} variants={staggerContainer} initial="hidden" animate="visible">

        {/* Hero card */}
        <motion.section className={styles.heroCard} variants={fadeInUp}>
          <div className={styles.heroLeft}>
            <div className={styles.avatar}>
              {user.avatar
                ? <img src={user.avatar} alt={user.name} className={styles.avatarImg} />
                : <div className={styles.avatarFallback}>{(user.name || user.githubUsername || 'D')[0].toUpperCase()}</div>
              }
              <div className={styles.verifiedBadge} title="Verified by DevHubs AI"><Shield size={14} /></div>
            </div>
            <div className={styles.heroInfo}>
              <h1 className={styles.devName}>{user.name || user.githubUsername || 'Developer'}</h1>
              {user.githubUsername && (
                <a href={`https://github.com/${user.githubUsername}`} target="_blank" rel="noopener noreferrer" className={styles.githubLink}>
                  <GitPullRequest size={14} />@{user.githubUsername}
                </a>
              )}
              {user.location && <p className={styles.location}><MapPin size={13} />{user.location}</p>}
              <div className={styles.badgePill} style={{ background: badgeConf.bg, borderColor: badgeConf.border, color: badgeConf.color }}>
                <Star size={13} />{badgeConf.label}
              </div>
            </div>
          </div>

          <div className={styles.heroRight}>
            <ScoreRing score={totalScore} />
            <p className={styles.scoreLabel}>Trust Score</p>
            <p className={styles.verifiedText}>AI Verified · DevHubs</p>
          </div>
        </motion.section>

        {/* Project card */}
        {(project.title || submission.repoUrl) && (
          <motion.section className={styles.card} variants={fadeInUp}>
            <h2 className={styles.cardTitle}><Code size={18} />Project Submission</h2>
            {project.title && <h3 className={styles.projectTitle}>{project.title}</h3>}
            {project.description && <p className={styles.projectDesc}>{project.description}</p>}
            <div className={styles.projectMeta}>
              {repoUrl && (
                <a href={repoUrl} target="_blank" rel="noopener noreferrer" className={styles.repoLink}>
                  <ExternalLink size={14} />View Repository
                </a>
              )}
              {submission.prNumber && (
                <span className={styles.prTag}><GitPullRequest size={13} />PR #{submission.prNumber}</span>
              )}
              {portfolio.createdAt && (
                <span className={styles.dateTag}><Calendar size={13} />{new Date(portfolio.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
              )}
            </div>
          </motion.section>
        )}

        {/* Score breakdown */}
        {score.totalScore !== undefined && (
          <motion.section className={styles.card} variants={fadeInUp}>
            <h2 className={styles.cardTitle}><TrendingUp size={18} />AI Score Breakdown</h2>
            <p className={styles.cardSubtitle}>10-category evaluation powered by DevHubs AI engine</p>
            <div className={styles.categories}>
              {CATEGORIES.map(({ key, label, icon }) => (
                <CategoryBar key={key} label={label} icon={icon} value={score[key] ?? 0} />
              ))}
            </div>
          </motion.section>
        )}

        {/* Summary */}
        {portfolio.summary && (
          <motion.section className={styles.card} variants={fadeInUp}>
            <h2 className={styles.cardTitle}><FileText size={18} />AI Review Summary</h2>
            <p className={styles.summary}>{portfolio.summary}</p>
          </motion.section>
        )}

        {/* Shareable Proof Card */}
        <motion.section className={styles.card} variants={fadeInUp} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <h2 className={styles.cardTitle}><Shield size={18} />Shareable Proof Card</h2>
          <p className={styles.cardSubtitle}>Share this verified trust score anywhere — LinkedIn, Twitter, or direct link.</p>
          <ProofCard
            user={user}
            score={score}
            portfolioSlug={slug}
          />
        </motion.section>

        {/* CTA */}
        <motion.section className={styles.ctaCard} variants={fadeInUp}>
          <div className={styles.ctaContent}>
            <h2>Interested in hiring {user.name?.split(' ')[0] || 'this developer'}?</h2>
            <p>Send an interview request through DevHubs and connect directly with verified talent.</p>
          </div>
          <Link to="/auth/company/login" className={styles.ctaButton}>
            <Users size={18} />Send Interview Request
          </Link>
        </motion.section>

      </motion.main>

      <footer className={styles.footer}>
        <p>Verified by <Link to="/">DevHubs</Link> · AI Talent Assurance Engine</p>
      </footer>
    </div>
  );
}

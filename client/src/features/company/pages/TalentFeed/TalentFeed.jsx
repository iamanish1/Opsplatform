import { memo, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, SlidersHorizontal, Star, Shield, MapPin, GitPullRequest,
  ExternalLink, Send, X, ChevronLeft, ChevronRight, Loader2,
  Users, Filter, CheckCircle2
} from 'lucide-react';
import CompanyLayout from '../../components/CompanyLayout/CompanyLayout';
import { getTalentFeed, createInterviewRequest } from '../../../../services/companyApi';
import { useToast } from '../../../../contexts/ToastContext';
import { fadeInUp, staggerContainer } from '../../../../utils/animations';
import styles from './TalentFeed.module.css';

const BADGE_COLOR = { GREEN: '#10b981', YELLOW: '#f59e0b', RED: '#ef4444' };
const BADGE_LABEL = { GREEN: 'Top Talent', YELLOW: 'Rising Star', RED: 'In Progress' };

const DeveloperCard = memo(({ dev, onRequestInterview }) => {
  const score = dev.score?.totalScore ?? 0;
  const badge = dev.score?.badge || 'RED';
  const color = BADGE_COLOR[badge];
  const portfolio = dev.portfolios?.[0];

  return (
    <motion.div className={styles.devCard} variants={fadeInUp} layout>
      <div className={styles.cardTop}>
        <div className={styles.avatarWrap}>
          {dev.avatar
            ? <img src={dev.avatar} alt={dev.name} className={styles.avatar} />
            : <div className={styles.avatarFallback}>{(dev.name || dev.githubUsername || 'D')[0].toUpperCase()}</div>}
          <div className={styles.verifiedDot} title="AI Verified"><Shield size={10} /></div>
        </div>
        <div className={styles.devMeta}>
          <div className={styles.devName}>{dev.name || dev.githubUsername || 'Developer'}</div>
          {dev.githubUsername && (
            <a href={`https://github.com/${dev.githubUsername}`} target="_blank" rel="noopener noreferrer" className={styles.ghLink}>
              <GitPullRequest size={12} />@{dev.githubUsername}
            </a>
          )}
          {dev.location && <div className={styles.location}><MapPin size={11} />{dev.location}</div>}
        </div>
        <div className={styles.scoreBlock} style={{ color }}>
          <div className={styles.scoreNum}>{score}</div>
          <div className={styles.scoreLabel}>/100</div>
        </div>
      </div>

      <div className={styles.badgePill} style={{ background: `${color}18`, color, borderColor: `${color}40` }}>
        <Star size={11} />{BADGE_LABEL[badge]}
      </div>

      {/* Mini score bars */}
      {dev.score && (
        <div className={styles.miniScores}>
          {[['codeQuality','Code'], ['security','Security'], ['devopsExecution','DevOps']].map(([key, label]) => (
            <div key={key} className={styles.miniRow}>
              <span className={styles.miniLabel}>{label}</span>
              <div className={styles.miniBar}>
                <div className={styles.miniFill} style={{ width: `${(dev.score[key] ?? 0) * 10}%`, background: color }} />
              </div>
              <span className={styles.miniVal} style={{ color }}>{dev.score[key] ?? 0}</span>
            </div>
          ))}
        </div>
      )}

      <div className={styles.cardActions}>
        {portfolio?.slug && (
          <Link to={`/portfolio/${portfolio.slug}`} target="_blank" className={styles.portfolioBtn}>
            <ExternalLink size={14} />Portfolio
          </Link>
        )}
        <button className={styles.interviewBtn} onClick={() => onRequestInterview(dev)}>
          <Send size={14} />Request Interview
        </button>
      </div>
    </motion.div>
  );
});
DeveloperCard.displayName = 'DeveloperCard';

const InterviewModal = memo(({ dev, onClose, onSubmit }) => {
  const [form, setForm] = useState({ position: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit(dev, form);
    setLoading(false);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <motion.div
        className={styles.modal}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h2>Send Interview Request</h2>
          <button className={styles.modalClose} onClick={onClose}><X size={20} /></button>
        </div>
        <div className={styles.modalDev}>
          {dev.avatar
            ? <img src={dev.avatar} alt="" className={styles.modalAvatar} />
            : <div className={styles.modalAvatarFallback}>{(dev.name || 'D')[0]}</div>}
          <div>
            <div className={styles.modalDevName}>{dev.name || dev.githubUsername}</div>
            <div className={styles.modalDevScore}>Trust Score: {dev.score?.totalScore ?? 0}/100</div>
          </div>
        </div>
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.formField}>
            <label>Position / Role *</label>
            <input
              type="text"
              placeholder="e.g. DevOps Engineer, Backend Developer"
              value={form.position}
              onChange={(e) => setForm(f => ({ ...f, position: e.target.value }))}
              required
              className={styles.input}
            />
          </div>
          <div className={styles.formField}>
            <label>Message (optional)</label>
            <textarea
              placeholder="Tell them why you're interested..."
              value={form.message}
              onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
              rows={4}
              className={styles.textarea}
            />
          </div>
          <div className={styles.modalActions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.sendBtn} disabled={loading}>
              {loading ? <Loader2 size={16} className={styles.spin} /> : <Send size={16} />}
              {loading ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
});
InterviewModal.displayName = 'InterviewModal';

const TalentFeed = memo(() => {
  const toast = useToast();
  const [developers, setDevelopers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ badge: '', minScore: '', maxScore: '', skills: '', githubUsername: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDev, setSelectedDev] = useState(null);
  const LIMIT = 12;

  const loadTalent = useCallback(async () => {
    setLoading(true);
    try {
      const f = {
        page,
        limit: LIMIT,
        ...(filters.badge && { badge: filters.badge }),
        ...(filters.minScore && { minScore: Number(filters.minScore) }),
        ...(filters.maxScore && { maxScore: Number(filters.maxScore) }),
        ...(filters.skills && { skills: filters.skills.split(',').map(s => s.trim()).filter(Boolean) }),
        ...(filters.githubUsername && { githubUsername: filters.githubUsername }),
      };
      const data = await getTalentFeed(f);
      setDevelopers(data.developers || data.talent || []);
      setTotal(data.total ?? 0);
    } catch {
      toast.error('Failed to load talent feed');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { loadTalent(); }, [loadTalent]);

  const handleInterviewSubmit = async (dev, form) => {
    try {
      await createInterviewRequest({
        developerId: dev.id,
        submissionId: dev.portfolios?.[0]?.submission?.id || null,
        position: form.position,
        message: form.message || undefined,
      });
      toast.success(`Interview request sent to ${dev.name || dev.githubUsername}!`);
      setSelectedDev(null);
    } catch (err) {
      toast.error(err.message || 'Failed to send interview request');
    }
  };

  const applyFilters = (e) => {
    e.preventDefault();
    setPage(1);
    loadTalent();
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({ badge: '', minScore: '', maxScore: '', skills: '', githubUsername: '' });
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));
  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <CompanyLayout title="Talent Feed">
      <div className={styles.page}>
        {/* Header row */}
        <div className={styles.topRow}>
          <div className={styles.topLeft}>
            <h1 className={styles.pageTitle}>Talent Feed</h1>
            <span className={styles.totalBadge}>{total} verified developers</span>
          </div>
          <div className={styles.topRight}>
            <button
              className={`${styles.filterToggle} ${showFilters ? styles.filterActive : ''} ${hasActiveFilters ? styles.filterHasValues : ''}`}
              onClick={() => setShowFilters(v => !v)}
            >
              <Filter size={16} />Filters
              {hasActiveFilters && <span className={styles.filterDot} />}
            </button>
          </div>
        </div>

        {/* Filters panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.form
              className={styles.filtersPanel}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={applyFilters}
            >
              <div className={styles.filtersGrid}>
                <div className={styles.filterField}>
                  <label>Badge</label>
                  <select className={styles.select} value={filters.badge} onChange={e => setFilters(f => ({ ...f, badge: e.target.value }))}>
                    <option value="">All badges</option>
                    <option value="GREEN">GREEN — Top Talent</option>
                    <option value="YELLOW">YELLOW — Rising Star</option>
                    <option value="RED">RED — In Progress</option>
                  </select>
                </div>
                <div className={styles.filterField}>
                  <label>Min Score</label>
                  <input className={styles.input} type="number" min="0" max="100" placeholder="0" value={filters.minScore} onChange={e => setFilters(f => ({ ...f, minScore: e.target.value }))} />
                </div>
                <div className={styles.filterField}>
                  <label>Max Score</label>
                  <input className={styles.input} type="number" min="0" max="100" placeholder="100" value={filters.maxScore} onChange={e => setFilters(f => ({ ...f, maxScore: e.target.value }))} />
                </div>
                <div className={styles.filterField}>
                  <label>Skills (comma-separated)</label>
                  <input className={styles.input} type="text" placeholder="react, docker, kubernetes" value={filters.skills} onChange={e => setFilters(f => ({ ...f, skills: e.target.value }))} />
                </div>
                <div className={styles.filterField}>
                  <label>GitHub Username</label>
                  <input className={styles.input} type="text" placeholder="username" value={filters.githubUsername} onChange={e => setFilters(f => ({ ...f, githubUsername: e.target.value }))} />
                </div>
              </div>
              <div className={styles.filtersActions}>
                <button type="button" className={styles.clearBtn} onClick={clearFilters}>Clear</button>
                <button type="submit" className={styles.applyBtn}><Search size={15} />Apply Filters</button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Results */}
        {loading ? (
          <div className={styles.loadingGrid}>
            {[...Array(8)].map((_, i) => <div key={i} className={styles.skeleton} />)}
          </div>
        ) : developers.length === 0 ? (
          <div className={styles.empty}>
            <Users size={48} />
            <h3>No developers found</h3>
            <p>Try adjusting your filters.</p>
            {hasActiveFilters && <button className={styles.clearBtn} onClick={clearFilters}>Clear filters</button>}
          </div>
        ) : (
          <motion.div className={styles.grid} variants={staggerContainer} initial="hidden" animate="visible">
            {developers.map((dev) => (
              <DeveloperCard key={dev.id} dev={dev} onRequestInterview={setSelectedDev} />
            ))}
          </motion.div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className={styles.pagination}>
            <button className={styles.pageBtn} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft size={18} />
            </button>
            <span className={styles.pageInfo}>Page {page} of {totalPages}</span>
            <button className={styles.pageBtn} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Interview Request Modal */}
      <AnimatePresence>
        {selectedDev && (
          <InterviewModal dev={selectedDev} onClose={() => setSelectedDev(null)} onSubmit={handleInterviewSubmit} />
        )}
      </AnimatePresence>
    </CompanyLayout>
  );
});

TalentFeed.displayName = 'TalentFeed';
export default TalentFeed;

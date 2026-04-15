import { memo, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Send, Clock, CheckCircle2, XCircle, Ban, Award, ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import CompanyLayout from '../../components/CompanyLayout/CompanyLayout';
import { getInterviewRequests, cancelInterviewRequest, completeInterviewRequest } from '../../../../services/companyApi';
import { useToast } from '../../../../contexts/ToastContext';
import { fadeInUp, staggerContainer } from '../../../../utils/animations';
import styles from './InterviewRequests.module.css';

const STATUS_CONFIG = {
  PENDING:   { label: 'Pending',   icon: Clock,         color: '#f59e0b' },
  ACCEPTED:  { label: 'Accepted',  icon: CheckCircle2,  color: '#10b981' },
  REJECTED:  { label: 'Declined',  icon: XCircle,       color: '#ef4444' },
  CANCELLED: { label: 'Cancelled', icon: Ban,           color: '#6b7280' },
  COMPLETED: { label: 'Completed', icon: Award,         color: '#6366f1' },
};

const RequestCard = memo(({ req, onCancel, onComplete }) => {
  const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.PENDING;
  const StatusIcon = cfg.icon;
  const dev = req.developer || {};
  const [loading, setLoading] = useState(false);

  const handleAction = async (action) => {
    setLoading(true);
    await action(req.id);
    setLoading(false);
  };

  return (
    <motion.div className={styles.card} variants={fadeInUp}>
      <div className={styles.cardHeader}>
        <div className={styles.devRow}>
          <div className={styles.devAvatar}>
            {dev.avatar
              ? <img src={dev.avatar} alt="" className={styles.devAvatarImg} />
              : <div className={styles.devAvatarFallback}>{(dev.name || dev.githubUsername || 'D')[0].toUpperCase()}</div>}
          </div>
          <div className={styles.devInfo}>
            <div className={styles.devName}>{dev.name || dev.githubUsername || 'Developer'}</div>
            {dev.githubUsername && <div className={styles.devHandle}>@{dev.githubUsername}</div>}
          </div>
        </div>
        <div className={styles.statusBadge} style={{ background: `${cfg.color}18`, color: cfg.color, borderColor: `${cfg.color}40` }}>
          <StatusIcon size={13} />{cfg.label}
        </div>
      </div>

      {req.position && (
        <div className={styles.positionRow}>
          <span className={styles.positionLabel}>Position</span>
          <span className={styles.positionValue}>{req.position}</span>
        </div>
      )}

      {req.message && <p className={styles.message}>"{req.message}"</p>}

      <div className={styles.cardMeta}>
        <span className={styles.dateLabel}>Sent {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        {req.submission?.portfolio?.[0]?.slug && (
          <Link to={`/portfolio/${req.submission.portfolio[0].slug}`} target="_blank" className={styles.portfolioLink}>
            <ExternalLink size={13} />View Portfolio
          </Link>
        )}
      </div>

      {req.status === 'PENDING' && (
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={() => handleAction(onCancel)} disabled={loading}>
            {loading ? <Loader2 size={14} className={styles.spin} /> : <Ban size={14} />}
            Cancel
          </button>
        </div>
      )}

      {req.status === 'ACCEPTED' && (
        <div className={styles.actions}>
          <button className={styles.completeBtn} onClick={() => handleAction(onComplete)} disabled={loading}>
            {loading ? <Loader2 size={14} className={styles.spin} /> : <Award size={14} />}
            Mark Complete
          </button>
        </div>
      )}
    </motion.div>
  );
});
RequestCard.displayName = 'RequestCard';

const InterviewRequests = memo(() => {
  const toast = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');

  const STATUS_FILTERS = ['ALL', 'PENDING', 'ACCEPTED', 'COMPLETED', 'REJECTED', 'CANCELLED'];

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const status = activeFilter === 'ALL' ? undefined : activeFilter;
      const data = await getInterviewRequests(status);
      setRequests(data.requests || data || []);
    } catch {
      toast.error('Failed to load interview requests');
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  const handleCancel = async (id) => {
    try {
      await cancelInterviewRequest(id);
      toast.success('Interview request cancelled');
      loadRequests();
    } catch (err) {
      toast.error(err.message || 'Failed to cancel request');
    }
  };

  const handleComplete = async (id) => {
    try {
      await completeInterviewRequest(id);
      toast.success('Marked as completed!');
      loadRequests();
    } catch (err) {
      toast.error(err.message || 'Failed to complete request');
    }
  };

  const counts = requests.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <CompanyLayout title="Interview Requests">
      <div className={styles.page}>
        <div className={styles.topRow}>
          <h1 className={styles.pageTitle}>Interview Requests</h1>
          <button className={styles.refreshBtn} onClick={loadRequests}>
            <RefreshCw size={16} />Refresh
          </button>
        </div>

        {/* Status filter tabs */}
        <div className={styles.filterTabs}>
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              className={`${styles.filterTab} ${activeFilter === s ? styles.filterTabActive : ''}`}
              onClick={() => setActiveFilter(s)}
            >
              {s === 'ALL' ? 'All' : STATUS_CONFIG[s]?.label || s}
              {s !== 'ALL' && counts[s] ? <span className={styles.count}>{counts[s]}</span> : null}
            </button>
          ))}
        </div>

        {loading ? (
          <div className={styles.loading}><Loader2 size={36} className={styles.spin} /><p>Loading requests...</p></div>
        ) : requests.length === 0 ? (
          <div className={styles.empty}>
            <Send size={48} />
            <h3>No requests yet</h3>
            <p>Browse the talent feed and send interview requests to developers you're interested in.</p>
            <Link to="/company/talent" className={styles.browseBtn}>Browse Talent Feed</Link>
          </div>
        ) : (
          <motion.div className={styles.grid} variants={staggerContainer} initial="hidden" animate="visible">
            {requests.map((req) => (
              <RequestCard key={req.id} req={req} onCancel={handleCancel} onComplete={handleComplete} />
            ))}
          </motion.div>
        )}
      </div>
    </CompanyLayout>
  );
});

InterviewRequests.displayName = 'InterviewRequests';
export default InterviewRequests;

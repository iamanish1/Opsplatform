import { memo, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Inbox, Clock, CheckCircle2, XCircle, Award, Loader2,
  Building2, ExternalLink, Briefcase, Calendar, ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout';
import { getInterviewRequests, acceptInterviewRequest, rejectInterviewRequest } from '../../../../services/companyApi';
import { useToast } from '../../../../contexts/ToastContext';
import styles from './StudentInterviews.module.css';

const STATUS_CONFIG = {
  PENDING:   { label: 'Pending',   icon: Clock,        color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.25)' },
  ACCEPTED:  { label: 'Accepted',  icon: CheckCircle2, color: '#10b981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.25)' },
  REJECTED:  { label: 'Declined',  icon: XCircle,      color: '#ef4444', bg: 'rgba(239,68,68,0.1)',    border: 'rgba(239,68,68,0.2)'   },
  CANCELLED: { label: 'Cancelled', icon: XCircle,      color: '#6b7280', bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.2)' },
  COMPLETED: { label: 'Completed', icon: Award,        color: '#6366f1', bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.25)' },
};

const STATUS_FILTERS = ['ALL', 'PENDING', 'ACCEPTED', 'COMPLETED', 'REJECTED'];

const RequestCard = memo(({ req, onAccept, onReject, index }) => {
  const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.PENDING;
  const StatusIcon = cfg.icon;
  const company = req.company || {};
  const [loading, setLoading] = useState(null);

  const handleAction = async (action, key) => {
    setLoading(key);
    await action(req.id);
    setLoading(null);
  };

  const companyInitial = (company.companyName || 'C')[0].toUpperCase();

  return (
    <motion.div
      className={styles.card}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Top row: company + status */}
      <div className={styles.cardTop}>
        <div className={styles.companyRow}>
          <div className={styles.avatar}>
            {company.logo
              ? <img src={company.logo} alt="" className={styles.avatarImg} />
              : <div className={styles.avatarFallback}>{companyInitial}</div>}
          </div>
          <div className={styles.companyMeta}>
            <span className={styles.companyName}>{company.companyName || 'A Company'}</span>
            {company.industry && <span className={styles.companyIndustry}>{company.industry}</span>}
          </div>
        </div>
        <div className={styles.statusChip} style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}>
          <StatusIcon size={12} />
          {cfg.label}
        </div>
      </div>

      {/* Position */}
      {req.position && (
        <div className={styles.positionRow}>
          <Briefcase size={13} className={styles.positionIcon} />
          <span className={styles.positionText}>{req.position}</span>
        </div>
      )}

      {/* Message */}
      {req.message && (
        <p className={styles.message}>"{req.message}"</p>
      )}

      {/* Footer */}
      <div className={styles.cardFooter}>
        <div className={styles.dateLine}>
          <Calendar size={11} />
          {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
        {req.submission?.portfolio?.[0]?.slug && (
          <Link to={`/portfolios/${req.submission.portfolio[0].slug}`} target="_blank" className={styles.portfolioLink}>
            <ExternalLink size={12} />View your portfolio
          </Link>
        )}
      </div>

      {/* Actions — only for PENDING */}
      {req.status === 'PENDING' && (
        <div className={styles.actions}>
          <button
            className={styles.rejectBtn}
            onClick={() => handleAction(onReject, 'reject')}
            disabled={loading !== null}
          >
            {loading === 'reject' ? <Loader2 size={13} className={styles.spin} /> : <XCircle size={13} />}
            Decline
          </button>
          <button
            className={styles.acceptBtn}
            onClick={() => handleAction(onAccept, 'accept')}
            disabled={loading !== null}
          >
            {loading === 'accept' ? <Loader2 size={13} className={styles.spin} /> : <CheckCircle2 size={13} />}
            Accept
          </button>
        </div>
      )}
    </motion.div>
  );
});
RequestCard.displayName = 'RequestCard';

const StudentInterviews = memo(() => {
  const toast = useToast();
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getInterviewRequests();
      setAllRequests(data.requests || data || []);
    } catch {
      toast.error('Failed to load interview requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  const requests = activeFilter === 'ALL'
    ? allRequests
    : allRequests.filter((r) => r.status === activeFilter);

  const handleAccept = async (id) => {
    try {
      await acceptInterviewRequest(id);
      toast.success('Interview request accepted!');
      setAllRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: 'ACCEPTED' } : r));
    } catch (err) {
      toast.error(err.message || 'Failed to accept request');
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectInterviewRequest(id);
      toast.success('Request declined');
      setAllRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: 'REJECTED' } : r));
    } catch (err) {
      toast.error(err.message || 'Failed to decline request');
    }
  };

  const counts = allRequests.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  const pendingCount = counts.PENDING || 0;
  const totalShown = allRequests.length;

  return (
    <DashboardLayout>
      <div className={styles.page}>

        {/* Page header */}
        <div className={styles.pageHeader}>
          <div>
            <div className={styles.titleRow}>
              <h2 className={styles.pageTitle}>Interview Requests</h2>
              {pendingCount > 0 && (
                <span className={styles.pendingBadge}>{pendingCount} new</span>
              )}
            </div>
            <p className={styles.subtitle}>Companies interested in your verified profile will appear here.</p>
          </div>
          <button className={styles.refreshBtn} onClick={loadRequests} title="Refresh">
            <Loader2 size={14} className={loading ? styles.spin : styles.hidden} />
            {!loading && <ChevronRight size={14} style={{ transform: 'rotate(270deg)' }} />}
            Refresh
          </button>
        </div>

        {/* Summary chips — only when there's data */}
        {totalShown > 0 && (
          <div className={styles.summaryRow}>
            {Object.entries(counts).map(([status, count]) => {
              const cfg = STATUS_CONFIG[status];
              if (!cfg) return null;
              return (
                <div key={status} className={styles.summaryChip} style={{ color: cfg.color }}>
                  <cfg.icon size={12} />
                  <span>{count} {cfg.label}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Filter tabs */}
        <div className={styles.filterRow}>
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              className={`${styles.filterTab} ${activeFilter === s ? styles.filterTabActive : ''}`}
              onClick={() => setActiveFilter(s)}
            >
              {s === 'ALL' ? 'All requests' : STATUS_CONFIG[s]?.label || s}
              {s !== 'ALL' && counts[s] ? (
                <span className={styles.filterCount}>{counts[s]}</span>
              ) : null}
              {s === 'ALL' && totalShown > 0 ? (
                <span className={styles.filterCount}>{totalShown}</span>
              ) : null}
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" className={styles.loadingState} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Loader2 size={28} className={styles.spin} />
              <span>Loading requests...</span>
            </motion.div>
          ) : requests.length === 0 ? (
            <motion.div key="empty" className={styles.emptyState} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className={styles.emptyIcon}>
                <Inbox size={32} />
              </div>
              <h3 className={styles.emptyTitle}>
                {activeFilter === 'ALL' ? 'No requests yet' : `No ${STATUS_CONFIG[activeFilter]?.label?.toLowerCase() || activeFilter.toLowerCase()} requests`}
              </h3>
              <p className={styles.emptyText}>
                {activeFilter === 'ALL'
                  ? 'When companies find your verified profile and want to connect, their requests will appear here. Submit more projects to boost your visibility.'
                  : `You have no ${STATUS_CONFIG[activeFilter]?.label?.toLowerCase()} requests right now.`}
              </p>
              {activeFilter === 'ALL' && (
                <Link to="/dashboard/projects" className={styles.emptyAction}>
                  Browse projects <ChevronRight size={14} />
                </Link>
              )}
            </motion.div>
          ) : (
            <motion.div key="grid" className={styles.grid} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {requests.map((req, i) => (
                <RequestCard
                  key={req.id}
                  req={req}
                  index={i}
                  onAccept={handleAccept}
                  onReject={handleReject}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
});

StudentInterviews.displayName = 'StudentInterviews';
export default StudentInterviews;

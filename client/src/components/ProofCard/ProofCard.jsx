import { memo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Star, Zap, Copy, CheckCircle2,
  Linkedin, Twitter, ExternalLink, X, Download
} from 'lucide-react';
import styles from './ProofCard.module.css';

const BADGE_CONFIG = {
  GREEN:  { label: 'Top Talent',  color: '#10b981', glow: 'rgba(16,185,129,0.3)',  rank: '🏆' },
  YELLOW: { label: 'Rising Star', color: '#f59e0b', glow: 'rgba(245,158,11,0.3)', rank: '⭐' },
  RED:    { label: 'Builder',     color: '#ef4444', glow: 'rgba(239,68,68,0.3)',   rank: '🔨' },
};

/**
 * ProofCard — Beautiful shareable trust score card
 * Shown on portfolio pages and submissions after review.
 *
 * Props:
 *   user       — { name, githubUsername, avatar }
 *   score      — { totalScore, badge, codeQuality, security, ... }
 *   portfolioSlug — for sharing link
 *   compact    — smaller variant for embedding in submission view
 */
const ProofCard = memo(({ user = {}, score = {}, portfolioSlug, compact = false }) => {
  const [copied, setCopied] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const totalScore = score?.totalScore ?? 0;
  const badge = score?.badge || 'RED';
  const cfg = BADGE_CONFIG[badge] || BADGE_CONFIG.RED;

  const shareUrl = portfolioSlug
    ? `${window.location.origin}/portfolio/${portfolioSlug}`
    : window.location.href;

  const shareText = `I earned a ${totalScore}/100 Trust Score on DevHubs! AI-verified across 10 code quality categories. ${cfg.rank}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const handleTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const topCategories = [
    ['codeQuality', 'Code'],
    ['security', 'Security'],
    ['devopsExecution', 'DevOps'],
    ['problemSolving', 'Problem Solving'],
  ]
    .map(([key, label]) => ({ label, value: score[key] ?? 0 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);

  return (
    <div className={`${styles.wrapper} ${compact ? styles.compact : ''}`}>
      {/* Card */}
      <div className={styles.card} style={{ '--badge-color': cfg.color, '--badge-glow': cfg.glow }}>
        {/* Background elements */}
        <div className={styles.cardGlow} />
        <div className={styles.cardGrid} />

        {/* Header */}
        <div className={styles.cardHeader}>
          <div className={styles.brandMark}><Zap size={14} />DevHubs</div>
          <div className={styles.verifiedMark}><Shield size={12} />AI Verified</div>
        </div>

        {/* Developer info */}
        <div className={styles.devSection}>
          <div className={styles.devAvatar}>
            {user.avatar
              ? <img src={user.avatar} alt={user.name} className={styles.avatarImg} />
              : <div className={styles.avatarFallback}>{(user.name || user.githubUsername || 'D')[0].toUpperCase()}</div>}
          </div>
          <div className={styles.devInfo}>
            <div className={styles.devName}>{user.name || user.githubUsername || 'Developer'}</div>
            {user.githubUsername && <div className={styles.devHandle}>@{user.githubUsername}</div>}
          </div>
        </div>

        {/* Score circle */}
        <div className={styles.scoreSection}>
          <div className={styles.scoreRing} style={{ borderColor: cfg.color }}>
            <div className={styles.scoreValue} style={{ color: cfg.color }}>{totalScore}</div>
            <div className={styles.scoreMax}>/100</div>
          </div>
          <div className={styles.scoreLabel}>Trust Score</div>
          <div className={styles.badgePill} style={{ background: `${cfg.color}18`, color: cfg.color, borderColor: `${cfg.color}44` }}>
            <Star size={11} />{cfg.label}
          </div>
        </div>

        {/* Top skills */}
        {!compact && topCategories.length > 0 && (
          <div className={styles.skillsSection}>
            {topCategories.map(({ label, value }) => (
              <div key={label} className={styles.skillPill}>
                <span className={styles.skillLabel}>{label}</span>
                <span className={styles.skillVal} style={{ color: cfg.color }}>{value}/10</span>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className={styles.cardFooter}>
          <span className={styles.footerText}>devhubs.ai · AI Talent Assurance</span>
        </div>
      </div>

      {/* Share actions */}
      <div className={styles.shareRow}>
        <span className={styles.shareLabel}>Share your achievement</span>
        <div className={styles.shareBtns}>
          <button className={styles.shareBtn} onClick={handleCopy} title="Copy link">
            {copied ? <CheckCircle2 size={15} style={{ color: '#10b981' }} /> : <Copy size={15} />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
          <button className={styles.shareBtn} onClick={handleLinkedIn} title="Share on LinkedIn">
            <Linkedin size={15} />LinkedIn
          </button>
          <button className={styles.shareBtn} onClick={handleTwitter} title="Share on Twitter">
            <Twitter size={15} />Twitter
          </button>
          {portfolioSlug && (
            <a href={shareUrl} target="_blank" rel="noopener noreferrer" className={styles.shareBtn}>
              <ExternalLink size={15} />View Public
            </a>
          )}
        </div>
      </div>
    </div>
  );
});

ProofCard.displayName = 'ProofCard';
export default ProofCard;

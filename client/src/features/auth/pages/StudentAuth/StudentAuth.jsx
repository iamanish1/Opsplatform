import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Github, ArrowLeft, Building2, Code, Zap, TrendingUp, Users } from 'lucide-react';
import AuthLayout from '../../components/AuthLayout/AuthLayout';
import GitHubButton from '../../components/GitHubButton/GitHubButton';
import { fadeInUp, staggerContainer } from '../../../../utils/animations';
import styles from './StudentAuth.module.css';

const StudentAuth = memo(() => {
  const [hoveredBenefit, setHoveredBenefit] = useState(null);

  const handleGitHubClick = () => {
    // Placeholder for GitHub OAuth - will redirect to backend endpoint
    // In production: window.location.href = '/api/auth/github';
    console.log('GitHub OAuth initiated');
  };

  const benefits = [
    { icon: Code, text: 'Real DevOps Projects', color: '#8b5cf6' },
    { icon: Zap, text: 'AI-Verified Trust Scores', color: '#ec4899' },
    { icon: TrendingUp, text: 'Portfolio Companies Trust', color: '#10b981' },
    { icon: Users, text: 'Connect with Top Employers', color: '#f59e0b' },
  ];

  return (
    <AuthLayout>
      <motion.div
        className={styles.studentAuthCard}
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {/* Trust Score Preview Badge */}
        <motion.div 
          className={styles.trustScoreBadge}
          variants={fadeInUp}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        >
          <div className={styles.trustScoreValue}>87</div>
          <div className={styles.trustScoreLabel}>Trust Score</div>
          <motion.div
            className={styles.trustScoreBar}
            initial={{ width: 0 }}
            animate={{ width: '87%' }}
            transition={{ delay: 0.5, duration: 1, ease: 'easeOut' }}
          />
        </motion.div>

        <motion.div className={styles.cardHeader} variants={fadeInUp}>
          <motion.div 
            className={styles.iconWrapper}
            whileHover={{ scale: 1.1, rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 0.5 }}
          >
            <Github size={28} />
            <motion.div
              className={styles.iconPulse}
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
          <h1 className={styles.cardTitle}>
            Turn Your Code Into{' '}
            <span className={styles.gradientText}>Your Resume</span>
          </h1>
          <p className={styles.cardDescription}>
            Connect with GitHub and start building your DevOps portfolio. Get AI-verified Trust Scores that companies actually trust.
          </p>
        </motion.div>

        <motion.div className={styles.cardContent} variants={fadeInUp}>
          <GitHubButton
            onClick={handleGitHubClick}
            size="large"
          />
          
          {/* Quick Stats */}
          <motion.div 
            className={styles.quickStats}
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.3 }}
          >
            <div className={styles.statItem}>
              <span className={styles.statNumber}>2.5K+</span>
              <span className={styles.statLabel}>Students Building</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statNumber}>50+</span>
              <span className={styles.statLabel}>Companies Hiring</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Interactive Benefits Grid */}
        <motion.div 
          className={styles.benefitsGrid}
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <motion.div
                key={index}
                className={styles.benefitCard}
                variants={fadeInUp}
                onHoverStart={() => setHoveredBenefit(index)}
                onHoverEnd={() => setHoveredBenefit(null)}
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <motion.div
                  className={styles.benefitIcon}
                  style={{ backgroundColor: `${benefit.color}15` }}
                  animate={{
                    scale: hoveredBenefit === index ? 1.1 : 1,
                    rotate: hoveredBenefit === index ? [0, -5, 5, 0] : 0,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <Icon size={20} style={{ color: benefit.color }} />
                </motion.div>
                <span className={styles.benefitText}>{benefit.text}</span>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div className={styles.cardFooter} variants={fadeInUp}>
          <div className={styles.divider}>
            <span>or</span>
          </div>
          
          <Link to="/auth/company/login" className={styles.switchLink}>
            <Building2 size={18} />
            <span>Sign in as a Company</span>
          </Link>

          <Link to="/" className={styles.backLink}>
            <ArrowLeft size={16} />
            <span>Back to Home</span>
          </Link>
        </motion.div>
      </motion.div>
    </AuthLayout>
  );
});

StudentAuth.displayName = 'StudentAuth';

export default StudentAuth;

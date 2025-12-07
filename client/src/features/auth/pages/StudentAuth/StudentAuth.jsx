import { memo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Github, ArrowLeft, Building2 } from 'lucide-react';
import AuthLayout from '../../components/AuthLayout/AuthLayout';
import GitHubButton from '../../components/GitHubButton/GitHubButton';
import { fadeInUp, staggerContainer } from '../../../../utils/animations';
import styles from './StudentAuth.module.css';

const StudentAuth = memo(() => {
  const handleGitHubClick = () => {
    // Placeholder for GitHub OAuth - will redirect to backend endpoint
    // In production: window.location.href = '/api/auth/github';
    console.log('GitHub OAuth initiated');
  };

  return (
    <AuthLayout>
      <motion.div
        className={styles.studentAuthCard}
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.div className={styles.cardHeader} variants={fadeInUp}>
          <div className={styles.iconWrapper}>
            <Github size={32} />
          </div>
          <h1 className={styles.cardTitle}>
            Sign in with <span className={styles.gradientText}>GitHub</span>
          </h1>
          <p className={styles.cardDescription}>
            Connect your GitHub account to start building your DevOps portfolio and earn Trust Scores.
          </p>
        </motion.div>

        <motion.div className={styles.cardContent} variants={fadeInUp}>
          <GitHubButton
            onClick={handleGitHubClick}
            size="large"
          />
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

        <motion.div className={styles.benefits} variants={fadeInUp}>
          <h3 className={styles.benefitsTitle}>What you'll get:</h3>
          <ul className={styles.benefitsList}>
            <li>Access to real DevOps projects</li>
            <li>AI-verified Trust Scores</li>
            <li>Build a portfolio companies trust</li>
            <li>Connect with top employers</li>
          </ul>
        </motion.div>
      </motion.div>
    </AuthLayout>
  );
});

StudentAuth.displayName = 'StudentAuth';

export default StudentAuth;

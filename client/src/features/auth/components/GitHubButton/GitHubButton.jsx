import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { Github } from 'lucide-react';
import styles from './GitHubButton.module.css';

const GitHubButton = memo(({ onClick, disabled = false, loading = false, size = 'large' }) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    if (!disabled && !loading && onClick) {
      onClick();
    }
  };

  return (
    <motion.button
      className={`${styles.githubButton} ${styles[`githubButton${size.charAt(0).toUpperCase() + size.slice(1)}`]}`}
      onClick={handleClick}
      disabled={disabled || loading}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={!disabled && !loading ? { scale: 1.02, y: -2 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className={styles.githubIcon}
        animate={isHovered && !disabled && !loading ? { rotate: [0, -10, 10, -10, 0] } : {}}
        transition={{ duration: 0.5 }}
      >
        <Github size={size === 'large' ? 24 : 20} />
      </motion.div>
      <span className={styles.githubButtonText}>
        {loading ? 'Connecting...' : 'Continue with GitHub'}
      </span>
      {loading && (
        <motion.div
          className={styles.loadingSpinner}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      )}
      {!disabled && !loading && (
        <motion.div
          className={styles.githubButtonGlow}
          animate={{
            opacity: [0.5, 1, 0.5],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
    </motion.button>
  );
});

GitHubButton.displayName = 'GitHubButton';

export default GitHubButton;

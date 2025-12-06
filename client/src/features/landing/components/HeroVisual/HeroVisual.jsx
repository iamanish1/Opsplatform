import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { GitBranch, Code, Rocket, Shield } from 'lucide-react';
import styles from './HeroVisual.module.css';

const HeroVisual = memo(() => {
  const icons = useMemo(() => [
    { Icon: GitBranch, delay: 0, x: 0, y: 0 },
    { Icon: Code, delay: 0.2, x: 60, y: -40 },
    { Icon: Rocket, delay: 0.4, x: -40, y: 40 },
    { Icon: Shield, delay: 0.6, x: 40, y: 60 }
  ], []);

  return (
    <div className={styles.heroVisual}>
      {/* Animated gradient mesh */}
      <div className={styles.gradientMesh}>
        <div className={styles.meshOrb1}></div>
        <div className={styles.meshOrb2}></div>
        <div className={styles.meshOrb3}></div>
      </div>

      {/* Floating icons */}
      <div className={styles.floatingIcons}>
        {icons.map(({ Icon, delay, x, y }, index) => (
          <motion.div
            key={index}
            className={styles.floatingIcon}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.1, 1],
              x: [0, x, 0],
              y: [0, y, 0]
            }}
            transition={{
              duration: 4 + delay,
              repeat: Infinity,
              delay: delay,
              ease: 'easeInOut'
            }}
          >
            <Icon size={32} />
          </motion.div>
        ))}
      </div>

      {/* Grid pattern overlay */}
      <div className={styles.gridOverlay}></div>
    </div>
  );
});

HeroVisual.displayName = 'HeroVisual';

export default HeroVisual;


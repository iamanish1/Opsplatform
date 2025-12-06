import { memo } from 'react';
import { motion } from 'framer-motion';
import { Users, FolderKanban, Building2, TrendingUp } from 'lucide-react';
import AnimatedCounter from '../AnimatedCounter/AnimatedCounter';
import { fadeInUp, staggerContainer } from '../../../../utils/animations';
import styles from './StatsSection.module.css';

const StatsSection = memo(() => {
  const stats = [
    {
      icon: Users,
      value: 2500,
      suffix: '+',
      label: 'Students Building Skills',
      color: '#ffffff'
    },
    {
      icon: FolderKanban,
      value: 150,
      suffix: '+',
      label: 'Real Projects Completed',
      color: '#e0e0e0'
    },
    {
      icon: Building2,
      value: 50,
      suffix: '+',
      label: 'Hiring Partners',
      color: '#10b981'
    },
    {
      icon: TrendingUp,
      value: 92,
      suffix: '%',
      label: 'Average Trust Score',
      color: '#f59e0b'
    }
  ];

  return (
    <section className={styles.statsSection}>
      <div className={styles.statsContainer}>
        <motion.div
          className={styles.statsHeader}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={fadeInUp}
        >
          <h2 className={styles.statsTitle}>
            Real Results,{' '}
            <span className={styles.gradientText}>Real Impact</span>
          </h2>
          <p className={styles.statsSubtitle}>
            Join thousands of developers building real skills and landing their dream jobs.
          </p>
        </motion.div>

        <motion.div
          className={styles.statsGrid}
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                className={styles.statCard}
                variants={fadeInUp}
                whileHover={{ y: -8, scale: 1.03 }}
                style={{ '--stat-color': stat.color }}
              >
                <div className={styles.statIcon}>
                  <Icon size={32} />
                </div>
                <div className={styles.statValue}>
                  <AnimatedCounter
                    value={stat.value}
                    suffix={stat.suffix}
                    duration={2}
                  />
                </div>
                <div className={styles.statLabel}>{stat.label}</div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
});

StatsSection.displayName = 'StatsSection';

export default StatsSection;


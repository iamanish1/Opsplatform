import { memo } from 'react';
import { motion } from 'framer-motion';
import { FileCode, Award, Badge } from 'lucide-react';
import GlassCard from '../../../../components/ui/GlassCard/GlassCard';
import { fadeInUp, staggerContainer } from '../../../../utils/animations';
import styles from './QuickStatsWidget.module.css';

const QuickStatsWidget = memo(({ stats }) => {
  const { submissions = 0, portfolios = 0, certificates = 0 } = stats || {};

  const statItems = [
    { icon: FileCode, label: 'Submissions', value: submissions, color: '#8b5cf6' },
    { icon: Award, label: 'Portfolios', value: portfolios, color: '#ec4899' },
    { icon: Badge, label: 'Certificates', value: certificates, color: '#f59e0b' },
  ];

  return (
    <GlassCard className={styles.quickStatsWidget}>
      <motion.div
        className={styles.content}
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.h3 className={styles.title} variants={fadeInUp}>
          Quick Stats
        </motion.h3>

        <div className={styles.statsGrid}>
          {statItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                className={styles.statItem}
                variants={fadeInUp}
                whileHover={{ y: -4, scale: 1.02 }}
              >
                <div className={styles.statIcon} style={{ backgroundColor: `${item.color}20`, color: item.color }}>
                  <Icon size={20} />
                </div>
                <div className={styles.statContent}>
                  <div className={styles.statValue}>{item.value}</div>
                  <div className={styles.statLabel}>{item.label}</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </GlassCard>
  );
});

QuickStatsWidget.displayName = 'QuickStatsWidget';

export default QuickStatsWidget;

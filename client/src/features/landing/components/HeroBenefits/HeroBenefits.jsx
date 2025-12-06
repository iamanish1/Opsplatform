import { memo } from 'react';
import { motion } from 'framer-motion';
import { Code, Brain, Award, FolderOpen } from 'lucide-react';
import { fadeInUp } from '../../../../utils/animations';
import styles from './HeroBenefits.module.css';

const HeroBenefits = memo(() => {
  const benefits = [
    {
      icon: Code,
      label: 'Real DevOps Projects',
      description: 'Docker, CI/CD, deployments'
    },
    {
      icon: Brain,
      label: 'AI Talent Assurance',
      description: 'Automated verification'
    },
    {
      icon: Award,
      label: 'Trust Score',
      description: '0-100 verified skills'
    },
    {
      icon: FolderOpen,
      label: 'Proof-of-Work Portfolio',
      description: 'Companies trust real work'
    }
  ];

  return (
    <div className={styles.benefitsContainer}>
      {benefits.map((benefit, index) => {
        const Icon = benefit.icon;
        return (
          <motion.div
            key={benefit.label}
            className={styles.benefitItem}
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05, y: -2 }}
          >
            <div className={styles.benefitIcon}>
              <Icon size={20} />
            </div>
            <div className={styles.benefitContent}>
              <div className={styles.benefitLabel}>{benefit.label}</div>
              <div className={styles.benefitDescription}>{benefit.description}</div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
});

HeroBenefits.displayName = 'HeroBenefits';

export default HeroBenefits;


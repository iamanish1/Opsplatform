import { memo } from 'react';
import { motion } from 'framer-motion';
import { Code2, Brain, Award, FolderKanban, GitBranch, Shield, Zap, TrendingUp } from 'lucide-react';
import { fadeInUp, slideInLeft, slideInRight } from '../../../../utils/animations';
import styles from './FeatureHighlight.module.css';

const FeatureHighlight = memo(() => {
  const features = [
    {
      icon: Code2,
      title: 'Real DevOps Projects',
      description: 'Work on actual production-grade projects. Build Docker containers, set up CI/CD pipelines, deploy to cloud infrastructure, and debug real issues—just like engineers do in real companies.',
      color: '#ffffff',
      position: 'left'
    },
    {
      icon: Brain,
      title: 'AI Talent Assurance Engine',
      description: 'Every pull request is automatically analyzed by our AI. It evaluates your code quality, pipeline efficiency, deployment reliability, and problem-solving skills to generate your Trust Score.',
      color: '#e0e0e0',
      position: 'right'
    },
    {
      icon: Award,
      title: 'Trust Score (0-100)',
      description: 'Get a verified Trust Score based on real work, not claims. Companies trust developers with high scores because they\'ve proven their skills through actual deployments and code.',
      color: '#10b981',
      position: 'left'
    },
    {
      icon: FolderKanban,
      title: 'Proof-of-Work Portfolio',
      description: 'Build a comprehensive portfolio showcasing your deployments, architecture decisions, logs, pipelines, and PR history. This becomes your verified resume that companies actually trust.',
      color: '#f59e0b',
      position: 'right'
    }
  ];

  return (
    <section className={styles.featuresSection}>
      <div className={styles.featuresContainer}>
        <motion.div
          className={styles.featuresHeader}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={fadeInUp}
        >
          <h2 className={styles.featuresTitle}>
            Everything You Need to{' '}
            <span className={styles.gradientText}>Succeed</span>
          </h2>
          <p className={styles.featuresSubtitle}>
            A complete platform designed to bridge the gap between learning and landing your dream DevOps role.
          </p>
        </motion.div>

        <div className={styles.featuresGrid}>
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isLeft = feature.position === 'left';
            const animationVariant = isLeft ? slideInLeft : slideInRight;

            return (
              <motion.div
                key={feature.title}
                className={`${styles.featureCard} ${isLeft ? styles.left : styles.right}`}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.15 }}
                variants={animationVariant}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4, scale: 1.01 }}
                style={{ '--feature-color': feature.color }}
              >
                <div
                  className={styles.featureIcon}
                  style={{ '--feature-color': feature.color }}
                >
                  <Icon size={28} />
                </div>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDescription}>{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
});

FeatureHighlight.displayName = 'FeatureHighlight';

export default FeatureHighlight;


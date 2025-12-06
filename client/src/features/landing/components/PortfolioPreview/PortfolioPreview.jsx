import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GitBranch, 
  Rocket, 
  FileCode, 
  Layers, 
  CheckCircle2, 
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import styles from './PortfolioPreview.module.css';

const PortfolioPreview = () => {
  const [ref, inView] = useInView({
    threshold: 0.2,
    triggerOnce: true
  });

  const [expandedCard, setExpandedCard] = useState(null);

  const portfolioItems = [
    {
      id: 'deployments',
      title: 'Deployments',
      icon: Rocket,
      count: 12,
      color: '#ffffff',
      description: 'Production-ready deployments',
      details: [
        'Docker containerization',
        'CI/CD pipeline setup',
        'Kubernetes orchestration',
        'Cloud infrastructure'
      ]
    },
    {
      id: 'pull-requests',
      title: 'Pull Requests',
      icon: GitBranch,
      count: 28,
      color: '#e0e0e0',
      description: 'Code reviews & merges',
      details: [
        'Feature implementations',
        'Bug fixes',
        'Code refactoring',
        'Documentation updates'
      ]
    },
    {
      id: 'architecture',
      title: 'Architecture',
      icon: Layers,
      count: 8,
      color: '#f59e0b',
      description: 'System designs',
      details: [
        'Microservices architecture',
        'API design patterns',
        'Database schemas',
        'Security implementations'
      ]
    },
    {
      id: 'documentation',
      title: 'Documentation',
      icon: FileCode,
      count: 15,
      color: '#10b981',
      description: 'Technical docs',
      details: [
        'API documentation',
        'Setup guides',
        'Architecture diagrams',
        'Troubleshooting guides'
      ]
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15
      }
    }
  };

  const toggleCard = (id) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

  return (
    <div ref={ref} className={styles.portfolioPreviewContainer}>
      <motion.div
        className={styles.portfolioPreview}
        variants={containerVariants}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
      >
        <motion.h2
          className={styles.portfolioTitle}
          initial={{ opacity: 0, y: -20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.1 }}
        >
          Proof-of-Work Portfolio
        </motion.h2>
        <motion.p
          className={styles.portfolioSubtitle}
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.2 }}
        >
          Real projects. Real skills. Verified by AI.
        </motion.p>

        <div className={styles.portfolioGrid}>
          {portfolioItems.map((item) => {
            const Icon = item.icon;
            const isExpanded = expandedCard === item.id;

            return (
              <motion.div
                key={item.id}
                className={`${styles.portfolioCard} ${isExpanded ? styles.expanded : ''}`}
                variants={cardVariants}
                whileHover={{ y: -5, scale: 1.02 }}
                onClick={() => toggleCard(item.id)}
                style={{ '--card-color': item.color }}
              >
                <div className={styles.portfolioCardHeader}>
                  <div className={styles.portfolioIconContainer}>
                    <motion.div
                      className={styles.portfolioIcon}
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Icon size={28} />
                    </motion.div>
                  </div>
                  <div className={styles.portfolioCardInfo}>
                    <h3 className={styles.portfolioCardTitle}>{item.title}</h3>
                    <p className={styles.portfolioCardDescription}>{item.description}</p>
                  </div>
                  <motion.div
                    className={styles.portfolioCount}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: 'spring' }}
                  >
                    {item.count}
                  </motion.div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      className={styles.portfolioCardDetails}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className={styles.detailsList}>
                        {item.details.map((detail, index) => (
                          <motion.div
                            key={index}
                            className={styles.detailItem}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <CheckCircle2 size={16} />
                            <span>{detail}</span>
                          </motion.div>
                        ))}
                      </div>
                      <motion.button
                        className={styles.portfolioViewButton}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span>View Details</span>
                        <ExternalLink size={16} />
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className={styles.portfolioCardFooter}>
                  {isExpanded ? (
                    <ChevronUp size={20} />
                  ) : (
                    <ChevronDown size={20} />
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default PortfolioPreview;


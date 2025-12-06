import { motion } from 'framer-motion';
import { GitBranch, Package, Rocket, Shield, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import styles from './WorkflowVisualization.module.css';

const WorkflowVisualization = ({ activeStep }) => {
  const [ref, inView] = useInView({
    threshold: 0.2,
    triggerOnce: true
  });

  const steps = [
    {
      id: 'push',
      label: 'Push Code',
      icon: GitBranch,
      color: '#ffffff',
      description: 'Commit and push your changes'
    },
    {
      id: 'build',
      label: 'Build',
      icon: Package,
      color: '#e0e0e0',
      description: 'Docker build and test'
    },
    {
      id: 'deploy',
      label: 'Deploy',
      icon: Rocket,
      color: '#f59e0b',
      description: 'Deploy to production'
    },
    {
      id: 'verify',
      label: 'Verify',
      icon: Shield,
      color: '#10b981',
      description: 'AI verification complete'
    }
  ];

  const getStepStatus = (stepIndex) => {
    if (stepIndex < activeStep) return 'completed';
    if (stepIndex === activeStep) return 'active';
    return 'pending';
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  };

  const stepVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.8 },
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

  return (
    <div ref={ref} className={styles.workflowContainer}>
      <motion.div
        className={styles.workflowVisualization}
        variants={containerVariants}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
      >
        {steps.map((step, index) => {
          const status = getStepStatus(index);
          const Icon = step.icon;
          const isActive = status === 'active';
          const isCompleted = status === 'completed';

          return (
            <div key={step.id} className={styles.workflowStepWrapper}>
              <motion.div
                className={`${styles.workflowStep} ${styles[status]}`}
                variants={stepVariants}
                whileHover={{ scale: 1.1, y: -5 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div className={styles.stepIconContainer}>
                  <motion.div
                    className={`${styles.stepIcon} ${styles[status]}`}
                    style={{ '--step-color': step.color }}
                    animate={{
                      scale: isActive ? [1, 1.2, 1] : 1,
                      boxShadow: isActive
                        ? [`0 0 0 0 ${step.color}40`, `0 0 0 10px ${step.color}00`]
                        : '0 0 0 0 rgba(0,0,0,0)'
                    }}
                    transition={{
                      duration: 2,
                      repeat: isActive ? Infinity : 0,
                      ease: 'easeInOut'
                    }}
                  >
                    {isCompleted ? (
                      <CheckCircle2 size={24} color={step.color} />
                    ) : isActive ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      >
                        <Loader2 size={24} color={step.color} />
                      </motion.div>
                    ) : (
                      <Icon size={24} color={step.color} />
                    )}
                  </motion.div>
                </div>
                <div className={styles.stepLabel}>{step.label}</div>
                <div className={styles.stepDescription}>{step.description}</div>
                {isActive && (
                  <motion.div
                    className={styles.stepProgressBar}
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 2, ease: 'easeInOut' }}
                    style={{ backgroundColor: step.color }}
                  />
                )}
              </motion.div>

              {index < steps.length - 1 && (
                <motion.div
                  className={`${styles.workflowConnector} ${status === 'completed' ? styles.completed : ''}`}
                  initial={{ scaleX: 0 }}
                  animate={{
                    scaleX: status === 'completed' || status === 'active' ? 1 : 0
                  }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <ArrowRight size={20} />
                </motion.div>
              )}
            </div>
          );
        })}
      </motion.div>
    </div>
  );
};

export default WorkflowVisualization;


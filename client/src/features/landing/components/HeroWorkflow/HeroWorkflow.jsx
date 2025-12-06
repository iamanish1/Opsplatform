import { useState, useEffect, useMemo, memo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, GitBranch, Brain, Award, Briefcase, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useInView as useIntersectionObserver } from 'react-intersection-observer';
import useReducedMotion from '../../../../hooks/useReducedMotion';
import styles from './HeroWorkflow.module.css';

const HeroWorkflow = memo(() => {
  const [activeStep, setActiveStep] = useState(0);
  const [expandedStep, setExpandedStep] = useState(null);
  const [hoveredStep, setHoveredStep] = useState(null);
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef(null);

  // Intersection observer for lazy loading animations
  const { ref: inViewRef, inView } = useIntersectionObserver({
    threshold: 0.15,
    triggerOnce: true
  });

  const steps = useMemo(() => [
    {
      id: 'student',
      icon: User,
      label: 'Student',
      description: 'Push Code',
      detailedDescription: 'Start your journey by pushing your code to real DevOps projects. Show your skills through actual work, not just theory.',
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)'
    },
    {
      id: 'push',
      icon: GitBranch,
      label: 'Push Code',
      description: 'Real DevOps Projects',
      detailedDescription: 'Work on authentic DevOps challenges that mirror real-world scenarios. Build pipelines, deploy applications, and solve actual problems.',
      color: '#6366f1',
      gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
    },
    {
      id: 'ai',
      icon: Brain,
      label: 'AI Analyzes',
      description: 'Talent Assurance Engine',
      detailedDescription: 'Our advanced AI engine analyzes your code quality, problem-solving approach, and DevOps execution to provide comprehensive insights.',
      color: '#ec4899',
      gradient: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)'
    },
    {
      id: 'trust',
      icon: Award,
      label: 'Trust Score',
      description: '0-100 Verified',
      detailedDescription: 'Get a verified Trust Score from 0-100 based on 10 key metrics including code quality, security, and DevOps best practices.',
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
    },
    {
      id: 'portfolio',
      icon: Briefcase,
      label: 'Portfolio',
      description: 'Proof-of-Work Built',
      detailedDescription: 'Automatically generate a professional portfolio showcasing your verified skills, project details, and Trust Score breakdown.',
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)'
    },
    {
      id: 'job',
      icon: Briefcase,
      label: 'Get Hired',
      description: 'Job-Ready Developer',
      detailedDescription: 'Companies trust verified developers. Your portfolio and Trust Score speak for themselves, making you stand out in the job market.',
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)'
    }
  ], []);

  // Auto-rotation effect - runs continuously in loop
  useEffect(() => {
    if (!inView || prefersReducedMotion) return;

    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 3000);

    return () => {
      clearInterval(interval);
    };
  }, [inView, steps.length, prefersReducedMotion]);

  // Keyboard navigation - doesn't pause animation, just jumps to step
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!inView) return;
      
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setActiveStep((prev) => (prev + 1) % steps.length);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setActiveStep((prev) => (prev - 1 + steps.length) % steps.length);
      } else if (e.key === 'Escape') {
        setExpandedStep(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inView, steps.length]);

  const handleStepClick = useCallback((index) => {
    setActiveStep(index);
    setExpandedStep(expandedStep === index ? null : index);
    // Animation continues from this step automatically
  }, [expandedStep]);

  const handleNext = useCallback(() => {
    setActiveStep((prev) => (prev + 1) % steps.length);
    // Animation continues from this step automatically
  }, [steps.length]);

  const handlePrevious = useCallback(() => {
    setActiveStep((prev) => (prev - 1 + steps.length) % steps.length);
    // Animation continues from this step automatically
  }, [steps.length]);

  // Animation variants
  const containerVariants = useMemo(() => ({
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.1,
        delayChildren: prefersReducedMotion ? 0 : 0.2
      }
    }
  }), [prefersReducedMotion]);

  const stepVariants = useMemo(() => ({
    hidden: { 
      opacity: 0, 
      y: prefersReducedMotion ? 0 : 30,
      scale: prefersReducedMotion ? 1 : 0.9
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15,
        duration: prefersReducedMotion ? 0.3 : 0.6
      }
    }
  }), [prefersReducedMotion]);

  const connectorVariants = useMemo(() => ({
    hidden: { scaleX: 0, opacity: 0 },
    visible: (isActive) => ({
      scaleX: isActive ? 1 : 0,
      opacity: isActive ? 1 : 0.3,
      transition: {
        duration: prefersReducedMotion ? 0.2 : 0.5,
        ease: 'easeOut'
      }
    })
  }), [prefersReducedMotion]);

  // Set ref for intersection observer
  useEffect(() => {
    if (containerRef.current) {
      inViewRef(containerRef.current);
    }
  }, [inViewRef]);

  return (
    <div 
      ref={containerRef}
      className={styles.workflowContainer}
      role="region"
      aria-label="How it works workflow"
    >
      {/* Background gradient orbs */}
      <div className={styles.backgroundOrbs}>
        {steps.map((step, index) => (
          <motion.div
            key={`orb-${step.id}`}
            className={styles.gradientOrb}
            style={{
              '--orb-color': step.color,
              '--orb-opacity': activeStep === index ? 0.3 : 0.1
            }}
            animate={{
              scale: activeStep === index ? [1, 1.2, 1] : 1,
              opacity: activeStep === index ? 0.3 : 0.1,
              x: activeStep === index ? [0, 20, 0] : 0,
              y: activeStep === index ? [0, -20, 0] : 0
            }}
            transition={{
              duration: prefersReducedMotion ? 0 : 4,
              repeat: prefersReducedMotion ? 0 : Infinity,
              ease: 'easeInOut'
            }}
          />
        ))}
      </div>

      {/* Manual navigation controls */}
      <div className={styles.navigationControls}>
        <button
          className={styles.navButton}
          onClick={handlePrevious}
          aria-label="Previous step"
          type="button"
        >
          <ChevronLeft size={20} />
        </button>
        <div className={styles.stepIndicators}>
          {steps.map((_, index) => (
            <button
              key={`indicator-${index}`}
              className={`${styles.stepIndicator} ${activeStep === index ? styles.active : ''}`}
              onClick={() => handleStepClick(index)}
              aria-label={`Go to step ${index + 1}: ${steps[index].label}`}
              aria-current={activeStep === index ? 'step' : undefined}
              type="button"
            >
              <span className={styles.indicatorNumber}>{index + 1}</span>
            </button>
          ))}
        </div>
        <button
          className={styles.navButton}
          onClick={handleNext}
          aria-label="Next step"
          type="button"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Workflow steps */}
      <motion.div
        className={styles.workflowSteps}
        variants={containerVariants}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
      >
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = activeStep === index;
          const isCompleted = activeStep > index;
          const isPending = activeStep < index;
          const isExpanded = expandedStep === index;
          const isHovered = hoveredStep === index;

          return (
            <div key={step.id} className={styles.stepWrapper}>
              <motion.div
                className={`${styles.workflowStep} ${
                  isActive ? styles.active : ''
                } ${isCompleted ? styles.completed : ''} ${
                  isPending ? styles.pending : ''
                } ${isExpanded ? styles.expanded : ''} ${
                  isHovered ? styles.hovered : ''
                }`}
                style={{ 
                  '--step-color': step.color,
                  '--step-gradient': step.gradient
                }}
                variants={stepVariants}
                animate={{
                  scale: isActive ? (prefersReducedMotion ? 1 : 1.08) : 1,
                  opacity: isPending ? 0.4 : 1,
                  y: isActive ? (prefersReducedMotion ? 0 : -8) : 0,
                  rotateX: isActive && !prefersReducedMotion ? 2 : 0,
                  rotateY: isActive && !prefersReducedMotion ? 0 : 0,
                  z: isActive ? 50 : 0
                }}
                transition={{ 
                  type: 'spring',
                  stiffness: 300,
                  damping: 25,
                  duration: prefersReducedMotion ? 0.2 : 0.4
                }}
                onClick={() => handleStepClick(index)}
                onMouseEnter={() => setHoveredStep(index)}
                onMouseLeave={() => setHoveredStep(null)}
                onFocus={() => setHoveredStep(index)}
                onBlur={() => setHoveredStep(null)}
                role="button"
                tabIndex={0}
                aria-label={`Step ${index + 1}: ${step.label} - ${step.description}`}
                aria-expanded={isExpanded}
                aria-current={isActive ? 'step' : undefined}
                whileHover={prefersReducedMotion ? {} : {
                  scale: 1.05,
                  y: -4
                }}
                whileTap={prefersReducedMotion ? {} : {
                  scale: 0.98
                }}
              >
                {/* Particle effect for active step */}
                {isActive && !prefersReducedMotion && (
                  <div className={styles.particleContainer}>
                    {[...Array(8)].map((_, i) => (
                      <motion.div
                        key={`particle-${i}`}
                        className={styles.particle}
                        style={{ '--particle-color': step.color }}
                        animate={{
                          x: [0, Math.cos(i * 45 * Math.PI / 180) * 40],
                          y: [0, Math.sin(i * 45 * Math.PI / 180) * 40],
                          opacity: [0.8, 0],
                          scale: [0.5, 1.5]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: i * 0.1,
                          ease: 'easeOut'
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Glow effect */}
                <div 
                  className={styles.glowEffect}
                  style={{ '--glow-color': step.color }}
                />

                {/* Step number badge */}
                <div className={styles.stepBadge}>
                  {index + 1}
                </div>

                {/* Icon container with enhanced animations */}
                <motion.div
                  className={styles.stepIcon}
                  animate={{
                    rotate: isActive && !prefersReducedMotion ? [0, 5, -5, 0] : 0,
                    scale: isActive ? 1.1 : 1,
                    boxShadow: isActive
                      ? `0 0 40px ${step.color}60, 0 0 80px ${step.color}30, inset 0 0 20px ${step.color}20`
                      : '0 0 0px transparent'
                  }}
                  transition={{
                    rotate: {
                      duration: prefersReducedMotion ? 0 : 2,
                      repeat: prefersReducedMotion ? 0 : Infinity,
                      ease: 'easeInOut'
                    },
                    scale: {
                      type: 'spring',
                      stiffness: 300,
                      damping: 20
                    },
                    boxShadow: {
                      duration: 0.3
                    }
                  }}
                >
                  <Icon size={28} />
                </motion.div>

                <div className={styles.stepContent}>
                  <motion.div
                    className={styles.stepLabel}
                    animate={{
                      color: isActive ? step.color : 'rgba(255, 255, 255, 0.9)'
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    {step.label}
                  </motion.div>
                  <motion.div
                    className={styles.stepDescription}
                    animate={{
                      opacity: isActive ? 1 : 0.6
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    {step.description}
                  </motion.div>
                </div>

                {/* Expanded details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      className={styles.expandedContent}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <p className={styles.detailedDescription}>
                        {step.detailedDescription}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Enhanced connector with flowing animation */}
              {index < steps.length - 1 && (
                <motion.div
                  className={`${styles.connector} ${
                    isCompleted ? styles.completed : ''
                  } ${isActive ? styles.active : ''}`}
                  variants={connectorVariants}
                  custom={isCompleted || isActive}
                  animate={{
                    scaleX: isCompleted || isActive ? 1 : 0,
                    opacity: isCompleted || isActive ? 1 : 0.3
                  }}
                  transition={{ 
                    duration: prefersReducedMotion ? 0.2 : 0.5,
                    delay: isActive ? 0.3 : 0
                  }}
                >
                  {/* Flowing animation */}
                  {!prefersReducedMotion && (isCompleted || isActive) && (
                    <motion.div
                      className={styles.flowingLine}
                      style={{ '--flow-color': steps[index].color }}
                      animate={{
                        x: ['-100%', '200%']
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'linear'
                      }}
                    />
                  )}
                  <ArrowRight 
                    size={20} 
                    className={styles.connectorArrow}
                    style={{ color: steps[index].color }}
                  />
                </motion.div>
              )}
            </div>
          );
        })}
      </motion.div>

      {/* Enhanced progress indicator */}
      <div className={styles.progressBar} role="progressbar" aria-valuenow={activeStep + 1} aria-valuemin={1} aria-valuemax={steps.length}>
        <motion.div
          className={styles.progressFill}
          style={{ '--progress-color': steps[activeStep].color }}
          animate={{
            width: `${((activeStep + 1) / steps.length) * 100}%`
          }}
          transition={{ 
            duration: prefersReducedMotion ? 0.2 : 0.5,
            ease: 'easeInOut'
          }}
        />
        <div className={styles.progressSteps}>
          {steps.map((step, index) => (
            <div
              key={`progress-${step.id}`}
              className={`${styles.progressStep} ${
                index <= activeStep ? styles.completed : ''
              }`}
              style={{ '--step-color': step.color }}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

HeroWorkflow.displayName = 'HeroWorkflow';

export default HeroWorkflow;

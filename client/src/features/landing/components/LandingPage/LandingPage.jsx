import { useState, useEffect, useMemo, useCallback, memo, lazy, Suspense } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Zap, ArrowDown, Users, Building2, AlertCircle } from 'lucide-react';
import CTAButton from '../CTAButton/CTAButton';
import HeroWorkflow from '../HeroWorkflow/HeroWorkflow';
import HeroBenefits from '../HeroBenefits/HeroBenefits';
import SectionDivider from '../SectionDivider/SectionDivider';

// Lazy load heavy components
const Terminal = lazy(() => import('../Terminal/Terminal'));
const TrustScore = lazy(() => import('../TrustScore/TrustScore'));
const PortfolioPreview = lazy(() => import('../PortfolioPreview/PortfolioPreview'));
const FeatureHighlight = lazy(() => import('../FeatureHighlight/FeatureHighlight'));
const Testimonials = lazy(() => import('../Testimonials/Testimonials'));
const StatsSection = lazy(() => import('../StatsSection/StatsSection'));
const Footer = lazy(() => import('../Footer/Footer'));
import { fadeInUp, staggerContainer, scaleInUp, parallaxFade } from '../../../../utils/animations';
import useReducedMotion from '../../../../hooks/useReducedMotion';
import styles from './LandingPage.module.css';

const LandingPage = () => {
  const [currentScene, setCurrentScene] = useState(0);
  const [workflowStep, setWorkflowStep] = useState(0);
  const [trustScore, setTrustScore] = useState(87);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);
  const headerOpacity = useTransform(scrollYProgress, [0, 0.1], [0.8, 1]);
  const headerBlur = useTransform(scrollYProgress, [0, 0.1], [20, 30]);

  const scenes = useMemo(() => [
    { name: 'git-push', workflowStep: 0 },
    { name: 'ai-analysis', workflowStep: 1 },
    { name: 'docker-deploy', workflowStep: 2 },
    { name: 'ci-cd', workflowStep: 3 },
    { name: 'trust-score', workflowStep: 3, trustScore: 92 }
  ], []);

  useEffect(() => {
    if (isAutoPlaying && currentScene < scenes.length) {
      const scene = scenes[currentScene];
      
      // Update workflow step
      if (scene.workflowStep !== undefined) {
        setTimeout(() => {
          setWorkflowStep(scene.workflowStep);
        }, 1000);
      }

      // Update trust score
      if (scene.trustScore !== undefined) {
        setTimeout(() => {
          setTrustScore(scene.trustScore);
        }, 2000);
      }
    }
  }, [currentScene, isAutoPlaying, scenes.length]);

  const handleSceneComplete = useCallback(() => {
    if (currentScene < scenes.length - 1) {
      setTimeout(() => {
        setCurrentScene(currentScene + 1);
      }, 1500);
    } else {
      setIsAutoPlaying(false);
    }
  }, [currentScene, scenes.length]);

  const handleNextScene = useCallback(() => {
    if (currentScene < scenes.length - 1) {
      setCurrentScene(currentScene + 1);
    }
  }, [currentScene, scenes.length]);

  const handlePreviousScene = useCallback(() => {
    if (currentScene > 0) {
      setCurrentScene(currentScene - 1);
    }
  }, [currentScene]);

  const handleRestart = useCallback(() => {
    setCurrentScene(0);
    setWorkflowStep(0);
    setTrustScore(87);
    setIsAutoPlaying(true);
  }, []);

  return (
    <motion.div 
      className={styles.landingPage}
      style={{ opacity }}
    >
      {/* Animated background */}
      <div className={styles.landingBackground}>
        <div className={`${styles.gradientOrb} ${styles.orb1}`}></div>
        <div className={`${styles.gradientOrb} ${styles.orb2}`}></div>
        <div className={`${styles.gradientOrb} ${styles.orb3}`}></div>
      </div>

      {/* Floating particles */}
      <div className={styles.particles}>
        {useMemo(() => 
          [...Array(20)].map((_, i) => {
            // Generate random values once per particle
            const randomX = (i * 7.3) % 50 - 25; // Deterministic based on index
            const randomDuration = 3 + (i * 0.3) % 2;
            const randomDelay = (i * 0.5) % 2;
            
            return (
              <motion.div
                key={i}
                className={styles.particle}
                animate={prefersReducedMotion ? {} : {
                  y: [0, -100, 0],
                  x: [0, randomX, 0],
                  opacity: [0.3, 0.8, 0.3]
                }}
                transition={prefersReducedMotion ? {} : {
                  duration: randomDuration,
                  repeat: Infinity,
                  delay: randomDelay,
                  ease: [0.4, 0, 0.6, 1]
                }}
              />
            );
          }), [])
        }
      </div>

      <div className={styles.landingContainer}>
        {/* Header */}
        <motion.header
          className={styles.landingHeader}
          style={{
            opacity: headerOpacity,
            backdropFilter: `blur(${headerBlur}px)`,
            WebkitBackdropFilter: `blur(${headerBlur}px)`
          }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className={styles.headerLogo}>
            <Zap size={28} className={styles.logoIcon} />
            <span className={styles.logoText}>DevHubs</span>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.headerLink}>For Companies</button>
            <CTAButton text="Get Started" variant="secondary" to="/auth/student" />
          </div>
        </motion.header>

        {/* Main Content */}
        <div className={styles.landingContent}>
          {/* Hero Section */}
          <motion.section
            className={styles.heroSection}
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <div className={styles.heroContent}>
              <div className={styles.heroText}>
                <motion.div
                  className={styles.problemBadge}
                  variants={fadeInUp}
                >
                  <AlertCircle size={16} />
                  <span>Students learn theory, but companies need real DevOps skills</span>
                </motion.div>

                <motion.h1
                  className={styles.heroTitle}
                  variants={fadeInUp}
                >
                  Turn Your Code Into{' '}
                  <span className={styles.gradientText}>Your Resume</span>
                </motion.h1>

                <motion.p
                  className={styles.heroDescription}
                  variants={fadeInUp}
                >
                  Work on real DevOps projects, get AI-verified Trust Scores, and build a portfolio companies actually trust. No more resume guessing.
                </motion.p>

                <motion.div
                  className={styles.heroBenefits}
                  variants={fadeInUp}
                >
                  <HeroBenefits />
                </motion.div>

                <motion.div
                  className={styles.heroCTAs}
                  variants={fadeInUp}
                >
                  <CTAButton text="Start Building" variant="primary" to="/auth/student" />
                  <CTAButton text="See How It Works" variant="secondary" />
                </motion.div>

                <motion.div
                  className={styles.heroSocialProof}
                  variants={fadeInUp}
                >
                  <div className={styles.socialProofItem}>
                    <Users size={20} />
                    <span>2.5K+ Students Building Real Skills</span>
                  </div>
                  <div className={styles.socialProofItem}>
                    <Building2 size={20} />
                    <span>50+ Companies Hiring Verified Developers</span>
                  </div>
                </motion.div>
              </div>
            </div>

            <motion.div
              className={styles.scrollIndicator}
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <ArrowDown size={24} />
            </motion.div>
          </motion.section>

          <SectionDivider variant="thick" />

          {/* Workflow Section */}
          <motion.section
            className={styles.workflowSection}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            variants={parallaxFade}
          >
            <div className={styles.workflowSectionContainer}>
              <motion.div
                className={styles.workflowSectionHeader}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.15 }}
                variants={fadeInUp}
              >
                <h2 className={styles.workflowSectionTitle}>
                  How It <span className={styles.gradientText}>Works</span>
                </h2>
                <p className={styles.workflowSectionSubtitle}>
                  See how students transform their code into verified skills that companies trust
                </p>
              </motion.div>

              <motion.div
                className={styles.workflowSectionContent}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.15 }}
                variants={scaleInUp}
              >
                <HeroWorkflow />
              </motion.div>
            </div>
          </motion.section>

          <SectionDivider variant="default" />

          {/* Feature Highlights Section */}
          <Suspense fallback={<div style={{ minHeight: '400px' }} />}>
            <FeatureHighlight />
          </Suspense>

          <SectionDivider variant="thin" />

          {/* Terminal Section */}
          <motion.section
            className={styles.terminalSection}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            variants={scaleInUp}
          >
            <Suspense fallback={<div style={{ minHeight: '400px' }} />}>
              <Terminal 
                currentScene={currentScene} 
                onSceneComplete={handleSceneComplete}
              />
            </Suspense>
          </motion.section>

          <SectionDivider variant="thin" />

          {/* Trust Score Section */}
          <Suspense fallback={<div style={{ minHeight: '400px' }} />}>
            <TrustScore score={trustScore} animated={true} previousScore={82} />
          </Suspense>

          <SectionDivider variant="default" />

          {/* Portfolio Preview */}
          <motion.section
            className={styles.portfolioSection}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            variants={parallaxFade}
          >
            <Suspense fallback={<div style={{ minHeight: '400px' }} />}>
              <PortfolioPreview />
            </Suspense>
          </motion.section>

          <SectionDivider variant="default" />

          {/* Stats Section */}
          <Suspense fallback={<div style={{ minHeight: '300px' }} />}>
            <StatsSection />
          </Suspense>

          <SectionDivider variant="thin" />

          {/* Testimonials Section */}
          <Suspense fallback={<div style={{ minHeight: '400px' }} />}>
            <Testimonials />
          </Suspense>

          <SectionDivider variant="thick" />

          {/* CTA Section */}
          <motion.section
            className={styles.ctaSection}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            variants={scaleInUp}
          >
            <motion.h2
              className={styles.ctaTitle}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              Your Code Speaks for You
            </motion.h2>
            <motion.p
              className={styles.ctaDescription}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            >
              Build real pipelines, deploy real apps, earn your Trust Score.
              <br />
              Companies see proof, not promises.
            </motion.p>
            <motion.div
              className={styles.ctaButtons}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <CTAButton text="Start Building" variant="primary" to="/auth/student" />
              <CTAButton text="For Companies" variant="secondary" />
            </motion.div>
            <motion.p
              className={styles.ctaFooter}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.5, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              No credit card required • Free to start
            </motion.p>
          </motion.section>

          {/* Controls */}
          {!isAutoPlaying && (
            <motion.div
              className={styles.sceneControls}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <button
                onClick={handlePreviousScene}
                disabled={currentScene === 0}
                className={styles.controlButton}
              >
                Previous
              </button>
              <button onClick={handleRestart} className={styles.controlButton}>
                Restart
              </button>
              <button
                onClick={handleNextScene}
                disabled={currentScene >= scenes.length - 1}
                className={styles.controlButton}
              >
                Next
              </button>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <Suspense fallback={<div style={{ minHeight: '200px' }} />}>
          <Footer />
        </Suspense>
      </div>
    </motion.div>
  );
};

export default LandingPage;


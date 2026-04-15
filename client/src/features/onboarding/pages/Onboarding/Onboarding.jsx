import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Github, GitPullRequest, FolderKanban, CheckCircle2,
  ArrowRight, ExternalLink, Zap, Shield, Loader2
} from 'lucide-react';
import { useAuth } from '../../../../contexts/AuthContext';
import { useToast } from '../../../../contexts/ToastContext';
import { get } from '../../../../services/api';
import styles from './Onboarding.module.css';

const STEPS = [
  {
    id: 1,
    icon: Github,
    title: 'Install DevHubs GitHub App',
    subtitle: 'Allow DevHubs to review your pull requests automatically.',
    color: '#6366f1',
  },
  {
    id: 2,
    icon: GitPullRequest,
    title: 'Connect Your Repository',
    subtitle: 'We\'ll detect your PRs and run AI code reviews when you submit a project.',
    color: '#8b5cf6',
  },
  {
    id: 3,
    icon: FolderKanban,
    title: 'Pick Your First Project',
    subtitle: 'Start building and earning your verified Trust Score.',
    color: '#10b981',
  },
];

const StepDot = ({ step, currentStep }) => {
  const done = step < currentStep;
  const active = step === currentStep;
  return (
    <div className={`${styles.dot} ${active ? styles.dotActive : done ? styles.dotDone : ''}`}>
      {done ? <CheckCircle2 size={14} /> : <span>{step}</span>}
    </div>
  );
};

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [githubInstalled, setGithubInstalled] = useState(false);
  const [checking, setChecking] = useState(false);
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4000';
  const appInstallUrl = `https://github.com/apps/devhubs/installations/new`;

  const handleCheckInstallation = async () => {
    setChecking(true);
    try {
      const data = await get('/user/me');
      if (data.githubInstallId) {
        setGithubInstalled(true);
        toast.success('GitHub App installed successfully!');
        setTimeout(() => setStep(2), 800);
      } else {
        toast.warning('App not detected yet. Install it and click Check again.');
      }
    } catch {
      toast.error('Could not verify installation. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  const handleFinish = async () => {
    try {
      await refreshUser();
    } catch { /* ignore */ }
    navigate('/dashboard');
  };

  return (
    <div className={styles.page}>
      {/* Ambient */}
      <div className={styles.ambient} />

      {/* Nav */}
      <nav className={styles.nav}>
        <div className={styles.brand}><Zap size={22} /><span>DevHubs</span></div>
      </nav>

      <div className={styles.container}>
        {/* Progress bar */}
        <div className={styles.progressBar}>
          {STEPS.map((s, i) => (
            <div key={s.id} className={styles.progressStep}>
              <StepDot step={s.id} currentStep={step} />
              {i < STEPS.length - 1 && (
                <div className={`${styles.progressLine} ${step > s.id ? styles.progressLineDone : ''}`} />
              )}
            </div>
          ))}
        </div>

        <p className={styles.stepCounter}>Step {step} of {STEPS.length}</p>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              className={styles.card}
              initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
            >
              <div className={styles.stepIcon} style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                <Github size={36} />
              </div>
              <h1 className={styles.stepTitle}>Install DevHubs GitHub App</h1>
              <p className={styles.stepDesc}>
                DevHubs needs to read your pull requests to run AI code reviews. This is a one-time install — takes 30 seconds.
              </p>

              <div className={styles.infoList}>
                <div className={styles.infoItem}><Shield size={15} style={{ color: '#10b981' }} /><span>Read-only access to your repositories</span></div>
                <div className={styles.infoItem}><CheckCircle2 size={15} style={{ color: '#10b981' }} /><span>No write access, no code changes</span></div>
                <div className={styles.infoItem}><CheckCircle2 size={15} style={{ color: '#10b981' }} /><span>You control which repos to include</span></div>
              </div>

              <div className={styles.actions}>
                <a href={appInstallUrl} target="_blank" rel="noopener noreferrer" className={styles.primaryBtn}>
                  <Github size={18} />Install GitHub App<ExternalLink size={14} />
                </a>
                {githubInstalled ? (
                  <button className={styles.secondaryBtn} onClick={() => setStep(2)}>
                    Continue <ArrowRight size={16} />
                  </button>
                ) : (
                  <button className={styles.secondaryBtn} onClick={handleCheckInstallation} disabled={checking}>
                    {checking ? <Loader2 size={16} className={styles.spin} /> : <CheckCircle2 size={16} />}
                    {checking ? 'Checking...' : 'Check Installation'}
                  </button>
                )}
              </div>

              <button className={styles.skipLink} onClick={() => setStep(2)}>
                Skip for now — I'll do this later
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              className={styles.card}
              initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
            >
              <div className={styles.stepIcon} style={{ background: 'rgba(139,92,246,0.15)', color: '#c084fc' }}>
                <GitPullRequest size={36} />
              </div>
              <h1 className={styles.stepTitle}>How the Review Works</h1>
              <p className={styles.stepDesc}>
                When you submit a project, DevHubs automatically detects your PR and runs a 10-category AI review.
              </p>

              <div className={styles.flowSteps}>
                {[
                  { n: '1', label: 'You push code & open a PR on GitHub' },
                  { n: '2', label: 'Submit your project on DevHubs' },
                  { n: '3', label: 'AI reviews your PR (code quality, security, DevOps...)' },
                  { n: '4', label: 'You get a Trust Score + shareable portfolio' },
                ].map(({ n, label }) => (
                  <div key={n} className={styles.flowStep}>
                    <div className={styles.flowNum}>{n}</div>
                    <span>{label}</span>
                  </div>
                ))}
              </div>

              <div className={styles.actions}>
                <button className={styles.ghostBtn} onClick={() => setStep(1)}>Back</button>
                <button className={styles.primaryBtn} onClick={() => setStep(3)}>
                  Got it <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              className={styles.card}
              initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
            >
              <div className={styles.stepIcon} style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399' }}>
                <FolderKanban size={36} />
              </div>
              <h1 className={styles.stepTitle}>You're all set, {user?.name?.split(' ')[0] || user?.githubUsername || 'developer'}!</h1>
              <p className={styles.stepDesc}>
                Head to your dashboard, pick a project, and start building. Your first AI review is waiting.
              </p>

              <div className={styles.readyCard}>
                <CheckCircle2 size={20} style={{ color: '#10b981' }} />
                <div>
                  <p className={styles.readyTitle}>What's next</p>
                  <p className={styles.readyDesc}>Browse projects → Complete tasks → Submit → Get your Trust Score</p>
                </div>
              </div>

              <div className={styles.actions}>
                <button className={styles.ghostBtn} onClick={() => setStep(2)}>Back</button>
                <button className={styles.primaryBtn} style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }} onClick={handleFinish}>
                  Go to Dashboard <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

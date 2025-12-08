import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Code, GitBranch, Box, Zap, Terminal, GitCommit, Layers } from 'lucide-react';
import useReducedMotion from '../../../../hooks/useReducedMotion';
import styles from './FloatingDevOpsElements.module.css';

const FloatingDevOpsElements = memo(() => {
  const prefersReducedMotion = useReducedMotion();

  // Code snippets to display
  const codeSnippets = useMemo(() => [
    { text: 'git push', delay: 0 },
    { text: 'docker build', delay: 0.5 },
    { text: 'kubectl apply', delay: 1 },
    { text: 'npm run deploy', delay: 1.5 },
  ], []);

  // Terminal prompts
  const terminalPrompts = useMemo(() => [
    { text: '$ CI/CD', delay: 0.2 },
    { text: '$ DevOps', delay: 0.7 },
    { text: '$ Trust Score', delay: 1.2 },
  ], []);

  // Icon elements
  const iconElements = useMemo(() => [
    { Icon: GitBranch, delay: 0.3, size: 24 },
    { Icon: Box, delay: 0.8, size: 28 }, // Box represents containers/Docker
    { Icon: Zap, delay: 1.3, size: 22 },
    { Icon: Terminal, delay: 1.8, size: 26 },
    { Icon: GitCommit, delay: 2.2, size: 24 },
    { Icon: Layers, delay: 2.5, size: 24 }, // Layers represents infrastructure
  ], []);

  // Generate random positions
  const getRandomPosition = (index, total) => {
    const angle = (index / total) * Math.PI * 2;
    const radius = 30 + (index % 3) * 15;
    return {
      x: Math.cos(angle) * radius + '%',
      y: Math.sin(angle) * radius + '%',
    };
  };

  const floatingAnimation = prefersReducedMotion ? {} : {
    y: [0, -30, 0],
    opacity: [0.4, 0.6, 0.4],
    rotate: [0, 5, -5, 0]
  };

  return (
    <div className={styles.floatingContainer}>
      {/* Code Snippets */}
      {codeSnippets.map((snippet, index) => {
        const position = getRandomPosition(index, codeSnippets.length);
        return (
          <motion.div
            key={`code-${index}`}
            className={styles.codeSnippet}
            style={{
              left: `calc(50% + ${position.x})`,
              top: `calc(50% + ${position.y})`,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={prefersReducedMotion ? { opacity: 0.5 } : {
              ...floatingAnimation,
              opacity: [0.4, 0.6, 0.4],
            }}
            transition={{
              delay: snippet.delay,
              duration: 4 + (index % 2),
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            <Code size={14} className={styles.codeIcon} />
            <span className={styles.codeText}>{snippet.text}</span>
          </motion.div>
        );
      })}

      {/* Terminal Prompts */}
      {terminalPrompts.map((prompt, index) => {
        const position = getRandomPosition(index + codeSnippets.length, terminalPrompts.length);
        return (
          <motion.div
            key={`terminal-${index}`}
            className={styles.terminalPrompt}
            style={{
              left: `calc(50% + ${position.x})`,
              top: `calc(50% + ${position.y})`,
            }}
            initial={{ opacity: 0 }}
            animate={prefersReducedMotion ? { opacity: 0.2 } : {
              ...floatingAnimation,
              opacity: [0.12, 0.22, 0.12],
            }}
            transition={{
              delay: prompt.delay,
              duration: 5 + (index % 2),
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            <Terminal size={12} className={styles.terminalIcon} />
            <span className={styles.terminalText}>{prompt.text}</span>
          </motion.div>
        );
      })}

      {/* Icon Elements */}
      {iconElements.map((item, index) => {
        const position = getRandomPosition(index + codeSnippets.length + terminalPrompts.length, iconElements.length);
        const Icon = item.Icon;
        return (
          <motion.div
            key={`icon-${index}`}
            className={styles.iconElement}
            style={{
              left: `calc(50% + ${position.x})`,
              top: `calc(50% + ${position.y})`,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={prefersReducedMotion ? { opacity: 0.6 } : {
              ...floatingAnimation,
              opacity: [0.5, 0.7, 0.5],
              scale: [1, 1.1, 1],
            }}
            transition={{
              delay: item.delay,
              duration: 3 + (index % 3),
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            <Icon size={item.size} className={styles.iconSvg} />
          </motion.div>
        );
      })}
    </div>
  );
});

FloatingDevOpsElements.displayName = 'FloatingDevOpsElements';

export default FloatingDevOpsElements;

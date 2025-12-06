import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal as TerminalIcon, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import useReducedMotion from '../../../../hooks/useReducedMotion';
import styles from './Terminal.module.css';

const Terminal = ({ currentScene, onSceneComplete }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentCommand, setCurrentCommand] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [commandHistory, setCommandHistory] = useState([]);
  const [showGlitch, setShowGlitch] = useState(false);
  const [visibleOutputLines, setVisibleOutputLines] = useState([]);
  const prefersReducedMotion = useReducedMotion();
  const intervalRef = useRef(null);
  const outputIntervalRef = useRef(null);

  const { ref, inView } = useInView({
    threshold: 0.2,
    triggerOnce: true
  });

  const commands = useMemo(() => [
    {
      prompt: '$ git push origin feature/auth-system',
      output: [
        { text: 'Enumerating objects: 42, done.', type: 'info' },
        { text: 'Counting objects: 100% (42/42), done.', type: 'info' },
        { text: 'Delta compression using up to 8 threads', type: 'info' },
        { text: 'Compressing objects: 100% (25/25), done.', type: 'info' },
        { text: 'Writing objects: 100% (42/42), 5.2 KiB | 5.2 MiB/s, done.', type: 'info' },
        { text: 'Total 42 (delta 18), reused 0 (delta 0)', type: 'info' },
        { text: 'remote: Resolving deltas: 100% (18/18), completed.', type: 'info' },
        { text: '', type: 'empty' },
        { text: '✓ Pipeline triggered automatically', type: 'success', icon: 'check' }
      ],
      delay: 30,
      color: '#8b5cf6'
    },
    {
      prompt: '$ → Running AI Code Analysis...',
      output: [
        { text: 'Analyzing code quality...', type: 'loading', progress: 25 },
        { text: 'Checking Docker configuration...', type: 'loading', progress: 50 },
        { text: 'Validating CI/CD pipeline...', type: 'loading', progress: 75 },
        { text: 'Reviewing architecture patterns...', type: 'loading', progress: 90 },
        { text: '', type: 'empty' },
        { text: '✓ All checks passed!', type: 'success', icon: 'check' },
        { text: '✓ Code quality: Excellent', type: 'success', icon: 'check' },
        { text: '✓ Docker build: Success', type: 'success', icon: 'check' },
        { text: '✓ CI/CD pipeline: Valid', type: 'success', icon: 'check' }
      ],
      delay: 35,
      color: '#ec4899'
    },
    {
      prompt: '$ → Checking Docker deployment...',
      output: [
        { text: 'Building Docker image...', type: 'loading', progress: 30 },
        { text: 'Pushing to registry...', type: 'loading', progress: 60 },
        { text: 'Deploying to staging...', type: 'loading', progress: 85 },
        { text: 'Running health checks...', type: 'loading', progress: 95 },
        { text: '', type: 'empty' },
        { text: '✓ Deployment successful', type: 'success', icon: 'check' },
        { text: '✓ Health checks passed', type: 'success', icon: 'check' },
        { text: '✓ Application running on port 3000', type: 'success', icon: 'check' }
      ],
      delay: 40,
      color: '#10b981'
    },
    {
      prompt: '$ → Validating CI/CD pipeline...',
      output: [
        { text: 'Running unit tests...', type: 'loading', progress: 20 },
        { text: 'Running integration tests...', type: 'loading', progress: 50 },
        { text: 'Checking code coverage...', type: 'loading', progress: 75 },
        { text: 'Linting code...', type: 'loading', progress: 90 },
        { text: '', type: 'empty' },
        { text: '✓ All tests passed (42/42)', type: 'success', icon: 'check' },
        { text: '✓ Code coverage: 87%', type: 'success', icon: 'check' },
        { text: '✓ Linting: No issues found', type: 'success', icon: 'check' }
      ],
      delay: 35,
      color: '#6366f1'
    },
    {
      prompt: '$ → Trust Score updated',
      output: [
        { text: 'Previous score: 87', type: 'info' },
        { text: 'New score: 92', type: 'highlight', highlight: true },
        { text: '', type: 'empty' },
        { text: 'Improvements detected:', type: 'info' },
        { text: '  • Better error handling', type: 'success', icon: 'bullet' },
        { text: '  • Improved documentation', type: 'success', icon: 'bullet' },
        { text: '  • Optimized Docker configuration', type: 'success', icon: 'bullet' },
        { text: '', type: 'empty' },
        { text: '✓ Trust Score: 92/100', type: 'success', icon: 'check', highlight: true },
        { text: '✓ Badge: GREEN', type: 'success', icon: 'check', highlight: true }
      ],
      delay: 45,
      color: '#10b981'
    }
  ], []);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (outputIntervalRef.current) clearInterval(outputIntervalRef.current);
    };
  }, []);

  // Glitch effect trigger
  useEffect(() => {
    if (prefersReducedMotion) return;
    
    const glitchInterval = setInterval(() => {
      setShowGlitch(true);
      setTimeout(() => setShowGlitch(false), 150);
    }, 8000);

    return () => clearInterval(glitchInterval);
  }, [prefersReducedMotion]);

  const renderOutputLine = useCallback((line, index) => {
    // Safety check: ensure line exists and has required properties
    if (!line || !line.type) {
      return null;
    }

    if (line.type === 'empty') {
      return <div key={index} className={styles.emptyLine}></div>;
    }

    const lineClasses = [
      styles.outputLine,
      styles[line.type],
      line.highlight ? styles.highlight : ''
    ].filter(Boolean).join(' ');

    return (
      <div key={index} className={lineClasses}>
        {line.icon === 'check' && (
          <CheckCircle2 size={14} className={styles.inlineIcon} />
        )}
        {line.icon === 'bullet' && (
          <span className={styles.bullet}>•</span>
        )}
        {line.type === 'loading' && (
          <Loader2 size={14} className={styles.spinningIcon} />
        )}
        <span className={styles.lineText}>{line.text || ''}</span>
        {line.progress && (
          <div className={styles.progressBar}>
            <motion.div
              className={styles.progressFill}
              initial={{ width: 0 }}
              animate={{ width: `${line.progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        )}
      </div>
    );
  }, []);

  useEffect(() => {
    if (currentScene < commands.length && inView) {
      const command = commands[currentScene];
      setDisplayedText('');
      setIsTyping(true);
      setCurrentCommand(currentScene);
      setVisibleOutputLines([]);
      setCommandHistory(prev => [...prev, command.prompt]);

      // Clear any existing intervals
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (outputIntervalRef.current) clearInterval(outputIntervalRef.current);

      // Type the prompt
      let promptIndex = 0;
      intervalRef.current = setInterval(() => {
        if (promptIndex < command.prompt.length) {
          setDisplayedText(command.prompt.substring(0, promptIndex + 1));
          promptIndex++;
        } else {
          clearInterval(intervalRef.current);
          // Wait a bit, then show output
          setTimeout(() => {
            let currentLine = 0;
            let lineIndex = 0;
            let outputLines = [];

            outputIntervalRef.current = setInterval(() => {
              if (currentLine < command.output.length) {
                const line = command.output[currentLine];
                
                // Safety check: ensure line exists
                if (!line || !line.type) {
                  currentLine++;
                  lineIndex = 0;
                  return;
                }
                
                const textLength = line.text ? line.text.length : 0;
                if (lineIndex < textLength) {
                  const newLine = {
                    ...line,
                    text: line.text.substring(0, lineIndex + 1)
                  };
                  // Update the specific line in the array
                  const updatedLines = [...outputLines];
                  updatedLines[currentLine] = newLine;
                  outputLines = updatedLines;
                  setVisibleOutputLines(outputLines);
                  lineIndex++;
                } else {
                  // Line is complete, ensure it's in the array, then move to next
                  const updatedLines = [...outputLines];
                  updatedLines[currentLine] = line; // Store complete line
                  outputLines = updatedLines;
                  setVisibleOutputLines(outputLines);
                  
                  currentLine++;
                  lineIndex = 0;
                  if (currentLine >= command.output.length) {
                    clearInterval(outputIntervalRef.current);
                    setIsTyping(false);
                    setTimeout(() => {
                      if (onSceneComplete) onSceneComplete();
                    }, 1200);
                  }
                }
              }
            }, command.delay);
          }, 600);
        }
      }, prefersReducedMotion ? 10 : 20);
    }
  }, [currentScene, commands, inView, onSceneComplete, prefersReducedMotion]);

  const currentCommandData = commands[currentCommand] || commands[0];

  return (
    <motion.div
      ref={ref}
      className={styles.terminalContainer}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div 
        className={`${styles.terminalWindow} ${showGlitch ? styles.glitch : ''}`}
        style={{ '--terminal-color': currentCommandData?.color || '#8b5cf6' }}
      >
        {/* Scanline effect */}
        {!prefersReducedMotion && (
          <div className={styles.scanlines}></div>
        )}

        {/* Terminal header */}
        <div className={styles.terminalHeader}>
          <div className={styles.terminalControls}>
            <span className={`${styles.control} ${styles.controlClose}`}></span>
            <span className={`${styles.control} ${styles.controlMinimize}`}></span>
            <span className={`${styles.control} ${styles.controlMaximize}`}></span>
          </div>
          <div className={styles.terminalTitle}>
            <TerminalIcon size={14} className={styles.titleIcon} />
            <span>devhubs-terminal</span>
            {!prefersReducedMotion && (
              <motion.span
                className={styles.statusIndicator}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </div>
        </div>

        {/* Terminal body */}
        <div className={styles.terminalBody}>
          {/* Command history */}
          {commandHistory.length > 1 && (
            <div className={styles.commandHistory}>
              {commandHistory.slice(0, -1).map((cmd, idx) => (
                <div key={idx} className={styles.historyLine}>
                  <span className={styles.prompt}>$</span>
                  <span className={styles.historyCommand}>{cmd}</span>
                </div>
              ))}
            </div>
          )}

          {/* Current command output */}
          <div className={styles.terminalContent}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentCommand}
                className={styles.outputContainer}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.3 }}
              >
                {/* Prompt line */}
                <div className={styles.promptLine}>
                  <span className={styles.prompt}>$</span>
                  <span className={styles.promptText}>{currentCommandData?.prompt || ''}</span>
                  {isTyping && (
                    <motion.span
                      className={styles.cursor}
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      ▊
                    </motion.span>
                  )}
                </div>

                {/* Output lines */}
                {visibleOutputLines.length > 0 && (
                  <div className={styles.outputLines}>
                    {visibleOutputLines
                      .filter(line => line !== undefined && line !== null)
                      .map((line, index) => renderOutputLine(line, index))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Terminal footer with stats */}
          {!isTyping && currentCommandData && (
            <motion.div
              className={styles.terminalFooter}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className={styles.footerStats}>
                <span className={styles.statItem}>
                  <Sparkles size={12} />
                  <span>AI Analysis Complete</span>
                </span>
                <span className={styles.statItem}>
                  <CheckCircle2 size={12} />
                  <span>All Systems Operational</span>
                </span>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Terminal;

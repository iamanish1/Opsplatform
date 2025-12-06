import { useEffect, useRef, memo, useState } from 'react';
import { useInView } from 'react-intersection-observer';

const AnimatedCounter = memo(({ value, duration = 2, suffix = '', prefix = '' }) => {
  const [ref, inView] = useInView({ once: true, threshold: 0.2 });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;

    let startTime = null;
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.round(value * easeOutQuart);
      
      setCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(value);
      }
    };

    requestAnimationFrame(animate);
  }, [inView, value, duration]);

  return <span ref={ref}>{prefix}{count}{suffix}</span>;
});

AnimatedCounter.displayName = 'AnimatedCounter';

export default AnimatedCounter;


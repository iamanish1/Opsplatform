import { useState, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Quote, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { fadeInUp } from '../../../../utils/animations';
import styles from './Testimonials.module.css';

const Testimonials = memo(() => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const testimonials = useMemo(() => [
    {
      name: 'Sarah Chen',
      role: 'DevOps Engineer at TechCorp',
      content: 'DevHubs gave me the real-world experience I needed. After building 5 projects and getting a Trust Score of 94, I landed my dream job. Companies trust the portfolio because it shows actual work, not just certificates.',
      rating: 5,
      image: 'SC'
    },
    {
      name: 'Marcus Rodriguez',
      role: 'Senior Developer',
      content: 'The AI verification is incredible. It caught issues I didn\'t even know about and helped me improve. My Trust Score went from 72 to 89 in just 3 months of consistent work.',
      rating: 5,
      image: 'MR'
    },
    {
      name: 'Emily Johnson',
      role: 'Hiring Manager at CloudScale',
      content: 'We\'ve hired 3 developers from DevHubs. Their portfolios show real deployments, real code, and real problem-solving. It\'s so much better than reading resumes that all say the same thing.',
      rating: 5,
      image: 'EJ'
    }
  ], []);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section className={styles.testimonialsSection}>
      <div className={styles.testimonialsContainer}>
        <motion.div
          className={styles.testimonialsHeader}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={fadeInUp}
        >
          <h2 className={styles.testimonialsTitle}>
            Trusted by{' '}
            <span className={styles.gradientText}>Developers & Companies</span>
          </h2>
          <p className={styles.testimonialsSubtitle}>
            See what students and hiring managers are saying about DevHubs.
          </p>
        </motion.div>

        <div className={styles.testimonialsCarousel}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              className={styles.testimonialCard}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className={styles.quoteIcon}>
                <Quote size={32} />
              </div>
              <p className={styles.testimonialContent}>
                {testimonials[currentIndex].content}
              </p>
              <div className={styles.testimonialRating}>
                {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                  <Star key={i} size={20} fill="#f59e0b" color="#f59e0b" />
                ))}
              </div>
              <div className={styles.testimonialAuthor}>
                <div className={styles.authorAvatar}>
                  {testimonials[currentIndex].image}
                </div>
                <div className={styles.authorInfo}>
                  <div className={styles.authorName}>{testimonials[currentIndex].name}</div>
                  <div className={styles.authorRole}>{testimonials[currentIndex].role}</div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className={styles.carouselControls}>
            <button
              className={styles.carouselButton}
              onClick={prevTestimonial}
              aria-label="Previous testimonial"
            >
              <ChevronLeft size={24} />
            </button>
            <div className={styles.carouselIndicators}>
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  className={`${styles.indicator} ${index === currentIndex ? styles.active : ''}`}
                  onClick={() => setCurrentIndex(index)}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
            <button
              className={styles.carouselButton}
              onClick={nextTestimonial}
              aria-label="Next testimonial"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
});

Testimonials.displayName = 'Testimonials';

export default Testimonials;


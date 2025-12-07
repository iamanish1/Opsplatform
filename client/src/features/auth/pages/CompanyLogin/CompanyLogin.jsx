import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Github, UserPlus } from 'lucide-react';
import AuthLayout from '../../components/AuthLayout/AuthLayout';
import AuthForm from '../../components/AuthForm/AuthForm';
import { fadeInUp, staggerContainer } from '../../../../utils/animations';
import styles from './CompanyLogin.module.css';

const CompanyLogin = memo(() => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const fields = [
    {
      name: 'email',
      type: 'email',
      label: 'Email Address',
      placeholder: 'company@example.com',
      required: true,
    },
    {
      name: 'password',
      type: 'password',
      label: 'Password',
      placeholder: 'Enter your password',
      required: true,
    },
  ];

  const handleSubmit = async (formData) => {
    setLoading(true);
    setErrors({});

    // Client-side validation
    const validationErrors = {};
    
    if (!formData.email) {
      validationErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      validationErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      validationErrors.password = 'Password is required';
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setLoading(false);
      return;
    }

    // Placeholder for API call
    // In production: await fetch('/api/company/login', { ... })
    console.log('Login attempt:', formData);
    
    setTimeout(() => {
      setLoading(false);
      // Simulate error for demo
      // setErrors({ email: 'Invalid email or password' });
    }, 1500);
  };

  return (
    <AuthLayout>
      <motion.div
        className={styles.companyLoginCard}
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.div className={styles.cardHeader} variants={fadeInUp}>
          <div className={styles.iconWrapper}>
            <Mail size={28} />
          </div>
          <h1 className={styles.cardTitle}>
            Company <span className={styles.gradientText}>Login</span>
          </h1>
          <p className={styles.cardDescription}>
            Sign in to access your company dashboard and talent feed.
          </p>
        </motion.div>

        <motion.div className={styles.cardContent} variants={fadeInUp}>
          <AuthForm
            fields={fields}
            onSubmit={handleSubmit}
            submitText="Sign In"
            loading={loading}
            errors={errors}
          />
        </motion.div>

        <motion.div className={styles.cardFooter} variants={fadeInUp}>
          <div className={styles.footerLinks}>
            <Link to="/auth/company/signup" className={styles.link}>
              <UserPlus size={16} />
              <span>Create an account</span>
            </Link>
            <Link to="/auth/student" className={styles.link}>
              <Github size={16} />
              <span>Student Login</span>
            </Link>
          </div>

          <Link to="/" className={styles.backLink}>
            <ArrowLeft size={16} />
            <span>Back to Home</span>
          </Link>
        </motion.div>
      </motion.div>
    </AuthLayout>
  );
});

CompanyLogin.displayName = 'CompanyLogin';

export default CompanyLogin;

import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, GitBranch, UserPlus, Users, Clock, DollarSign } from 'lucide-react';
import AuthLayout from '../../components/AuthLayout/AuthLayout';
import AuthForm from '../../components/AuthForm/AuthForm';
import { fadeInUp, staggerContainer } from '../../../../utils/animations';
import { companyLogin } from '../../../../services/companyApi';
import { useAuth } from '../../../../contexts/AuthContext';
import { useToast } from '../../../../contexts/ToastContext';
import styles from './CompanyLogin.module.css';

const CompanyLogin = memo(() => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { login } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const fields = [
    { name: 'email', type: 'email', label: 'Email Address', placeholder: 'company@example.com', required: true },
    { name: 'password', type: 'password', label: 'Password', placeholder: 'Enter your password', required: true },
  ];

  const handleSubmit = async (formData) => {
    setLoading(true);
    setErrors({});

    const validationErrors = {};
    if (!formData.email) validationErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) validationErrors.email = 'Please enter a valid email';
    if (!formData.password) validationErrors.password = 'Password is required';

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setLoading(false);
      return;
    }

    try {
      const data = await companyLogin(formData.email, formData.password);
      login(data.token, data.user);
      success('Welcome back!', 'Login successful');
      navigate('/company/dashboard');
    } catch (err) {
      toastError(err.message || 'Login failed. Please try again.');
      setErrors({ email: ' ', password: 'Invalid email or password' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <motion.div className={styles.companyLoginCard} variants={staggerContainer} initial="hidden" animate="visible">
        <motion.div className={styles.cardHeader} variants={fadeInUp}>
          <motion.div className={styles.iconWrapper} whileHover={{ scale: 1.1 }} transition={{ duration: 0.3 }}>
            <Mail size={28} />
          </motion.div>
          <h1 className={styles.cardTitle}>
            Company <span className={styles.gradientText}>Login</span>
          </h1>
          <p className={styles.cardDescription}>
            Access verified DevOps talent. Skip OA rounds, reduce hiring costs, and hire industry-ready developers.
          </p>
        </motion.div>

        <motion.div className={styles.cardContent} variants={fadeInUp}>
          <AuthForm fields={fields} onSubmit={handleSubmit} submitText="Sign In" loading={loading} errors={errors} />
        </motion.div>

        <motion.div className={styles.valueProps} variants={fadeInUp} initial="hidden" animate="visible" transition={{ delay: 0.3 }}>
          <div className={styles.valuePropItem}>
            <Users size={18} className={styles.valuePropIcon} />
            <div className={styles.valuePropContent}>
              <span className={styles.valuePropNumber}>2.5K+</span>
              <span className={styles.valuePropLabel}>Verified Developers</span>
            </div>
          </div>
          <div className={styles.valuePropDivider} />
          <div className={styles.valuePropItem}>
            <Clock size={18} className={styles.valuePropIcon} />
            <div className={styles.valuePropContent}>
              <span className={styles.valuePropNumber}>70%</span>
              <span className={styles.valuePropLabel}>Time Saved</span>
            </div>
          </div>
          <div className={styles.valuePropDivider} />
          <div className={styles.valuePropItem}>
            <DollarSign size={18} className={styles.valuePropIcon} />
            <div className={styles.valuePropContent}>
              <span className={styles.valuePropNumber}>50%</span>
              <span className={styles.valuePropLabel}>Cost Reduced</span>
            </div>
          </div>
        </motion.div>

        <motion.div className={styles.cardFooter} variants={fadeInUp}>
          <div className={styles.footerLinks}>
            <Link to="/auth/company/signup" className={styles.link}>
              <UserPlus size={16} /><span>Create an account</span>
            </Link>
            <Link to="/auth/student" className={styles.link}>
              <GitBranch size={16} /><span>Student Login</span>
            </Link>
          </div>
          <Link to="/" className={styles.backLink}>
            <ArrowLeft size={16} /><span>Back to Home</span>
          </Link>
        </motion.div>
      </motion.div>
    </AuthLayout>
  );
});

CompanyLogin.displayName = 'CompanyLogin';
export default CompanyLogin;

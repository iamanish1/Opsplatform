import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Building2, ArrowLeft, Github, LogIn, CheckCircle2, XCircle, Eye, EyeOff, AlertCircle, Users, Clock, DollarSign, Target } from 'lucide-react';
import AuthLayout from '../../components/AuthLayout/AuthLayout';
import { fadeInUp, staggerContainer } from '../../../../utils/animations';
import styles from './CompanySignup.module.css';

const CompanySignup = memo(() => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
  });
  const [formData, setFormData] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validatePassword = (password) => {
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
    };
  };

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'password') {
      setPasswordStrength(validatePassword(value));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    // Client-side validation
    const validationErrors = {};
    
    if (!formData.companyName) {
      validationErrors.companyName = 'Company name is required';
    } else if (formData.companyName.length < 3) {
      validationErrors.companyName = 'Company name must be at least 3 characters';
    }

    if (!formData.email) {
      validationErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      validationErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      validationErrors.password = 'Password is required';
    } else {
      const strength = validatePassword(formData.password);
      if (!strength.length || !strength.uppercase || !strength.lowercase || !strength.number) {
        validationErrors.password = 'Password does not meet requirements';
      }
    }

    if (!formData.confirmPassword) {
      validationErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      validationErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setLoading(false);
      return;
    }

    // Placeholder for API call
    // In production: await fetch('/api/company/signup', { ... })
    console.log('Signup attempt:', formData);
    
    setTimeout(() => {
      setLoading(false);
      // Simulate success - in production, redirect to dashboard
    }, 1500);
  };

  const painPoints = [
    { icon: Users, text: 'Industry-Ready Talent', solved: true },
    { icon: DollarSign, text: 'Reduce Hiring Costs', solved: true },
    { icon: Clock, text: 'Save Time on Interviews', solved: true },
    { icon: Target, text: 'Skip OA Rounds', solved: true },
  ];

  return (
    <AuthLayout>
      <motion.div
        className={styles.companySignupCard}
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.div className={styles.cardHeader} variants={fadeInUp}>
          <motion.div 
            className={styles.iconWrapper}
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.3 }}
          >
            <Building2 size={28} />
          </motion.div>
          <h1 className={styles.cardTitle}>
            Company <span className={styles.gradientText}>Sign Up</span>
          </h1>
          <p className={styles.cardDescription}>
            Join leading companies hiring verified DevOps talent. Access pre-vetted developers with Trust Scores.
          </p>
        </motion.div>

        {/* Pain Points Solutions */}
        <motion.div 
          className={styles.painPointsGrid}
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {painPoints.map((point, index) => {
            const Icon = point.icon;
            return (
              <motion.div
                key={index}
                className={styles.painPointCard}
                variants={fadeInUp}
                whileHover={{ y: -2, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div className={styles.painPointIcon}>
                  <Icon size={18} />
                </div>
                <span className={styles.painPointText}>{point.text}</span>
                {point.solved && (
                  <CheckCircle2 size={14} className={styles.solvedIcon} />
                )}
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div className={styles.cardContent} variants={fadeInUp}>
          <PasswordRequirements passwordStrength={passwordStrength} />
          
          <form className={styles.authForm} onSubmit={handleSubmit}>
            <div className={styles.formFields}>
              <div className={styles.formField}>
                <label htmlFor="companyName" className={styles.formLabel}>
                  Company Name
                  <span className={styles.required}>*</span>
                </label>
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  placeholder="Your Company Inc."
                  required
                  value={formData.companyName || ''}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                  className={`${styles.formInput} ${errors.companyName ? styles.formInputError : ''}`}
                />
                {errors.companyName && (
                  <motion.div
                    className={styles.errorMessage}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <AlertCircle size={16} />
                    <span>{errors.companyName}</span>
                  </motion.div>
                )}
              </div>

              <div className={styles.formField}>
                <label htmlFor="email" className={styles.formLabel}>
                  Email Address
                  <span className={styles.required}>*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="company@example.com"
                  required
                  value={formData.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={`${styles.formInput} ${errors.email ? styles.formInputError : ''}`}
                />
                {errors.email && (
                  <motion.div
                    className={styles.errorMessage}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <AlertCircle size={16} />
                    <span>{errors.email}</span>
                  </motion.div>
                )}
              </div>

              <div className={styles.formField}>
                <label htmlFor="password" className={styles.formLabel}>
                  Password
                  <span className={styles.required}>*</span>
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    required
                    value={formData.password || ''}
                    onChange={(e) => handleChange('password', e.target.value)}
                    className={`${styles.formInput} ${errors.password ? styles.formInputError : ''}`}
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && (
                  <motion.div
                    className={styles.errorMessage}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <AlertCircle size={16} />
                    <span>{errors.password}</span>
                  </motion.div>
                )}
              </div>

              <div className={styles.formField}>
                <label htmlFor="confirmPassword" className={styles.formLabel}>
                  Confirm Password
                  <span className={styles.required}>*</span>
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    required
                    value={formData.confirmPassword || ''}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    className={`${styles.formInput} ${errors.confirmPassword ? styles.formInputError : ''}`}
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <motion.div
                    className={styles.errorMessage}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <AlertCircle size={16} />
                    <span>{errors.confirmPassword}</span>
                  </motion.div>
                )}
              </div>
            </div>
            
            <motion.button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
              whileHover={!loading ? { scale: 1.02, y: -2 } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
            >
              {loading ? (
                <>
                  <motion.div
                    className={styles.loadingSpinner}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  <span>Processing...</span>
                </>
              ) : (
                'Create Account'
              )}
            </motion.button>
          </form>
        </motion.div>

        <motion.div className={styles.cardFooter} variants={fadeInUp}>
          <div className={styles.footerLinks}>
            <Link to="/auth/company/login" className={styles.link}>
              <LogIn size={16} />
              <span>Already have an account?</span>
            </Link>
            <Link to="/auth/student" className={styles.link}>
              <Github size={16} />
              <span>Student Sign Up</span>
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

const PasswordRequirements = memo(({ passwordStrength }) => {
  const requirements = [
    { key: 'length', label: 'At least 8 characters', met: passwordStrength.length },
    { key: 'uppercase', label: 'One uppercase letter', met: passwordStrength.uppercase },
    { key: 'lowercase', label: 'One lowercase letter', met: passwordStrength.lowercase },
    { key: 'number', label: 'One number', met: passwordStrength.number },
  ];

  return (
    <div className={styles.passwordRequirements}>
      <h4 className={styles.requirementsTitle}>Password Requirements:</h4>
      <ul className={styles.requirementsList}>
        {requirements.map((req) => (
          <li key={req.key} className={req.met ? styles.requirementMet : styles.requirementUnmet}>
            {req.met ? (
              <CheckCircle2 size={16} className={styles.checkIcon} />
            ) : (
              <XCircle size={16} className={styles.xIcon} />
            )}
            <span>{req.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
});

PasswordRequirements.displayName = 'PasswordRequirements';

CompanySignup.displayName = 'CompanySignup';

export default CompanySignup;

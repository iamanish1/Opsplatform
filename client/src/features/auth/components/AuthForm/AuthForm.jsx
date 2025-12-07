import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import styles from './AuthForm.module.css';

const AuthForm = memo(({ 
  fields = [], 
  onSubmit, 
  submitText = 'Submit',
  loading = false,
  errors = {},
  showPasswordToggle = true
}) => {
  const [formData, setFormData] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(formData);
    }
  };

  const getFieldError = (name) => {
    return fieldErrors[name] || errors[name] || null;
  };

  const renderField = (field) => {
    const {
      name,
      type = 'text',
      label,
      placeholder,
      required = false,
      validation,
      ...fieldProps
    } = field;

    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;
    const error = getFieldError(name);

    return (
      <div key={name} className={styles.formField}>
        {label && (
          <label htmlFor={name} className={styles.formLabel}>
            {label}
            {required && <span className={styles.required}>*</span>}
          </label>
        )}
        <div className={styles.inputWrapper}>
          <input
            id={name}
            name={name}
            type={inputType}
            placeholder={placeholder}
            required={required}
            value={formData[name] || ''}
            onChange={(e) => handleChange(name, e.target.value)}
            className={`${styles.formInput} ${error ? styles.formInputError : ''}`}
            {...fieldProps}
          />
          {isPassword && showPasswordToggle && (
            <button
              type="button"
              className={styles.passwordToggle}
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          )}
        </div>
        {error && (
          <motion.div
            className={styles.errorMessage}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </motion.div>
        )}
      </div>
    );
  };

  return (
    <form className={styles.authForm} onSubmit={handleSubmit}>
      <div className={styles.formFields}>
        {fields.map(renderField)}
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
          submitText
        )}
      </motion.button>
    </form>
  );
});

AuthForm.displayName = 'AuthForm';

export default AuthForm;

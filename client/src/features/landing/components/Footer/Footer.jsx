import { memo } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Github, 
  Twitter, 
  Linkedin, 
  Mail, 
  ArrowRight,
  Code2,
  Building2,
  BookOpen,
  Shield,
  FileText,
  HelpCircle
} from 'lucide-react';
import { fadeInUp } from '../../../../utils/animations';
import styles from './Footer.module.css';

const Footer = memo(() => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    students: [
      { label: 'Get Started', href: '#', icon: ArrowRight },
      { label: 'Projects', href: '#', icon: Code2 },
      { label: 'Portfolio', href: '#', icon: BookOpen },
      { label: 'Trust Score', href: '#', icon: Shield }
    ],
    companies: [
      { label: 'For Companies', href: '#', icon: Building2 },
      { label: 'Find Talent', href: '#', icon: ArrowRight },
      { label: 'Hiring Partners', href: '#', icon: Building2 },
      { label: 'Contact Sales', href: '#', icon: Mail }
    ],
    resources: [
      { label: 'Documentation', href: '#', icon: BookOpen },
      { label: 'Blog', href: '#', icon: FileText },
      { label: 'Help Center', href: '#', icon: HelpCircle },
      { label: 'Community', href: '#', icon: Github }
    ],
    legal: [
      { label: 'Privacy Policy', href: '#', icon: Shield },
      { label: 'Terms of Service', href: '#', icon: FileText },
      { label: 'Cookie Policy', href: '#', icon: Shield }
    ]
  };

  const socialLinks = [
    { icon: Github, href: '#', label: 'GitHub' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Mail, href: '#', label: 'Email' }
  ];

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        {/* Main Footer Content */}
        <div className={styles.footerContent}>
          {/* Company Branding */}
          <motion.div
            className={styles.footerBrand}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={fadeInUp}
          >
            <div className={styles.brandLogo}>
              <Zap size={32} className={styles.logoIcon} />
              <span className={styles.brandName}>DevHubs</span>
            </div>
            <p className={styles.brandTagline}>
              Turn your code into your resume. Build real DevOps skills, 
              earn verified Trust Scores, and get hired by top companies.
            </p>
            <div className={styles.socialLinks}>
              {socialLinks.map((social, index) => {
                const Icon = social.icon;
                return (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    className={styles.socialLink}
                    aria-label={social.label}
                    whileHover={{ y: -3, scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                  >
                    <Icon size={20} />
                  </motion.a>
                );
              })}
            </div>
          </motion.div>

          {/* Navigation Links */}
          <div className={styles.footerLinks}>
            {/* For Students */}
            <motion.div
              className={styles.linkColumn}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={fadeInUp}
            >
              <h3 className={styles.linkColumnTitle}>For Students</h3>
              <ul className={styles.linkList}>
                {footerLinks.students.map((link, index) => {
                  const Icon = link.icon;
                  return (
                    <li key={link.label}>
                      <motion.a
                        href={link.href}
                        className={styles.footerLink}
                        whileHover={{ x: 4 }}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.05, duration: 0.3 }}
                      >
                        <Icon size={16} />
                        <span>{link.label}</span>
                      </motion.a>
                    </li>
                  );
                })}
              </ul>
            </motion.div>

            {/* For Companies */}
            <motion.div
              className={styles.linkColumn}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={fadeInUp}
            >
              <h3 className={styles.linkColumnTitle}>For Companies</h3>
              <ul className={styles.linkList}>
                {footerLinks.companies.map((link, index) => {
                  const Icon = link.icon;
                  return (
                    <li key={link.label}>
                      <motion.a
                        href={link.href}
                        className={styles.footerLink}
                        whileHover={{ x: 4 }}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.05, duration: 0.3 }}
                      >
                        <Icon size={16} />
                        <span>{link.label}</span>
                      </motion.a>
                    </li>
                  );
                })}
              </ul>
            </motion.div>

            {/* Resources */}
            <motion.div
              className={styles.linkColumn}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={fadeInUp}
            >
              <h3 className={styles.linkColumnTitle}>Resources</h3>
              <ul className={styles.linkList}>
                {footerLinks.resources.map((link, index) => {
                  const Icon = link.icon;
                  return (
                    <li key={link.label}>
                      <motion.a
                        href={link.href}
                        className={styles.footerLink}
                        whileHover={{ x: 4 }}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.05, duration: 0.3 }}
                      >
                        <Icon size={16} />
                        <span>{link.label}</span>
                      </motion.a>
                    </li>
                  );
                })}
              </ul>
            </motion.div>

            {/* Legal */}
            <motion.div
              className={styles.linkColumn}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={fadeInUp}
            >
              <h3 className={styles.linkColumnTitle}>Legal</h3>
              <ul className={styles.linkList}>
                {footerLinks.legal.map((link, index) => {
                  const Icon = link.icon;
                  return (
                    <li key={link.label}>
                      <motion.a
                        href={link.href}
                        className={styles.footerLink}
                        whileHover={{ x: 4 }}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.05, duration: 0.3 }}
                      >
                        <Icon size={16} />
                        <span>{link.label}</span>
                      </motion.a>
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          </div>
        </div>

        {/* Footer Bottom */}
        <motion.div
          className={styles.footerBottom}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className={styles.footerDivider} />
          <div className={styles.footerBottomContent}>
            <p className={styles.copyright}>
              © {currentYear} DevHubs. All rights reserved.
            </p>
            <p className={styles.footerNote}>
              Built with ❤️ for developers building real DevOps skills
            </p>
          </div>
        </motion.div>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';

export default Footer;


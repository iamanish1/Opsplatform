import { memo, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Building2, Globe, MapPin, Users, Briefcase, Save, Loader2, Edit3, Check } from 'lucide-react';
import CompanyLayout from '../../components/CompanyLayout/CompanyLayout';
import { getCompanyProfile, updateCompanyProfile } from '../../../../services/companyApi';
import { useToast } from '../../../../contexts/ToastContext';
import styles from './CompanyProfile.module.css';

const INDUSTRY_OPTIONS = [
  'Technology', 'Finance', 'Healthcare', 'E-Commerce', 'Education',
  'Media', 'Consulting', 'Gaming', 'Cybersecurity', 'Other',
];

const TEAM_SIZE_OPTIONS = [
  '1-10', '11-50', '51-200', '201-500', '500+',
];

const CompanyProfile = memo(() => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    companyName: '',
    website: '',
    logo: '',
    about: '',
    industry: '',
    location: '',
    teamSize: '',
    hiringNeeds: '',
  });

  const loadProfile = useCallback(async () => {
    try {
      const data = await getCompanyProfile();
      const c = data.company || {};
      setForm({
        companyName: c.companyName || '',
        website: c.website || '',
        logo: c.logo || '',
        about: c.about || '',
        industry: c.industry || '',
        location: c.location || '',
        teamSize: c.teamSize || '',
        hiringNeeds: c.hiringNeeds || '',
      });
    } catch {
      toast.error('Failed to load company profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateCompanyProfile(form);
      toast.success('Profile updated successfully');
      setEditing(false);
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <CompanyLayout title="Company Profile">
        <div className={styles.loadingState}>
          <Loader2 size={36} className={styles.spin} />
          <p>Loading profile...</p>
        </div>
      </CompanyLayout>
    );
  }

  return (
    <CompanyLayout title="Company Profile">
      <div className={styles.page}>
        <div className={styles.topRow}>
          <h1 className={styles.pageTitle}>Company Profile</h1>
          {!editing ? (
            <button className={styles.editBtn} onClick={() => setEditing(true)}>
              <Edit3 size={15} />Edit Profile
            </button>
          ) : (
            <div className={styles.btnGroup}>
              <button className={styles.cancelBtn} onClick={() => { setEditing(false); loadProfile(); }}>
                Cancel
              </button>
              <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 size={15} className={styles.spin} /> : <Save size={15} />}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        <div className={styles.grid}>
          {/* Left: Avatar + summary */}
          <motion.div
            className={styles.avatarCard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <div className={styles.logoWrap}>
              {form.logo
                ? <img src={form.logo} alt={form.companyName} className={styles.logoImg} />
                : <div className={styles.logoFallback}><Building2 size={40} /></div>}
            </div>
            <div className={styles.summaryName}>{form.companyName || 'Your Company'}</div>
            {form.industry && <div className={styles.summaryBadge}>{form.industry}</div>}
            {form.location && (
              <div className={styles.summaryRow}><MapPin size={13} />{form.location}</div>
            )}
            {form.website && (
              <a href={form.website} target="_blank" rel="noopener noreferrer" className={styles.summaryLink}>
                <Globe size={13} />{form.website.replace(/^https?:\/\//, '')}
              </a>
            )}
            {form.teamSize && (
              <div className={styles.summaryRow}><Users size={13} />{form.teamSize} employees</div>
            )}
          </motion.div>

          {/* Right: form */}
          <motion.div
            className={styles.formCard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.06 }}
          >
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Basic Information</h2>
              <div className={styles.fieldGrid}>
                <div className={styles.field}>
                  <label className={styles.label}>Company Name</label>
                  <input
                    className={styles.input}
                    name="companyName"
                    value={form.companyName}
                    onChange={handleChange}
                    disabled={!editing}
                    placeholder="Acme Corp"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Website</label>
                  <input
                    className={styles.input}
                    name="website"
                    value={form.website}
                    onChange={handleChange}
                    disabled={!editing}
                    placeholder="https://yourcompany.com"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Logo URL</label>
                  <input
                    className={styles.input}
                    name="logo"
                    value={form.logo}
                    onChange={handleChange}
                    disabled={!editing}
                    placeholder="https://..."
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Location</label>
                  <input
                    className={styles.input}
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    disabled={!editing}
                    placeholder="San Francisco, CA"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Industry</label>
                  <select
                    className={styles.select}
                    name="industry"
                    value={form.industry}
                    onChange={handleChange}
                    disabled={!editing}
                  >
                    <option value="">Select industry</option>
                    {INDUSTRY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Team Size</label>
                  <select
                    className={styles.select}
                    name="teamSize"
                    value={form.teamSize}
                    onChange={handleChange}
                    disabled={!editing}
                  >
                    <option value="">Select size</option>
                    {TEAM_SIZE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>About</h2>
              <textarea
                className={styles.textarea}
                name="about"
                value={form.about}
                onChange={handleChange}
                disabled={!editing}
                placeholder="Tell developers what your company does and why they should want to work with you..."
                rows={4}
              />
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <Briefcase size={15} />Hiring Needs
              </h2>
              <textarea
                className={styles.textarea}
                name="hiringNeeds"
                value={form.hiringNeeds}
                onChange={handleChange}
                disabled={!editing}
                placeholder="e.g. Looking for backend engineers with DevOps experience, remote-friendly..."
                rows={3}
              />
            </section>

            {editing && (
              <div className={styles.formActions}>
                <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 size={15} className={styles.spin} /> : <Check size={15} />}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </CompanyLayout>
  );
});

CompanyProfile.displayName = 'CompanyProfile';
export default CompanyProfile;

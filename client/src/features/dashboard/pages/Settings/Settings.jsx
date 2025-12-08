import { memo, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  MapPin,
  Github,
  Bell,
  Shield,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  ExternalLink,
  Unlink,
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout';
import GlassCard from '../../../../components/ui/GlassCard/GlassCard';
import { fadeInUp, staggerContainer } from '../../../../utils/animations';
import { getCurrentUser, updateUserProfile } from '../../../../services/userApi';
import styles from './Settings.module.css';

/**
 * Settings Page Component
 * 
 * Comprehensive settings page with multiple sections:
 * - Profile Settings (name, email, avatar, location)
 * - Account Settings (GitHub integration, account status)
 * - Notification Preferences
 * - Privacy Settings
 */
const Settings = memo(() => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [user, setUser] = useState(null);

  // Form states
  const [profileData, setProfileData] = useState({
    name: '',
    avatar: '',
    location: '',
  });

  const [notificationPrefs, setNotificationPrefs] = useState({
    emailEnabled: true,
    emailScoreReady: true,
    emailPortfolioReady: true,
    emailInterviewRequest: true,
    emailInterviewUpdate: true,
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  /**
   * Fetch user data from API
   */
  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const userData = await getCurrentUser();
      setUser(userData);
      setProfileData({
        name: userData.name || '',
        avatar: userData.avatar || '',
        location: userData.location || '',
      });
      // TODO: Fetch notification preferences when API is ready
      // const prefs = await getNotificationPreferences();
      // setNotificationPrefs(prefs);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Handle profile update
   */
  const handleProfileUpdate = useCallback(async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const updated = await updateUserProfile({
        name: profileData.name,
        avatar: profileData.avatar,
      });

      setUser(updated);
      setSuccess('Profile updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }, [profileData]);

  /**
   * Handle notification preferences update
   */
  const handleNotificationUpdate = useCallback(async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // TODO: Update notification preferences when API is ready
      // await updateNotificationPreferences(notificationPrefs);
      
      setSuccess('Notification preferences updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating notifications:', err);
      setError(err.message || 'Failed to update notification preferences');
    } finally {
      setSaving(false);
    }
  }, [notificationPrefs]);

  /**
   * Handle GitHub disconnect
   */
  const handleGitHubDisconnect = useCallback(async () => {
    if (!window.confirm('Are you sure you want to disconnect your GitHub account? This may affect your ability to start projects.')) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      // TODO: Implement GitHub disconnect when API is ready
      // await disconnectGitHub();
      setSuccess('GitHub account disconnected successfully!');
      await fetchUserData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error disconnecting GitHub:', err);
      setError(err.message || 'Failed to disconnect GitHub account');
    } finally {
      setSaving(false);
    }
  }, [fetchUserData]);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'account', label: 'Account', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className={styles.loadingContainer}>
          <Loader2 size={48} className={styles.loader} />
          <p>Loading settings...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className={styles.settingsPage}>
        {/* Header */}
        <motion.div
          className={styles.header}
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
        >
          <h1 className={styles.pageTitle}>Settings</h1>
          <p className={styles.pageSubtitle}>
            Manage your account settings and preferences
          </p>
        </motion.div>

        {/* Success/Error Messages */}
        {success && (
          <motion.div
            className={styles.messageSuccess}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <CheckCircle2 size={20} />
            <span>{success}</span>
          </motion.div>
        )}

        {error && (
          <motion.div
            className={styles.messageError}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AlertCircle size={20} />
            <span>{error}</span>
          </motion.div>
        )}

        <div className={styles.settingsContainer}>
          {/* Tabs Navigation */}
          <motion.div
            className={styles.tabsContainer}
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
          >
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <TabIcon size={20} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </motion.div>

          {/* Settings Content */}
          <motion.div
            className={styles.content}
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            key={activeTab}
          >
            {/* Profile Settings */}
            {activeTab === 'profile' && (
              <motion.div variants={fadeInUp}>
                <GlassCard className={styles.settingsCard}>
                  <h2 className={styles.cardTitle}>Profile Information</h2>
                  <p className={styles.cardDescription}>
                    Update your personal information and profile picture
                  </p>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      <User size={18} />
                      Full Name
                    </label>
                    <input
                      type="text"
                      className={styles.input}
                      value={profileData.name}
                      onChange={(e) =>
                        setProfileData({ ...profileData, name: e.target.value })
                      }
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      <Mail size={18} />
                      Email Address
                    </label>
                    <input
                      type="email"
                      className={`${styles.input} ${styles.inputDisabled}`}
                      value={user?.email || ''}
                      disabled
                      placeholder="Email address"
                    />
                    <p className={styles.helperText}>
                      Email cannot be changed. Contact support if you need to update it.
                    </p>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      <ImageIcon size={18} />
                      Avatar URL
                    </label>
                    <input
                      type="url"
                      className={styles.input}
                      value={profileData.avatar}
                      onChange={(e) =>
                        setProfileData({ ...profileData, avatar: e.target.value })
                      }
                      placeholder="https://example.com/avatar.jpg"
                    />
                    <p className={styles.helperText}>
                      Enter a URL to your profile picture
                    </p>
                    {profileData.avatar && (
                      <div className={styles.avatarPreview}>
                        <img
                          src={profileData.avatar}
                          alt="Avatar preview"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      <MapPin size={18} />
                      Location
                    </label>
                    <input
                      type="text"
                      className={styles.input}
                      value={profileData.location}
                      onChange={(e) =>
                        setProfileData({ ...profileData, location: e.target.value })
                      }
                      placeholder="City, Country"
                    />
                    <p className={styles.helperText}>
                      Your location helps companies find you in the talent feed
                    </p>
                  </div>

                  <button
                    className={styles.saveButton}
                    onClick={handleProfileUpdate}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 size={18} className={styles.buttonLoader} />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        Save Changes
                      </>
                    )}
                  </button>
                </GlassCard>
              </motion.div>
            )}

            {/* Account Settings */}
            {activeTab === 'account' && (
              <motion.div variants={fadeInUp}>
                <GlassCard className={styles.settingsCard}>
                  <h2 className={styles.cardTitle}>Account Settings</h2>
                  <p className={styles.cardDescription}>
                    Manage your account connections and security
                  </p>

                  {/* GitHub Integration */}
                  <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                      <div className={styles.sectionIcon}>
                        <Github size={24} />
                      </div>
                      <div className={styles.sectionContent}>
                        <h3 className={styles.sectionTitle}>GitHub Integration</h3>
                        <p className={styles.sectionDescription}>
                          Connect your GitHub account to start projects and track submissions
                        </p>
                      </div>
                    </div>

                    {user?.githubUsername ? (
                      <div className={styles.connectedAccount}>
                        <div className={styles.accountInfo}>
                          <div className={styles.accountAvatar}>
                            <Github size={20} />
                          </div>
                          <div>
                            <div className={styles.accountName}>
                              @{user.githubUsername}
                            </div>
                            <a
                              href={user.githubProfile || `https://github.com/${user.githubUsername}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.accountLink}
                            >
                              View Profile
                              <ExternalLink size={14} />
                            </a>
                          </div>
                        </div>
                        <button
                          className={styles.disconnectButton}
                          onClick={handleGitHubDisconnect}
                          disabled={saving}
                        >
                          <Unlink size={16} />
                          Disconnect
                        </button>
                      </div>
                    ) : (
                      <div className={styles.notConnected}>
                        <p className={styles.notConnectedText}>
                          GitHub account not connected
                        </p>
                        <button
                          className={styles.connectButton}
                          onClick={() => {
                            // TODO: Implement GitHub OAuth flow
                            window.location.href = '/auth/github';
                          }}
                        >
                          <Github size={18} />
                          Connect GitHub
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Account Status */}
                  <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                      <div className={styles.sectionIcon}>
                        <Shield size={24} />
                      </div>
                      <div className={styles.sectionContent}>
                        <h3 className={styles.sectionTitle}>Account Status</h3>
                        <p className={styles.sectionDescription}>
                          Your account information and status
                        </p>
                      </div>
                    </div>

                    <div className={styles.statusGrid}>
                      <div className={styles.statusItem}>
                        <span className={styles.statusLabel}>Account Type</span>
                        <span className={styles.statusValue}>
                          {user?.role || 'STUDENT'}
                        </span>
                      </div>
                      <div className={styles.statusItem}>
                        <span className={styles.statusLabel}>Trust Score</span>
                        <span className={styles.statusValue}>{user?.trustScore || 0}</span>
                      </div>
                      <div className={styles.statusItem}>
                        <span className={styles.statusLabel}>Badge</span>
                        <span className={`${styles.badge} ${styles[user?.badge?.toLowerCase() || 'red']}`}>
                          {user?.badge || 'RED'}
                        </span>
                      </div>
                      <div className={styles.statusItem}>
                        <span className={styles.statusLabel}>Member Since</span>
                        <span className={styles.statusValue}>
                          {user?.createdAt
                            ? new Date(user.createdAt).toLocaleDateString()
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <motion.div variants={fadeInUp}>
                <GlassCard className={styles.settingsCard}>
                  <h2 className={styles.cardTitle}>Notification Preferences</h2>
                  <p className={styles.cardDescription}>
                    Choose what notifications you want to receive
                  </p>

                  <div className={styles.notificationSection}>
                    <div className={styles.notificationToggle}>
                      <div className={styles.toggleInfo}>
                        <h3 className={styles.toggleTitle}>Email Notifications</h3>
                        <p className={styles.toggleDescription}>
                          Enable or disable all email notifications
                        </p>
                      </div>
                      <label className={styles.switch}>
                        <input
                          type="checkbox"
                          checked={notificationPrefs.emailEnabled}
                          onChange={(e) =>
                            setNotificationPrefs({
                              ...notificationPrefs,
                              emailEnabled: e.target.checked,
                            })
                          }
                        />
                        <span className={styles.slider}></span>
                      </label>
                    </div>

                    <div className={styles.notificationOptions}>
                      <div className={styles.notificationOption}>
                        <div className={styles.optionInfo}>
                          <h4 className={styles.optionTitle}>Score Ready</h4>
                          <p className={styles.optionDescription}>
                            Get notified when your submission scores are ready
                          </p>
                        </div>
                        <label className={styles.switch}>
                          <input
                            type="checkbox"
                            checked={notificationPrefs.emailScoreReady}
                            disabled={!notificationPrefs.emailEnabled}
                            onChange={(e) =>
                              setNotificationPrefs({
                                ...notificationPrefs,
                                emailScoreReady: e.target.checked,
                              })
                            }
                          />
                          <span className={styles.slider}></span>
                        </label>
                      </div>

                      <div className={styles.notificationOption}>
                        <div className={styles.optionInfo}>
                          <h4 className={styles.optionTitle}>Portfolio Ready</h4>
                          <p className={styles.optionDescription}>
                            Get notified when your portfolio is generated
                          </p>
                        </div>
                        <label className={styles.switch}>
                          <input
                            type="checkbox"
                            checked={notificationPrefs.emailPortfolioReady}
                            disabled={!notificationPrefs.emailEnabled}
                            onChange={(e) =>
                              setNotificationPrefs({
                                ...notificationPrefs,
                                emailPortfolioReady: e.target.checked,
                              })
                            }
                          />
                          <span className={styles.slider}></span>
                        </label>
                      </div>

                      <div className={styles.notificationOption}>
                        <div className={styles.optionInfo}>
                          <h4 className={styles.optionTitle}>Interview Requests</h4>
                          <p className={styles.optionDescription}>
                            Get notified when companies request interviews
                          </p>
                        </div>
                        <label className={styles.switch}>
                          <input
                            type="checkbox"
                            checked={notificationPrefs.emailInterviewRequest}
                            disabled={!notificationPrefs.emailEnabled}
                            onChange={(e) =>
                              setNotificationPrefs({
                                ...notificationPrefs,
                                emailInterviewRequest: e.target.checked,
                              })
                            }
                          />
                          <span className={styles.slider}></span>
                        </label>
                      </div>

                      <div className={styles.notificationOption}>
                        <div className={styles.optionInfo}>
                          <h4 className={styles.optionTitle}>Interview Updates</h4>
                          <p className={styles.optionDescription}>
                            Get notified about interview status changes
                          </p>
                        </div>
                        <label className={styles.switch}>
                          <input
                            type="checkbox"
                            checked={notificationPrefs.emailInterviewUpdate}
                            disabled={!notificationPrefs.emailEnabled}
                            onChange={(e) =>
                              setNotificationPrefs({
                                ...notificationPrefs,
                                emailInterviewUpdate: e.target.checked,
                              })
                            }
                          />
                          <span className={styles.slider}></span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <button
                    className={styles.saveButton}
                    onClick={handleNotificationUpdate}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 size={18} className={styles.buttonLoader} />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        Save Preferences
                      </>
                    )}
                  </button>
                </GlassCard>
              </motion.div>
            )}

            {/* Privacy Settings */}
            {activeTab === 'privacy' && (
              <motion.div variants={fadeInUp}>
                <GlassCard className={styles.settingsCard}>
                  <h2 className={styles.cardTitle}>Privacy Settings</h2>
                  <p className={styles.cardDescription}>
                    Control your privacy and data visibility
                  </p>

                  <div className={styles.privacySection}>
                    <div className={styles.privacyItem}>
                      <div className={styles.privacyInfo}>
                        <h3 className={styles.privacyTitle}>Profile Visibility</h3>
                        <p className={styles.privacyDescription}>
                          Control who can see your profile in the talent feed
                        </p>
                      </div>
                      <select className={styles.select}>
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                      </select>
                    </div>

                    <div className={styles.privacyItem}>
                      <div className={styles.privacyInfo}>
                        <h3 className={styles.privacyTitle}>Portfolio Visibility</h3>
                        <p className={styles.privacyDescription}>
                          Control who can view your portfolios
                        </p>
                      </div>
                      <select className={styles.select}>
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                      </select>
                    </div>

                    <div className={styles.privacyItem}>
                      <div className={styles.privacyInfo}>
                        <h3 className={styles.privacyTitle}>Data Sharing</h3>
                        <p className={styles.privacyDescription}>
                          Allow your data to be used for platform improvements
                        </p>
                      </div>
                      <label className={styles.switch}>
                        <input type="checkbox" defaultChecked />
                        <span className={styles.slider}></span>
                      </label>
                    </div>
                  </div>

                  <div className={styles.dangerZone}>
                    <h3 className={styles.dangerTitle}>Danger Zone</h3>
                    <div className={styles.dangerActions}>
                      <button className={styles.dangerButton}>
                        Export My Data
                      </button>
                      <button className={styles.dangerButton}>
                        Delete Account
                      </button>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
});

Settings.displayName = 'Settings';

export default Settings;

import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import Header from '../components/layout/Header';
import { Settings as SettingsIcon, User, Bell, Shield, Palette, Download, Trash2 } from 'lucide-react';

interface SettingsProps {
  user: any;
}

export default function Settings({ user }: SettingsProps) {
  const [activeTab, setActiveTab] = useState('profile');
  const [notifications, setNotifications] = useState({
    email: {
      analysis_complete: true,
      weekly_summary: true,
      product_updates: false,
      marketing: false,
    },
    push: {
      analysis_complete: true,
      team_invites: true,
      comments: true,
    }
  });
  const [theme, setTheme] = useState('dark');
  const [saving, setSaving] = useState(false);
  const [visualPrefs, setVisualPrefs] = useState({
    animations: true,
    highContrast: false
  });
  const [profileData, setProfileData] = useState({
    displayName: user?.name || '',
    githubUsername: user?.login || '',
    bio: ''
  });
  
  // Load settings from localStorage on component mount
  useEffect(() => {
    const loadSettings = () => {
      try {
        // Load theme
        const savedTheme = localStorage.getItem('colooky_theme');
        if (savedTheme) {
          setTheme(savedTheme);
          handleThemeChange(savedTheme, false); // Don't save again
        }
        
        // Load notifications
        const savedNotifications = localStorage.getItem('colooky_notifications');
        if (savedNotifications) {
          setNotifications(JSON.parse(savedNotifications));
        }
        
        // Load privacy settings
        const savedPrivacy = localStorage.getItem('colooky_privacy');
        if (savedPrivacy) {
          setPrivacy(JSON.parse(savedPrivacy));
        }
        
        // Load visual preferences
        const savedVisualPrefs = localStorage.getItem('colooky_visual_prefs');
        if (savedVisualPrefs) {
          setVisualPrefs(JSON.parse(savedVisualPrefs));
        }
        
        // Load profile data
        const savedProfile = localStorage.getItem('colooky_profile');
        if (savedProfile) {
          const parsed = JSON.parse(savedProfile);
          setProfileData({
            displayName: parsed.displayName || user?.name || '',
            githubUsername: parsed.githubUsername || user?.login || '',
            bio: parsed.bio || ''
          });
        }
        
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    
    loadSettings();
  }, [user]);

  const handleThemeChange = (newTheme: string, shouldSave: boolean = true) => {
    setTheme(newTheme);
    
    // Apply theme immediately to document
    if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      document.body.classList.add('bg-white');
      document.body.classList.remove('bg-slate-900');
    } else if (newTheme === 'auto') {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
        document.body.classList.add('bg-slate-900');
        document.body.classList.remove('bg-white');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
        document.body.classList.add('bg-white');
        document.body.classList.remove('bg-slate-900');
      }
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
      document.body.classList.add('bg-slate-900');
      document.body.classList.remove('bg-white');
    }
    
    // Save to localStorage
    if (shouldSave) {
      localStorage.setItem('colooky_theme', newTheme);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    
    try {
      const settingsData = {
        notifications,
        theme,
        privacy,
        visualPrefs,
        profileData,
        user_preferences: {
          theme,
          notifications_enabled: notifications.email.analysis_complete,
          animations_enabled: visualPrefs.animations,
          high_contrast: visualPrefs.highContrast
        }
      };
      
      // Save to localStorage for immediate persistence
      localStorage.setItem('colooky_notifications', JSON.stringify(notifications));
      localStorage.setItem('colooky_privacy', JSON.stringify(privacy));
      localStorage.setItem('colooky_visual_prefs', JSON.stringify(visualPrefs));
      localStorage.setItem('colooky_profile', JSON.stringify(profileData));
      localStorage.setItem('colooky_theme', theme);
      
      console.log('Settings saved locally:', settingsData);
      
      // TODO: Implement API call to save to backend when ready
      /*
      const response = await fetch('/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save to server');
      }
      */
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Show success message
      alert('Settings saved successfully! 🎉');
      
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Settings saved locally, but server sync failed. Your changes are still saved!');
    } finally {
      setSaving(false);
    }
  };
  const [privacy, setPrivacy] = useState({
    make_profile_public: false,
    show_activity: true,
    allow_indexing: false,
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ];

  const handleNotificationChange = (category: 'email' | 'push', setting: string, value: boolean) => {
    setNotifications(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));
  };

  const handlePrivacyChange = (setting: string, value: boolean) => {
    setPrivacy(prev => ({
      ...prev,
      [setting]: value
    }));
  };
  
  const handleVisualPrefChange = (setting: string, value: boolean) => {
    setVisualPrefs(prev => ({
      ...prev,
      [setting]: value
    }));
    // Immediately save visual preferences
    localStorage.setItem('colooky_visual_prefs', JSON.stringify({...visualPrefs, [setting]: value}));
  };
  
  const handleProfileDataChange = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <>
      <Head>
        <title>Settings - Colooky</title>
        <meta name="description" content="Manage your Colooky account settings and preferences" />
      </Head>
      
      <div className="min-h-screen bg-slate-900">
        <Header />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <SettingsIcon className="w-8 h-8 text-blue-400" />
              Settings
            </h1>
            <p className="text-slate-400 mt-2">
              Manage your account settings and preferences
            </p>
          </div>

          <div className="flex gap-8">
            {/* Settings Navigation */}
            <div className="w-64 flex-shrink-0">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Settings Content */}
            <div className="flex-1">
              <div className="bg-slate-800 border border-slate-700 rounded-lg">
                {/* Profile Settings */}
                {activeTab === 'profile' && (
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-white mb-6">Profile Settings</h2>
                    
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-xl font-bold text-white">
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">{user?.name || 'User'}</h3>
                          <p className="text-slate-400">{user?.email}</p>
                          <button className="text-sm text-blue-400 hover:text-blue-300 mt-1">
                            Change avatar
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">
                            Display Name
                          </label>
                          <input
                            type="text"
                            value={profileData.displayName}
                            onChange={(e) => handleProfileDataChange('displayName', e.target.value)}
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">
                            GitHub Username
                          </label>
                          <input
                            type="text"
                            value={profileData.githubUsername}
                            onChange={(e) => handleProfileDataChange('githubUsername', e.target.value)}
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Bio
                        </label>
                        <textarea
                          rows={3}
                          value={profileData.bio}
                          onChange={(e) => handleProfileDataChange('bio', e.target.value)}
                          placeholder="Tell us about yourself..."
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="flex gap-3">
                        <button 
                          onClick={handleSaveSettings}
                          disabled={saving}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
                        >
                          {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors">
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notifications */}
                {activeTab === 'notifications' && (
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-white mb-6">Notification Preferences</h2>
                    
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Email Notifications</h3>
                        <div className="space-y-3">
                          {Object.entries(notifications.email).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between">
                              <div>
                                <label className="text-white font-medium">
                                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </label>
                                <p className="text-sm text-slate-400">
                                  {key === 'analysis_complete' && 'Get notified when your code analysis is finished'}
                                  {key === 'weekly_summary' && 'Receive weekly summaries of your activity'}
                                  {key === 'product_updates' && 'News about new features and improvements'}
                                  {key === 'marketing' && 'Tips, tutorials, and promotional content'}
                                </p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={value}
                                  onChange={(e) => handleNotificationChange('email', key, e.target.checked)}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Push Notifications</h3>
                        <div className="space-y-3">
                          {Object.entries(notifications.push).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between">
                              <div>
                                <label className="text-white font-medium">
                                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </label>
                                <p className="text-sm text-slate-400">
                                  {key === 'analysis_complete' && 'Browser notifications for completed analysis'}
                                  {key === 'team_invites' && 'Notifications for team collaboration invites'}
                                  {key === 'comments' && 'Notifications for comments on your visualizations'}
                                </p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={value}
                                  onChange={(e) => handleNotificationChange('push', key, e.target.checked)}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Privacy & Security */}
                {activeTab === 'privacy' && (
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-white mb-6">Privacy & Security</h2>
                    
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Privacy Settings</h3>
                        <div className="space-y-3">
                          {Object.entries(privacy).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between">
                              <div>
                                <label className="text-white font-medium">
                                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </label>
                                <p className="text-sm text-slate-400">
                                  {key === 'make_profile_public' && 'Allow others to view your public profile'}
                                  {key === 'show_activity' && 'Show your recent activity on your profile'}
                                  {key === 'allow_indexing' && 'Allow search engines to index your public content'}
                                </p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={value}
                                  onChange={(e) => handlePrivacyChange(key, e.target.checked)}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Data Management</h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                            <div>
                              <h4 className="text-white font-medium">Export Data</h4>
                              <p className="text-sm text-slate-400">Download all your data in JSON format</p>
                            </div>
                            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                              <Download className="w-4 h-4" />
                              Export
                            </button>
                          </div>
                          
                          <div className="flex items-center justify-between p-4 bg-red-900/20 border border-red-800 rounded-lg">
                            <div>
                              <h4 className="text-red-400 font-medium">Delete Account</h4>
                              <p className="text-sm text-red-300">Permanently delete your account and all data</p>
                            </div>
                            <button className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors">
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Appearance */}
                {activeTab === 'appearance' && (
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-white mb-6">Appearance</h2>
                    
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Theme</h3>
                        <div className="grid grid-cols-3 gap-4">
                          {['dark', 'light', 'auto'].map((themeOption) => (
                            <button
                              key={themeOption}
                              onClick={() => handleThemeChange(themeOption)}
                              className={`p-4 border-2 rounded-lg transition-all ${
                                theme === themeOption
                                  ? 'border-blue-500 bg-blue-600/10'
                                  : 'border-slate-600 hover:border-slate-500'
                              }`}
                            >
                              <div className="text-center">
                                <div className={`w-12 h-8 mx-auto mb-2 rounded ${
                                  themeOption === 'dark' ? 'bg-slate-800' :
                                  themeOption === 'light' ? 'bg-white border border-slate-300' :
                                  'bg-gradient-to-r from-slate-800 via-white to-slate-800'
                                }`}></div>
                                <p className="text-white font-medium capitalize">{themeOption}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Visualization Preferences</h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <label className="text-white font-medium">Animations</label>
                              <p className="text-sm text-slate-400">Enable animated transitions in visualizations</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={visualPrefs.animations}
                                onChange={(e) => handleVisualPrefChange('animations', e.target.checked)}
                                className="sr-only peer" 
                              />
                              <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <label className="text-white font-medium">High Contrast</label>
                              <p className="text-sm text-slate-400">Increase contrast for better accessibility</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={visualPrefs.highContrast}
                                onChange={(e) => handleVisualPrefChange('highContrast', e.target.checked)}
                                className="sr-only peer" 
                              />
                              <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);
  
  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };
  }
  
  return {
    props: {
      user: session.user,
    },
  };
};
import { useState } from 'react';
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

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    
    // Apply theme immediately to document
    if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
    
    // Save to localStorage
    localStorage.setItem('colooky_theme', newTheme);
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    
    try {
      // TODO: Save to database via API
      const settingsData = {
        notifications,
        theme,
        privacy,
        user_preferences: {
          theme,
          notifications_enabled: notifications.email.analysis_complete
        }
      };
      
      console.log('Saving settings:', settingsData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success message
      alert('Settings saved successfully!');
      
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings. Please try again.');
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
                            defaultValue={user?.name || ''}
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">
                            GitHub Username
                          </label>
                          <input
                            type="text"
                            defaultValue={user?.login || ''}
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
                              <input type="checkbox" defaultChecked className="sr-only peer" />
                              <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <label className="text-white font-medium">High Contrast</label>
                              <p className="text-sm text-slate-400">Increase contrast for better accessibility</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" className="sr-only peer" />
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
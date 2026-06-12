import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

const SettingsPage = () => {
  const { user, updateUserProfile, changePassword, deleteAccount, updateAvatar } = useContext(AuthContext);
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const fileInputRef = React.useRef(null);
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    location: user?.location || '',
    website: user?.website || '',
    status: user?.status || 'online'
  });
  
  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Notification preferences
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    messagePreview: true,
    soundEnabled: true,
    desktopNotifications: true
  });
  
  // Privacy settings
  const [privacy, setPrivacy] = useState({
    showOnlineStatus: true,
    showLastSeen: true,
    allowDirectMessages: true
  });

  useEffect(() => {
    const savedNotifications = localStorage.getItem('notificationSettings');
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications));
    }
    
    const savedPrivacy = localStorage.getItem('privacySettings');
    if (savedPrivacy) {
      setPrivacy(JSON.parse(savedPrivacy));
    }
  }, []);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      showMessage('error', 'Avatar must be less than 2MB');
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      showMessage('error', 'Please select an image file');
      return;
    }
    
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await fetch('http://localhost:5000/api/users/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      const data = await response.json();
      if (data.success) {
        showMessage('success', 'Avatar updated successfully!');
        // Update user context with new avatar
        const updatedUser = { ...user, avatar: data.avatarUrl };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        window.location.reload();
      }
    } catch (error) {
      showMessage('error', 'Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateUserProfile(profileForm);
      showMessage('success', 'Profile updated successfully!');
    } catch (error) {
      showMessage('error', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showMessage('error', 'New passwords do not match');
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      showMessage('error', 'Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      showMessage('success', 'Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      showMessage('error', error.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationChange = (key, value) => {
    const newSettings = { ...notifications, [key]: value };
    setNotifications(newSettings);
    localStorage.setItem('notificationSettings', JSON.stringify(newSettings));
    showMessage('success', 'Notification settings saved');
  };

  const handlePrivacyChange = (key, value) => {
    const newSettings = { ...privacy, [key]: value };
    setPrivacy(newSettings);
    localStorage.setItem('privacySettings', JSON.stringify(newSettings));
    showMessage('success', 'Privacy settings saved');
  };

  const handleDeleteAccount = async () => {
    const confirm = window.confirm(
      '⚠️ WARNING: This action is irreversible!\n\n' +
      'Deleting your account will permanently remove:\n' +
      '- All your messages\n' +
      '- Your profile information\n' +
      '- Access to all workspaces\n\n' +
      'Are you absolutely sure?'
    );
    
    if (confirm) {
      const secondConfirm = window.prompt('Type "DELETE" to confirm:');
      if (secondConfirm === 'DELETE') {
        setLoading(true);
        try {
          await deleteAccount();
          showMessage('success', 'Account deleted successfully');
          setTimeout(() => navigate('/login'), 2000);
        } catch (error) {
          showMessage('error', error.message || 'Failed to delete account');
        } finally {
          setLoading(false);
        }
      }
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'privacy', label: 'Privacy', icon: '🛡️' },
    { id: 'appearance', label: 'Appearance', icon: '🎨' },
    { id: 'danger', label: 'Danger Zone', icon: '⚠️' }
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-400 hover:text-white transition"
            >
              ← Back
            </button>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Message Alert */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}>
            {message.text}
          </div>
        )}
        
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Tabs */}
          <div className="md:w-64 flex-shrink-0">
            <div className="bg-gray-800 rounded-xl overflow-hidden">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 transition ${
                    activeTab === tab.id
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <span className="text-xl">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Main Content */}
          <div className="flex-1 bg-gray-800 rounded-xl p-6">
            {/* Profile Settings */}
            {activeTab === 'profile' && (
              <div>
                <h2 className="text-xl font-bold text-white mb-6">Profile Settings</h2>
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  {/* Avatar Upload */}
                  <div className="flex items-center gap-6 mb-6">
                    <div className="relative">
                      <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-4xl text-white">
                        {user?.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          user?.name?.charAt(0)?.toUpperCase() || '?'
                        )}
                      </div>
                      {uploadingAvatar && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                        </div>
                      )}
                    </div>
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleAvatarChange}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={handleAvatarClick}
                        disabled={uploadingAvatar}
                        className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition disabled:opacity-50"
                      >
                        {uploadingAvatar ? 'Uploading...' : 'Change Avatar'}
                      </button>
                      <p className="text-gray-400 text-sm mt-1">JPG, PNG or GIF. Max 2MB</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">Bio</label>
                    <textarea
                      name="bio"
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                      rows="3"
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">Location</label>
                    <input
                      type="text"
                      name="location"
                      value={profileForm.location}
                      onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="City, Country"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">Website</label>
                    <input
                      type="url"
                      name="website"
                      value={profileForm.website}
                      onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="https://..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">Status</label>
                    <select
                      name="status"
                      value={profileForm.status}
                      onChange={(e) => setProfileForm({ ...profileForm, status: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="online">🟢 Online</option>
                      <option value="away">🟡 Away</option>
                      <option value="busy">🔴 Busy</option>
                      <option value="offline">⚫ Offline</option>
                    </select>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            {/* Security Settings */}
            {activeTab === 'security' && (
              <div>
                <h2 className="text-xl font-bold text-white mb-6">Security Settings</h2>
                <form onSubmit={handlePasswordChange} className="space-y-6">
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">Current Password</label>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">New Password</label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                    <p className="text-gray-400 text-xs mt-1">Minimum 6 characters</p>
                  </div>
                  
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                  >
                    {loading ? 'Changing...' : 'Change Password'}
                  </button>
                </form>
                
                <div className="mt-8 pt-6 border-t border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Two-Factor Authentication</h3>
                  <p className="text-gray-400 mb-4">Add an extra layer of security to your account.</p>
                  <button className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition">
                    Enable 2FA
                  </button>
                </div>
              </div>
            )}
            
            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <div>
                <h2 className="text-xl font-bold text-white mb-6">Notification Preferences</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-gray-700">
                    <div>
                      <p className="text-white font-medium">Email Notifications</p>
                      <p className="text-gray-400 text-sm">Receive email updates about your account</p>
                    </div>
                    <button
                      onClick={() => handleNotificationChange('emailNotifications', !notifications.emailNotifications)}
                      className={`w-12 h-6 rounded-full transition ${
                        notifications.emailNotifications ? 'bg-indigo-600' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transition transform ${
                        notifications.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between py-3 border-b border-gray-700">
                    <div>
                      <p className="text-white font-medium">Push Notifications</p>
                      <p className="text-gray-400 text-sm">Get notified when you receive new messages</p>
                    </div>
                    <button
                      onClick={() => handleNotificationChange('pushNotifications', !notifications.pushNotifications)}
                      className={`w-12 h-6 rounded-full transition ${
                        notifications.pushNotifications ? 'bg-indigo-600' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transition transform ${
                        notifications.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between py-3 border-b border-gray-700">
                    <div>
                      <p className="text-white font-medium">Message Preview</p>
                      <p className="text-gray-400 text-sm">Show message content in notifications</p>
                    </div>
                    <button
                      onClick={() => handleNotificationChange('messagePreview', !notifications.messagePreview)}
                      className={`w-12 h-6 rounded-full transition ${
                        notifications.messagePreview ? 'bg-indigo-600' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transition transform ${
                        notifications.messagePreview ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between py-3 border-b border-gray-700">
                    <div>
                      <p className="text-white font-medium">Sound Effects</p>
                      <p className="text-gray-400 text-sm">Play sounds for new messages</p>
                    </div>
                    <button
                      onClick={() => handleNotificationChange('soundEnabled', !notifications.soundEnabled)}
                      className={`w-12 h-6 rounded-full transition ${
                        notifications.soundEnabled ? 'bg-indigo-600' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transition transform ${
                        notifications.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between py-3 border-b border-gray-700">
                    <div>
                      <p className="text-white font-medium">Desktop Notifications</p>
                      <p className="text-gray-400 text-sm">Show notifications on your desktop</p>
                    </div>
                    <button
                      onClick={() => handleNotificationChange('desktopNotifications', !notifications.desktopNotifications)}
                      className={`w-12 h-6 rounded-full transition ${
                        notifications.desktopNotifications ? 'bg-indigo-600' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transition transform ${
                        notifications.desktopNotifications ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Privacy Settings */}
            {activeTab === 'privacy' && (
              <div>
                <h2 className="text-xl font-bold text-white mb-6">Privacy Settings</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-gray-700">
                    <div>
                      <p className="text-white font-medium">Show Online Status</p>
                      <p className="text-gray-400 text-sm">Let others see when you're online</p>
                    </div>
                    <button
                      onClick={() => handlePrivacyChange('showOnlineStatus', !privacy.showOnlineStatus)}
                      className={`w-12 h-6 rounded-full transition ${
                        privacy.showOnlineStatus ? 'bg-indigo-600' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transition transform ${
                        privacy.showOnlineStatus ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between py-3 border-b border-gray-700">
                    <div>
                      <p className="text-white font-medium">Show Last Seen</p>
                      <p className="text-gray-400 text-sm">Let others know when you were last active</p>
                    </div>
                    <button
                      onClick={() => handlePrivacyChange('showLastSeen', !privacy.showLastSeen)}
                      className={`w-12 h-6 rounded-full transition ${
                        privacy.showLastSeen ? 'bg-indigo-600' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transition transform ${
                        privacy.showLastSeen ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between py-3 border-b border-gray-700">
                    <div>
                      <p className="text-white font-medium">Allow Direct Messages</p>
                      <p className="text-gray-400 text-sm">Receive messages from people outside your workspaces</p>
                    </div>
                    <button
                      onClick={() => handlePrivacyChange('allowDirectMessages', !privacy.allowDirectMessages)}
                      className={`w-12 h-6 rounded-full transition ${
                        privacy.allowDirectMessages ? 'bg-indigo-600' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transition transform ${
                        privacy.allowDirectMessages ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Appearance Settings */}
            {activeTab === 'appearance' && (
              <div>
                <h2 className="text-xl font-bold text-white mb-6">Appearance</h2>
                <div className="space-y-6">
                  <div className="flex items-center justify-between py-3 border-b border-gray-700">
                    <div>
                      <p className="text-white font-medium">Dark Mode</p>
                      <p className="text-gray-400 text-sm">Toggle between light and dark theme</p>
                    </div>
                    <button
                      onClick={toggleTheme}
                      className={`w-12 h-6 rounded-full transition ${
                        isDarkMode ? 'bg-indigo-600' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transition transform ${
                        isDarkMode ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">Font Size</label>
                    <select
                      value="medium"
                      onChange={() => {}}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">Language</label>
                    <select
                      value="en"
                      onChange={() => {}}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="en">English (US)</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
            
            {/* Danger Zone */}
            {activeTab === 'danger' && (
              <div>
                <h2 className="text-xl font-bold text-red-500 mb-6">Danger Zone</h2>
                <div className="space-y-6">
                  <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-red-400 mb-2">Delete Account</h3>
                    <p className="text-gray-400 mb-4">
                      Once you delete your account, there is no going back. This action is irreversible.
                      All your data will be permanently removed.
                    </p>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={loading}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                    >
                      {loading ? 'Processing...' : 'Delete Account'}
                    </button>
                  </div>
                  
                  <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-yellow-400 mb-2">Export Data</h3>
                    <p className="text-gray-400 mb-4">
                      Download all your messages and files. This may take a few minutes.
                    </p>
                    <button className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition">
                      Export Data
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
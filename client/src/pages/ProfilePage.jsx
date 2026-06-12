import React, { useState, useContext, useEffect } from 'react'; // Add useEffect
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ProfilePage = () => {
  const { user, updateUserProfile } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    location: user?.location || '',
    website: user?.website || '',
    status: user?.status || 'online'
  });

  // Add this useEffect to update form when user data changes
  useEffect(() => {
    console.log('ProfilePage - User data received:', user);
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || '',
        status: user.status || 'online'
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateUserProfile(formData);
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      alert(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Add a loading state
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-white">
              ← Back
            </button>
            <h1 className="text-2xl font-bold text-white">Profile</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-gray-800 rounded-xl overflow-hidden">
          {/* Cover Image */}
          <div className="h-32 bg-gradient-to-r from-indigo-600 to-purple-600"></div>
          
          {/* Avatar */}
          <div className="relative px-6">
            <div className="absolute -top-12">
              <div className="w-24 h-24 bg-gray-700 rounded-full border-4 border-gray-800 flex items-center justify-center">
                <span className="text-4xl text-white font-bold">
                  {user?.name?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>
            </div>
          </div>

          <div className="px-6 pt-16 pb-6">
            {!isEditing ? (
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{user?.name || 'No Name'}</h2>
                    <p className="text-gray-400">{user?.email || 'No Email'}</p>
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Edit Profile
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.bio && (
                    <div>
                      <p className="text-gray-400 text-sm">Bio</p>
                      <p className="text-white">{formData.bio}</p>
                    </div>
                  )}
                  {formData.location && (
                    <div>
                      <p className="text-gray-400 text-sm">Location</p>
                      <p className="text-white">{formData.location}</p>
                    </div>
                  )}
                  {formData.website && (
                    <div>
                      <p className="text-gray-400 text-sm">Website</p>
                      <a href={formData.website} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
                        {formData.website}
                      </a>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-400 text-sm">Status</p>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                      formData.status === 'online' ? 'bg-green-600' :
                      formData.status === 'away' ? 'bg-yellow-600' :
                      formData.status === 'busy' ? 'bg-red-600' : 'bg-gray-600'
                    } text-white`}>
                      {formData.status}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Form fields remain the same */}
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Bio</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Tell us about yourself..."
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="City, Country"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Website</label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="online">🟢 Online</option>
                    <option value="away">🟡 Away</option>
                    <option value="busy">🔴 Busy</option>
                    <option value="offline">⚫ Offline</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
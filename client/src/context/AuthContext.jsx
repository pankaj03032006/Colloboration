import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for saved user on mount
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    console.log('Auth mount - Token:', token ? 'Exists' : 'No');
    console.log('Auth mount - User data:', userData);
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser({ ...parsedUser, token });
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.clear();
      }
    }
    setLoading(false);
  }, []);

  const register = async (name, email, password) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      
      const data = await response.json();
      console.log('Register response:', data);
      
      if (data.success) {
        const userData = {
          _id: data._id,
          name: data.name,
          email: data.email,
          token: data.token,
          bio: data.bio || '',
          location: data.location || '',
          website: data.website || '',
          status: data.status || 'online'
        };
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        
        return { success: true };
      } else {
        return { 
          success: false, 
          error: data.message || 'Registration failed' 
        };
      }
    } catch (error) {
      console.error('Register error:', error);
      return { 
        success: false, 
        error: 'Network error. Please try again.' 
      };
    }
  };

  const login = async (email, password) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      console.log('Login response:', data);
      
      if (data.success) {
        const userData = {
          _id: data._id,
          name: data.name,
          email: data.email,
          token: data.token,
          bio: data.bio || '',
          location: data.location || '',
          website: data.website || '',
          status: data.status || 'online'
        };
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        
        return { success: true };
      } else {
        return { 
          success: false, 
          error: data.message || 'Login failed' 
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: 'Network error. Please try again.' 
      };
    }
  };

  // ADD THIS FUNCTION - Update user profile
  const updateUserProfile = async (formData) => {
    try {
      const token = localStorage.getItem('token');
      console.log('Updating profile with:', formData);
      
      const response = await fetch('http://localhost:5000/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      console.log('Update profile response:', data);
      
      if (data.success) {
        // Update user in state and localStorage
        const updatedUser = { 
          ...user, 
          ...formData,
          token: user?.token // Keep the token
        };
        
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        
        return { success: true };
      } else {
        throw new Error(data.message || 'Update failed');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      register, 
      login, 
      logout, 
      updateUserProfile  // Make sure this is included
    }}>
      {children}
    </AuthContext.Provider>
  );
};
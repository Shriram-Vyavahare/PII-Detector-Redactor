// Authentication service for API communication and session management

const API_BASE_URL = '/api';

// Register new user
export const register = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    return { success: response.ok, data };
  } catch (error) {
    return { 
      success: false, 
      data: { message: 'Network error. Please try again.' } 
    };
  }
};

// Login user
export const login = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      // Store authentication data in localStorage
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    return { success: response.ok, data };
  } catch (error) {
    return { 
      success: false, 
      data: { message: 'Network error. Please try again.' } 
    };
  }
};

// Logout user
export const logout = async () => {
  try {
    // Call logout endpoint (optional since we use localStorage)
    await fetch(`${API_BASE_URL}/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    // Continue with logout even if API call fails
    console.warn('Logout API call failed:', error);
  } finally {
    // Always clear localStorage
    clearSession();
  }
};

// Check if user is authenticated
export const isAuthenticated = () => {
  try {
    const authStatus = localStorage.getItem('isAuthenticated');
    const user = localStorage.getItem('user');
    return authStatus === 'true' && user !== null;
  } catch (error) {
    console.error('Error checking authentication status:', error);
    return false;
  }
};

// Get current user data
export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Clear session data
export const clearSession = () => {
  try {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
  } catch (error) {
    console.error('Error clearing session:', error);
  }
};

// Initialize auth state (call on app startup)
export const initializeAuth = () => {
  // Check if stored auth data is valid
  if (isAuthenticated()) {
    const user = getCurrentUser();
    if (!user || !user.id || !user.email) {
      // Invalid user data, clear session
      clearSession();
      return false;
    }
    return true;
  }
  return false;
};
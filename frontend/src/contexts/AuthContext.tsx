import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType, UserRegistrationData } from '../types/auth';
import { authAPI } from '../services/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🚀 AuthContext: Initializing authentication...');
        const storedToken = localStorage.getItem('auth_token');
        const storedUser = localStorage.getItem('user_data');

        console.log('🔍 AuthContext: Stored token exists:', !!storedToken);
        console.log('🔍 AuthContext: Stored user data exists:', !!storedUser);

        if (storedToken && storedUser) {
          console.log('✅ AuthContext: Found stored credentials, setting up user...');
          setToken(storedToken);
          
          try {
            const userData = JSON.parse(storedUser);
            console.log('✅ AuthContext: Parsed user data:', { id: userData.id, email: userData.email });
            setUser(userData);
            
            // Verify token with server
            console.log('🔄 AuthContext: Verifying token with server...');
            const verifyResponse = await authAPI.verifyToken();
            console.log('📡 AuthContext: Token verification response:', verifyResponse);
            
            if (!verifyResponse.success) {
              // Token is invalid, clear storage
              console.error('❌ AuthContext: Token verification failed, clearing storage');
              handleLogout();
            } else {
              console.log('✅ AuthContext: Token verified successfully');
              // Token is valid, user data is already set from localStorage
              // No need to refresh user data during initialization
            }
          } catch (error) {
            console.error('❌ AuthContext: Error parsing stored user data:', error);
            handleLogout();
          }
        } else {
          console.log('ℹ️ AuthContext: No stored credentials found');
        }
      } catch (error) {
        console.error('❌ AuthContext: Error initializing auth:', error);
        handleLogout();
      } finally {
        console.log('🏁 AuthContext: Initialization complete');
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const handleLogout = () => {
    console.log('🚪 AuthContext: Logging out user...');
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    console.log('✅ AuthContext: Logout complete');
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('🔐 AuthContext: Attempting login for:', email);
      setIsLoading(true);
      const response = await authAPI.login({ email, password });
      
      console.log('📡 AuthContext: Login response:', { success: response.success, message: response.message });
      
      if (response.success && response.user && response.token) {
        console.log('✅ AuthContext: Login successful, setting user data...');
        console.log('👤 AuthContext: User data:', { id: response.user.id, email: response.user.email });
        
        setUser(response.user);
        setToken(response.token);
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('user_data', JSON.stringify(response.user));
        
        console.log('✅ AuthContext: Login complete');
        return true;
      } else {
        console.error('❌ AuthContext: Login failed:', response.message);
        return false;
      }
    } catch (error) {
      console.error('❌ AuthContext: Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: UserRegistrationData): Promise<boolean> => {
    try {
      console.log('📝 AuthContext: Attempting registration for:', userData.email);
      setIsLoading(true);
      const response = await authAPI.register(userData);
      
      console.log('📡 AuthContext: Registration response:', { success: response.success, message: response.message });
      
      if (response.success && response.user && response.token) {
        console.log('✅ AuthContext: Registration successful, setting user data...');
        console.log('👤 AuthContext: User data:', { id: response.user.id, email: response.user.email });
        
        setUser(response.user);
        setToken(response.token);
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('user_data', JSON.stringify(response.user));
        
        console.log('✅ AuthContext: Registration complete');
        return true;
      } else {
        console.error('❌ AuthContext: Registration failed:', response.message);
        return false;
      }
    } catch (error) {
      console.error('❌ AuthContext: Registration error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    handleLogout();
  };

  const refreshUser = async (): Promise<void> => {
    // Prevent refresh during initialization
    if (isLoading) {
      console.log('⏳ AuthContext: Refresh skipped - initialization in progress');
      return;
    }
    
    try {
      console.log('🔄 AuthContext: Refreshing user data...');
      const response = await authAPI.getProfile();
      
      console.log('📡 AuthContext: Profile refresh response:', { success: response.success, message: response.message });
      
      if (response.success && response.user) {
        console.log('✅ AuthContext: User data refreshed successfully');
        console.log('👤 AuthContext: Updated user data:', { id: response.user.id, email: response.user.email });
        
        setUser(response.user);
        localStorage.setItem('user_data', JSON.stringify(response.user));
      } else {
        console.error('❌ AuthContext: Failed to refresh user data:', response.message);
        // Don't logout on refresh failure, might be temporary network issue
      }
    } catch (error) {
      console.error('❌ AuthContext: Error refreshing user data:', error);
      // Don't logout on refresh failure
    }
  };

  const contextValue: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 
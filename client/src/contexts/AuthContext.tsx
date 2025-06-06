import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { User, UserRole } from '../types';
import { authService } from '../services/authService';

// Firebase configuration
const firebaseConfig = JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG || '{}');

// Initialize Firebase (with error handling for demo mode)
let app: any = null;
let auth: any = null;
let googleProvider: any = null;

try {
  if (firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
  }
} catch (error) {
  console.warn('Firebase not configured, running in demo mode');
}

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Demo mode - no Firebase auth
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);

      if (firebaseUser) {
        try {
          // Get ID token and authenticate with backend
          const idToken = await firebaseUser.getIdToken();
          const response = await authService.login(idToken);
          setUser(response.data?.user || null);
        } catch (error) {
          console.error('Authentication error:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);

      // Demo mode - simulate login without Firebase
      if (!auth) {
        // Demo users
        const demoUsers = {
          'admin@cricket.com': {
            id: '1',
            email: 'admin@cricket.com',
            name: 'Admin User',
            role: 'ADMIN' as UserRole,
            phone: '+91 9876543210',
            isActive: true,
            avatarUrl: undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          'housekeeper@cricket.com': {
            id: '2',
            email: 'housekeeper@cricket.com',
            name: 'Housekeeping Staff',
            role: 'HOUSEKEEPING' as UserRole,
            phone: '+91 9876543211',
            isActive: true,
            avatarUrl: undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          'user@cricket.com': {
            id: '3',
            email: 'user@cricket.com',
            name: 'Regular User',
            role: 'USER' as UserRole,
            phone: '+91 9876543212',
            isActive: true,
            avatarUrl: undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        };

        const demoUser = demoUsers[email as keyof typeof demoUsers];
        if (demoUser && (password === 'admin123' || password === 'house123' || password === 'user123')) {
          setUser(demoUser);
          setFirebaseUser({ uid: demoUser.id } as FirebaseUser);
          return;
        } else {
          throw new Error('Invalid demo credentials');
        }
      }

      // Real Firebase login
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();
      const response = await authService.login(idToken);
      setUser(response.data?.user || null);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      setLoading(true);

      // Demo mode - simulate Google login
      if (!auth) {
        const demoUser = {
          id: '4',
          email: 'demo@google.com',
          name: 'Google Demo User',
          role: 'USER' as UserRole,
          phone: '+91 9876543213',
          isActive: true,
          avatarUrl: undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setUser(demoUser);
        setFirebaseUser({ uid: demoUser.id } as FirebaseUser);
        return;
      }

      // Real Google login
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      const response = await authService.login(idToken);
      setUser(response.data?.user || null);
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Demo mode
      if (!auth) {
        setUser(null);
        setFirebaseUser(null);
        return;
      }

      // Real logout
      await authService.logout();
      await signOut(auth);
      setUser(null);
      setFirebaseUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    if (firebaseUser) {
      try {
        const response = await authService.getProfile();
        setUser(response.data?.user || null);
      } catch (error) {
        console.error('Refresh user error:', error);
      }
    }
  };

  const value: AuthContextType = {
    user,
    firebaseUser,
    loading,
    login,
    loginWithGoogle,
    logout,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

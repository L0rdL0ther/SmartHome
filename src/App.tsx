import { useState, useEffect } from 'react'
import Login from './components/auth/Login'
import SignUp from './components/auth/SignUp'
import HomeDashboard from './components/dashboard/HomeDashboard'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');

  // Check if user is already logged in (has token)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  // Auth handlers
  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleSignUpSuccess = () => {
    setAuthView('login');
  };
  
  const navigateToSignUp = () => {
    setAuthView('signup');
  };
  
  const navigateToLogin = () => {
    setAuthView('login');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    localStorage.removeItem('selectedHomeId');
    sessionStorage.removeItem('selectedHomeData');
    
    // Reset URL to base
    window.history.pushState({}, '', '/');
    
    setIsLoggedIn(false);
    setAuthView('login');
  };

  // If not logged in, show login or signup screen
  if (!isLoggedIn) {
    return authView === 'login' 
      ? <Login onLoginSuccess={handleLoginSuccess} onNavigateToSignUp={navigateToSignUp} /> 
      : <SignUp onSignUpSuccess={handleSignUpSuccess} onNavigateToLogin={navigateToLogin} />;
  }

  // If logged in, show the homes dashboard with URL-based navigation support
  return <HomeDashboard onLogout={handleLogout} />;
}

export default App;

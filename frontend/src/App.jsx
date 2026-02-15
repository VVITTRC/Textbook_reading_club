import { useState, useEffect } from 'react';
import Login from './components/Login';
import CohortSelection from './pages/CohortSelection';
import AdminDashboard from './pages/AdminDashboard';
import Reader from './pages/Reader';

function App() {
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [selectedCohort, setSelectedCohort] = useState(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    const storedRole = localStorage.getItem('userRole');
    if (storedUserId && storedRole) {
      setUserId(parseInt(storedUserId));
      setUserRole(storedRole);
    }
  }, []);

  const handleLogin = (id, role) => {
    setUserId(id);
    setUserRole(role);
  };

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');
    setUserId(null);
    setUserRole(null);
    setSelectedCohort(null);
  };

  const handleCohortSelected = (cohort) => {
    setSelectedCohort(cohort);
  };

  const handleBackToCohorts = () => {
    setSelectedCohort(null);
  };

  // Not logged in
  if (!userId || !userRole) {
    return <Login onLogin={handleLogin} />;
  }

  // Admin view
  if (userRole === 'admin') {
    return <AdminDashboard userId={userId} onLogout={handleLogout} />;
  }

  // User view - cohort selected
  if (selectedCohort) {
    return (
      <Reader
        userId={userId}
        cohort={selectedCohort}
        onBack={handleBackToCohorts}
        onLogout={handleLogout}
      />
    );
  }

  // User view - cohort selection
  return (
    <CohortSelection
      userId={userId}
      onCohortSelected={handleCohortSelected}
      onLogout={handleLogout}
    />
  );
}

export default App;
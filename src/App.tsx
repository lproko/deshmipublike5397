import { useState, useEffect } from "react";
import "./App.css";
import Login from "./components/Login";
import Calendar from "./components/Calendar";
import userService from "./services/userService";

function App() {
  const [user, setUser] = useState<any>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const currentUser = userService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  const handleLogin = (loggedInUser: any) => {
    setUser(loggedInUser);
    userService.setCurrentUser(loggedInUser);
  };

  const handleLogout = () => {
    setUser(null);
    userService.setCurrentUser(null);
    setShowMenu(false);
  };

  // Function to get user initials from name
  const getUserInitials = (name: string) => {
    if (!name) return "";

    const nameParts = name.split(" ");
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();

    return (
      nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)
    ).toUpperCase();
  };

  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Stendat e Kongrekacionit</h1>
        <h2>Mire se erdhe {user?.name}</h2>
        {user && (
          <div className="user-controls">
            <div className="avatar" onClick={toggleMenu}>
              {getUserInitials(user.name)}
            </div>
            {showMenu && (
              <div className="avatar-menu">
                <button className="logout-button" onClick={handleLogout}>
                  Dilni
                </button>
              </div>
            )}
          </div>
        )}
      </header>
      <main>
        {user ? (
          <div className="calendar-wrapper">
            <Calendar />
          </div>
        ) : (
          <Login onLogin={handleLogin} />
        )}
      </main>
    </div>
  );
}

export default App;

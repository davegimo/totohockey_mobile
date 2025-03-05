import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from '../services/supabase';
import '../styles/Header.css';

type HeaderProps = {
  isLoggedIn: boolean;
  userName?: string;
  isAdmin?: boolean;
};

const Header = ({ isLoggedIn, userName, isAdmin = false }: HeaderProps) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  // Chiudi il menu quando si clicca fuori
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node) && 
          !(event.target as Element).classList.contains('burger-button')) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Menu per desktop
  const desktopNavLinks = isLoggedIn ? (
    <>
      <Link to="/dashboard" className="nav-link">Partite</Link>
      <Link to="/classifica" className="nav-link">Classifica</Link>
      <Link to="/regole" className="nav-link">Regole</Link>
      {isAdmin && (
        <Link to="/admin" className="nav-link admin-link">Admin</Link>
      )}
      <div className="user-dropdown" ref={menuRef}>
        <button 
          className="user-icon-btn" 
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu utente"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
          </svg>
        </button>
        {menuOpen && (
          <div className="dropdown-menu">
            <div className="dropdown-header">
              <span>{userName}</span>
            </div>
            <Link to="/profile" className="dropdown-item" onClick={() => setMenuOpen(false)}>
              Profilo
            </Link>
            <button onClick={handleLogout} className="dropdown-item logout-item">
              Logout
            </button>
          </div>
        )}
      </div>
    </>
  ) : (
    <>
      <Link to="/login" className="nav-link">Accedi</Link>
      <Link to="/signup" className="nav-link button">Registrati</Link>
    </>
  );

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="logo">
            <Link to={isLoggedIn ? '/dashboard' : '/'}>
              <h1>Totohockey</h1>
            </Link>
          </div>
          
          <nav className="nav desktop-nav">
            {desktopNavLinks}
          </nav>
          
          <div className="mobile-menu-container" ref={mobileMenuRef}>
            <button 
              className={`burger-button ${mobileMenuOpen ? 'open' : ''}`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
            
            {mobileMenuOpen && (
              <div className="mobile-dropdown-menu">
                {isLoggedIn ? (
                  <>
                    <div className="dropdown-header">
                      <span>{userName}</span>
                    </div>
                    <Link to="/dashboard" className="dropdown-item" onClick={() => setMobileMenuOpen(false)}>
                      Partite
                    </Link>
                    <Link to="/classifica" className="dropdown-item" onClick={() => setMobileMenuOpen(false)}>
                      Classifica
                    </Link>
                    <Link to="/regole" className="dropdown-item" onClick={() => setMobileMenuOpen(false)}>
                      Regole
                    </Link>
                    {isAdmin && (
                      <Link to="/admin" className="dropdown-item admin-item" onClick={() => setMobileMenuOpen(false)}>
                        Admin
                      </Link>
                    )}
                    <Link to="/profile" className="dropdown-item" onClick={() => setMobileMenuOpen(false)}>
                      Profilo
                    </Link>
                    <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="dropdown-item logout-item">
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="dropdown-item" onClick={() => setMobileMenuOpen(false)}>
                      Accedi
                    </Link>
                    <Link to="/signup" className="dropdown-item signup-item" onClick={() => setMobileMenuOpen(false)}>
                      Registrati
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 
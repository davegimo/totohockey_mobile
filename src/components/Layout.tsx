import { ReactNode, useEffect, useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import { useSession } from '../context/SessionContext';
import { isAdmin } from '../services/supabase';
import '../styles/Layout.css';

type LayoutProps = {
  children: ReactNode;
};

const Layout = ({ children }: LayoutProps) => {
  const { session } = useSession();
  const isLoggedIn = !!session;
  const userName = session?.user?.user_metadata?.nome || 'Utente';
  const [isAdminUser, setIsAdminUser] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (isLoggedIn) {
        const adminStatus = await isAdmin();
        setIsAdminUser(adminStatus);
      } else {
        setIsAdminUser(false);
      }
    };
    
    checkAdminStatus();
  }, [isLoggedIn]);

  return (
    <div className="layout">
      <Header 
        isLoggedIn={isLoggedIn} 
        userName={isLoggedIn ? userName : undefined}
        isAdmin={isAdminUser}
      />
      <main className="main-content">
        <div className="container">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Layout; 
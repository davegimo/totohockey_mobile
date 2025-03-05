import '../styles/Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <p>&copy; {currentYear} TotoHockey - Tutti i diritti riservati</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 
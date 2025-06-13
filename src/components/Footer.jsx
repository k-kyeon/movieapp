const Footer = () => {
  return (
    <footer className="footer">
      {/* Divider */}
      <div className="divider" />

      {/* Social Section */}
      <section className="footer-social">
        <h2>Follow us on social</h2>
        <div className="social-container">
          <div className="tt-container">
            <img src="tik-tok.png" alt="TikTok" />
          </div>
          <div className="x-container">
            <img src="twitter.png" alt="Twitter" />
          </div>
          <div className="yt-container">
            <img src="youtube.png" alt="YouTube" />
          </div>
          <div className="fb-container">
            <img src="facebook.png" alt="Facebook" />
          </div>
          <div className="ig-container">
            <img src="instagram.png" alt="Instagram" />
          </div>
        </div>
      </section>

      {/* Links Section */}
      <div className="links">
        <h3>Help</h3>
        <h3>About</h3>
        <h3>License</h3>
        <h3>Privacy Policy</h3>
      </div>

      {/* Branding */}
      <div className="branding">
        <h3>&copy; {new Date().getFullYear()} Company Name</h3>
      </div>
    </footer>
  );
};

export default Footer;

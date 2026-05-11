import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const Footer = () => {
  const { primaryColor } = useTheme();
  const currentYear = new Date().getFullYear();

  return (
    <footer
      style={{
        background: '#fff',
        borderTop: '1px solid #eee',
        padding: '12px 24px',
        margin: '0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px',
        fontSize: '13px',
        color: '#666'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span>&copy; {currentYear}</span>
        <span className="powered-by-branding" style={{ color: primaryColor, fontWeight: '600' }}>RMS</span>
        <span>- All Rights Reserved</span>
      </div>
    </footer>
  );
};

export default Footer;

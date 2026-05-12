
import React from 'react';
import { Container } from 'react-bootstrap';

const Footer = () => {
  return (
    <footer className="footer-glass">
      <Container className="d-flex flex-column flex-md-row justify-content-between align-items-center py-3">
        <div className="brand-gradient fw-bold">AR-RAHEEM INTERNATIONAL COLLEGE</div>
        <div className="text-center text-md-end small">
          <div>09086081997</div>
          <div>aic.ilorin@gmail.com</div>
          <div className="muted">© {new Date().getFullYear()} All rights reserved</div>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;

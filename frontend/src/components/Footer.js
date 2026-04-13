
import React from 'react';
import { Container } from 'react-bootstrap';

const Footer = () => {
  return (
    <footer className="footer-glass">
      <Container className="d-flex justify-content-between align-items-center py-3">
        <div className="brand-gradient fw-bold">ExamPro</div>
        <div className="muted small">© {new Date().getFullYear()} All rights reserved</div>
      </Container>
    </footer>
  );
};

export default Footer;

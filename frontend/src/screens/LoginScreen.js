
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Form, Button, Alert } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { login } from '../store/slices/userSlice';
import Message from '../components/Message';
import Loader from '../components/Loader';
import logo from '../asset/ics.jpeg';

const LoginScreen = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error, userInfo } = useSelector((state) => state.user);
  const redirect = location.search ? location.search.split('=')[1] : '/';

  useEffect(() => {
    if (userInfo) {
      const adminRoles = ['Admin', 'Super Admin', 'Moderator'];
      if (userInfo.role && adminRoles.includes(userInfo.role)) {
        navigate('/admin');
      } else {
        navigate(redirect);
      }
    }
  }, [navigate, userInfo, redirect]);

  const submitHandler = (e) => {
    e.preventDefault();
    const trimmedIdentifier = identifier.trim();
    if (!trimmedIdentifier || !password) return;

    const isEmail = trimmedIdentifier.includes('@');
    const credentials = isEmail
      ? { email: trimmedIdentifier.toLowerCase(), password }
      : { admissionNumber: trimmedIdentifier, surname: password };

    dispatch(login(credentials));
  };

  return (
    <div className="auth-hero">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="glass-card">
        <div className="brand text-center">
          <img src={logo} alt="AR-RAHEEM Logo" className="school-logo mb-3" style={{ width: '76px', height: '76px' }} />
          <h2 className="brand-title">AR-RAHEEM INTERNATIONAL COLLEGE</h2>
          <p className="brand-sub">"AIC...normalising excellence" </p>
        </div>
        {error && <Message variant="danger">{error}</Message>}
        {loading && <Loader />}
        
        <Alert variant="info" className="mb-4">
          <div className="mb-2">
            <strong>👤 How to Sign In:</strong>
          </div>
          <div className="mb-2">
            <strong>Students:</strong> Enter your Admission Number + your Surname
          </div>
          <div>
            <strong>Staff & Admin:</strong> Enter your Email + your Password
          </div>
        </Alert>

        <Form onSubmit={submitHandler}>
          <Form.Group controlId="identifier" className="mb-3">
            <Form.Label>Admission Number or Email</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter your admission number or email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="input-elevate"
              required
            />
          </Form.Group>
          <Form.Group controlId="password" className="mb-2">
            <Form.Label>Surname or Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Enter your surname or password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-elevate"
              required
            />
          </Form.Group>
          <motion.div whileTap={{ scale: 0.98 }}>
            <Button type="submit" className="btn-gradient w-100">Sign In</Button>
          </motion.div>
        </Form>
      </motion.div>
    </div>
  );
};

export default LoginScreen;

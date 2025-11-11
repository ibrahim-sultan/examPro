
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Form, Button } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { login } from '../store/slices/userSlice';
import Message from '../components/Message';
import Loader from '../components/Loader';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error, userInfo } = useSelector((state) => state.user);
  const redirect = location.search ? location.search.split('=')[1] : '/dashboard';

  useEffect(() => {
    if (userInfo) {
      // If admin, go to admin dashboard; else go to redirect/default
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
    dispatch(login({ email, password }));
  };

  return (
    <div className="auth-hero">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="glass-card">
        <div className="brand">
          <div className="logo-circle">EP</div>
          <h2 className="brand-title">ExamPro</h2>
          <p className="brand-sub">Smart, secure testing platform</p>
        </div>
        {error && <Message variant="danger">{error}</Message>}
        {loading && <Loader />}
        <Form onSubmit={submitHandler}>
          <Form.Group controlId="email" className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-elevate"
              required
            />
          </Form.Group>
          <Form.Group controlId="password" className="mb-2">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="••••••••"
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

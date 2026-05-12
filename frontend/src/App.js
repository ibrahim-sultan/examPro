import React from 'react';
import { HashRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Container } from 'react-bootstrap';
import Header from './components/Header';
import Footer from './components/Footer';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import ProfileScreen from './screens/ProfileScreen';
import UserListScreen from './screens/admin/UserListScreen';
import UserEditScreen from './screens/admin/UserEditScreen';
import StudentDashboardScreen from './screens/StudentDashboardScreen';
import GroupListScreen from './screens/admin/GroupListScreen';
import GroupDetailScreen from './screens/admin/GroupDetailScreen';
import GroupEditScreen from './screens/admin/GroupEditScreen';
import CreateGroupScreen from './screens/CreateGroupScreen';
import ExamListScreen from './screens/admin/ExamListScreen';
import ExamEditScreen from './screens/admin/ExamEditScreen';
import QuestionListScreen from './screens/admin/QuestionListScreen';
import QuestionEditScreen from './screens/admin/QuestionEditScreen';
import MonitoringScreen from './screens/admin/MonitoringScreen';
import BulkUploadScreen from './screens/admin/BulkUploadScreen';
import ExamDetailsScreen from './screens/ExamDetailsScreen';
import ExamTakeScreen from './screens/ExamTakeScreen';
import ResultScreen from './screens/ResultScreen';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import PageTransition from './components/PageTransition';
import AdminLayout from './components/AdminLayout';
import AdminDashboardScreen from './screens/admin/AdminDashboardScreen';
import { useDispatch } from 'react-redux';
import { refreshSessionUser } from './store/slices/userSlice';

const AppRoutes = () => {
  const location = useLocation();
  const { userInfo } = useSelector((state) => state.user);
  const adminRoles = ['Admin', 'Super Admin', 'Moderator'];
  const defaultRedirect =
    userInfo && userInfo.role && adminRoles.includes(userInfo.role)
      ? '/admin'
      : '/dashboard';

  return (
    <Container>
      <PageTransition routeKey={location.pathname}>
        <Routes location={location} key={location.pathname}>
          {/* Redirect root and auth routes to the correct dashboard when already logged in */}
          <Route
            path="/"
            element={userInfo ? <Navigate to={defaultRedirect} replace /> : <LoginScreen />}
          />
          <Route
            path="/login"
            element={userInfo ? <Navigate to={defaultRedirect} replace /> : <LoginScreen />}
          />
          <Route
            path="/register"
            element={userInfo ? <Navigate to={defaultRedirect} replace /> : <RegisterScreen />}
          />
          <Route path="/exam/:id" element={<ExamDetailsScreen />} />

          {/* Private Routes */}
          <Route path="" element={<PrivateRoute />}>
            <Route path="/dashboard" element={<StudentDashboardScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />
            <Route path="/exam/:id/take" element={<ExamTakeScreen />} />
            <Route path="/results/:id" element={<ResultScreen />} />
          </Route>

          {/* Admin Routes (wrapped in AdminLayout) */}
          <Route path="" element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboardScreen />} />
              <Route path="/admin/userlist" element={<UserListScreen />} />
              <Route path="/admin/user/:id/edit" element={<UserEditScreen />} />
              <Route path="/admin/grouplist" element={<GroupListScreen />} />
              <Route path="/admin/group/:id/view" element={<GroupDetailScreen />} />
              <Route path="/admin/group/create" element={<CreateGroupScreen />} />
              <Route path="/admin/group/:id/edit" element={<GroupEditScreen />} />
              <Route path="/admin/examlist" element={<ExamListScreen />} />
              <Route path="/admin/exam/create" element={<ExamEditScreen />} />
              <Route path="/admin/exam/:id/edit" element={<ExamEditScreen />} />
              <Route path="/admin/questionlist" element={<QuestionListScreen />} />
              <Route path="/admin/question/create" element={<QuestionEditScreen />} />
              <Route path="/admin/question/:id/edit" element={<QuestionEditScreen />} />
              <Route path="/admin/monitoring" element={<MonitoringScreen />} />
              <Route path="/admin/bulk" element={<BulkUploadScreen />} />
            </Route>
          </Route>

          {/* Fallback: redirect any unknown route to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </PageTransition>
    </Container>
  );
};

const AppShell = () => {
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.user);
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');

  React.useEffect(() => {
    if (
      userInfo?.token &&
      userInfo.role === 'Student' &&
      !userInfo.admissionNumber
    ) {
      dispatch(refreshSessionUser());
    }
  }, [dispatch, userInfo]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {!isAdminPath && <Header />}
      <main className="py-3" style={{ flex: 1 }}>
        <AppRoutes />
      </main>
      <Footer />
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AppShell />
    </Router>
  );
};

export default App;

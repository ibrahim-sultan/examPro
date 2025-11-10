import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import Header from './components/Header';
import Footer from './components/Footer';
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import ProfileScreen from './screens/ProfileScreen';
import UserListScreen from './screens/UserListScreen';
import UserEditScreen from './screens/UserEditScreen';
import GroupListScreen from './screens/admin/GroupListScreen';
import GroupEditScreen from './screens/admin/GroupEditScreen';
import ExamListScreen from './screens/admin/ExamListScreen';
import ExamEditScreen from './screens/admin/ExamEditScreen';
import QuestionListScreen from './screens/admin/QuestionListScreen';
import QuestionEditScreen from './screens/admin/QuestionEditScreen';
import ExamDetailsScreen from './screens/ExamDetailsScreen';
import ExamTakeScreen from './screens/ExamTakeScreen';
import ResultScreen from './screens/ResultScreen';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';

const App = () => {
  return (
    <Router>
      <Header />
      <main className="py-3">
        <Container>
          <Routes>
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/register" element={<RegisterScreen />} />
            <Route path="/" element={<HomeScreen />} />
            <Route path="/exam/:id" element={<ExamDetailsScreen />} />

            {/* Private Routes */}
            <Route path="" element={<PrivateRoute />}>
              <Route path="/profile" element={<ProfileScreen />} />
              <Route path="/exam/:id/take" element={<ExamTakeScreen />} />
              <Route path="/results/:id" element={<ResultScreen />} />
            </Route>

            {/* Admin Routes */}
            <Route path="" element={<AdminRoute />}>
              <Route path="/admin/userlist" element={<UserListScreen />} />
              <Route path="/admin/user/:id/edit" element={<UserEditScreen />} />
              <Route path="/admin/grouplist" element={<GroupListScreen />} />
              <Route path="/admin/group/:id/edit" element={<GroupEditScreen />} />
              <Route path="/admin/examlist" element={<ExamListScreen />} />
              <Route path="/admin/exam/:id/edit" element={<ExamEditScreen />} />
              <Route path="/admin/questionlist" element={<QuestionListScreen />} />
              <Route path="/admin/question/create" element={<QuestionEditScreen />} />
              <Route path="/admin/question/:id/edit" element={<QuestionEditScreen />} />
            </Route>
          </Routes>
        </Container>
      </main>
      <Footer />
    </Router>
  );
};

export default App;
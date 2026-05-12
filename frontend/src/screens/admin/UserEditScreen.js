
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Form, Button } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import Message from '../../components/Message';
import Loader from '../../components/Loader';
import FormContainer from '../../components/FormContainer';
import { getUserDetails, updateUser, resetUserUpdate } from '../../store/slices/userSlice';
import axios from 'axios';
import API_BASE_URL from '../../config/api';

const UserEditScreen = () => {
  const { id: userId } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [classLevel, setClassLevel] = useState('');
  const [department, setDepartment] = useState('');
  const [subjects, setSubjects] = useState('');
  const [isActive, setIsActive] = useState(true);

  const dispatch = useDispatch();

  const { userDetails, userUpdate, userInfo } = useSelector((state) => state.user);
  const { loading, error, user } = userDetails || {};
  const {
    loading: loadingUpdate,
    error: errorUpdate,
    success: successUpdate,
  } = userUpdate || {};

  useEffect(() => {
    const adminRoles = ['Admin', 'Super Admin', 'Moderator'];
    if (!userInfo || !userInfo.role || !adminRoles.includes(userInfo.role)) {
      navigate('/login');
      return;
    }

    if (successUpdate) {
      dispatch(resetUserUpdate());
      navigate('/admin/userlist');
    } else {
      if (!user || user._id !== userId) {
        dispatch(getUserDetails(userId));
      } else {
        setName(user.name);
        setEmail(user.email);
        setIsAdmin(user.isAdmin);
        setClassLevel(user.classLevel || '');
        setDepartment(user.department || '');
        setSubjects(Array.isArray(user.subjects) ? user.subjects.join(', ') : '');
      }
    }
  }, [dispatch, navigate, userId, user, successUpdate, userInfo]);

  const submitHandler = (e) => {
    e.preventDefault();
    const updateData = { _id: userId, name, email, isAdmin };
    updateData.classLevel = classLevel;
    updateData.department = department;
    updateData.subjects = subjects.split(',').map((s) => s.trim()).filter(Boolean);
    if (user?.role === 'Student') updateData.isActive = isActive;
    dispatch(updateUser(updateData));
  };

  return (
    <>
      <Link to="/admin/userlist" className="btn btn-light my-3">
        Go Back
      </Link>
      <FormContainer>
        <h1>Edit User</h1>
        {loadingUpdate && <Loader />}
        {errorUpdate && <Message variant="danger">{errorUpdate}</Message>}
        {loading ? (
          <Loader />
        ) : error ? (
          <Message variant="danger">{error}</Message>
        ) : (
          <Form onSubmit={submitHandler}>
            <Form.Group controlId="name">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="name"
                placeholder="Enter name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              ></Form.Control>
            </Form.Group>

            <Form.Group controlId="email">
              <Form.Label>Email Address</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              ></Form.Control>
            </Form.Group>

            <>
              <Form.Group controlId="subjects">
                <Form.Label>Subjects (comma separated)</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Biology, Chemistry"
                  value={subjects}
                  onChange={(e) => setSubjects(e.target.value)}
                />
              </Form.Group>
            </>
            {user?.role === 'Student' && (
              <>
                <Form.Group controlId="passportPhoto" className="mb-2">
                  <Form.Label>Passport Photo</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const fd = new FormData();
                        fd.append('image', file);
                        await axios.post(`${API_BASE_URL}/api/users/${userId}/passport`, fd, {
                          headers: { Authorization: `Bearer ${userInfo?.token}` },
                        });
                        dispatch(getUserDetails(userId));
                      } catch (err) {
                        alert(err.response?.data?.message || 'Passport upload failed');
                      }
                    }}
                  />
                  {user?.passportPhoto && (
                    <div className="mt-2">
                      <img
                        src={`${API_BASE_URL}${user.passportPhoto}`}
                        alt="Passport"
                        style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover' }}
                      />
                    </div>
                  )}
                </Form.Group>
                <Form.Group controlId="classLevel">
                  <Form.Label>Class Level</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter class level (e.g. JSS1, SS1)"
                    value={classLevel}
                    onChange={(e) => setClassLevel(e.target.value)}
                  ></Form.Control>
                </Form.Group>

                <Form.Group controlId="department">
                  <Form.Label>Department</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter department (General, Science, Art, Commercial)"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  ></Form.Control>
                </Form.Group>

                <Form.Group controlId="isActive">
                  <Form.Check
                    type="checkbox"
                    label="Active Student"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  ></Form.Check>
                </Form.Group>
              </>
            )}

            <Form.Group controlId="isadmin">
              <Form.Check
                type="checkbox"
                label="Is Admin"
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
              ></Form.Check>
            </Form.Group>

            <Button type="submit" variant="primary" className="mt-3">
              Update
            </Button>
          </Form>
        )}
      </FormContainer>
    </>
  );
};

export default UserEditScreen;

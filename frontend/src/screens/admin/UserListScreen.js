
import React, { useEffect } from 'react';
import { LinkContainer } from 'react-router-bootstrap';
import { Table, Button } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../../config/api';
import Message from '../../components/Message';
import Loader from '../../components/Loader';
import { listUsers, deleteUser } from '../../store/slices/userSlice';

const UserListScreen = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const userList = useSelector((state) => state.user.userList);
  const { loading, error, users } = userList || {};

  const { userInfo } = useSelector((state) => state.user);

  const userDelete = useSelector((state) => state.user.userDelete);
  const { success: successDelete } = userDelete || {};

  useEffect(() => {
    const adminRoles = ['Admin', 'Super Admin', 'Moderator'];
    if (userInfo && userInfo.role && adminRoles.includes(userInfo.role)) {
      dispatch(listUsers());
    } else {
      navigate('/login');
    }
  }, [dispatch, navigate, userInfo, successDelete]);

  const deleteHandler = (id) => {
    if (window.confirm('Are you sure')) {
      dispatch(deleteUser(id));
    }
  };

  const uploadPassportHandler = async (userId, file) => {
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append('image', file);
      await axios.post(`${API_BASE_URL}/api/users/${userId}/passport`, fd, {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      });
      dispatch(listUsers());
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to upload passport');
    }
  };

  return (
    <>
      <h1>Users</h1>
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : (
        <Table striped bordered hover responsive className="table-sm">
          <thead>
            <tr>
              <th>ID</th>
              <th>NAME</th>
              <th>EMAIL</th>
              <th>ROLE/TYPE</th>
              <th>PASSPORT</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users && users.map((user) => (
              <tr key={user._id}>
                <td>{user._id}</td>
                <td>{user.name}</td>
                <td>
                  <a href={`mailto:${user.email}`}>{user.email}</a>
                </td>
                <td>
                  {user.role || user.accountType || 'User'}
                </td>
                <td>
                  {String(user.role || '').toLowerCase() === 'student' ? (
                    <>
                      <input
                        id={`passport-upload-${user._id}`}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) =>
                          uploadPassportHandler(user._id, e.target.files?.[0])
                        }
                      />
                      <Button
                        variant={user.passportPhoto ? 'success' : 'secondary'}
                        className="btn-sm"
                        onClick={() =>
                          document.getElementById(`passport-upload-${user._id}`)?.click()
                        }
                      >
                        {user.passportPhoto ? 'Update Passport' : 'Upload Passport'}
                      </Button>
                    </>
                  ) : (
                    '-'
                  )}
                </td>
                <td>
                  <LinkContainer to={`/admin/user/${user._id}/edit`}>
                    <Button variant="light" className="btn-sm">
                      <i className="fas fa-edit"></i>
                    </Button>
                  </LinkContainer>
                  <Button
                    variant="danger"
                    className="btn-sm"
                    onClick={() => deleteHandler(user._id)}
                  >
                    <i className="fas fa-trash"></i>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
};

export default UserListScreen;

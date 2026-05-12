import React, { useEffect, useState } from 'react';
import { LinkContainer } from 'react-router-bootstrap';
import { Table, Button } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import Message from '../components/Message';
import Loader from '../components/Loader';
import { listUsers, deleteUser, bulkDeleteUsers } from '../store/slices/adminSlice'; // Import bulkDeleteUsers
import { useNavigate } from 'react-router-dom';

const UserListScreen = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [selectedUsers, setSelectedUsers] = useState(new Set());

  const { userList, loading, error, successCreate, successDelete, loadingDelete, errorDelete, loadingBulkDelete, errorBulkDelete, successBulkDelete } = useSelector(
    (state) => state.admin
  );
  const { userInfo } = useSelector((state) => state.user);

  useEffect(() => {
    if (userInfo && userInfo.role === 'Super Admin') {
      // Re-fetch users on successful creation or deletion
      dispatch(listUsers());
    } else {
      navigate('/login');
    }
  }, [dispatch, navigate, userInfo, successCreate, successDelete, successBulkDelete]); // Add successBulkDelete dependency

  // Clear selections after successful bulk delete
  useEffect(() => {
    if (successBulkDelete) {
      setSelectedUsers(new Set());
    }
  }, [successBulkDelete]);

  const deleteHandler = (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      dispatch(deleteUser(id));
    }
  };

  const handleSelectUser = (id) => {
    const newSelectedUsers = new Set(selectedUsers);
    if (newSelectedUsers.has(id)) {
      newSelectedUsers.delete(id);
    } else {
      newSelectedUsers.add(id);
    }
    setSelectedUsers(newSelectedUsers);
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === userList.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(userList.map((user) => user._id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedUsers.size === 0) {
      alert('Please select at least one user to delete');
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedUsers.size} user(s)? This action cannot be undone.`)) {
      dispatch(bulkDeleteUsers(Array.from(selectedUsers)));
    }
  };

  return (
    <>
      <h1>Users</h1>
      {(loadingDelete || loadingBulkDelete) && <Loader />}
      {(errorDelete || errorBulkDelete) && <Message variant="danger">{errorDelete || errorBulkDelete}</Message>}
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : (
        <>
          {selectedUsers.size > 0 && (
            <div className="mb-3">
              <Button
                variant="danger"
                onClick={handleBulkDelete}
                disabled={loadingBulkDelete}
              >
                <i className="fas fa-trash"></i> Delete Selected ({selectedUsers.size})
              </Button>
            </div>
          )}
          <Table striped bordered hover responsive className="table-sm">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={selectedUsers.size === userList.length && userList.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>ID</th>
                <th>NAME</th>
                <th>EMAIL</th>
                <th>ROLE</th>
                <th>CLASS</th>
                <th>DEPARTMENT</th>
                <th>ACTIVE</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {userList.map((user) => (
                <tr key={user._id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(user._id)}
                      onChange={() => handleSelectUser(user._id)}
                    />
                  </td>
                  <td>{user._id}</td>
                  <td>{user.name}</td>
                  <td>
                    <a href={`mailto:${user.email}`}>{user.email}</a>
                  </td>
                  <td>{user.role}</td>
                  <td>{user.classLevel || '-'}</td>
                  <td>{user.department || '-'}</td>
                  <td>
                    {user.isActive ? (
                      <i className="fas fa-check" style={{ color: 'green' }}></i>
                    ) : (
                      <i className="fas fa-times" style={{ color: 'red' }}></i>
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
        </>
      )}
    </>
  );
};

export default UserListScreen;
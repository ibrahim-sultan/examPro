import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Form, Button, Row, Col, Table } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import Message from '../components/Message';
import Loader from '../components/Loader';
import FormContainer from '../components/FormContainer';
import {
  getGroupDetails,
  updateGroup,
  resetUpdateGroup,
  addMemberToGroup,
  removeMemberFromGroup,
} from '../store/slices/groupSlice';
import { listUsers } from '../store/slices/userSlice';

const GroupEditScreen = () => {
  const { id: groupId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedUser, setSelectedUser] = useState('');

  const {
    groupDetails,
    loadingDetails,
    errorDetails,
    loadingUpdate,
    errorUpdate,
    successUpdate,
  } = useSelector((state) => state.group);

  const { users: allUsers, loading: loadingUsers } = useSelector(
    (state) => state.user
  );

  useEffect(() => {
    dispatch(listUsers()); // Fetch all users for the dropdown
    if (successUpdate) {
      dispatch(resetUpdateGroup());
      navigate('/admin/grouplist');
    } else {
      if (!groupDetails.name || groupDetails._id !== groupId) {
        dispatch(getGroupDetails(groupId));
      } else {
        setName(groupDetails.name);
        setDescription(groupDetails.description);
      }
    }
  }, [dispatch, navigate, groupId, groupDetails, successUpdate]);

  const submitHandler = (e) => {
    e.preventDefault();
    dispatch(updateGroup({ _id: groupId, name, description }));
  };

  const addMemberHandler = () => {
    if (selectedUser) {
      dispatch(addMemberToGroup({ groupId, userId: selectedUser }));
      setSelectedUser('');
    }
  };

  const removeMemberHandler = (userId) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
      dispatch(removeMemberFromGroup({ groupId, userId }));
    }
  };

  const availableUsers =
    allUsers.filter(
      (user) =>
        !groupDetails.members.some((member) => member._id === user._id)
    ) || [];

  return (
    <>
      <Link to="/admin/grouplist" className="btn btn-light my-3">
        Go Back
      </Link>
      <Row>
        <Col md={4}>
          <FormContainer>
            <h2>Edit Class Details</h2>
            {loadingUpdate && <Loader />}
            {errorUpdate && <Message variant="danger">{errorUpdate}</Message>}
            {loadingDetails ? (
              <Loader />
            ) : errorDetails ? (
              <Message variant="danger">{errorDetails}</Message>
            ) : (
              <Form onSubmit={submitHandler}>
                <Form.Group controlId="name" className="my-3">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter group name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  ></Form.Control>
                </Form.Group>

                <Form.Group controlId="description" className="my-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Enter description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  ></Form.Control>
                </Form.Group>

                <Button type="submit" variant="primary" className="mt-3">
                  Update Details
                </Button>
              </Form>
            )}
          </FormContainer>
        </Col>
        <Col md={8}>
          <h2>Class Members</h2>

          {/* Add Member Form */}
          <Row className="mb-3 align-items-end">
            <Col md={8}>
              <Form.Group controlId="user">
                <Form.Label>Add User to Group</Form.Label>
                {loadingUsers ? (
                  <Loader />
                ) : (
                  <Form.Select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                  >
                    <option value="">-- Select a user to add --</option>
                    {availableUsers.map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </Form.Select>
                )}
              </Form.Group>
            </Col>
            <Col md={4}>
              <Button
                type="button"
                variant="primary"
                onClick={addMemberHandler}
                disabled={!selectedUser}
                className="w-100"
              >
                Add Member
              </Button>
            </Col>
          </Row>

          {/* Members List */}
          <h3>Current Members</h3>
          {loadingDetails ? (
            <Loader />
          ) : (
            <Table striped bordered hover responsive className="table-sm">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>NAME</th>
                  <th>EMAIL</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {groupDetails.members &&
                  groupDetails.members.map((member) => (
                    <tr key={member._id}>
                      <td>{member._id}</td>
                      <td>{member.name}</td>
                      <td>
                        <a href={`mailto:${member.email}`}>{member.email}</a>
                      </td>
                      <td>
                        <Button
                          variant="danger"
                          className="btn-sm"
                          onClick={() => removeMemberHandler(member._id)}
                        >
                          <i className="fas fa-trash"></i>
                        </Button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </Table>
          )}
        </Col>
      </Row>
    </>
  );
};

export default GroupEditScreen;
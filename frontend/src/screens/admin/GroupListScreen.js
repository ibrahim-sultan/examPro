
import React, { useEffect } from 'react';
import { LinkContainer } from 'react-router-bootstrap';
import { Table, Button, Row, Col } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Message from '../../components/Message';
import Loader from '../../components/Loader';
import { listGroups } from '../../store/slices/groupSlice'; // We will create this slice later

const GroupListScreen = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, error, groups } = useSelector((state) => state.group);
  const { userInfo } = useSelector((state) => state.user);

  useEffect(() => {
    const adminRoles = ['Admin', 'Super Admin', 'Moderator'];
    if (userInfo && userInfo.role && adminRoles.includes(userInfo.role)) {
      dispatch(listGroups());
    } else {
      navigate('/login');
    }
  }, [dispatch, navigate, userInfo]);

  const deleteHandler = (id) => {
    if (window.confirm('Are you sure?')) {
      // dispatch(deleteGroup(id)); // Will be implemented later
    }
  };

  const createGroupHandler = () => {
    // dispatch(createGroup()); // Will be implemented later
  };

  return (
    <>
      <Row className="align-items-center">
        <Col>
          <h1>Groups</h1>
        </Col>
        <Col className="text-end">
          <Button className="my-3" onClick={createGroupHandler}>
            <i className="fas fa-plus"></i> Create Group
          </Button>
        </Col>
      </Row>
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error.message || error}</Message>
      ) : (
        <Table striped bordered hover responsive className="table-sm">
          <thead>
            <tr>
              <th>ID</th>
              <th>NAME</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {groups && groups.map((group) => (
              <tr key={group._id}>
                <td>{group._id}</td>
                <td>{group.name}</td>
                <td>
                  <LinkContainer to={`/admin/group/${group._id}/edit`}>
                    <Button variant="light" className="btn-sm">
                      <i className="fas fa-edit"></i>
                    </Button>
                  </LinkContainer>
                  <Button
                    variant="danger"
                    className="btn-sm"
                    onClick={() => deleteHandler(group._id)}
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

export default GroupListScreen;

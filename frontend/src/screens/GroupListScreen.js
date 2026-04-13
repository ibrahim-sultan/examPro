
import React, { useEffect } from 'react';
import { LinkContainer } from 'react-router-bootstrap';
import { Table, Button, Row, Col } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import Message from '../components/Message';
import Loader from '../components/Loader';
import { listGroups, deleteGroup } from '../store/slices/groupSlice';
import { useNavigate } from 'react-router-dom';

const GroupListScreen = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    groupList,
    loading,
    error,
    successCreate,
    loadingDelete,
    errorDelete,
    successDelete,
  } = useSelector((state) => state.group);
  const { userInfo } = useSelector((state) => state.user);

  useEffect(() => {
    if (userInfo && userInfo.role === 'Super Admin') {
      dispatch(listGroups());
    } else {
      navigate('/login');
    }
  }, [dispatch, navigate, userInfo, successCreate, successDelete]);

  const deleteHandler = (id) => {
    if (window.confirm('Are you sure you want to delete this group?')) {
      dispatch(deleteGroup(id));
    }
  };

  return (
    <>
      <Row className="align-items-center">
        <Col>
          <h1>Groups</h1>
        </Col>
        <Col className="text-end">
          <LinkContainer to="/admin/group/create">
            <Button className="my-3">
              <i className="fas fa-plus"></i> Create Group
            </Button>
          </LinkContainer>
        </Col>
      </Row>
      {loadingDelete && <Loader />}
      {errorDelete && <Message variant="danger">{errorDelete}</Message>}
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
              <th>DESCRIPTION</th>
              <th>CREATED BY</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {groupList.map((group) => (
              <tr key={group._id}>
                <td>{group._id}</td>
                <td>{group.name}</td>
                <td>{group.description}</td>
                <td>{group.createdBy?.name}</td>
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

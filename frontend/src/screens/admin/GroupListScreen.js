
import React, { useEffect } from 'react';
import { LinkContainer } from 'react-router-bootstrap';
import { Table, Button, Row, Col } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Message from '../../components/Message';
import Loader from '../../components/Loader';
import { listGroups, deleteGroup } from '../../store/slices/groupSlice';

const GroupListScreen = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, error, groupList } = useSelector((state) => state.group);
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
      dispatch(deleteGroup(id));
    }
  };

  const createGroupHandler = () => {
    navigate('/admin/group/create');
  };

  const classOrder = ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'];
  const sortedGroups = groupList
    ? [...groupList].sort((a, b) => {
        const indexA = classOrder.indexOf(a.name);
        const indexB = classOrder.indexOf(b.name);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.name.localeCompare(b.name);
      })
    : [];

  return (
    <>
      <Row className="align-items-center">
        <Col>
          <h1>Classes</h1>
        </Col>
        <Col className="text-end">
          <Button className="my-3" onClick={createGroupHandler}>
            <i className="fas fa-plus"></i> Create Class
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
              <th>CLASS</th>
              <th>STUDENTS</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sortedGroups.map((group) => (
              <tr key={group._id}>
                <td>{group.name}</td>
                <td>{Array.isArray(group.members) ? group.members.length : 0}</td>
                <td>
                  <LinkContainer to={`/admin/group/${group._id}/view`}>
                    <Button variant="primary" className="btn-sm me-2">
                      View
                    </Button>
                  </LinkContainer>
                  <LinkContainer to={`/admin/group/${group._id}/edit`}>
                    <Button variant="light" className="btn-sm me-2">
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

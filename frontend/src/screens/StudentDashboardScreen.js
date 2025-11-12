import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Row, Col, Card, Button } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useNavigate } from 'react-router-dom';
import Loader from '../components/Loader';
import Message from '../components/Message';
import { listAvailableExams } from '../store/slices/examSlice';
import { logout } from '../store/slices/userSlice';

const StudentDashboardScreen = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.user);
  const examState = useSelector((state) => state.exam) || {};
  const { exams: availableExams = [], error = null, loading = false } = examState;

  useEffect(() => {
    if (userInfo) {
      dispatch(listAvailableExams());
    }
  }, [dispatch, userInfo]);

  const onLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="m-0">Available Exams</h1>
        <Button variant="outline-danger" onClick={onLogout}>Logout</Button>
      </div>
      {loading ? (
        <Loader />)
        : error ? (
          <Message variant="danger">{error}</Message>
        ) : (
          <Row>
            {availableExams.length === 0 ? (
              <p>No exams available at the moment.</p>
            ) : (
              availableExams.map((exam) => (
                <Col key={exam._id} sm={12} md={6} lg={4} xl={3}>
                  <Card className="my-3 p-3 rounded">
                    <Card.Body>
                      <Card.Title as="div">
                        <strong>{exam.title}</strong>
                      </Card.Title>
                      <Card.Text as="p">Subject: {exam.subject}</Card.Text>
                      <Card.Text as="p">{exam.description}</Card.Text>
                      <Card.Text as="p">Duration: {exam.duration} minutes</Card.Text>
                      <LinkContainer to={`/exam/${exam._id}`}>
                        <Button variant="primary">Start Exam</Button>
                      </LinkContainer>
                    </Card.Body>
                  </Card>
                </Col>
              ))
            )}
          </Row>
        )}
    </div>
  );
};

export default StudentDashboardScreen;

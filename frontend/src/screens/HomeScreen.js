
import React, { Fragment, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Row, Col, Card, Button } from "react-bootstrap";
import { LinkContainer } from "react-router-bootstrap";
import Loader from "../components/Loader";
import Message from "../components/Message";
import { listAvailableExams } from "../store/slices/examSlice";

const HomeScreen = () => {
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.user);
  const examState = useSelector((state) => state.exam);
  const { exams: availableExams, error, loading } = examState || { exams: [], error: null, loading: false };

  useEffect(() => {
    if (userInfo && userInfo.role === 'Student') {
      dispatch(listAvailableExams());
    }
  }, [dispatch, userInfo]);

  const renderStudentDashboard = () => (
    <>
      <h1>Available Exams</h1>
      {loading ? (
        <Loader />
      ) : error ? (
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
    </>
  );

  const renderWelcome = () => (
    <div className="text-center">
      <h1>Welcome to ExamPro</h1>
      <p>Your one-stop solution for online examinations.</p>
      {!userInfo && (
        <LinkContainer to="/login">
          <Button variant="primary" size="lg">
            Sign In
          </Button>
        </LinkContainer>
      )}
    </div>
  );

  return userInfo && userInfo.role === 'Student' ? renderStudentDashboard() : renderWelcome();
};

export default HomeScreen;

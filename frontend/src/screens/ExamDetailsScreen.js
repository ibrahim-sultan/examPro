
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Card, Col, ListGroup, Row } from 'react-bootstrap';
import Loader from '../components/Loader';
import Message from '../components/Message';
import { getExamDetails } from '../store/slices/examSlice';

const ExamDetailsScreen = () => {
  const { id: examId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { exam, loading, error } = useSelector((state) => state.exam);
  const { userInfo } = useSelector((state) => state.user);

  useEffect(() => {
    if (!userInfo) {
      navigate('/login');
    } else {
      dispatch(getExamDetails(examId));
    }
  }, [dispatch, examId, userInfo, navigate]);

  const startExamHandler = () => {
    // This will later be used to initiate the exam session
    console.log('Starting exam...');
    navigate(`/exam/${examId}/take`);
  };

  return (
    <>
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : (
        <Row className="justify-content-md-center">
          <Col md={8}>
            <Card>
              <Card.Header as="h2" className="text-center">{exam.title}</Card.Header>
              <Card.Body>
                <Card.Text>{exam.description}</Card.Text>
                <ListGroup variant="flush">
                  <ListGroup.Item>
                    <strong>Subject:</strong> {exam.subject}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>Duration:</strong> {exam.duration} minutes
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>Questions:</strong> {exam.questionCount}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>Instructions:</strong> Read each question carefully. Once you start, the timer will begin. Do not refresh the page.
                  </ListGroup.Item>
                </ListGroup>
                <div className="d-grid mt-4">
                  <Button
                    onClick={startExamHandler}
                    variant="primary"
                    size="lg"
                  >
                    Begin Exam
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </>
  );
};

export default ExamDetailsScreen;

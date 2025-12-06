
import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Card, Col, ListGroup, Row } from 'react-bootstrap';
import Loader from '../components/Loader';
import Message from '../components/Message';
import { getResultDetails } from '../store/slices/resultSlice';

const ResultScreen = () => {
  const { id: resultId } = useParams();
  const dispatch = useDispatch();

  const { activeResult, loading, error } = useSelector((state) => state.result);

  useEffect(() => {
    dispatch(getResultDetails(resultId));
  }, [dispatch, resultId]);

  if (loading) return <Loader />;
  if (error) return <Message variant="danger">{error}</Message>;
  if (!activeResult) return <Message variant="info">No result data found.</Message>;

  const { exam, score, answers } = activeResult;

  return (
    <>
      <Row className="justify-content-md-center text-center">
        <Col md={8}>
          <h2>Exam Results: {exam?.title}</h2>
          <Card className="my-3">
            <Card.Body>
              <Card.Title>
                Your Score: {score} / {answers.length}
              </Card.Title>
              <Card.Text>
                You answered {score} questions correctly out of {answers.length}.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <Row className="justify-content-md-center">
        <Col md={8}>
          <h3>Answer Review</h3>
          <ListGroup variant="flush">
            {answers.map((answer, index) => (
              <ListGroup.Item key={index} variant={answer.isCorrect ? 'success' : 'danger'}>
                <p><strong>Question: </strong>{answer.questionText}</p>
                <p><strong>Your Answer: </strong>{answer.submittedAnswer}</p>
                {!answer.isCorrect && (
                  <p><strong>Correct Answer: </strong>{answer.correctAnswer}</p>
                )}
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Col>
      </Row>
      <Row className="justify-content-md-center my-3">
        <Col md={8} className="text-center">
          <Link to="/exams">
            <Button variant="primary">Back to Exams</Button>
          </Link>
        </Col>
      </Row>
    </>
  );
};

export default ResultScreen;

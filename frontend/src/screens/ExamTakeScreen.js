
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Card, Col, ListGroup, Row, Form } from 'react-bootstrap';
import Loader from '../components/Loader';
import Message from '../components/Message';
import { startExam, submitExam } from '../store/slices/resultSlice';

const ExamTakeScreen = () => {
  const { id: examId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { activeResult, loading, error } = useSelector((state) => state.result);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    if (activeResult && activeResult.status === 'Completed') {
      navigate(`/results/${activeResult._id}`);
    } else {
      dispatch(startExam(examId));
    }
  }, [dispatch, examId, navigate, activeResult]);

  const handleAnswerChange = (questionId, selectedOption) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: selectedOption
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < activeResult.exam.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    if (window.confirm('Are you sure you want to submit your exam?')) {
      dispatch(submitExam({ resultId: activeResult._id, answers }));
    }
  };

  if (loading && !activeResult) return <Loader />;
  if (error) return <Message variant="danger">{error}</Message>;
  if (!activeResult || !activeResult.exam || !activeResult.exam.questions) {
    return <Loader />; // Or a more specific message
  }

  const currentQuestion = activeResult.exam.questions[currentQuestionIndex];

  return (
    <Row className="justify-content-md-center">
      <Col md={8}>
        <Card>
          <Card.Header>
            <h3>{activeResult.exam.title}</h3>
            <p>Question {currentQuestionIndex + 1} of {activeResult.exam.questions.length}</p>
          </Card.Header>
          <Card.Body>
            <h5>{currentQuestion.questionText}</h5>
            <ListGroup>
              {currentQuestion.options.map((option, index) => (
                <ListGroup.Item key={index}>
                  <Form.Check
                    type="radio"
                    id={`option-${index}`}
                    name={`question-${currentQuestion.id}`}
                    label={option}
                    checked={answers[currentQuestion.id] === option}
                    onChange={() => handleAnswerChange(currentQuestion.id, option)}
                  />
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card.Body>
          <Card.Footer>
            <Row>
              <Col>
                <Button 
                  variant="secondary" 
                  onClick={handlePrevious} 
                  disabled={currentQuestionIndex === 0}
                >
                  Previous
                </Button>
              </Col>
              <Col className="text-right">
                {currentQuestionIndex < activeResult.exam.questions.length - 1 ? (
                  <Button variant="primary" onClick={handleNext}>
                    Next
                  </Button>
                ) : (
                  <Button variant="success" onClick={handleSubmit}>
                    Submit Exam
                  </Button>
                )}
              </Col>
            </Row>
          </Card.Footer>
        </Card>
      </Col>
    </Row>
  );
};

export default ExamTakeScreen;

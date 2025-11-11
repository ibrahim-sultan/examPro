import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Card, Col, ListGroup, Row, Form, Badge } from 'react-bootstrap';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';
import Loader from '../components/Loader';
import Message from '../components/Message';
import Timer from '../components/Timer';
import { motion } from 'framer-motion';
import { startExam, submitExam } from '../store/slices/resultSlice';

const ExamTakeScreen = () => {
  const { id: examId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const { activeResult, loading, error } = useSelector((state) => state.result);
  const { userInfo } = useSelector((state) => state.user);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [questionId]: selectedOptionIndex }

  useEffect(() => {
    if (activeResult && activeResult.status === 'Completed') {
      navigate(`/results/${activeResult._id}`);
    } else if (!activeResult) {
      dispatch(startExam(examId));
    }
  }, [dispatch, examId, navigate, activeResult]);

  // Anti-cheat events
  const postEvent = useCallback(async (type) => {
    try {
      if (!activeResult?._id) return;
      await axios.post(
        `${API_BASE_URL}/api/monitor/events`,
        { resultId: activeResult._id, type },
        { headers: { Authorization: `Bearer ${userInfo?.token}` } }
      );
    } catch {}
  }, [activeResult?._id, userInfo?.token]);

  useEffect(() => {
    const onVis = () => postEvent('visibilitychange');
    const onBlur = () => postEvent('blur');
    const onFocus = () => postEvent('focus');
    const onCopy = (e) => { e.preventDefault(); postEvent('copy'); };
    const onPaste = (e) => { e.preventDefault(); postEvent('paste'); };
    const onCut = (e) => { e.preventDefault(); postEvent('cut'); };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    document.addEventListener('copy', onCopy);
    document.addEventListener('paste', onPaste);
    document.addEventListener('cut', onCut);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('paste', onPaste);
      document.removeEventListener('cut', onCut);
    };
  }, [postEvent]);

  const handleAnswerChange = (questionId, selectedIndex) => {
    setAnswers((prev) => ({ ...prev, [questionId]: selectedIndex }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < activeResult.exam.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    if (window.confirm('Are you sure you want to submit your exam?')) {
      dispatch(submitExam({ resultId: activeResult._id, answers }));
    }
  };

  const onTimeUp = () => dispatch(submitExam({ resultId: activeResult._id, answers }));

  if (loading && !activeResult) return <Loader />;
  if (error) return <Message variant="danger">{error}</Message>;
  if (!activeResult?.exam?.questions) return <Loader />;

  const currentQuestion = activeResult.exam.questions[currentQuestionIndex];
  const qid = currentQuestion._id || currentQuestion.id;

  return (
    <Row className="justify-content-md-center">
      <Col md={8}>
        <Card>
          <Card.Header className="d-flex justify-content-between align-items-center">
            <div>
              <h3 className="mb-0">{activeResult.exam.title}</h3>
              <small>Question {currentQuestionIndex + 1} of {activeResult.exam.questions.length}</small>
            </div>
            <Badge bg="light" text="dark">
              <strong>Time Left:</strong> <Timer startTime={activeResult.startTime || Date.now()} durationMinutes={activeResult.exam.duration} onTimeUp={onTimeUp} />
            </Badge>
          </Card.Header>
          <Card.Body>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <h5 className="mb-3">{currentQuestion.questionText}</h5>
              <ListGroup>
                {currentQuestion.options.map((option, index) => (
                  <ListGroup.Item key={index}>
                    <Form.Check
                      type="radio"
                      id={`q-${qid}-opt-${index}`}
                      name={`question-${qid}`}
                      label={option}
                      checked={answers[qid] === index}
                      onChange={() => handleAnswerChange(qid, index)}
                    />
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </motion.div>
          </Card.Body>
          <Card.Footer>
            <Row className="g-2">
              <Col>
                <Button variant="outline-secondary" onClick={handlePrevious} disabled={currentQuestionIndex === 0}>
                  Previous
                </Button>
              </Col>
              <Col className="text-end">
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

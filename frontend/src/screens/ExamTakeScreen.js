import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Card, Col, ListGroup, Row, Form, Badge } from 'react-bootstrap';
import axios from 'axios';
import API_BASE_URL from '../config/api';
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
      // After a student submits an exam, send them back to the dashboard
      // instead of showing the detailed result view.
      if (userInfo?.role === 'Student') {
        navigate('/dashboard');
      } else {
        navigate(`/results/${activeResult._id}`);
      }
    } else if (!activeResult) {
      dispatch(startExam(examId));
    }
  }, [dispatch, examId, navigate, activeResult, userInfo]);

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

  const questions = activeResult.exam.questions;
  const currentQuestion = questions[currentQuestionIndex];
  const qid = currentQuestion._id || currentQuestion.id;

  const goToQuestion = (index) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
    }
  };

  return (
    <Row className="justify-content-md-center exam-take-shell">
      <Col md={9} lg={8}>
        <Card className="shadow-lg exam-card">
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
            <Row className="g-2 align-items-center">
              <Col xs={12} md={6} className="mb-2 mb-md-0">
                <Button
                  variant="outline-secondary"
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0}
                >
                  Previous
                </Button>{' '}
                <Button
                  variant="outline-secondary"
                  onClick={handleNext}
                  disabled={currentQuestionIndex === questions.length - 1}
                >
                  Next
                </Button>
              </Col>
              <Col xs={12} md={6} className="text-md-end">
                {currentQuestionIndex < questions.length - 1 ? (
                  <Button variant="primary" onClick={handleNext}>
                    Save & Next
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
      <Col md={3} lg={3} className="mt-3 mt-md-0">
        <Card className="shadow-sm h-100">
          <Card.Header>
            <strong>Question Palette</strong>
          </Card.Header>
          <Card.Body>
            <div className="d-flex flex-wrap gap-2">
              {questions.map((q, index) => {
                const id = q._id || q.id;
                const attempted = answers[id] !== undefined && answers[id] !== null;
                const isCurrent = index === currentQuestionIndex;

                let variant = 'outline-secondary';
                if (attempted) variant = 'success';
                if (!attempted) variant = 'outline-danger';
                if (isCurrent) variant = 'primary';

                return (
                  <Button
                    key={id || index}
                    size="sm"
                    variant={variant}
                    onClick={() => goToQuestion(index)}
                  >
                    {index + 1}
                  </Button>
                );
              })}
            </div>
            <div className="mt-3 small">
              <div className="d-flex align-items-center mb-1">
                <Badge bg="primary" className="me-2">&nbsp;</Badge> Current
              </div>
              <div className="d-flex align-items-center mb-1">
                <Badge bg="success" className="me-2">&nbsp;</Badge> Attempted
              </div>
              <div className="d-flex align-items-center">
                <Badge bg="danger" className="me-2">&nbsp;</Badge> Not Attempted
              </div>
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default ExamTakeScreen;

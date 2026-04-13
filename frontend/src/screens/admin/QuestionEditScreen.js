
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Form, Button, Row, Col } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import Message from '../../components/Message';
import Loader from '../../components/Loader';
import FormContainer from '../../components/FormContainer';
import {
  createQuestion,
  getQuestionDetails,
  updateQuestion,
  resetQuestionState,
} from '../../store/slices/questionSlice';

const QuestionEditScreen = () => {
  const { id: questionId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [text, setText] = useState('');
  const [subject, setSubject] = useState('');
  const [options, setOptions] = useState([
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ]);

  const {
    loading,
    error,
    success,
    successUpdate,
    question,
  } = useSelector((state) => state.question);

  useEffect(() => {
    if (success || successUpdate) {
      dispatch(resetQuestionState());
      navigate('/admin/questionlist');
    } else {
      if (questionId && (!question || question._id !== questionId)) {
        // Load question details from the API when editing
        dispatch(getQuestionDetails(questionId));
      } else if (questionId && question) {
        // Map backend shape (questionText, options: [string], correctOption)
        // into the local form state shape used by this component.
        setText(question.questionText || question.text || '');
        setSubject(question.subject || '');

        if (Array.isArray(question.options)) {
          const mappedOptions = question.options.map((opt, index) => {
            if (typeof opt === 'string') {
              return {
                text: opt,
                isCorrect:
                  typeof question.correctOption === 'number' &&
                  question.correctOption === index,
              };
            }
            // Fallback if options are already objects
            return {
              text: opt.text || '',
              isCorrect: !!opt.isCorrect,
            };
          });

          // Ensure we always have at least 4 option rows for the UI
          while (mappedOptions.length < 4) {
            mappedOptions.push({ text: '', isCorrect: false });
          }

          setOptions(mappedOptions);
        }
      }
    }
  }, [questionId, dispatch, success, successUpdate, question, navigate]);

  const handleOptionChange = (index, field, value) => {
    const newOptions = [...options];
    if (field === 'isCorrect') {
      // Ensure only one option is correct
      newOptions.forEach((option, i) => {
        newOptions[i].isCorrect = i === index;
      });
    } else {
      newOptions[index][field] = value;
    }
    setOptions(newOptions);
  };

  const submitHandler = (e) => {
    e.preventDefault();
    if (questionId) {
      // Backend expects the ID in the URL path; our service reads `_id` from the payload.
      dispatch(updateQuestion({ _id: questionId, text, subject, options }));
    } else {
      dispatch(createQuestion({ text, subject, options }));
    }
    console.log('submit');
  };

  return (
    <>
      <Link to="/admin/questionlist" className="btn btn-light my-3">
        Go Back
      </Link>
      <FormContainer>
        <h1>{questionId ? 'Edit Question' : 'Create Question'}</h1>
        {loading && <Loader />}
        {error && <Message variant="danger">{error}</Message>}
        <Form onSubmit={submitHandler}>
          <Form.Group controlId="text">
            <Form.Label>Question Text</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Enter question text"
              value={text}
              onChange={(e) => setText(e.target.value)}
            ></Form.Control>
          </Form.Group>

          <Form.Group controlId="subject" className="my-3">
            <Form.Label>Subject</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            ></Form.Control>
          </Form.Group>

          <h4 className="my-3">Options</h4>
          {options.map((option, index) => (
            <Row key={index} className="align-items-center mb-2">
              <Col xs={8}>
                <Form.Control
                  type="text"
                  placeholder={`Option ${index + 1}`}
                  value={option.text}
                  onChange={(e) =>
                    handleOptionChange(index, 'text', e.target.value)
                  }
                />
              </Col>
              <Col xs={4}>
                <Form.Check
                  type="radio"
                  label="Correct"
                  name="correctOption"
                  checked={option.isCorrect}
                  onChange={(e) =>
                    handleOptionChange(index, 'isCorrect', e.target.checked)
                  }
                />
              </Col>
            </Row>
          ))}

          <Button type="submit" variant="primary" className="mt-3">
            {questionId ? 'Update' : 'Create'}
          </Button>
        </Form>
      </FormContainer>
    </>
  );
};

export default QuestionEditScreen;


import React, { useState, useEffect, useMemo } from 'react';
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
import axios from 'axios';
import API_BASE_URL from '../../config/api';

const CLASS_LEVELS = ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'];
const DEPARTMENTS = {
  JSS: ['General'],
  SS: ['Science', 'Art', 'Commercial'],
};
const QUESTION_TYPES = ['objective', 'theory'];

const getDepartmentsForLevel = (level) => {
  if (!level) return [];
  if (level.startsWith('JSS')) return DEPARTMENTS.JSS;
  if (level.startsWith('SS')) return DEPARTMENTS.SS;
  return [];
};

const QuestionEditScreen = () => {
  const { id: questionId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [text, setText] = useState('');
  const [instruction, setInstruction] = useState('');
  const [subject, setSubject] = useState('');
  const [classLevel, setClassLevel] = useState('');
  const [department, setDepartment] = useState('');
  const [type, setType] = useState('objective');
  const [questionLabel, setQuestionLabel] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [options, setOptions] = useState([
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ]);
  const [subquestions, setSubquestions] = useState([
    { label: '', text: '' },
  ]);

  const {
    loading,
    error,
    success,
    successUpdate,
    question,
  } = useSelector((state) => state.question);
  const { userInfo } = useSelector((state) => state.user);

  useEffect(() => {
    if (success || successUpdate) {
      dispatch(resetQuestionState());
      navigate('/admin/questionlist');
    } else {
      if (questionId && (!question || question._id !== questionId)) {
        dispatch(getQuestionDetails(questionId));
      } else if (questionId && question) {
        setText(question.questionText || question.question || question.text || '');
        setInstruction(question.instruction || '');
        setSubject(question.subject || '');
        setClassLevel(question.classLevel || '');
        setDepartment(question.department || '');
        setType(question.type || 'objective');
        setQuestionLabel(question.questionLabel || '');
        setImageUrl(question.imageUrl || '');

        if (question.type === 'theory') {
          setSubquestions([
            {
              label: question.questionLabel || '',
              text: question.questionText || question.question || question.text || '',
            },
          ]);
        } else {
          setSubquestions([{ label: '', text: '' }]);
        }

        const mappedOptions = Array.isArray(question.options)
          ? question.options.map((opt) => ({ text: opt || '', isCorrect: false }))
          : [];

        const correctAnswer = question.correctAnswer || '';
        const optionsWithCorrect = mappedOptions.map((option) => ({
          text: option.text,
          isCorrect: option.text.trim().toLowerCase() === correctAnswer.trim().toLowerCase(),
        }));

        while (optionsWithCorrect.length < 4) {
          optionsWithCorrect.push({ text: '', isCorrect: false });
        }

        setOptions(optionsWithCorrect);
      }
    }
  }, [questionId, dispatch, success, successUpdate, question, navigate]);

  const departmentOptions = useMemo(
    () => getDepartmentsForLevel(classLevel),
    [classLevel]
  );

  const addSubquestion = () => {
    setSubquestions((prev) => [...prev, { label: '', text: '' }]);
  };

  const removeSubquestion = (index) => {
    setSubquestions((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSubquestion = (index, field, value) => {
    setSubquestions((prev) =>
      prev.map((sub, i) =>
        i === index ? { ...sub, [field]: value } : sub
      )
    );
  };

  const handleOptionChange = (index, field, value) => {
    const newOptions = [...options];
    if (field === 'isCorrect') {
      newOptions.forEach((option, i) => {
        newOptions[i].isCorrect = i === index;
      });
    } else {
      newOptions[index][field] = value;
    }
    setOptions(newOptions);
  };

  const submitHandler = async (e) => {
    e.preventDefault();

    const validSubquestions = subquestions
      .map((sub) => ({
        label: String(sub.label || '').trim(),
        text: String(sub.text || '').trim(),
      }))
      .filter((sub) => sub.label.length > 0 && sub.text.length > 0);

    const buildTheoryPayload = (sub) => ({
      question: sub.text,
      subject,
      classLevel,
      department,
      type,
      instruction: text,
      options: [],
      correctAnswer: '',
      questionLabel: sub.label,
      imageUrl,
    });

    if (questionId) {
      if (type === 'theory') {
        if (!validSubquestions.length) {
          alert('Please add at least one theory part with a label and text.');
          return;
        }

        if (validSubquestions.length > 1) {
          alert('Editing multiple theory parts at once is not supported here. Please update each part individually to avoid duplicate questions.');
          return;
        }

        const firstSub = validSubquestions[0];
        const updatePayload = {
          question: firstSub.text,
          subject,
          classLevel,
          department,
          type,
          instruction: text,
          options: [],
          correctAnswer: '',
          questionLabel: firstSub.label,
          imageUrl,
        };

        dispatch(updateQuestion({ _id: questionId, ...updatePayload }));
        return;
      }

      const payload = {
        question: text,
        subject,
        classLevel,
        department,
        type,
        options,
        correctAnswer: type === 'objective' ? options.find((opt) => opt.isCorrect)?.text || '' : '',
        questionLabel,
        imageUrl,
      };
      dispatch(updateQuestion({ _id: questionId, ...payload }));
      return;
    }

    if (type === 'theory') {
      const payloads = validSubquestions.map(buildTheoryPayload);
      if (!payloads.length) {
        alert('Please add at least one theory part with a label and text.');
        return;
      }

      if (payloads.length === 1) {
        dispatch(createQuestion(payloads[0]));
        return;
      }

      try {
        setSubmitting(true);
        const config = {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userInfo?.token}`,
          },
        };
        await Promise.all(
          payloads.map((payload) =>
            axios.post(`${API_BASE_URL}/api/questions/`, payload, config)
          )
        );
        navigate('/admin/questionlist');
      } catch (err) {
        alert(err.response?.data?.message || err.message || 'Failed to create theory questions');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    const payload = {
      question: text,
      subject,
      classLevel,
      department,
      type,
      options,
      correctAnswer: type === 'objective' ? options.find((opt) => opt.isCorrect)?.text || '' : '',
      questionLabel,
      imageUrl,
    };

    dispatch(createQuestion(payload));
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
            <Form.Label>{type === 'theory' ? 'Shared Prompt / Instruction' : 'Question'}</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder={type === 'theory' ? 'Enter the shared instruction or image prompt here, e.g. Use the above image to answer questions 1i, 1ii, 1iii.' : 'Enter question text'}
              value={type === 'theory' ? instruction : text}
              onChange={(e) => {
                if (type === 'theory') {
                  setInstruction(e.target.value);
                } else {
                  setText(e.target.value);
                }
              }}
            ></Form.Control>
            {type === 'theory' && (
              <Form.Text className="text-muted">
                For multipart theory questions, enter the shared instruction above and add each subquestion part below.
              </Form.Text>
            )}
          </Form.Group>
          <Row className="mt-3">
            <Col md={4}>
              <Form.Group controlId="questionLabel">
                <Form.Label>Question Label</Form.Label>
                <Form.Control
                  type="text"
                  placeholder={type === 'theory' && !questionId ? 'Use the subquestion parts below' : 'e.g. 1a, 1ii'}
                  value={questionLabel}
                  onChange={(e) => setQuestionLabel(e.target.value)}
                  disabled={type === 'theory' && !questionId}
                />
                {type === 'theory' && !questionId && (
                  <Form.Text className="text-muted">
                    For theory questions, use the part list below instead of a single label.
                  </Form.Text>
                )}
              </Form.Group>
            </Col>
            <Col md={8}>
              <Form.Group controlId="imageUrl">
                <Form.Label>Question Image</Form.Label>
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      setUploadingImage(true);
                      const fd = new FormData();
                      fd.append('image', file);
                      const { data } = await axios.post(
                        `${API_BASE_URL}/api/questions/upload-image`,
                        fd,
                        { headers: { Authorization: `Bearer ${userInfo?.token}` } }
                      );
                      setImageUrl(data.imageUrl || '');
                    } catch (err) {
                      alert(err.response?.data?.message || 'Image upload failed');
                    } finally {
                      setUploadingImage(false);
                    }
                  }}
                />
                {uploadingImage && <Form.Text>Uploading image...</Form.Text>}
                {imageUrl && (
                  <div className="mt-2">
                    <img
                      src={`${API_BASE_URL}${imageUrl}`}
                      alt="Question"
                      style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }}
                    />
                  </div>
                )}
              </Form.Group>
            </Col>
          </Row>

          <Row className="mt-3">
            <Col md={4}>
              <Form.Group controlId="subject">
                <Form.Label>Subject</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                ></Form.Control>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="classLevel">
                <Form.Label>Class Level</Form.Label>
                <Form.Select
                  value={classLevel}
                  onChange={(e) => {
                    setClassLevel(e.target.value);
                    setDepartment('');
                  }}
                >
                  <option value="">Select class level</option>
                  {CLASS_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="department">
                <Form.Label>Department</Form.Label>
                <Form.Select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  disabled={!departmentOptions.length}
                >
                  <option value="">Select department</option>
                  {departmentOptions.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </Form.Select>
                <Form.Text className="text-muted">
                  {classLevel
                    ? classLevel.startsWith('JSS')
                      ? 'JSS exams use General only.'
                      : 'SS exams use Science, Art, or Commercial.'
                    : 'Select a class level first to choose a department.'}
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group controlId="type" className="my-3">
            <Form.Label>Question Type</Form.Label>
            <Form.Select
              value={type}
              onChange={(e) => {
                const selected = e.target.value;
                setType(selected);
                if (selected === 'theory') {
                  setSubquestions([{ label: '', text: '' }]);
                  setInstruction('');
                  setText('');
                } else {
                  setInstruction('');
                }
              }}
            >
              {QUESTION_TYPES.map((optionType) => (
                <option key={optionType} value={optionType}>
                  {optionType.charAt(0).toUpperCase() + optionType.slice(1)}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          {type === 'objective' ? (
            <>
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
                      onChange={() => handleOptionChange(index, 'isCorrect', true)}
                    />
                  </Col>
                </Row>
              ))}
            </>
          ) : (
            <>
              <div className="alert alert-secondary mt-3">
                This is a theory question. Add one or more parts below and each part will be created as its own question.
              </div>
              {subquestions.map((subquestion, index) => (
                <div key={index} className="border rounded p-3 mb-3">
                  <Row className="align-items-end">
                    <Col md={4}>
                      <Form.Group controlId={`subquestionLabel-${index}`}>
                        <Form.Label>Part Label</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="e.g. 1i"
                          value={subquestion.label}
                          onChange={(e) => updateSubquestion(index, 'label', e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={7}>
                      <Form.Group controlId={`subquestionText-${index}`}>
                        <Form.Label>Part Question Text</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={2}
                          placeholder="Enter only the part-specific text, e.g. Name the gas produced in the experiment"
                          value={subquestion.text}
                          onChange={(e) => updateSubquestion(index, 'text', e.target.value)}
                        />
                        <Form.Text className="text-muted">
                          Do not repeat the shared instruction here; enter only the specific part question.
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={1} className="text-end">
                      {subquestions.length > 1 && (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => removeSubquestion(index)}
                        >
                          ×
                        </Button>
                      )}
                    </Col>
                  </Row>
                </div>
              ))}
              <div className="mb-2">
                <strong>Example:</strong> Use the above image to answer questions 1i, 1ii, 1iii.
              </div>
              <Button variant="outline-primary" size="sm" onClick={addSubquestion}>
                + Add another part
              </Button>
            </>
          )}

          <Button type="submit" variant="primary" className="mt-3" disabled={submitting || loading}>
            {submitting ? 'Creating...' : questionId ? 'Update' : 'Create'}
          </Button>
        </Form>
      </FormContainer>
    </>
  );
};

export default QuestionEditScreen;

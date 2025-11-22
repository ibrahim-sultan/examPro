
import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { Form, Button } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import axios from 'axios';
import API_BASE_URL from '../../config/api';

const ExamEditScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { userInfo } = useSelector((state) => state.user);

  const initialSubject = location.state?.subject || '';
  const initialQuestionCount = location.state?.questionCount || 10;

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState(initialSubject);
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(60);
  const [startTime, setStartTime] = useState(''); // datetime-local string
  const [endTime, setEndTime] = useState(''); // datetime-local string
  const [questionCount, setQuestionCount] = useState(initialQuestionCount);
  const [totalMarks, setTotalMarks] = useState(100);
  const [passingMarks, setPassingMarks] = useState(40);
  const [markingScheme, setMarkingScheme] = useState({
    correct: 1,
    incorrect: 0,
  });
  const [status, setStatus] = useState('Published'); // Draft | Published | Archived
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchExam = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const config = {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        };
        const { data } = await axios.get(`${API_BASE_URL}/api/exams/${id}`, config);
        setTitle(data.title || '');
        setSubject(data.subject || '');
        setDescription(data.description || '');
        setDuration(data.duration || 60);
        setMarkingScheme(data.markingScheme || { correct: 1, incorrect: 0 });
        setStatus(data.status || 'Draft');
        // Map ISO strings to datetime-local format (YYYY-MM-DDTHH:MM)
        if (data.startTime) {
          const d = new Date(data.startTime);
          setStartTime(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
        }
        if (data.endTime) {
          const d = new Date(data.endTime);
          setEndTime(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
        }
        if (Array.isArray(data.questions)) {
          setQuestionCount(data.questions.length);
        }
      } catch (e) {
        setError(e.response?.data?.message || e.message || 'Failed to load exam');
      } finally {
        setLoading(false);
      }
    };

    if (id && userInfo?.token) {
      fetchExam();
    }
  }, [id, userInfo]);

  const submitHandler = async (e) => {
    e.preventDefault();

    // Basic client-side validation for time range
    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      if (end <= start) {
        setError('End time must be after start time.');
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      const payload = {
        title,
        subject,
        description,
        duration: Number(duration),
        startTime: startTime ? new Date(startTime).toISOString() : undefined,
        endTime: endTime ? new Date(endTime).toISOString() : undefined,
        markingScheme,
        status,
      };

      if (id) {
        // Update existing exam
        await axios.put(`${API_BASE_URL}/api/exams/${id}`, payload, config);
      } else {
        // Create new exam for a subject using questions from the bank
        await axios.post(
          `${API_BASE_URL}/api/exams`,
          {
            ...payload,
            questionCount: Number(questionCount) || 10,
          },
          config
        );
      }

      navigate('/admin/examlist');
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to save exam');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Link to="/admin/examlist" className="btn btn-light my-3">
        Go Back
      </Link>
      <h1>{id ? 'Edit Exam' : 'Create Exam'}</h1>
      {error && <div className="alert alert-danger mt-2">{error}</div>}
      <Form onSubmit={submitHandler}>
        <Form.Group controlId="title">
          <Form.Label>Title</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter exam title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group controlId="subject" className="my-3">
          <Form.Label>Subject</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group controlId="description" className="my-3">
          <Form.Label>Description</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            placeholder="Optional description or instructions for this exam"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Form.Group>

        <Form.Group controlId="status" className="my-3">
          <Form.Label>Status</Form.Label>
          <Form.Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="Draft">Draft</option>
            <option value="Published">Published</option>
            <option value="Archived">Archived</option>
          </Form.Select>
        </Form.Group>

        <Form.Group controlId="duration" className="my-3">
          <Form.Label>Duration (in minutes)</Form.Label>
          <Form.Control
            type="number"
            placeholder="Enter duration"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            min={1}
            required
          />
        </Form.Group>

        <Form.Group controlId="startTime" className="my-3">
          <Form.Label>Exam Start Time</Form.Label>
          <Form.Control
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group controlId="endTime" className="my-3">
          <Form.Label>Exam End Time</Form.Label>
          <Form.Control
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
          />
        </Form.Group>

        {!id && (
          <Form.Group controlId="questionCount" className="my-3">
            <Form.Label>Number of Questions</Form.Label>
            <Form.Control
              type="number"
              placeholder="How many questions should this exam contain?"
              value={questionCount}
              onChange={(e) => setQuestionCount(e.target.value)}
              min={1}
            />
          </Form.Group>
        )}

        <Form.Group controlId="totalMarks" className="my-3">
          <Form.Label>Total Marks (optional)</Form.Label>
          <Form.Control
            type="number"
            placeholder="Enter total marks"
            value={totalMarks}
            onChange={(e) => setTotalMarks(e.target.value)}
          />
        </Form.Group>

        <Form.Group controlId="passingMarks" className="my-3">
          <Form.Label>Passing Marks (optional)</Form.Label>
          <Form.Control
            type="number"
            placeholder="Enter passing marks"
            value={passingMarks}
            onChange={(e) => setPassingMarks(e.target.value)}
          />
        </Form.Group>

        <Form.Group controlId="correctMark" className="my-3">
          <Form.Label>Marks for Correct Answer</Form.Label>
          <Form.Control
            type="number"
            value={markingScheme.correct}
            onChange={(e) =>
              setMarkingScheme({ ...markingScheme, correct: Number(e.target.value) })
            }
          />
        </Form.Group>

        <Form.Group controlId="incorrectMark" className="my-3">
          <Form.Label>Penalty for Incorrect Answer</Form.Label>
          <Form.Control
            type="number"
            value={markingScheme.incorrect}
            onChange={(e) =>
              setMarkingScheme({
                ...markingScheme,
                incorrect: Number(e.target.value),
              })
            }
          />
        </Form.Group>

        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? 'Saving...' : id ? 'Update Exam' : 'Create Exam'}
        </Button>
      </Form>
    </>
  );
};

export default ExamEditScreen;

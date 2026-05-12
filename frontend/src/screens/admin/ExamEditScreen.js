
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { Form, Button } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import axios from 'axios';
import API_BASE_URL from '../../config/api';

const CLASS_LEVELS = ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'];
const DEPARTMENT_OPTIONS = {
  JSS: ['General'],
  SS: ['Science', 'Art', 'Commercial'],
};

const getDepartmentsForLevel = (level) => {
  if (!level) return [];
  if (level.startsWith('JSS')) return DEPARTMENT_OPTIONS.JSS;
  if (level.startsWith('SS')) return DEPARTMENT_OPTIONS.SS;
  return [];
};

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
  const [classLevel, setClassLevel] = useState('');
  const [department, setDepartment] = useState('');
  const departmentOptions = useMemo(
    () => getDepartmentsForLevel(classLevel),
    [classLevel]
  );
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
  const [passportRequired, setPassportRequired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);

  const [newSubject, setNewSubject] = useState('');
  const [showNewSubject, setShowNewSubject] = useState(false);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/api/subjects`);
        setSubjects(data || []);
      } catch (e) {
        console.error('Failed to fetch subjects:', e);
        setSubjects([]);
      }
    };

    fetchSubjects();
  }, []);

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
        setClassLevel(data.classLevel || '');
        setDepartment(data.department || '');
        setDuration(data.duration || 60);
        setMarkingScheme(data.markingScheme || { correct: 1, incorrect: 0 });
        setStatus(data.status || 'Draft');
        setPassportRequired(!!data.passportRequired);
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
        // Map fetched exam subject string to a subjectId (best-effort)
        // We will finalize it after subjects load; leaving for now to avoid race.
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
        classLevel: classLevel || undefined,
        department: department || undefined,
        duration: Number(duration),
        startTime: startTime ? new Date(startTime).toISOString() : undefined,
        endTime: endTime ? new Date(endTime).toISOString() : undefined,
        markingScheme,
        status,
        passportRequired,
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

  const refreshSubjects = async () => {
    const { data } = await axios.get(`${API_BASE_URL}/api/subjects`);
    const nextSubjects = data || [];
    setSubjects(nextSubjects);

    // If the current selected subject id still exists, keep selection.
    if (selectedSubjectId) {
      const exists = nextSubjects.find((s) => s._id === selectedSubjectId);
      if (!exists) {
        setSelectedSubjectId(null);
        setSubject('');
      }
    } else if (subject) {
      // Try to match by display string.
      const matched = nextSubjects.find((s) => (s.displayName || s.name) === subject);
      if (matched) setSelectedSubjectId(matched._id);
    }
  };

  useEffect(() => {
    // After subjects are loaded, try to resolve selectedSubjectId for edit form.
    if (!subjects?.length) return;
    if (selectedSubjectId) return;

    if (subject) {
      const matched = subjects.find((s) => (s.displayName || s.name) === subject);
      if (matched) setSelectedSubjectId(matched._id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjects]);

  const handleDeleteSelectedSubject = async () => {
    if (!selectedSubjectId) return;
    try {
      setLoading(true);
      setError(null);

      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      await axios.delete(`${API_BASE_URL}/api/subjects/${selectedSubjectId}`, config);

      await refreshSubjects();

      setSelectedSubjectId(null);
      setSubject('');
      setShowNewSubject(false);
      setNewSubject('');
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to delete subject');
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
          <div className="d-flex gap-2 align-items-start">
            <div style={{ flex: 1 }}>
              <Form.Select
                value={selectedSubjectId || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '__add_new__') {
                    setShowNewSubject(true);
                    setSelectedSubjectId(null);
                    setSubject('');
                  } else {
                    const chosen = subjects.find((s) => s._id === val);
                    setSelectedSubjectId(val || null);
                    setSubject(chosen ? (chosen.displayName || chosen.name) : '');
                    setShowNewSubject(false);
                    setNewSubject('');
                  }
                }}
                required
              >
                <option value="">Select a subject or add new</option>
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.displayName || s.name}
                  </option>
                ))}
                <option value="__add_new__">+ Add New Subject</option>
              </Form.Select>
            </div>

            <div className="d-flex flex-column" style={{ gap: 8 }}>
              <Button
                size="sm"
                variant="outline-danger"
                disabled={!selectedSubjectId}
                onClick={handleDeleteSelectedSubject}
                title="Delete selected subject"
              >
                Delete
              </Button>
            </div>
          </div>

          {showNewSubject && (
            <div className="mt-2 d-flex gap-2">
              <Form.Control
                type="text"
                placeholder="Enter new subject name"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
              />
              <Button
                size="sm"
                onClick={async () => {
                  if (newSubject.trim()) {
                    try {
                      const config = {
                        headers: {
                          Authorization: `Bearer ${userInfo.token}`,
                        },
                      };
                      const { data } = await axios.post(
                        `${API_BASE_URL}/api/subjects`,
                        { name: newSubject },
                        config
                      );
                      // Add to subjects list and select it
                      setSubjects((prev) => [...prev, data]);
                      setSelectedSubjectId(data?._id || null);
                      setSubject(data ? data.displayName || data.name : newSubject);
                      setNewSubject('');
                      setShowNewSubject(false);
                    } catch (e) {
                      setError(e.response?.data?.message || 'Failed to create subject');
                    }
                  }
                }}
              >
                Add
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setShowNewSubject(false);
                  setNewSubject('');
                  setSelectedSubjectId(null);
                  setSubject('');
                }}
              >
                Cancel
              </Button>
            </div>
          )}
        </Form.Group>

        <Form.Group controlId="classLevel" className="my-3">
          <Form.Label>Class Level</Form.Label>
          <Form.Select
            value={classLevel}
            onChange={(e) => {
              setClassLevel(e.target.value);
              setDepartment('');
            }}
          >
            <option value="">Select a class level</option>
            {CLASS_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </Form.Select>
        </Form.Group>

        <Form.Group controlId="department" className="my-3">
          <Form.Label>Department</Form.Label>
          <Form.Select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            disabled={!classLevel}
          >
            <option value="">Select a department</option>
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
        <Form.Group controlId="passportRequired" className="my-3">
          <Form.Check
            type="checkbox"
            label="Passport photo required before exam start"
            checked={passportRequired}
            onChange={(e) => setPassportRequired(e.target.checked)}
          />
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

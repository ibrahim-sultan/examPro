import React, { useEffect, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Row, Col, Card, Button, Table, Form } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useNavigate } from 'react-router-dom';
import Loader from '../components/Loader';
import Message from '../components/Message';
import { listAvailableExams } from '../store/slices/examSlice';
import { logout } from '../store/slices/userSlice';
import axios from 'axios';
import API_BASE_URL from '../config/api';

const StudentDashboardScreen = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.user);
  const examState = useSelector((state) => state.exam) || {};
  const { exams: availableExams = [], error: examError = null, loading: examLoading = false } = examState;

  const [allSubjects, setAllSubjects] = useState([]);
  const [mySubjects, setMySubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [subjectsError, setSubjectsError] = useState(null);
  const [savingSubjects, setSavingSubjects] = useState(false);

  const [results, setResults] = useState([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsError, setResultsError] = useState(null);

  useEffect(() => {
    if (!userInfo) {
      navigate('/login');
      return;
    }
    // Load exams available to this student; time gating and groups are enforced on the backend
    dispatch(listAvailableExams());
    loadSubjects();
    loadResults();
  }, [dispatch, navigate, userInfo]);

  const loadSubjects = async () => {
    try {
      setSubjectsLoading(true);
      setSubjectsError(null);
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const [subjRes, mySubjRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/questions/subjects`, config),
        axios.get(`${API_BASE_URL}/api/users/subjects`, config),
      ]);
      setAllSubjects(subjRes.data || []);
      setMySubjects(mySubjRes.data || []);
    } catch (e) {
      setSubjectsError(e.response?.data?.message || e.message);
    } finally {
      setSubjectsLoading(false);
    }
  };

  const loadResults = async () => {
    try {
      setResultsLoading(true);
      setResultsError(null);
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.get(`${API_BASE_URL}/api/results/my`, config);
      setResults(data || []);
    } catch (e) {
      setResultsError(e.response?.data?.message || e.message);
    } finally {
      setResultsLoading(false);
    }
  };

  const onLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const toggleSubject = (subject) => {
    setMySubjects((prev) =>
      prev.includes(subject)
        ? prev.filter((s) => s !== subject)
        : [...prev, subject]
    );
  };

  const saveSubjects = async () => {
    try {
      setSavingSubjects(true);
      setSubjectsError(null);
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      await axios.put(
        `${API_BASE_URL}/api/users/subjects`,
        { subjects: mySubjects },
        config
      );
    } catch (e) {
      setSubjectsError(e.response?.data?.message || e.message);
    } finally {
      setSavingSubjects(false);
    }
  };

  // Show all published exams as "upcoming" regardless of date/time.
  // Time gating for when an exam can actually be started is handled in the UI below.
  const upcomingExams = useMemo(() => availableExams, [availableExams]);
  const completedExams = useMemo(() => results, [results]);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="m-0">Student Dashboard</h1>
        <Button variant="outline-danger" onClick={onLogout}>
          Logout
        </Button>
      </div>

      <Row className="mb-4">
        <Col md={6}>
          <Card>
            <Card.Body>
              <Card.Title>Registered Subjects</Card.Title>
              {subjectsLoading ? (
                <Loader />
              ) : subjectsError ? (
                <Message variant="danger">{subjectsError}</Message>
              ) : mySubjects.length === 0 ? (
                <div className="text-muted">You have not registered any subjects yet.</div>
              ) : (
                <div className="d-flex flex-wrap gap-2">
                  {mySubjects.map((s) => (
                    <span key={s} className="badge bg-primary">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card>
            <Card.Body>
              <Card.Title>Select Subjects</Card.Title>
              {subjectsLoading ? (
                <Loader />
              ) : (
                <>
                  <div className="mb-2" style={{ maxHeight: 140, overflowY: 'auto' }}>
                    {allSubjects.map((s) => (
                      <Form.Check
                        key={s}
                        type="checkbox"
                        id={`subj-${s}`}
                        label={s}
                        checked={mySubjects.includes(s)}
                        onChange={() => toggleSubject(s)}
                        className="mb-1"
                      />
                    ))}
                  </div>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={saveSubjects}
                    disabled={savingSubjects}
                  >
                    {savingSubjects ? 'Saving...' : 'Save Subjects'}
                  </Button>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col>
          <h3>Upcoming Exams</h3>
          {examLoading ? (
            <Loader />
          ) : examError ? (
            <Message variant="danger">{examError}</Message>
          ) : upcomingExams.length === 0 ? (
            <p>No upcoming exams.</p>
          ) : (
            <Table striped bordered hover responsive className="table-sm">
              <thead>
                <tr>
                  <th>SUBJECT</th>
                  <th>DATE</th>
                  <th>TIME</th>
                  <th>DURATION (MIN)</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {upcomingExams.map((exam) => {
                  const now = new Date();
                  const start = exam.startTime ? new Date(exam.startTime) : null;
                  const end = exam.endTime ? new Date(exam.endTime) : null;

                  const dateStr = start ? start.toLocaleDateString() : '-';
                  const timeStr = start
                    ? start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '-';

                  // Exam can only be started when its start time has been reached.
                  // If an end time is set, it must also be before that end time.
                  let isActive = true;
                  if (start && now < start) {
                    isActive = false;
                  }
                  if (end && now > end) {
                    isActive = false;
                  }

                  return (
                    <tr key={exam._id}>
                      <td>{exam.subject}</td>
                      <td>{dateStr}</td>
                      <td>{timeStr}</td>
                      <td>{exam.duration}</td>
                      <td>
                        {isActive ? (
                          <LinkContainer to={`/exam/${exam._id}`}>
                            <Button size="sm">Start</Button>
                          </LinkContainer>
                        ) : (
                          <Button size="sm" disabled>
                            Not yet available
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Col>
      </Row>

      <Row>
        <Col>
          <h3>Completed Exams</h3>
          {resultsLoading ? (
            <Loader />
          ) : resultsError ? (
            <Message variant="danger">{resultsError}</Message>
          ) : completedExams.length === 0 ? (
            <p>No completed exams yet.</p>
          ) : (
            <Table striped bordered hover responsive className="table-sm">
              <thead>
                <tr>
                  <th>TITLE</th>
                  <th>DATE</th>
                  <th>SCORE</th>
                  <th>STATUS</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {completedExams.map((r) => (
                  <tr key={r._id}>
                    <td>{r.exam?.title || '-'}</td>
                    <td>
                      {r.submittedAt
                        ? new Date(r.submittedAt).toLocaleDateString()
                        : '-'}
                    </td>
                    <td>{r.score}</td>
                    <td>{r.status}</td>
                    <td>
                      <LinkContainer to={`/results/${r._id}`}>
                        <Button size="sm" variant="light">
                          View Result
                        </Button>
                      </LinkContainer>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default StudentDashboardScreen;

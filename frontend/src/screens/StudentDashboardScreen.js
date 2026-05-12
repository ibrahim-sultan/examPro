import React, { useEffect, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Row, Col, Button, Table, Badge } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import Loader from '../components/Loader';
import Message from '../components/Message';
import { logout } from '../store/slices/userSlice';
import axios from 'axios';
import API_BASE_URL from '../config/api';

const StudentDashboardScreen = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { userInfo } = useSelector((state) => state.user);
  const userToken = userInfo?.token;
  const submittedSuccess = location.state?.submitted;

  const [results, setResults] = useState([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsError, setResultsError] = useState(null);

  const [availableExams, setAvailableExams] = useState([]);
  const [examsLoading, setExamsLoading] = useState(false);
  const [examsError, setExamsError] = useState(null);

  const onLogout = () => {
    dispatch(logout());
    navigate('/login', { replace: true });
    window.location.reload();
  };

  useEffect(() => {
    if (!userToken) {
      navigate('/login');
      return;
    }

    const loadAllData = async () => {
      setResultsLoading(true);
      setExamsLoading(true);
      setResultsError(null);
      setExamsError(null);

      try {
        const config = { headers: { Authorization: `Bearer ${userToken}` } };

        const [resultsRes, examsRes] = await Promise.allSettled([
          axios.get(`${API_BASE_URL}/api/results/my`, config),
          axios.get(`${API_BASE_URL}/api/exams/available`, config),
        ]);

        // Handle results
        if (resultsRes.status === 'fulfilled') {
          setResults(Array.isArray(resultsRes.value.data) ? resultsRes.value.data : []);
        } else {
          console.error('Failed to load results:', resultsRes.reason);
          setResultsError(resultsRes.reason?.response?.data?.message || 'Failed to load results');
        }

        // Handle exams
        if (examsRes.status === 'fulfilled') {
          setAvailableExams(Array.isArray(examsRes.value.data) ? examsRes.value.data : []);
        } else {
          console.error('Failed to load exams:', examsRes.reason);
          setExamsError(examsRes.reason?.response?.data?.message || 'Failed to load available exams');
        }
      } catch (error) {
        console.error('Unexpected error in loadAllData:', error);
      } finally {
        setResultsLoading(false);
        setExamsLoading(false);
      }
    };

    loadAllData();
  }, [userToken, navigate]);

  const completedExamIds = useMemo(
    () => new Set(results.filter((r) => r.status === 'Completed' && r.exam?._id).map((r) => r.exam._id)),
    [results]
  );
  const upcomingExams = useMemo(
    () => availableExams.filter((exam) => !completedExamIds.has(exam._id)),
    [availableExams, completedExamIds]
  );
  const completedExams = useMemo(() => {
    // Deduplicate: keep only the most recent result per exam
    const examMap = new Map();
    results.forEach((result) => {
      const examId = result.exam?._id;
      if (examId) {
        if (!examMap.has(examId) || new Date(result.createdAt) > new Date(examMap.get(examId).createdAt)) {
          examMap.set(examId, result);
        }
      }
    });
    return Array.from(examMap.values());
  }, [results]);

  // Early error fallback UI
  if (examsError && !examsLoading && availableExams.length === 0 && !resultsLoading) {
    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h1 className="m-0">Student Dashboard</h1>
          <Button variant="outline-danger" onClick={onLogout}>
            Logout
          </Button>
        </div>
        <Message variant="danger">{examsError}</Message>
        <p className="mt-3 text-muted">Unable to load your exams. Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="d-flex align-items-center gap-3">
          <h1 className="m-0">Student Dashboard</h1>
          {userInfo?.passportPhoto ? (
            <img
              src={`${API_BASE_URL}${userInfo.passportPhoto}`}
              alt="Passport"
              style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <Badge bg="warning" text="dark">No Passport</Badge>
          )}
        </div>
        <Button variant="outline-danger" onClick={onLogout}>
          Logout
        </Button>
      </div>

      {submittedSuccess && (
        <Row className="mb-3">
          <Col>
            <Message variant="success">
              Your exam has been submitted successfully. Completed exams are now hidden from upcoming exams.
            </Message>
          </Col>
        </Row>
      )}
      <Row className="mb-4">
        <Col>
          <h3>Upcoming Exams</h3>
          {examsLoading ? (
            <Loader />
          ) : examsError ? (
            <Message variant="danger">{examsError}</Message>
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
                  <th>STATUS</th>
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
                    <td>
                      <Badge bg="success" pill>
                        {r.status}
                      </Badge>
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

import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Table, Button, Form, Badge } from 'react-bootstrap';
import axios from 'axios';
import { useSelector } from 'react-redux';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

const MonitoringScreen = () => {
  const { userInfo } = useSelector((s) => s.user);
  const [examId, setExamId] = useState('');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchSessions = async () => {
    try {
      setLoading(true); setError('');
      const { data } = await axios.get(`${API_BASE_URL}/api/monitor/ongoing${examId ? `?examId=${examId}` : ''}`,
        { headers: { Authorization: `Bearer ${userInfo?.token}` } });
      setSessions(data);
    } catch (e) {
      setError('Failed to load sessions');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchSessions(); /* eslint-disable-next-line */ }, []);

  const act = async (path) => {
    try {
      await axios.post(path, {}, { headers: { Authorization: `Bearer ${userInfo?.token}` } });
      fetchSessions();
    } catch {}
  };

  return (
    <Row>
      <Col>
        <Card>
          <Card.Header className="d-flex align-items-center justify-content-between">
            <strong>Ongoing Exams</strong>
            <div className="d-flex gap-2">
              <Form.Control size="sm" placeholder="Filter by Exam ID" value={examId} onChange={(e) => setExamId(e.target.value)} style={{ width: 260 }} />
              <Button size="sm" variant="secondary" onClick={fetchSessions}>Refresh</Button>
            </div>
          </Card.Header>
          <Card.Body>
            {error && <div className="text-danger mb-2">{error}</div>}
            {loading ? 'Loading...' : (
              <Table striped bordered hover responsive size="sm">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Email</th>
                    <th>Exam</th>
                    <th>Started</th>
                    <th>Tab Switches</th>
                    <th>Copy/Paste</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr key={s._id}>
                      <td>{s.user?.name}</td>
                      <td>{s.user?.email}</td>
                      <td>{s.exam?.title}</td>
                      <td>{s.startTime ? new Date(s.startTime).toLocaleString() : ''}</td>
                      <td><Badge bg="warning" text="dark">{s.tabSwitchCount || 0}</Badge></td>
                      <td><Badge bg="warning" text="dark">{s.copyPasteAttempts || 0}</Badge></td>
                      <td>{s.status}</td>
                      <td className="d-flex gap-2">
                        <Button size="sm" variant="outline-danger" onClick={() => act(`${API_BASE_URL}/api/monitor/force-submit/${s._id}`)}>Force Submit</Button>
                        <Button size="sm" variant="outline-warning" onClick={() => act(`${API_BASE_URL}/api/monitor/suspend/${s._id}`)}>Suspend</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default MonitoringScreen;

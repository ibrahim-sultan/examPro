
import React, { useEffect } from 'react';
import { LinkContainer } from 'react-router-bootstrap';
import { Table, Button, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import API_BASE_URL from '../../config/api';
import Loader from '../../components/Loader';
import Message from '../../components/Message';
import { listExams } from '../../store/slices/examSlice';

const ExamListScreen = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { exams, loading, error } = useSelector((state) => state.exam);
  const { userInfo } = useSelector((state) => state.user);

  useEffect(() => {
    if (userInfo && (userInfo.role === 'Super Admin' || userInfo.role === 'Moderator')) {
      dispatch(listExams());
    } else {
      navigate('/login');
    }
  }, [dispatch, navigate, userInfo]);

  const deleteHandler = (id) => {
    if (window.confirm('Are you sure you want to delete this exam?')) {
      // TODO: dispatch deleteExam thunk when implemented
      console.log(`Deleting exam ${id}`);
    }
  };

  const downloadResultsHandler = async (exam) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
        responseType: 'blob',
      };
      const { data } = await axios.get(
        `${API_BASE_URL}/api/results/exam/${exam._id}/export`,
        config
      );

      const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const filename = `${exam.subject || exam.title || 'exam'}-results.csv`;
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      // Surface a simple error to the admin; detailed logging can be added later
      alert(e.response?.data?.message || e.message || 'Failed to download results');
    }
  };

  const createExamHandler = () => {
    navigate('/admin/exam/create');
  };

  return (
    <>
      <Row className="align-items-center">
        <Col>
          <h1>Exams</h1>
        </Col>
        <Col className="text-end">
          <Button className="my-3" onClick={createExamHandler}>
            <i className="fas fa-plus"></i> Create Exam
          </Button>
        </Col>
      </Row>
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error.message || error}</Message>
      ) : (
        <Table striped bordered hover responsive className="table-sm">
          <thead>
            <tr>
              <th>ID</th>
              <th>TITLE</th>
              <th>SUBJECT</th>
              <th>DURATION (MINS)</th>
              <th>RESULTS</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {exams.map((exam) => (
              <tr key={exam._id}>
                <td>{exam._id}</td>
                <td>{exam.title}</td>
                <td>{exam.subject}</td>
                <td>{exam.duration}</td>
                <td>
                  <Button
                    variant="info"
                    className="btn-sm"
                    onClick={() => downloadResultsHandler(exam)}
                  >
                    Results
                  </Button>
                </td>
                <td>
                  <LinkContainer to={`/admin/exam/${exam._id}/edit`}>
                    <Button variant="light" className="btn-sm me-2">
                      <i className="fas fa-edit"></i>
                    </Button>
                  </LinkContainer>
                  <Button
                    variant="danger"
                    className="btn-sm"
                    onClick={() => deleteHandler(exam._id)}
                  >
                    <i className="fas fa-trash"></i>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
};

export default ExamListScreen;

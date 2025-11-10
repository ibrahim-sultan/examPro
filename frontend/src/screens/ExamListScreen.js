
import React, { useEffect } from 'react';
import { LinkContainer } from 'react-router-bootstrap';
import { Table, Button, Row, Col } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import Message from '../components/Message';
import Loader from '../components/Loader';
import { listExams } from '../store/slices/examSlice';

const ExamListScreen = () => {
  const dispatch = useDispatch();

  const { exams, loading, error } = useSelector((state) => state.exam);
  const { userInfo } = useSelector((state) => state.user);

  useEffect(() => {
    if (userInfo && userInfo.isAdmin) {
      dispatch(listExams());
    }
  }, [dispatch, userInfo]);

  const deleteHandler = (id) => {
    if (window.confirm('Are you sure you want to delete this exam?')) {
      // Dispatch delete exam action (to be created)
      console.log('delete', id);
    }
  };

  return (
    <>
      <Row className="align-items-center">
        <Col>
          <h1>Exams</h1>
        </Col>
        <Col className="text-end">
          <Button className="my-3">
            <i className="fas fa-plus"></i> Create Exam
          </Button>
        </Col>
      </Row>
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : (
        <Table striped bordered hover responsive className="table-sm">
          <thead>
            <tr>
              <th>ID</th>
              <th>TITLE</th>
              <th>DURATION (MINS)</th>
              <th>PASS SCORE</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {exams.map((exam) => (
              <tr key={exam._id}>
                <td>{exam._id}</td>
                <td>{exam.title}</td>
                <td>{exam.duration}</td>
                <td>{exam.passingScore}%</td>
                <td>
                  <LinkContainer to={`/admin/exam/${exam._id}/edit`}>
                    <Button variant="light" className="btn-sm">
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

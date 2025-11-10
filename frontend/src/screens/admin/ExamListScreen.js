
import React, { useEffect } from 'react';
import { LinkContainer } from 'react-router-bootstrap';
import { Table, Button, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const ExamListScreen = () => {
  const navigate = useNavigate();

  // Placeholder data - in a real app, this would come from Redux state
  const exams = [
    { _id: '1', title: 'Math 101 Final', subject: 'Mathematics', duration: 120 },
    { _id: '2', title: 'History Midterm', subject: 'History', duration: 90 },
  ];
  const loading = false;
  const error = null;

  useEffect(() => {
    // In a real app, you would dispatch an action to fetch exams here
    console.log('Fetching exams...');
  }, []);

  const deleteHandler = (id) => {
    if (window.confirm('Are you sure you want to delete this exam?')) {
      // In a real app, you would dispatch a delete action here
      console.log(`Deleting exam ${id}`);
    }
  };

  const createExamHandler = () => {
    // In a real app, you might dispatch a create action or just navigate
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
        <p>Loading...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <Table striped bordered hover responsive className="table-sm">
          <thead>
            <tr>
              <th>ID</th>
              <th>TITLE</th>
              <th>SUBJECT</th>
              <th>DURATION (MINS)</th>
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

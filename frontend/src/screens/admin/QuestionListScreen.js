
import React, { useEffect, useMemo, useState } from 'react';
import { LinkContainer } from 'react-router-bootstrap';
import { Table, Button, Row, Col } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import Message from '../../components/Message';
import Loader from '../../components/Loader';
import {
  listQuestions,
  deleteQuestion,
  resetQuestionState,
} from '../../store/slices/questionSlice';
import { useNavigate } from 'react-router-dom';

const QuestionListScreen = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, error, questions } = useSelector((state) => state.question);
  const { userInfo } = useSelector((state) => state.user);
  const { success: successDelete } = useSelector((state) => state.question);

  const [selectedSubject, setSelectedSubject] = useState(null);

  useEffect(() => {
    dispatch(resetQuestionState());
    const adminRoles = ['Admin', 'Super Admin', 'Moderator'];
    if (userInfo && userInfo.role && adminRoles.includes(userInfo.role)) {
      dispatch(listQuestions());
    } else {
      navigate('/login');
    }
  }, [dispatch, navigate, userInfo, successDelete]);

  const deleteHandler = (id) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      dispatch(deleteQuestion(id));
    }
  };

  const createQuestionHandler = () => {
    navigate('/admin/question/create');
  };

  const subjectRows = useMemo(() => {
    const map = new Map();
    (questions || []).forEach((q) => {
      const subj = q.subject || 'Unknown';
      if (!map.has(subj)) {
        map.set(subj, { subject: subj, total: 0 });
      }
      map.get(subj).total += 1;
    });
    return Array.from(map.values());
  }, [questions]);

  const questionsForSelected = useMemo(
    () =>
      (questions || []).filter(
        (q) => !selectedSubject || q.subject === selectedSubject
      ),
    [questions, selectedSubject]
  );

  return (
    <>
      <Row className="align-items-center">
        <Col>
          <h1>Questions</h1>
        </Col>
        <Col className="text-end">
          <Button className="my-3" onClick={createQuestionHandler}>
            <i className="fas fa-plus"></i> Create Question
          </Button>
        </Col>
      </Row>
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : selectedSubject ? (
        <>
          <h4 className="mb-3">
            Subject: {selectedSubject}{' '}
            <Button
              variant="link"
              size="sm"
              className="ms-2"
              onClick={() => setSelectedSubject(null)}
            >
              &larr; Back to subjects
            </Button>
          </h4>
          <Table striped bordered hover responsive className="table-sm">
            <thead>
              <tr>
                <th>ID</th>
                <th>QUESTION</th>
                <th>SUBJECT</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {questionsForSelected.map((question) => (
                <tr key={question._id}>
                  <td>{question._id}</td>
                  <td>{question.questionText || question.text}</td>
                  <td>{question.subject}</td>
                  <td>
                    <LinkContainer to={`/admin/question/${question._id}/edit`}>
                      <Button variant="light" className="btn-sm me-2">
                        <i className="fas fa-edit"></i>
                      </Button>
                    </LinkContainer>
                    <Button
                      variant="danger"
                      className="btn-sm"
                      onClick={() => deleteHandler(question._id)}
                    >
                      <i className="fas fa-trash"></i>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      ) : (
        <Table striped bordered hover responsive className="table-sm">
          <thead>
            <tr>
              <th>#</th>
              <th>SUBJECT</th>
              <th>TOTAL QUESTIONS</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {subjectRows.map((row, idx) => (
              <tr key={row.subject}>
                <td>{idx + 1}</td>
                <td>{row.subject}</td>
                <td>{row.total}</td>
                <td>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="me-2"
                    onClick={() => setSelectedSubject(row.subject)}
                  >
                    View
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() =>
                      navigate('/admin/exam/create', {
                        state: { subject: row.subject, questionCount: row.total },
                      })
                    }
                  >
                    Create Exam
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

export default QuestionListScreen;


import React, { useEffect } from 'react';
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

  useEffect(() => {
    dispatch(resetQuestionState());
    if (userInfo && (userInfo.role === 'Super Admin' || userInfo.role === 'Moderator')) {
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
      ) : (
        <Table striped bordered hover responsive className="table-sm">
          <thead>
            <tr>
              <th>ID</th>
              <th>TEXT</th>
              <th>SUBJECT</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {questions.map((question) => (
              <tr key={question._id}>
                <td>{question._id}</td>
                <td>{question.text}</td>
                <td>{question.subject}</td>
                <td>
                  <LinkContainer to={`/admin/question/${question._id}/edit`}>
                    <Button variant="light" className="btn-sm">
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
      )}
    </>
  );
};

export default QuestionListScreen;

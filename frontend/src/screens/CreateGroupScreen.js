import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Button } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import Message from '../components/Message';
import Loader from '../components/Loader';
import FormContainer from '../components/FormContainer';
import { createGroup, resetCreateGroup } from '../store/slices/groupSlice';

const CreateGroupScreen = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loadingCreate, errorCreate, successCreate } = useSelector(
    (state) => state.group
  );

  useEffect(() => {
    if (successCreate) {
      dispatch(resetCreateGroup());
      navigate('/admin/grouplist');
    }
  }, [dispatch, navigate, successCreate]);

  const submitHandler = (e) => {
    e.preventDefault();
    dispatch(createGroup({ name, description }));
  };

  return (
    <>
      <Link to="/admin/grouplist" className="btn btn-light my-3">
        Go Back
      </Link>
      <FormContainer>
        <h1>Create Class</h1>
        {loadingCreate && <Loader />}
        {errorCreate && <Message variant="danger">{errorCreate}</Message>}
        <Form onSubmit={submitHandler}>
          <Form.Group controlId="name" className="my-3">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter class name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            ></Form.Control>
          </Form.Group>

          <Form.Group controlId="description" className="my-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Enter description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></Form.Control>
          </Form.Group>

          <Button type="submit" variant="primary" className="mt-3">
            Create
          </Button>
        </Form>
      </FormContainer>
    </>
  );
};

export default CreateGroupScreen;
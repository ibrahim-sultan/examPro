
import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Form, Button } from 'react-bootstrap';

const GroupEditScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    // In a real implementation, you would fetch group details here
    if (id) {
      console.log(`Fetching details for group ${id}`);
      // Example data
      setName(`Group ${id}`);
      setDescription('This is a sample group description.');
    }
  }, [id]);

  const submitHandler = (e) => {
    e.preventDefault();
    // In a real implementation, you would dispatch an update/create action here
    console.log('Submitting group data:', { name, description });
    navigate('/admin/groups'); // Redirect after submission
  };

  return (
    <>
      <Link to="/admin/grouplist" className="btn btn-light my-3">
        Go Back
      </Link>
      <h1>{id ? 'Edit Class' : 'Create Class'}</h1>
      <Form onSubmit={submitHandler}>
        <Form.Group controlId="name">
          <Form.Label>Name</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter class name"
            value={name}
            onChange={(e) => setName(e.target.value)}
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

        <Button type="submit" variant="primary">
          {id ? 'Update' : 'Create'}
        </Button>
      </Form>
    </>
  );
};

export default GroupEditScreen;

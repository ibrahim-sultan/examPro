
import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Form, Button } from 'react-bootstrap';

const ExamEditScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [duration, setDuration] = useState(0);
  const [totalMarks, setTotalMarks] = useState(100);
  const [passingMarks, setPassingMarks] = useState(40);
  const [markingScheme, setMarkingScheme] = useState({
    correct: 1,
    incorrect: 0,
  });

  useEffect(() => {
    // In a real app, you would fetch exam details here
    if (id) {
      console.log(`Fetching details for exam ${id}`);
      // Example data
      setTitle('Sample Exam Title');
      setSubject('Sample Subject');
      setDuration(60);
    }
  }, [id]);

  const submitHandler = (e) => {
    e.preventDefault();
    // In a real app, you would dispatch an update/create action here
    const examData = {
      title,
      subject,
      duration,
      totalMarks,
      passingMarks,
      markingScheme,
    };
    console.log('Submitting exam data:', examData);
    navigate('/admin/exams'); // Redirect after submission
  };

  return (
    <>
      <Link to="/admin/exams" className="btn btn-light my-3">
        Go Back
      </Link>
      <h1>{id ? 'Edit Exam' : 'Create Exam'}</h1>
      <Form onSubmit={submitHandler}>
        <Form.Group controlId="title">
          <Form.Label>Title</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter exam title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          ></Form.Control>
        </Form.Group>

        <Form.Group controlId="subject" className="my-3">
          <Form.Label>Subject</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          ></Form.Control>
        </Form.Group>

        <Form.Group controlId="duration" className="my-3">
          <Form.Label>Duration (in minutes)</Form.Label>
          <Form.Control
            type="number"
            placeholder="Enter duration"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          ></Form.Control>
        </Form.Group>

        <Form.Group controlId="totalMarks" className="my-3">
          <Form.Label>Total Marks</Form.Label>
          <Form.Control
            type="number"
            placeholder="Enter total marks"
            value={totalMarks}
            onChange={(e) => setTotalMarks(e.target.value)}
          ></Form.Control>
        </Form.Group>

        <Form.Group controlId="passingMarks" className="my-3">
          <Form.Label>Passing Marks</Form.Label>
          <Form.Control
            type="number"
            placeholder="Enter passing marks"
            value={passingMarks}
            onChange={(e) => setPassingMarks(e.target.value)}
          ></Form.Control>
        </Form.Group>

        <Form.Group controlId="correctMark" className="my-3">
          <Form.Label>Marks for Correct Answer</Form.Label>
          <Form.Control
            type="number"
            value={markingScheme.correct}
            onChange={(e) =>
              setMarkingScheme({ ...markingScheme, correct: Number(e.target.value) })
            }
          ></Form.Control>
        </Form.Group>

        <Form.Group controlId="incorrectMark" className="my-3">
          <Form.Label>Penalty for Incorrect Answer</Form.Label>
          <Form.Control
            type="number"
            value={markingScheme.incorrect}
            onChange={(e) =>
              setMarkingScheme({
                ...markingScheme,
                incorrect: Number(e.target.value),
              })
            }
          ></Form.Control>
        </Form.Group>

        <Button type="submit" variant="primary">
          {id ? 'Update' : 'Create'}
        </Button>
      </Form>
    </>
  );
};

export default ExamEditScreen;

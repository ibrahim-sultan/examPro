import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Form, Button, Row, Col } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import Message from '../components/Message';
import Loader from '../components/Loader';
import FormContainer from '../components/FormContainer';
import { getUserDetails, updateUser, resetUpdateUser } from '../store/slices/adminSlice';

const UserEditScreen = () => {
  const { id: userId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Student');
  const [isActive, setIsActive] = useState(false);
  const [passportPhoto, setPassportPhoto] = useState('');
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [classLevel, setClassLevel] = useState('');
  const [department, setDepartment] = useState('');

  const {
    loadingDetails,
    errorDetails,
    userDetails,
    loadingUpdate,
    errorUpdate,
    successUpdate,
  } = useSelector((state) => state.admin);

  useEffect(() => {
    if (successUpdate) {
      dispatch(resetUpdateUser());
      navigate('/admin/userlist');
    } else {
      if (!userDetails || userDetails._id !== userId) {
        dispatch(getUserDetails(userId));
      } else {
        setName(userDetails.name);
        setEmail(userDetails.email);
        setRole(userDetails.role);
        setIsActive(userDetails.isActive);
        setPassportPhoto(userDetails.passportPhoto || '');
        setAdmissionNumber(userDetails.admissionNumber || '');
        setClassLevel(userDetails.classLevel || '');
        setDepartment(userDetails.department || '');
      }
    }
  }, [dispatch, navigate, userId, userDetails, successUpdate]);

  const submitHandler = (e) => {
    e.preventDefault();
    dispatch(updateUser({ _id: userId, name, email, role, isActive }));
  };

  return (
    <>
      <Link to="/admin/userlist" className="btn btn-light my-3">
        Go Back
      </Link>
      <FormContainer>
        <h1>Edit User</h1>
        {loadingUpdate && <Loader />}
        {errorUpdate && <Message variant="danger">{errorUpdate}</Message>}
        {loadingDetails ? (
          <Loader />
        ) : errorDetails ? (
          <Message variant="danger">{errorDetails}</Message>
        ) : (
          <>
            {/* Student Information Section */}
            {(passportPhoto || admissionNumber || classLevel || department) && (
              <div className="mb-4 p-3 border rounded" style={{ backgroundColor: '#f8f9fa' }}>
                <h5 className="mb-3">Student Information</h5>
                <Row>
                  {passportPhoto && (
                    <Col md={3} className="mb-3">
                      <div>
                        <strong>Passport Photo:</strong>
                        <div className="mt-2">
                          <img
                            src={passportPhoto}
                            alt="Passport"
                            style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '5px' }}
                          />
                        </div>
                      </div>
                    </Col>
                  )}
                  <Col md={passportPhoto ? 9 : 12}>
                    {admissionNumber && (
                      <div className="mb-2">
                        <strong>Admission Number:</strong>
                        <p>{admissionNumber}</p>
                      </div>
                    )}
                    {classLevel && (
                      <div className="mb-2">
                        <strong>Class:</strong>
                        <p>{classLevel}</p>
                      </div>
                    )}
                    {department && (
                      <div className="mb-2">
                        <strong>Department:</strong>
                        <p>{department}</p>
                      </div>
                    )}
                  </Col>
                </Row>
              </div>
            )}

            {/* User Edit Form */}
            <Form onSubmit={submitHandler}>
              <Form.Group controlId="name">
                <Form.Label>Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                ></Form.Control>
              </Form.Group>

              <Form.Group controlId="email" className="mt-3">
                <Form.Label>Email Address</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Enter email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                ></Form.Control>
              </Form.Group>

              <Form.Group controlId="role" className="mt-3">
                <Form.Label>Role</Form.Label>
                <Form.Control
                  as="select"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option>Student</option>
                  <option>Moderator</option>
                  <option>Super Admin</option>
                </Form.Control>
              </Form.Group>

              <Form.Group controlId="isactive" className="my-3">
                <Form.Check
                  type="checkbox"
                  label="Is Active"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                ></Form.Check>
              </Form.Group>

              <Button type="submit" variant="primary">
                Update
              </Button>
            </Form>
          </>
        )}
      </FormContainer>
    </>
  );
};

export default UserEditScreen;
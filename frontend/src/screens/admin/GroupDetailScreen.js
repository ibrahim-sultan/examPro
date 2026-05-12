import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Row, Col, Table, Button } from 'react-bootstrap';
import Loader from '../../components/Loader';
import Message from '../../components/Message';
import { getGroupDetails } from '../../store/slices/groupSlice';

const departmentOptions = ['Science', 'Art', 'Commercial'];

const normalizeDepartment = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return '';
  if (/^general$/i.test(normalized)) return 'general';
  if (/^science$/i.test(normalized)) return 'science';
  if (/^art$/i.test(normalized)) return 'art';
  if (/^(commercial|commerce|business|business studies|comm)$/i.test(normalized)) return 'commercial';
  return normalized;
};

const GroupDetailScreen = () => {
  const params = useParams();
  const dispatch = useDispatch();
  const { groupDetails, loadingDetails, errorDetails } = useSelector((state) => state.group);
  const [selectedDepartment, setSelectedDepartment] = useState('');

  useEffect(() => {
    if (params.id) {
      dispatch(getGroupDetails(params.id));
    }
  }, [dispatch, params.id]);

  const className = groupDetails?.name || '';
  const members = useMemo(
    () => (Array.isArray(groupDetails?.members) ? groupDetails.members : []),
    [groupDetails]
  );

  const sortedMembers = useMemo(() => {
    const activeMembers = members.filter((member) => member?.name);
    if (className.startsWith('SS')) {
      if (!selectedDepartment) return [];
      const normalizedSelected = normalizeDepartment(selectedDepartment);
      return activeMembers
        .filter((member) => normalizeDepartment(member.department) === normalizedSelected)
        .sort((a, b) => a.name.localeCompare(b.name));
    }
    return activeMembers.sort((a, b) => a.name.localeCompare(b.name));
  }, [members, className, selectedDepartment]);

  const departmentCounts = useMemo(() => {
    return departmentOptions.reduce((acc, dept) => {
      const normalizedDept = normalizeDepartment(dept);
      acc[dept] = members.filter((member) => normalizeDepartment(member.department) === normalizedDept).length;
      return acc;
    }, {});
  }, [members]);

  return (
    <>
      <Row className="align-items-center mb-3">
        <Col>
          <h1>{className || 'Class Details'}</h1>
        </Col>
        <Col className="text-end">
          <Button as={Link} to="/admin/grouplist" variant="secondary">
            Back to Classes
          </Button>
        </Col>
      </Row>

      {loadingDetails ? (
        <Loader />
      ) : errorDetails ? (
        <Message variant="danger">{errorDetails}</Message>
      ) : (
        <>
          {className.startsWith('SS') && (
            <div className="mb-4">
              <h5>Choose a department</h5>
              {departmentOptions.map((department) => (
                <Button
                  key={department}
                  variant={selectedDepartment === department ? 'primary' : 'outline-primary'}
                  className="me-2 mb-2"
                  onClick={() => setSelectedDepartment(department)}
                >
                  {department} ({departmentCounts[department] || 0})
                </Button>
              ))}
            </div>
          )}

          {className.startsWith('SS') && !selectedDepartment ? (
            <Message variant="info">Select a department to view students.</Message>
          ) : (
            <>
              <h5>
                {className.startsWith('SS')
                  ? `Students in ${className} ${selectedDepartment ? `- ${selectedDepartment}` : ''}`
                  : `Students in ${className}`}
              </h5>
              {sortedMembers.length === 0 ? (
                <Message variant="warning">No students found for this selection.</Message>
              ) : (
                <Table striped bordered hover responsive className="table-sm mt-3">
                  <thead>
                    <tr>
                      <th>Full Name</th>
                      <th>Email</th>
                      <th>Admission Number</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedMembers.map((student) => (
                      <tr key={student._id || student.email || student.name}>
                        <td>{student.name || '-'}</td>
                        <td>{student.email || '-'}</td>
                        <td>{student.admissionNumber || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </>
          )}
        </>
      )}
    </>
  );
};

export default GroupDetailScreen;

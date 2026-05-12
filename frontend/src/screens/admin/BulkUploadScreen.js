import React, { useState } from 'react';
import { Row, Col, Card, Button, Form, ListGroup, Table } from 'react-bootstrap';
import axios from 'axios';
import { useSelector } from 'react-redux';
import API_BASE_URL from '../../config/api';

const BulkUploadScreen = () => {
  const { userInfo } = useSelector((s) => s.user);
  const [qFile, setQFile] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [sFile, setSFile] = useState(null);
  const [msg, setMsg] = useState('');
  const [uploadResults, setUploadResults] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  const loadStudents = async () => {
    try {
      setStudentsLoading(true);
      const { data } = await axios.get(`${API_BASE_URL}/api/users`, {
        headers: { Authorization: `Bearer ${userInfo?.token}` },
      });
      const studentRows = (data || [])
        .filter((u) => String(u.role || '').toLowerCase() === 'student')
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setStudents(studentRows);
    } catch {
      setStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  };

  const upload = async (path, file, images = []) => {
    const fd = new FormData();
    fd.append('file', file);
    images.forEach((imageFile) => fd.append('images', imageFile));
    const { data } = await axios.post(path, fd, {
      headers: {
        Authorization: `Bearer ${userInfo?.token}`,
      },
    });
    return data;
  };

  const submit = async (e) => {
    e.preventDefault();
    setMsg('');
    setUploadResults([]);
    try {
      const results = [];
      if (qFile) {
        const questionResult = await upload(`${API_BASE_URL}/api/bulk/questions`, qFile, imageFiles);
        results.push({ type: 'questions', result: questionResult });
      }
      if (sFile) {
        const studentResult = await upload(`${API_BASE_URL}/api/bulk/students`, sFile);
        results.push({ type: 'students', result: studentResult });
        await loadStudents();
      }
      setMsg('Upload completed');
      setUploadResults(results);
    } catch (error) {
      const errorData = error.response?.data;
      if (errorData && errorData.failedRows) {
        // Show validation errors
        setUploadResults([{ type: 'questions', result: errorData }]);
        setMsg('Upload failed due to validation errors. See details below.');
      } else {
        setMsg('Upload failed: ' + (errorData?.message || error.message));
      }
    }
  };

  const uploadPassport = async (studentId, file) => {
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append('image', file);
      await axios.post(`${API_BASE_URL}/api/users/${studentId}/passport`, fd, {
        headers: { Authorization: `Bearer ${userInfo?.token}` },
      });
      await loadStudents();
    } catch (error) {
      setMsg('Passport upload failed: ' + (error.response?.data?.message || error.message));
    }
  };

  React.useEffect(() => {
    if (userInfo?.token) loadStudents();
  }, [userInfo?.token]);

  const downloadTemplate = (type) => {
    const headers =
      type === 'questions'
        ? ['questionLabel', 'question', 'instruction', 'subject', 'classLevel', 'department', 'type', 'optionA', 'optionB', 'optionC', 'optionD', 'correctAnswer', 'explanation', 'image']
        : ['firstname', 'lastname', 'email', 'admissionNumber', 'password', 'class', 'department'];
    const csvContent = headers.join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = type + '_template.csv';
    a.click();
  };

  return (
    <Row>
      <Col md={8}>
        <Card>
          <Card.Header>Bulk Upload</Card.Header>
          <Card.Body>
            <Form onSubmit={submit}>
              <Form.Group className="mb-3">
                <Form.Label>Questions File (CSV/XLSX)</Form.Label>
                <Form.Control
                  type="file"
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  onChange={(e) => setQFile(e.target.files[0])}
                />
                <div className="small mt-1">
                  <Button size="sm" variant="link" onClick={() => downloadTemplate('questions')}>
                    Download questions template
                  </Button>
                </div>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Question Images (optional)</Form.Label>
                <Form.Control
                  type="file"
                  accept="image/*"
                  multiple
                  webkitdirectory="true"
                  directory="true"
                  onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
                />
                <div className="small mt-1">
                  Upload image files or a folder containing images. Use the exact image filename in the CSV <code>image</code> or <code>imageUrl</code> column.
                </div>
              </Form.Group>
              <div className="alert alert-secondary small">
                <strong>Question Template Fields:</strong>
                <ul>
                  <li><code>question</code> - The question text (required)</li>
                  <li><code>instruction</code> - Optional shared theory instruction or prompt (for theory questions)</li>
                  <li><code>questionLabel</code> - Optional label for theory numbering (e.g. 1a, 1ii)</li>
                  <li><code>subject</code> - Subject name (required)</li>
                  <li><code>classLevel</code> - JSS1, JSS2, JSS3, SS1, SS2, SS3 (required)</li>
                  <li><code>department</code> - General (for JSS), Science/Art/Commercial (for SS). Leave blank for JSS (will default to General)</li>
                  <li><code>type</code> - 'objective' or 'theory' (optional - will be inferred)</li>
                  <li><code>optionA, optionB, optionC, optionD</code> - Answer options for objective questions</li>
                  <li><code>correctAnswer</code> - The correct answer (must match one of the options)</li>
                  <li><code>explanation</code> - Optional explanation</li>
                  <li><code>image</code> - Optional image filename when uploading images with the form</li>
                </ul>
                <strong>Notes:</strong>
                <br />
                - Use plain text or LaTeX markup in the question and options, for example: <code>what is 3^2 + 4^2?</code> or <code>\(3^2 + 4^2\)</code>
                <br />
                - Do not use Excel built-in equation objects in the cell; export to CSV will usually not preserve them correctly.
                <br />
                - Upload the image files with the form and use the exact filename in the CSV <code>image</code> column
                <br />
                - Staff can only upload questions for subjects assigned to them
                <br />
                - For objective questions: provide at least 2 options and a correctAnswer
                <br />
                - For theory questions: only question, subject, classLevel are required
                <br />
                - Valid departments are General for JSS and Science/Art/Commercial for SS
              </div>
              <Form.Group className="mb-3">
                <Form.Label>Students File (CSV/XLSX)</Form.Label>
                <Form.Control
                  type="file"
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  onChange={(e) => setSFile(e.target.files[0])}
                />
                <div className="small mt-1">
                  <Button size="sm" variant="link" onClick={() => downloadTemplate('students')}>
                    Download students template
                  </Button>
                </div>
              </Form.Group>
              <div className="alert alert-secondary small">
                <strong>Student Template Fields:</strong>
                <ul>
                  <li><code>firstname</code> - Student's first name (required)</li>
                  <li><code>lastname</code> - Student's last name (required)</li>
                  <li><code>email</code> - Student's email address (required)</li>
                  <li><code>admissionNumber</code> - Unique admission number (required)</li>
                  <li><code>password</code> - Account password (optional - defaults to 'ChangeMe123!')</li>
                  <li><code>class</code> - JSS1, JSS2, JSS3, SS1, SS2, SS3 (required)</li>
                  <li><code>department</code> - General (for JSS), Science/Art/Commercial (for SS). Leave blank for JSS (will default to General)</li>
                </ul>
                <strong>Notes:</strong>
                <br />
                - Email must be unique
                <br />
                - Valid departments are General for JSS and Science/Art/Commercial for SS
              </div>
              <Button type="submit" variant="primary">
                Upload
              </Button>
            </Form>

            {msg && <div className="mt-3">{msg}</div>}
            {uploadResults.length > 0 && (
              <div className="mt-3">
                <h5>Upload summary</h5>
                {uploadResults.map(({ type, result }) => (
                  <div key={type} className="mb-4">
                    <h6>{type === 'questions' ? 'Questions Upload' : 'Students Upload'}</h6>
                    <ListGroup>
                      {result.totalRows !== undefined && (
                        <ListGroup.Item>Total rows: {result.totalRows}</ListGroup.Item>
                      )}
                      {result.successCount !== undefined && (
                        <ListGroup.Item>Successful rows: {result.successCount}</ListGroup.Item>
                      )}
                      {result.duplicateCount !== undefined && (
                        <ListGroup.Item>Duplicate rows skipped: {result.duplicateCount}</ListGroup.Item>
                      )}
                      {result.failedCount !== undefined && (
                        <ListGroup.Item>Failed rows: {result.failedCount}</ListGroup.Item>
                      )}
                      {result.upserted !== undefined && (
                        <ListGroup.Item>Upserted students: {result.upserted}</ListGroup.Item>
                      )}
                      {result.modified !== undefined && (
                        <ListGroup.Item>Modified students: {result.modified}</ListGroup.Item>
                      )}
                    </ListGroup>
                    {result.failedRows && result.failedRows.length > 0 && (
                      <div className="mt-3">
                        <h6>Failed rows</h6>
                        <ListGroup variant="flush">
                          {result.failedRows.map((row) => (
                            <ListGroup.Item key={`failed-${type}-${row.row}`}>
                              Row {row.row}: {row.errors.join('; ')}
                            </ListGroup.Item>
                          ))}
                        </ListGroup>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4">
              <h5>Student Passport Enrolment</h5>
              <p className="small text-muted mb-2">
                Upload or update passport photos immediately after student bulk upload.
              </p>
              {studentsLoading ? (
                <div>Loading students...</div>
              ) : (
                <Table striped bordered hover responsive className="table-sm">
                  <thead>
                    <tr>
                      <th>NAME</th>
                      <th>EMAIL</th>
                      <th>ADMISSION NO</th>
                      <th>PASSPORT</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.slice(0, 30).map((student) => (
                      <tr key={student._id}>
                        <td>{student.name}</td>
                        <td>{student.email}</td>
                        <td>{student.admissionNumber || '-'}</td>
                        <td>{student.passportPhoto ? 'Uploaded' : 'Not uploaded'}</td>
                        <td>
                          <input
                            id={`passport-bulk-${student._id}`}
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => uploadPassport(student._id, e.target.files?.[0])}
                          />
                          <Button
                            size="sm"
                            variant={student.passportPhoto ? 'success' : 'secondary'}
                            onClick={() =>
                              document.getElementById(`passport-bulk-${student._id}`)?.click()
                            }
                          >
                            {student.passportPhoto ? 'Update Passport' : 'Upload Passport'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default BulkUploadScreen;

import React, { useState } from 'react';
import { Row, Col, Card, Button, Form } from 'react-bootstrap';
import axios from 'axios';
import { useSelector } from 'react-redux';

const BulkUploadScreen = () => {
  const { userInfo } = useSelector((s) => s.user);
  const [qFile, setQFile] = useState(null);
  const [sFile, setSFile] = useState(null);
  const [msg, setMsg] = useState('');

  const upload = async (path, file) => {
    const fd = new FormData();
    fd.append('file', file);
    await axios.post(path, fd, { headers: { Authorization: `Bearer ${userInfo?.token}` } });
  };

  const submit = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      if (qFile) await upload('/api/bulk/questions', qFile);
      if (sFile) await upload('/api/bulk/students', sFile);
      setMsg('Upload successful');
    } catch {
      setMsg('Upload failed');
    }
  };

  const downloadTemplate = (type) => {
    const headers = type === 'questions'
      ? ['subject,questionText,option1,option2,option3,option4,correctOption,explanation']
      : ['name,email,password,role,isActive'];
    const blob = new Blob([headers.join('\n') + '\n'], { type: 'text/csv' });
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
                <Form.Control type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={(e) => setQFile(e.target.files[0])} />
                <div className="small mt-1">
                  <Button size="sm" variant="link" onClick={() => downloadTemplate('questions')}>Download questions template</Button>
                </div>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Students File (CSV/XLSX)</Form.Label>
                <Form.Control type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={(e) => setSFile(e.target.files[0])} />
                <div className="small mt-1">
                  <Button size="sm" variant="link" onClick={() => downloadTemplate('students')}>Download students template</Button>
                </div>
              </Form.Group>
              <Button type="submit" variant="primary">Upload</Button>
            </Form>
            {msg && <div className="mt-3">{msg}</div>}
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default BulkUploadScreen;

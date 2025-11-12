
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { logout } from '../store/slices/userSlice';

const Header = () => {
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.user);

  const logoutHandler = () => {
    dispatch(logout());
  };

  return (
    <header>
      <Navbar expand="md" collapseOnSelect className="navbar-glass">
        <Container>
          <LinkContainer to="/">
            <Navbar.Brand className="brand-gradient fw-bold">ExamPro</Navbar.Brand>
          </LinkContainer>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto align-items-lg-center gap-2">
              <LinkContainer to="/">
                <Nav.Link>Home</Nav.Link>
              </LinkContainer>
              {userInfo ? (
                <NavDropdown title={userInfo.name} id="username">
                  <LinkContainer to="/profile">
                    <NavDropdown.Item>Profile</NavDropdown.Item>
                  </LinkContainer>
                  <NavDropdown.Item onClick={logoutHandler}>Logout</NavDropdown.Item>
                </NavDropdown>
              ) : (
                <LinkContainer to="/login">
                  <Nav.Link className="btn btn-sm btn-gradient text-white px-3">Sign In</Nav.Link>
                </LinkContainer>
              )}
              {(userInfo && (userInfo.role === 'Super Admin' || userInfo.role === 'Moderator')) && (
                <NavDropdown title="Admin" id="adminmenu">
                  <LinkContainer to="/admin/userlist">
                    <NavDropdown.Item>Users</NavDropdown.Item>
                  </LinkContainer>
                  <LinkContainer to="/admin/grouplist">
                    <NavDropdown.Item>Groups</NavDropdown.Item>
                  </LinkContainer>
                  <LinkContainer to="/admin/questionlist">
                    <NavDropdown.Item>Questions</NavDropdown.Item>
                  </LinkContainer>
                  <LinkContainer to="/admin/examlist">
                    <NavDropdown.Item>Exams</NavDropdown.Item>
                  </LinkContainer>
                  <LinkContainer to="/admin/monitoring">
                    <NavDropdown.Item>Monitoring</NavDropdown.Item>
                  </LinkContainer>
                  <LinkContainer to="/admin/bulk">
                    <NavDropdown.Item>Bulk Upload</NavDropdown.Item>
                  </LinkContainer>
                </NavDropdown>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </header>
  );
};

export default Header;

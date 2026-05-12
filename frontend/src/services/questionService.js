
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://exampro-ysox.onrender.com'
    : 'http://localhost:5000');
const API_URL = `${API_BASE_URL}/api/questions/`;

// Get all questions
const listQuestions = async (token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const { data } = await axios.get(API_URL, config);
  return data;
};

// Create new question
const createQuestion = async (questionData, token) => {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };

  const { data } = await axios.post(API_URL, questionData, config);
  return data;
};

// Delete question
const deleteQuestion = async (questionId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  await axios.delete(API_URL + questionId, config);
  return questionId;
};

const deleteQuestionsBulk = async (ids, token) => {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };
  const { data } = await axios.post(`${API_URL}bulk-delete`, { ids }, config);
  return data;
};

// Get question details
const getQuestionDetails = async (questionId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const { data } = await axios.get(API_URL + questionId, config);
  return data;
};

// Update question
const updateQuestion = async (questionData, token) => {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };

  const { data } = await axios.put(
    API_URL + questionData._id,
    questionData,
    config
  );
  return data;
};

const questionService = {
  listQuestions,
  createQuestion,
  deleteQuestion,
  deleteQuestionsBulk,
  getQuestionDetails,
  updateQuestion,
};

export default questionService;

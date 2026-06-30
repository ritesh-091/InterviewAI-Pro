const request = require('supertest');
const express = require('express');
const authRoutes = require('../src/routes/auth');

// Mock User Model to isolate test database connections
jest.mock('../src/models/User', () => {
  return {
    findOne: jest.fn(),
    create: jest.fn()
  };
});

const User = require('../src/models/User');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

// Isolated error handler mock
app.use((err, req, res, next) => {
  res.status(err.statusCode || 400).json({ message: err.message });
});

describe('Authentication API Endpoint Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should validate missing registration parameters', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'candidate@university.edu' }); // Missing name and password

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('should reject registration if the candidate already exists', async () => {
      // Mock existing candidate response
      User.findOne.mockResolvedValue({ email: 'existing@university.edu' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Existing Candidate',
          email: 'existing@university.edu',
          password: 'securePassword2026'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should validate missing login parameters', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'candidate@university.edu' }); // Missing password

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('required');
    });
  });
});

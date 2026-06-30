# REST API Specification & Endpoint Documentation

The InterviewAI Pro platform exposes a secure REST API mapped under the `/api` root.

## Authentication System (`/api/auth`)

### 1. Register Account
- **Path**: `POST /api/auth/register`
- **Headers**: `Content-Type: application/json`
- **Request Payload**:
  ```json
  {
    "name": "E2E Developer",
    "email": "e2e.dev@example.com",
    "password": "password123"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "token": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi...",
    "user": {
      "id": "60c72b2f9b1d8a25c8e2b867",
      "email": "e2e.dev@example.com",
      "profile": { "name": "E2E Developer" }
    }
  }
  ```

### 2. Login Credentials
- **Path**: `POST /api/auth/login`
- **Request Payload**:
  ```json
  {
    "email": "e2e.dev@example.com",
    "password": "password123"
  }
  ```

### 3. Refresh Access Token
- **Path**: `POST /api/auth/refresh`
- **Request Payload**:
  ```json
  {
    "refreshToken": "eyJhbGciOi..."
  }
  ```

---

## AI Resume Parser (`/api/resumes`)

### 1. Upload & Analyze Resume
- **Path**: `POST /api/resumes/analyze`
- **Headers**: `Content-Type: multipart/form-data`
- **Request Body**:
  - `resume`: PDF file binary.
  - `jobDescription` (Optional): String target.
- **Response (200 OK)**:
  ```json
  {
    "score": 85,
    "analysis": {
      "summary": "Strong engineering profile with rich React experience.",
      "skillsMatch": ["React", "Express", "Node.js"],
      "missingSkills": ["Docker", "Kubernetes"],
      "actionableFeedback": "Consider incorporating containerization concepts."
    }
  }
  ```

---

## Mock Interviews rounds (`/api/interviews`)

### 1. Start Interview Session
- **Path**: `POST /api/interviews/start`
- **Request Payload**:
  ```json
  {
    "type": "Technical"
  }
  ```

### 2. Submit Question Answer
- **Path**: `POST /api/interviews/answer`
- **Headers**: `Content-Type: multipart/form-data`
- **Request Body**:
  - `interviewId`: Mongoose string ID.
  - `answer`: Text string response transcription.
  - `audio` (Optional): Recorded audio `.webm` file.

---

## AI Career Coach Conversations (`/api/coach`)

### 1. Stream Coach Chat Response (SSE)
- **Path**: `GET /api/coach/chat/stream?prompt=roadmap`
- **Headers**: `Accept: text/event-stream`
- **Data Payload Chunks**:
  ```
  data: {"text": "Learn"}
  data: {"text": " React"}
  data: [DONE]
  ```

---

## Coding Challenges Sandbox (`/api/coding`)

### 1. Execute Code
- **Path**: `POST /api/coding/run`
- **Request Payload**:
  ```json
  {
    "challengeId": "two-sum",
    "code": "function twoSum(nums, target) { ... }",
    "language": "javascript"
  }
  ```

---

## target Companies prep syllabus (`/api/companies`)

### 1. Get Target Brands list
- **Path**: `GET /api/companies`

### 2. Toggle bookmark
- **Path**: `POST /api/companies/:name/bookmark`

### 3. Solved blog review upload
- **Path**: `POST /api/companies/:name/experience`
- **Payload**:
  ```json
  {
    "role": "SDE 1",
    "content": "Detailed DSA problems.",
    "rating": 5
  }
  ```

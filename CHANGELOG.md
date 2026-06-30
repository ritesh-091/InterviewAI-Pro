# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-06-30

### Added
- **Core SaaS Integrations**: Full-stack connection of React clients and Express APIs to MongoDB, Gemini, Razorpay, Cloudinary, Resend, and Redis.
- **Silent Refresh Tokens**: Automated JWT token rotation wrapper inside client `api.js` request client.
- **Real-time Evaluator States**: WebSockets integration via Socket.IO pushing AI status changes to screens during mock evaluations.
- **ATS Resumes Scanner**: PDF file content parser tracking match metrics against Job Descriptions.
- **Audio Voice Savings**: Voice clips uploading to Cloudinary and database log saving. Includes audio playback inside results.
- **REST API Specs**: Thorough REST route mapping specifications.
- **Docker Orchestration**: Complete Dockerfile scripts and Compose multi-container targets.

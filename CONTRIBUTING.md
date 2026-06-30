# Contributing Guidelines

Thank you for choosing to contribute to InterviewAI Pro! We appreciate your support.

## Code Style Guidelines
- Maintain separation between React page components and REST utility helpers.
- Store sensitive values under `.env` configurations only; do not hardcode key values inside client files.
- Write explanatory comments for advanced AI stream decoders or payment signature hashing loops.

## Pull Request Lifecycle
1. Fork the codebase and create a target feature branch (`feature/your-action`).
2. Implement code changes, ensuring that all local tests run and compile cleanly:
   ```bash
   npm test --prefix server
   ```
3. Commit using descriptive commits messages, and push changes to your remote fork.
4. Submit a Pull Request targeting the `main` branch.

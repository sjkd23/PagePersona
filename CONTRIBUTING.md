# Contributing to PagePersonAI

Thank you for your interest in contributing to PagePersonAI! This document provides guidelines and information for contributors.

## Table of Contents

* [Code of Conduct](#code-of-conduct)
* [Getting Started](#getting-started)
* [Development Setup](#development-setup)
* [Making Changes](#making-changes)
* [Submitting Changes](#submitting-changes)
* [Code Style](#code-style)
* [Testing](#testing)
* [Documentation](#documentation)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors. Please be professional and courteous in all interactions.

## Getting Started

### Prerequisites

* Node.js 18 or higher
* npm 9 or higher
* Git
* MongoDB (for local development)
* Redis (optional, falls back to in-memory storage)

### Development Setup

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/PagePersonAI.git
   cd PagePersonAI
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Set up environment variables**:
   ```bash
   cp .env.development .env.local
   # Edit .env.local with your configuration
   ```

5. **Start development servers**:
   ```bash
   npm run start:dev
   ```

## Making Changes

### Branch Strategy

* Create feature branches from `main`
* Use descriptive branch names: `feature/add-new-persona` or `fix/auth-bug`
* Keep branches focused on a single feature or fix

### Development Workflow

1. **Create a new branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the code style guidelines
3. **Add tests** for new functionality
4. **Run tests** to ensure nothing is broken:
   ```bash
   npm run test
   npm run typecheck
   npm run lint
   ```

5. **Commit your changes** with clear messages:
   ```bash
   git commit -m "feat: add new persona type for technical documentation"
   ```

6. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

## Submitting Changes

### Pull Request Process

1. **Create a pull request** from your fork to the main repository
2. **Fill out the PR template** with:
   * Clear description of changes
   * Link to related issues
   * Testing information
   * Screenshots (if applicable)

3. **Ensure all checks pass**:
   * TypeScript compilation
   * Linting
   * Tests
   * Build process

4. **Respond to feedback** from maintainers
5. **Update your PR** as needed

### PR Requirements

* All tests must pass
* Code must be properly typed with TypeScript
* Documentation must be updated for new features
* Changes must not break existing functionality

## Code Style

### TypeScript

* Use TypeScript for all new code
* Provide proper type annotations
* Use interfaces for object structures
* Follow existing naming conventions

### Formatting

* Use Prettier for code formatting
* Run `npm run format` before committing
* Follow ESLint rules: `npm run lint`

### Best Practices

* Use descriptive variable and function names
* Add JSDoc comments for complex functions
* Keep functions small and focused
* Use async/await over promises
* Handle errors appropriately

### File Organization

* Group related files in logical directories
* Use index files for clean imports
* Follow established naming patterns
* Keep components focused and reusable

## Testing

### Test Requirements

* Write unit tests for new functions
* Add integration tests for API endpoints
* Test error handling paths
* Maintain test coverage above 80%

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific workspace tests
npm run test --workspace=server
npm run test --workspace=client
```

### Test Structure

* Place tests in `__tests__` directories
* Use descriptive test names
* Follow AAA pattern (Arrange, Act, Assert)
* Mock external dependencies

## Documentation

### Code Documentation

* Add JSDoc comments for public functions
* Document complex algorithms
* Explain non-obvious code sections
* Update API documentation for changes

### README Updates

* Update README files for new features
* Add usage examples
* Document configuration options
* Keep installation instructions current

### API Documentation

* Update OpenAPI specifications
* Document new endpoints
* Provide request/response examples
* Include error responses

## Review Process

### For Contributors

* Be responsive to feedback
* Make requested changes promptly
* Ask questions if feedback is unclear
* Test changes thoroughly

### For Maintainers

* Review code for quality and consistency
* Test functionality locally
* Provide constructive feedback
* Approve when standards are met

## Issue Reporting

### Bug Reports

Include:
* Clear description of the problem
* Steps to reproduce
* Expected vs actual behavior
* Environment details
* Error messages/logs

### Feature Requests

Include:
* Clear description of the feature
* Use cases and benefits
* Potential implementation approach
* Mockups or examples (if applicable)

## Community Guidelines

### Communication

* Be respectful and professional
* Use clear and concise language
* Provide context for discussions
* Help other contributors

### Collaboration

* Share knowledge and expertise
* Offer help to newcomers
* Participate in discussions
* Provide constructive feedback

## Recognition

Contributors will be recognized in:
* CHANGELOG.md for significant contributions
* GitHub contributors list
* Project documentation
* Release notes

## Questions?

If you have questions about contributing:
* Check existing issues and discussions
* Create a new issue for questions
* Join community discussions
* Contact maintainers directly

---

Thank you for contributing to PagePersonAI! Your efforts help make the project better for everyone.

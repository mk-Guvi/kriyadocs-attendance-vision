# Test Documentation

This directory contains comprehensive tests for the Smart Attendance Tracker application.

## Test Structure

```
test/
├── unit/                    # Unit tests for isolated components
│   ├── components/         # React component tests
│   ├── hooks/             # Custom hook tests
│   └── utils/             # Utility function tests
├── integration/           # Integration tests for workflows
├── e2e/                  # End-to-end tests
├── mocks/                # Test mocks and fixtures
├── setup/                # Test configuration
└── README.md             # This file
```

## Running Tests

### All Tests
```bash
npm test
```

### Specific Test Types
```bash
# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## Test Categories

### Unit Tests

**Components (`test/unit/components/`)**
- Component rendering
- Props handling
- User interactions
- State management
- Error boundaries

**Hooks (`test/unit/hooks/`)**
- Custom hook logic
- State updates
- Side effects
- Error handling

**Utils (`test/unit/utils/`)**
- Pure functions
- Data transformations
- Validation logic

### Integration Tests

**Attendance Flow (`test/integration/attendance-flow.test.ts`)**
- Complete user journey
- Form submission
- Camera capture
- Face detection
- Data persistence

**Face Detection (`test/integration/face-detection.test.ts`)**
- Model loading
- Image processing
- Face matching
- Confidence scoring

**Camera Capture (`test/integration/camera-capture.test.ts`)**
- Camera permissions
- Stream handling
- Image capture
- Error scenarios

### E2E Tests

**Full Application (`test/e2e/attendance-tracker.spec.ts`)**
- Browser automation
- Real camera simulation
- Cross-browser testing
- Performance metrics

## Test Tools and Libraries

- **Testing Framework**: Jest
- **React Testing**: React Testing Library
- **E2E Testing**: Playwright
- **Mocking**: Jest mocks + MSW
- **Coverage**: Istanbul/c8

## Mock Data

Test mocks include:
- Sample face detection results
- Mock camera streams
- Dummy attendance records
- Simulated API responses

## Test Utilities

Common test utilities:
- Component render helpers
- Mock store providers
- Custom matchers
- Async test helpers

## Coverage Requirements

Minimum coverage targets:
- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 80%

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Main branch commits
- Release builds

## Writing New Tests

### Component Tests
```typescript
import { render, screen } from '@testing-library/react';
import { AttendanceForm } from '@/components/AttendanceForm';

describe('AttendanceForm', () => {
  it('should render form fields', () => {
    render(<AttendanceForm onSubmit={jest.fn()} />);
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });
});
```

### Hook Tests
```typescript
import { renderHook, act } from '@testing-library/react';
import { useCamera } from '@/hooks/useCamera';

describe('useCamera', () => {
  it('should start camera successfully', async () => {
    const { result } = renderHook(() => useCamera());
    
    await act(async () => {
      await result.current.startCamera();
    });
    
    expect(result.current.cameraState.isActive).toBe(true);
  });
});
```

## Performance Testing

Performance benchmarks:
- Component render times
- Face detection speed
- Image processing latency
- Memory usage patterns

## Accessibility Testing

A11y test coverage:
- Keyboard navigation
- Screen reader compatibility
- Color contrast
- Focus management

## Browser Compatibility

Tested browsers:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Mobile Testing

Mobile-specific tests:
- Touch interactions
- Camera access
- Responsive design
- Performance on devices

## Troubleshooting Tests

Common test issues:
- Camera mocking failures
- Async operation timeouts
- Face detection model loading
- Mock cleanup problems

For detailed test implementation examples, see the individual test files in their respective directories.
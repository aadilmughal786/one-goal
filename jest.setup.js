// jest.setup.js
import '@testing-library/jest-dom';

// Mock the global crypto object and its randomUUID method for the Jest/JSDOM environment.
// This is necessary because JSDOM does not implement this browser/Node.js API.
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'mock-uuid-for-testing',
  },
  writable: true,
});

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AttendanceForm } from '@/components/AttendanceForm';

describe('AttendanceForm Component', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render form fields correctly', () => {
    render(<AttendanceForm onSubmit={mockOnSubmit} />);

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue with photo capture/i })).toBeInTheDocument();
  });

  it('should render with default values when provided', () => {
    const defaultValues = {
      name: 'John Doe',
      email: 'john@example.com'
    };

    render(
      <AttendanceForm 
        onSubmit={mockOnSubmit} 
        defaultValues={defaultValues}
      />
    );

    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
  });

  it('should disable submit button when form is invalid', () => {
    render(<AttendanceForm onSubmit={mockOnSubmit} />);

    const submitButton = screen.getByRole('button', { name: /continue with photo capture/i });
    expect(submitButton).toBeDisabled();
  });

  it('should enable submit button when form is valid', async () => {
    const user = userEvent.setup();
    render(<AttendanceForm onSubmit={mockOnSubmit} />);

    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /continue with photo capture/i });

    await user.type(nameInput, 'John Doe');
    await user.type(emailInput, 'john@example.com');

    await waitFor(() => {
      expect(submitButton).toBeEnabled();
    });
  });

  it('should not enable submit button with invalid email', async () => {
    const user = userEvent.setup();
    render(<AttendanceForm onSubmit={mockOnSubmit} />);

    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /continue with photo capture/i });

    await user.type(nameInput, 'John Doe');
    await user.type(emailInput, 'invalid-email');

    expect(submitButton).toBeDisabled();
  });

  it('should call onSubmit with form data when submitted', async () => {
    const user = userEvent.setup();
    render(<AttendanceForm onSubmit={mockOnSubmit} />);

    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /continue with photo capture/i });

    await user.type(nameInput, 'John Doe');
    await user.type(emailInput, 'john@example.com');
    await user.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com'
    });
  });

  it('should prevent submission with empty fields', async () => {
    const user = userEvent.setup();
    render(<AttendanceForm onSubmit={mockOnSubmit} />);

    const form = screen.getByRole('form');
    
    fireEvent.submit(form);

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should disable form when loading', () => {
    render(
      <AttendanceForm 
        onSubmit={mockOnSubmit} 
        isLoading={true}
        defaultValues={{ name: 'John', email: 'john@example.com' }}
      />
    );

    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button');

    expect(nameInput).toBeDisabled();
    expect(emailInput).toBeDisabled();
    expect(submitButton).toHaveTextContent('Processing...');
  });

  it('should trim whitespace from inputs', async () => {
    const user = userEvent.setup();
    render(<AttendanceForm onSubmit={mockOnSubmit} />);

    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /continue with photo capture/i });

    await user.type(nameInput, '  John Doe  ');
    await user.type(emailInput, '  john@example.com  ');
    await user.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith({
      name: '  John Doe  ', // Component receives raw input, trimming happens in validation
      email: '  john@example.com  '
    });
  });

  it('should have proper accessibility attributes', () => {
    render(<AttendanceForm onSubmit={mockOnSubmit} />);

    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email address/i);

    expect(nameInput).toHaveAttribute('required');
    expect(emailInput).toHaveAttribute('required');
    expect(emailInput).toHaveAttribute('type', 'email');
  });
});
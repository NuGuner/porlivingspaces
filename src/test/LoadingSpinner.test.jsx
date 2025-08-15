import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import LoadingSpinner from '../components/LoadingSpinner';

describe('LoadingSpinner Component', () => {
  it('renders with default props', () => {
    render(<LoadingSpinner />);
    
    expect(screen.getByText('กำลังโหลด...')).toBeInTheDocument();
  });

  it('renders with custom text', () => {
    const customText = 'กำลังบันทึก...';
    render(<LoadingSpinner text={customText} />);
    
    expect(screen.getByText(customText)).toBeInTheDocument();
  });

  it('renders without text when text prop is empty', () => {
    render(<LoadingSpinner text="" />);
    
    expect(screen.queryByText('กำลังโหลด...')).not.toBeInTheDocument();
  });

  it('applies correct size classes', () => {
    const { container } = render(<LoadingSpinner size="large" />);
    const spinner = container.querySelector('.w-12');
    
    expect(spinner).toBeInTheDocument();
  });
});
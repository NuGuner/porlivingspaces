import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Dashboard from '../components/Dashboard';

describe('Dashboard Component', () => {
  const mockRooms = [
    {
      id: '1',
      status: 'occupied',
      is_overdue: false,
      rent_price: 5000,
      current_bill: null,
    },
    {
      id: '2',
      status: 'vacant',
      is_overdue: false,
      rent_price: 0,
      current_bill: null,
    },
    {
      id: '3',
      status: 'occupied',
      is_overdue: true,
      rent_price: 6000,
      current_bill: null,
    },
  ];

  it('renders dashboard statistics correctly', () => {
    render(<Dashboard rooms={mockRooms} />);
    
    // Check if all dashboard cards are rendered
    expect(screen.getByText('ห้องว่าง')).toBeInTheDocument();
    expect(screen.getByText('ห้องมีผู้เช่า')).toBeInTheDocument();
    expect(screen.getByText('ห้องค้างค่าเช่า')).toBeInTheDocument();
    expect(screen.getByText('รายรับเดือนนี้')).toBeInTheDocument();
    expect(screen.getByText('ค่าเช่าค้างจ่าย')).toBeInTheDocument();
  });

  it('calculates room statistics correctly', () => {
    render(<Dashboard rooms={mockRooms} />);
    
    // Check occupied rooms count (2)
    expect(screen.getByText('2')).toBeInTheDocument();
    
    // Check that we have at least one "1" displayed (for vacant and overdue)
    const onesDisplayed = screen.getAllByText('1');
    expect(onesDisplayed.length).toBeGreaterThanOrEqual(2);
  });

  it('handles empty rooms array', () => {
    render(<Dashboard rooms={[]} />);
    
    // All statistics should show 0
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThan(0);
  });
});
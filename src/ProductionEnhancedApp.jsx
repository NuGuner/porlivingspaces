// Production-optimized Enhanced App without console logging
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useAuth } from './contexts/AuthContext';
import DatabaseSetup from './components/DatabaseSetup';

const ProductionEnhancedApp = () => {
  const { user, userProfile, signOut } = useAuth();
  const [buildings, setBuildings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [tenantLeases, setTenantLeases] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});

  // Tiered pricing configuration (stored in localStorage)
  const [waterRate, setWaterRate] = useState(() => {
    const saved = localStorage.getItem('waterRate');
    return saved ? parseFloat(saved) : 25; // ฿25 per unit
  });
  
  const [electricRate, setElectricRate] = useState(() => {
    const saved = localStorage.getItem('electricRate');
    return saved ? parseFloat(saved) : 10; // ฿10 per unit
  });

  // Minimum charge thresholds
  const [waterMinCharge] = useState(100); // ฿100 minimum (covers 1-4 units)
  const [electricMinCharge] = useState(100); // ฿100 minimum (covers 1-10 units)
  const [waterMinUnits] = useState(4); // 1-4 units = ฿100
  const [electricMinUnits] = useState(10); // 1-10 units = ฿100

  // Revenue history from database
  const [revenueHistory, setRevenueHistory] = useState({});

  useEffect(() => {
    fetchData();
    fetchRevenueHistory();
  }, []);

  // Calculate current monthly revenue
  const calculateCurrentRevenue = () => {
    return rooms.filter(r => r.status === 'occupied').reduce((sum, room) => {
      const bill = calculateBill(room);
      return sum + (bill?.total_amount || 0);
    }, 0);
  };

  // Get current month key
  const getCurrentMonthKey = () => {
    return new Date().toISOString().slice(0, 7); // YYYY-MM format
  };

  // Get previous month key
  const getPreviousMonthKey = () => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().slice(0, 7);
  };

  // Fetch revenue history from database
  const fetchRevenueHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('revenue_history')
        .select('*')
        .order('month_key', { ascending: false });
      
      if (error) {
        console.error('Error fetching revenue history:', error);
        return;
      }
      
      // Convert array to object for easy lookup
      const historyMap = {};
      data.forEach(record => {
        historyMap[record.month_key] = record.total_revenue;
      });
      
      setRevenueHistory(historyMap);
    } catch (error) {
      console.error('Failed to fetch revenue history:', error);
    }
  };

  // Update revenue history in database
  const updateRevenueHistory = async () => {
    const currentMonth = getCurrentMonthKey();
    const currentRevenue = calculateCurrentRevenue();
    const occupiedRooms = rooms.filter(r => r.status === 'occupied');
    
    // Calculate breakdown
    const totalRent = occupiedRooms.reduce((sum, room) => sum + (room.rent_price || 0), 0);
    const totalWaterCost = occupiedRooms.reduce((sum, room) => {
      const bill = calculateBill(room);
      return sum + (bill?.water_cost || 0);
    }, 0);
    const totalElectricCost = occupiedRooms.reduce((sum, room) => {
      const bill = calculateBill(room);
      return sum + (bill?.electric_cost || 0);
    }, 0);
    
    const revenueData = {
      month_key: currentMonth,
      total_revenue: currentRevenue,
      occupied_rooms: occupiedRooms.length,
      total_rent: totalRent,
      total_water_cost: totalWaterCost,
      total_electric_cost: totalElectricCost,
      water_rate: waterRate,
      electric_rate: electricRate
    };
    
    try {
      // Use upsert (insert or update if exists)
      const { error } = await supabase
        .from('revenue_history')
        .upsert(revenueData, { 
          onConflict: 'month_key',
          ignoreDuplicates: false 
        });
      
      if (error) {
        console.error('Error updating revenue history:', error);
        return;
      }
      
      // Update local state
      setRevenueHistory(prev => ({
        ...prev,
        [currentMonth]: currentRevenue
      }));
      
    } catch (error) {
      console.error('Failed to update revenue history:', error);
    }
  };

  // Get previous month revenue
  const getPreviousMonthRevenue = () => {
    const previousMonth = getPreviousMonthKey();
    return revenueHistory[previousMonth] || 0;
  };

  // Calculate revenue change percentage
  const getRevenueChange = () => {
    const current = calculateCurrentRevenue();
    const previous = getPreviousMonthRevenue();
    
    if (previous === 0) return { change: 0, percentage: 0 };
    
    const change = current - previous;
    const percentage = ((change / previous) * 100);
    
    return { change, percentage };
  };

  // Update revenue history when rooms change
  useEffect(() => {
    if (rooms.length > 0) {
      updateRevenueHistory();
    }
  }, [rooms, waterRate, electricRate]);

  const fetchData = async () => {
    setLoading(true);
    
    try {
      const { data: buildingsData, error: buildingsError } = await supabase
        .from('buildings')
        .select('*');
        
      if (buildingsError) {
        setError(`Buildings: ${buildingsError.message}`);
      } else {
        setBuildings(buildingsData || []);
        if (buildingsData && buildingsData.length > 0 && !selectedBuilding) {
          setSelectedBuilding(buildingsData[0].id);
        }
      }

      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select('*');
        
      if (roomsError) {
        setError(`Rooms: ${roomsError.message}`);
      } else {
        setRooms(roomsData || []);
      }

      // Fetch tenants data
      const { data: tenantsData, error: tenantsError } = await supabase
        .from('tenants')
        .select('*')
        .eq('is_active', true);
        
      if (tenantsError) {
        setError(`Tenants: ${tenantsError.message}`);
      } else {
        setTenants(tenantsData || []);
      }

      // Fetch tenant leases with tenant and room details
      const { data: leasesData, error: leasesError } = await supabase
        .from('tenant_leases')
        .select(`
          *,
          tenant:tenant_id(*),
          room:room_id(*)
        `)
        .eq('lease_status', 'active');
        
      if (leasesError) {
        setError(`Leases: ${leasesError.message}`);
      } else {
        setTenantLeases(leasesData || []);
      }

      // Fetch payments data
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .order('payment_month', { ascending: false });
        
      if (paymentsError) {
        setError(`Payments: ${paymentsError.message}`);
      } else {
        setPayments(paymentsData || []);
      }
      
      setLoading(false);
    } catch (error) {
      setError(`Failed to load data: ${error.message}`);
      setLoading(false);
    }
  };

  // Print bill function
  const printBill = () => {
    const printWindow = window.open('', '_blank');
    const bill = calculateBill(editingItem);
    const tenantInfo = getRoomTenantInfo(editingItem);
    
    if (!bill || !tenantInfo.isOccupied) return;
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - Room ${editingItem.room_number}</title>
        <style>
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
          body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.4;
            color: #333;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 5px;
          }
          .invoice-title {
            font-size: 20px;
            color: #059669;
            margin-top: 15px;
          }
          .invoice-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
          }
          .tenant-section, .property-section {
            flex: 1;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            margin: 0 10px;
          }
          .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 5px;
          }
          .info-row {
            margin: 5px 0;
            font-size: 14px;
          }
          .info-label {
            font-weight: bold;
            display: inline-block;
            width: 120px;
          }
          .billing-section {
            margin-top: 30px;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            overflow: hidden;
          }
          .billing-header {
            background: #2563eb;
            color: white;
            padding: 15px;
            font-size: 18px;
            font-weight: bold;
          }
          .billing-content {
            padding: 20px;
          }
          .billing-row {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
            padding: 5px 0;
            border-bottom: 1px solid #f3f4f6;
          }
          .billing-row.total {
            border-top: 2px solid #2563eb;
            border-bottom: none;
            font-weight: bold;
            font-size: 16px;
            margin-top: 15px;
            padding-top: 10px;
          }
          .utility-detail {
            font-size: 12px;
            color: #6b7280;
            margin-left: 20px;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
            font-size: 12px;
            color: #6b7280;
          }
          .print-date {
            text-align: right;
            font-size: 12px;
            color: #6b7280;
            margin-bottom: 20px;
          }
        </style>
      </head>
      <body>
        <div class="print-date">Printed: ${new Date().toLocaleString()}</div>
        
        <div class="header">
          <div class="company-name">🏢 PorLivingSpaces Property Management</div>
          <div class="invoice-title">Monthly Rental Invoice</div>
        </div>

        <div class="invoice-info">
          <div class="tenant-section">
            <div class="section-title">👤 Tenant Information</div>
            <div class="info-row"><span class="info-label">Name:</span> ${tenantInfo.tenant.full_name}</div>
            <div class="info-row"><span class="info-label">Tenant ID:</span> ${tenantInfo.tenant.tenant_id_number}</div>
            <div class="info-row"><span class="info-label">Phone:</span> ${tenantInfo.tenant.phone || 'Not provided'}</div>
            ${tenantInfo.tenant.email ? `<div class="info-row"><span class="info-label">Email:</span> ${tenantInfo.tenant.email}</div>` : ''}
            ${tenantInfo.tenant.address ? `<div class="info-row"><span class="info-label">Address:</span> ${tenantInfo.tenant.address}</div>` : ''}
            ${tenantInfo.tenant.emergency_contact_name ? `<div class="info-row"><span class="info-label">Emergency:</span> ${tenantInfo.tenant.emergency_contact_name} (${tenantInfo.tenant.emergency_contact_phone})</div>` : ''}
          </div>

          <div class="property-section">
            <div class="section-title">🏠 Property Information</div>
            <div class="info-row"><span class="info-label">Room:</span> ${editingItem.room_number}</div>
            <div class="info-row"><span class="info-label">Building:</span> ${buildings.find(b => b.id === editingItem.building_id)?.name || 'Unknown'}</div>
            <div class="info-row"><span class="info-label">Invoice Date:</span> ${new Date().toLocaleDateString()}</div>
            <div class="info-row"><span class="info-label">Period:</span> ${bill.month}</div>
            <div class="info-row"><span class="info-label">Due Date:</span> ${new Date(bill.due_date).toLocaleDateString()}</div>
            <div class="info-row"><span class="info-label">Lease Period:</span> ${bill.lease_period}</div>
            ${tenantInfo.lease.security_deposit > 0 ? `<div class="info-row"><span class="info-label">Deposit:</span> ฿${tenantInfo.lease.security_deposit.toLocaleString()}</div>` : ''}
          </div>
        </div>

        <div class="billing-section">
          <div class="billing-header">💰 Monthly Charges Breakdown</div>
          <div class="billing-content">
            <div class="billing-row">
              <span>📍 Monthly Rent</span>
              <span>฿${bill.rent_amount.toLocaleString()}</span>
            </div>
            
            <div class="billing-row">
              <span>💧 Water Usage (${bill.water_units} units)</span>
              <span>฿${bill.water_cost.toLocaleString()}</span>
            </div>
            <div class="utility-detail">
              ${bill.water_units === 0 ? 'No usage' :
                bill.water_units <= waterMinUnits ? `Minimum charge (1-${waterMinUnits} units)` :
                `Minimum ฿${waterMinCharge} + ${bill.water_units - waterMinUnits} units × ฿${waterRate}`}
            </div>
            
            <div class="billing-row">
              <span>⚡ Electric Usage (${bill.electric_units} units)</span>
              <span>฿${bill.electric_cost.toLocaleString()}</span>
            </div>
            <div class="utility-detail">
              ${bill.electric_units === 0 ? 'No usage' :
                bill.electric_units <= electricMinUnits ? `Minimum charge (1-${electricMinUnits} units)` :
                `Minimum ฿${electricMinCharge} + ${bill.electric_units - electricMinUnits} units × ฿${electricRate}`}
            </div>
            
            <div class="billing-row total">
              <span>💳 Total Amount Due</span>
              <span>฿${bill.total_amount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div class="footer">
          <p><strong>Payment Instructions:</strong></p>
          <p>Please ensure payment is made by the due date to avoid late fees.</p>
          <p>For questions regarding this invoice, please contact property management.</p>
          <p style="margin-top: 15px;">Thank you for choosing PorLivingSpaces! 🏠</p>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  // Get tenant and lease information for a room
  const getRoomTenantInfo = (room) => {
    const activeLease = tenantLeases.find(lease => 
      lease.room_id === room.id && lease.lease_status === 'active'
    );
    
    if (activeLease) {
      return {
        tenant: activeLease.tenant,
        lease: activeLease,
        isOccupied: true
      };
    }
    
    return {
      tenant: null,
      lease: null, 
      isOccupied: false
    };
  };

  // Get payment status for a lease and month
  const getPaymentStatus = (leaseId, month = null) => {
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    const payment = payments.find(p => 
      p.tenant_lease_id === leaseId && p.payment_month === targetMonth
    );
    
    if (!payment) {
      return {
        status: 'pending',
        amount_due: 0,
        paid_amount: 0,
        outstanding: 0,
        due_date: null,
        is_overdue: false
      };
    }
    
    const outstanding = payment.invoice_amount - payment.paid_amount;
    const is_overdue = new Date() > new Date(payment.due_date) && outstanding > 0;
    
    let status = payment.payment_status;
    if (is_overdue && status !== 'paid') {
      status = 'overdue';
    }
    
    return {
      status,
      amount_due: payment.invoice_amount,
      paid_amount: payment.paid_amount,
      outstanding,
      due_date: payment.due_date,
      is_overdue,
      payment_date: payment.payment_date,
      payment_method: payment.payment_method,
      payment_reference: payment.payment_reference
    };
  };

  // Get outstanding balance for a lease (all unpaid months)
  const getOutstandingBalance = (leaseId) => {
    const leasePayments = payments.filter(p => p.tenant_lease_id === leaseId);
    let total_outstanding = 0;
    let overdue_months = 0;
    
    leasePayments.forEach(payment => {
      const outstanding = payment.invoice_amount - payment.paid_amount;
      if (outstanding > 0) {
        total_outstanding += outstanding;
        if (new Date() > new Date(payment.due_date)) {
          overdue_months++;
        }
      }
    });
    
    return {
      total_outstanding,
      overdue_months,
      has_outstanding: total_outstanding > 0
    };
  };

  // Create or update payment record
  const recordPayment = async (leaseId, bill, paymentAmount, paymentMethod = 'cash', paymentReference = '') => {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const dueDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const paymentData = {
        tenant_lease_id: leaseId,
        payment_month: currentMonth,
        invoice_amount: bill.total_amount,
        paid_amount: paymentAmount,
        payment_status: paymentAmount >= bill.total_amount ? 'paid' : (paymentAmount > 0 ? 'partial' : 'pending'),
        payment_date: paymentAmount > 0 ? new Date().toISOString().split('T')[0] : null,
        payment_method: paymentAmount > 0 ? paymentMethod : null,
        payment_reference: paymentReference,
        due_date: dueDate
      };
      
      const { error } = await supabase
        .from('payments')
        .upsert(paymentData, { onConflict: 'tenant_lease_id,payment_month' });
      
      if (error) throw error;
      
      await fetchData(); // Refresh all data
      return true;
    } catch (error) {
      setError(`Payment recording failed: ${error.message}`);
      return false;
    }
  };

  // Calculate tiered utility costs
  const calculateUtilityCost = (units, rate, minCharge, minUnits) => {
    if (units === 0) return 0;
    if (units <= minUnits) return minCharge;
    return minCharge + ((units - minUnits) * rate);
  };

  // Calculate bill based on current and previous meter readings with tiered pricing
  const calculateBill = (room) => {
    const tenantInfo = getRoomTenantInfo(room);
    if (!tenantInfo.isOccupied) return null;

    const previousWater = room.previous_water_meter !== undefined ? room.previous_water_meter || 0 : 0;
    const previousElectric = room.previous_electric_meter !== undefined ? room.previous_electric_meter || 0 : 0;
    
    const waterUnits = Math.max(0, (room.water_meter || 0) - previousWater);
    const electricUnits = Math.max(0, (room.electric_meter || 0) - previousElectric);
    
    // Calculate costs using tiered pricing
    const waterCost = calculateUtilityCost(waterUnits, waterRate, waterMinCharge, waterMinUnits);
    const electricCost = calculateUtilityCost(electricUnits, electricRate, electricMinCharge, electricMinUnits);
    
    const totalAmount = (room.rent_price || 0) + waterCost + electricCost;

    const { tenant, lease } = tenantInfo;
    
    return {
      rent_amount: lease?.monthly_rent || room.rent_price || 0,
      water_units: waterUnits,
      water_cost: waterCost,
      water_rate: waterRate,
      water_min_charge: waterMinCharge,
      water_min_units: waterMinUnits,
      electric_units: electricUnits,
      electric_cost: electricCost,
      electric_rate: electricRate,
      electric_min_charge: electricMinCharge,
      electric_min_units: electricMinUnits,
      total_amount: totalAmount,
      month: new Date().toISOString().slice(0, 7),
      due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      has_meter_history: room.previous_water_meter !== undefined && room.previous_electric_meter !== undefined,
      // Tenant information from new system
      tenant_id: tenant?.tenant_id_number,
      tenant_name: tenant?.full_name,
      tenant_phone: tenant?.phone,
      tenant_email: tenant?.email,
      tenant_address: tenant?.address,
      tenant_emergency_contact: tenant?.emergency_contact_name,
      tenant_emergency_phone: tenant?.emergency_contact_phone,
      // Lease information  
      lease_start_date: lease?.lease_start_date,
      lease_end_date: lease?.lease_end_date,
      security_deposit: lease?.security_deposit,
      lease_period: lease?.lease_start_date ? 
        `${new Date(lease.lease_start_date).toLocaleDateString()} - ${lease.lease_end_date ? new Date(lease.lease_end_date).toLocaleDateString() : 'Ongoing'}` : 
        'Not specified'
    };
  };

  // Modal handling
  const openModal = (type, item = null) => {
    setModalType(type);
    setEditingItem(item);
    setShowModal(true);
    
    if (type === 'building') {
      setFormData(item ? { name: item.name } : { name: '' });
    } else if (type === 'room') {
      setFormData(item ? {
        room_number: item.room_number,
        rent_price: item.rent_price || 0,
        building_id: item.building_id || selectedBuilding
      } : {
        room_number: '',
        rent_price: 0,
        building_id: selectedBuilding
      });
    } else if (type === 'tenant') {
      const tenantFormData = item ? {
        tenant_name: item.tenant_name || '',
        tenant_address: item.tenant_address || '',
        tenant_phone: item.tenant_phone || '',
        tenant_id_card: item.tenant_id_card || '',
        tenant_start_date: item.tenant_start_date || '',
        tenant_end_date: item.tenant_end_date || '',
        rent_price: item.rent_price || 0,
        previous_water_meter: item.previous_water_meter || 0,
        water_meter: item.water_meter || 0,
        previous_electric_meter: item.previous_electric_meter || 0,
        electric_meter: item.electric_meter || 0
      } : {
        tenant_name: '',
        tenant_address: '',
        tenant_phone: '',
        tenant_id_card: '',
        tenant_start_date: '',
        tenant_end_date: '',
        rent_price: editingItem?.rent_price || 0,
        previous_water_meter: 0,
        water_meter: 0,
        previous_electric_meter: 0,
        electric_meter: 0
      };
      setFormData(tenantFormData);
    } else if (type === 'bill') {
      const bill = calculateBill(item);
      setFormData(bill || {});
    } else if (type === 'meter-update') {
      setFormData({
        previous_water_meter: item.water_meter || 0,
        water_meter: item.water_meter || 0,
        previous_electric_meter: item.electric_meter || 0,
        electric_meter: item.electric_meter || 0
      });
    } else if (type === 'settings') {
      setFormData({
        water_rate: waterRate,
        electric_rate: electricRate
      });
    } else if (type === 'payment') {
      const tenantInfo = getRoomTenantInfo(item);
      if (tenantInfo.isOccupied) {
        const bill = calculateBill(item);
        const paymentStatus = getPaymentStatus(tenantInfo.lease.id);
        
        setFormData({
          tenant_name: tenantInfo.tenant.full_name,
          tenant_id: tenantInfo.tenant.tenant_id_number,
          room_number: item.room_number,
          invoice_amount: bill.total_amount,
          paid_amount: paymentStatus.paid_amount || 0,
          payment_method: 'cash',
          payment_reference: '',
          payment_notes: ''
        });
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setModalType('');
    setEditingItem(null);
    setFormData({});
  };

  // CRUD Operations
  const handleSave = async () => {
    try {
      if (modalType === 'building') {
        if (editingItem) {
          const { error } = await supabase
            .from('buildings')
            .update({ name: formData.name })
            .eq('id', editingItem.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('buildings')
            .insert([{ name: formData.name }]);
          if (error) throw error;
        }
      } else if (modalType === 'room') {
        if (editingItem) {
          const { error } = await supabase
            .from('rooms')
            .update({
              room_number: formData.room_number,
              rent_price: formData.rent_price,
              building_id: formData.building_id
            })
            .eq('id', editingItem.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('rooms')
            .insert([{
              room_number: formData.room_number,
              rent_price: formData.rent_price,
              building_id: formData.building_id,
              status: 'vacant',
              tenant_name: null,
              tenant_address: null,
              tenant_phone: null,
              tenant_id_card: null,
              water_meter: 0,
              electric_meter: 0,
              previous_water_meter: 0,
              previous_electric_meter: 0,
              is_overdue: false,
              current_bill: null,
              history: []
            }]);
          if (error) throw error;
        }
      } else if (modalType === 'tenant') {
        if (!editingItem) {
          throw new Error('No room selected for tenant operation');
        }
        
        const updateData = {
                        tenant_name: formData.tenant_name,
              tenant_address: formData.tenant_address,
              tenant_phone: formData.tenant_phone,
              tenant_id_card: formData.tenant_id_card,
              tenant_start_date: formData.tenant_start_date,
              tenant_end_date: formData.tenant_end_date,
          rent_price: formData.rent_price,
          status: 'occupied'
        };

        try {
          const { error: testError } = await supabase
            .from('rooms')
            .select('previous_water_meter, previous_electric_meter')
            .limit(1);
          
          if (!testError) {
            updateData.previous_water_meter = formData.previous_water_meter;
            updateData.water_meter = formData.water_meter;
            updateData.previous_electric_meter = formData.previous_electric_meter;
            updateData.electric_meter = formData.electric_meter;
          } else {
            updateData.water_meter = formData.water_meter;
            updateData.electric_meter = formData.electric_meter;
          }
        } catch (schemaError) {
          updateData.water_meter = formData.water_meter;
          updateData.electric_meter = formData.electric_meter;
        }

        const { error } = await supabase
          .from('rooms')
          .update(updateData)
          .eq('id', editingItem.id);
        if (error) throw error;
      } else if (modalType === 'meter-update') {
        try {
          const { error: testError } = await supabase
            .from('rooms')
            .select('previous_water_meter, previous_electric_meter')
            .limit(1);
          
          if (!testError) {
            const { error } = await supabase
              .from('rooms')
              .update({
                previous_water_meter: editingItem.water_meter,
                water_meter: formData.water_meter,
                previous_electric_meter: editingItem.electric_meter,
                electric_meter: formData.electric_meter
              })
              .eq('id', editingItem.id);
            if (error) throw error;
          } else {
            const { error } = await supabase
              .from('rooms')
              .update({
                water_meter: formData.water_meter,
                electric_meter: formData.electric_meter
              })
              .eq('id', editingItem.id);
            if (error) throw error;
          }
        } catch (schemaError) {
          const { error } = await supabase
            .from('rooms')
            .update({
              water_meter: formData.water_meter,
              electric_meter: formData.electric_meter
            })
            .eq('id', editingItem.id);
          if (error) throw error;
        }
      } else if (modalType === 'settings') {
        const newWaterRate = parseFloat(formData.water_rate) || 15;
        const newElectricRate = parseFloat(formData.electric_rate) || 8;
        
        localStorage.setItem('waterRate', newWaterRate.toString());
        localStorage.setItem('electricRate', newElectricRate.toString());
        
        setWaterRate(newWaterRate);
        setElectricRate(newElectricRate);
      } else if (modalType === 'payment') {
        const tenantInfo = getRoomTenantInfo(editingItem);
        if (tenantInfo.isOccupied) {
          const bill = calculateBill(editingItem);
          const success = await recordPayment(
            tenantInfo.lease.id,
            bill,
            parseFloat(formData.paid_amount) || 0,
            formData.payment_method,
            formData.payment_reference
          );
          
          if (!success) {
            return; // Don't close modal if payment recording failed
          }
        }
      }

      await fetchData();
      closeModal();
      setError('');
    } catch (error) {
      setError(`Save failed: ${error.message}`);
    }
  };

  // Delete operations
  const handleDelete = async (type, item) => {
    try {
      if (type === 'building') {
        // Check if building has rooms
        const { data: buildingRooms, error: roomsError } = await supabase
          .from('rooms')
          .select('id, room_number, tenant_name')
          .eq('building_id', item.id);
        
        if (roomsError) throw roomsError;
        
        if (buildingRooms && buildingRooms.length > 0) {
          // Building has rooms - ask for confirmation and delete rooms first
          const roomsList = buildingRooms.map(room => 
            `• Room ${room.room_number}${room.tenant_name ? ` (${room.tenant_name})` : ' (vacant)'}`
          ).join('\n');
          
          const confirmMessage = `This building contains ${buildingRooms.length} room(s):\n\n${roomsList}\n\nDeleting the building will also delete all its rooms and tenant data. Are you sure?`;
          
          if (!window.confirm(confirmMessage)) {
            return; // User cancelled
          }
          
          // Delete all rooms in the building first
          const { error: deleteRoomsError } = await supabase
            .from('rooms')
            .delete()
            .eq('building_id', item.id);
          
          if (deleteRoomsError) throw deleteRoomsError;
        }
        
        // Now delete the building
        const { error } = await supabase
          .from('buildings')
          .delete()
          .eq('id', item.id);
        if (error) throw error;
        
        // Update selected building if we deleted the currently selected one
        if (selectedBuilding === item.id) {
          setSelectedBuilding(null);
        }
      } else if (type === 'room') {
        // Check if room has a tenant
        if (item.tenant_name) {
          const confirmMessage = `Room ${item.room_number} is currently occupied by ${item.tenant_name}.\n\nDeleting this room will also remove all tenant data and billing history. Are you sure?`;
          
          if (!window.confirm(confirmMessage)) {
            return; // User cancelled
          }
        }
        
        const { error } = await supabase
          .from('rooms')
          .delete()
          .eq('id', item.id);
        if (error) throw error;
      } else if (type === 'tenant') {
        const confirmMessage = `Remove tenant ${item.tenant_name} from room ${item.room_number}?\n\nThis will:\n• Clear all tenant information\n• Reset meter readings\n• Set room status to vacant\n• Clear billing data\n\nAre you sure?`;
        
        if (!window.confirm(confirmMessage)) {
          return; // User cancelled
        }
        
                    const { error } = await supabase
              .from('rooms')
              .update({
                tenant_name: null,
                tenant_address: null,
                tenant_phone: null,
                tenant_id_card: null,
                tenant_start_date: null,
                tenant_end_date: null,
                status: 'vacant',
                previous_water_meter: 0,
                water_meter: 0,
                previous_electric_meter: 0,
                electric_meter: 0,
                is_overdue: false,
                current_bill: null
              })
              .eq('id', item.id);
        if (error) throw error;
      }

      await fetchData();
      setError('');
    } catch (error) {
      setError(`Delete failed: ${error.message}`);
    }
  };

  // Styles
  const containerStyle = {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: '#f8fafc',
    minHeight: '100vh',
    padding: '20px'
  };

  const headerStyle = {
    backgroundColor: '#ffffff',
    padding: '20px',
    marginBottom: '20px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  };

  const cardStyle = {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    border: '1px solid #e2e8f0'
  };

  const statCardStyle = {
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    textAlign: 'center'
  };

  const buttonStyle = {
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '10px 20px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    margin: '5px'
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#2563eb'
  };

  const secondaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#64748b'
  };

  const successButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#059669'
  };

  const dangerButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#dc2626'
  };

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    marginBottom: '10px'
  };

  const modalStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  };

  const modalContentStyle = {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '80vh',
    overflowY: 'auto'
  };

  // Filter rooms for selected building
  const currentRooms = selectedBuilding 
    ? rooms.filter(room => room.building_id === selectedBuilding)
    : [];

  return (
    <div style={containerStyle}>
      {/* Authentication Header */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        zIndex: 1000,
        padding: '12px 24px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#1f2937',
              margin: 0
            }}>
              🏢 PorLivingSpaces
            </h1>
            <span style={{
              fontSize: '12px',
              color: '#6b7280',
              background: '#f3f4f6',
              padding: '2px 8px',
              borderRadius: '4px'
            }}>
              Professional Edition
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#1f2937'
              }}>
                👤 {userProfile?.full_name || user?.email || 'User'}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#6b7280'
              }}>
                {userProfile?.role || 'Admin'} • {user?.email}
              </div>
            </div>
            
            <button
              onClick={signOut}
              style={{
                backgroundColor: '#ef4444',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#dc2626'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#ef4444'}
            >
              🚪 Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content with padding for header */}
      <div style={{ paddingTop: '80px' }}>
        <div style={containerStyle}>
          {/* Header */}
          <div style={headerStyle}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div>
            <h1 style={{margin: 0, fontSize: '28px'}}>
              🏢 PorLivingSpaces
            </h1>
            <p style={{margin: '10px 0 0 0', opacity: 0.9}}>
              Professional Rental Management with Bill Calculation
            </p>
          </div>
          <div style={{textAlign: 'right'}}>
            <button
              onClick={() => openModal('settings')}
              style={{
                ...primaryButtonStyle,
                fontSize: '14px',
                padding: '8px 16px',
                marginBottom: '8px'
              }}
            >
              ⚙️ Settings
            </button>
            <div style={{fontSize: '12px', color: '#64748b'}}>
              💧 Water: ฿{waterMinCharge} (1-{waterMinUnits}u), ฿{waterRate}/u after | ⚡ Electric: ฿{electricMinCharge} (1-{electricMinUnits}u), ฿{electricRate}/u after
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{...cardStyle, textAlign: 'center'}}>
          <h2>⏳ Loading...</h2>
          <p>Loading your property data...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div style={{...cardStyle, backgroundColor: '#fee', borderColor: '#fcc'}}>
          <h3 style={{margin: '0 0 10px 0', color: '#c00'}}>❌ Error</h3>
          <p style={{color: '#c00'}}>{error}</p>
        </div>
      )}

      {/* Main Content - Only show when not loading */}
      {!loading && (
        <>
                     {/* Statistics */}
           <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px'}}>
             <div style={statCardStyle}>
               <h3 style={{margin: 0, color: '#2563eb'}}>🏢 Buildings</h3>
               <p style={{fontSize: '32px', margin: '10px 0', fontWeight: 'bold'}}>
                 {buildings.length}
               </p>
             </div>
             <div style={statCardStyle}>
               <h3 style={{margin: 0, color: '#2563eb'}}>🏠 Total Rooms</h3>
               <p style={{fontSize: '32px', margin: '10px 0', fontWeight: 'bold'}}>
                 {rooms.length}
               </p>
             </div>
             <div style={statCardStyle}>
               <h3 style={{margin: 0, color: '#059669'}}>✅ Occupied</h3>
               <p style={{fontSize: '32px', margin: '10px 0', fontWeight: 'bold'}}>
                 {rooms.filter(r => r.status === 'occupied').length}
               </p>
             </div>
             <div style={statCardStyle}>
               <h3 style={{margin: 0, color: '#059669'}}>🏠 Vacant</h3>
               <p style={{fontSize: '32px', margin: '10px 0', fontWeight: 'bold'}}>
                 {rooms.filter(r => r.status === 'vacant').length}
               </p>
             </div>
             <div style={statCardStyle}>
               <h3 style={{margin: 0, color: '#d97706'}}>💰 Current Revenue</h3>
               <p style={{fontSize: '24px', margin: '10px 0', fontWeight: 'bold'}}>
                 ฿{calculateCurrentRevenue().toLocaleString()}
               </p>
               <p style={{fontSize: '12px', margin: 0, color: '#6b7280'}}>
                 {getCurrentMonthKey()}
               </p>
             </div>
             <div style={statCardStyle}>
               <h3 style={{margin: 0, color: '#6366f1'}}>📈 Previous Revenue</h3>
               <p style={{fontSize: '24px', margin: '10px 0', fontWeight: 'bold'}}>
                 ฿{getPreviousMonthRevenue().toLocaleString()}
               </p>
               <p style={{fontSize: '12px', margin: 0, color: '#6b7280'}}>
                 {getPreviousMonthKey()}
               </p>
             </div>
             <div style={statCardStyle}>
               <h3 style={{margin: 0, color: getRevenueChange().change >= 0 ? '#059669' : '#dc2626'}}>
                 {getRevenueChange().change >= 0 ? '📈' : '📉'} Revenue Change
               </h3>
               <p style={{
                 fontSize: '20px', 
                 margin: '10px 0', 
                 fontWeight: 'bold',
                 color: getRevenueChange().change >= 0 ? '#059669' : '#dc2626'
               }}>
                 {getRevenueChange().change >= 0 ? '+' : ''}฿{Math.abs(getRevenueChange().change).toLocaleString()}
               </p>
               <p style={{
                 fontSize: '14px', 
                 margin: 0, 
                 fontWeight: 'bold',
                 color: getRevenueChange().change >= 0 ? '#059669' : '#dc2626'
               }}>
                 {getRevenueChange().change >= 0 ? '+' : ''}{getRevenueChange().percentage.toFixed(1)}%
               </p>
             </div>
           </div>

          {/* Buildings Section */}
          <div style={cardStyle}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
              <h2 style={{margin: 0}}>🏢 Buildings</h2>
              <button onClick={() => openModal('building')} style={buttonStyle}>
                ➕ Add Building
              </button>
            </div>
            
            {buildings.length === 0 ? (
              <p style={{color: '#6b7280'}}>No buildings yet. Add your first building to get started.</p>
            ) : (
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px'}}>
                {buildings.map(building => (
                  <div key={building.id} style={{
                    ...cardStyle,
                    backgroundColor: selectedBuilding === building.id ? '#e0f2fe' : '#f9fafb',
                    cursor: 'pointer'
                  }}>
                    <h3 style={{margin: '0 0 10px 0'}}>{building.name}</h3>
                    <p style={{color: '#6b7280', fontSize: '14px', marginBottom: '15px'}}>
                      {rooms.filter(r => r.building_id === building.id).length} rooms
                    </p>
                    <div>
                      <button 
                        onClick={() => setSelectedBuilding(building.id)}
                        style={{
                          ...primaryButtonStyle,
                          fontSize: '12px',
                          padding: '6px 12px',
                          marginRight: '8px'
                        }}
                      >
                        {selectedBuilding === building.id ? '✓ Selected' : 'Select'}
                      </button>
                      <button 
                        onClick={() => openModal('building', building)}
                        style={{...secondaryButtonStyle, fontSize: '12px', padding: '6px 12px'}}
                      >
                        ✏️ Edit
                      </button>
                      <button 
                        onClick={() => handleDelete('building', building)}
                        style={{...dangerButtonStyle, fontSize: '12px', padding: '6px 12px'}}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rooms Section */}
          {selectedBuilding && (
            <div style={cardStyle}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                <h2 style={{margin: 0}}>🏠 Rooms</h2>
                <button onClick={() => openModal('room')} style={buttonStyle}>
                  ➕ Add Room
                </button>
              </div>
              
              {currentRooms.length === 0 ? (
                <p style={{color: '#6b7280'}}>No rooms in this building yet. Add your first room.</p>
              ) : (
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '15px'}}>
                  {currentRooms.map(room => {
                    const bill = calculateBill(room);
                    return (
                      <div key={room.id} style={{
                        ...cardStyle,
                        backgroundColor: room.status === 'occupied' ? '#f0f9ff' : '#f9fafb'
                      }}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                          <h3 style={{margin: 0}}>
                            {room.room_number}
                          </h3>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            backgroundColor: room.status === 'occupied' ? '#dcfdf4' : '#f3f4f6',
                            color: room.status === 'occupied' ? '#059669' : '#6b7280'
                          }}>
                            {room.status === 'occupied' ? '✅ Occupied' : '🏠 Vacant'}
                          </span>
                        </div>

                        <div style={{marginBottom: '15px'}}>
                          <p style={{margin: '2px 0', fontSize: '14px'}}>
                            <strong>Rent:</strong> ฿{room.rent_price?.toLocaleString()}
                          </p>
                          {(() => {
                            const tenantInfo = getRoomTenantInfo(room);
                            if (!tenantInfo.isOccupied) return null;
                            
                            const paymentStatus = getPaymentStatus(tenantInfo.lease.id);
                            const outstandingBalance = getOutstandingBalance(tenantInfo.lease.id);
                            
                            return (
                              <>
                                <p style={{margin: '2px 0', fontSize: '14px'}}>
                                  <strong>Tenant:</strong> {tenantInfo.tenant.full_name} ({tenantInfo.tenant.tenant_id_number})
                                </p>
                                <p style={{margin: '2px 0', fontSize: '14px'}}>
                                  <strong>Phone:</strong> {tenantInfo.tenant.phone || 'Not provided'}
                                </p>
                                {tenantInfo.tenant.email && (
                                  <p style={{margin: '2px 0', fontSize: '14px'}}>
                                    <strong>Email:</strong> {tenantInfo.tenant.email}
                                  </p>
                                )}
                                {tenantInfo.lease.lease_start_date && (
                                  <p style={{margin: '2px 0', fontSize: '14px'}}>
                                    <strong>📅 Lease:</strong> {new Date(tenantInfo.lease.lease_start_date).toLocaleDateString()} - {tenantInfo.lease.lease_end_date ? new Date(tenantInfo.lease.lease_end_date).toLocaleDateString() : 'Ongoing'}
                                  </p>
                                )}
                                {tenantInfo.lease.security_deposit > 0 && (
                                  <p style={{margin: '2px 0', fontSize: '14px'}}>
                                    <strong>💰 Deposit:</strong> ฿{tenantInfo.lease.security_deposit.toLocaleString()}
                                  </p>
                                )}
                                
                                {/* Payment Status Indicator */}
                                <div style={{
                                  marginTop: '8px',
                                  padding: '6px 10px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  fontWeight: 'bold',
                                  backgroundColor: 
                                    paymentStatus.status === 'paid' ? '#dcfce7' :
                                    paymentStatus.status === 'partial' ? '#fef3c7' :
                                    paymentStatus.status === 'overdue' ? '#fee2e2' : '#f3f4f6',
                                  color:
                                    paymentStatus.status === 'paid' ? '#166534' :
                                    paymentStatus.status === 'partial' ? '#92400e' :
                                    paymentStatus.status === 'overdue' ? '#dc2626' : '#6b7280'
                                }}>
                                  {paymentStatus.status === 'paid' ? '✅ Paid' :
                                   paymentStatus.status === 'partial' ? '🟡 Partial' :
                                   paymentStatus.status === 'overdue' ? '🔴 Overdue' : '⏳ Pending'}
                                  {paymentStatus.outstanding > 0 && ` - ฿${paymentStatus.outstanding.toLocaleString()}`}
                                </div>
                                
                                {outstandingBalance.has_outstanding && (
                                  <p style={{margin: '4px 0 0 0', fontSize: '12px', color: '#dc2626', fontWeight: 'bold'}}>
                                    💳 Total Outstanding: ฿{outstandingBalance.total_outstanding.toLocaleString()}
                                    {outstandingBalance.overdue_months > 0 && ` (${outstandingBalance.overdue_months} overdue)`}
                                  </p>
                                )}
                              </>
                            );
                          })()}
                        </div>

                                                  {(() => {
                            const tenantInfo = getRoomTenantInfo(room);
                            return tenantInfo.isOccupied && bill && (
                                                     <div style={{backgroundColor: '#f0f9ff', padding: '10px', borderRadius: '6px', marginBottom: '15px'}}>
                             <h4 style={{margin: '0 0 8px 0', fontSize: '14px', color: '#059669'}}>💰 Monthly Bill</h4>
                             <div style={{fontSize: '12px'}}>
                               <p style={{margin: '2px 0'}}>Rent: ฿{bill.rent_amount.toLocaleString()}</p>
                               <p style={{margin: '2px 0'}}>
                                 Water: {bill.water_units} units = {
                                   bill.water_units === 0 ? '฿0' :
                                   bill.water_units <= waterMinUnits ? `฿${waterMinCharge} (min)` :
                                   `฿${waterMinCharge} + ${bill.water_units - waterMinUnits} × ฿${waterRate} = ฿${bill.water_cost.toLocaleString()}`
                                 }
                               </p>
                               <p style={{margin: '2px 0'}}>
                                 Electric: {bill.electric_units} units = {
                                   bill.electric_units === 0 ? '฿0' :
                                   bill.electric_units <= electricMinUnits ? `฿${electricMinCharge} (min)` :
                                   `฿${electricMinCharge} + ${bill.electric_units - electricMinUnits} × ฿${electricRate} = ฿${bill.electric_cost.toLocaleString()}`
                                 }
                               </p>
                               <p style={{margin: '5px 0 0 0', fontWeight: 'bold', fontSize: '14px'}}>Total: ฿{bill.total_amount.toLocaleString()}</p>
                             </div>
                           </div>
                            );
                          })()}

                        <div style={{display: 'flex', flexWrap: 'wrap', gap: '5px'}}>
                          <button 
                            onClick={() => openModal('room', room)}
                            style={{...secondaryButtonStyle, fontSize: '12px', padding: '6px 12px'}}
                          >
                            ✏️ Edit Room
                          </button>
                          
                          {(() => {
                            const tenantInfo = getRoomTenantInfo(room);
                            return !tenantInfo.isOccupied ? (
                              <button 
                                onClick={() => openModal('tenant', room)}
                                style={{...successButtonStyle, fontSize: '12px', padding: '6px 12px'}}
                              >
                                👤 Add Tenant
                              </button>
                            ) : (
                            <>
                              <button 
                                onClick={() => openModal('tenant', room)}
                                style={{...successButtonStyle, fontSize: '12px', padding: '6px 12px'}}
                              >
                                ✏️ Edit Tenant
                              </button>
                              <button 
                                onClick={() => openModal('meter-update', room)}
                                style={{...successButtonStyle, fontSize: '12px', padding: '6px 12px'}}
                              >
                                📊 Update Meters
                              </button>
                              <button 
                                onClick={() => openModal('bill', room)}
                                style={{...successButtonStyle, fontSize: '12px', padding: '6px 12px'}}
                              >
                                💰 View Bill
                              </button>
                              <button 
                                onClick={() => openModal('payment', room)}
                                style={{...buttonStyle, fontSize: '12px', padding: '6px 12px'}}
                              >
                                💳 Record Payment
                              </button>
                              <button 
                                onClick={() => handleDelete('tenant', room)}
                                style={{...dangerButtonStyle, fontSize: '12px', padding: '6px 12px'}}
                              >
                                🚪 Remove Tenant
                              </button>
                            </>
                            );
                          })()}
                          
                          <button 
                            onClick={() => handleDelete('room', room)}
                            style={{...dangerButtonStyle, fontSize: '12px', padding: '6px 12px'}}
                          >
                            🗑️ Delete Room
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div style={modalStyle} onClick={closeModal}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={{marginTop: 0}}>
              {modalType === 'building' && (editingItem ? 'Edit Building' : 'Add Building')}
              {modalType === 'room' && (editingItem ? 'Edit Room' : 'Add Room')}
              {modalType === 'tenant' && (editingItem ? 'Edit Tenant' : 'Add Tenant')}
              {modalType === 'meter-update' && 'Update Meter Readings'}
              {modalType === 'bill' && 'Monthly Bill Details'}
              {modalType === 'settings' && 'Rate Settings'}
            </h2>
            
            {modalType === 'building' && (
              <div>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>
                  Building Name:
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  style={inputStyle}
                  placeholder="Enter building name"
                />
              </div>
            )}
            
            {modalType === 'room' && (
              <div>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>
                  Room Number:
                </label>
                <input
                  type="text"
                  value={formData.room_number || ''}
                  onChange={(e) => setFormData({...formData, room_number: e.target.value})}
                  style={inputStyle}
                  placeholder="e.g., 101, A1, etc."
                />

                <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>
                  Monthly Rent (฿):
                </label>
                <input
                  type="number"
                  value={formData.rent_price || ''}
                  onChange={(e) => setFormData({...formData, rent_price: parseInt(e.target.value) || 0})}
                  style={inputStyle}
                  placeholder="Enter monthly rent amount"
                />
              </div>
            )}

            {modalType === 'tenant' && (
              <div>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>
                  Tenant Name:
                </label>
                <input
                  type="text"
                  value={formData.tenant_name || ''}
                  onChange={(e) => setFormData({...formData, tenant_name: e.target.value})}
                  style={inputStyle}
                  placeholder="Enter tenant full name"
                />

                <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>
                  Phone Number:
                </label>
                <input
                  type="text"
                  value={formData.tenant_phone || ''}
                  onChange={(e) => setFormData({...formData, tenant_phone: e.target.value})}
                  style={inputStyle}
                  placeholder="Enter phone number"
                />

                <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>
                  Address:
                </label>
                <input
                  type="text"
                  value={formData.tenant_address || ''}
                  onChange={(e) => setFormData({...formData, tenant_address: e.target.value})}
                  style={inputStyle}
                  placeholder="Enter address"
                />

                <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>
                  ID Card Number:
                </label>
                                  <input
                    type="text"
                    value={formData.tenant_id_card || ''}
                    onChange={(e) => setFormData({...formData, tenant_id_card: e.target.value})}
                    style={inputStyle}
                    placeholder="Enter ID card number"
                  />

                  <label style={{display: 'block', marginBottom: '8px', fontWeight: 'bold', marginTop: '15px'}}>
                    📅 Lease Start Date:
                  </label>
                  <input
                    type="date"
                    value={formData.tenant_start_date || ''}
                    onChange={(e) => setFormData({...formData, tenant_start_date: e.target.value})}
                    style={inputStyle}
                  />

                  <label style={{display: 'block', marginBottom: '8px', fontWeight: 'bold', marginTop: '15px'}}>
                    📅 Lease End Date:
                  </label>
                  <input
                    type="date"
                    value={formData.tenant_end_date || ''}
                    onChange={(e) => setFormData({...formData, tenant_end_date: e.target.value})}
                    style={inputStyle}
                  />

                <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>
                  Monthly Rent (฿):
                </label>
                <input
                  type="number"
                  value={formData.rent_price || ''}
                  onChange={(e) => setFormData({...formData, rent_price: parseInt(e.target.value) || 0})}
                  style={inputStyle}
                />

                <div style={{border: '1px solid #ddd', padding: '15px', borderRadius: '6px', marginBottom: '15px', backgroundColor: '#f8f9fa'}}>
                  <h4 style={{margin: '0 0 10px 0'}}>📊 Meter Readings</h4>
                  
                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                    <div>
                      <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px'}}>
                        Water Meter:
                      </label>
                      <label style={{display: 'block', marginBottom: '3px', fontSize: '12px', color: '#6b7280'}}>
                        Previous Reading:
                      </label>
                      <input
                        type="number"
                        value={formData.previous_water_meter || ''}
                        onChange={(e) => setFormData({...formData, previous_water_meter: parseInt(e.target.value) || 0})}
                        style={{...inputStyle, marginBottom: '8px'}}
                        placeholder="Previous water meter"
                      />
                      <label style={{display: 'block', marginBottom: '3px', fontSize: '12px', color: '#059669'}}>
                        Current Reading:
                      </label>
                      <input
                        type="number"
                        value={formData.water_meter || ''}
                        onChange={(e) => setFormData({...formData, water_meter: parseInt(e.target.value) || 0})}
                        style={inputStyle}
                        placeholder="Current water meter"
                      />
                    </div>
                    
                    <div>
                      <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px'}}>
                        Electric Meter:
                      </label>
                      <label style={{display: 'block', marginBottom: '3px', fontSize: '12px', color: '#6b7280'}}>
                        Previous Reading:
                      </label>
                      <input
                        type="number"
                        value={formData.previous_electric_meter || ''}
                        onChange={(e) => setFormData({...formData, previous_electric_meter: parseInt(e.target.value) || 0})}
                        style={{...inputStyle, marginBottom: '8px'}}
                        placeholder="Previous electric meter"
                      />
                      <label style={{display: 'block', marginBottom: '3px', fontSize: '12px', color: '#d97706'}}>
                        Current Reading:
                      </label>
                      <input
                        type="number"
                        value={formData.electric_meter || ''}
                        onChange={(e) => setFormData({...formData, electric_meter: parseInt(e.target.value) || 0})}
                        style={inputStyle}
                        placeholder="Current electric meter"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {modalType === 'meter-update' && (
              <div>
                <div style={{backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '6px', marginBottom: '15px'}}>
                  <h4 style={{margin: '0 0 10px 0'}}>📊 Update Monthly Meter Readings</h4>
                  <p style={{margin: 0, fontSize: '14px', color: '#6b7280'}}>
                    Current readings will be saved as previous readings, and new readings will be entered.
                  </p>
                </div>

                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                  <div>
                    <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>
                      New Water Meter Reading:
                    </label>
                    <input
                      type="number"
                      value={formData.water_meter || ''}
                      onChange={(e) => setFormData({...formData, water_meter: parseInt(e.target.value) || 0})}
                      style={inputStyle}
                      placeholder="Enter new water meter reading"
                    />
                  </div>
                  
                  <div>
                    <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>
                      New Electric Meter Reading:
                    </label>
                    <input
                      type="number"
                      value={formData.electric_meter || ''}
                      onChange={(e) => setFormData({...formData, electric_meter: parseInt(e.target.value) || 0})}
                      style={inputStyle}
                      placeholder="Enter new electric meter reading"
                    />
                  </div>
                </div>
              </div>
            )}

            {modalType === 'settings' && (
              <div>
                <div style={{backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '6px', marginBottom: '20px'}}>
                  <h4 style={{margin: '0 0 10px 0', color: '#059669'}}>⚙️ Tiered Utility Rate Configuration</h4>
                  <p style={{margin: 0, fontSize: '14px', color: '#6b7280'}}>
                    Configure tiered pricing with minimum charges for water and electricity.
                  </p>
                </div>

                <div style={{marginBottom: '20px'}}>
                  <label style={{display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#0ea5e9'}}>
                    💧 Water Rate (฿ per unit above minimum):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.water_rate || ''}
                    onChange={(e) => setFormData({...formData, water_rate: parseFloat(e.target.value) || 0})}
                    style={inputStyle}
                    placeholder="Enter water rate per unit"
                  />
                  <div style={{fontSize: '12px', color: '#64748b', marginTop: '4px', backgroundColor: '#f0f9ff', padding: '8px', borderRadius: '4px'}}>
                    <strong>Current: ฿{waterRate}/unit</strong><br/>
                    Minimum charge: ฿{waterMinCharge} (covers 1-{waterMinUnits} units)<br/>
                    Above {waterMinUnits} units: ฿{waterRate} per additional unit
                  </div>
                </div>

                <div style={{marginBottom: '20px'}}>
                  <label style={{display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#f59e0b'}}>
                    ⚡ Electric Rate (฿ per unit above minimum):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.electric_rate || ''}
                    onChange={(e) => setFormData({...formData, electric_rate: parseFloat(e.target.value) || 0})}
                    style={inputStyle}
                    placeholder="Enter electric rate per unit"
                  />
                  <div style={{fontSize: '12px', color: '#64748b', marginTop: '4px', backgroundColor: '#fff7ed', padding: '8px', borderRadius: '4px'}}>
                    <strong>Current: ฿{electricRate}/unit</strong><br/>
                    Minimum charge: ฿{electricMinCharge} (covers 1-{electricMinUnits} units)<br/>
                    Above {electricMinUnits} units: ฿{electricRate} per additional unit
                  </div>
                </div>

                <div style={{backgroundColor: '#dbeafe', padding: '12px', borderRadius: '6px', marginBottom: '20px'}}>
                  <h4 style={{margin: '0 0 8px 0', fontSize: '14px', color: '#1e40af'}}>💡 Tiered Pricing Examples</h4>
                  <div style={{fontSize: '12px', color: '#1e40af'}}>
                    <p style={{margin: '2px 0'}}>• Water 2 units: ฿{waterMinCharge} (minimum)</p>
                    <p style={{margin: '2px 0'}}>• Water 6 units: ฿{waterMinCharge} + 2 × ฿{formData.water_rate || waterRate} = ฿{(waterMinCharge + 2 * (formData.water_rate || waterRate)).toFixed(2)}</p>
                    <p style={{margin: '2px 0'}}>• Electric 5 units: ฿{electricMinCharge} (minimum)</p>
                    <p style={{margin: '2px 0'}}>• Electric 15 units: ฿{electricMinCharge} + 5 × ฿{formData.electric_rate || electricRate} = ฿{(electricMinCharge + 5 * (formData.electric_rate || electricRate)).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}

            {modalType === 'bill' && formData.total_amount !== undefined && (
              <div>
                <div style={{backgroundColor: '#f0f9ff', padding: '20px', borderRadius: '8px', marginBottom: '20px'}}>
                  <h3 style={{margin: '0 0 15px 0', color: '#1e40af'}}>💰 Monthly Bill Calculation</h3>
                  
                  <div style={{marginBottom: '15px'}}>
                    <h4 style={{margin: '0 0 8px 0', fontSize: '16px'}}>📍 Property Details</h4>
                    <p style={{margin: '2px 0', fontSize: '14px'}}>Room: {editingItem?.room_number}</p>
                    <p style={{margin: '2px 0', fontSize: '14px'}}>Tenant: {editingItem?.tenant_name}</p>
                    {formData.lease_period && (
                      <p style={{margin: '2px 0', fontSize: '14px'}}>📅 Lease Period: {formData.lease_period}</p>
                    )}
                    <p style={{margin: '2px 0', fontSize: '14px'}}>Month: {formData.month}</p>
                    <p style={{margin: '2px 0', fontSize: '14px'}}>Due Date: {formData.due_date}</p>
                  </div>

                  <div style={{marginBottom: '15px'}}>
                    <h4 style={{margin: '0 0 8px 0', fontSize: '16px'}}>🏠 Rent</h4>
                    <p style={{margin: '2px 0', fontSize: '14px'}}>Monthly Rent: ฿{formData.rent_amount?.toLocaleString()}</p>
                  </div>

                  <div style={{marginBottom: '15px'}}>
                    <h4 style={{margin: '0 0 8px 0', fontSize: '16px'}}>💧 Water Usage</h4>
                    <p style={{margin: '2px 0', fontSize: '14px'}}>Previous Reading: {editingItem?.previous_water_meter || 0}</p>
                    <p style={{margin: '2px 0', fontSize: '14px'}}>Current Reading: {editingItem?.water_meter || 0}</p>
                    <p style={{margin: '2px 0', fontSize: '14px'}}>Usage: {formData.water_units} units</p>
                    <p style={{margin: '2px 0', fontSize: '14px'}}>
                      Cost: {
                        formData.water_units === 0 ? '฿0 (no usage)' :
                        formData.water_units <= waterMinUnits ? `฿${waterMinCharge} (minimum charge for 1-${waterMinUnits} units)` :
                        `฿${waterMinCharge} (min) + ${formData.water_units - waterMinUnits} units × ฿${waterRate} = ฿${formData.water_cost?.toLocaleString()}`
                      }
                    </p>
                  </div>

                  <div style={{marginBottom: '15px'}}>
                    <h4 style={{margin: '0 0 8px 0', fontSize: '16px'}}>⚡ Electric Usage</h4>
                    <p style={{margin: '2px 0', fontSize: '14px'}}>Previous Reading: {editingItem?.previous_electric_meter || 0}</p>
                    <p style={{margin: '2px 0', fontSize: '14px'}}>Current Reading: {editingItem?.electric_meter || 0}</p>
                    <p style={{margin: '2px 0', fontSize: '14px'}}>Usage: {formData.electric_units} units</p>
                    <p style={{margin: '2px 0', fontSize: '14px'}}>
                      Cost: {
                        formData.electric_units === 0 ? '฿0 (no usage)' :
                        formData.electric_units <= electricMinUnits ? `฿${electricMinCharge} (minimum charge for 1-${electricMinUnits} units)` :
                        `฿${electricMinCharge} (min) + ${formData.electric_units - electricMinUnits} units × ฿${electricRate} = ฿${formData.electric_cost?.toLocaleString()}`
                      }
                    </p>
                  </div>

                  <div style={{borderTop: '2px solid #2563eb', paddingTop: '15px'}}>
                    <h4 style={{margin: '0 0 8px 0', fontSize: '18px', color: '#2563eb'}}>💰 Total Bill</h4>
                    <p style={{margin: '2px 0', fontSize: '16px', fontWeight: 'bold'}}>
                      ฿{formData.total_amount?.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {modalType === 'payment' && (
              <div>
                <div style={{backgroundColor: '#f0f9ff', padding: '15px', borderRadius: '6px', marginBottom: '20px'}}>
                  <h4 style={{margin: '0 0 10px 0', color: '#2563eb'}}>💳 Record Payment</h4>
                  <p style={{margin: 0, fontSize: '14px', color: '#6b7280'}}>
                    Record a payment for {formData.tenant_name} ({formData.tenant_id}) - Room {formData.room_number}
                  </p>
                </div>

                <div style={{backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '6px', marginBottom: '15px'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <span style={{fontSize: '14px', fontWeight: 'bold'}}>Invoice Amount:</span>
                    <span style={{fontSize: '16px', color: '#2563eb', fontWeight: 'bold'}}>฿{formData.invoice_amount?.toLocaleString()}</span>
                  </div>
                </div>

                <div style={{marginBottom: '15px'}}>
                  <label style={{display: 'block', marginBottom: '8px', fontWeight: 'bold'}}>
                    💰 Payment Amount (฿):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={formData.invoice_amount}
                    value={formData.paid_amount || ''}
                    onChange={(e) => setFormData({...formData, paid_amount: parseFloat(e.target.value) || 0})}
                    style={inputStyle}
                    placeholder="Enter payment amount"
                  />
                </div>

                <div style={{marginBottom: '15px'}}>
                  <label style={{display: 'block', marginBottom: '8px', fontWeight: 'bold'}}>
                    💳 Payment Method:
                  </label>
                  <select
                    value={formData.payment_method || 'cash'}
                    onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
                    style={inputStyle}
                  >
                    <option value="cash">💵 Cash</option>
                    <option value="bank_transfer">🏦 Bank Transfer</option>
                    <option value="check">📄 Check</option>
                    <option value="mobile_payment">📱 Mobile Payment</option>
                    <option value="credit_card">💳 Credit Card</option>
                  </select>
                </div>

                <div style={{marginBottom: '15px'}}>
                  <label style={{display: 'block', marginBottom: '8px', fontWeight: 'bold'}}>
                    📝 Payment Reference (Optional):
                  </label>
                  <input
                    type="text"
                    value={formData.payment_reference || ''}
                    onChange={(e) => setFormData({...formData, payment_reference: e.target.value})}
                    style={inputStyle}
                    placeholder="Transaction ID, check number, etc."
                  />
                </div>

                {formData.paid_amount > 0 && formData.paid_amount < formData.invoice_amount && (
                  <div style={{backgroundColor: '#fef3c7', padding: '10px', borderRadius: '6px', marginBottom: '15px'}}>
                    <p style={{margin: 0, fontSize: '12px', color: '#92400e'}}>
                      ⚠️ Partial Payment: ฿{(formData.invoice_amount - formData.paid_amount).toLocaleString()} remaining
                    </p>
                  </div>
                )}

                {formData.paid_amount >= formData.invoice_amount && (
                  <div style={{backgroundColor: '#dcfce7', padding: '10px', borderRadius: '6px', marginBottom: '15px'}}>
                    <p style={{margin: 0, fontSize: '12px', color: '#166534'}}>
                      ✅ Full Payment Received
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {modalType !== 'bill' && modalType !== 'payment' && (
              <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: '20px'}}>
                <button onClick={closeModal} style={secondaryButtonStyle}>
                  Cancel
                </button>
                <button onClick={handleSave} style={buttonStyle}>
                  {modalType === 'settings' ? 'Save Settings' : (editingItem ? 'Update' : 'Create')}
                </button>
              </div>
            )}

            {modalType === 'bill' && (
              <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '20px'}}>
                <button 
                  onClick={printBill} 
                  style={{...successButtonStyle, display: 'flex', alignItems: 'center', gap: '8px'}}
                >
                  🖨️ Print Invoice
                </button>
                <button onClick={closeModal} style={buttonStyle}>
                  Close
                </button>
              </div>
            )}

            {modalType === 'payment' && (
              <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: '20px'}}>
                <button onClick={closeModal} style={secondaryButtonStyle}>
                  Cancel
                </button>
                <button onClick={handleSave} style={buttonStyle}>
                  💳 Record Payment
                </button>
              </div>
            )}
          </div>
        </div>
      )}

        </div>
      </div>
    </div>
  );
};

export default ProductionEnhancedApp;
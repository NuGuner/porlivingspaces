// Production-optimized Enhanced App without console logging
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

const ProductionEnhancedApp = () => {
  const [buildings, setBuildings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});

  // Configurable rates for bill calculation (stored in localStorage)
  const [waterRate, setWaterRate] = useState(() => {
    const saved = localStorage.getItem('waterRate');
    return saved ? parseFloat(saved) : 15;
  });
  
  const [electricRate, setElectricRate] = useState(() => {
    const saved = localStorage.getItem('electricRate');
    return saved ? parseFloat(saved) : 8;
  });

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
      
      setLoading(false);
    } catch (error) {
      setError(`Failed to load data: ${error.message}`);
      setLoading(false);
    }
  };

  // Calculate bill based on current and previous meter readings
  const calculateBill = (room) => {
    if (!room.tenant_name || room.status !== 'occupied') return null;

    const previousWater = room.previous_water_meter !== undefined ? room.previous_water_meter || 0 : 0;
    const previousElectric = room.previous_electric_meter !== undefined ? room.previous_electric_meter || 0 : 0;
    
    const waterUnits = Math.max(0, (room.water_meter || 0) - previousWater);
    const electricUnits = Math.max(0, (room.electric_meter || 0) - previousElectric);
    const waterCost = waterUnits * waterRate;
    const electricCost = electricUnits * electricRate;
    const totalAmount = (room.rent_price || 0) + waterCost + electricCost;

    return {
      rent_amount: room.rent_price || 0,
      water_units: waterUnits,
      water_cost: waterCost,
      electric_units: electricUnits,
      electric_cost: electricCost,
      total_amount: totalAmount,
      month: new Date().toISOString().slice(0, 7),
      due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      has_meter_history: room.previous_water_meter !== undefined && room.previous_electric_meter !== undefined
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
              💧 Water: ฿{waterRate}/unit | ⚡ Electric: ฿{electricRate}/unit
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
                          {room.tenant_name && (
                            <>
                              <p style={{margin: '2px 0', fontSize: '14px'}}>
                                <strong>Tenant:</strong> {room.tenant_name}
                              </p>
                              <p style={{margin: '2px 0', fontSize: '14px'}}>
                                <strong>Phone:</strong> {room.tenant_phone}
                              </p>
                            </>
                          )}
                        </div>

                        {room.status === 'occupied' && bill && (
                          <div style={{backgroundColor: '#f0f9ff', padding: '10px', borderRadius: '6px', marginBottom: '15px'}}>
                            <h4 style={{margin: '0 0 8px 0', fontSize: '14px', color: '#059669'}}>💰 Monthly Bill</h4>
                            <div style={{fontSize: '12px'}}>
                              <p style={{margin: '2px 0'}}>Rent: ฿{bill.rent_amount.toLocaleString()}</p>
                              <p style={{margin: '2px 0'}}>Water: {bill.water_units} units × ฿{waterRate} = ฿{bill.water_cost.toLocaleString()}</p>
                              <p style={{margin: '2px 0'}}>Electric: {bill.electric_units} units × ฿{electricRate} = ฿{bill.electric_cost.toLocaleString()}</p>
                              <p style={{margin: '5px 0 0 0', fontWeight: 'bold', fontSize: '14px'}}>Total: ฿{bill.total_amount.toLocaleString()}</p>
                            </div>
                          </div>
                        )}

                        <div style={{display: 'flex', flexWrap: 'wrap', gap: '5px'}}>
                          <button 
                            onClick={() => openModal('room', room)}
                            style={{...secondaryButtonStyle, fontSize: '12px', padding: '6px 12px'}}
                          >
                            ✏️ Edit Room
                          </button>
                          
                          {room.status === 'vacant' ? (
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
                                onClick={() => handleDelete('tenant', room)}
                                style={{...dangerButtonStyle, fontSize: '12px', padding: '6px 12px'}}
                              >
                                🚪 Remove Tenant
                              </button>
                            </>
                          )}
                          
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
                  <h4 style={{margin: '0 0 10px 0', color: '#059669'}}>⚙️ Utility Rate Configuration</h4>
                  <p style={{margin: 0, fontSize: '14px', color: '#6b7280'}}>
                    Set the cost per unit for water and electricity billing calculations.
                  </p>
                </div>

                <div style={{marginBottom: '20px'}}>
                  <label style={{display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#0ea5e9'}}>
                    💧 Water Rate (฿ per unit):
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
                  <div style={{fontSize: '12px', color: '#64748b', marginTop: '4px'}}>
                    Current rate: ฿{waterRate} per unit
                  </div>
                </div>

                <div style={{marginBottom: '20px'}}>
                  <label style={{display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#f59e0b'}}>
                    ⚡ Electric Rate (฿ per unit):
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
                  <div style={{fontSize: '12px', color: '#64748b', marginTop: '4px'}}>
                    Current rate: ฿{electricRate} per unit
                  </div>
                </div>

                <div style={{backgroundColor: '#dbeafe', padding: '12px', borderRadius: '6px', marginBottom: '20px'}}>
                  <h4 style={{margin: '0 0 8px 0', fontSize: '14px', color: '#1e40af'}}>💡 Rate Impact Preview</h4>
                  <div style={{fontSize: '12px', color: '#1e40af'}}>
                    <p style={{margin: '2px 0'}}>• Water: 10 units × ฿{formData.water_rate || waterRate} = ฿{(10 * (formData.water_rate || waterRate)).toFixed(2)}</p>
                    <p style={{margin: '2px 0'}}>• Electric: 50 units × ฿{formData.electric_rate || electricRate} = ฿{(50 * (formData.electric_rate || electricRate)).toFixed(2)}</p>
                    <p style={{margin: '2px 0', fontWeight: 'bold'}}>• Example monthly utilities: ฿{(10 * (formData.water_rate || waterRate) + 50 * (formData.electric_rate || electricRate)).toFixed(2)}</p>
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
                    <p style={{margin: '2px 0', fontSize: '14px'}}>Cost: {formData.water_units} × ฿{waterRate} = ฿{formData.water_cost?.toLocaleString()}</p>
                  </div>

                  <div style={{marginBottom: '15px'}}>
                    <h4 style={{margin: '0 0 8px 0', fontSize: '16px'}}>⚡ Electric Usage</h4>
                    <p style={{margin: '2px 0', fontSize: '14px'}}>Previous Reading: {editingItem?.previous_electric_meter || 0}</p>
                    <p style={{margin: '2px 0', fontSize: '14px'}}>Current Reading: {editingItem?.electric_meter || 0}</p>
                    <p style={{margin: '2px 0', fontSize: '14px'}}>Usage: {formData.electric_units} units</p>
                    <p style={{margin: '2px 0', fontSize: '14px'}}>Cost: {formData.electric_units} × ฿{electricRate} = ฿{formData.electric_cost?.toLocaleString()}</p>
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
            
            {modalType !== 'bill' && (
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
              <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: '20px'}}>
                <button onClick={closeModal} style={buttonStyle}>
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default ProductionEnhancedApp;
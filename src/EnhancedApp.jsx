// Enhanced App with meter reading history and bill calculation
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

const EnhancedApp = () => {
  const [buildings, setBuildings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'building', 'room', 'tenant', 'bill'
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});

  // Configurable rates for bill calculation (stored in localStorage)
  const [waterRate, setWaterRate] = useState(() => {
    const saved = localStorage.getItem('waterRate');
    return saved ? parseFloat(saved) : 15; // Default ฿15 per unit
  });
  
  const [electricRate, setElectricRate] = useState(() => {
    const saved = localStorage.getItem('electricRate');
    return saved ? parseFloat(saved) : 8; // Default ฿8 per unit
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    console.log('🔄 Fetching data...');
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
      
    } catch (e) {
      setError(`Error: ${e.message}`);
      setLoading(false);
    }
  };

  // Calculate bill based on current and previous meter readings
  const calculateBill = (room) => {
    if (!room.tenant_name || room.status !== 'occupied') return null;

    // Handle cases where meter history columns don't exist
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
      month: new Date().toISOString().slice(0, 7), // YYYY-MM format
      due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), // 5 days from now
      has_meter_history: room.previous_water_meter !== undefined && room.previous_electric_meter !== undefined
    };
  };

  // Modal handling
  const openModal = (type, item = null) => {
    console.log('📝 Opening modal:', { type, item });
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
      console.log('🏠 Setting tenant form data:', tenantFormData);
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
    console.log('💾 Saving...', { modalType, editingItem: editingItem?.id, formData });
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
        // Always update the room with tenant info (both add and edit tenant use the same room update)
        if (!editingItem) {
          throw new Error('No room selected for tenant operation');
        }
        
        // Prepare update data, excluding meter fields if they don't exist in schema
        const updateData = {
          tenant_name: formData.tenant_name,
          tenant_address: formData.tenant_address,
          tenant_phone: formData.tenant_phone,
          tenant_id_card: formData.tenant_id_card,
          rent_price: formData.rent_price,
          status: 'occupied'
        };

        // Try to include meter fields if they exist
        try {
          // Test if meter history columns exist by doing a select
          const { error: testError } = await supabase
            .from('rooms')
            .select('previous_water_meter, previous_electric_meter')
            .limit(1);
          
          if (!testError) {
            // Columns exist, include them
            updateData.previous_water_meter = formData.previous_water_meter;
            updateData.water_meter = formData.water_meter;
            updateData.previous_electric_meter = formData.previous_electric_meter;
            updateData.electric_meter = formData.electric_meter;
            console.log('✅ Including meter history fields in update');
          } else {
            console.log('⚠️ Meter history columns not found, updating without them');
            // Include only basic meter fields that should exist
            updateData.water_meter = formData.water_meter;
            updateData.electric_meter = formData.electric_meter;
          }
        } catch (schemaError) {
          console.log('⚠️ Schema check failed, using basic fields only');
          updateData.water_meter = formData.water_meter;
          updateData.electric_meter = formData.electric_meter;
        }

        const { error } = await supabase
          .from('rooms')
          .update(updateData)
          .eq('id', editingItem.id);
        if (error) throw error;
      } else if (modalType === 'meter-update') {
        // Check if meter history columns exist
        try {
          const { error: testError } = await supabase
            .from('rooms')
            .select('previous_water_meter, previous_electric_meter')
            .limit(1);
          
          if (!testError) {
            // Columns exist, update with history
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
            // Columns don't exist, update only current meters
            const { error } = await supabase
              .from('rooms')
              .update({
                water_meter: formData.water_meter,
                electric_meter: formData.electric_meter
              })
              .eq('id', editingItem.id);
            if (error) throw error;
            console.log('⚠️ Updated meters without history (columns missing)');
          }
        } catch (schemaError) {
          // Fallback to basic meter update
          const { error } = await supabase
            .from('rooms')
            .update({
              water_meter: formData.water_meter,
              electric_meter: formData.electric_meter
            })
            .eq('id', editingItem.id);
          if (error) throw error;
          console.log('⚠️ Fallback meter update (schema error)');
        }
      } else if (modalType === 'settings') {
        // Save rates to localStorage
        const newWaterRate = parseFloat(formData.water_rate) || 15;
        const newElectricRate = parseFloat(formData.electric_rate) || 8;
        
        localStorage.setItem('waterRate', newWaterRate.toString());
        localStorage.setItem('electricRate', newElectricRate.toString());
        
        setWaterRate(newWaterRate);
        setElectricRate(newElectricRate);
        
        console.log('⚙️ Settings updated:', { waterRate: newWaterRate, electricRate: newElectricRate });
      }

      console.log('✅ Save successful, refreshing data...');
      await fetchData();
      closeModal();
      setError('');
    } catch (error) {
      console.error('❌ Save failed:', error);
      setError(`Save failed: ${error.message}`);
    }
  };

  const handleDelete = async (type, item) => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;

    try {
      if (type === 'building') {
        await supabase.from('rooms').delete().eq('building_id', item.id);
        const { error } = await supabase
          .from('buildings')
          .delete()
          .eq('id', item.id);
        if (error) throw error;
        
        if (selectedBuilding === item.id) {
          setSelectedBuilding(null);
        }
      } else if (type === 'room') {
        const { error } = await supabase
          .from('rooms')
          .delete()
          .eq('id', item.id);
        if (error) throw error;
      } else if (type === 'tenant') {
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

  // Styles (same as before, but I'll include key ones)
  const containerStyle = {
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    maxWidth: '1200px',
    margin: '0 auto'
  };

  const cardStyle = {
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
    backgroundColor: '#ffffff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  };

  const headerStyle = {
    backgroundColor: '#2563eb',
    color: 'white',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px'
  };

  const buttonStyle = {
    backgroundColor: '#2563eb',
    color: 'white',
    padding: '12px 24px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    marginRight: '10px',
    marginBottom: '10px'
  };

  const dangerButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#dc2626'
  };

  const secondaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#6b7280'
  };

  const successButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#059669'
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
    padding: '30px',
    borderRadius: '8px',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '80vh',
    overflow: 'auto'
  };

  const inputStyle = {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    marginBottom: '15px',
    fontSize: '16px'
  };

  const statsStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    marginBottom: '20px'
  };

  const statCardStyle = {
    ...cardStyle,
    textAlign: 'center',
    backgroundColor: '#f8f9fa'
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

      {/* Debug Status - Temporary */}
      {!loading && (
        <div style={{...cardStyle, backgroundColor: '#fee2e2', border: '2px solid #dc2626', marginBottom: '20px'}}>
          <h3 style={{margin: '0 0 10px 0', color: '#dc2626'}}>🔍 Debug Status</h3>
          <div style={{fontSize: '14px', fontFamily: 'monospace'}}>
            <p>Loading: {loading.toString()}</p>
            <p>Buildings count: {buildings.length}</p>
            <p>Rooms count: {rooms.length}</p>
            <p>Selected building: {selectedBuilding || 'none'}</p>
            <p>Error: {error || 'none'}</p>
            <p>Water rate: {waterRate}</p>
            <p>Electric rate: {electricRate}</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div style={{...cardStyle, backgroundColor: '#fee', borderColor: '#fcc'}}>
          <h2 style={{color: '#c33'}}>⚠️ Error</h2>
          <p style={{color: '#c33'}}>{error}</p>
          <button onClick={() => setError('')} style={buttonStyle}>
            Dismiss
          </button>
        </div>
      )}

      {/* Statistics */}
      {!loading && (
        <div style={statsStyle}>
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
            <h3 style={{margin: 0, color: '#d97706'}}>💰 Monthly Revenue</h3>
            <p style={{fontSize: '24px', margin: '10px 0', fontWeight: 'bold'}}>
              ฿{rooms.filter(r => r.status === 'occupied').reduce((sum, room) => {
                const bill = calculateBill(room);
                return sum + (bill?.total_amount || 0);
              }, 0).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Buildings Management */}
      <div style={cardStyle}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
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
                      ...buttonStyle,
                      backgroundColor: selectedBuilding === building.id ? '#059669' : '#6b7280',
                      fontSize: '14px',
                      padding: '8px 16px'
                    }}
                  >
                    {selectedBuilding === building.id ? '✓ Selected' : 'Select'}
                  </button>
                  <button 
                    onClick={() => openModal('building', building)}
                    style={{...secondaryButtonStyle, fontSize: '14px', padding: '8px 16px'}}
                  >
                    ✏️ Edit
                  </button>
                  <button 
                    onClick={() => handleDelete('building', building)}
                    style={{...dangerButtonStyle, fontSize: '14px', padding: '8px 16px'}}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rooms Management */}
      {selectedBuilding && (
        <div style={cardStyle}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
            <h2 style={{margin: 0}}>
              🏠 Rooms in {buildings.find(b => b.id === selectedBuilding)?.name}
            </h2>
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
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        backgroundColor: room.status === 'occupied' ? '#dbeafe' : '#f3f4f6',
                        color: room.status === 'occupied' ? '#1e40af' : '#374151'
                      }}>
                        {room.status === 'occupied' ? '👤 Occupied' : '🏠 Vacant'}
                      </span>
                    </div>
                    
                    <p><strong>Rent:</strong> ฿{room.rent_price?.toLocaleString() || 0}</p>
                    
                    {room.status === 'occupied' && room.tenant_name && (
                      <div style={{marginBottom: '15px', padding: '10px', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '6px'}}>
                        <p><strong>Tenant:</strong> {room.tenant_name}</p>
                        <p><strong>Phone:</strong> {room.tenant_phone}</p>
                        
                        {/* Meter Readings */}
                        <div style={{marginTop: '10px', padding: '8px', backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '4px'}}>
                          <h4 style={{margin: '0 0 8px 0', fontSize: '14px', color: '#374151'}}>📊 Meter Readings</h4>
                          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px'}}>
                            <div>
                              <p style={{margin: '2px 0'}}><strong>Water:</strong></p>
                              <p style={{margin: '2px 0', color: '#6b7280'}}>Previous: {room.previous_water_meter || 0}</p>
                              <p style={{margin: '2px 0', color: '#059669'}}>Current: {room.water_meter || 0}</p>
                              <p style={{margin: '2px 0', fontWeight: 'bold'}}>Usage: {Math.max(0, (room.water_meter || 0) - (room.previous_water_meter || 0))} units</p>
                            </div>
                            <div>
                              <p style={{margin: '2px 0'}}><strong>Electric:</strong></p>
                              <p style={{margin: '2px 0', color: '#6b7280'}}>Previous: {room.previous_electric_meter || 0}</p>
                              <p style={{margin: '2px 0', color: '#059669'}}>Current: {room.electric_meter || 0}</p>
                              <p style={{margin: '2px 0', fontWeight: 'bold'}}>Usage: {Math.max(0, (room.electric_meter || 0) - (room.previous_electric_meter || 0))} units</p>
                            </div>
                          </div>
                        </div>

                        {/* Bill Calculation */}
                        {bill && (
                          <div style={{marginTop: '10px', padding: '8px', backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: '4px'}}>
                            <h4 style={{margin: '0 0 8px 0', fontSize: '14px', color: '#059669'}}>💰 Monthly Bill</h4>
                            <div style={{fontSize: '12px'}}>
                              <p style={{margin: '2px 0'}}>Rent: ฿{bill.rent_amount.toLocaleString()}</p>
                              <p style={{margin: '2px 0'}}>Water: {bill.water_units} units × ฿{waterRate} = ฿{bill.water_cost.toLocaleString()}</p>
                              <p style={{margin: '2px 0'}}>Electric: {bill.electric_units} units × ฿{electricRate} = ฿{bill.electric_cost.toLocaleString()}</p>
                              <p style={{margin: '5px 0 0 0', fontWeight: 'bold', fontSize: '14px'}}>Total: ฿{bill.total_amount.toLocaleString()}</p>
                            </div>
                          </div>
                        )}
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
                          style={{...buttonStyle, fontSize: '12px', padding: '6px 12px'}}
                        >
                          👤 Add Tenant
                        </button>
                      ) : (
                        <>
                          <button 
                            onClick={() => openModal('tenant', room)}
                            style={{...buttonStyle, fontSize: '12px', padding: '6px 12px'}}
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
                            👤 Remove Tenant
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
                  placeholder="e.g., 101, A201"
                />
                
                <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>
                  Monthly Rent (฿):
                </label>
                <input
                  type="number"
                  value={formData.rent_price || ''}
                  onChange={(e) => setFormData({...formData, rent_price: parseInt(e.target.value) || 0})}
                  style={inputStyle}
                  placeholder="Enter rent amount"
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
                  placeholder="Enter tenant name"
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
                <textarea
                  value={formData.tenant_address || ''}
                  onChange={(e) => setFormData({...formData, tenant_address: e.target.value})}
                  style={{...inputStyle, height: '80px'}}
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
                        style={{...inputStyle, marginBottom: '5px'}}
                        placeholder="Current water meter"
                      />
                      <p style={{fontSize: '12px', color: '#374151', margin: 0}}>
                        Usage: {Math.max(0, (formData.water_meter || 0) - (formData.previous_water_meter || 0))} units
                      </p>
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
                      <label style={{display: 'block', marginBottom: '3px', fontSize: '12px', color: '#059669'}}>
                        Current Reading:
                      </label>
                      <input
                        type="number"
                        value={formData.electric_meter || ''}
                        onChange={(e) => setFormData({...formData, electric_meter: parseInt(e.target.value) || 0})}
                        style={{...inputStyle, marginBottom: '5px'}}
                        placeholder="Current electric meter"
                      />
                      <p style={{fontSize: '12px', color: '#374151', margin: 0}}>
                        Usage: {Math.max(0, (formData.electric_meter || 0) - (formData.previous_electric_meter || 0))} units
                      </p>
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
                    <p style={{fontSize: '12px', color: '#6b7280', margin: '0 0 5px 0'}}>
                      Current: {editingItem?.water_meter || 0} → Will become previous
                    </p>
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
                    <p style={{fontSize: '12px', color: '#6b7280', margin: '0 0 5px 0'}}>
                      Current: {editingItem?.electric_meter || 0} → Will become previous
                    </p>
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
                    <h4 style={{margin: '0 0 8px 0', fontSize: '18px', color: '#2563eb'}}>💰 Total Amount</h4>
                    <p style={{margin: '2px 0', fontSize: '16px'}}>Rent: ฿{formData.rent_amount?.toLocaleString()}</p>
                    <p style={{margin: '2px 0', fontSize: '16px'}}>Water: ฿{formData.water_cost?.toLocaleString()}</p>
                    <p style={{margin: '2px 0', fontSize: '16px'}}>Electric: ฿{formData.electric_cost?.toLocaleString()}</p>
                    <p style={{margin: '8px 0 0 0', fontSize: '20px', fontWeight: 'bold', color: '#2563eb'}}>
                      Total: ฿{formData.total_amount?.toLocaleString()}
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

export default EnhancedApp;
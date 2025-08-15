// Production App with full CRUD functionality for buildings, rooms, and tenants
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

const ProductionApp = () => {
  const [buildings, setBuildings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'building', 'room', 'tenant'
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});

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
      setFormData(item ? {
        tenant_name: item.tenant_name || '',
        tenant_address: item.tenant_address || '',
        tenant_phone: item.tenant_phone || '',
        tenant_id_card: item.tenant_id_card || '',
        rent_price: item.rent_price || 0,
        water_meter: item.water_meter || 0,
        electric_meter: item.electric_meter || 0
      } : {
        tenant_name: '',
        tenant_address: '',
        tenant_phone: '',
        tenant_id_card: '',
        rent_price: editingItem?.rent_price || 0,
        water_meter: 0,
        electric_meter: 0
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
          // Update building
          const { error } = await supabase
            .from('buildings')
            .update({ name: formData.name })
            .eq('id', editingItem.id);
          if (error) throw error;
        } else {
          // Create building
          const { error } = await supabase
            .from('buildings')
            .insert([{ name: formData.name }]);
          if (error) throw error;
        }
      } else if (modalType === 'room') {
        if (editingItem) {
          // Update room
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
          // Create room
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
              is_overdue: false,
              current_bill: null,
              history: []
            }]);
          if (error) throw error;
        }
      } else if (modalType === 'tenant') {
        // Update room with tenant info
        const { error } = await supabase
          .from('rooms')
          .update({
            tenant_name: formData.tenant_name,
            tenant_address: formData.tenant_address,
            tenant_phone: formData.tenant_phone,
            tenant_id_card: formData.tenant_id_card,
            rent_price: formData.rent_price,
            water_meter: formData.water_meter,
            electric_meter: formData.electric_meter,
            status: 'occupied'
          })
          .eq('id', editingItem.id);
        if (error) throw error;
      }

      await fetchData();
      closeModal();
      setError('');
    } catch (error) {
      setError(`Save failed: ${error.message}`);
    }
  };

  const handleDelete = async (type, item) => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;

    try {
      if (type === 'building') {
        // Delete all rooms in building first
        await supabase.from('rooms').delete().eq('building_id', item.id);
        // Delete building
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
        // Remove tenant from room (make vacant)
        const { error } = await supabase
          .from('rooms')
          .update({
            tenant_name: null,
            tenant_address: null,
            tenant_phone: null,
            tenant_id_card: null,
            status: 'vacant',
            water_meter: 0,
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
    maxWidth: '500px',
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
        <h1 style={{margin: 0, fontSize: '28px'}}>
          🏢 PorLivingSpaces
        </h1>
        <p style={{margin: '10px 0 0 0', opacity: 0.9}}>
          Professional Rental Management System
        </p>
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
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '15px'}}>
              {currentRooms.map(room => (
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
                      <p><strong>Address:</strong> {room.tenant_address}</p>
                      <p><strong>Water:</strong> {room.water_meter} units | <strong>Electric:</strong> {room.electric_meter} units</p>
                    </div>
                  )}
                  
                  <div>
                    <button 
                      onClick={() => openModal('room', room)}
                      style={{...secondaryButtonStyle, fontSize: '14px', padding: '8px 16px'}}
                    >
                      ✏️ Edit Room
                    </button>
                    
                    {room.status === 'vacant' ? (
                      <button 
                        onClick={() => openModal('tenant', room)}
                        style={{...buttonStyle, fontSize: '14px', padding: '8px 16px'}}
                      >
                        👤 Add Tenant
                      </button>
                    ) : (
                      <>
                        <button 
                          onClick={() => openModal('tenant', room)}
                          style={{...buttonStyle, fontSize: '14px', padding: '8px 16px'}}
                        >
                          ✏️ Edit Tenant
                        </button>
                        <button 
                          onClick={() => handleDelete('tenant', room)}
                          style={{...dangerButtonStyle, fontSize: '14px', padding: '8px 16px'}}
                        >
                          👤 Remove Tenant
                        </button>
                      </>
                    )}
                    
                    <button 
                      onClick={() => handleDelete('room', room)}
                      style={{...dangerButtonStyle, fontSize: '14px', padding: '8px 16px'}}
                    >
                      🗑️ Delete Room
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={modalStyle} onClick={closeModal}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={{marginTop: 0}}>
              {editingItem ? 'Edit' : 'Add'} {modalType.charAt(0).toUpperCase() + modalType.slice(1)}
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
                
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px'}}>
                  <div>
                    <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>
                      Monthly Rent (฿):
                    </label>
                    <input
                      type="number"
                      value={formData.rent_price || ''}
                      onChange={(e) => setFormData({...formData, rent_price: parseInt(e.target.value) || 0})}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>
                      Water Meter:
                    </label>
                    <input
                      type="number"
                      value={formData.water_meter || ''}
                      onChange={(e) => setFormData({...formData, water_meter: parseInt(e.target.value) || 0})}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>
                      Electric Meter:
                    </label>
                    <input
                      type="number"
                      value={formData.electric_meter || ''}
                      onChange={(e) => setFormData({...formData, electric_meter: parseInt(e.target.value) || 0})}
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>
            )}
            
            <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: '20px'}}>
              <button onClick={closeModal} style={secondaryButtonStyle}>
                Cancel
              </button>
              <button onClick={handleSave} style={buttonStyle}>
                {editingItem ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProductionApp;
// =====================================================================================
//                          FRONTEND: components/DatabaseSetup.jsx
// =====================================================================================
// Component to check and setup database tables if needed
// =====================================================================================

import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const DatabaseSetup = () => {
  const [setupStatus, setSetupStatus] = useState('idle');
  const [setupLog, setSetupLog] = useState([]);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setSetupLog(prev => [...prev, { message, type, timestamp }]);
    console.log(`🔧 [${timestamp}] ${message}`);
  };

  const checkAndAddMeterColumns = async () => {
    try {
      addLog('🔍 Checking rooms table schema...', 'info');
      
      // Try to select the new columns to see if they exist
      const { data, error } = await supabase
        .from('rooms')
        .select('previous_water_meter, previous_electric_meter')
        .limit(1);
      
      if (error && error.message.includes('column')) {
        addLog('❌ Meter history columns missing, adding them...', 'warning');
        
        // Add the missing columns using SQL
        const { error: alterError } = await supabase.rpc('exec_sql', {
          sql: `
            ALTER TABLE rooms 
            ADD COLUMN IF NOT EXISTS previous_water_meter INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS previous_electric_meter INTEGER DEFAULT 0;
          `
        });
        
        if (alterError) {
          // If RPC doesn't work, try direct SQL execution
          addLog('⚠️ RPC method failed, trying alternative approach...', 'warning');
          
          // Create a temporary function to add columns
          const alterQueries = [
            "ALTER TABLE rooms ADD COLUMN IF NOT EXISTS previous_water_meter INTEGER DEFAULT 0;",
            "ALTER TABLE rooms ADD COLUMN IF NOT EXISTS previous_electric_meter INTEGER DEFAULT 0;"
          ];
          
          for (const query of alterQueries) {
            const { error: sqlError } = await supabase.rpc('exec_sql', { sql: query });
            if (sqlError) {
              addLog(`❌ Failed to execute: ${query}`, 'error');
              addLog(`Error: ${sqlError.message}`, 'error');
            } else {
              addLog(`✅ Executed: ${query}`, 'success');
            }
          }
        } else {
          addLog('✅ Meter history columns added successfully!', 'success');
        }
      } else if (data) {
        addLog('✅ Meter history columns already exist!', 'success');
      } else {
        addLog(`❌ Schema check failed: ${error?.message}`, 'error');
      }
      
    } catch (error) {
      addLog(`❌ Schema check error: ${error.message}`, 'error');
    }
  };

  const checkAndAddTenantDateColumns = async () => {
    try {
      addLog('🔍 Checking tenant date columns...', 'info');
      
      // Try to select the new columns to see if they exist
      const { data, error } = await supabase
        .from('rooms')
        .select('tenant_start_date, tenant_end_date')
        .limit(1);
      
      if (error && error.message.includes('column')) {
        addLog('❌ Tenant date columns missing, adding them...', 'warning');
        
        // Add the missing columns using SQL
        const { error: alterError } = await supabase.rpc('exec_sql', {
          sql: `
            ALTER TABLE rooms 
            ADD COLUMN IF NOT EXISTS tenant_start_date DATE,
            ADD COLUMN IF NOT EXISTS tenant_end_date DATE;
          `
        });
        
        if (alterError) {
          // If RPC doesn't work, try direct SQL execution
          addLog('⚠️ RPC method failed, trying alternative approach...', 'warning');
          
          // Create a temporary function to add columns
          const alterQueries = [
            "ALTER TABLE rooms ADD COLUMN IF NOT EXISTS tenant_start_date DATE;",
            "ALTER TABLE rooms ADD COLUMN IF NOT EXISTS tenant_end_date DATE;"
          ];
          
          for (const query of alterQueries) {
            const { error: sqlError } = await supabase.rpc('exec_sql', { sql: query });
            if (sqlError) {
              addLog(`❌ Failed to execute: ${query}`, 'error');
              addLog(`Error: ${sqlError.message}`, 'error');
            } else {
              addLog(`✅ Executed: ${query}`, 'success');
            }
          }
        } else {
          addLog('✅ Tenant date columns added successfully!', 'success');
        }
      } else if (data) {
        addLog('✅ Tenant date columns already exist!', 'success');
      } else {
        addLog(`❌ Schema check failed: ${error?.message}`, 'error');
      }
      
    } catch (error) {
      addLog(`❌ Tenant date columns error: ${error.message}`, 'error');
    }
  };

  const checkAndCreateRevenueHistoryTable = async () => {
    try {
      addLog('🔍 Checking revenue_history table...', 'info');
      
      // Try to select from revenue_history table
      const { data, error } = await supabase
        .from('revenue_history')
        .select('*')
        .limit(1);
      
      if (error && error.code === 'PGRST116') {
        addLog('❌ Revenue history table missing, creating it...', 'warning');
        
        // Create revenue_history table
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS revenue_history (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            month_key VARCHAR(7) NOT NULL UNIQUE, -- YYYY-MM format
            total_revenue DECIMAL(10,2) NOT NULL DEFAULT 0,
            occupied_rooms INTEGER NOT NULL DEFAULT 0,
            total_rent DECIMAL(10,2) NOT NULL DEFAULT 0,
            total_water_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
            total_electric_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
            water_rate DECIMAL(8,2) NOT NULL DEFAULT 15.00,
            electric_rate DECIMAL(8,2) NOT NULL DEFAULT 8.00,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
          );
          
          -- Create index for efficient month queries
          CREATE INDEX IF NOT EXISTS idx_revenue_history_month ON revenue_history(month_key);
          
          -- Create trigger for updated_at
          CREATE OR REPLACE FUNCTION update_updated_at_column()
          RETURNS TRIGGER AS $$
          BEGIN
              NEW.updated_at = TIMEZONE('utc'::text, NOW());
              RETURN NEW;
          END;
          $$ language 'plpgsql';
          
          CREATE TRIGGER update_revenue_history_updated_at 
            BEFORE UPDATE ON revenue_history 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
        `;

        const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
        
        if (createError) {
          addLog(`❌ Failed to create revenue_history table: ${createError.message}`, 'error');
        } else {
          addLog('✅ Revenue history table created successfully!', 'success');
        }
      } else if (data !== null) {
        addLog('✅ Revenue history table already exists!', 'success');
      } else {
        addLog(`❌ Revenue history table check failed: ${error?.message}`, 'error');
      }
      
    } catch (error) {
      addLog(`❌ Revenue history table error: ${error.message}`, 'error');
    }
  };

  const manualSchemaUpdate = () => {
    addLog('📋 Manual Schema Update Instructions:', 'info');
    addLog('1. Go to your Supabase Dashboard', 'info');
    addLog('2. Navigate to SQL Editor', 'info');
    addLog('3. Run this SQL for meter columns:', 'info');
    addLog('ALTER TABLE rooms ADD COLUMN IF NOT EXISTS previous_water_meter INTEGER DEFAULT 0;', 'info');
    addLog('ALTER TABLE rooms ADD COLUMN IF NOT EXISTS previous_electric_meter INTEGER DEFAULT 0;', 'info');
    addLog('4. Run this SQL for tenant date columns:', 'info');
    addLog('ALTER TABLE rooms ADD COLUMN IF NOT EXISTS tenant_start_date DATE;', 'info');
    addLog('ALTER TABLE rooms ADD COLUMN IF NOT EXISTS tenant_end_date DATE;', 'info');
    addLog('5. Run this SQL for revenue history table:', 'info');
    addLog(`CREATE TABLE IF NOT EXISTS revenue_history (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      month_key VARCHAR(7) NOT NULL UNIQUE,
      total_revenue DECIMAL(10,2) NOT NULL DEFAULT 0,
      occupied_rooms INTEGER NOT NULL DEFAULT 0,
      total_rent DECIMAL(10,2) NOT NULL DEFAULT 0,
      total_water_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
      total_electric_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
      water_rate DECIMAL(8,2) NOT NULL DEFAULT 15.00,
      electric_rate DECIMAL(8,2) NOT NULL DEFAULT 8.00,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
    );`, 'info');
    addLog('5. Click "Run" to execute the SQL', 'info');
    addLog('6. Refresh this page and try again', 'info');
  };

  const setupDatabase = async () => {
    setSetupStatus('running');
    setSetupLog([]);
    addLog('🚀 Starting database schema check and setup...', 'info');

    try {
      // Check if tables exist
      addLog('🔍 Checking if tables exist...', 'info');
      
      const { data: buildings, error: buildingsError } = await supabase
        .from('buildings')
        .select('count', { count: 'exact', head: true });
      
      if (buildingsError) {
        addLog(`❌ Buildings table issue: ${buildingsError.message}`, 'error');
      } else {
        addLog('✅ Buildings table exists', 'success');
      }

      const { data: rooms, error: roomsError } = await supabase
        .from('rooms')
        .select('count', { count: 'exact', head: true });
      
      if (roomsError) {
        addLog(`❌ Rooms table issue: ${roomsError.message}`, 'error');
      } else {
        addLog('✅ Rooms table exists', 'success');
        
        // Now check and add meter columns
        await checkAndAddMeterColumns();
        
        // Check and add tenant date columns
        await checkAndAddTenantDateColumns();
      }

      // Check and create revenue history table
      await checkAndCreateRevenueHistoryTable();

      addLog('✅ Database setup completed!', 'success');
      setSetupStatus('completed');
      
    } catch (error) {
      addLog(`❌ Setup failed: ${error.message}`, 'error');
      setSetupStatus('failed');
    }
  };

  const createSampleData = async () => {
    setSetupStatus('creating-sample');
    addLog('🏗️ Creating sample data...', 'info');

    try {
      // Create sample building
      const { data: building, error: buildingError } = await supabase
        .from('buildings')
        .insert([{ name: 'Sample Building A' }])
        .select();

      if (buildingError) {
        addLog(`❌ Building creation failed: ${buildingError.message}`, 'error');
        return;
      }

      const buildingId = building[0].id;
      addLog(`✅ Created building: ${building[0].name}`, 'success');

      // Create sample rooms with meter history columns
      const sampleRooms = [
        {
          room_number: '101',
          rent_price: 8000,
          building_id: buildingId,
          status: 'occupied',
          tenant_name: 'John Doe',
          tenant_phone: '081-234-5678',
          tenant_address: '123 Main St',
          tenant_id_card: '1234567890123',
          water_meter: 150,
          electric_meter: 2500,
          previous_water_meter: 130,
          previous_electric_meter: 2300,
          is_overdue: false
        },
        {
          room_number: '102',
          rent_price: 7500,
          building_id: buildingId,
          status: 'vacant',
          water_meter: 0,
          electric_meter: 0,
          previous_water_meter: 0,
          previous_electric_meter: 0,
          is_overdue: false
        }
      ];

      const { data: rooms, error: roomsError } = await supabase
        .from('rooms')
        .insert(sampleRooms)
        .select();

      if (roomsError) {
        addLog(`❌ Rooms creation failed: ${roomsError.message}`, 'error');
      } else {
        addLog(`✅ Created ${rooms.length} sample rooms`, 'success');
        
        // Create sample revenue history
        const currentMonth = new Date().toISOString().slice(0, 7);
        const previousMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 7);
        
        const sampleRevenue = [
          {
            month_key: previousMonth,
            total_revenue: 22000,
            occupied_rooms: 2,
            total_rent: 15500,
            total_water_cost: 3000,
            total_electric_cost: 3500,
            water_rate: 15.00,
            electric_rate: 8.00
          },
          {
            month_key: currentMonth,
            total_revenue: 25500,
            occupied_rooms: 2,
            total_rent: 15500,
            total_water_cost: 4000,
            total_electric_cost: 6000,
            water_rate: 15.00,
            electric_rate: 8.00
          }
        ];

        const { error: revenueError } = await supabase
          .from('revenue_history')
          .insert(sampleRevenue);

        if (revenueError) {
          addLog(`⚠️ Revenue history creation failed: ${revenueError.message}`, 'warning');
        } else {
          addLog(`✅ Created sample revenue history`, 'success');
        }
        
        addLog('🎉 Sample data creation completed!', 'success');
      }

      setSetupStatus('completed');
    } catch (error) {
      addLog(`❌ Sample data creation failed: ${error.message}`, 'error');
      setSetupStatus('failed');
    }
  };

  const buttonStyle = {
    padding: '12px 24px',
    margin: '0 8px 8px 0',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '14px'
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#2563eb',
    color: 'white'
  };

  const secondaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#64748b',
    color: 'white'
  };

  const warningButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#d97706',
    color: 'white'
  };

  return (
    <div style={{
      border: '2px solid #d97706',
      borderRadius: '8px',
      padding: '20px',
      margin: '20px 0',
      backgroundColor: '#fef3c7'
    }}>
      <h2 style={{ color: '#d97706', marginBottom: '15px' }}>
        🔧 Database Schema Setup & Migration
      </h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={setupDatabase}
          disabled={setupStatus === 'running'}
          style={primaryButtonStyle}
        >
          {setupStatus === 'running' ? '🔄 Checking Schema...' : '🔍 Check & Fix Schema'}
        </button>
        
        <button
          onClick={createSampleData}
          disabled={setupStatus === 'creating-sample'}
          style={secondaryButtonStyle}
        >
          {setupStatus === 'creating-sample' ? '🔄 Creating Data...' : '🏗️ Create Sample Data'}
        </button>
        
        <button
          onClick={manualSchemaUpdate}
          style={warningButtonStyle}
        >
          📋 Show Manual Fix Instructions
        </button>
      </div>

      {setupLog.length > 0 && (
        <div style={{
          backgroundColor: '#1f2937',
          color: '#f9fafb',
          padding: '15px',
          borderRadius: '6px',
          fontFamily: 'monospace',
          fontSize: '12px',
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#10b981' }}>
            Setup Log:
          </div>
          {setupLog.map((log, index) => (
            <div
              key={index}
              style={{
                marginBottom: '5px',
                color: log.type === 'error' ? '#ef4444' : 
                      log.type === 'warning' ? '#f59e0b' : 
                      log.type === 'success' ? '#10b981' : '#d1d5db'
              }}
            >
              [{log.timestamp}] {log.message}
            </div>
          ))}
        </div>
      )}
      
      <div style={{
        marginTop: '15px',
        padding: '10px',
        backgroundColor: '#dbeafe',
        borderRadius: '6px',
        fontSize: '12px',
        color: '#1e40af'
      }}>
        <strong>💡 About This Tool:</strong> This creates the revenue_history table for storing monthly revenue data 
        and fixes any missing meter history columns. All revenue tracking will be stored in Supabase database instead of localStorage.
      </div>
    </div>
  );
};

export default DatabaseSetup;
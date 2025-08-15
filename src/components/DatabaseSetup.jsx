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

  const checkAndCreateTenantsTable = async () => {
    try {
      addLog('🔍 Checking tenants table...', 'info');
      
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .limit(1);
      
      if (error && error.code === 'PGRST116') {
        addLog('❌ Tenants table missing, creating it...', 'warning');
        
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS tenants (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            tenant_id_number VARCHAR(50) UNIQUE NOT NULL,
            full_name VARCHAR(255) NOT NULL,
            phone VARCHAR(50),
            email VARCHAR(255),
            address TEXT,
            id_card_number VARCHAR(50),
            emergency_contact_name VARCHAR(255),
            emergency_contact_phone VARCHAR(50),
            notes TEXT,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
          );
          
          CREATE INDEX IF NOT EXISTS idx_tenants_tenant_id ON tenants(tenant_id_number);
          CREATE INDEX IF NOT EXISTS idx_tenants_active ON tenants(is_active);
          CREATE INDEX IF NOT EXISTS idx_tenants_name ON tenants(full_name);
          
          CREATE TRIGGER update_tenants_updated_at 
          BEFORE UPDATE ON tenants 
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        `;
        
        const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
        
        if (createError) {
          addLog(`❌ Failed to create tenants table: ${createError.message}`, 'error');
        } else {
          addLog('✅ Tenants table created successfully!', 'success');
        }
      } else if (data !== null) {
        addLog('✅ Tenants table already exists!', 'success');
      } else {
        addLog(`❌ Tenants table check failed: ${error?.message}`, 'error');
      }
    } catch (error) {
      addLog(`❌ Tenants table error: ${error.message}`, 'error');
    }
  };

  const checkAndCreateTenantLeasesTable = async () => {
    try {
      addLog('🔍 Checking tenant_leases table...', 'info');
      
      const { data, error } = await supabase
        .from('tenant_leases')
        .select('*')
        .limit(1);
      
      if (error && error.code === 'PGRST116') {
        addLog('❌ Tenant leases table missing, creating it...', 'warning');
        
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS tenant_leases (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
            lease_start_date DATE NOT NULL,
            lease_end_date DATE,
            monthly_rent DECIMAL(10,2) NOT NULL,
            security_deposit DECIMAL(10,2) DEFAULT 0,
            lease_status VARCHAR(20) DEFAULT 'active' CHECK (lease_status IN ('active', 'completed', 'terminated', 'pending')),
            termination_reason TEXT,
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
            UNIQUE(room_id, lease_status) WHERE lease_status = 'active'
          );
          
          CREATE INDEX IF NOT EXISTS idx_tenant_leases_tenant ON tenant_leases(tenant_id);
          CREATE INDEX IF NOT EXISTS idx_tenant_leases_room ON tenant_leases(room_id);
          CREATE INDEX IF NOT EXISTS idx_tenant_leases_status ON tenant_leases(lease_status);
          CREATE INDEX IF NOT EXISTS idx_tenant_leases_dates ON tenant_leases(lease_start_date, lease_end_date);
          
          CREATE TRIGGER update_tenant_leases_updated_at 
          BEFORE UPDATE ON tenant_leases 
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        `;
        
        const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
        
        if (createError) {
          addLog(`❌ Failed to create tenant_leases table: ${createError.message}`, 'error');
        } else {
          addLog('✅ Tenant leases table created successfully!', 'success');
        }
      } else if (data !== null) {
        addLog('✅ Tenant leases table already exists!', 'success');
      } else {
        addLog(`❌ Tenant leases table check failed: ${error?.message}`, 'error');
      }
    } catch (error) {
      addLog(`❌ Tenant leases table error: ${error.message}`, 'error');
    }
  };

  const checkAndUpdateRoomsTable = async () => {
    try {
      addLog('🔍 Checking rooms table for tenant system compatibility...', 'info');
      
      // Check if current_tenant_lease_id column exists
      const { data, error } = await supabase
        .from('rooms')
        .select('current_tenant_lease_id')
        .limit(1);
      
      if (error && error.message.includes('column')) {
        addLog('❌ Adding current_tenant_lease_id column to rooms...', 'warning');
        
        const alterTableSQL = `
          ALTER TABLE rooms 
          ADD COLUMN IF NOT EXISTS current_tenant_lease_id UUID REFERENCES tenant_leases(id) ON DELETE SET NULL;
          
          CREATE INDEX IF NOT EXISTS idx_rooms_current_lease ON rooms(current_tenant_lease_id);
        `;
        
        const { error: alterError } = await supabase.rpc('exec_sql', { sql: alterTableSQL });
        
        if (alterError) {
          addLog(`❌ Failed to update rooms table: ${alterError.message}`, 'error');
        } else {
          addLog('✅ Rooms table updated for tenant system!', 'success');
        }
      } else if (data !== null) {
        addLog('✅ Rooms table already compatible with tenant system!', 'success');
      } else {
        addLog(`❌ Rooms table check failed: ${error?.message}`, 'error');
      }
    } catch (error) {
      addLog(`❌ Rooms table update error: ${error.message}`, 'error');
    }
  };

  const migrateTenantData = async () => {
    try {
      addLog('🔄 Starting tenant data migration...', 'info');
      
      // Get all rooms with tenant data
      const { data: roomsWithTenants, error: roomsError } = await supabase
        .from('rooms')
        .select('*')
        .not('tenant_name', 'is', null);
      
      if (roomsError) {
        addLog(`❌ Failed to fetch rooms with tenants: ${roomsError.message}`, 'error');
        return;
      }
      
      if (!roomsWithTenants || roomsWithTenants.length === 0) {
        addLog('ℹ️ No existing tenant data to migrate', 'info');
        return;
      }
      
      addLog(`📊 Found ${roomsWithTenants.length} rooms with tenant data to migrate`, 'info');
      
      for (const room of roomsWithTenants) {
        try {
          // Generate unique tenant ID
          const tenantIdNumber = `T-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;
          
          // Create tenant record
          const { data: tenant, error: tenantError } = await supabase
            .from('tenants')
            .insert({
              tenant_id_number: tenantIdNumber,
              full_name: room.tenant_name,
              phone: room.tenant_phone || null,
              address: room.tenant_address || null,
              id_card_number: room.tenant_id_card || null,
              is_active: true
            })
            .select()
            .single();
          
          if (tenantError) {
            addLog(`❌ Failed to create tenant ${room.tenant_name}: ${tenantError.message}`, 'error');
            continue;
          }
          
          // Create lease record
          const { data: lease, error: leaseError } = await supabase
            .from('tenant_leases')
            .insert({
              tenant_id: tenant.id,
              room_id: room.id,
              lease_start_date: room.tenant_start_date || new Date().toISOString().split('T')[0],
              lease_end_date: room.tenant_end_date || null,
              monthly_rent: room.rent_price || 0,
              lease_status: 'active'
            })
            .select()
            .single();
          
          if (leaseError) {
            addLog(`❌ Failed to create lease for ${room.tenant_name}: ${leaseError.message}`, 'error');
            continue;
          }
          
          // Update room to reference the lease
          const { error: roomUpdateError } = await supabase
            .from('rooms')
            .update({
              current_tenant_lease_id: lease.id,
              status: 'occupied'
            })
            .eq('id', room.id);
          
          if (roomUpdateError) {
            addLog(`❌ Failed to update room ${room.room_number}: ${roomUpdateError.message}`, 'error');
            continue;
          }
          
          addLog(`✅ Migrated tenant: ${room.tenant_name} (${tenantIdNumber}) in Room ${room.room_number}`, 'success');
          
        } catch (error) {
          addLog(`❌ Migration error for room ${room.room_number}: ${error.message}`, 'error');
        }
      }
      
      addLog('🎉 Tenant data migration completed!', 'success');
      
    } catch (error) {
      addLog(`❌ Migration failed: ${error.message}`, 'error');
    }
  };

  const checkAndCreatePaymentsTable = async () => {
    try {
      addLog('🔍 Checking payments table...', 'info');
      
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .limit(1);
      
      if (error && error.code === 'PGRST116') {
        addLog('❌ Payments table missing, creating it...', 'warning');
        
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS payments (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            tenant_lease_id UUID NOT NULL REFERENCES tenant_leases(id) ON DELETE CASCADE,
            payment_month VARCHAR(7) NOT NULL, -- YYYY-MM format
            invoice_amount DECIMAL(10,2) NOT NULL,
            paid_amount DECIMAL(10,2) DEFAULT 0,
            payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'overdue')),
            payment_date DATE,
            payment_method VARCHAR(50), -- cash, bank_transfer, check, etc.
            payment_reference VARCHAR(100), -- transaction ID, check number, etc.
            notes TEXT,
            due_date DATE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
            UNIQUE(tenant_lease_id, payment_month)
          );
          
          CREATE INDEX IF NOT EXISTS idx_payments_lease ON payments(tenant_lease_id);
          CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);
          CREATE INDEX IF NOT EXISTS idx_payments_month ON payments(payment_month);
          CREATE INDEX IF NOT EXISTS idx_payments_due_date ON payments(due_date);
          
          CREATE TRIGGER update_payments_updated_at 
          BEFORE UPDATE ON payments 
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        `;
        
        const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
        
        if (createError) {
          addLog(`❌ Failed to create payments table: ${createError.message}`, 'error');
        } else {
          addLog('✅ Payments table created successfully!', 'success');
        }
      } else if (data !== null) {
        addLog('✅ Payments table already exists!', 'success');
      } else {
        addLog(`❌ Payments table check failed: ${error?.message}`, 'error');
      }
    } catch (error) {
      addLog(`❌ Payments table error: ${error.message}`, 'error');
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
    addLog('5. Run this SQL for tenant management tables:', 'info');
    addLog('-- Create tenants table', 'info');
    addLog('CREATE TABLE tenants (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, tenant_id_number VARCHAR(50) UNIQUE NOT NULL, full_name VARCHAR(255) NOT NULL, phone VARCHAR(50), email VARCHAR(255), address TEXT, id_card_number VARCHAR(50), emergency_contact_name VARCHAR(255), emergency_contact_phone VARCHAR(50), notes TEXT, is_active BOOLEAN DEFAULT true, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());', 'info');
    addLog('-- Create tenant_leases table', 'info');
    addLog('CREATE TABLE tenant_leases (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE, room_id UUID REFERENCES rooms(id) ON DELETE CASCADE, lease_start_date DATE NOT NULL, lease_end_date DATE, monthly_rent DECIMAL(10,2) NOT NULL, security_deposit DECIMAL(10,2) DEFAULT 0, lease_status VARCHAR(20) DEFAULT \'active\', notes TEXT, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), UNIQUE(room_id, lease_status) WHERE lease_status = \'active\');', 'info');
    addLog('-- Update rooms table', 'info');
    addLog('ALTER TABLE rooms ADD COLUMN IF NOT EXISTS current_tenant_lease_id UUID REFERENCES tenant_leases(id) ON DELETE SET NULL;', 'info');
    addLog('6. Run this SQL for payment tracking table:', 'info');
    addLog('CREATE TABLE payments (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, tenant_lease_id UUID REFERENCES tenant_leases(id) ON DELETE CASCADE, payment_month VARCHAR(7) NOT NULL, invoice_amount DECIMAL(10,2) NOT NULL, paid_amount DECIMAL(10,2) DEFAULT 0, payment_status VARCHAR(20) DEFAULT \'pending\', payment_date DATE, payment_method VARCHAR(50), payment_reference VARCHAR(100), notes TEXT, due_date DATE NOT NULL, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), UNIQUE(tenant_lease_id, payment_month));', 'info');
    addLog('7. Run this SQL for revenue history table:', 'info');
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

      // Check and create tenant management tables
      await checkAndCreateTenantsTable();
      await checkAndCreateTenantLeasesTable();
      await checkAndUpdateRoomsTable();

      // Check and create payment tracking table
      await checkAndCreatePaymentsTable();

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
          onClick={migrateTenantData}
          style={{...buttonStyle, backgroundColor: '#10b981', border: '1px solid #059669'}}
          disabled={setupStatus === 'running'}
        >
          {setupStatus === 'running' ? '🔄 Migrating...' : '🔄 Migrate Tenant Data'}
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
# PorLivingSpaces - ระบบจัดการห้องเช่า

A comprehensive rental property management system built with React + Vite and Supabase.

## 🏢 Features

### 📊 Dashboard & Analytics
- Real-time statistics (vacant rooms, occupied rooms, overdue payments)
- Monthly income tracking
- Outstanding rent monitoring
- Interactive data visualization

### 🏠 Room Management
- Multi-building support
- Tenant information management (name, address, phone, ID card)
- Rent price tracking
- Water & electricity meter readings
- Room status management (vacant/occupied)

### 💰 Billing System
- Automated bill generation
- Water & electricity usage calculation
- Payment tracking and history
- Overdue payment alerts
- Professional printable receipts

### 🏢 Building Management
- Add, edit, and delete buildings
- Building-specific room filtering
- Organized property portfolio

### 💾 Data Management
- Complete data export (JSON format)
- Data import and restoration
- Automated backups
- Data validation

### 🔐 Security Features
- Environment variables for sensitive data
- Secure Supabase integration
- Input validation and sanitization

### 📱 User Experience
- Responsive design (mobile-friendly)
- Modern Thai language interface
- Loading states and error handling
- Professional animations and transitions

## 🚀 Technology Stack

- **Frontend**: React 19, Vite 7
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **Date Handling**: date-fns
- **Testing**: Vitest, Testing Library
- **Code Quality**: ESLint

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/NuGuner/porlivingspaces.git
   cd porlivingspaces
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## 🧪 Testing

```bash
# Run tests
npm run test

# Run tests with UI
npm run test:ui
```

## 🛠️ Development

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 📊 Database Schema

### Buildings Table
- `id` (UUID, Primary Key)
- `name` (Text)

### Rooms Table
- `id` (UUID, Primary Key)
- `room_number` (Text)
- `building_id` (UUID, Foreign Key)
- `tenant_name` (Text)
- `tenant_address` (Text)
- `tenant_phone` (Text)
- `tenant_id_card` (Text)
- `rent_price` (BigInt)
- `water_meter` (Number)
- `electric_meter` (Number)
- `status` (Text: 'vacant' | 'occupied')
- `is_overdue` (Boolean)
- `current_bill` (JSON)
- `history` (JSON Array)

## 🎯 Key Components

### Core Components
- `App.jsx` - Main application with routing and state management
- `Dashboard.jsx` - Statistics and analytics display
- `RoomList.jsx` - Room management interface
- `BuildingManagement.jsx` - Building CRUD operations
- `DataManagement.jsx` - Export/import functionality

### UI Components
- `ErrorNotification.jsx` - Toast-style error messages
- `LoadingSpinner.jsx` - Loading states
- `BillReceipt.jsx` - Printable receipts

## 📋 Usage

1. **Adding Buildings**: Use the Building Management tab to create property buildings
2. **Managing Rooms**: Add rooms to buildings and manage tenant information
3. **Creating Bills**: Generate monthly bills based on meter readings
4. **Processing Payments**: Mark bills as paid and maintain payment history
5. **Data Backup**: Export data for backup and import when needed

## 🔧 Configuration

### Water & Electric Rates
Configure utility rates in `App.jsx`:
```javascript
const WATER_RATE_PER_UNIT = 15;
const ELECTRIC_RATE_PER_UNIT = 8;
```

### Supabase Setup
1. Create a new Supabase project
2. Run the SQL schema (see database schema above)
3. Configure Row Level Security (RLS) as needed
4. Update environment variables

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please open an issue in the GitHub repository or contact the development team.

---

Built with ❤️ for efficient rental property management

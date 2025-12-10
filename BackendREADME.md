# Backend Sistem Informasi SRE UNAND (SISORE)

Backend API untuk sistem informasi SRE UNAND dengan fitur pengelolaan kas, artikel, arsip dokumen, manajemen program kerja, dan manajemen pengguna.

## 🚀 Cara Menjalankan Aplikasi

### 1. Persiapan Database PostgreSQL

```bash
# Login ke PostgreSQL
psql -U postgres

# Buat database
CREATE DATABASE sre_unand;

# Keluar dari PostgreSQL
\q
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Buat file `.env` di root folder:

```env
NODE_ENV=development
PORT=5000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sre_unand
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production
JWT_EXPIRE=7d

# Upload
MAX_FILE_SIZE=5242880

# Base URL
BASE_URL=http://localhost:5000
```

### 4. Run Seeders

```bash
npm run seed
```

Seeder akan mengisi database dengan:
- 7 Divisi default
- 16 Sub-divisi
- Roles: ADMIN, MEMBER, HR, Secretary, Media, Finance
- Permissions untuk setiap module

### 5. Start Server

```bash
# Development mode (dengan nodemon)
npm run dev

# Production mode
npm start
```

Server akan berjalan di `http://localhost:5000`

### 6. Akses API Documentation

Buka browser dan akses: `http://localhost:5000/api-docs`

---

## 📋 Struktur Database & Roles

### Divisions (Divisi)
1. Media Development
2. Public Relation
3. Human Resource
4. Project
5. Education
6. Finance
7. Executive

### Default Roles
- **ADMIN**: Akses penuh ke semua fitur
- **MEMBER**: Anggota biasa (view kas sendiri, semua proker, dokumen PUBLIC)
- **HR**: Kelola pengguna
- **Secretary**: Kelola dokumen
- **Media**: Kelola artikel
- **Finance**: Kelola kas, verifikasi pembayaran

---

## 🔐 Authentication

### Register
```
POST /api/auth/register
Body: {
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "position": "STAFF",
  "division_id": 1,
  "sub_division_id": 1
}
```

### Login
```
POST /api/auth/login
Body: {
  "email": "john@example.com",
  "password": "password123"
}

Response: {
  "success": true,
  "data": {
    "user": {...},
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Get Current User
```
GET /api/auth/me
Headers: {
  "Authorization": "Bearer YOUR_TOKEN"
}
```

### Change Password
```
PUT /api/auth/change-password
Headers: { "Authorization": "Bearer YOUR_TOKEN" }
Body: {
  "oldPassword": "password123",
  "newPassword": "newpassword123"
}
```

---

## 👥 User Management (HR Role Required)

### Get All Users
```
GET /api/admin/users?page=1&limit=10&search=john&division_id=1&position=STAFF
Headers: { "Authorization": "Bearer YOUR_TOKEN" }
```

### Get Single User
```
GET /api/admin/users/:id
Headers: { "Authorization": "Bearer YOUR_TOKEN" }
```

### Create User
```
POST /api/admin/users
Headers: { "Authorization": "Bearer YOUR_TOKEN" }
Body: {
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "password123",
  "position": "MANAGER",
  "division_id": 2,
  "sub_division_id": 3,
  "roles": [2, 3]  // Array of role IDs
}
```

### Update User
```
PUT /api/admin/users/:id
Headers: { "Authorization": "Bearer YOUR_TOKEN" }
Body: {
  "name": "Jane Smith Updated",
  "position": "DIRECTOR",
  "roles": [3, 4]
}
```

### Delete User
```
DELETE /api/admin/users/:id
Headers: { "Authorization": "Bearer YOUR_TOKEN" }
```

### Bulk Upload Users (CSV)
```
POST /api/admin/users/bulk-upload
Headers: { 
  "Authorization": "Bearer YOUR_TOKEN",
  "Content-Type": "multipart/form-data"
}
Body (form-data): {
  "csv": [file]
}
```

Format CSV:
```csv
name,email,password,position,division_id,sub_division_id
John Doe,john@example.com,password123,STAFF,1,1
Jane Smith,jane@example.com,password123,MANAGER,2,3
```

### Download CSV Template
```
GET /api/admin/users/csv-template
Headers: { "Authorization": "Bearer YOUR_TOKEN" }
```

---

## 🏢 Divisions (All Authenticated Users)

### Get All Divisions with Members
```
GET /api/divisions
Headers: { "Authorization": "Bearer YOUR_TOKEN" }

Response: [
  {
    "id": 1,
    "name": "Media Development",
    "description": "...",
    "subDivisions": [...],
    "users": [...]
  }
]
```

### Get Single Division
```
GET /api/divisions/:id
Headers: { "Authorization": "Bearer YOUR_TOKEN" }
```

### Get Division Members
```
GET /api/divisions/:id/members
Headers: { "Authorization": "Bearer YOUR_TOKEN" }
```

---

## 📊 Work Programs (Program Kerja)

### Get All Work Programs
```
GET /api/work-programs?page=1&limit=10&division_id=1&status=ONGOING&search=training
Headers: { "Authorization": "Bearer YOUR_TOKEN" }

Status: PLANNED, ONGOING, COMPLETED, CANCELLED
```

### Get Single Work Program
```
GET /api/work-programs/:id
Headers: { "Authorization": "Bearer YOUR_TOKEN" }
```

### Get Work Programs by Division
```
GET /api/work-programs/division/:divisionId
Headers: { "Authorization": "Bearer YOUR_TOKEN" }
```

### Create Work Program (Director/Admin Only)
```
POST /api/work-programs
Headers: { "Authorization": "Bearer YOUR_TOKEN" }
Body: {
  "name": "Training Program 2024",
  "division_id": 1,
  "targets": ["Target 1", "Target 2"],
  "status": "PLANNED",
  "pic_ids": [1, 2, 3]  // Array of user IDs
}
```

### Update Work Program (Director/Admin Only)
```
PUT /api/work-programs/:id
Headers: { "Authorization": "Bearer YOUR_TOKEN" }
Body: {
  "name": "Updated Program Name",
  "targets": ["New Target"],
  "status": "ONGOING",
  "pic_ids": [2, 4]
}
```

### Delete Work Program (Director/Admin Only)
```
DELETE /api/work-programs/:id
Headers: { "Authorization": "Bearer YOUR_TOKEN" }
```

---

## 📄 Documents (Arsip Dokumen)

### Get All Documents
```
GET /api/documents?page=1&limit=10&search=proposal&access_level=PUBLIC
Headers: { "Authorization": "Bearer YOUR_TOKEN" }

Access Level: PUBLIC, BOARD, EXECUTIVE
```

### Get Single Document
```
GET /api/documents/:id
Headers: { "Authorization": "Bearer YOUR_TOKEN" }
```

### Upload Document (Secretary Role Required)
```
POST /api/documents
Headers: { 
  "Authorization": "Bearer YOUR_TOKEN",
  "Content-Type": "multipart/form-data"
}
Body (form-data): {
  "document": [file],
  "title": "Q3 Report 2024",
  "description": "Quarterly report",
  "access_level": "BOARD"
}

Allowed formats: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT
```

### Update Document Metadata (Secretary Role Required)
```
PUT /api/documents/:id
Headers: { "Authorization": "Bearer YOUR_TOKEN" }
Body: {
  "title": "Updated Title",
  "description": "Updated description",
  "access_level": "EXECUTIVE"
}
```

### Delete Document (Secretary Role Required)
```
DELETE /api/documents/:id
Headers: { "Authorization": "Bearer YOUR_TOKEN" }
```

### Download Document
```
GET /api/documents/:id/download
Headers: { "Authorization": "Bearer YOUR_TOKEN" }
```

**Document Access Control:**
- **PUBLIC**: Semua anggota bisa akses
- **BOARD**: Hanya Director dan Executive (P, VP, SEC)
- **EXECUTIVE**: Hanya President, Vice President, General Secretary

---

## 📰 Articles (Artikel - Public Access)

### PUBLIC ENDPOINTS (No Authentication Required)

#### Get Published Articles
```
GET /api/articles/published?page=1&limit=10&search=event
```

#### Get Single Published Article
```
GET /api/articles/published/:id
```

### ADMIN ENDPOINTS (Media Role Required)

#### Get All Articles (Including Drafts)
```
GET /api/articles/admin?page=1&limit=10&status=DRAFT&search=title
Headers: { "Authorization": "Bearer YOUR_TOKEN" }

Status: DRAFT, PUBLISHED, ARCHIVED
```

#### Get Single Article (For Editing)
```
GET /api/articles/admin/:id
Headers: { "Authorization": "Bearer YOUR_TOKEN" }
```

#### Create Article
```
POST /api/articles/admin
Headers: { 
  "Authorization": "Bearer YOUR_TOKEN",
  "Content-Type": "multipart/form-data"
}
Body (form-data): {
  "image": [file],
  "title": "Event Recap 2024",
  "content": "Full article content here...",
  "status": "DRAFT"
}
```

#### Update Article
```
PUT /api/articles/admin/:id
Headers: { 
  "Authorization": "Bearer YOUR_TOKEN",
  "Content-Type": "multipart/form-data"
}
Body (form-data): {
  "image": [file] (optional),
  "title": "Updated Title",
  "content": "Updated content",
  "status": "PUBLISHED"
}
```

#### Publish Article
```
PUT /api/articles/admin/:id/publish
Headers: { "Authorization": "Bearer YOUR_TOKEN" }
```

#### Delete Article
```
DELETE /api/articles/admin/:id
Headers: { "Authorization": "Bearer YOUR_TOKEN" }
```

---

## 💰 Cash Management (Pengelolaan Kas)

### PUBLIC ENDPOINTS (All Authenticated Users)

#### Get All Cash Periods
```
GET /api/cash/periods?is_active=true
Headers: { "Authorization": "Bearer YOUR_TOKEN" }
```

#### Get Single Period
```
GET /api/cash/periods/:id
Headers: { "Authorization": "Bearer YOUR_TOKEN" }
```

#### Get My Transactions
```
GET /api/cash/my-transactions?page=1&limit=10&status=COMPLETE&period_id=1
Headers: { "Authorization": "Bearer YOUR_TOKEN" }

Status: COMPLETE, PENDING, REJECTED
```

#### Submit Cash Payment
```
POST /api/cash/transactions
Headers: { 
  "Authorization": "Bearer YOUR_TOKEN",
  "Content-Type": "multipart/form-data"
}
Body (form-data): {
  "period_id": 1,
  "payment_method": "TRANSFER",
  "payment_date": "2024-01-15",
  "proof": [file]  // Required for TRANSFER, optional for CASH
}

Payment Method: CASH, TRANSFER
- CASH: Langsung COMPLETE
- TRANSFER: Status PENDING, butuh verifikasi Finance
```

**Perhitungan Denda:**
- Jika bayar sebelum/pada due_date: denda = 0
- Jika bayar setelah due_date: denda = jumlah_hari_telat × late_fee_per_day

### ADMIN ENDPOINTS (Finance Role Required)

#### Create Cash Period
```
POST /api/cash/admin/periods
Headers: { "Authorization": "Bearer YOUR_TOKEN" }
Body: {
  "name": "Kas Januari 2024",
  "amount": 50000,
  "late_fee_per_day": 5000,
  "due_date": "2024-01-31",
  "is_active": true
}
```

#### Update Cash Period
```
PUT /api/cash/admin/periods/:id
Headers: { "Authorization": "Bearer YOUR_TOKEN" }
Body: {
  "amount": 60000,
  "late_fee_per_day": 7000,
  "is_active": false
}
```

#### Delete Cash Period
```
DELETE /api/cash/admin/periods/:id
Headers: { "Authorization": "Bearer YOUR_TOKEN" }
```

#### Get All Transactions
```
GET /api/cash/admin/transactions?page=1&limit=10&status=PENDING&period_id=1&user_id=5
Headers: { "Authorization": "Bearer YOUR_TOKEN" }
```

#### Verify Transaction
```
PUT /api/cash/admin/transactions/:id/verify
Headers: { "Authorization": "Bearer YOUR_TOKEN" }
Body: {
  "status": "COMPLETE"  // or "REJECTED"
}
```

#### Get Payment Statistics
```
GET /api/cash/admin/statistics?period_id=1
Headers: { "Authorization": "Bearer YOUR_TOKEN" }

Response: {
  "period": {...},
  "statistics": {
    "total_members": 50,
    "paid_count": 35,
    "pending_count": 5,
    "unpaid_count": 10,
    "total_collected": 1750000,
    "total_fines": 50000,
    "payment_rate": "70.00%"
  }
}
```

---

## 🔒 Permission System

### Modules & Permissions

| Module | Permissions | Roles |
|--------|------------|-------|
| Users | users.view, users.manage | HR, ADMIN |
| Divisions | divisions.view, divisions.manage | All (view), ADMIN (manage) |
| Work Programs | work_programs.view, work_programs.manage | All (view), Directors + ADMIN (manage) |
| Documents | documents.view, documents.manage | Based on access_level, Secretary + ADMIN (manage) |
| Articles | articles.view, articles.manage | Public (view published), Media + ADMIN (manage) |
| Cash | cash.view_own, cash.submit, cash.manage | All (view own + submit), Finance + ADMIN (manage) |

---

## 🎯 Frontend Development Guide

### Base URL
```javascript
const API_BASE_URL = 'http://localhost:5000/api';
```

### Authentication Header
```javascript
const config = {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
};
```

### File Upload Header
```javascript
const formData = new FormData();
formData.append('file', file);

const config = {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'multipart/form-data'
  }
};
```

### Example: Login & Store Token
```javascript
async function login(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  
  if (data.success) {
    localStorage.setItem('token', data.data.token);
    localStorage.setItem('user', JSON.stringify(data.data.user));
  }
  
  return data;
}
```

### Example: Get Articles (Public)
```javascript
async function getPublishedArticles(page = 1) {
  const response = await fetch(
    `${API_BASE_URL}/articles/published?page=${page}&limit=10`
  );
  return await response.json();
}
```

### Example: Submit Cash Payment
```javascript
async function submitPayment(periodId, paymentMethod, paymentDate, proofFile) {
  const formData = new FormData();
  formData.append('period_id', periodId);
  formData.append('payment_method', paymentMethod);
  formData.append('payment_date', paymentDate);
  
  if (proofFile) {
    formData.append('proof', proofFile);
  }
  
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/cash/transactions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  
  return await response.json();
}
```

---

## 📝 Notes Penting

1. **Artikel Public Access**: Endpoint `/api/articles/published/*` bisa diakses tanpa authentication untuk public viewing
2. **Article Admin**: Endpoint `/api/articles/admin/*` memerlukan role Media
3. **Work Program**: Hanya Director divisi terkait atau ADMIN yang bisa create/update/delete
4. **Document Access**: Difilter otomatis berdasarkan position user
5. **Cash Auto Calculation**: Denda dihitung otomatis berdasarkan keterlambatan
6. **File Upload**: Max 5MB per file
7. **CSV Upload**: Email harus unique, format harus sesuai template

---

## 🐛 Troubleshooting

### Database Connection Error
```bash
# Pastikan PostgreSQL running
sudo service postgresql status

# Cek credentials di .env
```

### Upload Error
```bash
# Pastikan folder uploads ada
mkdir -p uploads/documents uploads/proofs uploads/articles
```

### Permission Denied
```bash
# Pastikan user punya role yang sesuai
# Cek JWT token masih valid
```
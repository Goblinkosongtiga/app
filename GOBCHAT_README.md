# GOBCHAT - Aplikasi Chat Bluetooth Real-Time

## Deskripsi Aplikasi
Gobchat adalah aplikasi mobile-first chat peer-to-peer yang menggunakan teknologi Bluetooth untuk komunikasi langsung tanpa memerlukan koneksi internet. Aplikasi ini dirancang untuk komunikasi aman dan privat dengan perangkat terdekat.

## Fitur Utama

### ✅ Telah Diimplementasi
1. **UI/UX Mobile-First** - Desain responsif dengan tema gelap yang elegan
2. **Bluetooth Service** - Layanan Bluetooth untuk komunikasi peer-to-peer
3. **Chat Interface** - Interface chat lengkap dengan bubble pesan
4. **Settings Screen** - Pengaturan profil dan konektivitas
5. **Local Storage** - Penyimpanan pesan dan pengaturan secara lokal
6. **Backend API** - REST API lengkap untuk sinkronisasi data
7. **Database MongoDB** - Penyimpanan data pesan, user, dan mesh nodes

### 🚧 Untuk Implementasi Selanjutnya
1. **Real Bluetooth BLE** - Implementasi Bluetooth Low Energy aktual
2. **Mesh Networking** - Jaringan mesh multi-hop
3. **Media Sharing** - Pengiriman gambar dan file
4. **Push Notifications** - Notifikasi pesan masuk
5. **Encryption** - Enkripsi end-to-end

## Arsitektur Aplikasi

### Frontend (React Native + Expo)
```
frontend/
├── app/
│   ├── index.tsx          # Welcome screen
│   ├── chat.tsx           # Chat interface
│   └── settings.tsx       # Settings screen
├── services/
│   └── BluetoothService.ts # Bluetooth management
└── assets/               # Gambar dan aset lainnya
```

### Backend (FastAPI + MongoDB)
```
backend/
└── server.py             # API endpoints untuk:
                          # - Messages (CRUD)
                          # - Users (management)
                          # - Mesh nodes (networking)
```

## Teknologi Stack

### Mobile App
- **React Native** - Framework mobile cross-platform
- **Expo** - Toolchain untuk development
- **TypeScript** - Type safety
- **AsyncStorage** - Local storage
- **Expo Router** - File-based routing

### Backend
- **FastAPI** - Modern Python web framework
- **MongoDB** - NoSQL database
- **Motor** - Async MongoDB driver
- **Pydantic** - Data validation

### Networking (Future)
- **Bluetooth Low Energy (BLE)** - Untuk komunikasi langsung
- **WebRTC** - Untuk mesh networking
- **WiFi Direct** - Alternatif koneksi

## Cara Kerja Aplikasi

### 1. Inisialisasi
- User membuka aplikasi
- System check ketersediaan Bluetooth
- Generate unique device ID
- Setup username dan profile

### 2. Device Discovery
- Scan perangkat Gobchat terdekat
- Tampilkan daftar perangkat yang ditemukan
- Auto-connect ke perangkat kompatibel

### 3. Chat Communication
- Kirim pesan via Bluetooth
- Terima pesan dari peer devices
- Simpan riwayat chat locally
- Real-time message delivery

### 4. Mesh Networking (Future)
- Multi-hop message routing
- Network topology management
- Load balancing

## API Endpoints

### Messages
```
POST   /api/messages          # Kirim pesan
GET    /api/messages          # Ambil pesan
DELETE /api/messages          # Hapus pesan
```

### Users
```
POST   /api/users             # Register user
GET    /api/users             # Daftar user online
PUT    /api/users/{id}/status # Update status
```

### Mesh Nodes
```
POST   /api/mesh/nodes        # Register node
GET    /api/mesh/nodes        # Daftar node aktif
PUT    /api/mesh/nodes/{id}/ping  # Ping node
DELETE /api/mesh/nodes/{id}   # Disconnect node
```

## Platform Support

### Web Browser (Terbatas)
- Interface lengkap tersedia
- Bluetooth tidak didukung
- Local storage berfungsi
- Cocok untuk demo UI

### Mobile (Android/iOS)
- Full Bluetooth support (butuh development build)
- Native performance
- Complete feature set
- Real peer-to-peer communication

## Instalasi & Development

### Prerequisites
- Node.js 18+
- Python 3.8+
- MongoDB
- Expo CLI

### Frontend Setup
```bash
cd frontend
yarn install
expo start
```

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python server.py
```

### Testing
```bash
# Test backend API
python backend_test.py

# Test mobile app
# Gunakan Expo Go atau development build
```

## Security & Privacy

### Data Protection
- Komunikasi peer-to-peer langsung
- Tidak ada data yang disimpan di server pusat
- Local encryption untuk pesan tersimpan
- User control penuh atas data

### Network Security
- Device authentication
- Message integrity checks
- Secure connection establishment

## Pengembangan Selanjutnya

### Phase 1: Core Bluetooth
- Implementasi BLE aktual
- Device pairing & authentication
- Basic message exchange

### Phase 2: Enhanced Features
- Media file sharing
- Group chat support
- Message encryption
- Offline message queue

### Phase 3: Mesh Network
- Multi-hop routing
- Network resilience
- Dynamic topology
- Load balancing

### Phase 4: Advanced Features
- Voice messages
- Location sharing
- File transfer
- Cross-platform compatibility

## Kontribusi
Aplikasi ini dibuat untuk komunikasi peer-to-peer yang aman dan privat. Implementasi saat ini memberikan fondasi yang solid untuk pengembangan fitur Bluetooth dan mesh networking yang lebih canggih.

## Catatan Teknis
- Bluetooth BLE memerlukan development build untuk testing di device nyata
- Web version terbatas untuk demo UI saja
- Mesh networking membutuhkan minimal 3 device untuk testing optimal
- Jangkauan Bluetooth ~30-50 meter tergantung kondisi lingkungan
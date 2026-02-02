# AgriSmart Backend API

A secure, scalable Node.js + Express backend for the AgriSmart agricultural platform.

## 🚀 Features

- **Authentication**: JWT-based auth with OTP verification
- **Crop Recommendation**: AI-powered crop suggestions based on soil and climate data
- **Disease Detection**: Plant disease identification from images
- **Weather Data**: Real-time weather information and forecasts
- **Market Prices**: Agricultural commodity prices and trends
- **Chatbot**: AI agricultural assistant
- **User Management**: Profile and settings management

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB 5.0+
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration:
   - Set `MONGODB_URI` to your MongoDB connection string
   - Update `JWT_SECRET` with a secure random string
   - Configure other settings as needed

4. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── index.js          # Configuration module
│   │   └── database.js       # MongoDB connection
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── crop.controller.js
│   │   ├── disease.controller.js
│   │   ├── weather.controller.js
│   │   ├── market.controller.js
│   │   ├── chatbot.controller.js
│   │   ├── profile.controller.js
│   │   └── settings.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── errorHandler.js
│   │   └── notFound.js
│   ├── models/
│   │   ├── User.js
│   │   └── History.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── crop.routes.js
│   │   ├── disease.routes.js
│   │   ├── weather.routes.js
│   │   ├── market.routes.js
│   │   ├── chatbot.routes.js
│   │   ├── profile.routes.js
│   │   └── settings.routes.js
│   ├── utils/
│   │   ├── logger.js
│   │   ├── response.js
│   │   └── validators.js
│   └── server.js             # Entry point
├── uploads/
│   ├── avatars/              # User avatars
│   └── diseases/             # Disease detection images
├── logs/                     # Application logs
├── .env.example
├── package.json
└── README.md
```

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/send-otp` | Send OTP |
| POST | `/api/auth/verify-otp` | Verify OTP |
| POST | `/api/auth/refresh-token` | Refresh JWT token |
| POST | `/api/auth/logout` | User logout |
| GET | `/api/auth/me` | Get current user |

### Crop Recommendation
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/crop-recommendation` | Get crop recommendations |
| GET | `/api/crop-recommendation/history` | Get recommendation history |
| GET | `/api/crop-recommendation/details/:crop` | Get crop details |
| GET | `/api/crop-recommendation/list` | List all crops |

### Disease Detection
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/disease-detection` | Detect disease from image |
| GET | `/api/disease-detection/history` | Get detection history |
| GET | `/api/disease-detection/details/:disease` | Get disease details |
| GET | `/api/disease-detection/list` | List all diseases |

### Weather
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/weather` | Get current weather |
| GET | `/api/weather/forecast` | Get weather forecast |
| GET | `/api/weather/history` | Get historical data |
| GET | `/api/weather/alerts` | Get weather alerts |

### Market Prices
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/market-prices` | Get market prices |
| GET | `/api/market-prices/trends/:crop` | Get price trends |
| GET | `/api/market-prices/nearby` | Get nearby markets |
| GET | `/api/market-prices/market/:id` | Get market details |

### Chatbot
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chatbot` | Send message |
| GET | `/api/chatbot/history` | Get chat history |
| DELETE | `/api/chatbot/history` | Clear history |
| GET | `/api/chatbot/suggestions` | Get suggestions |

### Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profile` | Get user profile |
| PUT | `/api/profile` | Update profile |
| POST | `/api/profile/avatar` | Upload avatar |
| DELETE | `/api/profile/avatar` | Delete avatar |
| PUT | `/api/profile/farm` | Update farm details |
| PUT | `/api/profile/password` | Change password |
| DELETE | `/api/profile` | Delete account |

### Settings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/settings` | Get settings |
| PUT | `/api/settings` | Update settings |
| PUT | `/api/settings/notifications` | Update notifications |
| PUT | `/api/settings/language` | Update language |
| PUT | `/api/settings/theme` | Update theme |
| POST | `/api/settings/reset` | Reset settings |

## 🔒 Security Features

- **Helmet.js**: Security headers
- **CORS**: Configurable cross-origin resource sharing
- **Rate Limiting**: Prevents brute force attacks
- **JWT**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Input Validation**: express-validator
- **XSS Protection**: Sanitized inputs

## 🧪 Demo Mode

The backend includes demo/mock data for development without MongoDB:
- Weather data is simulated
- Market prices are generated
- Crop recommendations use built-in algorithm
- Disease detection uses random selection (replace with ML model in production)

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment | development |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/agrismart |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRES_IN` | Token expiry | 7d |
| `JWT_REFRESH_SECRET` | Refresh token secret | - |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry | 30d |
| `CORS_ORIGIN` | Allowed origins | * |
| `RATE_LIMIT_WINDOW` | Rate limit window (ms) | 900000 |
| `RATE_LIMIT_MAX` | Max requests per window | 100 |

## 🚀 Deployment

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Use strong, unique secrets
- [ ] Enable HTTPS
- [ ] Configure proper CORS origins
- [ ] Set up MongoDB with authentication
- [ ] Configure rate limiting for production load
- [ ] Set up monitoring and logging
- [ ] Enable compression
- [ ] Use PM2 or similar process manager

### Docker
```bash
# Build image
docker build -t agrismart-backend .

# Run container
docker run -p 5000:5000 --env-file .env agrismart-backend
```

## 📄 License

MIT License - see LICENSE file for details.

## 👥 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

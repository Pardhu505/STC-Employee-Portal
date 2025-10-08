# Enhanced Internal Communication System Backend

## Overview

This is a comprehensive, production-ready backend system for internal employee communication with advanced features including real-time messaging, file sharing, monitoring, security, and analytics.

## Features

### 🚀 Core Features
- **Real-time WebSocket Communication**: Bidirectional messaging with fallback support
- **Multi-channel Support**: Direct messages, group channels, and department channels
- **File Upload & Sharing**: Secure file handling with metadata tracking
- **Message Reactions**: Emoji reactions and interaction tracking
- **Message History**: Persistent message storage with search capabilities
- **User Management**: Comprehensive user profiles and role management

### 🔒 Security & Monitoring
- **Advanced Detection System**: Real-time threat detection and anomaly monitoring
- **Structured Logging**: Multiple log levels with JSON formatting and rotation
- **Rate Limiting**: Configurable rate limiting to prevent abuse
- **Audit Trails**: Complete audit logging for compliance
- **Security Headers**: Comprehensive security headers and middleware

### 📊 Analytics & Reporting
- **Performance Monitoring**: Real-time system health and performance metrics
- **User Activity Tracking**: Detailed user behavior analytics
- **Connection Statistics**: WebSocket connection monitoring
- **Error Tracking**: Comprehensive error logging and alerting

### 🗄️ Database & Storage
- **Enhanced Schema**: Comprehensive data models with relationships
- **Multiple Database Support**: MongoDB with SQLAlchemy integration
- **Configuration Management**: Centralized configuration with validation
- **Data Validation**: Pydantic models with comprehensive validation

## Architecture

```
backend/
├── enhanced_server.py      # Main application server
├── detection.py           # Security and monitoring system
├── logging_config.py      # Advanced logging configuration
├── database_schema.py     # Enhanced data models
├── config_manager.py      # Configuration management
├── requirements.txt       # Python dependencies
├── config/               # Configuration files
├── logs/                 # Log files
└── uploads/              # File uploads
```

## Installation

### Prerequisites
- Python 3.8+
- MongoDB (local or Atlas)
- Redis (optional, for caching)

### Setup

1. **Clone and navigate to the backend directory:**
   ```bash
   cd showtime_employee_portal-main/backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Initialize database:**
   ```bash
   python -c "from database_schema import database_manager; database_manager.create_tables()"
   ```

6. **Run the server:**
   ```bash
   python enhanced_server.py
   ```

## Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Database Configuration
MONGO_URL=mongodb://localhost:27017
DB_NAME=internal_communication
ATTENDANCE_DB_URL=mongodb+srv://username:password@cluster.mongodb.net/

# Security Configuration
SECRET_KEY=your-secret-key-here
SESSION_TIMEOUT=3600
MAX_LOGIN_ATTEMPTS=5

# Server Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=True

# WebSocket Configuration
WS_HOST=localhost
WS_PORT=8001
WS_MAX_CONNECTIONS=1000

# File Upload Configuration
MAX_FILE_SIZE=10485760
ALLOWED_EXTENSIONS=jpg,jpeg,png,pdf,doc,docx,txt
UPLOAD_PATH=uploads/

# Logging Configuration
LOG_LEVEL=INFO
LOG_DIR=logs/

# Rate Limiting
RATE_LIMITING_ENABLED=True
MESSAGES_PER_MINUTE=60
FILE_UPLOADS_PER_HOUR=50

# Monitoring
MONITORING_ENABLED=True
METRICS_ENABLED=True
HEALTH_CHECK_INTERVAL=30
```

### Configuration Files

The system supports multiple configuration sources (in order of priority):
1. Environment variables
2. YAML files (`config/config.yaml`)
3. JSON files (`config/config.json`)
4. Default values

## API Documentation

### Health Check
```http
GET /api/v2/health
```

### WebSocket Connection
```javascript
const ws = new WebSocket('ws://localhost:8000/api/v2/ws/{user_id}');
```

### Send Message
```http
POST /api/v2/messages
Content-Type: application/json

{
  "sender_id": "user@example.com",
  "sender_name": "John Doe",
  "content": "Hello, world!",
  "recipient_id": "recipient@example.com",
  "message_type": "personal_message"
}
```

### Get Messages
```http
GET /api/v2/messages?recipient_id=user@example.com&limit=50
```

## WebSocket Message Types

### Client to Server

#### Regular Message
```json
{
  "type": "personal_message",
  "content": "Hello!",
  "recipient_id": "user@example.com",
  "sender_name": "John Doe"
}
```

#### Channel Message
```json
{
  "type": "chat_message",
  "content": "Hello channel!",
  "channel_id": "general",
  "sender_name": "John Doe"
}
```

#### File Upload
```json
{
  "type": "file_upload",
  "file_name": "document.pdf",
  "file_type": "application/pdf",
  "file_size": 1024000,
  "file_url": "/uploads/document.pdf",
  "recipient_id": "user@example.com"
}
```

#### Reaction Update
```json
{
  "type": "reaction_update",
  "message_id": "message-uuid",
  "reaction_type": "👍",
  "action": "add"
}
```

### Server to Client

#### Message Delivery
```json
{
  "type": "personal_message",
  "id": "message-uuid",
  "sender_id": "user@example.com",
  "sender_name": "John Doe",
  "content": "Hello!",
  "timestamp": "2024-01-01T10:00:00+05:30"
}
```

#### Status Update
```json
{
  "type": "status_update",
  "user_id": "user@example.com",
  "status": "online"
}
```

#### Error Message
```json
{
  "type": "error",
  "message": "Invalid message format"
}
```

## Monitoring & Analytics

### Health Metrics
- Database connection status
- Active WebSocket connections
- Message throughput
- System performance metrics
- Error rates

### Security Monitoring
- Suspicious activity detection
- Rate limit violations
- Authentication failures
- Unusual connection patterns

### Performance Monitoring
- Request/response times
- Database query performance
- Memory and CPU usage
- Connection pool statistics

## Security Features

### Authentication
- JWT token-based authentication
- Session management
- Secure password handling

### Authorization
- Role-based access control
- Channel membership validation
- Message access control

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection

### Monitoring
- Real-time threat detection
- Anomaly detection
- Audit logging
- Security event correlation

## Development

### Code Structure
- **Modular Design**: Each feature is in its own module
- **Type Hints**: Full type annotation support
- **Async/Await**: Modern async programming patterns
- **Error Handling**: Comprehensive error handling and logging

### Testing
```bash
# Run tests
pytest

# Run with coverage
pytest --cov=. --cov-report=html

# Run linting
flake8 .
black .
isort .
```

### Logging
The system provides multiple logging levels:
- **DEBUG**: Detailed debugging information
- **INFO**: General information about system operation
- **WARNING**: Warning messages for potential issues
- **ERROR**: Error conditions
- **CRITICAL**: Critical system errors

Logs are written to:
- Console (formatted text)
- `logs/main.log` (rotating file)
- `logs/main.json` (structured JSON)
- `logs/security.log` (security events)
- `logs/audit.log` (audit trail)

## Deployment

### Docker
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["python", "enhanced_server.py"]
```

### Production Considerations
- Use a production WSGI server (Gunicorn, uWSGI)
- Enable HTTPS with SSL certificates
- Configure reverse proxy (Nginx, Apache)
- Set up monitoring and alerting
- Implement backup strategies
- Configure log aggregation

### Scaling
- Use Redis for session storage
- Implement database read replicas
- Use CDN for file uploads
- Configure horizontal scaling
- Implement caching strategies

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Check MongoDB connection string
   - Verify network connectivity
   - Check authentication credentials

2. **WebSocket Connection Issues**
   - Verify WebSocket URL and port
   - Check CORS configuration
   - Review firewall settings

3. **File Upload Issues**
   - Check upload directory permissions
   - Verify file size limits
   - Check allowed file types

4. **Performance Issues**
   - Monitor system resources
   - Check database performance
   - Review connection pool settings

### Debug Mode
Enable debug logging by setting:
```env
LOG_LEVEL=DEBUG
DEBUG=True
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Run the test suite
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation
- Monitor system logs

## Changelog

### Version 2.0.0
- Complete backend rebuild with enhanced features
- Advanced security and monitoring
- Comprehensive logging and analytics
- Improved database schema
- Configuration management system
- Real-time performance monitoring

---

**Note**: This is a production-ready system designed for enterprise use. Ensure proper security measures are in place before deployment.

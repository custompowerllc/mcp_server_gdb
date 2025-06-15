# MCP GDB Node.js Real-Time Debugging Bridge

This Node.js application provides a real-time web-based debugging interface for the MCP GDB Server, specifically optimized for STM32 microcontroller debugging.

## Features

- **Real-Time Web Dashboard**: Interactive debugging interface accessible via web browser
- **WebSocket Communication**: Live updates without page refresh
- **Variable Monitoring**: Real-time variable value tracking during debugging
- **Register Visualization**: Live ARM Cortex-M register display
- **Interactive Controls**: Web-based debugging controls (continue, step, stop)
- **Breakpoint Management**: Set and manage breakpoints through web interface
- **Session Management**: Create and manage multiple debugging sessions
- **Live Logging**: Real-time log streaming with filtering capabilities

## Architecture

```
┌─────────────────┐    HTTP/WS     ┌──────────────────┐    MCP Protocol    ┌─────────────────┐
│   Web Browser   │ ◄─────────────► │   Node.js Bridge │ ◄─────────────────► │  Rust MCP Server │
│   (Dashboard)   │                │                  │                    │   (GDB/MI)      │
└─────────────────┘                └──────────────────┘                    └─────────────────┘
                                           │
                                           ▼
                                    ┌──────────────────┐
                                    │   Event Manager  │
                                    │  (State Tracking)│
                                    └──────────────────┘
```

## Installation

### Prerequisites

- Node.js 16.0.0 or higher
- npm 8.0.0 or higher
- Running MCP GDB Rust server

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure the application:**
   Edit `config/default.json` to match your setup:
   ```json
   {
     "server": {
       "port": 3000,
       "host": "127.0.0.1"
     },
     "mcp": {
       "rust_server": {
         "host": "127.0.0.1",
         "port": 8080,
         "protocol": "http"
       }
     }
   }
   ```

3. **Start the application:**
   ```bash
   npm start
   ```

4. **Access the dashboard:**
   Open your browser to `http://localhost:3000`

## Usage

### Starting the Complete System

Use the provided startup script from the project root:
```bash
./scripts/start-with-nodejs.sh
```

This will start both the Rust MCP server and Node.js bridge automatically.

### Manual Startup

1. **Start the Rust MCP server:**
   ```bash
   # From project root
   ./target/release/mcp-server-gdb --transport sse
   ```

2. **Start the Node.js bridge:**
   ```bash
   # From nodejs directory
   npm start
   ```

### Dashboard Usage

1. **Connect to Dashboard**: Open `http://localhost:3000` in your browser
2. **Create Session**: Click "New Session" and provide:
   - Program path (.elf file)
   - GDB path (arm-none-eabi-gdb)
   - Session name
3. **Set Breakpoints**: Use the "Add Breakpoint" button to set breakpoints
4. **Debug Controls**: Use Continue, Step, Stop buttons to control execution
5. **Monitor Data**: Watch variables and registers update in real-time
6. **View Logs**: Monitor debug messages in the logs panel

## API Endpoints

### HTTP API

- `GET /health` - Health check
- `GET /api/sessions` - Get all debugging sessions
- `POST /api/sessions` - Create new debugging session
- `GET /api/sessions/:id/variables` - Get session variables
- `GET /api/sessions/:id/registers` - Get session registers

### WebSocket Events

#### Client → Server
- `subscribe` - Subscribe to event types
- `debug_command` - Execute debugging command
- `get_sessions` - Request session list
- `get_variables` - Request variable data
- `set_breakpoint` - Set breakpoint

#### Server → Client
- `session_created` - New session created
- `breakpoint_hit` - Breakpoint was hit
- `variable_changed` - Variable values updated
- `execution_stopped` - Execution stopped
- `log_message` - New log message

## Configuration

### Environment Variables

- `PORT` - HTTP server port (default: 3000)
- `HOST` - Server host (default: 127.0.0.1)
- `NODE_ENV` - Environment (development/production)

### Configuration File

Edit `config/default.json`:

```json
{
  "server": {
    "port": 3000,
    "host": "127.0.0.1"
  },
  "websocket": {
    "port": 3001,
    "path": "/ws"
  },
  "mcp": {
    "rust_server": {
      "host": "127.0.0.1",
      "port": 8080,
      "protocol": "http"
    },
    "bridge": {
      "reconnect_interval": 5000,
      "max_reconnect_attempts": 10,
      "timeout": 30000
    }
  },
  "debugging": {
    "auto_refresh_interval": 1000,
    "variable_update_interval": 500
  }
}
```

## Development

### Scripts

- `npm start` - Start the server
- `npm run dev` - Start with nodemon (auto-restart)
- `npm test` - Run tests
- `npm run lint` - Run ESLint

### Project Structure

```
nodejs/
├── src/
│   ├── server.js           # Main Express server
│   ├── websocket-server.js # WebSocket handling
│   ├── mcp-bridge.js       # MCP server interface
│   └── event-manager.js    # Event management
├── public/
│   ├── index.html          # Dashboard HTML
│   ├── css/
│   │   └── dashboard.css   # Dashboard styles
│   └── js/
│       └── dashboard.js    # Dashboard JavaScript
├── config/
│   └── default.json        # Configuration
└── package.json            # Dependencies
```

## Troubleshooting

### Common Issues

1. **Connection Failed**: Ensure Rust MCP server is running on correct port
2. **WebSocket Errors**: Check firewall settings and port availability
3. **Dashboard Not Loading**: Verify Node.js server is running and accessible
4. **Real-time Updates Not Working**: Check WebSocket connection in browser console

### Debug Mode

Enable debug logging:
```bash
DEBUG=* npm start
```

### Logs

Check log files:
- `../logs/nodejs-bridge.log` - Node.js application logs
- `../logs/rust-server.log` - Rust MCP server logs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see the main project LICENSE file.

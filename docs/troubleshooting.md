# Troubleshooting Guide

## 🚨 Critical Known Issues

### MCP Core Bug (Current Major Issue)

**Problem**: `tools/list` and `tools/call` fail with "Client must be initialized" error despite successful MCP handshake.

**Symptoms**:
- ✅ SSE connection establishes successfully
- ✅ MCP initialize handshake completes
- ✅ MCP initialized notification accepted
- ❌ `tools/list` returns "Client must be initialized before using tools/list"
- ❌ `tools/call` returns "Client must be initialized before using tools/call"

**Root Cause**: Bug in `mcp-core` crate v0.1 - server doesn't track client initialization state properly.

**Status**: 🔄 Custom protocol workaround in development

**Workaround**: Use custom protocol implementation (available in v0.5.0+)

**Test Script**: Run `nodejs/test-direct-tools.js` to verify the issue

---

## Connection Issues

### SSE Connection Fails

**Problem**: Cannot establish SSE connection to Rust server

**Symptoms**:
```
Error: connect ECONNREFUSED 127.0.0.1:8081
```

**Solutions**:
1. **Check if server is running**:
   ```bash
   # Windows
   $env:SERVER_PORT="8081"; ./target/debug/mcp-server-gdb.exe --log-level debug sse
   
   # Linux/macOS
   SERVER_PORT=8081 ./target/debug/mcp-server-gdb --log-level debug sse
   ```

2. **Verify port configuration**:
   ```bash
   curl http://127.0.0.1:8081/sse
   ```

3. **Check for port conflicts**:
   ```bash
   # Windows
   netstat -an | findstr :8081
   
   # Linux/macOS
   lsof -i :8081
   ```

### Wrong Port Configuration

**Problem**: Server starts on different port than expected

**Symptoms**:
- Server logs show different port
- Client connection fails

**Solutions**:
1. **Set environment variable**:
   ```bash
   # Windows PowerShell
   $env:SERVER_PORT="8081"
   
   # Linux/macOS
   export SERVER_PORT=8081
   ```

2. **Verify server startup logs**:
   ```
   [INFO] Starting SSE server on 127.0.0.1:8081
   ```

### EventSource Package Issues (Node.js)

**Problem**: EventSource import fails in Node.js

**Symptoms**:
```javascript
TypeError: EventSource is not a constructor
```

**Solution**: Use correct import syntax:
```javascript
// Wrong:
const EventSource = require('eventsource');

// Correct:
const { EventSource } = require('eventsource');
```

---

## MCP Protocol Issues

### Initialize Handshake Fails

**Problem**: MCP initialize request fails

**Symptoms**:
```json
{
  "error": {
    "code": -32600,
    "message": "Invalid Request"
  }
}
```

**Solutions**:
1. **Check JSON-RPC format**:
   ```json
   {
     "jsonrpc": "2.0",
     "id": 1,
     "method": "initialize",
     "params": {
       "protocolVersion": "2024-11-05",
       "capabilities": {},
       "clientInfo": {
         "name": "nodejs-client",
         "version": "1.0.0"
       }
     }
   }
   ```

2. **Verify headers**:
   ```javascript
   headers: {
     'Content-Type': 'application/json',
     'X-Session-Id': sessionId
   }
   ```

### Session ID Issues

**Problem**: Session ID not properly extracted or used

**Symptoms**:
- 400 Bad Request errors
- Session not found errors

**Solutions**:
1. **Extract session ID from SSE endpoint event**:
   ```javascript
   eventSource.addEventListener('endpoint', (event) => {
     const data = JSON.parse(event.data);
     const url = new URL(data.uri, baseUrl);
     const sessionId = url.searchParams.get('sessionId');
   });
   ```

2. **Include session ID in all requests**:
   ```javascript
   headers: {
     'X-Session-Id': sessionId
   }
   ```

---

## GDB and STM32 Issues

### arm-none-eabi-gdb Not Found

**Problem**: GDB executable not found

**Symptoms**:
```
Error: Failed to start GDB process: arm-none-eabi-gdb: command not found
```

**Solutions**:
1. **Install ARM GCC toolchain**:
   ```bash
   # macOS
   brew install --cask gcc-arm-embedded
   
   # Ubuntu/Debian
   sudo apt-get install gcc-arm-none-eabi gdb-arm-none-eabi
   
   # Windows
   # Download from: https://developer.arm.com/tools-and-software/open-source-software/developer-tools/gnu-toolchain/gnu-rm
   ```

2. **Verify installation**:
   ```bash
   arm-none-eabi-gdb --version
   ```

3. **Add to PATH** if necessary

### OpenOCD Connection Issues

**Problem**: Cannot connect to STM32 target

**Symptoms**:
```
Error: Failed to connect to target
```

**Solutions**:
1. **Start OpenOCD server**:
   ```bash
   # For STM32F4 with ST-Link V2
   openocd -f interface/stlink-v2.cfg -f target/stm32f4x.cfg
   ```

2. **Check debug probe connection**:
   - Verify USB connection
   - Check device manager (Windows) or lsusb (Linux)
   - Ensure proper drivers installed

3. **Verify target power**:
   - Check target board power
   - Verify SWDIO/SWCLK connections

---

## Node.js Integration Issues

### Package Dependencies

**Problem**: Missing Node.js dependencies

**Symptoms**:
```
Error: Cannot find module 'eventsource'
```

**Solutions**:
1. **Install dependencies**:
   ```bash
   cd nodejs
   npm install
   ```

2. **Verify package.json**:
   ```json
   {
     "dependencies": {
       "eventsource": "^2.0.2",
       "express": "^4.18.2",
       "socket.io": "^4.7.2"
     }
   }
   ```

### WebSocket Connection Issues

**Problem**: WebSocket connection fails

**Symptoms**:
- Dashboard shows "Disconnected"
- No real-time updates

**Solutions**:
1. **Check WebSocket server**:
   ```bash
   # Verify WebSocket server is running on port 3001
   curl http://localhost:3001/socket.io/
   ```

2. **Check firewall settings**:
   - Allow ports 3000 (HTTP) and 3001 (WebSocket)

---

## Performance Issues

### Slow Tool Execution

**Problem**: GDB tools take too long to execute

**Symptoms**:
- Timeouts on tool calls
- Slow response times

**Solutions**:
1. **Increase timeout**:
   ```bash
   export GDB_COMMAND_TIMEOUT=60
   ```

2. **Check target responsiveness**:
   - Verify debug probe connection quality
   - Check for target firmware issues

### Memory Usage

**Problem**: High memory usage

**Solutions**:
1. **Monitor sessions**:
   ```bash
   # Check active sessions
   curl http://localhost:3000/api/sessions
   ```

2. **Close unused sessions**:
   ```javascript
   await client.closeSession(sessionId);
   ```

---

## Debugging Tools

### Test Scripts

1. **Basic SSE Connection Test**:
   ```bash
   curl http://127.0.0.1:8081/sse
   ```

2. **MCP Protocol Test**:
   ```bash
   cd nodejs
   node test-mcp.js
   ```

3. **Direct Tools Test**:
   ```bash
   cd nodejs
   node test-direct-tools.js
   ```

4. **Full Integration Test**:
   ```bash
   cd nodejs
   node test-server.js
   ```

### Log Analysis

1. **Rust Server Logs**:
   ```bash
   # Enable debug logging
   ./target/debug/mcp-server-gdb.exe --log-level debug sse
   ```

2. **Node.js Client Logs**:
   ```javascript
   // Enable verbose logging in client
   const client = new MCPClient(baseUrl, { verbose: true });
   ```

### Health Checks

1. **Server Health**:
   ```bash
   curl http://localhost:3000/health
   ```

2. **MCP Connection Status**:
   ```bash
   curl http://localhost:3000/api/status
   ```

---

## Getting Help

### Before Reporting Issues

1. **Run diagnostic tests**:
   - Test SSE connection
   - Test MCP handshake
   - Test tool invocation

2. **Collect logs**:
   - Rust server logs
   - Node.js client logs
   - Browser console logs (for dashboard)

3. **Check environment**:
   - OS version
   - Node.js version
   - Rust version
   - GDB version

### Reporting Issues

Include the following information:
- **Environment details**
- **Steps to reproduce**
- **Expected vs actual behavior**
- **Log files**
- **Test script results**

### Known Workarounds

- **MCP Core Bug**: Use custom protocol (v0.5.0+)
- **Port Conflicts**: Use environment variables to change ports
- **Permission Issues**: Run with appropriate privileges for debug probe access

---

**Last Updated**: 2025-06-11  
**Version**: 0.5.0-dev

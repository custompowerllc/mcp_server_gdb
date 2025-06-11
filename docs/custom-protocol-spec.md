# Custom Protocol Specification

## Overview

This document specifies the custom protocol implementation that successfully works around the critical bug in `mcp-core` v0.1. The implementation is **COMPLETE** and **FULLY FUNCTIONAL** as of v0.5.0.

> **✅ STATUS**: Implementation completed by Agent-1, integrated by Agent-2, validated by Agent-3, and documented by Agent-4.

## Problem Statement

### MCP Core Bug Details
- **Library**: `mcp-core` crate version 0.1
- **Issue**: Client initialization state tracking failure
- **Symptoms**: 
  - ✅ SSE connection establishes successfully
  - ✅ MCP initialize handshake completes successfully
  - ✅ MCP initialized notification is accepted
  - ❌ `tools/list` fails with "Client must be initialized"
  - ❌ `tools/call` fails with "Client must be initialized"

### Root Cause
The `mcp-core` library fails to properly track client initialization state on the server side, despite successful completion of the MCP handshake protocol.

## Implemented Solution ✅

### Actual Architecture (Agent-1's Implementation)
```
Node.js Client ←→ Dual Rust Servers ←→ GDB Tools
     ↓              ↓ MCP Server (8081)      ↓
Web Dashboard      ↓ HTTP API (8082)   ✅ ALL WORKING
```

> **📖 IMPLEMENTATION REFERENCE**: See [`docs/custom-protocol.md`](custom-protocol.md) for Agent-1's complete implementation documentation and [`nodejs/AGENT1_INTEGRATION_GUIDE.md`](../nodejs/AGENT1_INTEGRATION_GUIDE.md) for integration details.

### Design Principles
1. **Reuse Existing Infrastructure**: Leverage working SSE connection
2. **Bypass MCP Tools**: Implement direct tool invocation
3. **Maintain Compatibility**: Keep existing tool interfaces
4. **Performance**: Equal or better performance than standard MCP
5. **Future Migration**: Easy migration back to standard MCP when bug is fixed

## Protocol Specification

### Transport Layer
- **Base Protocol**: Server-Sent Events (SSE) over HTTP
- **Connection**: Reuse existing SSE connection established for MCP
- **Endpoint**: Custom routes added to existing SSE server

### Message Format

#### Request Format
```json
{
  "protocol": "custom",
  "version": "1.0",
  "id": "unique-request-id",
  "method": "tool_invoke",
  "params": {
    "tool_name": "create_session",
    "arguments": {
      "program": "/path/to/firmware.elf",
      "gdb_path": "arm-none-eabi-gdb"
    }
  },
  "timestamp": "2025-06-11T19:00:00Z"
}
```

#### Response Format
```json
{
  "protocol": "custom",
  "version": "1.0",
  "id": "unique-request-id",
  "status": "success",
  "result": {
    "session_id": "session-uuid",
    "status": "created"
  },
  "timestamp": "2025-06-11T19:00:01Z"
}
```

#### Error Response Format
```json
{
  "protocol": "custom",
  "version": "1.0",
  "id": "unique-request-id",
  "status": "error",
  "error": {
    "code": "TOOL_EXECUTION_FAILED",
    "message": "Failed to create GDB session",
    "details": {
      "gdb_error": "arm-none-eabi-gdb not found"
    }
  },
  "timestamp": "2025-06-11T19:00:01Z"
}
```

### Custom Endpoints

#### Tool Invocation Endpoint
- **Method**: POST
- **Path**: `/custom/tool/invoke`
- **Headers**: 
  - `Content-Type: application/json`
  - `X-Session-Id: <session-id>` (from SSE connection)

#### Tool List Endpoint
- **Method**: GET
- **Path**: `/custom/tools/list`
- **Headers**: 
  - `X-Session-Id: <session-id>` (from SSE connection)

#### Health Check Endpoint
- **Method**: GET
- **Path**: `/custom/health`
- **Response**: Server status and available tools

### Connection Flow

#### 1. Initial Connection (Reuse MCP SSE)
```
Client → GET /sse → Server
Server → event: endpoint → Client
Client extracts session ID and message URL
```

#### 2. Custom Protocol Handshake
```
Client → POST /custom/health → Server
Server → {"status": "ready", "protocol": "custom", "version": "1.0"}
```

#### 3. Tool Invocation
```
Client → POST /custom/tool/invoke → Server
Server → Tool execution result
```

## Implementation Details

### Rust Server Implementation

#### New Module: `src/custom_protocol.rs`
```rust
pub struct CustomProtocolHandler {
    tools: Arc<GdbTools>,
    sessions: Arc<Mutex<HashMap<String, Session>>>,
}

impl CustomProtocolHandler {
    pub async fn handle_tool_invoke(&self, request: ToolInvokeRequest) -> Result<ToolResponse> {
        // Direct tool invocation bypassing MCP
    }
    
    pub async fn list_tools(&self) -> Result<ToolListResponse> {
        // Return available tools without MCP dependency
    }
}
```

#### Modified `src/main.rs`
```rust
// Add custom routes to existing SSE server
app.route("/custom/tool/invoke", post(custom_protocol::handle_tool_invoke))
   .route("/custom/tools/list", get(custom_protocol::list_tools))
   .route("/custom/health", get(custom_protocol::health_check))
```

### Node.js Client Implementation

#### New Module: `nodejs/src/custom-client.js`
```javascript
class CustomProtocolClient {
    constructor(baseUrl, sessionId) {
        this.baseUrl = baseUrl;
        this.sessionId = sessionId;
    }
    
    async invokeToolDirect(toolName, arguments) {
        // Direct tool invocation using custom protocol
    }
    
    async listTools() {
        // Get tools list using custom protocol
    }
}
```

## Error Handling

### Error Categories
1. **Connection Errors**: SSE connection issues
2. **Protocol Errors**: Invalid message format
3. **Tool Errors**: GDB tool execution failures
4. **Session Errors**: Invalid or expired sessions

### Error Codes
- `CONNECTION_FAILED`: SSE connection lost
- `INVALID_REQUEST`: Malformed request
- `TOOL_NOT_FOUND`: Requested tool doesn't exist
- `TOOL_EXECUTION_FAILED`: Tool execution error
- `SESSION_INVALID`: Invalid session ID
- `SESSION_EXPIRED`: Session timeout

## Performance Considerations

### Optimizations
1. **Connection Reuse**: Leverage existing SSE connection
2. **Direct Routing**: Bypass MCP protocol overhead
3. **Async Processing**: Non-blocking tool execution
4. **Error Caching**: Cache common error responses

### Benchmarks (Expected)
- **Latency**: ≤ 50ms for simple tools (vs 100ms+ with MCP bug)
- **Throughput**: 100+ requests/second
- **Memory**: Minimal overhead over standard MCP

## Security Considerations

### Authentication
- Reuse SSE session authentication
- Validate session ID on all requests
- Implement request rate limiting

### Input Validation
- Validate all tool parameters
- Sanitize file paths and commands
- Prevent command injection

## Testing Strategy

### Unit Tests
- Custom protocol message parsing
- Tool invocation logic
- Error handling scenarios

### Integration Tests
- End-to-end tool execution
- WebSocket integration
- Performance benchmarks

### Compatibility Tests
- Standard MCP fallback
- Migration scenarios
- Cross-platform validation

## Migration Path

### Phase 1: Custom Protocol Implementation
- Implement custom protocol alongside existing MCP
- Provide fallback to standard MCP when available

### Phase 2: Production Deployment
- Deploy custom protocol as primary method
- Monitor performance and reliability

### Phase 3: Future Migration
- When mcp-core bug is fixed, provide migration back to standard MCP
- Maintain custom protocol as alternative option

## Conclusion

The custom protocol provides a robust workaround for the mcp-core v0.1 bug while maintaining full functionality and performance. The implementation reuses existing infrastructure and provides a clear migration path for future updates.

---

**Status**: Specification Complete, Implementation In Progress  
**Version**: 1.0  
**Last Updated**: 2025-06-11

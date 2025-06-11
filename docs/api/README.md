# MCP Server GDB API Documentation

This directory contains comprehensive API documentation for the MCP Server GDB project.

## 🚨 Current Status: Custom Protocol Implementation

Due to a critical bug in `mcp-core` v0.1, we are implementing a custom protocol workaround. This documentation covers both the standard MCP protocol and the custom protocol implementation.

## Documentation Structure

### Core API Documentation
- **[mcp-protocol.md](mcp-protocol.md)** - Standard MCP protocol implementation
- **[custom-protocol.md](custom-protocol.md)** - Custom protocol workaround specification
- **[tools-reference.md](tools-reference.md)** - Complete GDB tools reference
- **[session-management.md](session-management.md)** - Session lifecycle and management

### Integration Guides
- **[nodejs-integration.md](nodejs-integration.md)** - Node.js client integration
- **[websocket-api.md](websocket-api.md)** - WebSocket real-time API
- **[error-handling.md](error-handling.md)** - Error codes and handling strategies

### Protocol Specifications
- **[transport-layer.md](transport-layer.md)** - SSE and transport layer details
- **[message-format.md](message-format.md)** - JSON-RPC message specifications
- **[authentication.md](authentication.md)** - Authentication and session management

## Quick Reference

### Available Tools (13 Total)
1. **Session Management**: `create_session`, `get_session`, `get_all_sessions`, `close_session`
2. **Debug Control**: `start_debugging`, `stop_debugging`, `continue_execution`, `step_execution`, `next_execution`
3. **Breakpoints**: `get_breakpoints`, `set_breakpoint`, `delete_breakpoint`
4. **Information**: `get_stack_frames`, `get_local_variables`, `get_registers`, `read_memory`

### Protocol Status
- ✅ **SSE Connection**: Working perfectly
- ✅ **MCP Handshake**: Initialize/initialized sequence successful
- ❌ **Standard Tools**: Blocked by mcp-core v0.1 bug
- 🔄 **Custom Protocol**: Implementation in progress

### Workaround Architecture
```
Client ←→ Custom SSE Protocol ←→ Rust Server
   ↓              ↓                    ↓
Web UI    Direct Tool Routing    GDB Tools
```

## Usage Examples

### Standard MCP Protocol (Currently Blocked)
```javascript
// This currently fails due to mcp-core bug
const tools = await client.sendMCPRequest('tools/list');
const result = await client.sendMCPRequest('tools/call', {
  name: 'create_session',
  arguments: { program: '/path/to/firmware.elf' }
});
```

### Custom Protocol (Workaround - In Development)
```javascript
// Custom protocol bypassing MCP tools/call
const result = await client.invokeToolDirect('create_session', {
  program: '/path/to/firmware.elf',
  gdb_path: 'arm-none-eabi-gdb'
});
```

## Development Status

### Completed
- ✅ Root cause analysis of mcp-core bug
- ✅ SSE transport layer validation
- ✅ MCP handshake protocol verification
- ✅ Tool inventory and specification

### In Progress
- 🔄 Custom protocol implementation (Agent-1)
- 🔄 Node.js client updates (Agent-2)
- 🔄 Integration testing (Agent-3)
- 🔄 Documentation updates (Agent-4)
- 🔄 CI/CD enhancements (Agent-5)

### Next Steps
1. Complete custom protocol implementation
2. Update Node.js client for custom protocol
3. Comprehensive integration testing
4. Performance validation
5. Production deployment

## Contributing

When contributing to the API documentation:

1. **Follow the established format** for consistency
2. **Include examples** for all API endpoints
3. **Document error conditions** and responses
4. **Update this README** when adding new documentation files
5. **Test all examples** before committing

## Related Documentation

- **[../custom-protocol-spec.md](../custom-protocol-spec.md)** - Detailed custom protocol specification
- **[../troubleshooting.md](../troubleshooting.md)** - Common issues and solutions
- **[../installation-guide.md](../installation-guide.md)** - Setup and installation
- **[../developer-guide.md](../developer-guide.md)** - Developer contribution guide

---

**Last Updated**: 2025-06-11  
**Status**: In Development (Custom Protocol Workaround)  
**Version**: 0.5.0-dev

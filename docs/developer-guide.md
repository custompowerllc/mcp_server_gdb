# Developer Guide

## Overview

This guide is for developers contributing to the MCP Server GDB project, including the custom protocol workaround implementation.

## 🚨 Current Development Context

**Critical Bug**: `mcp-core` v0.1 has a bug preventing tool execution. We are implementing a custom protocol workaround across multiple parallel development branches.

### Active Development Branches
- **`feature/rust-custom-protocol`** (Agent-1): Custom Rust protocol implementation
- **`feature/nodejs-custom-client`** (Agent-2): Node.js client integration
- **`feature/comprehensive-testing`** (Agent-3): Testing & validation
- **`feature/documentation-update`** (Agent-4): Documentation updates
- **`feature/devops-pipeline`** (Agent-5): CI/CD enhancements

## Development Environment Setup

### Prerequisites
- Rust 1.70+ with cargo
- Node.js 18+ with npm
- Git with SSH access to repository
- ARM GCC toolchain (for testing)
- OpenOCD (for hardware testing)

### Initial Setup
```bash
# Clone repository
git clone https://github.com/custompowerllc/mcp_server_gdb.git
cd mcp_server_gdb

# Set up development branch
git checkout develop
git checkout -b feature/your-feature-name

# Install Rust dependencies
cargo build

# Install Node.js dependencies
cd nodejs
npm install
cd ..

# Set up pre-commit hooks (optional)
cargo install cargo-fmt
cargo install cargo-clippy
```

### Development Tools
```bash
# Rust development tools
cargo install cargo-watch    # Auto-rebuild on changes
cargo install cargo-expand   # Macro expansion
cargo install cargo-audit    # Security audit

# Node.js development tools
npm install -g nodemon       # Auto-restart on changes
npm install -g eslint        # Linting
npm install -g prettier      # Code formatting
```

## Project Architecture

### High-Level Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Web Client    │◄──►│   Node.js Bridge │◄──►│   Rust Server   │
│   (Dashboard)   │    │   (Port 3000)    │    │   (Port 8081)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   WebSocket     │    │   Custom/MCP     │    │   GDB/MI        │
│   (Port 3001)   │    │   Protocol       │    │   Interface     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Rust Server Components

#### Core Modules
- **`src/main.rs`**: Server entry point and SSE transport setup
- **`src/tools.rs`**: GDB tool implementations
- **`src/gdb.rs`**: GDB/MI protocol interface
- **`src/models.rs`**: Data structures and types
- **`src/config.rs`**: Configuration management
- **`src/error.rs`**: Error handling

#### Custom Protocol (In Development)
- **`src/custom_protocol.rs`**: Custom protocol handler (Agent-1)
- **`src/direct_tools.rs`**: Direct tool invocation (Agent-1)

### Node.js Components

#### Core Modules
- **`src/server.js`**: Express HTTP server
- **`src/mcp-client.js`**: MCP protocol client
- **`src/websocket-server.js`**: WebSocket server for real-time updates
- **`src/event-manager.js`**: Event handling and coordination

#### Custom Protocol (In Development)
- **`src/custom-client.js`**: Custom protocol client (Agent-2)
- **`src/protocol-adapter.js`**: Protocol abstraction layer (Agent-2)

## Development Workflow

### Branch Strategy
```
main
├── develop
│   ├── feature/rust-custom-protocol (Agent-1)
│   ├── feature/nodejs-custom-client (Agent-2)
│   ├── feature/comprehensive-testing (Agent-3)
│   ├── feature/documentation-update (Agent-4)
│   └── feature/devops-pipeline (Agent-5)
```

### Commit Guidelines
```bash
# Commit message format
type(scope): description

# Types: feat, fix, docs, style, refactor, test, chore
# Examples:
git commit -m "feat(custom-protocol): implement direct tool routing"
git commit -m "fix(mcp-client): handle session timeout gracefully"
git commit -m "docs(api): add custom protocol specification"
```

### Code Review Process
1. **Create feature branch** from `develop`
2. **Implement changes** with tests
3. **Run test suite** and ensure all pass
4. **Create pull request** to `develop`
5. **Address review feedback**
6. **Merge after approval**

## Testing Strategy

### Test Categories

#### Unit Tests
```bash
# Rust unit tests
cargo test

# Node.js unit tests
cd nodejs
npm test
```

#### Integration Tests
```bash
# Test MCP protocol
cd nodejs
node test-mcp.js

# Test direct tools (shows mcp-core bug)
node test-direct-tools.js

# Test custom protocol (when available)
node test-custom-protocol.js
```

#### End-to-End Tests
```bash
# Full system test
./scripts/test-e2e.sh

# Hardware-in-the-loop tests (requires STM32 hardware)
./scripts/test-hardware.sh
```

### Test Data
- **Mock GDB responses**: `tests/fixtures/gdb-responses/`
- **Sample firmware**: `tests/fixtures/firmware/`
- **Configuration files**: `tests/fixtures/configs/`

## Custom Protocol Development

### Implementation Guidelines

#### Rust Server (Agent-1)
```rust
// Custom protocol handler structure
pub struct CustomProtocolHandler {
    tools: Arc<GdbTools>,
    sessions: Arc<Mutex<HashMap<String, Session>>>,
}

// Implementation requirements:
// 1. Bypass MCP tools/call mechanism
// 2. Maintain existing tool interfaces
// 3. Add comprehensive error handling
// 4. Preserve SSE connection infrastructure
```

#### Node.js Client (Agent-2)
```javascript
// Custom client structure
class CustomProtocolClient {
    constructor(baseUrl, sessionId) {
        this.baseUrl = baseUrl;
        this.sessionId = sessionId;
    }
    
    // Implementation requirements:
    // 1. Maintain compatibility with existing API
    // 2. Add fallback to standard MCP when available
    // 3. Implement proper error handling
    // 4. Support real-time WebSocket updates
}
```

### Development Coordination

#### Inter-Agent Communication
- **Monitor other branches**: `git fetch origin` regularly
- **Sync specifications**: Update protocol specs as implementation progresses
- **Test integration**: Cross-test implementations as they become available
- **Document changes**: Update API docs with implementation details

#### Shared Resources
- **Protocol specification**: `docs/custom-protocol-spec.md`
- **API documentation**: `docs/api/`
- **Test fixtures**: `tests/fixtures/`
- **Configuration**: Environment variables and config files

## Code Standards

### Rust Code Style
```rust
// Use rustfmt for formatting
cargo fmt

// Use clippy for linting
cargo clippy -- -D warnings

// Documentation requirements
/// Brief description
/// 
/// # Arguments
/// * `param` - Parameter description
/// 
/// # Returns
/// Return value description
/// 
/// # Errors
/// Error conditions
pub fn function_name(param: Type) -> Result<ReturnType, Error> {
    // Implementation
}
```

### JavaScript Code Style
```javascript
// Use ESLint and Prettier
npm run lint
npm run format

// Documentation requirements
/**
 * Brief description
 * @param {Type} param - Parameter description
 * @returns {Promise<Type>} Return value description
 * @throws {Error} Error conditions
 */
async function functionName(param) {
    // Implementation
}
```

### Error Handling
```rust
// Rust: Use Result types and proper error propagation
use thiserror::Error;

#[derive(Error, Debug)]
pub enum CustomProtocolError {
    #[error("Tool not found: {tool_name}")]
    ToolNotFound { tool_name: String },
    #[error("Session invalid: {session_id}")]
    SessionInvalid { session_id: String },
}
```

```javascript
// JavaScript: Use custom error classes
class CustomProtocolError extends Error {
    constructor(message, code, details) {
        super(message);
        this.name = 'CustomProtocolError';
        this.code = code;
        this.details = details;
    }
}
```

## Debugging and Profiling

### Debug Builds
```bash
# Rust debug build with logging
RUST_LOG=debug cargo run -- --log-level debug sse

# Node.js with debug output
DEBUG=* node src/server.js
```

### Performance Profiling
```bash
# Rust profiling
cargo install flamegraph
cargo flamegraph --bin mcp-server-gdb

# Node.js profiling
node --prof src/server.js
node --prof-process isolate-*.log > profile.txt
```

### Memory Analysis
```bash
# Rust memory usage
cargo install cargo-valgrind
cargo valgrind run

# Node.js memory usage
node --inspect src/server.js
# Open chrome://inspect in Chrome
```

## Documentation Standards

### Code Documentation
- **Rust**: Use `///` for public APIs, `//` for internal comments
- **JavaScript**: Use JSDoc format for all public functions
- **Examples**: Include usage examples in documentation

### API Documentation
- **Update `docs/api/`** when adding new endpoints
- **Include request/response examples**
- **Document error conditions**
- **Maintain backward compatibility notes**

### README Updates
- **Keep status current** in main README.md
- **Update feature lists** when adding functionality
- **Maintain installation instructions**
- **Update troubleshooting guide**

## Release Process

### Version Management
```bash
# Update version in Cargo.toml
version = "0.5.0"

# Update version in package.json
"version": "0.5.0"

# Tag release
git tag -a v0.5.0 -m "Release v0.5.0: Custom protocol workaround"
git push origin v0.5.0
```

### Release Checklist
- [ ] All tests pass
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version numbers incremented
- [ ] Release notes prepared
- [ ] Binary builds created
- [ ] Configuration files updated

## Contributing Guidelines

### Before Contributing
1. **Check existing issues** and pull requests
2. **Discuss major changes** in issues first
3. **Follow coding standards** and test requirements
4. **Update documentation** for any API changes

### Pull Request Requirements
- [ ] Tests pass
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] CHANGELOG.md updated (if applicable)
- [ ] No merge conflicts with develop branch

### Getting Help
- **Technical questions**: Create GitHub issue
- **Development coordination**: Comment on relevant agent branches
- **Documentation**: Check `docs/` directory first
- **Real-time discussion**: Use project communication channels

---

**Last Updated**: 2025-06-11  
**Version**: 0.5.0-dev  
**Status**: Active development - custom protocol workaround

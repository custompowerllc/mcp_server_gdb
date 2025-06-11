# Installation Guide

## Overview

This guide covers the complete installation and setup process for the MCP Server GDB for STM32, including the custom protocol workaround for the mcp-core bug.

## 🚨 Current Status Notice

**Important**: Due to a critical bug in `mcp-core` v0.1, we are implementing a custom protocol workaround. This guide covers both the standard installation and the workaround setup.

## Prerequisites

### System Requirements
- **Operating System**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Storage**: 2GB free space for tools and dependencies
- **Network**: Internet connection for downloading dependencies

### Required Software

#### 1. Rust Toolchain
```bash
# Install Rust (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Verify installation
rustc --version
cargo --version
```

#### 2. Node.js (for dashboard and workaround)
```bash
# Install Node.js 18+ (recommended: use nvm)
# macOS/Linux
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Windows (use installer from nodejs.org)
# Download from: https://nodejs.org/

# Verify installation
node --version  # Should be v18.0.0 or higher
npm --version
```

#### 3. ARM GCC Toolchain (for STM32 debugging)
```bash
# macOS
brew install --cask gcc-arm-embedded

# Ubuntu/Debian
sudo apt-get update
sudo apt-get install gcc-arm-none-eabi gdb-arm-none-eabi

# Windows
# Download from: https://developer.arm.com/tools-and-software/open-source-software/developer-tools/gnu-toolchain/gnu-rm
# Add to PATH after installation

# Verify installation
arm-none-eabi-gdb --version
```

#### 4. OpenOCD (for debug probe support)
```bash
# macOS
brew install openocd

# Ubuntu/Debian
sudo apt-get install openocd

# Windows
# Download from: https://github.com/xpack-dev-tools/openocd-xpack/releases
# Or use package manager like Chocolatey: choco install openocd

# Verify installation
openocd --version
```

## Installation Steps

### Step 1: Clone Repository
```bash
git clone https://github.com/custompowerllc/mcp_server_gdb.git
cd mcp_server_gdb
```

### Step 2: Build Rust Server
```bash
# Build release version
cargo build --release

# Verify build
ls -la target/release/mcp-server-gdb*

# Test basic functionality
./target/release/mcp-server-gdb --help
```

### Step 3: Install Node.js Dependencies
```bash
cd nodejs
npm install

# Verify installation
npm list
```

### Step 4: Configure Environment

#### Environment Variables
```bash
# Windows PowerShell
$env:SERVER_PORT="8081"
$env:GDB_COMMAND_TIMEOUT="30"

# Linux/macOS
export SERVER_PORT=8081
export GDB_COMMAND_TIMEOUT=30
```

#### Configuration Files
Choose and customize one of the provided configuration files:
- `mcp-stm32-recommended.json` - **RECOMMENDED** for most users
- `mcp-server-gdb.json` - Comprehensive configuration
- `mcp-stm32-config.json` - Simple configuration

```bash
# Copy and customize configuration
cp mcp-stm32-recommended.json my-config.json
# Edit paths in my-config.json to match your system
```

## Testing Installation

### Step 1: Test Rust Server
```bash
# Start server in debug mode
$env:SERVER_PORT="8081"; ./target/debug/mcp-server-gdb.exe --log-level debug sse

# In another terminal, test SSE endpoint
curl http://127.0.0.1:8081/sse
```

Expected output:
```
event: endpoint
data: {"uri": "/message?sessionId=<uuid>"}
```

### Step 2: Test Node.js Integration
```bash
cd nodejs

# Test basic MCP connection
node test-mcp.js

# Test direct tools (will show mcp-core bug)
node test-direct-tools.js

# Test full server
node test-server.js
```

### Step 3: Test STM32 Debugging (Optional)
```bash
# Start OpenOCD for your target (example for STM32F4)
openocd -f interface/stlink-v2.cfg -f target/stm32f4x.cfg

# In another terminal, test GDB connection
arm-none-eabi-gdb --batch --ex "target remote localhost:3333" --ex "quit"
```

## Custom Protocol Workaround Setup

### Current Status
The custom protocol workaround is under development. When available (v0.5.0+), follow these additional steps:

### Step 1: Update to Workaround Version
```bash
# Switch to custom protocol branch (when available)
git checkout feature/custom-protocol-integration

# Rebuild with workaround
cargo build --release
```

### Step 2: Configure Custom Protocol
```bash
# Update Node.js client for custom protocol
cd nodejs
npm install  # Install any new dependencies

# Test custom protocol
node test-custom-protocol.js
```

### Step 3: Verify Workaround
```bash
# Test that all tools work with custom protocol
node test-all-tools.js
```

## Integration with Augment AI

### Step 1: Prepare Configuration
```bash
# Ensure binary is in the correct location
mkdir -p build
cp target/release/mcp-server-gdb* build/

# Update configuration file paths
# Edit your chosen .json config file to use absolute paths
```

### Step 2: Import into Augment AI
1. Open Augment AI settings
2. Navigate to MCP Servers
3. Import your configuration file
4. Verify connection

### Step 3: Test Integration
```bash
# Test from Augment AI
# Try creating a debugging session:
# create_session(program="/path/to/firmware.elf", gdb_path="arm-none-eabi-gdb")
```

## Hardware Setup (STM32)

### Debug Probe Setup

#### ST-Link V2/V3
1. **Connect ST-Link to STM32**:
   - VCC → 3.3V
   - GND → GND
   - SWDIO → PA13
   - SWCLK → PA14

2. **Verify Connection**:
   ```bash
   # Check if ST-Link is detected
   # Windows: Device Manager → Universal Serial Bus devices
   # Linux: lsusb | grep STMicroelectronics
   # macOS: System Information → USB
   ```

#### J-Link
1. **Connect J-Link to STM32**:
   - VTref → 3.3V
   - GND → GND
   - SWDIO → PA13
   - SWCLK → PA14

2. **Start J-Link GDB Server**:
   ```bash
   JLinkGDBServer -device STM32F407VG -if SWD -speed 4000 -port 2331
   ```

### Target Configuration

#### OpenOCD Configuration
Create target-specific configuration:
```bash
# Example: stm32f4-discovery.cfg
source [find interface/stlink-v2.cfg]
source [find target/stm32f4x.cfg]
```

#### GDB Configuration
Create `.gdbinit` file:
```gdb
target remote localhost:3333
monitor reset halt
load
monitor reset halt
```

## Troubleshooting Installation

### Common Issues

#### 1. Rust Build Fails
```bash
# Update Rust toolchain
rustup update

# Clean and rebuild
cargo clean
cargo build --release
```

#### 2. Node.js Dependencies Fail
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 3. GDB Not Found
```bash
# Verify ARM GCC installation
which arm-none-eabi-gdb

# Add to PATH if necessary
export PATH=$PATH:/usr/local/gcc-arm-none-eabi/bin
```

#### 4. OpenOCD Connection Issues
```bash
# Check USB permissions (Linux)
sudo usermod -a -G dialout $USER
# Log out and back in

# Check device permissions
ls -la /dev/ttyUSB* /dev/ttyACM*
```

### Getting Help

If you encounter issues:

1. **Check logs**: Enable debug logging for detailed error information
2. **Run tests**: Use provided test scripts to isolate issues
3. **Check documentation**: Review troubleshooting guide
4. **Report issues**: Include environment details and log files

## Next Steps

After successful installation:

1. **Read the API documentation**: `docs/api/README.md`
2. **Try example workflows**: See STM32 debugging examples in README.md
3. **Set up your project**: Configure for your specific STM32 target
4. **Monitor updates**: Watch for custom protocol workaround release

---

**Last Updated**: 2025-06-11  
**Version**: 0.5.0-dev  
**Status**: Installation guide complete, custom protocol pending

# GDB Tools Reference

## Overview

This document provides comprehensive reference for all 13 GDB debugging tools available in the MCP Server GDB for STM32.

## 🚨 Current Status

**Important**: Due to the mcp-core v0.1 bug, these tools are currently accessible only through the custom protocol workaround (in development).

## Tool Categories

### Session Management (4 tools)
- [`create_session`](#create_session) - Create new GDB debugging session
- [`get_session`](#get_session) - Get specific session information
- [`get_all_sessions`](#get_all_sessions) - List all active sessions
- [`close_session`](#close_session) - Close debugging session

### Debug Control (5 tools)
- [`start_debugging`](#start_debugging) - Start debugging process
- [`stop_debugging`](#stop_debugging) - Stop debugging process
- [`continue_execution`](#continue_execution) - Continue program execution
- [`step_execution`](#step_execution) - Step into next line
- [`next_execution`](#next_execution) - Step over next line

### Breakpoint Management (3 tools)
- [`get_breakpoints`](#get_breakpoints) - List all breakpoints
- [`set_breakpoint`](#set_breakpoint) - Set new breakpoint
- [`delete_breakpoint`](#delete_breakpoint) - Delete existing breakpoint

### Debug Information (4 tools)
- [`get_stack_frames`](#get_stack_frames) - Get call stack information
- [`get_local_variables`](#get_local_variables) - Get local variables
- [`get_registers`](#get_registers) - Get CPU register values
- [`read_memory`](#read_memory) - Read memory contents

---

## Session Management Tools

### `create_session`

Create a new GDB debugging session for STM32 firmware.

#### Parameters
```json
{
  "program": "/path/to/firmware.elf",
  "gdb_path": "arm-none-eabi-gdb",
  "args": [],
  "env": {},
  "cwd": "/path/to/working/directory",
  "bps": 1000,
  "proc_id": null
}
```

#### Parameter Details
- **`program`** (required): Path to ELF firmware file
- **`gdb_path`** (optional): GDB executable path (default: "arm-none-eabi-gdb")
- **`args`** (optional): Command line arguments for the program
- **`env`** (optional): Environment variables
- **`cwd`** (optional): Working directory
- **`bps`** (optional): Breakpoint limit (default: 1000)
- **`proc_id`** (optional): Process ID for attach mode

#### Response
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "created",
  "program": "/path/to/firmware.elf",
  "gdb_path": "arm-none-eabi-gdb"
}
```

#### STM32 Example
```json
{
  "program": "/home/user/stm32_project/build/firmware.elf",
  "gdb_path": "arm-none-eabi-gdb",
  "cwd": "/home/user/stm32_project"
}
```

### `get_session`

Retrieve information about a specific debugging session.

#### Parameters
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### Response
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "running",
  "program": "/path/to/firmware.elf",
  "gdb_path": "arm-none-eabi-gdb",
  "created_at": "2025-06-11T19:00:00Z",
  "last_activity": "2025-06-11T19:05:30Z"
}
```

### `get_all_sessions`

List all active debugging sessions.

#### Parameters
None

#### Response
```json
{
  "sessions": [
    {
      "session_id": "550e8400-e29b-41d4-a716-446655440000",
      "status": "running",
      "program": "/path/to/firmware.elf",
      "created_at": "2025-06-11T19:00:00Z"
    }
  ],
  "total_count": 1
}
```

### `close_session`

Close a debugging session and clean up resources.

#### Parameters
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### Response
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "closed",
  "message": "Session closed successfully"
}
```

---

## Debug Control Tools

### `start_debugging`

Start the debugging process for a session.

#### Parameters
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### Response
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "debugging_started",
  "target_status": "stopped",
  "pc": "0x08000000"
}
```

### `stop_debugging`

Stop the debugging process.

#### Parameters
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### Response
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "debugging_stopped"
}
```

### `continue_execution`

Continue program execution from current position.

#### Parameters
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### Response
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "running",
  "reason": "continue"
}
```

### `step_execution`

Step into the next line of code (step into functions).

#### Parameters
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### Response
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "stopped",
  "reason": "step",
  "file": "main.c",
  "line": 42,
  "pc": "0x08000124"
}
```

### `next_execution`

Step over the next line of code (don't step into functions).

#### Parameters
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### Response
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "stopped",
  "reason": "next",
  "file": "main.c",
  "line": 43,
  "pc": "0x08000128"
}
```

---

## Breakpoint Management Tools

### `get_breakpoints`

List all breakpoints in the session.

#### Parameters
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### Response
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "breakpoints": [
    {
      "id": 1,
      "file": "main.c",
      "line": 100,
      "address": "0x08000200",
      "enabled": true,
      "hit_count": 0
    }
  ]
}
```

### `set_breakpoint`

Set a new breakpoint.

#### Parameters
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "file": "main.c",
  "line": 100,
  "condition": null,
  "temporary": false
}
```

#### Parameter Details
- **`file`** (optional): Source file name
- **`line`** (optional): Line number
- **`address`** (optional): Memory address (alternative to file/line)
- **`condition`** (optional): Conditional breakpoint expression
- **`temporary`** (optional): Temporary breakpoint (default: false)

#### Response
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "breakpoint_id": 1,
  "file": "main.c",
  "line": 100,
  "address": "0x08000200",
  "status": "set"
}
```

### `delete_breakpoint`

Delete an existing breakpoint.

#### Parameters
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "breakpoint_id": 1
}
```

#### Response
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "breakpoint_id": 1,
  "status": "deleted"
}
```

---

## Debug Information Tools

### `get_stack_frames`

Get call stack information.

#### Parameters
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "max_depth": 10
}
```

#### Response
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "frames": [
    {
      "level": 0,
      "function": "main",
      "file": "main.c",
      "line": 100,
      "address": "0x08000200"
    },
    {
      "level": 1,
      "function": "_start",
      "file": "startup.s",
      "line": 45,
      "address": "0x08000100"
    }
  ]
}
```

### `get_local_variables`

Get local variables for current or specified frame.

#### Parameters
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "frame_id": 0
}
```

#### Response
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "frame_id": 0,
  "variables": [
    {
      "name": "counter",
      "type": "int",
      "value": "42",
      "address": "0x20000100"
    },
    {
      "name": "status",
      "type": "uint32_t",
      "value": "0x12345678",
      "address": "0x20000104"
    }
  ]
}
```

### `get_registers`

Get CPU register values (ARM Cortex-M specific).

#### Parameters
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "register_names": ["R0", "R1", "PC", "SP", "PSR"]
}
```

#### ARM Cortex-M Registers
- **General Purpose**: R0-R12
- **Special**: SP (R13), LR (R14), PC (R15)
- **Status**: PSR, MSP, PSP
- **Control**: PRIMASK, FAULTMASK, BASEPRI, CONTROL

#### Response
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "registers": {
    "R0": "0x12345678",
    "R1": "0x87654321",
    "PC": "0x08000200",
    "SP": "0x20001000",
    "PSR": "0x01000000"
  }
}
```

### `read_memory`

Read memory contents from specified address.

#### Parameters
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "address": "0x08000000",
  "count": 256,
  "format": "hex"
}
```

#### STM32 Memory Regions
- **Flash**: 0x08000000 (program memory)
- **SRAM**: 0x20000000 (data memory)
- **Peripherals**: 0x40000000-0x60000000
- **System**: 0x1FFF0000 (bootloader)

#### Response
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "address": "0x08000000",
  "count": 256,
  "format": "hex",
  "data": "20001000 08000121 08000123 08000125..."
}
```

---

## Error Handling

### Common Error Codes
- **`SESSION_NOT_FOUND`**: Invalid session ID
- **`GDB_ERROR`**: GDB command execution failed
- **`INVALID_PARAMETER`**: Invalid tool parameter
- **`TIMEOUT`**: Operation timeout
- **`PERMISSION_DENIED`**: Insufficient permissions

### Error Response Format
```json
{
  "error": {
    "code": "SESSION_NOT_FOUND",
    "message": "Session not found",
    "details": {
      "session_id": "invalid-session-id"
    }
  }
}
```

---

**Last Updated**: 2025-06-11  
**Version**: 0.5.0-dev  
**Status**: Reference complete, custom protocol implementation pending

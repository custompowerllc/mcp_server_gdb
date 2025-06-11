#!/bin/bash

# tests/run_comprehensive_tests.sh
# Comprehensive test runner for Agent-1 and Agent-2 validation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
RUST_MCP_PORT=8081
RUST_HTTP_PORT=8082
NODEJS_PORT=3000
WEBSOCKET_PORT=3001

# Test categories
declare -A TEST_CATEGORIES=(
    ["unit"]="Unit tests (no servers required)"
    ["protocol"]="Protocol validation tests"
    ["integration"]="Integration tests (requires servers)"
    ["performance"]="Performance benchmarks"
    ["e2e"]="End-to-end workflow tests"
    ["all"]="All test categories"
)

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to print section header
print_header() {
    echo
    print_status $BLUE "=============================================="
    print_status $BLUE "$1"
    print_status $BLUE "=============================================="
    echo
}

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to wait for server to be ready
wait_for_server() {
    local url=$1
    local timeout=${2:-30}
    local count=0
    
    print_status $YELLOW "Waiting for server at $url..."
    
    while [ $count -lt $timeout ]; do
        if curl -s -f "$url" >/dev/null 2>&1; then
            print_status $GREEN "✅ Server ready at $url"
            return 0
        fi
        sleep 1
        count=$((count + 1))
        printf "."
    done
    
    echo
    print_status $RED "❌ Server at $url failed to start within ${timeout}s"
    return 1
}

# Function to start Rust MCP server
start_rust_mcp_server() {
    print_status $YELLOW "Starting Rust MCP server on port $RUST_MCP_PORT..."
    
    if check_port $RUST_MCP_PORT; then
        print_status $YELLOW "Port $RUST_MCP_PORT already in use, skipping..."
        return 0
    fi
    
    export SERVER_PORT=$RUST_MCP_PORT
    ./target/release/mcp-server-gdb sse > rust_mcp_server.log 2>&1 &
    echo $! > rust_mcp_server.pid
    
    wait_for_server "http://127.0.0.1:$RUST_MCP_PORT/sse"
}

# Function to start Rust HTTP server
start_rust_http_server() {
    print_status $YELLOW "Starting Rust HTTP server on port $RUST_HTTP_PORT..."
    
    if check_port $RUST_HTTP_PORT; then
        print_status $YELLOW "Port $RUST_HTTP_PORT already in use, skipping..."
        return 0
    fi
    
    export SERVER_PORT=$RUST_HTTP_PORT
    ./target/release/mcp-server-gdb http > rust_http_server.log 2>&1 &
    echo $! > rust_http_server.pid
    
    wait_for_server "http://127.0.0.1:$RUST_HTTP_PORT/health"
}

# Function to start Node.js client
start_nodejs_client() {
    print_status $YELLOW "Starting Node.js client on port $NODEJS_PORT..."
    
    if check_port $NODEJS_PORT; then
        print_status $YELLOW "Port $NODEJS_PORT already in use, skipping..."
        return 0
    fi
    
    cd nodejs
    npm start > ../nodejs_client.log 2>&1 &
    echo $! > ../nodejs_client.pid
    cd ..
    
    wait_for_server "http://127.0.0.1:$NODEJS_PORT/health"
}

# Function to stop all servers
stop_servers() {
    print_status $YELLOW "Stopping all servers..."
    
    if [ -f rust_mcp_server.pid ]; then
        kill $(cat rust_mcp_server.pid) 2>/dev/null || true
        rm -f rust_mcp_server.pid
    fi
    
    if [ -f rust_http_server.pid ]; then
        kill $(cat rust_http_server.pid) 2>/dev/null || true
        rm -f rust_http_server.pid
    fi
    
    if [ -f nodejs_client.pid ]; then
        kill $(cat nodejs_client.pid) 2>/dev/null || true
        rm -f nodejs_client.pid
    fi
    
    # Wait a moment for processes to terminate
    sleep 2
    
    print_status $GREEN "✅ All servers stopped"
}

# Function to build projects
build_projects() {
    print_header "Building Projects"
    
    print_status $YELLOW "Building Rust server..."
    cargo build --release
    
    print_status $YELLOW "Installing Node.js dependencies..."
    cd nodejs
    npm ci
    cd ..
    
    print_status $GREEN "✅ Projects built successfully"
}

# Function to run unit tests
run_unit_tests() {
    print_header "Running Unit Tests"
    
    print_status $YELLOW "Running Rust unit tests..."
    cargo test --lib --verbose
    
    print_status $YELLOW "Running Node.js unit tests..."
    cd nodejs
    npm test
    cd ..
    
    print_status $GREEN "✅ Unit tests completed"
}

# Function to run protocol tests
run_protocol_tests() {
    print_header "Running Protocol Validation Tests"
    
    # Start servers
    start_rust_mcp_server
    start_rust_http_server
    
    print_status $YELLOW "Running protocol validation tests..."
    cargo test test_agent1_dual_server_implementation --release -- --nocapture
    
    print_status $GREEN "✅ Protocol tests completed"
}

# Function to run integration tests
run_integration_tests() {
    print_header "Running Integration Tests"
    
    # Start all servers
    start_rust_mcp_server
    start_rust_http_server
    start_nodejs_client
    
    print_status $YELLOW "Running Agent-1 validation tests..."
    cargo test test_agent1_dual_server_implementation --release -- --nocapture
    
    print_status $YELLOW "Running Agent-2 validation tests..."
    cargo test test_agent2_nodejs_client_integration --release -- --nocapture
    
    print_status $YELLOW "Running complete integration tests..."
    cargo test test_complete_integration --release -- --nocapture
    
    print_status $GREEN "✅ Integration tests completed"
}

# Function to run performance tests
run_performance_tests() {
    print_header "Running Performance Benchmarks"
    
    # Start all servers
    start_rust_mcp_server
    start_rust_http_server
    start_nodejs_client
    
    print_status $YELLOW "Running performance benchmarks..."
    export PERFORMANCE_TESTING=1
    cargo test test_performance_benchmarks --release -- --nocapture
    
    print_status $GREEN "✅ Performance tests completed"
}

# Function to run end-to-end tests
run_e2e_tests() {
    print_header "Running End-to-End Tests"
    
    # Start all servers
    start_rust_mcp_server
    start_rust_http_server
    start_nodejs_client
    
    print_status $YELLOW "Running production readiness tests..."
    cargo test test_production_readiness --release -- --nocapture
    
    print_status $GREEN "✅ End-to-end tests completed"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [CATEGORY] [OPTIONS]"
    echo
    echo "Test Categories:"
    for category in "${!TEST_CATEGORIES[@]}"; do
        echo "  $category - ${TEST_CATEGORIES[$category]}"
    done
    echo
    echo "Options:"
    echo "  --no-build    Skip building projects"
    echo "  --keep-servers Keep servers running after tests"
    echo "  --verbose     Enable verbose output"
    echo "  --help        Show this help message"
    echo
    echo "Examples:"
    echo "  $0 unit                    # Run unit tests only"
    echo "  $0 integration             # Run integration tests"
    echo "  $0 all --verbose           # Run all tests with verbose output"
    echo "  $0 performance --no-build  # Run performance tests without building"
}

# Function to check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check Rust
    if ! command -v cargo &> /dev/null; then
        print_status $RED "❌ Rust/Cargo not found"
        exit 1
    fi
    print_status $GREEN "✅ Rust: $(rustc --version)"
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_status $RED "❌ Node.js not found"
        exit 1
    fi
    print_status $GREEN "✅ Node.js: $(node --version)"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_status $RED "❌ npm not found"
        exit 1
    fi
    print_status $GREEN "✅ npm: $(npm --version)"
    
    # Check curl
    if ! command -v curl &> /dev/null; then
        print_status $RED "❌ curl not found"
        exit 1
    fi
    print_status $GREEN "✅ curl available"
    
    print_status $GREEN "✅ All prerequisites satisfied"
}

# Main function
main() {
    local category=${1:-"all"}
    local no_build=false
    local keep_servers=false
    local verbose=false
    
    # Parse arguments
    shift
    while [[ $# -gt 0 ]]; do
        case $1 in
            --no-build)
                no_build=true
                shift
                ;;
            --keep-servers)
                keep_servers=true
                shift
                ;;
            --verbose)
                verbose=true
                set -x
                shift
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                print_status $RED "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Validate category
    if [[ ! " ${!TEST_CATEGORIES[@]} " =~ " ${category} " ]]; then
        print_status $RED "Invalid test category: $category"
        show_usage
        exit 1
    fi
    
    # Setup trap to cleanup on exit
    if [ "$keep_servers" = false ]; then
        trap stop_servers EXIT
    fi
    
    print_header "🧪 Comprehensive Testing & Validation"
    print_status $BLUE "Category: ${TEST_CATEGORIES[$category]}"
    print_status $BLUE "Build: $([ "$no_build" = true ] && echo "Skip" || echo "Yes")"
    print_status $BLUE "Keep servers: $([ "$keep_servers" = true ] && echo "Yes" || echo "No")"
    
    # Check prerequisites
    check_prerequisites
    
    # Build projects if needed
    if [ "$no_build" = false ]; then
        build_projects
    fi
    
    # Run tests based on category
    case $category in
        "unit")
            run_unit_tests
            ;;
        "protocol")
            run_protocol_tests
            ;;
        "integration")
            run_integration_tests
            ;;
        "performance")
            run_performance_tests
            ;;
        "e2e")
            run_e2e_tests
            ;;
        "all")
            run_unit_tests
            run_protocol_tests
            run_integration_tests
            run_performance_tests
            run_e2e_tests
            ;;
    esac
    
    print_header "🎉 Testing Completed Successfully"
    print_status $GREEN "All tests in category '$category' passed!"
    
    if [ "$keep_servers" = true ]; then
        print_status $YELLOW "Servers are still running:"
        print_status $YELLOW "  - Rust MCP Server: http://127.0.0.1:$RUST_MCP_PORT"
        print_status $YELLOW "  - Rust HTTP Server: http://127.0.0.1:$RUST_HTTP_PORT"
        print_status $YELLOW "  - Node.js Client: http://127.0.0.1:$NODEJS_PORT"
        print_status $YELLOW "Run 'pkill -f mcp-server-gdb' and 'pkill -f node' to stop them"
    fi
}

# Run main function with all arguments
main "$@"

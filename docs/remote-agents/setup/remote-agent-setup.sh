#!/bin/bash

# Remote AI Agents Setup Script
# Based on AI Remote Agents Framework for MCP GDB Integration
# Sets up environment for 5 AI agents (Alpha, Beta, Gamma, Delta, Epsilon) and orchestrator

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_NAME="mcp_server_gdb"
REPO_URL="https://github.com/custompowerllc/mcp_server_gdb.git"
CONTEXT_BRANCH="context/remote-ai-agents"
AGENTS=("alpha" "beta" "gamma" "delta" "epsilon" "orchestrator")
NODE_VERSION="22.14.0"
RUST_VERSION="stable"

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check system requirements
check_requirements() {
    log "Checking system requirements..."
    
    # Check OS
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
        OS="windows"
    else
        error "Unsupported operating system: $OSTYPE"
        exit 1
    fi
    
    success "Operating system: $OS"
    
    # Check required tools
    local required_tools=("git" "curl" "jq")
    for tool in "${required_tools[@]}"; do
        if ! command_exists "$tool"; then
            error "Required tool not found: $tool"
            exit 1
        fi
    done
    
    success "All required tools are available"
}

# Install Node.js using nvm
install_nodejs() {
    log "Installing Node.js $NODE_VERSION..."
    
    if command_exists node; then
        local current_version=$(node --version | sed 's/v//')
        if [[ "$current_version" == "$NODE_VERSION"* ]]; then
            success "Node.js $NODE_VERSION already installed"
            return
        fi
    fi
    
    # Install nvm if not present
    if ! command_exists nvm; then
        log "Installing nvm..."
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    fi
    
    # Install and use Node.js
    nvm install "$NODE_VERSION"
    nvm use "$NODE_VERSION"
    nvm alias default "$NODE_VERSION"
    
    success "Node.js $NODE_VERSION installed"
}

# Install Rust
install_rust() {
    log "Installing Rust $RUST_VERSION..."
    
    if command_exists rustc; then
        success "Rust already installed: $(rustc --version)"
        return
    fi
    
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
    rustup default "$RUST_VERSION"
    
    success "Rust $RUST_VERSION installed"
}

# Install GitHub CLI
install_github_cli() {
    log "Installing GitHub CLI..."
    
    if command_exists gh; then
        success "GitHub CLI already installed: $(gh --version | head -n1)"
        return
    fi
    
    case "$OS" in
        "linux")
            curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
            echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
            sudo apt update
            sudo apt install gh
            ;;
        "macos")
            if command_exists brew; then
                brew install gh
            else
                error "Homebrew not found. Please install GitHub CLI manually."
                exit 1
            fi
            ;;
        "windows")
            warning "Please install GitHub CLI manually from https://cli.github.com/"
            ;;
    esac
    
    success "GitHub CLI installed"
}

# Setup repository structure
setup_repository() {
    log "Setting up repository structure..."
    
    # Create agents directory
    mkdir -p agents
    cd agents
    
    # Clone repository for each agent
    for agent in "${AGENTS[@]}"; do
        log "Setting up $agent agent..."
        
        if [ -d "$agent" ]; then
            warning "Directory $agent already exists, skipping clone"
            continue
        fi
        
        git clone "$REPO_URL" "$agent"
        cd "$agent"
        
        # Checkout context branch for documentation
        git fetch origin "$CONTEXT_BRANCH"
        git checkout "$CONTEXT_BRANCH"
        
        # Create agent-specific branch
        if [ "$agent" != "orchestrator" ]; then
            git checkout -b "feature/setup-$agent"
        else
            git checkout -b "orchestrator/setup"
        fi
        
        cd ..
    done
    
    cd ..
    success "Repository structure created"
}

# Create configuration files
create_config_files() {
    log "Creating configuration files..."
    
    # Create tasks.yaml
    cat > tasks.yaml << 'EOF'
tasks:
  - id: T001
    agent: Alpha
    feature: Custom Protocol Implementation
    branch: feature/custom-protocol-alpha
    dependencies: []
    description: Implement custom MCP protocol for GDB integration
  - id: T002
    agent: Beta
    feature: Node.js Client Integration
    branch: feature/client-beta
    dependencies: [T001]
    description: Develop Node.js client for MCP GDB server
  - id: T003
    agent: Gamma
    feature: Testing Framework
    branch: feature/testing-gamma
    dependencies: [T001, T002]
    description: Create comprehensive test suites
  - id: T004
    agent: Delta
    feature: Documentation
    branch: feature/docs-delta
    dependencies: []
    description: Update documentation and guides
  - id: T005
    agent: Epsilon
    feature: CI/CD Pipeline
    branch: feature/cicd-epsilon
    dependencies: [T003]
    description: Setup automated CI/CD workflows

orchestrator:
  task_log_branch: task-log
  auto_merge_safe_fixes: true
  notification_channels:
    - slack
    - email
  ports:
    rust_sse: 8081
    rust_http: 8082
    nodejs_http: 3000
    nodejs_websocket: 3001
EOF
    
    # Create initial task log
    mkdir -p task-log
    cat > task-log/tasks.json << 'EOF'
[
  {
    "task_id": "T001",
    "agent": "Alpha",
    "branch": "feature/custom-protocol-alpha",
    "pr": null,
    "status": "Assigned",
    "dependencies": [],
    "last_updated": null,
    "integration_status": "Pending",
    "test_results": [],
    "code_rabbit_fixes": []
  },
  {
    "task_id": "T002",
    "agent": "Beta",
    "branch": "feature/client-beta",
    "pr": null,
    "status": "Waiting",
    "dependencies": ["T001"],
    "last_updated": null,
    "integration_status": "Pending",
    "test_results": [],
    "code_rabbit_fixes": []
  }
]
EOF
    
    success "Configuration files created"
}

# Create agent scripts
create_agent_scripts() {
    log "Creating agent scripts..."
    
    mkdir -p scripts
    
    # Create orchestrator script template
    cat > scripts/orchestrator.js << 'EOF'
#!/usr/bin/env node

const { Octokit } = require("@octokit/rest");
const yaml = require("js-yaml");
const fs = require("fs");

class Orchestrator {
    constructor() {
        this.octokit = new Octokit({ 
            auth: process.env.GITHUB_TOKEN 
        });
        this.repo = { 
            owner: "custompowerllc", 
            repo: "mcp_server_gdb" 
        };
    }

    async assignTasks() {
        console.log("Assigning tasks to agents...");
        const tasks = yaml.load(fs.readFileSync("../tasks.yaml", "utf8"));
        
        for (const task of tasks.tasks) {
            await this.updateTaskLog(task.id, { 
                status: "Assigned", 
                agent: task.agent,
                last_updated: new Date().toISOString()
            });
        }
    }

    async updateTaskLog(taskId, update) {
        const logPath = "../task-log/tasks.json";
        const log = JSON.parse(fs.readFileSync(logPath, "utf8"));
        const task = log.find(t => t.task_id === taskId);
        
        if (task) {
            Object.assign(task, update);
            fs.writeFileSync(logPath, JSON.stringify(log, null, 2));
            console.log(`Updated task ${taskId}:`, update);
        }
    }

    async monitorPRs() {
        console.log("Monitoring pull requests...");
        // Implementation for PR monitoring
    }
}

if (require.main === module) {
    const orchestrator = new Orchestrator();
    orchestrator.assignTasks().catch(console.error);
}

module.exports = Orchestrator;
EOF
    
    # Create agent script template
    cat > scripts/agent-template.js << 'EOF'
#!/usr/bin/env node

const { Octokit } = require("@octokit/rest");
const { execSync } = require("child_process");

class Agent {
    constructor(name) {
        this.name = name;
        this.octokit = new Octokit({ 
            auth: process.env.GITHUB_TOKEN 
        });
    }

    async executeTask(taskId) {
        console.log(`Agent ${this.name} executing task ${taskId}`);
        
        // Run tests
        try {
            if (this.isRustProject()) {
                execSync("cargo test", { stdio: "inherit" });
            } else {
                execSync("npm test", { stdio: "inherit" });
            }
        } catch (error) {
            console.error("Tests failed:", error.message);
            return false;
        }
        
        return true;
    }

    isRustProject() {
        return require("fs").existsSync("Cargo.toml");
    }

    async createPR(branch, title) {
        console.log(`Creating PR for branch ${branch}`);
        // Implementation for PR creation
    }
}

module.exports = Agent;
EOF
    
    success "Agent scripts created"
}

# Setup environment variables
setup_environment() {
    log "Setting up environment variables..."
    
    cat > .env.example << 'EOF'
# GitHub Configuration
GITHUB_TOKEN=your_github_token_here
GITHUB_OWNER=custompowerllc
GITHUB_REPO=mcp_server_gdb

# Agent Configuration
AGENT_NAME=alpha
AGENT_BRANCH=feature/custom-protocol-alpha

# Notification Configuration
SLACK_WEBHOOK_URL=your_slack_webhook_url
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password

# MCP GDB Specific Ports
RUST_SSE_PORT=8081
RUST_HTTP_PORT=8082
NODEJS_HTTP_PORT=3000
NODEJS_WEBSOCKET_PORT=3001
EOF
    
    warning "Please copy .env.example to .env and configure your environment variables"
    success "Environment template created"
}

# Main setup function
main() {
    log "Starting Remote AI Agents Setup..."
    
    check_requirements
    install_nodejs
    install_rust
    install_github_cli
    setup_repository
    create_config_files
    create_agent_scripts
    setup_environment
    
    success "Remote AI Agents setup completed!"
    
    echo ""
    echo "Next steps:"
    echo "1. Copy .env.example to .env and configure your environment variables"
    echo "2. Authenticate with GitHub CLI: gh auth login"
    echo "3. Install Node.js dependencies in each agent directory: npm install"
    echo "4. Review and customize tasks.yaml for your project needs"
    echo "5. Start the orchestrator: cd scripts && node orchestrator.js"
    echo ""
    echo "Agent directories created in: ./agents/"
    echo "Configuration files: tasks.yaml, task-log/tasks.json"
    echo "Scripts: scripts/orchestrator.js, scripts/agent-template.js"
}

# Run main function
main "$@"

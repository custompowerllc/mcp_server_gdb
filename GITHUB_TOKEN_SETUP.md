# GitHub Token Setup for MCP GDB Orchestrator

## 🎯 Quick Setup Guide

### Step 1: Create GitHub Personal Access Token

1. **Navigate to GitHub Token Settings**:
   ```
   GitHub.com → Your Profile → Settings → Developer settings → Personal access tokens → Tokens (classic)
   ```

2. **Generate New Token**:
   - Click **"Generate new token"** → **"Generate new token (classic)"**
   - **Note**: `MCP GDB Orchestrator`
   - **Expiration**: 90 days (recommended for security)

3. **Select Required Permissions**:
   ```
   ✅ repo                    (Full control of private repositories)
     ✅ repo:status           (Access commit status)
     ✅ repo_deployment       (Access deployment status)  
     ✅ public_repo           (Access public repositories)
     ✅ repo:invite           (Access repository invitations)
   ✅ workflow                (Update GitHub Action workflows)
   ✅ admin:repo_hook         (Full control of repository hooks)
   ✅ notifications           (Access notifications)
   ✅ read:user               (Read user profile data)
   ```

4. **Generate and Copy Token**:
   - Click **"Generate token"**
   - **⚠️ CRITICAL**: Copy the token immediately (you won't see it again!)

### Step 2: Configure Repository Secrets (For GitHub Actions)

1. **Go to Repository Settings**:
   ```
   https://github.com/custompowerllc/mcp_server_gdb/settings/secrets/actions
   ```

2. **Add New Secret**:
   - Click **"New repository secret"**
   - **Name**: `GITHUB_TOKEN`
   - **Value**: Paste your personal access token
   - Click **"Add secret"**

### Step 3: Local Environment Setup

1. **Edit the .env file**:
   ```bash
   # Replace the placeholder with your actual token
   GITHUB_TOKEN=ghp_your_actual_token_here_1234567890abcdef
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Run Setup Validation**:
   ```bash
   node setup-orchestrator.js
   ```

## 🔧 Detailed Setup Instructions

### Creating the GitHub Token

#### Visual Guide:
```
GitHub.com
├── Click Profile Picture (top right)
├── Settings
├── Developer settings (bottom left)
├── Personal access tokens
├── Tokens (classic)
├── Generate new token
├── Generate new token (classic)
└── Configure permissions (see below)
```

#### Required Token Permissions:

| Permission | Scope | Why Needed |
|------------|-------|------------|
| `repo` | Full repository control | Create branches, manage PRs, access files |
| `workflow` | GitHub Actions | Update and trigger workflows |
| `admin:repo_hook` | Repository hooks | Manage webhooks for automation |
| `notifications` | Notifications | Access PR and issue notifications |
| `read:user` | User information | Get authenticated user details |

### Environment Configuration

#### Option 1: Using .env file (Recommended for local development)
```bash
# Copy the template
cp .env.example .env

# Edit with your token
nano .env
```

#### Option 2: Export environment variable
```bash
export GITHUB_TOKEN="ghp_your_token_here"
```

#### Option 3: Set in shell profile (persistent)
```bash
# Add to ~/.bashrc or ~/.zshrc
echo 'export GITHUB_TOKEN="ghp_your_token_here"' >> ~/.bashrc
source ~/.bashrc
```

## 🚀 Running the Orchestrator

### Manual Execution
```bash
# Full orchestration cycle
npm start

# Specific actions
npm run assign        # Assign tasks only
npm run manage-prs    # Manage PRs only
npm run update-log    # Update task log only
```

### Automated Execution (GitHub Actions)
The orchestrator runs automatically:
- **Every 2 hours** - Full orchestration
- **On PR events** - PR management
- **On feature branch pushes** - Task updates
- **Manual trigger** - Via GitHub Actions UI

### Validation Commands
```bash
# Validate configuration
npm run validate

# Test GitHub connectivity
node setup-orchestrator.js

# Check token permissions
node -e "
const { Octokit } = require('@octokit/rest');
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
octokit.users.getAuthenticated().then(({data}) => 
  console.log('✅ Token valid for:', data.login)
).catch(err => console.error('❌ Token error:', err.message));
"
```

## 🔍 Troubleshooting

### Common Issues

#### 1. "Invalid GitHub token"
```bash
# Check if token is set
echo $GITHUB_TOKEN

# Verify token format (should start with ghp_)
# Classic tokens: ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# Fine-grained tokens: github_pat_xxxxxxxxxxxxxxxxxxxx
```

#### 2. "Insufficient permissions"
- Verify all required scopes are selected
- Regenerate token with correct permissions
- Check repository access permissions

#### 3. "Repository not found"
```bash
# Test repository access
curl -H "Authorization: token $GITHUB_TOKEN" \
     https://api.github.com/repos/custompowerllc/mcp_server_gdb
```

#### 4. "Rate limit exceeded"
```bash
# Check rate limit status
curl -H "Authorization: token $GITHUB_TOKEN" \
     https://api.github.com/rate_limit
```

### Debug Commands

```bash
# Test orchestrator initialization
node -e "
const TaskOrchestrator = require('./orchestrator.js');
const orchestrator = new TaskOrchestrator();
orchestrator.initialize().then(() => 
  console.log('✅ Orchestrator initialized')
).catch(err => console.error('❌ Error:', err.message));
"

# Validate task configuration
node validate-tasks.js

# Check GitHub API connectivity
node -e "
const { Octokit } = require('@octokit/rest');
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
octokit.repos.get({
  owner: 'custompowerllc',
  repo: 'mcp_server_gdb'
}).then(() => console.log('✅ Repository access OK'))
.catch(err => console.error('❌ Repository access failed:', err.message));
"
```

## 🛡️ Security Best Practices

### Token Security
1. **Never commit tokens to git**
   ```bash
   # Add to .gitignore
   echo ".env" >> .gitignore
   ```

2. **Use repository secrets for GitHub Actions**
   - Never put tokens in workflow files
   - Use `${{ secrets.GITHUB_TOKEN }}` in workflows

3. **Set appropriate expiration**
   - Use 90-day expiration for security
   - Set calendar reminder to renew

4. **Limit token scope**
   - Only grant minimum required permissions
   - Use fine-grained tokens when possible

### Access Control
1. **Repository permissions**
   - Ensure token owner has appropriate repository access
   - Use organization tokens for organization repositories

2. **Branch protection**
   - Enable branch protection on main/develop
   - Require PR reviews for sensitive changes

## 📊 Verification Checklist

### ✅ Pre-Setup Checklist
- [ ] GitHub account with repository access
- [ ] Node.js installed (v16+)
- [ ] Git configured locally
- [ ] Repository cloned locally

### ✅ Token Setup Checklist
- [ ] Personal access token created
- [ ] All required permissions selected
- [ ] Token copied and saved securely
- [ ] Repository secret configured (for GitHub Actions)
- [ ] Local .env file configured

### ✅ Validation Checklist
- [ ] `node setup-orchestrator.js` passes
- [ ] `npm run validate` passes
- [ ] `npm start` initializes successfully
- [ ] GitHub Actions workflow triggers

## 🎯 Success Indicators

When setup is complete, you should see:

```bash
$ node setup-orchestrator.js

🚀 MCP GDB Orchestrator Setup
================================

📋 Step 1: Checking existing configuration...
✅ Found .env file
✅ GitHub token configured in .env
✅ Found package.json
✅ Dependencies installed
✅ Found tasks.yaml
✅ Found tasks.json

🔑 Step 2: Validating GitHub token...
✅ Token valid for user: your-username
✅ Token has repository access

🏠 Step 3: Testing repository access...
✅ Repository access: custompowerllc/mcp_server_gdb
✅ Found 8 branches
✅ Develop branch found
✅ Issue access confirmed

📋 Step 4: Validating task configuration...
✅ Task configuration valid

🤖 Step 5: Testing orchestrator functionality...
✅ Orchestrator initialization successful
✅ Found 2 assignable tasks
   Ready tasks: T001, T002

✅ Setup completed successfully!

🎯 Next Steps:
1. Run: npm start (to start orchestrator)
2. Run: npm run assign (to assign tasks)
3. Check GitHub Actions for automated runs
```

## 📞 Support

If you encounter issues:

1. **Check the troubleshooting section above**
2. **Run the setup validation**: `node setup-orchestrator.js`
3. **Verify token permissions** on GitHub
4. **Check repository access** permissions
5. **Review GitHub Actions logs** for automated runs

The orchestrator is now ready to coordinate your multi-agent development workflow! 🚀

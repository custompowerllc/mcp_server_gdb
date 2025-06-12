#!/usr/bin/env node

/**
 * Orchestrator Setup Script
 * Helps configure and validate the GitHub token setup
 */

const fs = require('fs');
const path = require('path');
const { Octokit } = require('@octokit/rest');

class OrchestratorSetup {
  constructor() {
    this.envFile = '.env';
    this.requiredPermissions = [
      'repo',
      'workflow', 
      'admin:repo_hook',
      'notifications'
    ];
  }

  /**
   * Main setup process
   */
  async setup() {
    console.log('🚀 MCP GDB Orchestrator Setup');
    console.log('================================\n');

    try {
      // Step 1: Check for existing configuration
      await this.checkExistingConfig();
      
      // Step 2: Validate GitHub token
      await this.validateGitHubToken();
      
      // Step 3: Test repository access
      await this.testRepositoryAccess();
      
      // Step 4: Validate task configuration
      await this.validateTaskConfig();
      
      // Step 5: Test orchestrator functionality
      await this.testOrchestrator();
      
      console.log('\n✅ Setup completed successfully!');
      console.log('\n🎯 Next Steps:');
      console.log('1. Run: npm start (to start orchestrator)');
      console.log('2. Run: npm run assign (to assign tasks)');
      console.log('3. Check GitHub Actions for automated runs');
      
    } catch (error) {
      console.error('\n❌ Setup failed:', error.message);
      console.log('\n🔧 Troubleshooting:');
      console.log('1. Verify your GitHub token has correct permissions');
      console.log('2. Check repository access permissions');
      console.log('3. Ensure all dependencies are installed (npm install)');
      process.exit(1);
    }
  }

  /**
   * Check for existing configuration
   */
  async checkExistingConfig() {
    console.log('📋 Step 1: Checking existing configuration...');
    
    // Check for .env file
    if (fs.existsSync(this.envFile)) {
      console.log('✅ Found .env file');
      
      // Load environment variables
      const envContent = fs.readFileSync(this.envFile, 'utf8');
      const hasToken = envContent.includes('GITHUB_TOKEN=') && 
                      !envContent.includes('GITHUB_TOKEN=your_personal_access_token_here');
      
      if (hasToken) {
        console.log('✅ GitHub token configured in .env');
      } else {
        console.log('⚠️  GitHub token not configured in .env');
        console.log('   Please edit .env and add your GitHub token');
      }
    } else {
      console.log('⚠️  No .env file found');
      console.log('   A template .env file has been created');
    }

    // Check for package.json and dependencies
    if (fs.existsSync('package.json')) {
      console.log('✅ Found package.json');
      
      if (fs.existsSync('node_modules')) {
        console.log('✅ Dependencies installed');
      } else {
        console.log('⚠️  Dependencies not installed');
        console.log('   Run: npm install');
      }
    } else {
      console.log('❌ package.json not found');
      throw new Error('package.json is required');
    }

    // Check for task configuration files
    if (fs.existsSync('tasks.yaml')) {
      console.log('✅ Found tasks.yaml');
    } else {
      console.log('❌ tasks.yaml not found');
      throw new Error('tasks.yaml is required');
    }

    if (fs.existsSync('tasks.json')) {
      console.log('✅ Found tasks.json');
    } else {
      console.log('❌ tasks.json not found');
      throw new Error('tasks.json is required');
    }
  }

  /**
   * Validate GitHub token
   */
  async validateGitHubToken() {
    console.log('\n🔑 Step 2: Validating GitHub token...');
    
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error('GITHUB_TOKEN environment variable not set');
    }

    if (token === 'your_personal_access_token_here') {
      throw new Error('Please replace the placeholder token in .env with your actual GitHub token');
    }

    // Test token validity
    const octokit = new Octokit({ auth: token });
    
    try {
      const { data: user } = await octokit.users.getAuthenticated();
      console.log(`✅ Token valid for user: ${user.login}`);
      
      // Check token permissions (basic test)
      const { data: repos } = await octokit.repos.listForAuthenticatedUser({
        per_page: 1
      });
      console.log('✅ Token has repository access');
      
    } catch (error) {
      if (error.status === 401) {
        throw new Error('Invalid GitHub token. Please check your token and try again.');
      } else if (error.status === 403) {
        throw new Error('GitHub token lacks required permissions. Please check token scopes.');
      } else {
        throw new Error(`GitHub API error: ${error.message}`);
      }
    }
  }

  /**
   * Test repository access
   */
  async testRepositoryAccess() {
    console.log('\n🏠 Step 3: Testing repository access...');
    
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const repo = { owner: 'custompowerllc', repo: 'mcp_server_gdb' };
    
    try {
      // Test repository read access
      const { data: repoData } = await octokit.repos.get(repo);
      console.log(`✅ Repository access: ${repoData.full_name}`);
      
      // Test branch access
      const { data: branches } = await octokit.repos.listBranches(repo);
      console.log(`✅ Found ${branches.length} branches`);
      
      // Check for develop branch
      const developBranch = branches.find(b => b.name === 'develop');
      if (developBranch) {
        console.log('✅ Develop branch found');
      } else {
        console.log('⚠️  Develop branch not found');
      }
      
      // Test write access (check if we can create issues)
      try {
        await octokit.issues.list({ ...repo, per_page: 1 });
        console.log('✅ Issue access confirmed');
      } catch (error) {
        console.log('⚠️  Limited issue access');
      }
      
    } catch (error) {
      if (error.status === 404) {
        throw new Error('Repository not found or no access. Check repository name and token permissions.');
      } else {
        throw new Error(`Repository access error: ${error.message}`);
      }
    }
  }

  /**
   * Validate task configuration
   */
  async validateTaskConfig() {
    console.log('\n📋 Step 4: Validating task configuration...');
    
    try {
      // Run the validation script
      const { spawn } = require('child_process');
      
      const validation = await new Promise((resolve, reject) => {
        const validator = spawn('node', ['validate-tasks.js'], {
          stdio: 'pipe'
        });
        
        let output = '';
        validator.stdout.on('data', (data) => {
          output += data.toString();
        });
        
        validator.on('close', (code) => {
          if (code === 0) {
            resolve(output);
          } else {
            reject(new Error('Task validation failed'));
          }
        });
      });
      
      console.log('✅ Task configuration valid');
      
    } catch (error) {
      throw new Error(`Task validation failed: ${error.message}`);
    }
  }

  /**
   * Test orchestrator functionality
   */
  async testOrchestrator() {
    console.log('\n🤖 Step 5: Testing orchestrator functionality...');
    
    try {
      // Test orchestrator initialization
      const TaskOrchestrator = require('./orchestrator.js');
      const orchestrator = new TaskOrchestrator();
      
      await orchestrator.initialize();
      console.log('✅ Orchestrator initialization successful');
      
      // Test task assignment logic (dry run)
      const assignableTasks = orchestrator.getAssignableTasks();
      console.log(`✅ Found ${assignableTasks.length} assignable tasks`);
      
      if (assignableTasks.length > 0) {
        console.log('   Ready tasks:', assignableTasks.map(t => t.task_id).join(', '));
      }
      
    } catch (error) {
      throw new Error(`Orchestrator test failed: ${error.message}`);
    }
  }

  /**
   * Display setup instructions
   */
  displayInstructions() {
    console.log('\n📖 Setup Instructions:');
    console.log('======================');
    console.log('');
    console.log('1. Create GitHub Personal Access Token:');
    console.log('   • Go to GitHub.com → Settings → Developer settings');
    console.log('   • Personal access tokens → Tokens (classic)');
    console.log('   • Generate new token with these permissions:');
    console.log('     - repo (Full control)');
    console.log('     - workflow (Update workflows)');
    console.log('     - admin:repo_hook (Repository hooks)');
    console.log('     - notifications (Access notifications)');
    console.log('');
    console.log('2. Configure Environment:');
    console.log('   • Edit .env file');
    console.log('   • Replace GITHUB_TOKEN=your_personal_access_token_here');
    console.log('   • With your actual token');
    console.log('');
    console.log('3. Install Dependencies:');
    console.log('   • Run: npm install');
    console.log('');
    console.log('4. Run Setup:');
    console.log('   • Run: node setup-orchestrator.js');
    console.log('');
  }
}

// CLI execution
if (require.main === module) {
  // Load environment variables
  if (fs.existsSync('.env')) {
    const envContent = fs.readFileSync('.env', 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value && !key.startsWith('#')) {
        process.env[key.trim()] = value.trim();
      }
    });
  }

  const setup = new OrchestratorSetup();
  
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    setup.displayInstructions();
  } else {
    setup.setup();
  }
}

module.exports = OrchestratorSetup;

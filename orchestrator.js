#!/usr/bin/env node

/**
 * AI Remote Agent Task Orchestrator
 * Manages task assignment, PR oversight, and integration for MCP Server GDB project
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { Octokit } = require('@octokit/rest');

class TaskOrchestrator {
  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    });
    
    this.repo = {
      owner: 'custompowerllc',
      repo: 'mcp_server_gdb'
    };
    
    this.tasksConfig = null;
    this.taskLog = null;
    this.taskLogBranch = 'task-log';
  }

  /**
   * Initialize orchestrator by loading configuration
   */
  async initialize() {
    try {
      console.log('🚀 Initializing Task Orchestrator...');
      
      // Load tasks configuration
      this.tasksConfig = yaml.load(fs.readFileSync('tasks.yaml', 'utf8'));
      console.log(`✅ Loaded ${this.tasksConfig.tasks.length} task definitions`);
      
      // Load or create task log
      await this.loadTaskLog();
      
      // Ensure task-log branch exists
      await this.ensureTaskLogBranch();
      
      console.log('✅ Orchestrator initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize orchestrator:', error.message);
      throw error;
    }
  }

  /**
   * Load task log from file
   */
  async loadTaskLog() {
    try {
      if (fs.existsSync('tasks.json')) {
        this.taskLog = JSON.parse(fs.readFileSync('tasks.json', 'utf8'));
        console.log('✅ Loaded existing task log');
      } else {
        console.log('⚠️  No existing task log found, will create new one');
        this.taskLog = this.createEmptyTaskLog();
      }
    } catch (error) {
      console.error('❌ Failed to load task log:', error.message);
      throw error;
    }
  }

  /**
   * Create empty task log structure
   */
  createEmptyTaskLog() {
    return {
      project: this.tasksConfig.project,
      agents: {},
      tasks: [],
      statistics: {
        total_tasks: 0,
        ready_tasks: 0,
        blocked_tasks: 0,
        in_progress_tasks: 0,
        completed_tasks: 0
      },
      workflow: {
        current_phase: "Initialization",
        next_assignable_tasks: [],
        critical_path: []
      },
      integration: {
        active_prs: [],
        pending_merges: [],
        conflicts: []
      }
    };
  }

  /**
   * Ensure task-log branch exists
   */
  async ensureTaskLogBranch() {
    try {
      await this.octokit.repos.getBranch({
        ...this.repo,
        branch: this.taskLogBranch
      });
      console.log(`✅ Task log branch '${this.taskLogBranch}' exists`);
    } catch (error) {
      if (error.status === 404) {
        console.log(`📝 Creating task log branch '${this.taskLogBranch}'...`);
        await this.createTaskLogBranch();
      } else {
        throw error;
      }
    }
  }

  /**
   * Create task-log branch
   */
  async createTaskLogBranch() {
    try {
      // Get develop branch reference
      const { data: developRef } = await this.octokit.git.getRef({
        ...this.repo,
        ref: 'heads/develop'
      });

      // Create task-log branch
      await this.octokit.git.createRef({
        ...this.repo,
        ref: `refs/heads/${this.taskLogBranch}`,
        sha: developRef.object.sha
      });

      console.log(`✅ Created task log branch '${this.taskLogBranch}'`);
    } catch (error) {
      console.error('❌ Failed to create task log branch:', error.message);
      throw error;
    }
  }

  /**
   * Assign tasks to available agents
   */
  async assignTasks() {
    console.log('\n📋 Starting task assignment process...');
    
    const assignableTasks = this.getAssignableTasks();
    console.log(`📝 Found ${assignableTasks.length} assignable tasks`);
    
    for (const task of assignableTasks) {
      await this.assignTask(task);
    }
    
    await this.updateTaskLog();
    console.log('✅ Task assignment completed');
  }

  /**
   * Get tasks that can be assigned (no blocking dependencies)
   */
  getAssignableTasks() {
    return this.taskLog.tasks.filter(task => {
      // Task must be ready for assignment
      if (task.status !== 'Ready for Assignment') return false;
      
      // Check if all dependencies are completed
      if (task.dependencies && task.dependencies.length > 0) {
        const completedTasks = this.taskLog.tasks
          .filter(t => t.status === 'Completed')
          .map(t => t.task_id);
          
        return task.dependencies.every(dep => completedTasks.includes(dep));
      }
      
      return true;
    });
  }

  /**
   * Assign a specific task to an agent
   */
  async assignTask(task) {
    const agent = this.getAvailableAgent(task.agent);
    
    if (!agent) {
      console.log(`⚠️  Agent ${task.agent} not available for task ${task.task_id}`);
      return false;
    }

    console.log(`📌 Assigning task ${task.task_id} to agent ${task.agent}`);
    
    // Update task status
    task.status = 'Assigned';
    task.assigned_date = new Date().toISOString();
    task.last_updated = new Date().toISOString();
    
    // Update agent status
    this.taskLog.agents[task.agent].current_tasks.push(task.task_id);
    this.taskLog.agents[task.agent].last_activity = new Date().toISOString();
    
    // Create feature branch (simulated)
    console.log(`🌿 Creating feature branch: ${task.branch}`);
    
    return true;
  }

  /**
   * Check if agent is available for assignment
   */
  getAvailableAgent(agentName) {
    const agent = this.taskLog.agents[agentName];
    if (!agent) return null;
    
    const maxConcurrent = this.tasksConfig.agents[agentName]?.max_concurrent_tasks || 1;
    return agent.current_tasks.length < maxConcurrent ? agent : null;
  }

  /**
   * Monitor and manage pull requests
   */
  async managePullRequests() {
    console.log('\n🔍 Monitoring pull requests...');
    
    try {
      const { data: prs } = await this.octokit.pulls.list({
        ...this.repo,
        state: 'open',
        base: 'develop'
      });

      console.log(`📋 Found ${prs.length} open pull requests`);
      
      for (const pr of prs) {
        await this.processPullRequest(pr);
      }
      
    } catch (error) {
      console.error('❌ Failed to manage pull requests:', error.message);
    }
  }

  /**
   * Process individual pull request
   */
  async processPullRequest(pr) {
    console.log(`🔍 Processing PR #${pr.number}: ${pr.title}`);
    
    // Find associated task
    const task = this.taskLog.tasks.find(t => 
      t.branch === pr.head.ref || t.pr === `#${pr.number}`
    );
    
    if (!task) {
      console.log(`⚠️  No task found for PR #${pr.number}`);
      return;
    }

    // Update task with PR information
    task.pr = `#${pr.number}`;
    task.status = 'Under Review';
    task.last_updated = new Date().toISOString();
    
    // Check if PR can be auto-merged
    if (await this.canAutoMerge(pr, task)) {
      await this.autoMergePR(pr, task);
    }
  }

  /**
   * Check if PR can be automatically merged
   */
  async canAutoMerge(pr, task) {
    try {
      // Check if all tests pass
      const { data: checks } = await this.octokit.checks.listForRef({
        ...this.repo,
        ref: pr.head.sha
      });
      
      const allTestsPass = checks.check_runs.every(check => 
        check.status === 'completed' && check.conclusion === 'success'
      );
      
      // Check for merge conflicts
      const hasConflicts = pr.mergeable === false;
      
      // Check if it's a low-risk change (based on files changed)
      const isLowRisk = await this.isLowRiskChange(pr);
      
      return allTestsPass && !hasConflicts && isLowRisk;
    } catch (error) {
      console.error(`❌ Failed to check auto-merge conditions for PR #${pr.number}:`, error.message);
      return false;
    }
  }

  /**
   * Check if PR represents a low-risk change
   */
  async isLowRiskChange(pr) {
    try {
      const { data: files } = await this.octokit.pulls.listFiles({
        ...this.repo,
        pull_number: pr.number
      });
      
      // Consider low-risk: documentation, tests, minor fixes
      const lowRiskPatterns = [
        /\.md$/,
        /test.*\.js$/,
        /test.*\.rs$/,
        /\.json$/,
        /\.yaml$/,
        /\.yml$/
      ];
      
      return files.every(file => 
        lowRiskPatterns.some(pattern => pattern.test(file.filename)) ||
        file.changes < 50
      );
    } catch (error) {
      console.error(`❌ Failed to analyze risk for PR #${pr.number}:`, error.message);
      return false;
    }
  }

  /**
   * Automatically merge a pull request
   */
  async autoMergePR(pr, task) {
    try {
      console.log(`🔄 Auto-merging PR #${pr.number}...`);
      
      await this.octokit.pulls.merge({
        ...this.repo,
        pull_number: pr.number,
        merge_method: 'merge'
      });
      
      // Update task status
      task.status = 'Completed';
      task.completed_date = new Date().toISOString();
      task.integration_status = 'Merged';
      task.last_updated = new Date().toISOString();
      
      // Update agent status
      const agent = this.taskLog.agents[task.agent];
      agent.current_tasks = agent.current_tasks.filter(id => id !== task.task_id);
      agent.completed_tasks += 1;
      
      console.log(`✅ Successfully merged PR #${pr.number}`);
      
    } catch (error) {
      console.error(`❌ Failed to auto-merge PR #${pr.number}:`, error.message);
      task.notes = `Auto-merge failed: ${error.message}`;
    }
  }

  /**
   * Update task log and commit to task-log branch
   */
  async updateTaskLog() {
    try {
      this.taskLog.project.last_updated = new Date().toISOString();
      this.updateStatistics();
      
      // Write to local file
      fs.writeFileSync('tasks.json', JSON.stringify(this.taskLog, null, 2));
      
      // Commit to task-log branch
      await this.commitTaskLog();
      
      console.log('✅ Task log updated successfully');
    } catch (error) {
      console.error('❌ Failed to update task log:', error.message);
    }
  }

  /**
   * Update task statistics
   */
  updateStatistics() {
    const stats = this.taskLog.statistics;
    stats.total_tasks = this.taskLog.tasks.length;
    stats.ready_tasks = this.taskLog.tasks.filter(t => t.status === 'Ready for Assignment').length;
    stats.blocked_tasks = this.taskLog.tasks.filter(t => t.status === 'Blocked').length;
    stats.in_progress_tasks = this.taskLog.tasks.filter(t => ['Assigned', 'In Progress', 'Under Review'].includes(t.status)).length;
    stats.completed_tasks = this.taskLog.tasks.filter(t => t.status === 'Completed').length;
    
    // Update workflow
    this.taskLog.workflow.next_assignable_tasks = this.getAssignableTasks().map(t => t.task_id);
  }

  /**
   * Commit task log to GitHub
   */
  async commitTaskLog() {
    try {
      const content = Buffer.from(JSON.stringify(this.taskLog, null, 2)).toString('base64');
      
      // Get current file SHA if it exists
      let sha = null;
      try {
        const { data: file } = await this.octokit.repos.getContent({
          ...this.repo,
          path: 'tasks.json',
          ref: this.taskLogBranch
        });
        sha = file.sha;
      } catch (error) {
        // File doesn't exist yet
      }
      
      await this.octokit.repos.createOrUpdateFileContents({
        ...this.repo,
        path: 'tasks.json',
        branch: this.taskLogBranch,
        message: `Update task log - ${new Date().toISOString()}`,
        content: content,
        sha: sha
      });
      
    } catch (error) {
      console.error('❌ Failed to commit task log:', error.message);
    }
  }

  /**
   * Main orchestrator execution
   */
  async run() {
    try {
      await this.initialize();
      await this.assignTasks();
      await this.managePullRequests();
      
      console.log('\n📊 Orchestrator Summary:');
      console.log(`📋 Total Tasks: ${this.taskLog.statistics.total_tasks}`);
      console.log(`✅ Completed: ${this.taskLog.statistics.completed_tasks}`);
      console.log(`🔄 In Progress: ${this.taskLog.statistics.in_progress_tasks}`);
      console.log(`📝 Ready: ${this.taskLog.statistics.ready_tasks}`);
      console.log(`🚫 Blocked: ${this.taskLog.statistics.blocked_tasks}`);
      
    } catch (error) {
      console.error('❌ Orchestrator execution failed:', error.message);
      process.exit(1);
    }
  }
}

// CLI execution
if (require.main === module) {
  const orchestrator = new TaskOrchestrator();
  orchestrator.run();
}

module.exports = TaskOrchestrator;

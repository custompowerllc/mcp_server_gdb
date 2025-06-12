#!/usr/bin/env node

/**
 * Task Configuration Validator
 * Validates tasks.yaml and tasks.json for consistency and correctness
 */

const fs = require('fs');
const yaml = require('js-yaml');

class TaskValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.tasksConfig = null;
    this.taskLog = null;
  }

  /**
   * Load configuration files
   */
  loadFiles() {
    try {
      // Load tasks.yaml
      if (!fs.existsSync('tasks.yaml')) {
        this.errors.push('tasks.yaml file not found');
        return false;
      }
      this.tasksConfig = yaml.load(fs.readFileSync('tasks.yaml', 'utf8'));

      // Load tasks.json
      if (!fs.existsSync('tasks.json')) {
        this.warnings.push('tasks.json file not found - will be created by orchestrator');
      } else {
        this.taskLog = JSON.parse(fs.readFileSync('tasks.json', 'utf8'));
      }

      return true;
    } catch (error) {
      this.errors.push(`Failed to load configuration files: ${error.message}`);
      return false;
    }
  }

  /**
   * Validate tasks.yaml structure
   */
  validateTasksConfig() {
    console.log('🔍 Validating tasks.yaml...');

    // Check required top-level sections
    const requiredSections = ['project', 'agents', 'tasks'];
    for (const section of requiredSections) {
      if (!this.tasksConfig[section]) {
        this.errors.push(`Missing required section: ${section}`);
      }
    }

    // Validate project section
    if (this.tasksConfig.project) {
      const requiredProjectFields = ['name', 'repository', 'base_branch'];
      for (const field of requiredProjectFields) {
        if (!this.tasksConfig.project[field]) {
          this.errors.push(`Missing required project field: ${field}`);
        }
      }
    }

    // Validate agents section
    if (this.tasksConfig.agents) {
      for (const [agentName, agent] of Object.entries(this.tasksConfig.agents)) {
        if (!agent.expertise || !Array.isArray(agent.expertise)) {
          this.errors.push(`Agent ${agentName} missing expertise array`);
        }
        if (!agent.specialization) {
          this.warnings.push(`Agent ${agentName} missing specialization description`);
        }
        if (!agent.max_concurrent_tasks || agent.max_concurrent_tasks < 1) {
          this.warnings.push(`Agent ${agentName} has invalid max_concurrent_tasks`);
        }
      }
    }

    // Validate tasks section
    if (this.tasksConfig.tasks) {
      this.validateTasks();
    }
  }

  /**
   * Validate individual tasks
   */
  validateTasks() {
    const taskIds = new Set();
    const agentNames = Object.keys(this.tasksConfig.agents || {});

    for (const [index, task] of this.tasksConfig.tasks.entries()) {
      const taskPrefix = `Task ${index + 1} (${task.id || 'unknown'})`;

      // Check required fields
      const requiredFields = ['id', 'title', 'description', 'agent', 'priority', 'feature', 'branch'];
      for (const field of requiredFields) {
        if (!task[field]) {
          this.errors.push(`${taskPrefix}: Missing required field '${field}'`);
        }
      }

      // Check task ID uniqueness
      if (task.id) {
        if (taskIds.has(task.id)) {
          this.errors.push(`${taskPrefix}: Duplicate task ID '${task.id}'`);
        }
        taskIds.add(task.id);
      }

      // Check agent exists
      if (task.agent && !agentNames.includes(task.agent)) {
        this.errors.push(`${taskPrefix}: Unknown agent '${task.agent}'`);
      }

      // Check priority values
      const validPriorities = ['low', 'medium', 'high', 'critical'];
      if (task.priority && !validPriorities.includes(task.priority)) {
        this.errors.push(`${taskPrefix}: Invalid priority '${task.priority}'. Must be one of: ${validPriorities.join(', ')}`);
      }

      // Check dependencies
      if (task.dependencies) {
        if (!Array.isArray(task.dependencies)) {
          this.errors.push(`${taskPrefix}: Dependencies must be an array`);
        } else {
          for (const dep of task.dependencies) {
            if (!taskIds.has(dep) && !this.tasksConfig.tasks.some(t => t.id === dep)) {
              this.errors.push(`${taskPrefix}: Unknown dependency '${dep}'`);
            }
          }
        }
      }

      // Check estimated hours
      if (task.estimated_hours && (typeof task.estimated_hours !== 'number' || task.estimated_hours <= 0)) {
        this.warnings.push(`${taskPrefix}: Invalid estimated_hours value`);
      }

      // Check branch naming convention
      if (task.branch && task.agent) {
        const expectedPrefix = `feature/${task.feature.toLowerCase().replace(/\s+/g, '-')}-${task.agent.toLowerCase()}`;
        if (!task.branch.startsWith('feature/')) {
          this.warnings.push(`${taskPrefix}: Branch should start with 'feature/'`);
        }
        if (!task.branch.includes(task.agent.toLowerCase())) {
          this.warnings.push(`${taskPrefix}: Branch should include agent name`);
        }
      }

      // Check acceptance criteria
      if (!task.acceptance_criteria || !Array.isArray(task.acceptance_criteria) || task.acceptance_criteria.length === 0) {
        this.warnings.push(`${taskPrefix}: Missing or empty acceptance criteria`);
      }
    }
  }

  /**
   * Validate dependency graph for cycles
   */
  validateDependencyGraph() {
    console.log('🔍 Validating dependency graph...');

    const tasks = this.tasksConfig.tasks || [];
    const visited = new Set();
    const recursionStack = new Set();

    const hasCycle = (taskId) => {
      if (recursionStack.has(taskId)) {
        return true; // Cycle detected
      }
      if (visited.has(taskId)) {
        return false; // Already processed
      }

      visited.add(taskId);
      recursionStack.add(taskId);

      const task = tasks.find(t => t.id === taskId);
      if (task && task.dependencies) {
        for (const dep of task.dependencies) {
          if (hasCycle(dep)) {
            return true;
          }
        }
      }

      recursionStack.delete(taskId);
      return false;
    };

    for (const task of tasks) {
      if (task.id && !visited.has(task.id)) {
        if (hasCycle(task.id)) {
          this.errors.push(`Circular dependency detected involving task ${task.id}`);
        }
      }
    }
  }

  /**
   * Validate task log consistency
   */
  validateTaskLog() {
    if (!this.taskLog) {
      console.log('⚠️  No task log to validate');
      return;
    }

    console.log('🔍 Validating tasks.json...');

    // Check if all tasks from config are in log
    const configTaskIds = this.tasksConfig.tasks.map(t => t.id);
    const logTaskIds = this.taskLog.tasks.map(t => t.task_id);

    for (const taskId of configTaskIds) {
      if (!logTaskIds.includes(taskId)) {
        this.warnings.push(`Task ${taskId} from config not found in task log`);
      }
    }

    // Check for orphaned tasks in log
    for (const taskId of logTaskIds) {
      if (!configTaskIds.includes(taskId)) {
        this.warnings.push(`Task ${taskId} in log not found in config`);
      }
    }

    // Validate agent consistency
    const configAgents = Object.keys(this.tasksConfig.agents || {});
    const logAgents = Object.keys(this.taskLog.agents || {});

    for (const agent of configAgents) {
      if (!logAgents.includes(agent)) {
        this.warnings.push(`Agent ${agent} from config not found in task log`);
      }
    }
  }

  /**
   * Validate workload distribution
   */
  validateWorkloadDistribution() {
    console.log('🔍 Validating workload distribution...');

    const agentWorkload = {};
    
    // Initialize agent workload
    for (const agentName of Object.keys(this.tasksConfig.agents || {})) {
      agentWorkload[agentName] = {
        taskCount: 0,
        totalHours: 0,
        priorities: { high: 0, medium: 0, low: 0, critical: 0 }
      };
    }

    // Calculate workload
    for (const task of this.tasksConfig.tasks || []) {
      if (task.agent && agentWorkload[task.agent]) {
        agentWorkload[task.agent].taskCount++;
        agentWorkload[task.agent].totalHours += task.estimated_hours || 0;
        if (task.priority && agentWorkload[task.agent].priorities[task.priority] !== undefined) {
          agentWorkload[task.agent].priorities[task.priority]++;
        }
      }
    }

    // Check for imbalanced workload
    const totalTasks = this.tasksConfig.tasks.length;
    const agentCount = Object.keys(agentWorkload).length;
    const averageTasksPerAgent = totalTasks / agentCount;

    for (const [agent, workload] of Object.entries(agentWorkload)) {
      if (workload.taskCount === 0) {
        this.warnings.push(`Agent ${agent} has no assigned tasks`);
      } else if (workload.taskCount > averageTasksPerAgent * 1.5) {
        this.warnings.push(`Agent ${agent} may be overloaded with ${workload.taskCount} tasks (${workload.totalHours}h)`);
      }
    }
  }

  /**
   * Run all validations
   */
  validate() {
    console.log('🚀 Starting task configuration validation...\n');

    if (!this.loadFiles()) {
      return false;
    }

    this.validateTasksConfig();
    this.validateDependencyGraph();
    this.validateTaskLog();
    this.validateWorkloadDistribution();

    return this.reportResults();
  }

  /**
   * Report validation results
   */
  reportResults() {
    console.log('\n📊 Validation Results:');
    console.log('======================');

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('✅ All validations passed!');
      return true;
    }

    if (this.errors.length > 0) {
      console.log(`\n❌ Errors (${this.errors.length}):`);
      for (const error of this.errors) {
        console.log(`   • ${error}`);
      }
    }

    if (this.warnings.length > 0) {
      console.log(`\n⚠️  Warnings (${this.warnings.length}):`);
      for (const warning of this.warnings) {
        console.log(`   • ${warning}`);
      }
    }

    console.log(`\n📈 Summary:`);
    console.log(`   Tasks defined: ${this.tasksConfig?.tasks?.length || 0}`);
    console.log(`   Agents defined: ${Object.keys(this.tasksConfig?.agents || {}).length}`);
    console.log(`   Errors: ${this.errors.length}`);
    console.log(`   Warnings: ${this.warnings.length}`);

    return this.errors.length === 0;
  }
}

// CLI execution
if (require.main === module) {
  const validator = new TaskValidator();
  const isValid = validator.validate();
  process.exit(isValid ? 0 : 1);
}

module.exports = TaskValidator;

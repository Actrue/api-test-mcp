// 任务执行监控系统 - 实时监控页面功能

class Monitor {
    constructor() {
        this.planUuid = this.getPlanUuidFromUrl();
        this.plan = null;
        this.tasks = [];
        this.logs = [];
        this.refreshInterval = null;
        this.logRefreshInterval = null;
        this.isExecuting = false;
        this.init();
    }

    async init() {
        await this.loadPlan();
        await this.loadTasks();
        this.bindEvents();
        this.startAutoRefresh();
        this.initializeLogs();
    }

    getPlanUuidFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('plan');
    }

    async loadPlan() {
        if (!this.planUuid) {
            document.getElementById('monitor-title').textContent = '全局监控';
            document.getElementById('breadcrumb-plan-name').textContent = '全局监控';
            return;
        }
        
        try {
            const response = await fetch('/api/test-plans');
            const plans = await response.json();
            this.plan = plans.find(p => p.uuid === this.planUuid);
            
            if (this.plan) {
                document.getElementById('monitor-title').textContent = `${this.plan.name} - 实时监控`;
                document.getElementById('breadcrumb-plan-name').textContent = this.plan.name;
            }
        } catch (error) {
            console.error('加载计划信息失败:', error);
        }
    }

    async loadTasks() {
        try {
            let tasks = [];
            
            if (this.planUuid) {
                // 加载特定计划的任务
                const response = await fetch(`/api/test-plans?uuid=${this.planUuid}`);
                tasks = await response.json();
            } else {
                // 加载所有任务
                const plansResponse = await fetch('/api/test-plans');
                const plans = await plansResponse.json();
                
                for (const plan of plans) {
                    const tasksResponse = await fetch(`/api/test-plans?uuid=${plan.uuid}`);
                    const planTasks = await tasksResponse.json();
                    tasks = tasks.concat(planTasks.map(task => ({ ...task, planName: plan.name })));
                }
            }
            
            this.tasks = tasks;
            this.updateProgress();
            this.updateStats();
        } catch (error) {
            console.error('加载任务失败:', error);
            this.showError('加载任务失败');
        }
    }

    updateProgress() {
        const stats = this.calculateStats();
        const progressPercentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
        
        // 更新进度条
        const progressBar = document.getElementById('progress-bar');
        progressBar.style.width = `${progressPercentage}%`;
        
        // 更新进度文本
        document.getElementById('progress-text').textContent = `${stats.completed}/${stats.total} (${progressPercentage}%)`;
        
        // 更新进度详情
        document.getElementById('progress-completed').textContent = stats.completed;
        document.getElementById('progress-running').textContent = stats.running;
        document.getElementById('progress-failed').textContent = stats.failed;
        document.getElementById('progress-pending').textContent = stats.pending;
        
        // 更新执行状态
        this.isExecuting = stats.running > 0;
        const statusElement = document.getElementById('execution-status');
        if (this.isExecuting) {
            statusElement.textContent = '执行中';
            statusElement.className = 'status-badge status-running';
        } else if (stats.completed === stats.total && stats.total > 0) {
            statusElement.textContent = '已完成';
            statusElement.className = 'status-badge status-completed';
        } else {
            statusElement.textContent = '待执行';
            statusElement.className = 'status-badge status-pending';
        }
    }

    updateStats() {
        const stats = this.calculateStats();
        
        // 更新统计图表
        this.updateChart(stats);
        
        // 更新统计摘要
        document.getElementById('stat-total').textContent = stats.total;
        document.getElementById('stat-success-rate').textContent = stats.total > 0 ? `${Math.round((stats.completed / stats.total) * 100)}%` : '0%';
        document.getElementById('stat-avg-response').textContent = this.calculateAverageResponseTime() + 'ms';
        document.getElementById('stat-error-rate').textContent = stats.total > 0 ? `${Math.round((stats.failed / stats.total) * 100)}%` : '0%';
    }

    calculateStats() {
        const stats = {
            total: this.tasks.length,
            completed: 0,
            running: 0,
            failed: 0,
            pending: 0
        };
        
        this.tasks.forEach(task => {
            switch (task.status) {
                case 'completed':
                    stats.completed++;
                    break;
                case 'running':
                    stats.running++;
                    break;
                case 'failed':
                case 'error':
                    stats.failed++;
                    break;
                default:
                    stats.pending++;
            }
        });
        
        return stats;
    }

    calculateAverageResponseTime() {
        const completedTasks = this.tasks.filter(task => task.status === 'completed' && task.response_time);
        if (completedTasks.length === 0) return 0;
        
        const totalTime = completedTasks.reduce((sum, task) => sum + (task.response_time || 0), 0);
        return Math.round(totalTime / completedTasks.length);
    }

    updateChart(stats) {
        const maxHeight = 100;
        const maxValue = Math.max(stats.completed, stats.failed, stats.pending, 1);
        
        // 更新图表条
        const successBar = document.getElementById('chart-success');
        const errorBar = document.getElementById('chart-error');
        const pendingBar = document.getElementById('chart-pending');
        
        successBar.style.height = `${(stats.completed / maxValue) * maxHeight}px`;
        errorBar.style.height = `${(stats.failed / maxValue) * maxHeight}px`;
        pendingBar.style.height = `${(stats.pending / maxValue) * maxHeight}px`;
        
        // 更新标签
        document.getElementById('chart-success-label').textContent = stats.completed;
        document.getElementById('chart-error-label').textContent = stats.failed;
        document.getElementById('chart-pending-label').textContent = stats.pending;
    }

    initializeLogs() {
        this.addLog('info', '监控系统已启动');
        if (this.planUuid) {
            this.addLog('info', `开始监控计划: ${this.plan ? this.plan.name : this.planUuid}`);
        } else {
            this.addLog('info', '开始全局监控');
        }
        
        // 开始日志刷新
        this.logRefreshInterval = setInterval(() => {
            this.checkForUpdates();
        }, 5000);
    }

    addLog(type, message) {
        const timestamp = new Date().toLocaleTimeString('zh-CN');
        const log = { type, message, timestamp };
        this.logs.unshift(log);
        
        // 限制日志数量
        if (this.logs.length > 100) {
            this.logs = this.logs.slice(0, 100);
        }
        
        this.updateLogsDisplay();
    }

    updateLogsDisplay() {
        const container = document.getElementById('logs-container');
        container.innerHTML = '';
        
        this.logs.forEach(log => {
            const logEntry = document.createElement('div');
            logEntry.className = `log-entry ${log.type}`;
            logEntry.innerHTML = `
                <span class="log-time">${log.timestamp}</span>
                <span class="log-message">${this.escapeHtml(log.message)}</span>
            `;
            container.appendChild(logEntry);
        });
        
        // 滚动到最新日志
        container.scrollTop = 0;
    }

    async checkForUpdates() {
        const previousTasksCount = this.tasks.length;
        const previousStats = this.calculateStats();
        
        await this.loadTasks();
        
        const currentStats = this.calculateStats();
        
        // 检查状态变化并添加日志
        if (currentStats.completed > previousStats.completed) {
            const diff = currentStats.completed - previousStats.completed;
            this.addLog('success', `${diff} 个任务执行完成`);
        }
        
        if (currentStats.failed > previousStats.failed) {
            const diff = currentStats.failed - previousStats.failed;
            this.addLog('error', `${diff} 个任务执行失败`);
        }
        
        if (currentStats.running > previousStats.running) {
            const diff = currentStats.running - previousStats.running;
            this.addLog('info', `${diff} 个任务开始执行`);
        }
        
        // 检查执行状态变化
        if (!this.isExecuting && currentStats.running > 0) {
            this.addLog('info', '开始执行任务');
        } else if (this.isExecuting && currentStats.running === 0) {
            if (currentStats.completed === currentStats.total && currentStats.total > 0) {
                this.addLog('success', '所有任务执行完成');
            } else {
                this.addLog('info', '任务执行已停止');
            }
        }
    }

    bindEvents() {
        // 返回按钮
        document.getElementById('back-btn').addEventListener('click', () => {
            if (this.planUuid) {
                window.location.href = `/plan/${this.planUuid}`;
            } else {
                window.location.href = '/';
            }
        });
        
        // 刷新按钮
        document.getElementById('refresh-btn').addEventListener('click', () => {
            this.refresh();
        });
        
        // 开始执行按钮
        document.getElementById('start-btn').addEventListener('click', () => {
            this.startExecution();
        });
        
        // 停止执行按钮
        document.getElementById('stop-btn').addEventListener('click', () => {
            this.stopExecution();
        });
        
        // 清空日志按钮
        document.getElementById('clear-logs-btn').addEventListener('click', () => {
            this.clearLogs();
        });
    }

    async refresh() {
        const refreshBtn = document.getElementById('refresh-btn');
        const originalText = refreshBtn.textContent;
        
        refreshBtn.textContent = '刷新中...';
        refreshBtn.disabled = true;
        
        try {
            await this.loadTasks();
            this.addLog('info', '数据已刷新');
        } catch (error) {
            this.addLog('error', '刷新失败');
        } finally {
            refreshBtn.textContent = originalText;
            refreshBtn.disabled = false;
        }
    }

    async startExecution() {
        if (!this.planUuid) {
            this.showError('请选择特定计划进行执行');
            return;
        }
        
        const startBtn = document.getElementById('start-btn');
        const originalText = startBtn.textContent;
        
        startBtn.textContent = '启动中...';
        startBtn.disabled = true;
        
        try {
            const response = await fetch(`/api/test-plans/${this.planUuid}/execute`, {
                method: 'POST'
            });
            
            if (response.ok) {
                this.addLog('success', '计划执行已开始');
                // 立即刷新数据
                setTimeout(() => {
                    this.loadTasks();
                }, 1000);
            } else {
                throw new Error('执行失败');
            }
        } catch (error) {
            console.error('启动执行失败:', error);
            this.addLog('error', '启动执行失败');
        } finally {
            startBtn.textContent = originalText;
            startBtn.disabled = false;
        }
    }

    stopExecution() {
        // 这里可以添加停止执行的逻辑
        this.addLog('warning', '停止执行功能待实现');
    }

    clearLogs() {
        this.logs = [];
        this.updateLogsDisplay();
        this.addLog('info', '日志已清空');
    }

    startAutoRefresh() {
        // 每10秒自动刷新一次
        this.refreshInterval = setInterval(() => {
            this.loadTasks();
        }, 10000);
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
        
        if (this.logRefreshInterval) {
            clearInterval(this.logRefreshInterval);
            this.logRefreshInterval = null;
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showSuccess(message) {
        this.showToast(message, 'success');
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showToast(message, type = 'info') {
        // 创建toast元素
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        if (type === 'success') {
            toast.style.backgroundColor = '#10b981';
        } else if (type === 'error') {
            toast.style.backgroundColor = '#ef4444';
        } else {
            toast.style.backgroundColor = '#3b82f6';
        }
        
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // 3秒后自动移除
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    destroy() {
        this.stopAutoRefresh();
    }
}

// 初始化监控页面
let monitor;
document.addEventListener('DOMContentLoaded', () => {
    monitor = new Monitor();
});

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
    if (monitor) {
        monitor.destroy();
    }
});
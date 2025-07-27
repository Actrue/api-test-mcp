// 任务执行监控系统 - 计划详情页面功能

class PlanDetail {
    constructor() {
        this.planUuid = this.getPlanUuidFromUrl();
        this.plan = null;
        this.tasks = [];
        this.refreshInterval = null;
        this.selectedTask = null;
        this.init();
    }

    async init() {
        if (!this.planUuid) {
            this.showError('无效的计划ID');
            return;
        }
        
        await this.loadPlan();
        await this.loadTasks();
        this.bindEvents();
        this.startAutoRefresh();
    }

    getPlanUuidFromUrl() {
        const pathParts = window.location.pathname.split('/');
        return pathParts[pathParts.length - 1];
    }

    async loadPlan() {
        try {
            const response = await fetch('/api/test-plans');
            const plans = await response.json();
            this.plan = plans.find(p => p.uuid === this.planUuid);
            
            if (!this.plan) {
                throw new Error('计划不存在');
            }
            
            this.updatePlanHeader();
        } catch (error) {
            console.error('加载计划信息失败:', error);
            this.showError('加载计划信息失败');
        }
    }

    async loadTasks() {
        try {
            const response = await fetch(`/api/test-plans?uuid=${this.planUuid}`);
            this.tasks = await response.json();
            this.updateTaskStats();
            this.updateTasksGrid();
        } catch (error) {
            console.error('加载任务列表失败:', error);
            this.showError('加载任务列表失败');
        }
    }

    updatePlanHeader() {
        if (!this.plan) return;
        
        document.getElementById('plan-name').textContent = this.plan.name;
        document.getElementById('plan-description').textContent = this.plan.description || '无描述';
        document.getElementById('plan-status').textContent = this.getStatusText(this.plan.status);
        document.getElementById('plan-created').textContent = this.formatDate(this.plan.created_at);
        document.getElementById('plan-updated').textContent = this.formatDate(this.plan.updated_at);
        
        // 更新面包屑
        document.getElementById('breadcrumb-plan-name').textContent = this.plan.name;
    }

    updateTaskStats() {
        const stats = this.calculateTaskStats();
        
        document.getElementById('total-tasks').textContent = stats.total;
        document.getElementById('completed-tasks').textContent = stats.completed;
        document.getElementById('failed-tasks').textContent = stats.failed;
        document.getElementById('pending-tasks').textContent = stats.pending;
    }

    calculateTaskStats() {
        const stats = {
            total: this.tasks.length,
            completed: 0,
            failed: 0,
            pending: 0,
            running: 0
        };
        
        this.tasks.forEach(task => {
            switch (task.status) {
                case 'completed':
                    stats.completed++;
                    break;
                case 'failed':
                case 'error':
                    stats.failed++;
                    break;
                case 'running':
                    stats.running++;
                    break;
                default:
                    stats.pending++;
            }
        });
        
        return stats;
    }

    updateTasksGrid() {
        const container = document.getElementById('tasks-grid');
        container.innerHTML = '';
        
        if (this.tasks.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; opacity: 0.7;">
                    <h3>暂无任务</h3>
                    <p>该测试计划还没有添加任何任务</p>
                </div>
            `;
            return;
        }
        
        this.tasks.forEach(task => {
            const taskCard = this.createTaskCard(task);
            container.appendChild(taskCard);
        });
    }

    createTaskCard(task) {
        const card = document.createElement('div');
        card.className = 'task-card';
        card.onclick = () => this.showTaskDetail(task);
        
        const statusClass = this.getStatusClass(task.status);
        const methodClass = task.method ? task.method.toUpperCase() : 'GET';
        
        card.innerHTML = `
            <div class="task-header">
                <div class="task-name">${this.escapeHtml(task.name)}</div>
                <div class="task-status">
                    <span class="status-dot ${statusClass}"></span>
                    <span>${this.getStatusText(task.status)}</span>
                </div>
            </div>
            <div class="task-method ${methodClass}">${methodClass}</div>
            <div class="task-url">${this.escapeHtml(task.url || '')}</div>
            <div style="margin-top: 1rem; font-size: 0.875rem; opacity: 0.7;">
                <div>创建时间: ${this.formatDate(task.created_at)}</div>
                ${task.executed_at ? `<div>执行时间: ${this.formatDate(task.executed_at)}</div>` : ''}
                ${task.response_time ? `<div>响应时间: ${task.response_time}ms</div>` : ''}
            </div>
        `;
        
        return card;
    }

    showTaskDetail(task) {
        this.selectedTask = task;
        
        // 更新模态框内容
        document.getElementById('task-detail-name').textContent = task.name;
        document.getElementById('task-detail-method').textContent = task.method || 'GET';
        document.getElementById('task-detail-method').className = `task-method ${(task.method || 'GET').toUpperCase()}`;
        document.getElementById('task-detail-url').textContent = task.url || '';
        document.getElementById('task-detail-status').textContent = this.getStatusText(task.status);
        document.getElementById('task-detail-status').className = `status-badge status-${this.getStatusClass(task.status)}`;
        
        // 更新请求详情
        document.getElementById('task-detail-headers').textContent = task.headers ? JSON.stringify(JSON.parse(task.headers), null, 2) : '无';
        document.getElementById('task-detail-body').textContent = task.body || '无';
        
        // 更新响应详情
        if (task.response_status) {
            document.getElementById('task-detail-response-status').textContent = task.response_status;
            document.getElementById('task-detail-response-time').textContent = task.response_time ? `${task.response_time}ms` : '-';
            document.getElementById('task-detail-response-headers').textContent = task.response_headers ? JSON.stringify(JSON.parse(task.response_headers), null, 2) : '无';
            document.getElementById('task-detail-response-body').textContent = task.response_body || '无';
            document.getElementById('response-section').style.display = 'block';
        } else {
            document.getElementById('response-section').style.display = 'none';
        }
        
        // 更新总结
        document.getElementById('task-detail-summary').value = task.summary || '';
        
        // 显示模态框
        document.getElementById('task-detail-modal').style.display = 'block';
    }

    bindEvents() {
        // 返回按钮
        document.getElementById('back-btn').addEventListener('click', () => {
            window.location.href = '/';
        });
        
        // 刷新按钮
        document.getElementById('refresh-btn').addEventListener('click', () => {
            this.refresh();
        });
        
        // 执行计划按钮
        document.getElementById('execute-btn').addEventListener('click', () => {
            this.executePlan();
        });
        
        // 实时监控按钮
        document.getElementById('monitor-btn').addEventListener('click', () => {
            window.location.href = `/monitor?plan=${this.planUuid}`;
        });
        
        // 模态框关闭
        document.querySelector('.close').addEventListener('click', () => {
            document.getElementById('task-detail-modal').style.display = 'none';
        });
        
        // 点击模态框外部关闭
        window.addEventListener('click', (event) => {
            const modal = document.getElementById('task-detail-modal');
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
        
        // 保存总结按钮
        document.getElementById('save-summary-btn').addEventListener('click', () => {
            this.saveSummary();
        });
    }

    async refresh() {
        const refreshBtn = document.getElementById('refresh-btn');
        const originalText = refreshBtn.textContent;
        
        refreshBtn.textContent = '刷新中...';
        refreshBtn.disabled = true;
        
        try {
            await this.loadPlan();
            await this.loadTasks();
            this.showSuccess('数据已刷新');
        } catch (error) {
            this.showError('刷新失败');
        } finally {
            refreshBtn.textContent = originalText;
            refreshBtn.disabled = false;
        }
    }

    async executePlan() {
        const executeBtn = document.getElementById('execute-btn');
        const originalText = executeBtn.textContent;
        
        executeBtn.textContent = '执行中...';
        executeBtn.disabled = true;
        
        try {
            const response = await fetch(`/api/test-plans/${this.planUuid}/execute`, {
                method: 'POST'
            });
            
            if (response.ok) {
                this.showSuccess('计划执行已开始');
                // 刷新数据
                setTimeout(() => {
                    this.refresh();
                }, 1000);
            } else {
                throw new Error('执行失败');
            }
        } catch (error) {
            console.error('执行计划失败:', error);
            this.showError('执行计划失败');
        } finally {
            executeBtn.textContent = originalText;
            executeBtn.disabled = false;
        }
    }

    async saveSummary() {
        if (!this.selectedTask) return;
        
        const summary = document.getElementById('task-detail-summary').value;
        const saveBtn = document.getElementById('save-summary-btn');
        const originalText = saveBtn.textContent;
        
        saveBtn.textContent = '保存中...';
        saveBtn.disabled = true;
        
        try {
            const response = await fetch(`/api/tasks/${this.selectedTask.uuid}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ summary })
            });
            
            if (response.ok) {
                this.showSuccess('总结已保存');
                // 更新本地数据
                const taskIndex = this.tasks.findIndex(t => t.uuid === this.selectedTask.uuid);
                if (taskIndex !== -1) {
                    this.tasks[taskIndex].summary = summary;
                }
            } else {
                throw new Error('保存失败');
            }
        } catch (error) {
            console.error('保存总结失败:', error);
            this.showError('保存总结失败');
        } finally {
            saveBtn.textContent = originalText;
            saveBtn.disabled = false;
        }
    }

    startAutoRefresh() {
        // 每15秒自动刷新一次
        this.refreshInterval = setInterval(() => {
            this.loadTasks();
        }, 15000);
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    getStatusClass(status) {
        const statusMap = {
            'pending': 'pending',
            'running': 'running',
            'completed': 'success',
            'failed': 'error',
            'error': 'error',
            'paused': 'pending'
        };
        return statusMap[status] || 'pending';
    }

    getStatusText(status) {
        const statusMap = {
            'pending': '待执行',
            'running': '执行中',
            'completed': '已完成',
            'failed': '失败',
            'error': '错误',
            'paused': '已暂停'
        };
        return statusMap[status] || '未知';
    }

    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
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

// 初始化计划详情页面
let planDetail;
document.addEventListener('DOMContentLoaded', () => {
    planDetail = new PlanDetail();
});

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
    if (planDetail) {
        planDetail.destroy();
    }
});
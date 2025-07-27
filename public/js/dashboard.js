// 任务执行监控系统 - 首页功能

class Dashboard {
    constructor() {
        this.stats = {
            totalPlans: 0,
            totalTasks: 0,
            completionRate: 0,
            runningTasks: 0
        };
        this.plans = [];
        this.refreshInterval = null;
        this.init();
    }

    async init() {
        await this.loadStats();
        await this.loadPlans();
        this.bindEvents();
        this.startAutoRefresh();
    }

    async loadStats() {
        try {
            // 获取所有测试计划
            const plansResponse = await fetch('/api/test-plans');
            const plansResult = await plansResponse.json();
            
            // 处理API返回的数据格式
            const plans = plansResult.data || [];
            
            let totalTasks = 0;
            let completedTasks = 0;
            let runningTasks = 0;
            
            // 统计任务数据
            for (const plan of plans) {
                const tasksResponse = await fetch(`/api/test-plans?uuid=${plan.uuid}`);
                const tasksResult = await tasksResponse.json();
                const tasks = tasksResult.data || [];
                
                totalTasks += tasks.length;
                
                tasks.forEach(task => {
                    if (task.status === 'completed') {
                        completedTasks++;
                    } else if (task.status === 'running') {
                        runningTasks++;
                    }
                });
            }
            
            this.stats = {
                totalPlans: plans.length,
                totalTasks: totalTasks,
                completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
                runningTasks: runningTasks
            };
            
            this.updateStatsDisplay();
        } catch (error) {
            console.error('加载统计数据失败:', error);
            this.showError('加载统计数据失败');
        }
    }

    async loadPlans() {
        try {
            const response = await fetch('/api/test-plans');
            const result = await response.json();
            this.plans = result.data || [];
            this.updatePlansTable();
        } catch (error) {
            console.error('加载测试计划失败:', error);
            this.showError('加载测试计划失败');
        }
    }

    updateStatsDisplay() {
        const totalPlansEl = document.getElementById('total-plans');
        const totalTasksEl = document.getElementById('total-tasks');
        const completionRateEl = document.getElementById('completion-rate');
        const runningTasksEl = document.getElementById('running-tasks');
        
        if (totalPlansEl) totalPlansEl.textContent = this.stats.totalPlans;
        if (totalTasksEl) totalTasksEl.textContent = this.stats.totalTasks;
        if (completionRateEl) completionRateEl.textContent = `${this.stats.completionRate}%`;
        if (runningTasksEl) runningTasksEl.textContent = this.stats.runningTasks;
    }

    updatePlansTable() {
        const tbody = document.getElementById('plans-table-body');
        if (!tbody) {
            console.error('找不到plans-table-body元素');
            return;
        }
        tbody.innerHTML = '';
        
        if (this.plans.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 2rem; opacity: 0.7;">
                        暂无测试计划
                    </td>
                </tr>
            `;
            return;
        }
        
        this.plans.forEach(plan => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div style="font-weight: bold;">${this.escapeHtml(plan.name)}</div>
                    <div style="font-size: 0.875rem; opacity: 0.7;">${this.escapeHtml(plan.description || '')}</div>
                </td>
                <td>
                    <span class="status-badge status-${plan.status || 'pending'}">
                        ${this.getStatusText(plan.status)}
                    </span>
                </td>
                <td>${plan.task_count || 0}</td>
                <td>${this.formatDate(plan.created_at)}</td>
                <td>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-sm" onclick="dashboard.viewPlan('${plan.uuid}')">
                            查看详情
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="dashboard.goToMonitor('${plan.uuid}')">
                            实时监控
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    bindEvents() {
        // 刷新按钮
        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refresh();
            });
        }
        
        // 实时监控按钮
        const monitorBtn = document.getElementById('monitor-btn');
        if (monitorBtn) {
            monitorBtn.addEventListener('click', () => {
                window.location.href = '/monitor';
            });
        }
    }

    async refresh() {
        const refreshBtn = document.getElementById('refresh-btn');
        const originalText = refreshBtn.textContent;
        
        refreshBtn.textContent = '刷新中...';
        refreshBtn.disabled = true;
        
        try {
            await this.loadStats();
            await this.loadPlans();
            this.showSuccess('数据已刷新');
        } catch (error) {
            this.showError('刷新失败');
        } finally {
            refreshBtn.textContent = originalText;
            refreshBtn.disabled = false;
        }
    }

    startAutoRefresh() {
        // 每30秒自动刷新一次
        this.refreshInterval = setInterval(() => {
            this.loadStats();
            this.loadPlans();
        }, 30000);
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    viewPlan(uuid) {
        window.location.href = `/plan/${uuid}`;
    }

    goToMonitor(uuid) {
        window.location.href = `/monitor?plan=${uuid}`;
    }

    getStatusText(status) {
        const statusMap = {
            'pending': '待执行',
            'running': '执行中',
            'completed': '已完成',
            'failed': '失败',
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
            minute: '2-digit'
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

// 添加动画样式
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .status-badge {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: bold;
        text-transform: uppercase;
    }
    
    .status-pending {
        background: #f3f4f6;
        color: #6b7280;
    }
    
    .status-running {
        background: #dbeafe;
        color: #1e40af;
    }
    
    .status-completed {
        background: #dcfce7;
        color: #166534;
    }
    
    .status-failed {
        background: #fee2e2;
        color: #991b1b;
    }
    
    .status-paused {
        background: #fef3c7;
        color: #92400e;
    }
    
    .btn-sm {
        padding: 0.375rem 0.75rem;
        font-size: 0.875rem;
    }
`;
document.head.appendChild(style);

// 初始化仪表板
let dashboard;

// 等待DOM完全加载
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
} else {
    initDashboard();
}

function initDashboard() {
    console.log('开始初始化仪表板...');
    console.log('当前DOM状态:', document.readyState);
    
    // 确保所有必要的元素都存在
    const requiredElements = [
        'total-plans', 'total-tasks', 'completion-rate', 'running-tasks',
        'plans-table-body', 'refresh-btn', 'monitor-btn'
    ];
    
    console.log('检查必要元素...');
    requiredElements.forEach(id => {
        const element = document.getElementById(id);
        console.log(`元素 ${id}:`, element ? '存在' : '不存在');
    });
    
    const missingElements = requiredElements.filter(id => !document.getElementById(id));
    
    if (missingElements.length > 0) {
        console.error('缺少必要的HTML元素:', missingElements);
        console.log('页面HTML:', document.documentElement.outerHTML.substring(0, 1000));
    }
    
    try {
        dashboard = new Dashboard();
        console.log('仪表板初始化成功');
    } catch (error) {
        console.error('仪表板初始化失败:', error);
    }
}

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
    if (dashboard) {
        dashboard.destroy();
    }
});
/**
 * 测试结果查看页面JavaScript
 */

class TestResultsManager {
    constructor() {
        this.results = [];
        this.plans = [];
        this.filteredResults = [];
        this.currentEditingTask = null;
        this.init();
    }

    init() {
        this.loadPlans();
        this.loadResults();
        this.bindEvents();
    }

    bindEvents() {
        // 筛选器事件
        document.getElementById('planFilter').addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('statusFilter').addEventListener('change', () => {
            this.applyFilters();
        });

        // 模态框关闭事件
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                e.target.closest('.modal').style.display = 'none';
            });
        });

        // 点击模态框外部关闭
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });

        // 编辑结果表单提交
        document.getElementById('editResultForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTaskUpdate();
        });
    }

    async loadPlans() {
        try {
            const response = await fetch('/api/plans');
            if (response.ok) {
                this.plans = await response.json();
                this.renderPlanFilter();
            }
        } catch (error) {
            console.error('加载测试计划错误:', error);
        }
    }

    async loadResults() {
        try {
            const response = await fetch('/api/tasks');
            if (response.ok) {
                this.results = await response.json();
                this.filteredResults = [...this.results];
                this.renderResults();
            } else {
                Utils.showNotification('加载测试结果失败', 'error');
            }
        } catch (error) {
            console.error('加载测试结果错误:', error);
            Utils.showNotification('加载测试结果失败', 'error');
        }
    }

    renderPlanFilter() {
        const planFilter = document.getElementById('planFilter');
        planFilter.innerHTML = '<option value="">所有计划</option>';
        
        this.plans.forEach(plan => {
            const option = document.createElement('option');
            option.value = plan.id;
            option.textContent = plan.name;
            planFilter.appendChild(option);
        });
    }

    applyFilters() {
        const planFilter = document.getElementById('planFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;
        
        this.filteredResults = this.results.filter(result => {
            const planMatch = !planFilter || result.plan_id === planFilter;
            const statusMatch = !statusFilter || result.status === statusFilter;
            return planMatch && statusMatch;
        });
        
        this.renderResults();
    }

    renderResults() {
        const resultsList = document.getElementById('resultsList');
        
        if (this.filteredResults.length === 0) {
            resultsList.innerHTML = `
                <div class="empty-state">
                    <p>暂无测试结果</p>
                </div>
            `;
            return;
        }

        // 按计划分组显示结果
        const groupedResults = this.groupResultsByPlan();
        
        resultsList.innerHTML = Object.entries(groupedResults).map(([planId, results]) => {
            const plan = this.plans.find(p => p.id === planId);
            const planName = plan ? plan.name : '未知计划';
            
            return `
                <div class="plan-results-group">
                    <h3 class="plan-group-title">${planName}</h3>
                    <div class="results-grid">
                        ${results.map(result => this.renderResultCard(result)).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }

    groupResultsByPlan() {
        const grouped = {};
        this.filteredResults.forEach(result => {
            const planId = result.plan_id || 'unknown';
            if (!grouped[planId]) {
                grouped[planId] = [];
            }
            grouped[planId].push(result);
        });
        return grouped;
    }

    renderResultCard(result) {
        const statusClass = this.getStatusClass(result.status);
        const statusText = this.getStatusText(result.status);
        
        return `
            <div class="result-card ${statusClass}">
                <div class="result-header">
                    <h4>${result.name || '未命名任务'}</h4>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </div>
                <div class="result-content">
                    <div class="result-info">
                        <p><strong>URL:</strong> ${result.url || 'N/A'}</p>
                        <p><strong>方法:</strong> ${result.method || 'N/A'}</p>
                        <p><strong>执行时间:</strong> ${Utils.formatTimestamp(result.executed_at)}</p>
                    </div>
                    ${result.response ? `
                        <div class="response-summary">
                            <p><strong>状态码:</strong> ${result.response.status || 'N/A'}</p>
                            <p><strong>响应时间:</strong> ${result.response.responseTime || 'N/A'}ms</p>
                        </div>
                    ` : ''}
                    ${result.summary ? `
                        <div class="result-summary">
                            <p><strong>测试总结:</strong> ${result.summary}</p>
                        </div>
                    ` : ''}
                    ${result.suggest ? `
                        <div class="result-suggest">
                            <p><strong>改进建议:</strong> ${result.suggest}</p>
                        </div>
                    ` : ''}
                </div>
                <div class="result-actions">
                    <button class="btn-secondary" onclick="testResultsManager.viewResultDetails('${result.id}')">查看详情</button>
                    <button class="btn-secondary" onclick="testResultsManager.editResult('${result.id}')">编辑</button>
                    <button class="btn-danger" onclick="testResultsManager.deleteResult('${result.id}')">删除</button>
                </div>
            </div>
        `;
    }

    getStatusClass(status) {
        switch (status) {
            case 'success': return 'success';
            case 'error': return 'error';
            case 'pending': return 'pending';
            default: return 'unknown';
        }
    }

    getStatusText(status) {
        switch (status) {
            case 'success': return '成功';
            case 'error': return '失败';
            case 'pending': return '待处理';
            default: return '未知';
        }
    }

    async viewResultDetails(taskId) {
        const result = this.results.find(r => r.id === taskId);
        if (!result) {
            Utils.showNotification('找不到测试结果', 'error');
            return;
        }

        // 创建详情模态框
        const detailsModal = document.createElement('div');
        detailsModal.className = 'modal';
        detailsModal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                <h2>测试结果详情</h2>
                <div class="result-details">
                    <div class="detail-section">
                        <h3>基本信息</h3>
                        <p><strong>任务名称:</strong> ${result.name || 'N/A'}</p>
                        <p><strong>URL:</strong> ${result.url || 'N/A'}</p>
                        <p><strong>方法:</strong> ${result.method || 'N/A'}</p>
                        <p><strong>状态:</strong> ${this.getStatusText(result.status)}</p>
                        <p><strong>执行时间:</strong> ${Utils.formatTimestamp(result.executed_at)}</p>
                    </div>
                    ${result.response ? `
                        <div class="detail-section">
                            <h3>响应信息</h3>
                            <p><strong>状态码:</strong> ${result.response.status || 'N/A'}</p>
                            <p><strong>响应时间:</strong> ${result.response.responseTime || 'N/A'}ms</p>
                            ${result.response.headers ? `
                                <div class="response-headers">
                                    <strong>响应头:</strong>
                                    <pre><code>${JSON.stringify(result.response.headers, null, 2)}</code></pre>
                                </div>
                            ` : ''}
                            ${result.response.data ? `
                                <div class="response-body">
                                    <strong>响应体:</strong>
                                    <pre><code>${JSON.stringify(result.response.data, null, 2)}</code></pre>
                                </div>
                            ` : ''}
                        </div>
                    ` : ''}
                    ${result.summary || result.suggest ? `
                        <div class="detail-section">
                            <h3>测试总结</h3>
                            ${result.summary ? `<p><strong>总结:</strong> ${result.summary}</p>` : ''}
                            ${result.suggest ? `<p><strong>建议:</strong> ${result.suggest}</p>` : ''}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        document.body.appendChild(detailsModal);
        detailsModal.style.display = 'block';

        // 绑定关闭事件
        detailsModal.querySelector('.close').addEventListener('click', () => {
            document.body.removeChild(detailsModal);
        });

        detailsModal.addEventListener('click', (e) => {
            if (e.target === detailsModal) {
                document.body.removeChild(detailsModal);
            }
        });
    }

    editResult(taskId) {
        const result = this.results.find(r => r.id === taskId);
        if (!result) {
            Utils.showNotification('找不到测试结果', 'error');
            return;
        }

        this.currentEditingTask = result;
        
        // 填充表单
        document.getElementById('taskName').value = result.name || '';
        document.getElementById('summary').value = result.summary || '';
        document.getElementById('suggest').value = result.suggest || '';
        
        document.getElementById('editResultModal').style.display = 'block';
    }

    closeEditResultModal() {
        document.getElementById('editResultModal').style.display = 'none';
        this.currentEditingTask = null;
    }

    async saveTaskUpdate() {
        if (!this.currentEditingTask) {
            Utils.showNotification('没有正在编辑的任务', 'error');
            return;
        }

        const formData = new FormData(document.getElementById('editResultForm'));
        const summary = formData.get('summary');
        const suggest = formData.get('suggest');

        if (!summary) {
            Utils.showNotification('请输入测试总结', 'error');
            return;
        }

        try {
            Utils.setLoading(true);
            const response = await fetch(`/api/tasks/${this.currentEditingTask.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    summary: summary,
                    suggest: suggest
                })
            });

            const result = await response.json();
            
            if (response.ok) {
                Utils.showNotification('测试结果更新成功', 'success');
                this.closeEditResultModal();
                this.loadResults();
            } else {
                Utils.showNotification(result.message || '更新测试结果失败', 'error');
            }
        } catch (error) {
            console.error('更新测试结果错误:', error);
            Utils.showNotification('更新测试结果失败', 'error');
        } finally {
            Utils.setLoading(false);
        }
    }

    async deleteResult(taskId) {
        if (!confirm('确定要删除这个测试结果吗？此操作不可恢复。')) {
            return;
        }

        try {
            Utils.setLoading(true);
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'DELETE'
            });

            const result = await response.json();
            
            if (response.ok) {
                Utils.showNotification('测试结果删除成功', 'success');
                this.loadResults();
            } else {
                Utils.showNotification(result.message || '删除测试结果失败', 'error');
            }
        } catch (error) {
            console.error('删除测试结果错误:', error);
            Utils.showNotification('删除测试结果失败', 'error');
        } finally {
            Utils.setLoading(false);
        }
    }
}

// 全局函数
function closeEditResultModal() {
    testResultsManager.closeEditResultModal();
}

// 初始化
let testResultsManager;
document.addEventListener('DOMContentLoaded', () => {
    testResultsManager = new TestResultsManager();
});
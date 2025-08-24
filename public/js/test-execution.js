/**
 * 测试执行页面JavaScript
 */

class TestExecutionManager {
    constructor() {
        this.plans = [];
        this.currentExecution = null;
        this.executionInterval = null;
        this.init();
    }

    init() {
        this.loadPlans();
        this.bindEvents();
    }

    bindEvents() {
        // 计划选择变化事件
        document.getElementById('planSelect').addEventListener('change', (e) => {
            this.onPlanSelectChange(e.target.value);
        });
    }

    async loadPlans() {
        try {
            const response = await fetch('/api/plans');
            if (response.ok) {
                this.plans = await response.json();
                this.renderPlanOptions();
            } else {
                Utils.showNotification('加载测试计划失败', 'error');
            }
        } catch (error) {
            console.error('加载测试计划错误:', error);
            Utils.showNotification('加载测试计划失败', 'error');
        }
    }

    renderPlanOptions() {
        const planSelect = document.getElementById('planSelect');
        planSelect.innerHTML = '<option value="">请选择测试计划</option>';
        
        this.plans.forEach(plan => {
            const option = document.createElement('option');
            option.value = plan.id;
            option.textContent = `${plan.name} (${plan.tasks ? plan.tasks.length : 0}个任务)`;
            planSelect.appendChild(option);
        });
    }

    onPlanSelectChange(planId) {
        const executeBtn = document.getElementById('executeBtn');
        executeBtn.disabled = !planId;
    }

    async executeTestPlan() {
        const planId = document.getElementById('planSelect').value;
        if (!planId) {
            Utils.showNotification('请选择测试计划', 'error');
            return;
        }

        const selectedPlan = this.plans.find(p => p.id === planId);
        if (!selectedPlan || !selectedPlan.tasks || selectedPlan.tasks.length === 0) {
            Utils.showNotification('选择的计划没有任务', 'error');
            return;
        }

        try {
            // 显示执行界面
            this.showExecutionProgress();
            this.updateProgress(0, '开始执行测试计划...');

            // 开始执行
            const response = await fetch(`/api/plans/${planId}/execute`, {
                method: 'POST'
            });

            const result = await response.json();
            
            if (response.ok) {
                Utils.showNotification('测试计划开始执行', 'success');
                this.currentExecution = {
                    planId: planId,
                    planName: selectedPlan.name,
                    totalTasks: selectedPlan.tasks.length,
                    completedTasks: 0,
                    results: []
                };
                
                // 模拟执行进度（实际应该通过WebSocket或轮询获取实时状态）
                this.simulateExecution(selectedPlan.tasks);
            } else {
                Utils.showNotification(result.message || '执行测试计划失败', 'error');
                this.hideExecutionProgress();
            }
        } catch (error) {
            console.error('执行测试计划错误:', error);
            Utils.showNotification('执行测试计划失败', 'error');
            this.hideExecutionProgress();
        }
    }

    async simulateExecution(tasks) {
        const executeBtn = document.getElementById('executeBtn');
        const stopBtn = document.getElementById('stopBtn');
        
        executeBtn.disabled = true;
        stopBtn.disabled = false;

        for (let i = 0; i < tasks.length; i++) {
            if (!this.currentExecution) break; // 检查是否被停止

            const task = tasks[i];
            const progress = ((i + 1) / tasks.length) * 100;
            
            this.updateProgress(progress, `正在执行任务: ${task.name}`);

            try {
                // 执行单个任务
                const response = await fetch('/api/test', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        url: task.url,
                        method: task.method,
                        headers: JSON.parse(task.headers || '{}'),
                        query: JSON.parse(task.query || '{}'),
                        body: JSON.parse(task.body || '{}')
                    })
                });

                const result = await response.json();
                
                this.currentExecution.results.push({
                    taskName: task.name,
                    taskUrl: task.url,
                    status: result.status,
                    message: result.message,
                    response: result.response,
                    timestamp: new Date().toISOString()
                });

                this.currentExecution.completedTasks++;
                
                // 添加延迟以便观察进度
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                console.error(`执行任务 ${task.name} 失败:`, error);
                this.currentExecution.results.push({
                    taskName: task.name,
                    taskUrl: task.url,
                    status: 'error',
                    message: error.message,
                    response: null,
                    timestamp: new Date().toISOString()
                });
            }
        }

        if (this.currentExecution) {
            this.updateProgress(100, '执行完成');
            this.showExecutionResults();
            Utils.showNotification('测试计划执行完成', 'success');
        }

        executeBtn.disabled = false;
        stopBtn.disabled = true;
    }

    stopExecution() {
        if (this.currentExecution) {
            this.currentExecution = null;
            this.updateProgress(0, '执行已停止');
            Utils.showNotification('测试执行已停止', 'info');
            
            const executeBtn = document.getElementById('executeBtn');
            const stopBtn = document.getElementById('stopBtn');
            executeBtn.disabled = false;
            stopBtn.disabled = true;
        }
    }

    showExecutionProgress() {
        document.getElementById('executionProgress').style.display = 'block';
        document.getElementById('executionResults').style.display = 'none';
    }

    hideExecutionProgress() {
        document.getElementById('executionProgress').style.display = 'none';
    }

    updateProgress(percentage, message) {
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        progressFill.style.width = `${percentage}%`;
        progressText.textContent = message;
    }

    showExecutionResults() {
        if (!this.currentExecution || !this.currentExecution.results) {
            return;
        }

        const resultsContent = document.getElementById('resultsContent');
        const results = this.currentExecution.results;
        
        const successCount = results.filter(r => r.status === 'success').length;
        const errorCount = results.filter(r => r.status === 'error').length;
        
        const summaryHtml = `
            <div class="execution-summary">
                <h4>执行摘要</h4>
                <div class="summary-stats">
                    <div class="stat-item success">
                        <span class="stat-label">成功</span>
                        <span class="stat-value">${successCount}</span>
                    </div>
                    <div class="stat-item error">
                        <span class="stat-label">失败</span>
                        <span class="stat-value">${errorCount}</span>
                    </div>
                    <div class="stat-item total">
                        <span class="stat-label">总计</span>
                        <span class="stat-value">${results.length}</span>
                    </div>
                </div>
            </div>
        `;

        const resultsHtml = results.map((result, index) => `
            <div class="result-item ${result.status}">
                <div class="result-header">
                    <h5>任务 ${index + 1}: ${result.taskName}</h5>
                    <span class="status-badge ${result.status}">${result.status === 'success' ? '成功' : '失败'}</span>
                </div>
                <div class="result-details">
                    <p><strong>URL:</strong> ${result.taskUrl}</p>
                    <p><strong>消息:</strong> ${result.message}</p>
                    <p><strong>时间:</strong> ${Utils.formatTimestamp(result.timestamp)}</p>
                    ${result.response ? `
                        <div class="response-data">
                            <strong>响应数据:</strong>
                            <pre><code>${JSON.stringify(result.response, null, 2)}</code></pre>
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');

        resultsContent.innerHTML = summaryHtml + '<div class="results-list">' + resultsHtml + '</div>';
        document.getElementById('executionResults').style.display = 'block';
    }
}

// 全局函数
function executeTestPlan() {
    testExecutionManager.executeTestPlan();
}

function stopExecution() {
    testExecutionManager.stopExecution();
}

// 初始化
let testExecutionManager;
document.addEventListener('DOMContentLoaded', () => {
    testExecutionManager = new TestExecutionManager();
});
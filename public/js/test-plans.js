/**
 * 测试计划管理页面JavaScript
 */

class TestPlanManager {
    constructor() {
        this.plans = [];
        this.currentPlan = null;
        this.taskCounter = 0;
        this.init();
    }

    init() {
        this.loadPlans();
        this.bindEvents();
    }

    bindEvents() {
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

        // 创建计划表单提交
        document.getElementById('createPlanForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createPlan();
        });
    }

    async loadPlans() {
        try {
            const response = await fetch('/api/plans');
            if (response.ok) {
                this.plans = await response.json();
                this.renderPlans();
            } else {
                Utils.showNotification('加载测试计划失败', 'error');
            }
        } catch (error) {
            console.error('加载测试计划错误:', error);
            Utils.showNotification('加载测试计划失败', 'error');
        }
    }

    renderPlans() {
        const plansList = document.getElementById('plansList');
        
        if (this.plans.length === 0) {
            plansList.innerHTML = `
                <div class="empty-state">
                    <p>暂无测试计划</p>
                    <button class="btn-primary" onclick="showCreatePlanModal()">创建第一个计划</button>
                </div>
            `;
            return;
        }

        plansList.innerHTML = this.plans.map(plan => `
            <div class="plan-card" data-plan-id="${plan.id}">
                <div class="plan-header">
                    <h3>${plan.name}</h3>
                    <div class="plan-actions">
                        <button class="btn-secondary" onclick="testPlanManager.viewPlan('${plan.id}')">查看</button>
                        <button class="btn-secondary" onclick="testPlanManager.editPlan('${plan.id}')">编辑</button>
                        <button class="btn-danger" onclick="testPlanManager.deletePlan('${plan.id}')">删除</button>
                    </div>
                </div>
                <div class="plan-info">
                    <span class="task-count">任务数: ${plan.tasks ? plan.tasks.length : 0}</span>
                    <span class="created-time">创建时间: ${Utils.formatTimestamp(plan.created_at)}</span>
                </div>
            </div>
        `).join('');
    }

    showCreatePlanModal() {
        this.taskCounter = 0;
        document.getElementById('createPlanForm').reset();
        document.getElementById('tasksList').innerHTML = '';
        document.getElementById('createPlanModal').style.display = 'block';
    }

    closeCreatePlanModal() {
        document.getElementById('createPlanModal').style.display = 'none';
    }

    addTask() {
        this.taskCounter++;
        const tasksList = document.getElementById('tasksList');
        const taskHtml = `
            <div class="task-item" data-task-id="${this.taskCounter}">
                <div class="task-header">
                    <h4>任务 ${this.taskCounter}</h4>
                    <button type="button" class="btn-danger btn-small" onclick="testPlanManager.removeTask(${this.taskCounter})">删除</button>
                </div>
                <div class="task-form">
                    <div class="form-group">
                        <label>任务名称 *</label>
                        <input type="text" name="taskName_${this.taskCounter}" required placeholder="输入任务名称">
                    </div>
                    <div class="form-group">
                        <label>请求URL *</label>
                        <input type="url" name="taskUrl_${this.taskCounter}" required placeholder="https://api.example.com/endpoint">
                    </div>
                    <div class="form-group">
                        <label>请求方法</label>
                        <select name="taskMethod_${this.taskCounter}">
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                            <option value="DELETE">DELETE</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>请求头 (JSON格式)</label>
                        <textarea name="taskHeaders_${this.taskCounter}" placeholder='{"Content-Type": "application/json"}'></textarea>
                    </div>
                    <div class="form-group">
                        <label>查询参数 (JSON格式)</label>
                        <textarea name="taskQuery_${this.taskCounter}" placeholder='{"page": "1", "limit": "10"}'></textarea>
                    </div>
                    <div class="form-group">
                        <label>请求体 (JSON格式)</label>
                        <textarea name="taskBody_${this.taskCounter}" placeholder='{"name": "test", "value": "example"}'></textarea>
                    </div>
                </div>
            </div>
        `;
        tasksList.insertAdjacentHTML('beforeend', taskHtml);
    }

    removeTask(taskId) {
        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
        if (taskElement) {
            taskElement.remove();
        }
    }

    async createPlan() {
        const formData = new FormData(document.getElementById('createPlanForm'));
        const planName = formData.get('planName');
        
        if (!planName) {
            Utils.showNotification('请输入计划名称', 'error');
            return;
        }

        // 收集任务数据
        const tasks = [];
        const taskItems = document.querySelectorAll('.task-item');
        
        for (const taskItem of taskItems) {
            const taskId = taskItem.dataset.taskId;
            const taskData = {
                name: formData.get(`taskName_${taskId}`),
                url: formData.get(`taskUrl_${taskId}`),
                method: formData.get(`taskMethod_${taskId}`) || 'GET',
                headers: formData.get(`taskHeaders_${taskId}`) || '{}',
                query: formData.get(`taskQuery_${taskId}`) || '{}',
                body: formData.get(`taskBody_${taskId}`) || '{}'
            };

            // 验证必填字段
            if (!taskData.name || !taskData.url) {
                Utils.showNotification(`任务 ${taskId} 的名称和URL不能为空`, 'error');
                return;
            }

            // 验证JSON格式
            try {
                JSON.parse(taskData.headers);
                JSON.parse(taskData.query);
                JSON.parse(taskData.body);
            } catch (error) {
                Utils.showNotification(`任务 ${taskId} 的JSON格式不正确`, 'error');
                return;
            }

            tasks.push(taskData);
        }

        if (tasks.length === 0) {
            Utils.showNotification('请至少添加一个任务', 'error');
            return;
        }

        try {
            Utils.setLoading(true);
            const response = await fetch('/api/plans', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: planName,
                    tasks: tasks
                })
            });

            const result = await response.json();
            
            if (response.ok) {
                Utils.showNotification('测试计划创建成功', 'success');
                this.closeCreatePlanModal();
                this.loadPlans();
            } else {
                Utils.showNotification(result.message || '创建测试计划失败', 'error');
            }
        } catch (error) {
            console.error('创建测试计划错误:', error);
            Utils.showNotification('创建测试计划失败', 'error');
        } finally {
            Utils.setLoading(false);
        }
    }

    async viewPlan(planId) {
        try {
            const response = await fetch(`/api/plans/${planId}`);
            if (response.ok) {
                const plan = await response.json();
                this.showPlanDetails(plan);
            } else {
                Utils.showNotification('获取计划详情失败', 'error');
            }
        } catch (error) {
            console.error('获取计划详情错误:', error);
            Utils.showNotification('获取计划详情失败', 'error');
        }
    }

    showPlanDetails(plan) {
        document.getElementById('planDetailsTitle').textContent = `计划详情 - ${plan.name}`;
        
        const tasksHtml = plan.tasks ? plan.tasks.map((task, index) => `
            <div class="task-detail">
                <h4>任务 ${index + 1}: ${task.name}</h4>
                <div class="task-info">
                    <p><strong>URL:</strong> ${task.url}</p>
                    <p><strong>方法:</strong> ${task.method}</p>
                    <p><strong>请求头:</strong> <code>${task.headers}</code></p>
                    <p><strong>查询参数:</strong> <code>${task.query}</code></p>
                    <p><strong>请求体:</strong> <code>${task.body}</code></p>
                </div>
            </div>
        `).join('') : '<p>暂无任务</p>';

        document.getElementById('planDetailsContent').innerHTML = `
            <div class="plan-details">
                <div class="plan-meta">
                    <p><strong>计划ID:</strong> ${plan.id}</p>
                    <p><strong>创建时间:</strong> ${Utils.formatTimestamp(plan.created_at)}</p>
                    <p><strong>任务数量:</strong> ${plan.tasks ? plan.tasks.length : 0}</p>
                </div>
                <div class="tasks-details">
                    <h3>任务列表</h3>
                    ${tasksHtml}
                </div>
            </div>
        `;

        document.getElementById('planDetailsModal').style.display = 'block';
    }

    async deletePlan(planId) {
        if (!confirm('确定要删除这个测试计划吗？此操作不可恢复。')) {
            return;
        }

        try {
            Utils.setLoading(true);
            const response = await fetch(`/api/plans/${planId}`, {
                method: 'DELETE'
            });

            const result = await response.json();
            
            if (response.ok) {
                Utils.showNotification('测试计划删除成功', 'success');
                this.loadPlans();
            } else {
                Utils.showNotification(result.message || '删除测试计划失败', 'error');
            }
        } catch (error) {
            console.error('删除测试计划错误:', error);
            Utils.showNotification('删除测试计划失败', 'error');
        } finally {
            Utils.setLoading(false);
        }
    }

    editPlan(planId) {
        // 跳转到编辑页面或打开编辑模态框
        Utils.showNotification('编辑功能开发中...', 'info');
    }
}

// 全局函数
function showCreatePlanModal() {
    testPlanManager.showCreatePlanModal();
}

function closeCreatePlanModal() {
    testPlanManager.closeCreatePlanModal();
}

function addTask() {
    testPlanManager.addTask();
}

// 初始化
let testPlanManager;
document.addEventListener('DOMContentLoaded', () => {
    testPlanManager = new TestPlanManager();
});
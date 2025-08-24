/**
 * 导出管理页面JavaScript
 */

class ExportManager {
    constructor() {
        this.plans = [];
        this.init();
    }

    init() {
        this.loadPlans();
        this.bindEvents();
    }

    bindEvents() {
        // 计划选择变化事件
        document.getElementById('exportPlanSelect').addEventListener('change', (e) => {
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
        const planSelect = document.getElementById('exportPlanSelect');
        planSelect.innerHTML = '<option value="">请选择要导出的测试计划</option>';
        
        this.plans.forEach(plan => {
            const option = document.createElement('option');
            option.value = plan.id;
            option.textContent = `${plan.name} (${plan.tasks ? plan.tasks.length : 0}个任务)`;
            planSelect.appendChild(option);
        });
    }

    onPlanSelectChange(planId) {
        const exportBtn = document.getElementById('exportBtn');
        const previewBtn = document.getElementById('previewBtn');
        
        exportBtn.disabled = !planId;
        previewBtn.disabled = !planId;
    }

    async exportToExcel() {
        const planId = document.getElementById('exportPlanSelect').value;
        if (!planId) {
            Utils.showNotification('请选择要导出的测试计划', 'error');
            return;
        }

        const options = this.getExportOptions();
        
        try {
            this.showExportStatus('正在生成Excel文件...');
            Utils.setLoading(true);
            
            const response = await fetch(`/api/export/${planId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(options)
            });

            if (response.ok) {
                // 获取文件名
                const contentDisposition = response.headers.get('Content-Disposition');
                let filename = 'test-results.xlsx';
                if (contentDisposition) {
                    const filenameMatch = contentDisposition.match(/filename="(.+)"/);  
                    if (filenameMatch) {
                        filename = filenameMatch[1];
                    }
                }

                // 下载文件
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

                this.showExportStatus('导出成功！文件已下载。', 'success');
                Utils.showNotification('Excel文件导出成功', 'success');
            } else {
                const result = await response.json();
                this.showExportStatus(result.message || '导出失败', 'error');
                Utils.showNotification(result.message || '导出Excel文件失败', 'error');
            }
        } catch (error) {
            console.error('导出Excel错误:', error);
            this.showExportStatus('导出失败: ' + error.message, 'error');
            Utils.showNotification('导出Excel文件失败', 'error');
        } finally {
            Utils.setLoading(false);
        }
    }

    async previewExport() {
        const planId = document.getElementById('exportPlanSelect').value;
        if (!planId) {
            Utils.showNotification('请选择要导出的测试计划', 'error');
            return;
        }

        try {
            Utils.setLoading(true);
            
            // 获取计划详情和任务数据
            const [planResponse, tasksResponse] = await Promise.all([
                fetch(`/api/plans/${planId}`),
                fetch(`/api/tasks?plan_id=${planId}`)
            ]);

            if (planResponse.ok && tasksResponse.ok) {
                const plan = await planResponse.json();
                const tasks = await tasksResponse.json();
                
                this.showPreview(plan, tasks);
            } else {
                Utils.showNotification('获取预览数据失败', 'error');
            }
        } catch (error) {
            console.error('预览导出错误:', error);
            Utils.showNotification('预览导出失败', 'error');
        } finally {
            Utils.setLoading(false);
        }
    }

    getExportOptions() {
        return {
            includeDetails: document.getElementById('includeDetails').checked,
            includeSummary: document.getElementById('includeSummary').checked,
            includeTimestamp: document.getElementById('includeTimestamp').checked
        };
    }

    showExportStatus(message, type = 'info') {
        const statusDiv = document.getElementById('exportStatus');
        statusDiv.className = `export-status ${type}`;
        statusDiv.innerHTML = `
            <div class="status-message">
                <span class="status-icon">${this.getStatusIcon(type)}</span>
                <span class="status-text">${message}</span>
            </div>
        `;
        statusDiv.style.display = 'block';
        
        // 自动隐藏成功消息
        if (type === 'success') {
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 3000);
        }
    }

    getStatusIcon(type) {
        switch (type) {
            case 'success': return '✓';
            case 'error': return '✗';
            case 'info': 
            default: return 'ℹ';
        }
    }

    showPreview(plan, tasks) {
        const options = this.getExportOptions();
        const previewContent = document.getElementById('previewContent');
        
        // 生成预览表格
        let tableHtml = `
            <div class="preview-info">
                <h4>计划信息</h4>
                <p><strong>计划名称:</strong> ${plan.name}</p>
                <p><strong>任务数量:</strong> ${tasks.length}</p>
                ${options.includeTimestamp ? `<p><strong>导出时间:</strong> ${Utils.formatTimestamp(new Date().toISOString())}</p>` : ''}
            </div>
            <div class="preview-table">
                <table class="export-preview-table">
                    <thead>
                        <tr>
                            <th>序号</th>
                            <th>任务名称</th>
                            <th>URL</th>
                            <th>方法</th>
                            <th>状态</th>
                            ${options.includeDetails ? '<th>状态码</th><th>响应时间</th>' : ''}
                            ${options.includeSummary ? '<th>测试总结</th><th>改进建议</th>' : ''}
                            ${options.includeTimestamp ? '<th>执行时间</th>' : ''}
                        </tr>
                    </thead>
                    <tbody>
        `;

        tasks.forEach((task, index) => {
            const statusText = this.getStatusText(task.status);
            tableHtml += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${task.name || 'N/A'}</td>
                    <td>${task.url || 'N/A'}</td>
                    <td>${task.method || 'N/A'}</td>
                    <td><span class="status-badge ${task.status}">${statusText}</span></td>
                    ${options.includeDetails ? `
                        <td>${task.response?.status || 'N/A'}</td>
                        <td>${task.response?.responseTime || 'N/A'}ms</td>
                    ` : ''}
                    ${options.includeSummary ? `
                        <td>${task.summary || 'N/A'}</td>
                        <td>${task.suggest || 'N/A'}</td>
                    ` : ''}
                    ${options.includeTimestamp ? `
                        <td>${Utils.formatTimestamp(task.executed_at)}</td>
                    ` : ''}
                </tr>
            `;
        });

        tableHtml += `
                    </tbody>
                </table>
            </div>
        `;

        previewContent.innerHTML = tableHtml;
        document.getElementById('exportPreview').style.display = 'block';
    }

    getStatusText(status) {
        switch (status) {
            case 'success': return '成功';
            case 'error': return '失败';
            case 'pending': return '待处理';
            default: return '未知';
        }
    }
}

// 全局函数
function exportToExcel() {
    exportManager.exportToExcel();
}

function previewExport() {
    exportManager.previewExport();
}

// 初始化
let exportManager;
document.addEventListener('DOMContentLoaded', () => {
    exportManager = new ExportManager();
});
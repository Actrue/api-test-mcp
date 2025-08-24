/**
 * API测试页面的JavaScript逻辑
 * 处理API测试表单提交和结果显示
 */

class ApiTestManager {
    constructor() {
        this.form = document.getElementById('apiTestForm');
        this.resultSection = document.getElementById('result');
        this.resultContent = document.getElementById('resultContent');
        this.init();
    }
    
    /**
     * 初始化API测试管理器
     */
    init() {
        if (!this.form) {
            console.error('API测试表单未找到');
            return;
        }
        
        this.bindEvents();
        this.loadSavedData();
    }
    
    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 表单提交事件
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });
        
        // 实时验证JSON格式
        const jsonFields = ['headers', 'query', 'body'];
        jsonFields.forEach(fieldName => {
            const field = this.form.querySelector(`[name="${fieldName}"]`);
            if (field) {
                field.addEventListener('blur', () => {
                    this.validateJsonField(field);
                });
                
                field.addEventListener('input', () => {
                    this.clearFieldError(field);
                });
            }
        });
        
        // 方法改变时清空body（GET请求通常不需要body）
        const methodField = this.form.querySelector('[name="method"]');
        const bodyField = this.form.querySelector('[name="body"]');
        if (methodField && bodyField) {
            methodField.addEventListener('change', (e) => {
                if (e.target.value === 'GET') {
                    bodyField.value = '';
                    bodyField.placeholder = 'GET请求通常不需要请求体';
                } else {
                    bodyField.placeholder = '{"name": "test", "value": "example"}';
                }
            });
        }
    }
    
    /**
     * 处理表单提交
     */
    async handleSubmit() {
        const formData = this.getFormData();
        const validator = new FormValidator(this.form);
        
        // 验证表单
        validator
            .required('url', formData.url, '请输入API URL')
            .url('url', formData.url, '请输入有效的URL地址')
            .json('headers', formData.headers, '请求头必须是有效的JSON格式')
            .json('query', formData.query, '查询参数必须是有效的JSON格式')
            .json('body', formData.body, '请求体必须是有效的JSON格式');
        
        if (!validator.isValid()) {
            validator.showErrors();
            Utils.showNotification('请检查表单输入', 'error');
            return;
        }
        
        // 清除之前的错误
        validator.clearErrors();
        
        // 保存表单数据
        this.saveFormData(formData);
        
        // 发送请求
        await this.sendApiRequest(formData);
    }
    
    /**
     * 获取表单数据
     * @returns {object} 表单数据对象
     */
    getFormData() {
        const formData = new FormData(this.form);
        const data = {
            url: formData.get('url'),
            method: formData.get('method') || 'GET',
            headers: formData.get('headers'),
            query: formData.get('query'),
            body: formData.get('body')
        };
        
        // 解析JSON字段
        ['headers', 'query', 'body'].forEach(field => {
            if (data[field] && data[field].trim()) {
                try {
                    data[field] = JSON.parse(data[field]);
                } catch (e) {
                    // 保持原始字符串，验证阶段会处理错误
                }
            } else {
                data[field] = undefined;
            }
        });
        
        return data;
    }
    
    /**
     * 发送API请求
     * @param {object} requestData - 请求数据
     */
    async sendApiRequest(requestData) {
        const submitBtn = this.form.querySelector('button[type="submit"]');
        
        try {
            Utils.setLoading(submitBtn, true);
            
            const response = await Utils.request('/api/test', {
                method: 'POST',
                body: JSON.stringify(requestData)
            });
            
            this.displayResult(response);
            Utils.showNotification('API测试完成', 'success');
            
        } catch (error) {
            console.error('API测试失败:', error);
            this.displayError(error.message);
            Utils.showNotification('API测试失败: ' + error.message, 'error');
        } finally {
            Utils.setLoading(submitBtn, false);
        }
    }
    
    /**
     * 显示测试结果
     * @param {object} response - 响应数据
     */
    displayResult(response) {
        if (!this.resultSection || !this.resultContent) return;
        
        const { state, message, data } = response;
        
        let resultHtml = `
            <div class="result-header">
                <h3>测试结果</h3>
                <span class="status-${state ? 'success' : 'error'}">
                    ${state ? '成功' : '失败'}
                </span>
            </div>
            <div class="result-message">
                <strong>消息:</strong> ${message}
            </div>
        `;
        
        if (data) {
            resultHtml += `
                <div class="result-details">
                    <div class="result-item">
                        <h4>状态码</h4>
                        <div class="code-block">${data.data?.statusCode || 'N/A'}</div>
                    </div>
                    
                    <div class="result-item">
                        <h4>响应头</h4>
                        <div class="code-block">${this.formatJsonForDisplay(data.data?.headers)}</div>
                        <button class="btn-secondary" onclick="apiTestManager.copyResult('headers')">
                            复制响应头
                        </button>
                    </div>
                    
                    <div class="result-item">
                        <h4>响应体</h4>
                        <div class="code-block" id="responseBody">${this.formatJsonForDisplay(data.data?.body)}</div>
                        <button class="btn-secondary" onclick="apiTestManager.copyResult('body')">
                            复制响应体
                        </button>
                    </div>
                </div>
            `;
        }
        
        this.resultContent.innerHTML = resultHtml;
        this.resultSection.style.display = 'block';
        
        // 滚动到结果区域
        this.resultSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    /**
     * 显示错误信息
     * @param {string} errorMessage - 错误消息
     */
    displayError(errorMessage) {
        if (!this.resultSection || !this.resultContent) return;
        
        const resultHtml = `
            <div class="result-header">
                <h3>测试结果</h3>
                <span class="status-error">失败</span>
            </div>
            <div class="result-message error">
                <strong>错误:</strong> ${errorMessage}
            </div>
        `;
        
        this.resultContent.innerHTML = resultHtml;
        this.resultSection.style.display = 'block';
        
        // 滚动到结果区域
        this.resultSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    /**
     * 格式化JSON用于显示
     * @param {any} data - 要格式化的数据
     * @returns {string} 格式化后的字符串
     */
    formatJsonForDisplay(data) {
        if (data === null || data === undefined) {
            return 'null';
        }
        
        if (typeof data === 'string') {
            try {
                // 尝试解析为JSON
                const parsed = JSON.parse(data);
                return Utils.highlightJSON(JSON.stringify(parsed, null, 2));
            } catch {
                // 如果不是JSON，直接返回字符串
                return data;
            }
        }
        
        return Utils.highlightJSON(JSON.stringify(data, null, 2));
    }
    
    /**
     * 复制结果到剪贴板
     * @param {string} type - 复制类型 (headers, body)
     */
    copyResult(type) {
        let textToCopy = '';
        
        if (type === 'headers') {
            const headersElement = this.resultContent.querySelector('.result-item:nth-child(2) .code-block');
            textToCopy = headersElement?.textContent || '';
        } else if (type === 'body') {
            const bodyElement = this.resultContent.querySelector('#responseBody');
            textToCopy = bodyElement?.textContent || '';
        }
        
        if (textToCopy) {
            Utils.copyToClipboard(textToCopy);
        }
    }
    
    /**
     * 验证JSON字段
     * @param {HTMLElement} field - 字段元素
     */
    validateJsonField(field) {
        const value = field.value.trim();
        if (value && !Utils.isValidJSON(value)) {
            field.classList.add('error');
            
            // 显示错误提示
            let errorElement = field.parentNode.querySelector('.error-message');
            if (!errorElement) {
                errorElement = document.createElement('div');
                errorElement.className = 'error-message';
                field.parentNode.appendChild(errorElement);
            }
            errorElement.textContent = '请输入有效的JSON格式';
        } else {
            this.clearFieldError(field);
        }
    }
    
    /**
     * 清除字段错误
     * @param {HTMLElement} field - 字段元素
     */
    clearFieldError(field) {
        field.classList.remove('error');
        const errorElement = field.parentNode.querySelector('.error-message');
        if (errorElement) {
            errorElement.remove();
        }
    }
    
    /**
     * 保存表单数据到本地存储
     * @param {object} data - 表单数据
     */
    saveFormData(data) {
        try {
            const saveData = {
                url: data.url,
                method: data.method,
                headers: typeof data.headers === 'object' ? JSON.stringify(data.headers, null, 2) : data.headers,
                query: typeof data.query === 'object' ? JSON.stringify(data.query, null, 2) : data.query,
                body: typeof data.body === 'object' ? JSON.stringify(data.body, null, 2) : data.body
            };
            localStorage.setItem('apiTestFormData', JSON.stringify(saveData));
        } catch (error) {
            console.warn('保存表单数据失败:', error);
        }
    }
    
    /**
     * 从本地存储加载表单数据
     */
    loadSavedData() {
        try {
            const savedData = localStorage.getItem('apiTestFormData');
            if (savedData) {
                const data = JSON.parse(savedData);
                
                // 填充表单字段
                Object.keys(data).forEach(key => {
                    const field = this.form.querySelector(`[name="${key}"]`);
                    if (field && data[key]) {
                        field.value = data[key];
                    }
                });
            }
        } catch (error) {
            console.warn('加载保存的表单数据失败:', error);
        }
    }
    
    /**
     * 清除保存的表单数据
     */
    clearSavedData() {
        localStorage.removeItem('apiTestFormData');
        this.form.reset();
        Utils.showNotification('表单已重置', 'info');
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    window.apiTestManager = new ApiTestManager();
    
    // 添加清除按钮（如果需要）
    const form = document.getElementById('apiTestForm');
    if (form) {
        const clearBtn = document.createElement('button');
        clearBtn.type = 'button';
        clearBtn.className = 'btn-secondary';
        clearBtn.textContent = '清除表单';
        clearBtn.style.marginLeft = '1rem';
        clearBtn.onclick = () => window.apiTestManager.clearSavedData();
        
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.parentNode.appendChild(clearBtn);
        }
    }
    
    // 添加示例数据按钮
    const exampleBtn = document.createElement('button');
    exampleBtn.type = 'button';
    exampleBtn.className = 'btn-secondary';
    exampleBtn.textContent = '加载示例';
    exampleBtn.style.marginLeft = '1rem';
    exampleBtn.onclick = loadExampleData;
    
    const submitBtn = form?.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.parentNode.appendChild(exampleBtn);
    }
});

/**
 * 加载示例数据
 */
function loadExampleData() {
    const form = document.getElementById('apiTestForm');
    if (!form) return;
    
    // 示例数据
    const exampleData = {
        url: 'https://jsonplaceholder.typicode.com/posts/1',
        method: 'GET',
        headers: JSON.stringify({
            'Accept': 'application/json',
            'User-Agent': 'API-Test-Tool/1.0'
        }, null, 2),
        query: JSON.stringify({
            '_limit': '1'
        }, null, 2),
        body: ''
    };
    
    // 填充表单
    Object.keys(exampleData).forEach(key => {
        const field = form.querySelector(`[name="${key}"]`);
        if (field) {
            field.value = exampleData[key];
        }
    });
    
    Utils.showNotification('示例数据已加载', 'success');
}
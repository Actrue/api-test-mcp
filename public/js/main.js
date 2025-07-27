/**
 * API测试管理系统主要JavaScript文件
 * 处理通用功能和页面交互
 */

// 通用工具函数
class Utils {
    /**
     * 显示通知消息
     * @param {string} message - 消息内容
     * @param {string} type - 消息类型 (success, error, info)
     */
    static showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // 3秒后自动移除
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
    
    /**
     * 格式化JSON字符串
     * @param {string} jsonStr - JSON字符串
     * @returns {string} 格式化后的JSON
     */
    static formatJSON(jsonStr) {
        try {
            const obj = JSON.parse(jsonStr);
            return JSON.stringify(obj, null, 2);
        } catch (e) {
            return jsonStr;
        }
    }
    
    /**
     * 验证JSON格式
     * @param {string} jsonStr - JSON字符串
     * @returns {boolean} 是否为有效JSON
     */
    static isValidJSON(jsonStr) {
        if (!jsonStr.trim()) return true; // 空字符串视为有效
        try {
            JSON.parse(jsonStr);
            return true;
        } catch (e) {
            return false;
        }
    }
    
    /**
     * 发送HTTP请求
     * @param {string} url - 请求URL
     * @param {object} options - 请求选项
     * @returns {Promise} 请求Promise
     */
    static async request(url, options = {}) {
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        const finalOptions = { ...defaultOptions, ...options };
        
        try {
            const response = await fetch(url, finalOptions);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error('请求失败:', error);
            throw error;
        }
    }
    
    /**
     * 创建加载状态
     * @param {HTMLElement} element - 目标元素
     * @param {boolean} loading - 是否显示加载状态
     */
    static setLoading(element, loading) {
        if (loading) {
            element.disabled = true;
            const originalText = element.textContent;
            element.dataset.originalText = originalText;
            element.innerHTML = '<span class="loading"></span> 处理中...';
        } else {
            element.disabled = false;
            element.textContent = element.dataset.originalText || element.textContent;
        }
    }
    
    /**
     * 高亮JSON代码
     * @param {string} json - JSON字符串
     * @returns {string} 高亮后的HTML
     */
    static highlightJSON(json) {
        return json
            .replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:')
            .replace(/: "([^"]*)"/g, ': <span class="json-string">"$1"</span>')
            .replace(/: (\d+)/g, ': <span class="json-number">$1</span>')
            .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>')
            .replace(/: null/g, ': <span class="json-null">null</span>');
    }
    
    /**
     * 复制文本到剪贴板
     * @param {string} text - 要复制的文本
     */
    static async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showNotification('已复制到剪贴板', 'success');
        } catch (err) {
            console.error('复制失败:', err);
            this.showNotification('复制失败', 'error');
        }
    }
    
    /**
     * 格式化时间戳
     * @param {string} timestamp - ISO时间戳
     * @returns {string} 格式化后的时间
     */
    static formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
}

// 模态框管理
class Modal {
    constructor(modalId) {
        this.modal = document.getElementById(modalId);
        this.closeBtn = this.modal?.querySelector('.close');
        this.init();
    }
    
    init() {
        if (!this.modal) return;
        
        // 点击关闭按钮
        if (this.closeBtn) {
            this.closeBtn.onclick = () => this.hide();
        }
        
        // 点击模态框外部关闭
        this.modal.onclick = (event) => {
            if (event.target === this.modal) {
                this.hide();
            }
        };
    }
    
    show() {
        if (this.modal) {
            this.modal.style.display = 'block';
        }
    }
    
    hide() {
        if (this.modal) {
            this.modal.style.display = 'none';
        }
    }
}

// 表单验证
class FormValidator {
    constructor(form) {
        this.form = form;
        this.errors = {};
    }
    
    /**
     * 验证必填字段
     * @param {string} fieldName - 字段名
     * @param {string} value - 字段值
     * @param {string} message - 错误消息
     */
    required(fieldName, value, message = '此字段为必填项') {
        if (!value || value.trim() === '') {
            this.errors[fieldName] = message;
        }
        return this;
    }
    
    /**
     * 验证URL格式
     * @param {string} fieldName - 字段名
     * @param {string} value - 字段值
     * @param {string} message - 错误消息
     */
    url(fieldName, value, message = '请输入有效的URL') {
        if (value && !this.isValidUrl(value)) {
            this.errors[fieldName] = message;
        }
        return this;
    }
    
    /**
     * 验证JSON格式
     * @param {string} fieldName - 字段名
     * @param {string} value - 字段值
     * @param {string} message - 错误消息
     */
    json(fieldName, value, message = '请输入有效的JSON格式') {
        if (value && !Utils.isValidJSON(value)) {
            this.errors[fieldName] = message;
        }
        return this;
    }
    
    /**
     * 检查是否有错误
     * @returns {boolean} 是否通过验证
     */
    isValid() {
        return Object.keys(this.errors).length === 0;
    }
    
    /**
     * 显示错误消息
     */
    showErrors() {
        // 清除之前的错误显示
        this.clearErrors();
        
        // 显示新的错误
        Object.keys(this.errors).forEach(fieldName => {
            const field = this.form.querySelector(`[name="${fieldName}"]`);
            if (field) {
                field.classList.add('error');
                
                // 创建错误消息元素
                const errorElement = document.createElement('div');
                errorElement.className = 'error-message';
                errorElement.textContent = this.errors[fieldName];
                
                // 插入错误消息
                field.parentNode.appendChild(errorElement);
            }
        });
    }
    
    /**
     * 清除错误显示
     */
    clearErrors() {
        this.errors = {};
        
        // 移除错误样式和消息
        this.form.querySelectorAll('.error').forEach(field => {
            field.classList.remove('error');
        });
        
        this.form.querySelectorAll('.error-message').forEach(msg => {
            msg.remove();
        });
    }
    
    /**
     * 验证URL格式
     * @param {string} url - URL字符串
     * @returns {boolean} 是否为有效URL
     */
    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }
}

// 页面加载完成后的初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化所有模态框
    document.querySelectorAll('.modal').forEach(modal => {
        new Modal(modal.id);
    });
    
    // 添加表单验证样式
    const style = document.createElement('style');
    style.textContent = `
        .error {
            border-color: #ef4444 !important;
        }
        
        .error-message {
            color: #ef4444;
            font-size: 0.75rem;
            margin-top: 0.25rem;
        }
    `;
    document.head.appendChild(style);
    
    // 全局错误处理
    window.addEventListener('unhandledrejection', function(event) {
        console.error('未处理的Promise错误:', event.reason);
        Utils.showNotification('发生了未知错误，请稍后重试', 'error');
    });
    
    // 网络状态监听
    window.addEventListener('online', function() {
        Utils.showNotification('网络连接已恢复', 'success');
    });
    
    window.addEventListener('offline', function() {
        Utils.showNotification('网络连接已断开', 'error');
    });
});

// 导出工具类供其他脚本使用
window.Utils = Utils;
window.Modal = Modal;
window.FormValidator = FormValidator;
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import path from 'path';
import { apiTest } from './apitest.js';
import { executeTasksAndSaveResults } from './server/apiTest.js';
import { exportToExcel } from './server/createExcel.js';
import { dbClient } from './db/db.js';

const app = new Hono();

// 中间件配置
app.use('*', logger());
app.use('*', cors());

// 静态文件服务
app.use('/static/*', serveStatic({ 
  root: path.join(process.cwd(), 'public'),
  rewriteRequestPath: (path) => path.replace(/^\/static/, '')
}));

// 首页路由
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>API测试管理系统</title>
        <link rel="stylesheet" href="/static/css/style.css">
    </head>
    <body>
        <div class="container">
            <!-- Hero区域 -->
            <header class="hero">
                <h1 class="hero-title">API测试管理系统</h1>
                <h2 class="hero-subtitle">高效的API测试解决方案</h2>
                <p class="hero-description">基于Hono框架构建，提供完整的API测试、计划管理和结果导出功能</p>
            </header>

            <!-- 功能导航区域 -->
            <main class="features-grid">
                <div class="feature-card" onclick="location.href='/api-test'">
                    <div class="feature-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                            <path d="M2 17l10 5 10-5"/>
                            <path d="M2 12l10 5 10-5"/>
                        </svg>
                    </div>
                    <h3>API测试</h3>
                    <p>单个API接口测试，支持各种HTTP方法</p>
                </div>

                <div class="feature-card" onclick="location.href='/test-plans'">
                    <div class="feature-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-4"/>
                            <path d="M9 7V3a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"/>
                        </svg>
                    </div>
                    <h3>测试计划管理</h3>
                    <p>创建和管理测试计划，批量组织测试任务</p>
                </div>

                <div class="feature-card" onclick="location.href='/test-execution'">
                    <div class="feature-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polygon points="10,8 16,12 10,16 10,8"/>
                        </svg>
                    </div>
                    <h3>批量执行</h3>
                    <p>执行测试计划中的所有任务，实时查看进度</p>
                </div>

                <div class="feature-card" onclick="location.href='/test-results'">
                    <div class="feature-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14,2 14,8 20,8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                            <polyline points="10,9 9,9 8,9"/>
                        </svg>
                    </div>
                    <h3>结果查看</h3>
                    <p>查看测试结果详情，编辑总结和建议</p>
                </div>

                <div class="feature-card" onclick="location.href='/export'">
                    <div class="feature-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7,10 12,15 17,10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                    </div>
                    <h3>导出管理</h3>
                    <p>将测试结果导出为Excel格式报告</p>
                </div>
            </main>
        </div>
        <script src="/static/js/main.js"></script>
    </body>
    </html>
  `);
});

// API路由

/**
 * 健康检查接口
 */
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'API测试管理系统',
    version: '1.0.0'
  });
});

/**
 * 获取所有测试计划
 */
app.get('/api/plans', async (c) => {
  try {
    const result = await dbClient.getAllPlans();
    return c.json(result.data || []);
  } catch (error) {
    return c.json({
      message: error instanceof Error ? error.message : '获取计划失败'
    }, 500);
  }
});

/**
 * 获取指定测试计划
 */
app.get('/api/plans/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const result = await dbClient.getPlanById(id);
    
    if (result.state === 1) {
      return c.json(result.data);
    } else {
      return c.json({ message: result.message }, 404);
    }
  } catch (error) {
    return c.json({
      message: error instanceof Error ? error.message : '获取计划失败'
    }, 500);
  }
});

/**
 * 删除测试计划
 */
app.delete('/api/plans/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const result = await dbClient.deletePlan(id);
    
    return c.json({
      success: result.state === 1,
      message: result.message
    });
  } catch (error) {
    return c.json({
      success: false,
      message: error instanceof Error ? error.message : '删除失败'
    }, 500);
  }
});

/**
 * 获取所有测试任务
 */
app.get('/api/tasks', async (c) => {
  try {
    const planId = c.req.query('plan_id');
    let result;
    
    if (planId) {
      result = await dbClient.getAllTable(planId);
    } else {
      // 获取所有任务（需要实现这个方法）
      result = await dbClient.getAllTasks();
    }
    
    return c.json(result.data || []);
  } catch (error) {
    return c.json({
      message: error instanceof Error ? error.message : '获取任务失败'
    }, 500);
  }
});

/**
 * 获取指定测试任务
 */
app.get('/api/tasks/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const result = await dbClient.getTaskById(id);
    
    if (result.state === 1) {
      return c.json(result.data);
    } else {
      return c.json({ message: result.message }, 404);
    }
  } catch (error) {
    return c.json({
      message: error instanceof Error ? error.message : '获取任务失败'
    }, 500);
  }
});

/**
 * 删除测试任务
 */
app.delete('/api/tasks/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const result = await dbClient.deleteTask(id);
    
    return c.json({
      success: result.state === 1,
      message: result.message
    });
  } catch (error) {
    return c.json({
      success: false,
      message: error instanceof Error ? error.message : '删除失败'
    }, 500);
  }
});

/**
 * 单个API测试接口
 * 接收URL、方法、参数等，返回测试结果
 */
app.post('/api/test', async (c) => {
  try {
    const body = await c.req.json();
    const { url, method, query, headers, body: requestBody } = body;
    
    // 参数验证
    const { validateRequired, validateURL, validateHTTPMethod, validateJSON } = await import('./utils/参数验证工具.js');
    
    // 验证URL
    const urlRequiredValidation = validateRequired(url, '请求URL');
    if (!urlRequiredValidation.state) {
      return c.json({
        state: false,
        message: urlRequiredValidation.message,
        data: null
      }, 400);
    }
    
    const urlFormatValidation = validateURL(url, '请求URL');
    if (!urlFormatValidation.state) {
      return c.json({
        state: false,
        message: urlFormatValidation.message,
        data: null
      }, 400);
    }
    
    // 验证HTTP方法
    const methodRequiredValidation = validateRequired(method, '请求方法');
    if (!methodRequiredValidation.state) {
      return c.json({
        state: false,
        message: methodRequiredValidation.message,
        data: null
      }, 400);
    }
    
    const methodFormatValidation = validateHTTPMethod(method, '请求方法');
    if (!methodFormatValidation.state) {
      return c.json({
        state: false,
        message: methodFormatValidation.message,
        data: null
      }, 400);
    }
    
    // 验证请求头（可选）
    if (headers !== undefined && headers !== null && headers !== '') {
      const headersValidation = validateJSON(headers, '请求头');
      if (!headersValidation.state) {
        return c.json({
          state: false,
          message: headersValidation.message,
          data: null
        }, 400);
      }
    }
    
    // 验证请求体（可选）
    if (requestBody !== undefined && requestBody !== null && requestBody !== '') {
      const bodyValidation = validateJSON(requestBody, '请求体');
      if (!bodyValidation.state) {
        return c.json({
          state: false,
          message: bodyValidation.message,
          data: null
        }, 400);
      }
    }
    
    const result = await apiTest({
      url,
      method,
      query,
      headers,
      body: requestBody
    });
    
    return c.json({
      state: true,
      message: result.message,
      data: result
    });
  } catch (error) {
    return c.json({
      state: false,
      message: error instanceof Error ? error.message : '未知错误',
      data: null
    }, 500);
  }
});

/**
 * 创建测试计划和任务
 */
app.post('/api/test-plans', async (c) => {
  try {
    const body = await c.req.json();
    const { planName, tasks } = body;
    
    // 参数验证
    const { validateRequired, validateStringLength, validateTestTasks } = await import('./utils/参数验证工具.js');
    
    // 验证计划名称
    const planNameRequiredValidation = validateRequired(planName, '测试计划名称');
    if (!planNameRequiredValidation.state) {
      return c.json({
        state: false,
        message: planNameRequiredValidation.message,
        data: null
      }, 400);
    }
    
    const planNameLengthValidation = validateStringLength(planName, '测试计划名称', 1, 100);
    if (!planNameLengthValidation.state) {
      return c.json({
        state: false,
        message: planNameLengthValidation.message,
        data: null
      }, 400);
    }
    
    // 验证任务列表
    const tasksValidation = validateTestTasks(tasks);
    if (!tasksValidation.state) {
      return c.json({
        state: false,
        message: tasksValidation.message,
        data: null
      }, 400);
    }
    
    const result = await dbClient.createTestPlanWithTasks(planName, tasks);
    
    return c.json({
      state: result.state === 1,
      message: result.message,
      data: result.data
    });
  } catch (error) {
    return c.json({
      state: false,
      message: error instanceof Error ? error.message : '创建失败',
      data: null
    }, 500);
  }
});

/**
 * 获取所有测试计划或指定计划的任务
 */
app.get('/api/test-plans', async (c) => {
  try {
    const uuid = c.req.query('uuid');
    const result = await dbClient.getAllTable(uuid);
    
    return c.json(result);
  } catch (error) {
    return c.json({
      state: false,
      message: error instanceof Error ? error.message : '查询失败',
      data: null
    }, 500);
  }
});

/**
 * 执行测试计划
 */
app.post('/api/test-plans/:uuid/execute', async (c) => {
  try {
    const uuid = c.req.param('uuid');
    
    // 参数验证
    const { validateUUID } = await import('./utils/参数验证工具.js');
    
    // 验证UUID格式
    const uuidValidation = validateUUID(uuid, '测试计划UUID');
    if (!uuidValidation.state) {
      return c.json({
        state: false,
        message: uuidValidation.message,
        data: null
      }, 400);
    }
    
    const result = await executeTasksAndSaveResults(uuid);
    
    // 检查执行结果
    if (!result.data || result.data.length === 0) {
      return c.json({
        state: false,
        message: '测试计划不存在或没有可执行的任务',
        data: null
      }, 404);
    }
    
    return c.json({
      state: true,
      message: '执行成功',
      data: result.data?.map((item) => ({
        uuid: item.data?.uuid,
        name: item.data?.name,
        res: item.data?.res
      }))
    });
  } catch (error) {
    return c.json({
      state: false,
      message: error instanceof Error ? error.message : '执行失败',
      data: null
    }, 500);
  }
});

/**
 * 向测试计划添加任务
 */
app.post('/api/test-plans/:uuid/tasks', async (c) => {
  try {
    const uuid = c.req.param('uuid');
    const body = await c.req.json();
    const { tasks } = body;
    
    // 参数验证
    const { validateUUID, validateTestTasks } = await import('./utils/参数验证工具.js');
    
    // 验证UUID格式
    const uuidValidation = validateUUID(uuid, '测试计划UUID');
    if (!uuidValidation.state) {
      return c.json({
        state: false,
        message: uuidValidation.message,
        data: null
      }, 400);
    }
    
    // 验证任务列表
    const tasksValidation = validateTestTasks(tasks);
    if (!tasksValidation.state) {
      return c.json({
        state: false,
        message: tasksValidation.message,
        data: null
      }, 400);
    }
    
    const result = await dbClient.addTasksToPlan(uuid, tasks);
    
    return c.json({
      state: result.state === 1,
      message: result.message,
      data: result.data
    });
  } catch (error) {
    return c.json({
      state: false,
      message: error instanceof Error ? error.message : '添加任务失败',
      data: null
    }, 500);
  }
});

/**
 * 批量更新任务总结
 */
app.put('/api/tasks/batch-update', async (c) => {
  try {
    const body = await c.req.json();
    const { tasks } = body;
    
    const result = await dbClient.updateTaskWithSummary(tasks);
    
    return c.json({
      state: result.state === 1,
      message: result.message,
      data: result.data
    });
  } catch (error) {
    return c.json({
      state: false,
      message: error instanceof Error ? error.message : '批量更新失败',
      data: null
    }, 500);
  }
});

/**
 * 更新单个任务
 */
app.put('/api/tasks/:uuid', async (c) => {
  try {
    const uuid = c.req.param('uuid');
    const body = await c.req.json();
    
    // 参数验证
    const { validateUUID } = await import('./utils/参数验证工具.js');
    
    // 验证UUID格式
    const uuidValidation = validateUUID(uuid, '任务UUID');
    if (!uuidValidation.state) {
      return c.json({
        state: false,
        message: uuidValidation.message,
        data: null
      }, 400);
    }
    
    // 验证请求体不为空
    if (!body || Object.keys(body).length === 0) {
      return c.json({
        state: false,
        message: '请求体不能为空',
        data: null
      }, 400);
    }
    
    const result = await dbClient.updateTaskByUuid(uuid, body);
    
    return c.json({
      state: result.state === 1,
      message: result.message,
      data: result.data
    });
  } catch (error) {
    return c.json({
      state: false,
      message: error instanceof Error ? error.message : '更新失败',
      data: null
    }, 500);
  }
});

/**
 * 导出测试结果到Excel
 */
app.post('/api/export/:uuid', async (c) => {
  try {
    const uuid = c.req.param('uuid');
    
    // 参数验证
    const { validateUUID } = await import('./utils/参数验证工具.js');
    
    // 验证UUID格式
    const uuidValidation = validateUUID(uuid, '测试计划UUID');
    if (!uuidValidation.state) {
      return c.json({
        state: false,
        message: uuidValidation.message,
        data: null
      }, 400);
    }
    
    const result = await exportToExcel(uuid);
    
    return c.json({
      state: result.state,
      message: result.message,
      filePath: result.data
    });
  } catch (error) {
    return c.json({
      state: false,
      message: error instanceof Error ? error.message : '导出Excel失败',
      data: null
    }, 500);
  }
});

// 页面路由
app.get('/api-test', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>API测试 - API测试管理系统</title>
        <link rel="stylesheet" href="/static/css/style.css">
    </head>
    <body>
        <div class="container">
            <nav class="breadcrumb">
                <a href="/">首页</a> > API测试
            </nav>
            
            <h1>API测试</h1>
            
            <div class="api-test-form">
                <form id="apiTestForm">
                    <div class="form-group">
                        <label for="url">请求URL *</label>
                        <input type="url" id="url" name="url" required placeholder="https://api.example.com/endpoint">
                    </div>
                    
                    <div class="form-group">
                        <label for="method">请求方法</label>
                        <select id="method" name="method">
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                            <option value="DELETE">DELETE</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="headers">请求头 (JSON格式)</label>
                        <textarea id="headers" name="headers" placeholder='{"Content-Type": "application/json"}'></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label for="query">查询参数 (JSON格式)</label>
                        <textarea id="query" name="query" placeholder='{"page": "1", "limit": "10"}'></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label for="body">请求体 (JSON格式)</label>
                        <textarea id="body" name="body" placeholder='{"name": "test", "value": "example"}'></textarea>
                    </div>
                    
                    <button type="submit" class="btn-primary">发送请求</button>
                </form>
            </div>
            
            <div id="result" class="result-section" style="display: none;">
                <h2>响应结果</h2>
                <div id="resultContent"></div>
            </div>
        </div>
        
        <script src="/static/js/api-test.js"></script>
    </body>
    </html>
  `);
});

// 测试计划管理页面
app.get('/test-plans', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>测试计划管理 - API测试管理系统</title>
        <link rel="stylesheet" href="/static/css/style.css">
    </head>
    <body>
        <div class="container">
            <nav class="breadcrumb">
                <a href="/">首页</a> > 测试计划管理
            </nav>
            
            <div class="page-header">
                <h1>测试计划管理</h1>
                <button class="btn-primary" onclick="showCreatePlanModal()">创建新计划</button>
            </div>
            
            <div id="plansList" class="plans-list">
                <!-- 计划列表将通过JavaScript动态加载 -->
            </div>
            
            <!-- 创建计划模态框 -->
            <div id="createPlanModal" class="modal">
                <div class="modal-content">
                    <span class="close">&times;</span>
                    <h2>创建测试计划</h2>
                    <form id="createPlanForm">
                        <div class="form-group">
                            <label for="planName">计划名称 *</label>
                            <input type="text" id="planName" name="planName" required placeholder="输入测试计划名称">
                        </div>
                        
                        <div class="tasks-section">
                            <h3>测试任务</h3>
                            <div id="tasksList">
                                <!-- 任务列表 -->
                            </div>
                            <button type="button" class="btn-secondary" onclick="addTask()">添加任务</button>
                        </div>
                        
                        <div class="form-actions">
                            <button type="submit" class="btn-primary">创建计划</button>
                            <button type="button" class="btn-secondary" onclick="closeCreatePlanModal()">取消</button>
                        </div>
                    </form>
                </div>
            </div>
            
            <!-- 查看计划详情模态框 -->
            <div id="planDetailsModal" class="modal">
                <div class="modal-content">
                    <span class="close">&times;</span>
                    <h2 id="planDetailsTitle">计划详情</h2>
                    <div id="planDetailsContent">
                        <!-- 计划详情内容 -->
                    </div>
                </div>
            </div>
        </div>
        
        <script src="/static/js/test-plans.js"></script>
    </body>
    </html>
  `);
});

// 测试执行页面
app.get('/test-execution', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>测试执行 - API测试管理系统</title>
        <link rel="stylesheet" href="/static/css/style.css">
    </head>
    <body>
        <div class="container">
            <nav class="breadcrumb">
                <a href="/">首页</a> > 测试执行
            </nav>
            
            <h1>批量测试执行</h1>
            
            <div class="execution-section">
                <div class="form-group">
                    <label for="planSelect">选择测试计划 *</label>
                    <select id="planSelect" name="planSelect" required>
                        <option value="">请选择测试计划</option>
                    </select>
                </div>
                
                <div class="execution-controls">
                    <button id="executeBtn" class="btn-primary" onclick="executeTestPlan()">开始执行</button>
                    <button id="stopBtn" class="btn-secondary" onclick="stopExecution()" disabled>停止执行</button>
                </div>
                
                <div id="executionProgress" class="execution-progress" style="display: none;">
                    <h3>执行进度</h3>
                    <div class="progress-bar">
                        <div id="progressFill" class="progress-fill" style="width: 0%"></div>
                    </div>
                    <div id="progressText" class="progress-text">准备中...</div>
                </div>
                
                <div id="executionResults" class="execution-results" style="display: none;">
                    <h3>执行结果</h3>
                    <div id="resultsContent">
                        <!-- 执行结果内容 -->
                    </div>
                </div>
            </div>
        </div>
        
        <script src="/static/js/test-execution.js"></script>
    </body>
    </html>
  `);
});

// 测试结果查看页面
app.get('/test-results', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>测试结果 - API测试管理系统</title>
        <link rel="stylesheet" href="/static/css/style.css">
    </head>
    <body>
        <div class="container">
            <nav class="breadcrumb">
                <a href="/">首页</a> > 测试结果
            </nav>
            
            <div class="page-header">
                <h1>测试结果查看</h1>
                <div class="filter-controls">
                    <select id="planFilter">
                        <option value="">所有计划</option>
                    </select>
                    <select id="statusFilter">
                        <option value="">所有状态</option>
                        <option value="success">成功</option>
                        <option value="error">失败</option>
                        <option value="pending">待处理</option>
                    </select>
                </div>
            </div>
            
            <div id="resultsList" class="results-list">
                <!-- 结果列表将通过JavaScript动态加载 -->
            </div>
            
            <!-- 编辑结果模态框 -->
            <div id="editResultModal" class="modal">
                <div class="modal-content">
                    <span class="close">&times;</span>
                    <h2>编辑测试结果</h2>
                    <form id="editResultForm">
                        <div class="form-group">
                            <label for="taskName">任务名称</label>
                            <input type="text" id="taskName" name="taskName" readonly>
                        </div>
                        
                        <div class="form-group">
                            <label for="summary">测试总结 *</label>
                            <textarea id="summary" name="summary" required placeholder="请输入测试总结"></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="suggest">改进建议</label>
                            <textarea id="suggest" name="suggest" placeholder="请输入改进建议"></textarea>
                        </div>
                        
                        <div class="form-actions">
                            <button type="submit" class="btn-primary">保存</button>
                            <button type="button" class="btn-secondary" onclick="closeEditResultModal()">取消</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        
        <script src="/static/js/test-results.js"></script>
    </body>
    </html>
  `);
});

// 导出管理页面
app.get('/export', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>导出管理 - API测试管理系统</title>
        <link rel="stylesheet" href="/static/css/style.css">
    </head>
    <body>
        <div class="container">
            <nav class="breadcrumb">
                <a href="/">首页</a> > 导出管理
            </nav>
            
            <h1>导出管理</h1>
            
            <div class="export-section">
                <div class="form-group">
                    <label for="exportPlanSelect">选择测试计划 *</label>
                    <select id="exportPlanSelect" name="exportPlanSelect" required>
                        <option value="">请选择要导出的测试计划</option>
                    </select>
                </div>
                
                <div class="export-options">
                    <h3>导出选项</h3>
                    <div class="checkbox-group">
                        <label>
                            <input type="checkbox" id="includeDetails" checked>
                            包含详细信息
                        </label>
                        <label>
                            <input type="checkbox" id="includeSummary" checked>
                            包含测试总结
                        </label>
                        <label>
                            <input type="checkbox" id="includeTimestamp" checked>
                            包含时间戳
                        </label>
                    </div>
                </div>
                
                <div class="export-controls">
                    <button id="exportBtn" class="btn-primary" onclick="exportToExcel()">导出Excel</button>
                    <button id="previewBtn" class="btn-secondary" onclick="previewExport()">预览</button>
                </div>
                
                <div id="exportStatus" class="export-status" style="display: none;">
                    <!-- 导出状态信息 -->
                </div>
                
                <div id="exportPreview" class="export-preview" style="display: none;">
                    <h3>导出预览</h3>
                    <div id="previewContent">
                        <!-- 预览内容 -->
                    </div>
                </div>
            </div>
        </div>
        
        <script src="/static/js/export.js"></script>
    </body>
    </html>
  `);
});

const port = 9999;
console.log(`服务器运行在 http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port
});
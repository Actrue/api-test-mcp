interface ApiTestOptions {
  url: string;
  method?: string;
  query?: Record<string, string>;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
}

interface ApiTestResponse {
  status: boolean;
  message: string;
  data: {
    statusCode: number;
    headers: Record<string, string>;
    body: any;
    responseTime?: number;
    retryCount?: number;
  };
}

import axios, { AxiosError } from 'axios';

/**
 * 延迟函数
 * @param ms 延迟毫秒数
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * API测试函数，支持重试机制和超时设置
 * @param options 测试选项
 * @returns 测试结果
 */
export async function apiTest({
  url,
  method,
  query,
  headers,
  body,
  timeout = 10000, // 默认10秒超时
  retries = 3 // 默认重试3次
}: ApiTestOptions): Promise<ApiTestResponse> {
  let lastError: Error | null = null;
  let retryCount = 0;
  const startTime = Date.now();

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // 如果不是第一次尝试，等待一段时间再重试
      if (attempt > 0) {
        const delayTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // 指数退避，最大5秒
        await delay(delayTime);
        retryCount++;
      }

      // 发送请求
      const response = await axios({
        url,
        method: method || (body ? 'POST' : 'GET'),
        params: query,
        headers: {
          'User-Agent': 'API-Test-System/1.0',
          ...headers
        },
        data: body,
        timeout,
        validateStatus: () => true // 接受所有状态码
      });

      // 计算响应时间
      const responseTime = Date.now() - startTime;

      // 处理响应
      const responseHeaders = response.headers as Record<string, string>;
      const responseBody = response.data;

      return {
        status: true,
        message: `请求成功 (状态码: ${response.status})`,
        data: {
          statusCode: response.status,
          headers: responseHeaders,
          body: responseBody,
          responseTime,
          retryCount
        }
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // 如果是最后一次尝试，或者是不可重试的错误，直接返回
      if (attempt === retries || !isRetryableError(error)) {
        break;
      }
    }
  }

  // 所有重试都失败了
  const responseTime = Date.now() - startTime;
  const errorMessage = getErrorMessage(lastError);
  
  return {
    status: false,
    message: `API测试失败 (重试${retryCount}次): ${errorMessage}`,
    data: {
      statusCode: getErrorStatusCode(lastError),
      headers: {},
      body: null,
      responseTime,
      retryCount
    }
  };
}

/**
 * 判断错误是否可以重试
 * @param error 错误对象
 * @returns 是否可以重试
 */
function isRetryableError(error: any): boolean {
  if (error instanceof AxiosError) {
    // 网络错误或超时错误可以重试
    if (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return true;
    }
    
    // 5xx服务器错误可以重试
    if (error.response && error.response.status >= 500) {
      return true;
    }
    
    // 429 Too Many Requests 可以重试
    if (error.response && error.response.status === 429) {
      return true;
    }
  }
  
  return false;
}

/**
 * 获取错误消息
 * @param error 错误对象
 * @returns 错误消息
 */
function getErrorMessage(error: Error | null): string {
  if (!error) return '未知错误';
  
  if (error instanceof AxiosError) {
    if (error.code === 'ECONNABORTED') {
      return '请求超时';
    }
    if (error.code === 'ENOTFOUND') {
      return '域名解析失败';
    }
    if (error.code === 'ECONNREFUSED') {
      return '连接被拒绝';
    }
    if (error.response) {
      return `HTTP ${error.response.status}: ${error.response.statusText}`;
    }
  }
  
  return error.message;
}

/**
 * 获取错误状态码
 * @param error 错误对象
 * @returns 状态码
 */
function getErrorStatusCode(error: Error | null): number {
  if (error instanceof AxiosError && error.response) {
    return error.response.status;
  }
  return 0;
}
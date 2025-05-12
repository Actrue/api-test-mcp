interface ApiTestOptions {
  url: string;
  method?: string;
  query?: Record<string, string>;
  headers?: Record<string, string>;
  body?: any;
}

interface ApiTestResponse {
  status: boolean;
  message: string;
  data: {
    statusCode: number;
    headers: Record<string, string>;
    body: any;
  };
}

import axios from 'axios';

export async function apiTest({
  url,
  method,
  query,
  headers,
  body
}: ApiTestOptions): Promise<ApiTestResponse> {
  try {
    // 发送请求
    const response = await axios({
      url,
      method: method || (body ? 'POST' : 'GET'),
      params: query,
      headers: headers || {},
      data: body
    });

    // 处理响应
    const responseHeaders = response.headers as Record<string, string>;
    const responseBody = response.data;

    return {
      status: true,
      message: '请求成功',
      data: {
        statusCode: response.status,
        headers: responseHeaders,
        body: responseBody
      }
    };
  } catch (error) {
    return {
      status: false,
      message: `API测试失败: ${error instanceof Error ? error.message : String(error)}`,
      data: {
        statusCode: 0,
        headers: {},
        body: null
      }
    };
  }
}
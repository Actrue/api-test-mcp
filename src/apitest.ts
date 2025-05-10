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

export async function apiTest({
  url,
  method,
  query,
  headers,
  body
}: ApiTestOptions): Promise<ApiTestResponse> {
  try {
    // 处理查询参数
    const urlObj = new URL(url);
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        urlObj.searchParams.append(key, value);
      });
    }

    // 发送请求
    const response = await fetch(urlObj.toString(), {
      method: method || (body ? 'POST' : 'GET'),
      headers: headers || {},
      body: body ? JSON.stringify(body) : undefined
    });

    // 处理响应
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    let responseBody;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      responseBody = await response.json();
    } else {
      responseBody = await response.text();
    }

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
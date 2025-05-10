interface ApiTestOptions {
  url: string;
  query?: Record<string, string>;
  headers?: Record<string, string>;
  body?: any;
}

interface ApiTestResponse {
  headers: Record<string, string>;
  body: any;
}

export async function apiTest({
  url,
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
      method: body ? 'POST' : 'GET',
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
      headers: responseHeaders,
      body: responseBody
    };
  } catch (error) {
    throw new Error(`API测试失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}
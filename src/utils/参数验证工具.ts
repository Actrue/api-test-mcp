/**
 * 参数验证工具模块
 * 提供各种参数验证函数，用于API接口的输入验证
 */

/**
 * 验证结果接口
 */
interface ValidationResult {
  state: boolean;
  message: string;
  data: any;
}

/**
 * 验证字符串是否为空或未定义
 * @param value 要验证的值
 * @param fieldName 字段名称
 * @returns 验证结果
 */
export function validateRequired(value: any, fieldName: string): ValidationResult {
  if (value === undefined || value === null || value === '') {
    return {
      state: false,
      message: `${fieldName}不能为空`,
      data: null
    };
  }
  return {
    state: true,
    message: '验证通过',
    data: value
  };
}

/**
 * 验证字符串长度
 * @param value 要验证的字符串
 * @param fieldName 字段名称
 * @param minLength 最小长度
 * @param maxLength 最大长度
 * @returns 验证结果
 */
export function validateStringLength(value: string, fieldName: string, minLength: number = 1, maxLength: number = 255): ValidationResult {
  if (typeof value !== 'string') {
    return {
      state: false,
      message: `${fieldName}必须是字符串类型`,
      data: null
    };
  }
  
  if (value.length < minLength) {
    return {
      state: false,
      message: `${fieldName}长度不能少于${minLength}个字符`,
      data: null
    };
  }
  
  if (value.length > maxLength) {
    return {
      state: false,
      message: `${fieldName}长度不能超过${maxLength}个字符`,
      data: null
    };
  }
  
  return {
    state: true,
    message: '验证通过',
    data: value
  };
}

/**
 * 验证数组是否为空
 * @param value 要验证的数组
 * @param fieldName 字段名称
 * @returns 验证结果
 */
export function validateArrayNotEmpty(value: any, fieldName: string): ValidationResult {
  if (!Array.isArray(value)) {
    return {
      state: false,
      message: `${fieldName}必须是数组类型`,
      data: null
    };
  }
  
  if (value.length === 0) {
    return {
      state: false,
      message: `${fieldName}不能为空数组`,
      data: null
    };
  }
  
  return {
    state: true,
    message: '验证通过',
    data: value
  };
}

/**
 * 验证UUID格式
 * @param value 要验证的UUID字符串
 * @param fieldName 字段名称
 * @returns 验证结果
 */
export function validateUUID(value: string, fieldName: string): ValidationResult {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (typeof value !== 'string') {
    return {
      state: false,
      message: `${fieldName}必须是字符串类型`,
      data: null
    };
  }
  
  if (!uuidRegex.test(value)) {
    return {
      state: false,
      message: `${fieldName}格式不正确，必须是有效的UUID`,
      data: null
    };
  }
  
  return {
    state: true,
    message: '验证通过',
    data: value
  };
}

/**
 * 验证URL格式
 * @param value 要验证的URL字符串
 * @param fieldName 字段名称
 * @returns 验证结果
 */
export function validateURL(value: string, fieldName: string): ValidationResult {
  if (typeof value !== 'string') {
    return {
      state: false,
      message: `${fieldName}必须是字符串类型`,
      data: null
    };
  }
  
  try {
    new URL(value);
    return {
      state: true,
      message: '验证通过',
      data: value
    };
  } catch {
    return {
      state: false,
      message: `${fieldName}格式不正确，必须是有效的URL`,
      data: null
    };
  }
}

/**
 * 验证HTTP方法
 * @param value 要验证的HTTP方法
 * @param fieldName 字段名称
 * @returns 验证结果
 */
export function validateHTTPMethod(value: string, fieldName: string): ValidationResult {
  const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
  
  if (typeof value !== 'string') {
    return {
      state: false,
      message: `${fieldName}必须是字符串类型`,
      data: null
    };
  }
  
  if (!validMethods.includes(value.toUpperCase())) {
    return {
      state: false,
      message: `${fieldName}必须是有效的HTTP方法: ${validMethods.join(', ')}`,
      data: null
    };
  }
  
  return {
    state: true,
    message: '验证通过',
    data: value.toUpperCase()
  };
}

/**
 * 验证JSON字符串
 * @param value 要验证的JSON字符串
 * @param fieldName 字段名称
 * @returns 验证结果
 */
export function validateJSON(value: string, fieldName: string): ValidationResult {
  if (typeof value !== 'string') {
    return {
      state: false,
      message: `${fieldName}必须是字符串类型`,
      data: null
    };
  }
  
  if (value.trim() === '') {
    return {
      state: true,
      message: '验证通过',
      data: {}
    };
  }
  
  try {
    const parsed = JSON.parse(value);
    return {
      state: true,
      message: '验证通过',
      data: parsed
    };
  } catch {
    return {
      state: false,
      message: `${fieldName}必须是有效的JSON格式`,
      data: null
    };
  }
}

/**
 * 验证测试任务对象
 * @param task 要验证的任务对象
 * @returns 验证结果
 */
export function validateTestTask(task: any): ValidationResult {
  if (typeof task !== 'object' || task === null) {
    return {
      state: false,
      message: '任务必须是对象类型',
      data: null
    };
  }
  
  // 验证任务名称
  const nameValidation = validateRequired(task.name, '任务名称');
  if (!nameValidation.state) {
    return nameValidation;
  }
  
  const nameStringValidation = validateStringLength(task.name, '任务名称', 1, 100);
  if (!nameStringValidation.state) {
    return nameStringValidation;
  }
  
  // 验证URL
  const urlValidation = validateRequired(task.url, '请求URL');
  if (!urlValidation.state) {
    return urlValidation;
  }
  
  const urlFormatValidation = validateURL(task.url, '请求URL');
  if (!urlFormatValidation.state) {
    return urlFormatValidation;
  }
  
  // 验证HTTP方法
  const methodValidation = validateRequired(task.method, '请求方法');
  if (!methodValidation.state) {
    return methodValidation;
  }
  
  const methodFormatValidation = validateHTTPMethod(task.method, '请求方法');
  if (!methodFormatValidation.state) {
    return methodFormatValidation;
  }
  
  // 验证请求头（可选）
  if (task.headers !== undefined && task.headers !== null && task.headers !== '') {
    const headersValidation = validateJSON(task.headers, '请求头');
    if (!headersValidation.state) {
      return headersValidation;
    }
  }
  
  // 验证请求体（可选）
  if (task.body !== undefined && task.body !== null && task.body !== '') {
    const bodyValidation = validateJSON(task.body, '请求体');
    if (!bodyValidation.state) {
      return bodyValidation;
    }
  }
  
  return {
    state: true,
    message: '任务验证通过',
    data: task
  };
}

/**
 * 批量验证测试任务数组
 * @param tasks 要验证的任务数组
 * @returns 验证结果
 */
export function validateTestTasks(tasks: any): ValidationResult {
  const arrayValidation = validateArrayNotEmpty(tasks, '任务列表');
  if (!arrayValidation.state) {
    return arrayValidation;
  }
  
  for (let i = 0; i < tasks.length; i++) {
    const taskValidation = validateTestTask(tasks[i]);
    if (!taskValidation.state) {
      return {
        state: false,
        message: `第${i + 1}个任务验证失败: ${taskValidation.message}`,
        data: null
      };
    }
  }
  
  return {
    state: true,
    message: '所有任务验证通过',
    data: tasks
  };
}
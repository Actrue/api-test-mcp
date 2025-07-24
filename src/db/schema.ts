// JSON数据库的类型定义文件

// 测试表数据结构
export interface TestTable {
    uuid: string;
    name: string;
    status: boolean;
    isFinish: boolean;
    createTime: string;
    updatedAt: string;
}

// 测试任务数据结构
export interface TestTask {
    uuid: string;
    testTableUuid: string;
    name: string;
    url: string;
    method: string;
    query?: object;
    headers?: object;
    body?: object;
    hopeRes: string;
    res?: string;
    review?: string;
    suggest?: string;
    isFinish: boolean;
    status: boolean;
    createTime: string;
    updatedAt: string;
}

// 为了保持与原有代码的兼容性，导出类型别名
export type { TestTable as testTable };
export type { TestTask as testTask };

// 新增类型定义，用于插入操作
  export type CreateTestTable = Omit<TestTable, 'uuid' | 'createTime' | 'updatedAt'> & {
    uuid?: string;
    createTime?: string;
    updatedAt?: string;
};

export type CreateTestTask = Omit<TestTask, 'uuid' | 'createTime' | 'updatedAt'> & {
    uuid?: string;
    createTime?: string;
    updatedAt?: string;
}
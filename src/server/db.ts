import { PrismaClient } from "../../generated/prisma/index.js";

const prisma = new PrismaClient()

export interface TaskInput {
    name: string;
    method: string;
    url: string;
    query?: object;
    headers?: object;
    body?: object;
    hopeRes: string;
}

export interface TaskUpdateInput {
    name?: string;
    method?: string;
    url?: string;
    query?: object;
    headers?: object;
    body?: object;
    hopeRes?: string;
    res?: string;
    review?: string;
    suggest?: string;
    isFinish?: boolean;
    status?: boolean;
}

export interface ApiResponse<T> {
    state: number;
    message: string;
    data: T | null;
}

export const db = {
    createTestPlanWithTasks,
    updateTaskByUuid,
    getTasksByTableUuid,
    getAllTable,
    addTasksToPlan,
    updateTaskWithSummary
}

async function createTestPlanWithTasks(planName: string, tasks: Array<TaskInput>) {
    try {
        const result = await prisma.$transaction(async (tx) => {
            const testPlan = await tx.testTable.create({
                data: {
                    name: planName
                }
            });

            const createdTasks = await Promise.all(
                tasks.map(task => tx.testTask.create({
                    data: {
                        name: task.name,
                        method: task.method,
                        url: task.url,
                        query: task.query,
                        headers: task.headers,
                        body: task.body,
                        hopeRes: task.hopeRes,
                        testTableUuid: testPlan.uuid
                    }
                }))
            );

            return {
                state: true,
                message: '创建成功',
                data: {
                    plan: testPlan,
                    tasks: createdTasks
                }
            };
        });
        return result;
    } catch (error) {
        return {
            state: false,
            message: error instanceof Error ? error.message : '创建失败',
            data: null
        };
    }
}

async function updateTaskByUuid(uuid: string, updateData: TaskUpdateInput) {
    try {
        const updatedTask = await prisma.testTask.update({
            where: { uuid },
            data: updateData
        });

        return {
            state: true,
            message: '更新成功',
            data: updatedTask
        };
    } catch (error) {
        return {
            state: false,
            message: error instanceof Error ? error.message : '更新失败',
            data: null
        };
    }
}

async function getTasksByTableUuid(tableUuid: string) {
    try {
        const tasks = await prisma.testTask.findMany({
            where: { testTableUuid: tableUuid },
            orderBy: { createTime: 'asc' }
        });

        return {
            state: true,
            message: '查询成功',
            data: tasks
        };
    } catch (error) {
        return {
            state: false,
            message: error instanceof Error ? error.message : '查询失败',
            data: null
        };
    }
}

async function getAllTable(uuid: string | undefined) {
    try {
        if (uuid) {
            const tables = await prisma.testTable.findFirst({
                where: { uuid },
                include: { testTasks: true }
            });
            return {
                state: true,
                message: '查询成功',
                data: tables?.testTasks
            }
        }else{
            const tables = await prisma.testTable.findMany({});
            return{
                state: true,
                message: '查询成功',
                data: tables,
            }
        }
    }catch(error){

        return{
            state: false,
            message: error instanceof Error? error.message : '查询失败',
            data: null
        }
    }
}



async function addTasksToPlan(uuid: string, tasks: Array<TaskInput>) {
    try {
        const createdTasks = await prisma.$transaction(
            tasks.map(task => prisma.testTask.create({
                data: {
                    name: task.name,
                    method: task.method,
                    url: task.url,
                    query: task.query,
                    headers: task.headers,
                    body: task.body,
                    hopeRes: task.hopeRes,
                    testTableUuid: uuid
                }
            }))
        );

        return {
            state: true,
            message: `成功在${uuid}计划表增加任务`,
            data: createdTasks
        };
    } catch (error) {
        return {
            state: false,
            message: error instanceof Error ? error.message : '创建失败',
            data: null
        };
    }
}
async function updateTaskWithSummary(tasks: Array<{uuid: string, summary: string, suggest?: string}>) {
    try {
        const results = await prisma.$transaction(
            tasks.map(task => prisma.testTask.update({
                where: { uuid: task.uuid },
                data: {
                    review: task.summary,
                    suggest: task.suggest || null,
                    isFinish: true,
                    status: true
                }
            }))
        );

        return {
            state: true,
            message: `成功为${tasks.length}个任务添加总结`,
            data: results
        };
    } catch (error) {
        return {
            state: false,
            message: error instanceof Error ? error.message : '批量更新失败',
            data: null
        };
    }
}


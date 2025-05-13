import * as XLSX from 'xlsx';
import { db } from './db.js';
import path from 'path';
import fs from 'fs';

export async function exportToExcel(uuid: string) {
    try {
        // 获取测试任务数据
        const result = await db.getAllTable(uuid);
        
        if (!result.state || !result.data) {
            return {
                state: false,
                message: '获取数据失败: ' + result.message,
                data: null
            };
        }
        
        // 创建工作簿
        const wb = XLSX.utils.book_new();
        
        // 转换数据为工作表
    
        const dataToExport = result.data ? result.data.map(item => {

            //@ts-ignore
            if (item.query) item.query = JSON.stringify(item.query, null, 2);
            //@ts-ignore
            if (item.headers) item.headers = JSON.stringify(item.headers, null, 2);
            //@ts-ignore
            if (item.body) item.body = JSON.stringify(item.body, null, 2);
            return item;
        }) : [];
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        
        // 添加工作表到工作簿
        XLSX.utils.book_append_sheet(wb, ws, '测试任务');
        
        // 检查并创建data目录
        const dataDir = path.join(process.cwd(), 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir);
        }
        
        // 生成文件名和路径
        const fileName = `${uuid}.xlsx`;
        const filePath = path.join(dataDir, fileName);
        
        // 写入文件
        XLSX.writeFile(wb, filePath);
        
        return {
            state: true,
            message: `成功导出${dataToExport.length || 0}条测试任务`,
            data: filePath
        };
    } catch (error) {
        return {
            state: false,
            message: error instanceof Error ? error.message : '导出Excel失败',
            data: null
        };
    }
}

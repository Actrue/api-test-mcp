# 使用官方Node.js镜像作为基础镜像
## 暂时不可用
FROM node:22-alpine

# 设置工作目录
WORKDIR /usr/src/app

# 复制package.json和package-lock.json
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN npm install -g pnpm && pnpm install

# 复制项目文件
COPY . .
# pnpm i && pnpm run db-init && pnpm run build && npm run start
# 构建项目
RUN pnpm run db-init

RUN pnpm run build

# 创建非特权用户并修改工作目录所有权
RUN adduser -D -u 1001 appuser && chown -R appuser /usr/src/app

# 暴露3000端口
EXPOSE 3000

# 切换到非特权用户
USER appuser

# 启动应用
CMD ["pnpm", "run", "start"]
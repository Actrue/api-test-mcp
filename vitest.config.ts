import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // 测试环境配置
    environment: 'node',
    // 测试文件匹配模式
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    // 排除文件
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    // 全局设置
    globals: true,
    // 测试超时时间
    testTimeout: 10000,
    // 钩子超时时间
    hookTimeout: 10000,
    // 测试报告
    reporter: ['verbose', 'json'],
    // 覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/**/*.d.ts',
        'src/**/*.test.ts',
        'src/**/*.spec.ts'
      ]
    }
  }
})
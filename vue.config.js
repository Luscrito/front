const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,

  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:8081', // 你的 Spring Boot 后端
        changeOrigin: true
      }
    }
  }
})

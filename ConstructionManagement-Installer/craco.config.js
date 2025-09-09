const million = require('million/compiler');

module.exports = {
  webpack: {
    plugins: [
      million.webpack({
        auto: true, // 자동으로 최적화할 컴포넌트 감지
        optimize: true, // 최적화 활성화
        server: true, // 서버 사이드 렌더링 지원
      })
    ],
    configure: (webpackConfig, { env, paths }) => {
      // 프로덕션 빌드 최적화
      if (env === 'production') {
        webpackConfig.optimization = {
          ...webpackConfig.optimization,
          splitChunks: {
            chunks: 'all',
            cacheGroups: {
              vendor: {
                test: /[\\/]node_modules[\\/]/,
                name: 'vendors',
                chunks: 'all',
              },
            },
          },
        };
      }
      return webpackConfig;
    }
  },
  devServer: {
    setupMiddlewares: (middlewares, devServer) => {
      // deprecated onBeforeSetupMiddleware와 onAfterSetupMiddleware 대신 사용
      return middlewares;
    },
    client: {
      overlay: {
        warnings: false,
        errors: true,
      },
    },
  }
};
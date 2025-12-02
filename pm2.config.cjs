module.exports = {
apps: [
    {
    name: 'api-highload',
    script: './server.js',
    exec_mode: 'cluster',
    instances: 'max',
    max_memory_restart: '1G',
    autorestart: true,
    env: {
    NODE_ENV: 'production',
    PORT: 3001,
    NODE_ENV: 'test',
    RABBITMQ_HOST:'localhost',
    RABBITMQ_PORT:5672,
    RABBITMQ_PORT_API_OVERVIEW:15672,
    RABBITMQ_USER:'guest',
    RABBITMQ_PASS:'guest',
    HOST_SERVICE:'localhost',
    DEBUG:true
    }
    },
    {
      name: "worker-rabbit",
      script: "./worker.js",
      exec_mode: "cluster",
      instances: "max",
      autorestart: true,
      max_memory_restart: "512M"
    }
  ]
};
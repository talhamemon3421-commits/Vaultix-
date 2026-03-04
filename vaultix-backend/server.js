
require('dotenv').config();
const app = require('./src/app');
const { connectDB } = require('./src/infrastructure/database');
const config = require('./src/config');

const start = async () => {
  await connectDB();
  
  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
  });
};

start();


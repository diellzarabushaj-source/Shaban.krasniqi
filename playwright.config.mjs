import {defineConfig} from '@playwright/test';

export default defineConfig({
  testDir:'./tests',
  timeout:30000,
  retries:0,
  workers:1,
  reporter:'line',
  use:{
    baseURL:'http://127.0.0.1:4173',
    browserName:'chromium'
  },
  webServer:{
    command:'node scripts/serve-site.mjs',
    url:'http://127.0.0.1:4173',
    reuseExistingServer:false,
    timeout:10000
  }
});

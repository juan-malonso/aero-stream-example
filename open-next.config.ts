import { defineCloudflareConfig } from '@opennextjs/cloudflare';

const config = defineCloudflareConfig({
  incrementalCache: 'dummy',
});

config.cloudflare = {
  ...config.cloudflare,
  useWorkerdCondition: false,
};

export default config;

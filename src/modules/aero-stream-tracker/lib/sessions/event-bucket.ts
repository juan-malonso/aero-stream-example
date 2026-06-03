import { getCloudflareContext } from '@opennextjs/cloudflare';

import type { SessionsEventBucket } from './r2-store.ts';

interface EventBucketEnv {
  DESTINATION_EVENTS_BUCKET: SessionsEventBucket;
}

export function getDestinationEventsBucket(): SessionsEventBucket {
  const context = getCloudflareContext();
  const bucket = (context.env as EventBucketEnv).DESTINATION_EVENTS_BUCKET;

  if (!bucket) {
    throw new Error('DESTINATION_EVENTS_BUCKET binding is required');
  }

  return bucket;
}

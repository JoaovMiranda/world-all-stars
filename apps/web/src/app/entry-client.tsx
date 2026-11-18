import './styles.css';

import { RouterClient } from '@tanstack/react-router/ssr/client';
import { StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';

import { DATA_SOURCE } from '@/data/data-layer.const';
import { createQueryClient } from '@/data/query-client';

import { createAppRouter } from './create-router';
import { initClientScope } from './request-scope';
import { startWebVitals } from './web-vitals.helper';

// Browser entry: hydrates the document rendered by entry-server (served by apps/server, doc 12).
const queryClient = createQueryClient();
initClientScope({ queryClient });
const router = createAppRouter({ queryClient });

hydrateRoot(
  document,
  <StrictMode>
    <RouterClient router={router} />
  </StrictMode>,
);

// Field metrics of real visitors (RUM): only where a server receives them.
if (DATA_SOURCE === 'http') startWebVitals();

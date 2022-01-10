import * as Sentry from '@sentry/node';

const SENTRY_DSN = process.env.SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
  });
}

export const logError = (e: Error) => {
  if (SENTRY_DSN) {
    Sentry.captureException(e);
  }
  console.error(e);
};
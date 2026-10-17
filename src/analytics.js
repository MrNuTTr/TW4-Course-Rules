// Page-view analytics through Azure Application Insights. Does nothing unless a
// connection string is provided at build time, and uses no cookies.
export async function initAnalytics() {
  const connectionString = import.meta.env.VITE_APPINSIGHTS_CONNECTION_STRING;
  if (!connectionString || import.meta.env.DEV) return;

  const { ApplicationInsights } = await import('@microsoft/applicationinsights-web');
  const appInsights = new ApplicationInsights({
    config: {
      connectionString,
      disableCookiesUsage: true,
      enableAutoRouteTracking: true,
    },
  });
  appInsights.loadAppInsights();
  appInsights.trackPageView();
}

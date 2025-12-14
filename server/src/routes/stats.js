import { fetchStatsOverview } from '../services/statsService.js';

export default async function statsRoutes(app) {
  app.get('/stats', async () => {
    return fetchStatsOverview();
  });
}

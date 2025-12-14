import { apiClient } from '../apiClient';
import { convertDateTimeToTimeZone } from '../dateUtils';

export const savePartidaSnapshot = async ({
  gameId,
  tableId,
  tableNumber,
  partidaIndex,
  pair1Players,
  pair2Players,
  pair1Points,
  pair2Points,
  finishedAt,
}) => {
  try {
    await apiClient.post(`/games/${gameId}/snapshots`, {
      tableId,
      tableNumber,
      partidaIndex,
      pair1Players,
      pair2Players,
      pair1Points,
      pair2Points,
      finishedAt,
    });
    return true;
  } catch (e) {
    console.warn('savePartidaSnapshot skipped:', e.message);
    return false;
  }
};

export const getPartidaSnapshotsByGame = async (gameId) => {
  try {
    const data = await apiClient.get(`/games/${gameId}/snapshots`);
    return (data || []).map((r) => ({
      ...r,
      finished_at: r.finished_at ? convertDateTimeToTimeZone(r.finished_at) : null,
      created_at: r.created_at ? convertDateTimeToTimeZone(r.created_at) : null,
      updated_at: r.updated_at ? convertDateTimeToTimeZone(r.updated_at) : null,
    }));
  } catch (e) {
    console.warn('getPartidaSnapshotsByGame fallback to []:', e.message);
    return [];
  }
};

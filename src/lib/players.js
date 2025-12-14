import { apiClient } from './apiClient';

export const getPlayers = async () => {
  const data = await apiClient.get('/players');
  return (data || []).map((player) => ({ ...player, playerType: player.playerType || player.player_type }));
};

export const savePlayer = async (player) => {
  const payload = {
    name: player.name,
    nickname: player.nickname,
    email: player.email || null,
    phone: player.phone || null,
    photo: player.photo || null,
    playerType: player.playerType || player.player_type || null,
  };

  if (player.id) {
    const updated = await apiClient.put(`/players/${player.id}`, payload);
    return updated ? { ...updated, playerType: updated.playerType || updated.player_type } : null;
  }

  const created = await apiClient.post('/players', payload);
  return created ? { ...created, playerType: created.playerType || created.player_type } : null;
};

export const getPlayerById = async (id) => {
  try {
    const player = await apiClient.get(`/players/${id}`);
    return player ? { ...player, playerType: player.playerType || player.player_type } : null;
  } catch (error) {
    console.error('Error fetching player by ID:', error);
    return null;
  }
};

export const deletePlayer = async (id) => {
  try {
    await apiClient.delete(`/players/${id}`);
    return true;
  } catch (error) {
    console.error('Error deleting player:', error);
    return false;
  }
};
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getAttendanceByGame,
  checkInPlayer,
  checkOutPlayer,
  backfillMissingCheckouts,
} from '../attendanceService.js';

const dbMocks = vi.hoisted(() => {
  const mockClient = { query: vi.fn() };
  const mockPoolQuery = vi.fn();
  const mockWithTransaction = vi.fn(async (callback) => callback(mockClient));
  return { mockClient, mockPoolQuery, mockWithTransaction };
});

const dateMocks = vi.hoisted(() => {
  const mockNowUTC = vi.fn(() => '2024-01-01T00:00:00.000Z');
  const mockConvertToUTC = vi.fn((value) => `utc-${value}`);
  return { mockNowUTC, mockConvertToUTC };
});

vi.mock('../../db/pool.js', () => ({
  query: dbMocks.mockPoolQuery,
  withTransaction: dbMocks.mockWithTransaction,
}));

vi.mock('../../utils/dates.js', () => ({
  nowUTC: dateMocks.mockNowUTC,
  convertToUTC: dateMocks.mockConvertToUTC,
}));

const { mockClient, mockPoolQuery, mockWithTransaction } = dbMocks;
const { mockNowUTC, mockConvertToUTC } = dateMocks;

beforeEach(() => {
  vi.clearAllMocks();
  mockClient.query.mockReset();
  mockPoolQuery.mockReset();
  mockWithTransaction.mockImplementation(async (callback) => callback(mockClient));
  mockNowUTC.mockReset();
  mockNowUTC.mockReturnValue('2024-01-01T00:00:00.000Z');
  mockConvertToUTC.mockReset();
  mockConvertToUTC.mockImplementation((value) => `utc-${value}`);
});

describe('getAttendanceByGame', () => {
  it('returns attendance with computed bench players', async () => {
    const attendanceRows = [
      { id: 'att-1', player_id: 'player-1', check_in_time: '2024-01-01T10:00:00.000Z', check_out_time: null },
      { id: 'att-2', player_id: 'player-2', check_in_time: '2024-01-01T10:05:00.000Z', check_out_time: null },
    ];
    mockPoolQuery
      .mockResolvedValueOnce({ rows: attendanceRows })
      .mockResolvedValueOnce({ rows: [{ player_id: 'player-2' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'player-1', nickname: 'Ana', name: 'Ana P', photo: '' }] });

    const result = await getAttendanceByGame('game-1');

    expect(result.attendance).toEqual(attendanceRows);
    expect(result.bench).toEqual([
      {
        id: 'player-1',
        player_id: 'player-1',
        name: 'Ana P',
        nickname: 'Ana',
        photo: '',
        check_in_time: '2024-01-01T10:00:00.000Z',
      },
    ]);
    expect(mockPoolQuery).toHaveBeenNthCalledWith(1, 'SELECT * FROM game_attendance WHERE game_id = $1 ORDER BY check_in_time ASC', ['game-1']);
  });

  it('throws when the game does not exist', async () => {
    mockPoolQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    await expect(getAttendanceByGame('missing-game')).rejects.toThrow('La velada no existe.');
  });
});

describe('checkInPlayer', () => {
  it('registers a new check-in when the game is open', async () => {
    const inserted = { id: 'att-1', player_id: 'player-1' };
    mockClient.query
      .mockResolvedValueOnce({ rows: [{ id: 'game-1', status: 'En curso' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [inserted] });

    const result = await checkInPlayer('game-1', 'player-1', '2024-02-01T10:00:00.000Z');

    expect(mockConvertToUTC).toHaveBeenCalledWith('2024-02-01T10:00:00.000Z');
    expect(mockClient.query).toHaveBeenCalledTimes(3);
    expect(result).toEqual(inserted);
  });

  it('rejects when the player already has an active entry', async () => {
    mockClient.query
      .mockResolvedValueOnce({ rows: [{ id: 'game-1', status: 'En curso' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'att-1' }] });

    await expect(checkInPlayer('game-1', 'player-1')).rejects.toThrow('El jugador ya tiene una entrada activa');
  });
});

describe('checkOutPlayer', () => {
  it('updates checkout when an active session exists', async () => {
    const updated = { id: 'att-1', check_out_time: '2024-01-01T00:00:00.000Z' };
    mockClient.query
      .mockResolvedValueOnce({ rows: [{ id: 'game-1', status: 'En curso' }] })
      .mockResolvedValueOnce({ rows: [updated] });

    const result = await checkOutPlayer('game-1', 'player-1');

    expect(mockNowUTC).toHaveBeenCalledTimes(1);
    expect(result).toEqual(updated);
  });

  it('throws when there is no active session to close', async () => {
    mockClient.query
      .mockResolvedValueOnce({ rows: [{ id: 'game-1', status: 'En curso' }] })
      .mockResolvedValueOnce({ rows: [] });

    await expect(checkOutPlayer('game-1', 'player-1')).rejects.toThrow('El jugador no tiene una entrada activa');
  });
});

describe('backfillMissingCheckouts', () => {
  it('fills pending checkouts using fallback timestamps', async () => {
    mockClient.query
      .mockResolvedValueOnce({ rows: [{ id: 'att-1' }, { id: 'att-2' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'game-1', status: 'Finalizada', closed_at: '2024-03-01T18:00:00.000Z', updated_at: '2024-03-01T17:00:00.000Z', date: '2024-03-01T12:00:00.000Z' }] })
      .mockResolvedValueOnce({ rows: [{ last_hand: '2024-03-01T19:30:00.000Z' }] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await backfillMissingCheckouts('game-1');

    expect(mockConvertToUTC).toHaveBeenCalledWith('2024-03-01T19:30:00.000Z');
    expect(mockClient.query).toHaveBeenLastCalledWith(
      'UPDATE game_attendance SET check_out_time = $1, updated_at = $2 WHERE game_id = $3 AND check_out_time IS NULL',
      ['utc-2024-03-01T19:30:00.000Z', '2024-01-01T00:00:00.000Z', 'game-1'],
    );
    expect(result).toEqual({ updated: 2 });
  });
});

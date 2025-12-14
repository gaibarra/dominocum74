import { z } from 'zod';
import { query } from '../db/pool.js';

const playerSchema = z.object({
  name: z.string().min(1),
  nickname: z.string().min(1),
  email: z.string().email().nullable().optional(),
  phone: z.string().min(5).nullable().optional(),
  photo: z.string().url().nullable().optional(),
  playerType: z.string().nullable().optional(),
});

const mapRow = (row) => ({
  id: row.id,
  name: row.name,
  nickname: row.nickname,
  email: row.email,
  phone: row.phone,
  photo: row.photo,
  playerType: row.player_type,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

export default async function playerRoutes(app) {
  app.get('/players', async () => {
    const { rows } = await query('SELECT * FROM players ORDER BY nickname ASC');
    return rows.map(mapRow);
  });

  app.get('/players/:id', async (request, reply) => {
    const { id } = request.params;
    const { rows } = await query('SELECT * FROM players WHERE id = $1', [id]);
    if (!rows.length) {
      return reply.notFound('Jugador no encontrado');
    }
    return mapRow(rows[0]);
  });

  app.post('/players', async (request, reply) => {
    const body = playerSchema.parse(request.body);
    const insertSql = `INSERT INTO players (name, nickname, email, phone, photo, player_type)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *`;
    try {
      const { rows } = await query(insertSql, [
        body.name,
        body.nickname,
        body.email ?? null,
        body.phone ?? null,
        body.photo ?? null,
        body.playerType ?? null,
      ]);
      reply.code(201);
      return mapRow(rows[0]);
    } catch (error) {
      if (error.code === '23505') {
        return reply.conflict('El nickname ya existe');
      }
      throw error;
    }
  });

  app.put('/players/:id', async (request, reply) => {
    const { id } = request.params;
    const body = playerSchema.partial().refine((val) => Object.keys(val).length > 0, {
      message: 'No hay campos para actualizar',
    }).parse(request.body);

    const fields = [];
    const values = [];
    let idx = 1;
    for (const [key, value] of Object.entries(body)) {
      fields.push(`${key === 'playerType' ? 'player_type' : key} = $${idx}`);
      values.push(value ?? null);
      idx += 1;
    }
    values.push(id);

    const sql = `UPDATE players SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`;
    const { rows } = await query(sql, values);
    if (!rows.length) {
      return reply.notFound('Jugador no encontrado');
    }
    return mapRow(rows[0]);
  });

  app.delete('/players/:id', async (request, reply) => {
    const { id } = request.params;
    const { rowCount } = await query('DELETE FROM players WHERE id = $1', [id]);
    if (!rowCount) {
      return reply.notFound('Jugador no encontrado');
    }
    reply.code(204);
  });
}

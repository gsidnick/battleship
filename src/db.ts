import { Players, Rooms, Winners, Clients } from './types';

interface Database {
  roomIndex: number;
  gameIndex: number;
  clients: Clients;
  players: Players;
  rooms: Rooms;
  winners: Winners;
}

const db: Database = {
  roomIndex: 0,
  gameIndex: 0,
  clients: [],
  players: [],
  rooms: [],
  winners: [],
};

export const isPlayerExist = (name: string) => {
  return db.players.some((player) => player.name === name);
};

export default db;

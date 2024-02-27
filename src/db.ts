import { Players, Rooms, Winners, Clients, Games } from './types';

interface Database {
  roomIndex: number;
  gameIndex: number;
  clients: Clients;
  players: Players;
  rooms: Rooms;
  winners: Winners;
  games: Games;
}

const db: Database = {
  roomIndex: 0,
  gameIndex: 0,
  clients: [],
  players: [],
  rooms: [],
  winners: [],
  games: [],
};

export const isPlayerExist = (name: string): boolean => {
  return db.players.some((player) => player.name === name);
};

export default db;

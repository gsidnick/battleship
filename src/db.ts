import { Players, Rooms, Winners } from './types';

interface Database {
  roomIndex: number;
  players: Players;
  rooms: Rooms;
  winners: Winners;
}

const db: Database = {
  roomIndex: 0,
  players: [],
  rooms: [],
  winners: [],
};

export const isPlayerExist = (name: string) => {
  return db.players.some((player) => player.name === name);
};

export default db;

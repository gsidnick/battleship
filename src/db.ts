import { Players, Rooms } from './types';

interface Database {
  roomIndex: number;
  players: Players;
  rooms: Rooms;
}

const db: Database = {
  roomIndex: 0,
  players: [],
  rooms: [],
};

export const isPlayerExist = (name: string) => {
  return db.players.some((player) => player.name === name);
};

export default db;

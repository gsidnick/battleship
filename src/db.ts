import { Players } from './types';

interface Database {
  players: Players;
}

const db: Database = {
  players: [],
};

export const isPlayerExist = (name: string) => {
  return db.players.some((player) => player.name === name);
};

export default db;

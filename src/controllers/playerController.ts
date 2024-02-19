import db from '../db';
import { PlayerCredentials, Response, PlayerResponse, Player } from '../types';
import { generateId, hashPassword, verifyPassword } from '../utils';

export const registration = (data: PlayerCredentials): Response<PlayerResponse> => {
  const { name, password } = data;
  const playerId = generateId(db.players);
  const hashedPassword = hashPassword(password);
  const player: Player = {
    playerId,
    name,
    password: hashedPassword,
  };

  db.players.push(player);

  return {
    type: 'reg',
    data: {
      name,
      index: playerId,
      error: false,
      errorText: '',
    },
    id: 0,
  };
};

export const login = (data: PlayerCredentials): Response<PlayerResponse> => {
  const { name, password } = data;
  const player: Player | undefined = db.players.find((item) => item.name === name);
  let error = false;
  let errorText = '';
  let index = 0;

  if (player) {
    index = player.playerId;
  }

  if (player && !verifyPassword(password, player.password)) {
    error = true;
    errorText = 'Invalid password';
  }

  return {
    type: 'reg',
    data: {
      name,
      index,
      error,
      errorText,
    },
    id: 0,
  };
};

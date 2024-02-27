import db from '../db';
import { Response, Winners } from '../types';

// eslint-disable-next-line import/prefer-default-export
export const updateWinners = (): Response<Winners> => {
  const { winners } = db;
  return {
    type: 'update_winners',
    data: winners,
    id: 0,
  };
};

export const setWinner = (name: string): void => {
  let winnerIndex = -1;

  db.winners.forEach((item, i) => {
    if (item.name === name) {
      winnerIndex = i;
    }
  });

  if (winnerIndex === -1) {
    db.winners.push({ name, wins: 1 });
  } else {
    db.winners[winnerIndex].wins += 1;
  }
};

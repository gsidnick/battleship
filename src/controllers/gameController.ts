import db from '../db';
import { stringifyResponse } from '../utils';
import { Response, GamePlayer, PlayerShips } from '../types';

export const createGame = (playerId: number): Response<GamePlayer> => {
  const gameId = db.gameIndex + 1;
  db.gameIndex = gameId;

  const game: GamePlayer = {
    idGame: gameId,
    idPlayer: playerId,
  };

  return {
    type: 'create_game',
    data: game,
    id: 0,
  };
};

export const addShipsToGame = (playerShips: PlayerShips, playerIndex: number): void => {
  const { gameId, ships } = playerShips;
  const gameShips = { ships, indexPlayer: playerIndex };
  let index = -1;

  db.games.forEach((game, i) => {
    if (game.gameId === gameId) {
      index = i;
    }
  });

  if (index >= 0) {
    db.games[index].gameShips.push(gameShips);
  } else {
    db.games.push({ gameId, gameShips: [gameShips] });
  }
};

export const getShipsFromGame = (gameId: number): PlayerShips[] => {
  const game = db.games.find((item) => item.gameId === gameId);

  if (game) {
    return game.gameShips.map((item) => ({ gameId, ships: item.ships, indexPlayer: item.indexPlayer }));
  }

  return [];
};

export const startGame = (players: PlayerShips[]) => {
  players.forEach((player) => {
    const response = {
      type: 'start_game',
      data: {
        ships: player.ships,
        currentPlayerIndex: player.indexPlayer,
      },
      id: 0,
    };
    const message: string = stringifyResponse(response);
    const client = db.clients.find((item) => item.player.index === player.indexPlayer);
    client?.send(message);
  });
};

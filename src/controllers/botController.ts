import db from '../db';
import { botShips } from '../data/ships';
import { GameStart, Map, PlayerShips, Response, Ships } from '../types';
import { stringifyResponse } from '../utils';
import PlayerWebSocket from '../websocket';

const generateGameID = (): number => {
  const gameId = db.gameIndex + 1;
  db.gameIndex = gameId;
  return gameId;
};

const createGame = (ws: PlayerWebSocket, gameId: number) => {
  const response = {
    type: 'create_game',
    data: {
      idGame: gameId,
      idPlayer: ws.player.index,
    },
    id: 0,
  };

  const message: string = stringifyResponse(response);
  ws.send(message);
};

export const addShips = (gameId: number) => {
  const ships: Ships = botShips;
  const map: Map = [
    ['N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N'],
    ['N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N'],
    ['N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N'],
    ['N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N'],
    ['N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N'],
    ['N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N'],
    ['N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N'],
    ['N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N'],
    ['N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N'],
    ['N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N'],
    ['N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N'],
  ];
  const gameShips = { gameId, ships, indexPlayer: 0, map };
  db.games.push({ gameId, currentPlayer: 0, gameShips: [gameShips] });
};

// eslint-disable-next-line import/prefer-default-export
export const playGameWithBot = (ws: PlayerWebSocket) => {
  const gameId = generateGameID();
  createGame(ws, gameId);
  addShips(gameId);
};

export const startGameWithBot = (ws: PlayerWebSocket, player: PlayerShips) => {
  const response: Response<GameStart> = {
    type: 'start_game',
    data: {
      ships: player.ships,
      currentPlayerIndex: player.indexPlayer,
    },
    id: 0,
  };

  const message: string = stringifyResponse(response);
  ws.send(message);
};

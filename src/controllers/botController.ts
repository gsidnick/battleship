import db from '../db';
import { botShips } from '../data/ships';
import { Coordinate, GameStart, Map, PlayerShips, Response, Ships, Winners } from '../types';
import { stringifyResponse } from '../utils';
import PlayerWebSocket from '../websocket';
import {
  checkWinner,
  finishGame,
  getAttackFeedback,
  getAttackResult,
  getOpponent,
  getRandomShot,
  getShipsFromGame,
  moveTurn,
} from './gameController';
import { sendToAllClients, sendToSpecifyClients } from './clientController';
import { setWinner, updateWinners } from './winnerController';

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

export const makeBotAttack = (ws: PlayerWebSocket, gameId: number) => {
  const playersInGame = getShipsFromGame(gameId);
  const opponent = getOpponent(0, playersInGame);
  const playersId = [ws.player.index, opponent.indexPlayer];
  const shot: Coordinate = getRandomShot(opponent.map);
  const status = getAttackResult(shot, opponent);

  if (status) {
    const feedback = getAttackFeedback(status, shot, 0);
    sendToSpecifyClients(feedback, playersId);
  }

  const isWinner = checkWinner(opponent.map);

  if (isWinner) {
    const winnerResponse = finishGame(0);
    sendToSpecifyClients(winnerResponse, [ws.player.index]);
    setWinner('bot');
    const winners: Response<Winners> = updateWinners();
    sendToAllClients(winners);
  }

  const turn = moveTurn(gameId, ws.player.index);
  sendToSpecifyClients(turn, playersId);
};

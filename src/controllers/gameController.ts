import db from '../db';
import { stringifyResponse } from '../utils';
import {
  Response,
  PlayerShips,
  AttackData,
  Game,
  Coordinate,
  Map,
  AttackStatus,
  MapLabel,
  Turn,
  RoomPlayers,
} from '../types';

export const createGame = (players: RoomPlayers) => {
  const gameId = db.gameIndex + 1;
  db.gameIndex = gameId;

  players.forEach((player) => {
    const response = {
      type: 'create_game',
      data: {
        idGame: gameId,
        idPlayer: player.index,
      },
      id: 0,
    };

    const message: string = stringifyResponse(response);
    const client = db.clients.find((item) => item.player.index === player.index);
    client?.send(message);
  });
};

export const addShipsToGame = (playerShips: Omit<PlayerShips, 'map'>, playerIndex: number): void => {
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
  const { gameId, ships } = playerShips;
  const gameShips = { gameId, ships, indexPlayer: playerIndex, map };
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
    return game.gameShips.map((item) => ({ gameId, ships: item.ships, indexPlayer: item.indexPlayer, map: item.map }));
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

export const getGame = (gameId: number): Game => {
  let index = 0;

  db.games.forEach((item, i) => {
    if (item.gameId === gameId) {
      index = i;
    }
  });

  return db.games[index];
};

export const getOpponent = (currentPlayerIndex: number, players: PlayerShips[]): PlayerShips => {
  let index = 0;

  players.forEach((item, i) => {
    if (item.indexPlayer !== currentPlayerIndex) {
      index = i;
    }
  });

  return players[index];
};

const checkShot = (shotCoordinate: Coordinate, opponent: PlayerShips): AttackStatus | null => {
  const { x: xShot, y: yShot } = shotCoordinate;
  const { ships, map } = opponent;
  let status: AttackStatus = 'miss';
  let isAllShip = false;

  if (map[yShot][xShot] !== 'N') {
    return null;
  }

  const foundShip = ships.find((ship) => {
    let isFound = false;
    const { x: xShip, y: yShip } = ship.position;
    const { direction, length } = ship;
    const blocks: Coordinate[] = [];

    for (let i = 0; i < length; i += 1) {
      const coordinate = { x: xShip, y: yShip };

      if (direction) {
        coordinate.y += i;
      } else {
        coordinate.x += i;
      }

      blocks.push(coordinate);
    }

    let shipKilledBlock = 0;

    for (let i = 0; i < blocks.length; i += 1) {
      const { x: xBlock, y: yBlock } = blocks[i];
      const cellStatus = map[yBlock][xBlock];

      if (cellStatus === 'X') {
        shipKilledBlock += 1;
      }

      if (xShot === xBlock && yShot === yBlock) {
        isFound = true;
        shipKilledBlock += 1;
      }
    }

    if (shipKilledBlock === blocks.length) {
      isAllShip = true;
    }

    return isFound;
  });

  if (isAllShip) {
    return 'killed';
  }

  status = foundShip ? 'shot' : 'miss';

  return status;
};

const writeMap = (gameId: number, playerId: number, coordinate: Coordinate, status: AttackStatus) => {
  let gameIndex = 0;

  db.games.forEach((item, i) => {
    if (item.gameId === gameId) {
      gameIndex = i;
    }
  });

  let playerIndex = 0;

  db.games[gameIndex].gameShips.forEach((item, i) => {
    if (item.indexPlayer !== playerId) {
      playerIndex = i;
    }
  });

  let mapLabel: MapLabel;

  switch (status) {
    case 'miss':
      mapLabel = 'O';
      break;
    case 'shot':
    case 'killed':
      mapLabel = 'X';
      break;
    default:
      mapLabel = 'N';
  }

  db.games[gameIndex].gameShips[playerIndex].map[coordinate.y][coordinate.x] = mapLabel;
};

export const getAttackResult = (attackData: AttackData): AttackStatus | null => {
  const { gameId, indexPlayer, x, y } = attackData;
  const shot: Coordinate = { x, y };
  const playersInGame = getShipsFromGame(gameId);
  const opponent = getOpponent(indexPlayer, playersInGame);
  const status = checkShot(shot, opponent);

  if (status) writeMap(gameId, opponent.indexPlayer, shot, status);

  return status;
};

export const moveTurn = (playerId: number): Response<Turn> => {
  return {
    type: 'turn',
    data: { currentPlayer: playerId },
    id: 0,
  };
};

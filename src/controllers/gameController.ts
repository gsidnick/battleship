import db from '../db';
import { stringifyResponse } from '../utils';
import {
  Coordinate,
  Response,
  PlayerShips,
  Game,
  Map,
  AttackStatus,
  MapLabel,
  Turn,
  RoomPlayers,
  AttackResult,
  Finish,
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
    db.games.push({ gameId, currentPlayer: playerIndex, gameShips: [gameShips] });
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

  if (map[yShot][xShot] !== 'N') {
    return null;
  }

  const shipsCoordinate: Coordinate[][] = ships.map((ship) => {
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

    return blocks;
  });

  const foundShip = shipsCoordinate.find((ship) => {
    let isFound = false;

    for (let i = 0; i < ship.length; i += 1) {
      const { x: xShip, y: yShip } = ship[i];
      if (xShot === xShip && yShot === yShip) {
        isFound = true;
      }
    }

    return isFound;
  });

  if (foundShip) {
    let shipKilledBlock = 0;

    foundShip.forEach((ship: Coordinate) => {
      const { x, y } = ship;
      const cellStatus = map[y][x];

      if (cellStatus === 'X') {
        shipKilledBlock += 1;
      }

      if (xShot === x && yShot === y) {
        shipKilledBlock += 1;
      }
    });

    if (shipKilledBlock === foundShip.length) {
      return 'killed';
    }
  }

  return foundShip ? 'shot' : 'miss';
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
    if (item.indexPlayer === playerId) {
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

export const getAttackResult = (shot: Coordinate, opponent: PlayerShips): AttackStatus | null => {
  const status = checkShot(shot, opponent);

  if (status) writeMap(opponent.gameId, opponent.indexPlayer, shot, status);

  return status;
};

export const getAttackFeedback = (
  status: AttackStatus,
  position: Coordinate,
  currentPlayer: number,
): Response<AttackResult> => {
  return {
    type: 'attack',
    data: {
      position,
      currentPlayer,
      status,
    },
    id: 0,
  };
};

export const moveTurn = (gameId: number, playerId: number): Response<Turn> => {
  let gameIndex = 0;

  db.games.forEach((item, i) => {
    if (item.gameId === gameId) {
      gameIndex = i;
    }
  });

  db.games[gameIndex].currentPlayer = playerId;

  return {
    type: 'turn',
    data: { currentPlayer: playerId },
    id: 0,
  };
};

export const getRandomShot = (map: Map): Coordinate => {
  let generated = false;
  let coordinate: Coordinate = { x: 0, y: 0 };

  while (!generated) {
    coordinate = {
      x: Math.floor(Math.random() * 10),
      y: Math.floor(Math.random() * 10),
    };
    const { x, y } = coordinate;

    if (map[y][x] === 'N') {
      generated = true;
    }
  }

  return coordinate;
};

export const checkWinner = (map: Map): boolean => {
  let complete = 0;

  for (let y = 0; y <= 9; y += 1) {
    for (let x = 0; x <= 9; x += 1) {
      if (map[y][x] === 'X') complete += 1;
    }
  }
  console.log(complete);
  if (complete === 20) return true;

  return false;
};

export const finishGame = (winPlayer: number): Response<Finish> => {
  return {
    type: 'finish',
    data: {
      winPlayer,
    },
    id: 0,
  };
};

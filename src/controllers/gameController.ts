import db from '../db';
import { stringifyResponse } from '../utils';
import { Response, GamePlayer, PlayerShips, AttackData, Game, Coordinate, Ships, Map, GamePlayerShips } from '../types';

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
  const gameShips = { ships, indexPlayer: playerIndex, map };
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

const getGame = (gameId: number): Game => {
  let index = 0;

  db.games.forEach((item, i) => {
    if (item.gameId === gameId) {
      index = i;
    }
  });

  return db.games[index];
};

const getOpponent = (currentPlayerIndex: number, game: Game): GamePlayerShips => {
  let index = 0;

  game.gameShips.forEach((item, i) => {
    if (item.indexPlayer !== currentPlayerIndex) {
      index = i;
    }
  });

  return game.gameShips[index];
};

const checkShot = (shotCoordinate: Coordinate, ships: Ships, map: Map): 'shot' | 'miss' | 'open' => {
  const { x: xShot, y: yShot } = shotCoordinate;

  if (map[yShot][xShot] !== 'N') {
    return 'open';
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

    for (let i = 0; i < blocks.length; i += 1) {
      const { x: xBlock, y: yBlock } = blocks[i];
      if (xShot === xBlock && yShot === yBlock) {
        isFound = true;
      }
    }

    return isFound;
  });

  return foundShip ? 'shot' : 'miss';
};

export const getAttackResult = (attackData: AttackData) => {
  const { gameId, indexPlayer, x, y } = attackData;

  const game = getGame(gameId);
  const opponent = getOpponent(indexPlayer, game);
  console.log(checkShot({ x, y }, opponent.ships, opponent.map));
};

// Последовательность действий:
// 1. Проверить все корабли по координатам. Совпадают ли X или Y
// 2. Если совпадений нет, то "мимо"
// 3. Если совпадения есть по оси X, то вычислить все координаты для найденых кораблей, и найти совпадения по оси Y
//    - например если есть два корабля по оси Y (3 и 2 секции, горизонтальные), нужно вычислить массив координат тройного, и сверить их с ударом. Аналогично вычислить и для двойного корабля - сравнить все координаты с ударом.

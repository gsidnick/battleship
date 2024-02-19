import db from './db';
import {
  PlayerCredentials,
  Response,
  PlayerResponse,
  Player,
  Room,
  RoomPlayer,
  Rooms,
  ResponseData,
  RoomPlayers,
  Winners,
  GamePlayer,
  PlayerShips,
} from './types';
import { generateId, hashPassword, stringifyResponse, verifyPassword } from './utils';
import PlayerWebSocket from './websocket';

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

export const createRoom = (player: RoomPlayer): void => {
  const index = db.roomIndex + 1;
  const room: Room = {
    roomId: index,
    roomUsers: [],
  };
  room.roomUsers.push(player);
  db.roomIndex = index;
  db.rooms.push(room);
};

export const updateRoom = (): Response<Rooms> => {
  const { rooms } = db;
  return {
    type: 'update_room',
    data: rooms,
    id: 0,
  };
};

export const updateWinners = (): Response<Winners> => {
  const { winners } = db;
  return {
    type: 'update_winners',
    data: winners,
    id: 0,
  };
};

export const removeRoom = (roomId: number): void => {
  db.rooms = db.rooms.filter((room) => room.roomId !== roomId);
};

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

export const addUserToRoom = (player: RoomPlayer, roomId: number): void => {
  db.rooms.forEach((room, index) => {
    if (room.roomId === roomId) {
      db.rooms[index].roomUsers.push(player);
    }
  });
};

export const getRoomPlayers = (roomId: number): RoomPlayers => {
  let index = 0;

  db.rooms.forEach((item, i) => {
    if (item.roomId === roomId) {
      index = i;
    }
  });

  return db.rooms[index].roomUsers;
};

export const addClient = (client: PlayerWebSocket): void => {
  db.clients.push(client);
};

export const sendToAllClients = (response: Response<ResponseData>): void => {
  const message: string = stringifyResponse(response);
  db.clients.forEach((client) => {
    client.send(message);
  });
};

export const sendToSpecifyClients = (response: Response<ResponseData>, players: RoomPlayers): void => {
  const message: string = stringifyResponse(response);
  players.forEach((player) => {
    const client = db.clients.find((item) => item.player.index === player.index);
    client?.send(message);
  });
};

export const addShipsToGame = (playerShips: PlayerShips): void => {
  const { gameId, indexPlayer, ships } = playerShips;
  const gameShips = { ships, indexPlayer };
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

export const getShipsFromGame = (gameId: number): number => {
  const game = db.games.find((item) => item.gameId === gameId);

  if (game) {
    return game.gameShips.length;
  }

  return 0;
};

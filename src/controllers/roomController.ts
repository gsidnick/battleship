import db from '../db';
import { Response, Room, RoomPlayer, RoomPlayers, Rooms } from '../types';

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

export const removeRoom = (roomId: number): void => {
  db.rooms = db.rooms.filter((room) => room.roomId !== roomId);
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

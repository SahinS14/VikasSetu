/**
 * src/views/HostelAdmin/HostelRoomsPage.tsx
 *
 * Rooms & Bed Matrix Page (Tab 3)
 * Real-time interactive bed matrix grid with status toggling and filtering.
 */

import React, { useState } from 'react';
import { BedDouble, Search } from 'lucide-react';
import { useHostel } from './HostelContext';

export const HostelRoomsPage: React.FC = () => {
  const { blocks, rooms, handleToggleBedStatus } = useHostel();

  const [selectedBlockId, setSelectedBlockId] = useState<string>('all');
  const [roomFilterStatus, setRoomFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredRooms = rooms.filter(r => {
    if (selectedBlockId !== 'all' && r.blockId !== selectedBlockId) return false;
    if (roomFilterStatus !== 'all') {
      const hasStatus = (r.beds || []).some(b => b.status === roomFilterStatus);
      if (!hasStatus) return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchRoom = r.roomNumber.toLowerCase().includes(q) || r.roomType.toLowerCase().includes(q);
      const matchOccupant = (r.beds || []).some(b => b.occupantName?.toLowerCase().includes(q));
      if (!matchRoom && !matchOccupant) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E0E6E2] shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Rooms & Bed Matrix</h2>
          <p className="text-xs text-gray-500">Live bed availability, room occupancy, status toggles, and maintenance controls</p>
        </div>
        <div className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
          {rooms.length} Configured Rooms
        </div>
      </div>

      {/* Controls bar */}
      <div className="bg-white p-5 rounded-2xl border border-[#E0E6E2] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Block Filter */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Block</label>
            <select
              value={selectedBlockId}
              onChange={e => setSelectedBlockId(e.target.value)}
              className="h-9 px-3 rounded-xl border border-gray-300 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-[#005B46]/20"
            >
              <option value="all">All Blocks ({rooms.length} Rooms)</option>
              {blocks.map(b => (
                <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Bed Status</label>
            <select
              value={roomFilterStatus}
              onChange={e => setRoomFilterStatus(e.target.value)}
              className="h-9 px-3 rounded-xl border border-gray-300 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-[#005B46]/20"
            >
              <option value="all">All Bed States</option>
              <option value="available">Available (Vacant)</option>
              <option value="occupied">Occupied</option>
              <option value="maintenance">Under Maintenance</option>
              <option value="reserved">Reserved</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Search</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Room or Trainee Name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-9 pl-9 pr-3 rounded-xl border border-gray-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#005B46]/20"
              />
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 font-medium text-emerald-700">
            <span className="w-3 h-3 rounded-full bg-emerald-500" /> Available
          </span>
          <span className="flex items-center gap-1.5 font-medium text-blue-700">
            <span className="w-3 h-3 rounded-full bg-blue-500" /> Occupied
          </span>
          <span className="flex items-center gap-1.5 font-medium text-amber-700">
            <span className="w-3 h-3 rounded-full bg-amber-500" /> Maintenance
          </span>
        </div>
      </div>

      {/* Interactive Room Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredRooms.map(room => {
          const block = blocks.find(b => b.id === room.blockId);
          return (
            <div key={room.id} className="bg-white rounded-2xl border border-[#E0E6E2] p-4 shadow-sm hover:shadow-md transition-all space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-gray-900">Room {room.roomNumber}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                      Floor {room.floor}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500 capitalize">
                    {block?.name || 'Wing'} • {room.roomType.replace('_', ' ')}
                  </div>
                </div>
              </div>

              {/* Bed Matrix inside Room */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                {(room.beds || []).map(bed => {
                  const isAvail = bed.status === 'available';
                  const isOcc = bed.status === 'occupied';

                  return (
                    <div
                      key={bed.id}
                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
                        isAvail
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                          : isOcc
                          ? 'bg-blue-50/70 border-blue-200 text-blue-950'
                          : 'bg-amber-50/70 border-amber-200 text-amber-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <BedDouble className={`w-4 h-4 ${isAvail ? 'text-emerald-600' : isOcc ? 'text-blue-600' : 'text-amber-600'}`} />
                        <div>
                          <div className="font-extrabold">Bed {bed.bedNumber}</div>
                          <div className="text-[10px] truncate max-w-[120px]">
                            {bed.occupantName ? bed.occupantName : isAvail ? 'Vacant' : 'Under Repair'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {!isOcc && (
                          <button
                            onClick={() => handleToggleBedStatus(bed.id, bed.status)}
                            title={isAvail ? 'Set to Maintenance' : 'Set to Available'}
                            className="px-2 py-1 rounded text-[10px] font-bold bg-white/90 hover:bg-white border shadow-xs cursor-pointer"
                          >
                            {isAvail ? 'Mark Repair' : 'Mark Ready'}
                          </button>
                        )}
                        {isOcc && (
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-200 text-blue-800">
                            Allocated
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {filteredRooms.length === 0 && (
        <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-gray-300">
          <BedDouble className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <div className="text-sm font-bold text-gray-700">No rooms match your filter criteria</div>
          <div className="text-xs text-gray-400 mt-1">Try resetting the block or status filters</div>
        </div>
      )}
    </div>
  );
};

export default HostelRoomsPage;

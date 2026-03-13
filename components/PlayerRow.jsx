'use client';

import Link from 'next/link';

const statusColors = {
  active: 'bg-green-100 text-green-700',
  injured: 'bg-red-100 text-red-700',
  inactive: 'bg-gray-100 text-gray-500',
};

export default function PlayerRow({ player, onClick }) {
  const initials = (player.name || '??').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const level = player.level || 1;

  const content = (
    <tr className="border-b last:border-0 hover:bg-gray-50 cursor-pointer transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
            {initials}
          </div>
          <span className="font-medium text-gray-900 text-sm">{player.name}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-1">
          {(player.positions || player.position || []).map(p => (
            <span key={p} className="px-1.5 py-0.5 bg-green-50 text-green-700 text-xs rounded">{p}</span>
          ))}
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">{player.age || '--'}</td>
      <td className="px-4 py-3">
        <span className="text-sm font-bold text-amber-600">{player.current_streak || player.streak || 0}d</span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm font-bold text-green-600">{player.compliance_pct || player.compliance || 0}%</span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm font-bold text-purple-600">L{level}</span>
      </td>
      <td className="px-4 py-3">
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[player.status] || statusColors.active}`}>
          {player.status || 'active'}
        </span>
      </td>
    </tr>
  );

  if (player.id) {
    return (
      <Link href={`/admin/players/${player.id}`} className="contents">
        {c
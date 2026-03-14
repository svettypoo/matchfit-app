/**
 * Equipment icon registry — clean, minimal SVG line icons (Lucide-style)
 * Each icon is an inline SVG string, 24x24 viewBox, stroke-based
 * Usage: import { EQUIPMENT } from '@/lib/equipment-icons'
 *        EQUIPMENT['barbell'].icon  → SVG string
 *        EQUIPMENT['barbell'].label → 'Barbell'
 */

// All SVGs: 24x24, stroke="currentColor", strokeWidth=1.5, fill="none"
const svg = (d, extra = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"${extra}>${d}</svg>`;

export const EQUIPMENT = {
  barbell: {
    label: 'Barbell',
    icon: svg('<line x1="2" y1="12" x2="22" y2="12"/><rect x="3" y="8" width="3" height="8" rx="0.5"/><rect x="18" y="8" width="3" height="8" rx="0.5"/><rect x="6" y="9.5" width="1.5" height="5" rx="0.3"/><rect x="16.5" y="9.5" width="1.5" height="5" rx="0.3"/>'),
  },
  dumbbells: {
    label: 'Dumbbells',
    icon: svg('<line x1="6" y1="12" x2="18" y2="12"/><rect x="2" y="9" width="4" height="6" rx="0.5"/><rect x="18" y="9" width="4" height="6" rx="0.5"/>'),
  },
  dumbbell: {
    label: 'Dumbbell',
    icon: svg('<line x1="6" y1="12" x2="18" y2="12"/><rect x="2" y="9" width="4" height="6" rx="0.5"/><rect x="18" y="9" width="4" height="6" rx="0.5"/>'),
  },
  kettlebell: {
    label: 'Kettlebell',
    icon: svg('<circle cx="12" cy="15" r="5"/><path d="M9.5 10.5 C9.5 7, 14.5 7, 14.5 10.5"/><line x1="10" y1="10" x2="14" y2="10"/>'),
  },
  'resistance band': {
    label: 'Resistance Band',
    icon: svg('<path d="M4 8 C8 6, 16 18, 20 16"/><path d="M4 10 C8 8, 16 20, 20 18"/><circle cx="3" cy="9" r="1.5"/><circle cx="21" cy="17" r="1.5"/>'),
  },
  'resistance_bands': {
    label: 'Resistance Bands',
    icon: svg('<path d="M4 8 C8 6, 16 18, 20 16"/><path d="M4 10 C8 8, 16 20, 20 18"/><circle cx="3" cy="9" r="1.5"/><circle cx="21" cy="17" r="1.5"/>'),
  },
  bench: {
    label: 'Bench',
    icon: svg('<rect x="3" y="11" width="18" height="2.5" rx="0.5"/><line x1="5" y1="13.5" x2="5" y2="19"/><line x1="19" y1="13.5" x2="19" y2="19"/><line x1="3" y1="12" x2="3" y2="8" stroke-width="2"/>'),
  },
  'squat rack': {
    label: 'Squat Rack',
    icon: svg('<line x1="5" y1="3" x2="5" y2="21"/><line x1="19" y1="3" x2="19" y2="21"/><line x1="3" y1="21" x2="7" y2="21"/><line x1="17" y1="21" x2="21" y2="21"/><line x1="5" y1="9" x2="8" y2="9"/><line x1="16" y1="9" x2="19" y2="9"/><line x1="8" y1="9" x2="16" y2="9" stroke-dasharray="2 2"/>'),
  },
  'pull-up bar': {
    label: 'Pull-Up Bar',
    icon: svg('<line x1="3" y1="6" x2="21" y2="6" stroke-width="2"/><line x1="5" y1="6" x2="5" y2="3"/><line x1="19" y1="6" x2="19" y2="3"/><path d="M8 6 L8 10 C8 12 10 13 12 13 C14 13 16 12 16 10 L16 6" stroke-dasharray="2 2"/>'),
  },
  'foam roller': {
    label: 'Foam Roller',
    icon: svg('<ellipse cx="12" cy="12" rx="9" ry="4"/><line x1="3.5" y1="10" x2="3.5" y2="14"/><line x1="20.5" y1="10" x2="20.5" y2="14"/>'),
  },
  'yoga mat': {
    label: 'Yoga Mat',
    icon: svg('<path d="M3 17 L21 17"/><path d="M3 17 C3 14, 3 14, 5 14 L19 14 C21 14, 21 14, 21 17"/><circle cx="19" cy="11" r="3"/><path d="M19 8 L19 5"/>'),
  },
  cones: {
    label: 'Cones',
    icon: svg('<path d="M7 19 L12 5 L17 19 Z"/><line x1="5" y1="19" x2="19" y2="19"/><line x1="8.5" y1="14" x2="15.5" y2="14"/>'),
  },
  'agility ladder': {
    label: 'Agility Ladder',
    icon: svg('<line x1="7" y1="3" x2="7" y2="21"/><line x1="17" y1="3" x2="17" y2="21"/><line x1="7" y1="6" x2="17" y2="6"/><line x1="7" y1="10" x2="17" y2="10"/><line x1="7" y1="14" x2="17" y2="14"/><line x1="7" y1="18" x2="17" y2="18"/>'),
  },
  'soccer ball': {
    label: 'Soccer Ball',
    icon: svg('<circle cx="12" cy="12" r="9"/><path d="M12 3 L12 7 L16 9.5 L19.5 7.5"/><path d="M12 7 L8 9.5 L4.5 7.5"/><path d="M8 9.5 L8 14 L12 16"/><path d="M16 9.5 L16 14 L12 16"/><path d="M8 14 L4 15.5"/><path d="M16 14 L20 15.5"/><path d="M12 16 L12 21"/>'),
  },
  'medicine ball': {
    label: 'Medicine Ball',
    icon: svg('<circle cx="12" cy="12" r="8"/><path d="M4.5 9 L19.5 9" stroke-dasharray="3 2"/><path d="M4.5 15 L19.5 15" stroke-dasharray="3 2"/><line x1="12" y1="4" x2="12" y2="20" stroke-dasharray="3 2"/>'),
  },
  'plyo box': {
    label: 'Plyo Box',
    icon: svg('<path d="M4 16 L4 8 L12 4 L20 8 L20 16 L12 20 Z"/><line x1="12" y1="4" x2="12" y2="20"/><line x1="4" y1="8" x2="20" y2="8"/><line x1="12" y1="8" x2="20" y2="16"/>'),
  },
  'ab wheel': {
    label: 'Ab Wheel',
    icon: svg('<circle cx="12" cy="14" r="5"/><circle cx="12" cy="14" r="1.5"/><line x1="4" y1="14" x2="7" y2="14"/><line x1="17" y1="14" x2="20" y2="14"/>'),
  },
  'dip bars': {
    label: 'Dip Bars',
    icon: svg('<line x1="6" y1="6" x2="6" y2="20"/><line x1="18" y1="6" x2="18" y2="20"/><line x1="6" y1="10" x2="10" y2="10"/><line x1="14" y1="10" x2="18" y2="10"/><line x1="4" y1="20" x2="8" y2="20"/><line x1="16" y1="20" x2="20" y2="20"/>'),
  },
  'cable machine': {
    label: 'Cable Machine',
    icon: svg('<rect x="4" y="3" width="16" height="18" rx="1" fill="none"/><circle cx="12" cy="7" r="2"/><line x1="12" y1="9" x2="12" y2="16" stroke-dasharray="2 1.5"/><rect x="9" y="16" width="6" height="3" rx="0.5"/>'),
  },
  'rope attachment': {
    label: 'Rope',
    icon: svg('<path d="M8 4 C8 4, 12 8, 12 12"/><path d="M16 4 C16 4, 12 8, 12 12"/><line x1="12" y1="12" x2="12" y2="18"/><circle cx="8" cy="3.5" r="1"/><circle cx="16" cy="3.5" r="1"/>'),
  },
  'jump rope': {
    label: 'Jump Rope',
    icon: svg('<path d="M6 18 C6 18, 4 8, 12 5 C20 8, 18 18, 18 18"/><line x1="6" y1="18" x2="6" y2="21"/><line x1="18" y1="18" x2="18" y2="21"/>'),
  },
  'battle ropes': {
    label: 'Battle Ropes',
    icon: svg('<path d="M2 14 C4 10, 6 18, 8 14 C10 10, 12 18, 14 14 C16 10, 18 18, 20 14"/><path d="M2 16 C4 12, 6 20, 8 16 C10 12, 12 20, 14 16 C16 12, 18 20, 20 16"/><circle cx="21" cy="15" r="1.5"/>'),
  },
  bodyweight: {
    label: 'Bodyweight',
    icon: svg('<circle cx="12" cy="5" r="2.5"/><path d="M12 7.5 L12 15"/><path d="M8 10 L16 10"/><path d="M12 15 L8 21"/><path d="M12 15 L16 21"/>'),
  },
  'leg press machine': {
    label: 'Leg Press',
    icon: svg('<rect x="3" y="6" width="18" height="12" rx="2"/><line x1="7" y1="12" x2="17" y2="12"/><circle cx="7" cy="12" r="2"/><rect x="14" y="9" width="4" height="6" rx="1"/>'),
  },
  'rowing machine': {
    label: 'Rowing Machine',
    icon: svg('<path d="M3 16 L8 16 L13 10 L21 10"/><circle cx="5" cy="18" r="2"/><line x1="13" y1="10" x2="11" y2="14"/><rect x="18" y="8" width="4" height="4" rx="0.5"/>'),
  },
  'running shoes': {
    label: 'Running Shoes',
    icon: svg('<path d="M3 16 C3 16, 4 12, 8 12 L16 12 C19 12, 21 14, 21 16 L21 17 L3 17 Z"/><line x1="8" y1="12" x2="7" y2="9"/><line x1="11" y1="12" x2="10.5" y2="10"/><line x1="14" y1="12" x2="14" y2="10"/>'),
  },
  track: {
    label: 'Track',
    icon: svg('<ellipse cx="12" cy="12" rx="9" ry="6"/><ellipse cx="12" cy="12" rx="5" ry="3"/><line x1="12" y1="6" x2="12" y2="9"/>'),
  },
  'track/field': {
    label: 'Track / Field',
    icon: svg('<ellipse cx="12" cy="12" rx="9" ry="6"/><ellipse cx="12" cy="12" rx="5" ry="3"/><line x1="12" y1="6" x2="12" y2="9"/>'),
  },
  hill: {
    label: 'Hill',
    icon: svg('<path d="M2 20 L8 8 L14 14 L22 4"/><path d="M2 20 L22 20"/>'),
  },
  wall: {
    label: 'Wall',
    icon: svg('<rect x="4" y="3" width="16" height="18" rx="0.5"/><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="11" x2="20" y2="11"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="12" y1="3" x2="12" y2="7"/><line x1="8" y1="7" x2="8" y2="11"/><line x1="16" y1="7" x2="16" y2="11"/><line x1="12" y1="11" x2="12" y2="15"/><line x1="8" y1="15" x2="8" y2="21"/>'),
  },
  goal: {
    label: 'Goal',
    icon: svg('<path d="M3 5 L3 19"/><path d="M21 5 L21 19"/><path d="M3 5 L21 5"/><line x1="3" y1="5" x2="6" y2="2"/><line x1="21" y1="5" x2="18" y2="2"/><path d="M3 5 L21 19" stroke-dasharray="3 3" opacity="0.3"/>'),
  },
  box: {
    label: 'Box',
    icon: svg('<path d="M4 16 L4 8 L12 4 L20 8 L20 16 L12 20 Z"/><line x1="12" y1="4" x2="12" y2="20"/><line x1="4" y1="8" x2="20" y2="8"/>'),
  },
};

// Alias lookups — normalize equipment strings from DB
const ALIASES = {
  'dumbbell': 'dumbbell',
  'dumbbells': 'dumbbells',
  'resistance band': 'resistance band',
  'resistance_bands': 'resistance_bands',
  'pull-up bar': 'pull-up bar',
  'pullup bar': 'pull-up bar',
  'squat_rack': 'squat rack',
  'plyo_box': 'plyo box',
  'ab_wheel': 'ab wheel',
  'dip_bars': 'dip bars',
  'cable_machine': 'cable machine',
  'rope_attachment': 'rope attachment',
  'jump_rope': 'jump rope',
  'battle_ropes': 'battle ropes',
  'soccer_ball': 'soccer ball',
  'medicine_ball': 'medicine ball',
  'foam_roller': 'foam roller',
  'yoga_mat': 'yoga mat',
  'agility_ladder': 'agility ladder',
  'leg_press_machine': 'leg press machine',
  'rowing_machine': 'rowing machine',
  'running_shoes': 'running shoes',
  '20kg': 'barbell',
  'rack': 'squat rack',
};

/**
 * Look up equipment icon data by name (case-insensitive, alias-aware)
 * @param {string} name - equipment name from DB
 * @returns {{ label: string, icon: string } | null}
 */
export function getEquipment(name) {
  if (!name) return null;
  const key = name.toLowerCase().trim();
  // Direct match
  if (EQUIPMENT[key]) return EQUIPMENT[key];
  // Alias match
  const alias = ALIASES[key];
  if (alias && EQUIPMENT[alias]) return EQUIPMENT[alias];
  // Fallback — return generic with the name as label
  return {
    label: name.charAt(0).toUpperCase() + name.slice(1),
    icon: svg('<circle cx="12" cy="12" r="8"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="15" r="1"/>'),
  };
}

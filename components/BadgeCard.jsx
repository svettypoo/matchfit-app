'use client';

const BADGE_ICONS = {
  '1': '\u{1F3C6}', '2': '\u{1F525}', '3': '\u{2694}\u{FE0F}', '4': '\u{1F916}',
  '5': '\u{1F451}', '6': '\u{2705}', '7': '\u{1F319}', '8': '\u{1F4AA}',
  '9': '\u{26A1}', '10': '\u{26BD}', '11': '\u{1F3DF}\u{FE0F}', '12': '\u{1F6E1}\u{FE0F}',
  '13': '\u{1F4AF}', '14': '\u{1F91D}', '15': '\u{2B50}', '16': '\u{1F3AF}',
};

export default function BadgeCard({ badge, earned: earnedProp, earnedAt }) {
  // Support both old API (separate earned/earnedAt) and new API (badge.earned, badge.earned_at)
  const isEarned = earnedProp !== undefined ? earnedProp : badge?.earned;
  const dateEarned = earnedAt || badge?.earned_at;
  const icon = BADGE_ICONS[badge?.icon] || badge?.emoji || '\u{1F3C5}';

  return (
    <div className={`rounded-xl border p-4 text-center transition-all ${
      isEarned
        ? 'bg-white border-green-200 shadow-sm hover:shadow-md'
        : 'bg-gray-50 border-gray-200 opacity-50'
    }`}>
      <div className={`text-4xl mb-2 ${isEarned ? '' : 'grayscale'}`}>
        {isEarned ? icon : '\u{1F512}'}
      </div>
      <h3 className="font-semibold text-sm text-gray-800">{badge?.name}</h3>
      <p className="text-xs text-gray-500 mt-1">{badge?.description}</p>
      {isEarned && dateEarned && (
        <p className="text-xs text-green-600 mt-2 font-medium">
          Earned {new Date(dateEarned).toLocaleDateString()}
        </p>
      )}
      {!isEarned && badge?.requirement && (
        <p className="text-xs text-gray-400 mt-2">{badge.requirement}</p>
      )}
      {badge?.xp_reward && (
        <div className="mt-2 text-xs font-medium text-amber-600">
          +{badge.xp_reward} XP
        </div>
      )}
    </div>
  );
}

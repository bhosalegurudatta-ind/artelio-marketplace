export default function VerifiedBadge({
  className = '',
  size = 'sm',
}: {
  className?: string;
  size?: 'xs' | 'sm' | 'md';
}) {
  const sizeClasses =
    size === 'xs'
      ? 'px-1.5 py-0.2 text-[9px] gap-0.5'
      : size === 'md'
      ? 'px-2.5 py-1 text-xs gap-1.5'
      : 'px-2 py-0.5 text-[10px] gap-1';

  const iconSize = size === 'xs' ? 'w-2.5 h-2.5' : size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3';

  return (
    <span
      className={`inline-flex items-center rounded-full bg-sky-500/15 border border-sky-400/40 font-bold text-sky-400 shadow-2xs tracking-wide shrink-0 ${sizeClasses} ${className}`}
      title="Verified Artelio Resident Artist"
    >
      <svg
        className={`${iconSize} fill-current text-sky-400`}
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
          clipRule="evenodd"
        />
      </svg>
      <span>Verified</span>
    </span>
  );
}

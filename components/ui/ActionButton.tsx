/**
 * ActionButton Component
 * 
 * Unified action button used throughout the game for primary actions
 * like "Lock In Guess", "Next Round", "Set Target", etc.
 * Provides consistent styling and states (enabled, disabled, loading).
 */

interface ActionButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'teal' | 'purple' | 'fuchsia';
  fullWidth?: boolean;
  showPulse?: boolean;
  className?: string;
}

export function ActionButton({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  fullWidth = true,
  showPulse = true,
  className = ''
}: ActionButtonProps) {
  const getVariantClasses = () => {
    if (disabled) {
      return 'bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed';
    }

    switch (variant) {
      case 'teal':
        return 'bg-gradient-to-r from-teal-600 to-teal-700 border-teal-500 text-white hover:from-teal-500 hover:to-teal-600 hover:shadow-[0_0_40px_rgba(20,184,166,0.6)] cursor-pointer';
      case 'purple':
        return 'bg-gradient-to-r from-purple-600 to-purple-700 border-purple-500 text-white hover:from-purple-500 hover:to-purple-600 hover:shadow-[0_0_40px_rgba(168,85,247,0.6)] cursor-pointer';
      case 'fuchsia':
        return 'bg-gradient-to-r from-fuchsia-600 to-fuchsia-700 border-fuchsia-500 text-white hover:from-fuchsia-500 hover:to-fuchsia-600 hover:shadow-[0_0_40px_rgba(236,72,153,0.6)] cursor-pointer';
      case 'primary':
      default:
        return 'bg-fuchsia-600 border-fuchsia-500 text-white hover:bg-fuchsia-700 hover:shadow-[0_0_40px_rgba(236,72,153,0.6)] cursor-pointer';
    }
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${widthClass}
        py-6 px-8 
        text-2xl lg:text-3xl 
        font-bold 
        uppercase 
        tracking-widest 
        transition-all 
        duration-300 
        border-2 
        relative 
        overflow-hidden
        ${getVariantClasses()}
        ${className}
      `}
    >
      {children}
      {!disabled && showPulse && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-pulse"></div>
      )}
    </button>
  );
}

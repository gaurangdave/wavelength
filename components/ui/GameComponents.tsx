/**
 * Reusable UI Components using Wavelength Theme System
 * 
 * These components provide consistent styling and reduce code duplication
 */

import React from 'react';
import { themeClasses } from '@/lib/theme';

// ============================================================================
// LAYOUT COMPONENTS
// ============================================================================

interface ScreenContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function ScreenContainer({ children, className = '' }: ScreenContainerProps) {
  return (
    <div className={`${themeClasses.screen} ${className}`}>
      {children}
    </div>
  );
}

export function GeometricBackground() {
  return (
    <div className={themeClasses.geometricBg}>
      <div className="absolute top-1/4 left-1/4 w-32 h-32 border border-zinc-800 rotate-45"></div>
      <div className="absolute top-3/4 right-1/4 w-24 h-24 border border-zinc-800 rounded-full"></div>
      <div className="absolute bottom-1/4 left-1/3 w-20 h-20 border border-zinc-800"></div>
      <div className="absolute top-1/2 right-1/3 w-28 h-28 border border-zinc-800 rotate-12"></div>
      <div className="absolute bottom-1/3 right-1/2 w-16 h-16 border border-zinc-800 rounded-full"></div>
      <div className="absolute top-1/3 left-1/2 w-36 h-36 border border-zinc-800 rotate-45"></div>
    </div>
  );
}

interface CornerAccentsProps {
  variant?: 'psychic' | 'player' | 'mixed';
}

export function CornerAccents({ variant = 'psychic' }: CornerAccentsProps) {
  const baseClass = themeClasses.cornerAccent.base;
  
  const colors = {
    psychic: themeClasses.cornerAccent.psychic,
    player: themeClasses.cornerAccent.player,
    mixed: '', // Will use different colors per corner
  };

  if (variant === 'mixed') {
    return (
      <>
        <div className={`${baseClass} ${themeClasses.cornerAccent.topLeft} ${themeClasses.cornerAccent.psychic}`}></div>
        <div className={`${baseClass} ${themeClasses.cornerAccent.topRight} ${themeClasses.cornerAccent.player}`}></div>
        <div className={`${baseClass} ${themeClasses.cornerAccent.bottomLeft} ${themeClasses.cornerAccent.player}`}></div>
        <div className={`${baseClass} ${themeClasses.cornerAccent.bottomRight} ${themeClasses.cornerAccent.psychic}`}></div>
      </>
    );
  }

  const colorClass = colors[variant];

  return (
    <>
      <div className={`${baseClass} ${themeClasses.cornerAccent.topLeft} ${colorClass}`}></div>
      <div className={`${baseClass} ${themeClasses.cornerAccent.topRight} ${colorClass}`}></div>
      <div className={`${baseClass} ${themeClasses.cornerAccent.bottomLeft} ${colorClass}`}></div>
      <div className={`${baseClass} ${themeClasses.cornerAccent.bottomRight} ${colorClass}`}></div>
    </>
  );
}

// ============================================================================
// CARD COMPONENTS
// ============================================================================

interface GameCardProps {
  children: React.ReactNode;
  variant?: 'psychic' | 'player' | 'neutral';
  hoverable?: boolean;
  onClick?: () => void;
  className?: string;
}

export function GameCard({ 
  children, 
  variant = 'neutral', 
  hoverable = false,
  onClick,
  className = '' 
}: GameCardProps) {
  const baseClass = themeClasses.card.base;
  const variantClass = variant === 'psychic' 
    ? themeClasses.card.psychic 
    : variant === 'player' 
    ? themeClasses.card.player 
    : 'border-zinc-700';
  const hoverClass = hoverable ? 'cursor-pointer hover:transform hover:scale-105' : '';
  
  return (
    <div 
      className={`${baseClass} ${variantClass} ${hoverClass} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// ============================================================================
// HEADER COMPONENTS
// ============================================================================

interface GameHeaderProps {
  roomName: string;
  round?: number;
  maxRounds?: number;
  score?: number;
  lives?: number;
  maxLives?: number;
  showResults?: boolean;
}

export function GameHeader({ 
  roomName, 
  round, 
  maxRounds, 
  score, 
  lives = 0, 
  maxLives = 0,
  showResults = false 
}: GameHeaderProps) {
  return (
    <div className={themeClasses.header.container + ' flex justify-between items-center'}>
      <div className="flex items-center space-x-6">
        <h1 className={themeClasses.header.title}>{roomName}</h1>
        {round && maxRounds && (
          <div className={themeClasses.header.subtitle}>
            ROUND {round}/{maxRounds}{showResults ? ' - RESULTS' : ''}
          </div>
        )}
      </div>
      
      <div className="flex items-center space-x-6">
        {score !== undefined && (
          <div className="flex items-center space-x-2">
            <span className={themeClasses.text.player}>SCORE:</span>
            <span className="text-white text-xl font-bold">{score}</span>
          </div>
        )}
        {maxLives > 0 && (
          <div className="flex items-center space-x-2">
            <span className={themeClasses.text.psychic}>LIVES:</span>
            <div className="flex space-x-1">
              {Array.from({ length: maxLives }, (_, i) => (
                <div key={i} className={`text-xl ${i < lives ? 'text-fuchsia-500' : 'text-zinc-600'}`}>
                  ♥
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// BUTTON COMPONENTS
// ============================================================================

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit';
  className?: string;
}

export function Button({ 
  children, 
  variant = 'primary', 
  disabled = false,
  onClick,
  type = 'button',
  className = ''
}: ButtonProps) {
  const baseClass = themeClasses.button.base;
  const variantClass = variant === 'primary' 
    ? themeClasses.button.primary 
    : themeClasses.button.secondary;
  const disabledClass = disabled ? themeClasses.button.disabled : '';
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClass} ${variantClass} ${disabledClass} ${className}`}
    >
      {children}
    </button>
  );
}

// ============================================================================
// INPUT COMPONENTS
// ============================================================================

interface InputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  label?: string;
  focused?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

export function Input({ 
  value, 
  onChange, 
  placeholder = '',
  maxLength,
  label,
  focused = false,
  onFocus,
  onBlur
}: InputProps) {
  const baseClass = themeClasses.input.base;
  const focusClass = focused ? themeClasses.input.focused : themeClasses.input.default;
  
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-gray-400 text-sm font-bold tracking-widest uppercase text-center">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          maxLength={maxLength}
          className={`${baseClass} ${focusClass}`}
        />
        {focused && (
          <div className="absolute inset-0 border-2 border-fuchsia-500 animate-pulse pointer-events-none"></div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// STATUS COMPONENTS
// ============================================================================

interface StatusIndicatorProps {
  type: 'waiting' | 'loading';
  text: string;
}

export function StatusIndicator({ type, text }: StatusIndicatorProps) {
  const baseClass = themeClasses.status[type];
  const pulseClass = themeClasses.status.pulse;
  const bgColor = type === 'waiting' ? 'bg-teal-400' : 'bg-yellow-400';
  const animation = type === 'waiting' ? 'animate-pulse' : 'animate-ping';
  
  return (
    <div className={baseClass}>
      <div className={`${pulseClass} ${bgColor} ${animation}`}></div>
      <span>{text}</span>
    </div>
  );
}

// ============================================================================
// TITLE COMPONENTS
// ============================================================================

interface TitleProps {
  children: React.ReactNode;
  subtitle?: React.ReactNode;
  className?: string;
}

export function Title({ children, subtitle, className = '' }: TitleProps) {
  return (
    <div className={`text-center ${className}`}>
      <h1 className={themeClasses.text.title}>
        {children}
      </h1>
      {subtitle && (
        <div className="text-teal-400 text-sm font-medium tracking-wide uppercase mt-2">
          {subtitle}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// CONCEPT PAIR DISPLAY
// ============================================================================

interface ConceptPairProps {
  leftConcept: string;
  rightConcept: string;
}

export function ConceptPair({ leftConcept, rightConcept }: ConceptPairProps) {
  return (
    <div className="bg-zinc-900 border-2 border-teal-500 shadow-[0_0_25px_rgba(20,184,166,0.3)] p-6">
      <div className="flex items-center justify-between">
        <div className="text-2xl lg:text-3xl font-bold text-teal-400 tracking-wider uppercase">
          {leftConcept}
        </div>
        
        <div className="flex-1 mx-8 flex items-center">
          <div className="flex-1 h-0.5 bg-gradient-to-r from-teal-500 via-zinc-600 to-teal-500"></div>
          <div className="text-teal-500 mx-4 text-2xl">⟷</div>
          <div className="flex-1 h-0.5 bg-gradient-to-r from-teal-500 via-zinc-600 to-teal-500"></div>
        </div>
        
        <div className="text-2xl lg:text-3xl font-bold text-teal-400 tracking-wider uppercase">
          {rightConcept}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PSYCHIC HINT DISPLAY
// ============================================================================

interface PsychicHintProps {
  hint: string;
  glitchEffect?: boolean;
}

export function PsychicHint({ hint, glitchEffect = false }: PsychicHintProps) {
  return (
    <div className="text-center">
      <div className="bg-zinc-900 border-2 border-fuchsia-600 inline-block px-8 py-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-fuchsia-500/10 to-transparent opacity-50 animate-pulse"></div>
        
        <div className="text-gray-400 text-sm font-bold tracking-widest uppercase mb-2">
          PSYCHIC TRANSMISSION
        </div>
        <div
          className={`text-3xl lg:text-4xl font-bold text-white tracking-wider transition-all duration-100 ${
            glitchEffect ? "animate-pulse text-fuchsia-500" : ""
          }`}
        >
          &ldquo;{hint}&rdquo;
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ERROR MESSAGE
// ============================================================================

interface ErrorMessageProps {
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="bg-red-900/50 border-2 border-red-600 px-4 py-3 text-red-300 text-center font-medium tracking-wide">
      {message}
    </div>
  );
}

// ============================================================================
// DIAL NEEDLE COMPONENTS
// ============================================================================

interface NeedleProps {
  angle: number; // Angle in degrees (-90 to 90 for semicircle)
  color?: string;
  isDragging?: boolean;
  showPivot?: boolean;
  height?: number;
  width?: number;
  opacity?: number;
}

export function Needle({ 
  angle, 
  color = 'rgb(236, 72, 153)', 
  isDragging = false,
  showPivot = true,
  height = 230,
  width = 5,
  opacity = 1
}: NeedleProps) {
  return (
    <div
      className="absolute bottom-0 left-1/2 w-10 h-[220px] pointer-events-none"
      style={{ transform: 'translateX(-50%)' }}
    >
      {/* Needle */}
      <div
        className={`absolute bottom-0 left-1/2 rounded-t-full transition-all duration-100 ${
          isDragging ? "animate-pulse" : ""
        }`}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          background: "rgb(254, 254, 254)",
          transformOrigin: "bottom center",
          transform: `translateX(-50%) rotate(${angle}deg)`,
          // boxShadow: isDragging
          //   ? "0 0 20px rgba(255, 20, 147, 0.8), 0 0 40px rgba(255, 20, 147, 0.4)"
          //   : `0 0 15px ${color}80, 0 0 30px ${color}66`,
          filter: isDragging
            ? "drop-shadow(0 0 8px rgb(255, 20, 147))"
            : `drop-shadow(0 0 6px ${color})`,
          opacity
        }}
      />

      {/* Pivot Point */}
      {showPivot && (
        <div
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 pointer-events-auto"
          style={{ cursor: "grab" }}
        >
          {/* Enlarged hit area */}
          <div className="absolute w-12 h-12 -translate-x-1/2 -translate-y-1/2 rounded-full"></div>

          {/* Outer ring */}
          <div
            className="w-8 h-8 rounded-full border-2 transition-all duration-200 -translate-x-1/2 -translate-y-1/2 absolute"
            style={{
              background: "rgb(254, 254, 254)",
              borderColor: isDragging ? "rgb(255, 20, 147)" : color,
              // boxShadow: isDragging
              //   ? "0 0 20px rgba(255, 20, 147, 0.8)"
              //   : `0 0 15px ${color}99`,
            }}
          />

          {/* Inner circle */}
          <div
            className="w-4 h-4 rounded-full transition-all duration-200 -translate-x-1/2 -translate-y-1/2 absolute"
            style={{
              // backgroundColor: isDragging ? "rgb(255, 20, 147)" : color,
              // boxShadow: `0 0 10px ${color}`,
            }}
          />

          {/* Center dot */}
          <div className="w-1.5 h-1.5 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 absolute"></div>
        </div>
      )}
    </div>
  );
}

interface DialNeedleProps {
  position: number; // Position as percentage (0-100)
  color?: string;
  isDragging?: boolean;
  showPivot?: boolean;
  height?: number;
  width?: number;
  opacity?: number;
}

/**
 * Dial Needle component that converts position percentage to angle
 */
export function DialNeedle({ position, ...props }: DialNeedleProps) {
  // Convert percentage (0-100) to angle (-90 to 90 degrees for semicircle)
  const angle = -90 + (position / 100) * 180;
  return <Needle angle={angle} {...props} />;
}

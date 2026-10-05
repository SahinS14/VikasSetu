import React, { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';
import './TextType.css';

export interface TextSegment {
  text: string;
  className?: string;
}

export interface TextTypeProps {
  text?: string | string[];
  segments?: TextSegment[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
  showCursor?: boolean;
  cursorCharacter?: string;
  cursorBlinkDuration?: number;
  loop?: boolean;
  className?: string;
  cursorClassName?: string;
  onComplete?: () => void;
}

export const TextType: React.FC<TextTypeProps> = ({
  text = "Empowering India's\nसहकारी Workforce",
  segments: customSegments,
  typingSpeed = 55,
  deletingSpeed = 25,
  pauseDuration = 1800,
  showCursor = true,
  cursorCharacter = '|',
  cursorBlinkDuration = 0.5,
  loop = true,
  className = '',
  cursorClassName = '',
  onComplete,
}) => {
  const cursorRef = useRef<HTMLSpanElement>(null);

  // Parse text into structured styled segments if customSegments not provided
  const resolveSegments = (rawText: string): TextSegment[] => {
    if (customSegments && customSegments.length > 0) {
      return customSegments;
    }

    // Default VikasSetu 3-part heading highlight logic
    if (rawText.includes('सहकारी')) {
      const parts = rawText.split('सहकारी');
      return [
        { text: parts[0], className: 'text-[#073D32]' },
        { text: 'सहकारी', className: 'text-[#E98A28] font-devanagari font-black' },
        { text: parts[1] || '', className: 'text-[#073D32]' },
      ];
    }

    return [{ text: rawText, className: 'text-[#073D32]' }];
  };

  const textList = Array.isArray(text) ? text : [text];
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const currentPhrase = textList[currentPhraseIndex] || '';
  const currentSegments = resolveSegments(currentPhrase);

  const totalLength = currentSegments.reduce((sum, seg) => sum + seg.text.length, 0);

  const [charCount, setCharCount] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // GSAP cursor animation
  useEffect(() => {
    if (!showCursor || !cursorRef.current) return;

    const tween = gsap.to(cursorRef.current, {
      opacity: 0,
      duration: cursorBlinkDuration,
      repeat: -1,
      yoyo: true,
      ease: 'power1.inOut',
    });

    return () => {
      tween.kill();
    };
  }, [showCursor, cursorBlinkDuration]);

  // Typing & deleting loop
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (!isDeleting && charCount < totalLength) {
      timer = setTimeout(() => {
        setCharCount(prev => prev + 1);
      }, typingSpeed);
    } else if (!isDeleting && charCount === totalLength) {
      if (onComplete) onComplete();
      if (loop) {
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, pauseDuration);
      }
    } else if (isDeleting && charCount > 0) {
      timer = setTimeout(() => {
        setCharCount(prev => prev - 1);
      }, deletingSpeed);
    } else if (isDeleting && charCount === 0) {
      setIsDeleting(false);
      setCurrentPhraseIndex(prev => (prev + 1) % textList.length);
    }

    return () => clearTimeout(timer);
  }, [charCount, isDeleting, totalLength, typingSpeed, deletingSpeed, pauseDuration, loop, onComplete, textList.length]);

  // Render segments up to current charCount
  let accumulated = 0;
  const renderedSegments = currentSegments.map((seg, idx) => {
    const start = accumulated;
    const end = start + seg.text.length;
    accumulated = end;

    if (charCount <= start) {
      return null;
    }

    const visibleText = seg.text.slice(0, Math.max(0, charCount - start));

    // Handle line breaks cleanly
    if (visibleText.includes('\n')) {
      const lines = visibleText.split('\n');
      return (
        <span key={idx} className={seg.className}>
          {lines.map((line, lineIdx) => (
            <React.Fragment key={lineIdx}>
              {line}
              {lineIdx < lines.length - 1 && <br />}
            </React.Fragment>
          ))}
        </span>
      );
    }

    return (
      <span key={idx} className={seg.className}>
        {visibleText}
      </span>
    );
  });

  return (
    <span className={`text-type-container ${className}`}>
      {renderedSegments}
      {showCursor && (
        <span
          ref={cursorRef}
          className={`text-type-cursor ${cursorClassName}`}
          aria-hidden="true"
        >
          {cursorCharacter}
        </span>
      )}
    </span>
  );
};

export default TextType;

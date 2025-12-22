import React from 'react';

interface TextHighlightProps {
  text: string;
  searchTerm: string;
  className?: string;
}

export function TextHighlight({ text, searchTerm, className = '' }: TextHighlightProps) {
  if (!searchTerm.trim()) {
    return <span className={className}>{text}</span>;
  }

  // Create a case-insensitive regex for the search term
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        const isMatch = regex.test(part);
        // Reset regex lastIndex for next test
        regex.lastIndex = 0;

        return isMatch ? (
          <mark
            key={index}
            className="bg-yellow-200 text-gray-900 px-0.5 rounded"
          >
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        );
      })}
    </span>
  );
}
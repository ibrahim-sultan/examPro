import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const INLINE_REGEX = /(?:\$\$(.+?)\$\$|\$(.+?)\$|\\\((.+?)\\\)|\\\[(.+?)\\\])/gs;
const INLINE_TEST_REGEX = /(?:\$\$(.+?)\$\$|\$(.+?)\$|\\\((.+?)\\\)|\\\[(.+?)\\\])/s;
const AUTO_MATH_REGEX = /(?:\([^)]*\)(?:[\^_][A-Za-z0-9π√]+)+|[A-Za-z0-9π√]+(?:[\^_][A-Za-z0-9π√]+)+|\\(?:sqrt|frac)\{[^}]+\}(?:\{[^}]+\})?|π|√|≤|≥|≠|∞|±|×|÷|\b(?:sqrt|frac|sin|cos|tan|log|ln|pi|theta|alpha|beta|gamma|delta|epsilon|phi|psi|omega)\b)/gi;

const renderFormula = (expression, displayMode = false) => {
  try {
    return katex.renderToString(expression, {
      throwOnError: false,
      displayMode,
    });
  } catch (error) {
    return expression;
  }
};

const normalizeUnicodeMath = (value) => {
  if (typeof value !== 'string') return value;

  const superscriptMap = {
    '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
    '⁺': '+', '⁻': '-', '⁼': '=', '⁽': '(', '⁾': ')',
  };
  const subscriptMap = {
    '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9',
    '₊': '+', '₋': '-', '₌': '=', '₍': '(', '₎': ')',
  };
  const symbolMap = {
    'π': '\\pi',
    '√': '\\sqrt',
    '×': '\\times',
    '÷': '\\div',
    '±': '\\pm',
    '∞': '\\infty',
    '≤': '\\le',
    '≥': '\\ge',
    '≠': '\\neq',
  };

  return value
    .split('')
    .map((ch) => superscriptMap[ch] || subscriptMap[ch] || symbolMap[ch] || ch)
    .join('');
};

const autoFormatMathText = (text) => {
  if (typeof text !== 'string') return text;
  const normalized = normalizeUnicodeMath(text);
  if (INLINE_TEST_REGEX.test(normalized)) return normalized;

  return normalized.replace(AUTO_MATH_REGEX, (match) => {
    if (/^\$.*\$$/.test(match)) return match;
    return `$${match}$`;
  });
};

const MathText = ({ text }) => {
  if (!text) return null;

  const processed = autoFormatMathText(text);
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = INLINE_REGEX.exec(processed)) !== null) {
    const [fullMatch, displayDollar, inlineDollar, inlineParen, displayBracket] = match;
    const start = match.index;

    if (start > lastIndex) {
      parts.push(processed.slice(lastIndex, start));
    }

    const expr = displayDollar || inlineDollar || inlineParen || displayBracket || '';
    const displayMode = Boolean(displayDollar || displayBracket);
    const html = renderFormula(expr, displayMode);
    parts.push(
      <span
        key={`math-${start}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );

    lastIndex = start + fullMatch.length;
  }

  if (lastIndex < processed.length) {
    parts.push(processed.slice(lastIndex));
  }

  return <span>{parts}</span>;
};

export default MathText;

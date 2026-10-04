import { RodState, DivisionStep, LongDivisionProblem } from '../types';

/**
 * Creates an array of empty rods
 */
export function createEmptyRods(count: number): RodState[] {
  return Array.from({ length: count }, () => ({
    upper: false,
    lowerCount: 0,
  }));
}

/**
 * Calculates numeric value of a single rod (0 - 9)
 */
export function getRodValue(rod: RodState): number {
  return (rod.upper ? 5 : 0) + rod.lowerCount;
}

/**
 * Converts a digit (0 - 9) to a RodState
 */
export function digitToRod(digit: number): RodState {
  const safeDigit = Math.max(0, Math.min(9, Math.floor(digit || 0)));
  const upper = safeDigit >= 5;
  const lowerCount = safeDigit >= 5 ? safeDigit - 5 : safeDigit;
  return { upper, lowerCount };
}

/**
 * Converts a positive integer to an array of RodStates based on a target unit rod index
 */
export function numberToRods(num: number, rodCount: number, unitRodIndex?: number): RodState[] {
  const rods = createEmptyRods(rodCount);
  const uIndex = unitRodIndex !== undefined ? unitRodIndex : rodCount - 1;
  const digits = Math.abs(Math.floor(num)).toString().split('').map(Number);

  for (let i = 0; i < digits.length; i++) {
    const rodIdx = uIndex - (digits.length - 1 - i);
    if (rodIdx >= 0 && rodIdx < rodCount) {
      rods[rodIdx] = digitToRod(digits[i]);
    }
  }
  return rods;
}

/**
 * Converts rods back to an integer value, interpreting from a unit rod index
 */
export function rodsToNumber(rods: RodState[], unitRodIndex?: number): number {
  const uIndex = unitRodIndex !== undefined ? unitRodIndex : rods.length - 1;
  let total = 0;
  let multiplier = 1;

  for (let i = uIndex; i >= 0; i--) {
    const val = getRodValue(rods[i]);
    total += val * multiplier;
    multiplier *= 10;
  }
  return total;
}

/**
 * Reads a number spanning specific rod indices (e.g., in division sections)
 */
export function readRodSpan(rods: RodState[], startIndex: number, endIndex: number): number {
  let val = 0;
  for (let i = startIndex; i <= endIndex; i++) {
    if (i >= 0 && i < rods.length) {
      val = val * 10 + getRodValue(rods[i]);
    }
  }
  return val;
}

/**
 * Sets a number spanning specific rod indices
 */
export function setRodSpan(
  rods: RodState[],
  startIndex: number,
  endIndex: number,
  num: number
): RodState[] {
  const newRods = rods.map((r) => ({ ...r }));
  const spanLen = endIndex - startIndex + 1;
  const str = Math.abs(Math.floor(num)).toString().padStart(spanLen, '0');
  const tail = str.slice(-spanLen);

  for (let i = 0; i < spanLen; i++) {
    const rIdx = startIndex + i;
    if (rIdx < newRods.length) {
      newRods[rIdx] = digitToRod(parseInt(tail[i], 10));
    }
  }
  return newRods;
}

/**
 * 5-Complement Rule Helper (Friends of 5)
 */
export function getFiveComplement(val: number): { friend: number; rule: string } | null {
  switch (val) {
    case 1:
      return { friend: 4, rule: '+1 = +5 - 4  (or -1 = +4 - 5)' };
    case 2:
      return { friend: 3, rule: '+2 = +5 - 3  (or -2 = +3 - 5)' };
    case 3:
      return { friend: 2, rule: '+3 = +5 - 2  (or -3 = +2 - 5)' };
    case 4:
      return { friend: 1, rule: '+4 = +5 - 1  (or -4 = +1 - 5)' };
    default:
      return null;
  }
}

/**
 * 10-Complement Rule Helper (Friends of 10)
 */
export function getTenComplement(val: number): { friend: number; rule: string } | null {
  if (val >= 1 && val <= 9) {
    const friend = 10 - val;
    return {
      friend,
      rule: `+${val} = +10 - ${friend}  (Carry to left rod, remove ${friend})`,
    };
  }
  return null;
}

/**
 * Generates an end-to-end Long Division problem solver with detailed abacus step breakdown
 * Abacus layout:
 * - Rods 0..3: Quotient section (Blue)
 * - Rod 4: Separator (Neutral)
 * - Rods 5..10: Dividend / Remainder section (Amber)
 */
export function generateLongDivisionSteps(
  dividend: number,
  divisor: number,
  rodCount: number = 11
): LongDivisionProblem {
  const quotient = Math.floor(dividend / divisor);
  const remainder = dividend % divisor;

  const divStr = dividend.toString();
  const steps: DivisionStep[] = [];

  // Rod allocations
  // For 11 rods:
  // Quotient rods: [0, 1, 2, 3]
  // Separator: 4
  // Dividend rods: e.g. [5, 6, 7, 8, 9, 10]
  const quotientStart = 0;
  const quotientEnd = Math.max(2, Math.floor((rodCount - 3) / 2));
  const dividendStart = quotientEnd + 2;
  const dividendEnd = rodCount - 1;

  // Initialize initial abacus state
  let currentRods = createEmptyRods(rodCount);
  // Set dividend right-aligned in dividend section
  const divLen = divStr.length;
  const divTargetStart = dividendEnd - divLen + 1;
  for (let i = 0; i < divLen; i++) {
    currentRods[divTargetStart + i] = digitToRod(parseInt(divStr[i], 10));
  }

  // Step 0: Initial setup
  steps.push({
    stepIndex: 0,
    title: 'Initial Abacus Setup',
    explanation: `Set the dividend ${dividend} in the right section (Amber rods). Divisor is ${divisor}. The left section (Blue rods) is reserved for quotient digits.`,
    dividendSnapshot: dividend,
    divisor,
    currentDividendPart: 0,
    quotientDigit: 0,
    subtrahend: 0,
    newRemainder: dividend,
    quotientRodIndex: -1,
    dividendRodIndices: Array.from({ length: divLen }, (_, i) => divTargetStart + i),
    actionType: 'complete',
    targetRodsState: currentRods.map((r) => ({ ...r })),
  });

  let currentDividendSegment = 0;
  let currentDigitIndex = 0;
  let activeQuotientRod = quotientStart;
  let remainingDividendVal = dividend;

  // Track position in dividend string
  while (currentDigitIndex < divStr.length) {
    const nextDigit = parseInt(divStr[currentDigitIndex], 10);
    currentDividendSegment = currentDividendSegment * 10 + nextDigit;

    if (currentDividendSegment < divisor && currentDigitIndex < divStr.length - 1 && steps.length > 1) {
      // Digit cannot be divided, place 0 in quotient
      const qRod = activeQuotientRod;
      currentRods[qRod] = digitToRod(0);
      activeQuotientRod++;

      steps.push({
        stepIndex: steps.length,
        title: `Quotient 0 for digit '${nextDigit}'`,
        explanation: `${currentDividendSegment} is smaller than ${divisor}. Place 0 on quotient rod, then bring down next digit.`,
        dividendSnapshot: remainingDividendVal,
        divisor,
        currentDividendPart: currentDividendSegment,
        quotientDigit: 0,
        subtrahend: 0,
        newRemainder: currentDividendSegment,
        quotientRodIndex: qRod,
        dividendRodIndices: [divTargetStart + currentDigitIndex],
        actionType: 'set_quotient',
        targetRodsState: currentRods.map((r) => ({ ...r })),
      });

      currentDigitIndex++;
      continue;
    }

    if (currentDividendSegment < divisor && currentDigitIndex === 0) {
      // Look at two digits for first step
      currentDigitIndex++;
      continue;
    }

    // Trial quotient
    const qDigit = Math.floor(currentDividendSegment / divisor);
    const product = qDigit * divisor;
    const subRemainder = currentDividendSegment - product;

    // 1. Set quotient digit
    const currentQRod = activeQuotientRod;
    currentRods[currentQRod] = digitToRod(qDigit);

    steps.push({
      stepIndex: steps.length,
      title: `Trial Quotient: ${currentDividendSegment} ÷ ${divisor} = ${qDigit}`,
      explanation: `Divide ${currentDividendSegment} by ${divisor}. The highest multiple is ${qDigit} (${qDigit} × ${divisor} = ${product}). Place ${qDigit} on quotient rod ${currentQRod + 1}.`,
      dividendSnapshot: remainingDividendVal,
      divisor,
      currentDividendPart: currentDividendSegment,
      quotientDigit: qDigit,
      subtrahend: product,
      newRemainder: subRemainder,
      quotientRodIndex: currentQRod,
      dividendRodIndices: [divTargetStart + currentDigitIndex],
      actionType: 'set_quotient',
      targetRodsState: currentRods.map((r) => ({ ...r })),
    });

    // 2. Subtract partial product from abacus dividend
    // Update the rods in dividend section
    // Replace the segment in the dividend
    const suffix = divStr.slice(currentDigitIndex + 1);
    const newRemainingStr = subRemainder.toString() + suffix;
    remainingDividendVal = parseInt(newRemainingStr || '0', 10);

    // Update currentRods dividend part
    currentRods = setRodSpan(
      currentRods,
      dividendStart,
      dividendEnd,
      remainingDividendVal
    );

    steps.push({
      stepIndex: steps.length,
      title: `Subtract Product: -${product}`,
      explanation: `Subtract ${product} (${qDigit} × ${divisor}) from ${currentDividendSegment}. Remaining in this position is ${subRemainder}. Observe the dividend beads update.`,
      dividendSnapshot: remainingDividendVal,
      divisor,
      currentDividendPart: currentDividendSegment,
      quotientDigit: qDigit,
      subtrahend: product,
      newRemainder: subRemainder,
      quotientRodIndex: currentQRod,
      dividendRodIndices: [divTargetStart + currentDigitIndex],
      actionType: 'subtract_product',
      targetRodsState: currentRods.map((r) => ({ ...r })),
    });

    currentDividendSegment = subRemainder;
    activeQuotientRod++;
    currentDigitIndex++;
  }

  // Final step
  steps.push({
    stepIndex: steps.length,
    title: 'Division Completed!',
    explanation: `Calculations complete! Quotient is ${quotient}${remainder > 0 ? `, with remainder ${remainder}` : ' (evenly divided)'}.`,
    dividendSnapshot: remainder,
    divisor,
    currentDividendPart: remainder,
    quotientDigit: 0,
    subtrahend: 0,
    newRemainder: remainder,
    quotientRodIndex: -1,
    dividendRodIndices: [],
    actionType: 'complete',
    targetRodsState: currentRods.map((r) => ({ ...r })),
  });

  return {
    dividend,
    divisor,
    quotient,
    remainder,
    steps,
  };
}

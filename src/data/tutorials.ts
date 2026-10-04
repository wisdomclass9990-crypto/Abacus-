import { TutorialStep } from '../types';

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'intro_anatomy',
    title: '1. Anatomy of the Soroban',
    category: 'basics',
    objective: 'Learn the reckoning rule and bead values.',
    content: `The Japanese Soroban consists of an outer frame, vertical rods, and a horizontal Reckoning Beam in the center.

• **Heaven Deck (Upper)**: 1 bead per rod, each valued at **5**.
• **Earth Deck (Lower)**: 4 beads per rod, each valued at **1**.
• **Golden Rule**: Beads are only counted when pushed **TOWARDS** the reckoning beam! When away from the beam, their value is **0**.`,
    tips: [
      'Upper bead pushed DOWN towards beam = 5',
      'Lower beads pushed UP towards beam = 1 each',
      'Try clicking any lower bead on the highlighted rod to push it up!',
    ],
    targetNumber: 1,
    startingNumber: 0,
    highlightRods: [6], // unit rod
  },
  {
    id: 'lower_beads_1_4',
    title: '2. Earth Beads (Numbers 1 to 4)',
    category: 'basics',
    objective: 'Set numbers 1 through 4 using lower beads.',
    content: `Each lower bead that touches the center beam adds **1** to that rod.
• 1 bead up = 1
• 2 beads up = 2
• 3 beads up = 3
• 4 beads up = 4

If you tap the 3rd bead from the top, all beads up to that point will slide up together!`,
    tips: [
      'Click the 3rd lower bead from the top to activate 3 beads at once.',
      'Make sure the upper bead stays resting up at the top frame.',
    ],
    targetNumber: 3,
    startingNumber: 0,
    highlightRods: [6],
  },
  {
    id: 'heaven_bead_5',
    title: '3. The Heaven Bead (Number 5)',
    category: 'basics',
    objective: 'Activate the upper bead to represent 5.',
    content: `In standard Western counting, you need 5 single units to make 5. On the Soroban, the single **upper bead** represents **5**!

To set 5:
1. Ensure all lower beads are pushed down (inactive).
2. Click the upper bead to slide it **DOWN** against the reckoning beam.`,
    tips: [
      'Upper bead touching beam = 5.',
      'If you have lower beads active, click them down first.',
    ],
    targetNumber: 5,
    startingNumber: 0,
    highlightRods: [6],
  },
  {
    id: 'numbers_6_to_9',
    title: '4. Numbers 6 through 9',
    category: 'basics',
    objective: 'Combine the Heaven bead with Earth beads.',
    content: `To make numbers 6, 7, 8, and 9, we combine the upper 5 bead with lower 1 beads:
• **6** = 5 + 1
• **7** = 5 + 2
• **8** = 5 + 3
• **9** = 5 + 4 (Full rod)

Try setting the number **7** on the highlighted unit rod!`,
    tips: [
      'Lower the upper bead (5).',
      'Push up 2 lower beads (2). Total = 5 + 2 = 7.',
    ],
    targetNumber: 7,
    startingNumber: 0,
    highlightRods: [6],
  },
  {
    id: 'two_digits_place_value',
    title: '5. Tens & Place Values',
    category: 'direct',
    objective: 'Understand place values across multiple rods.',
    content: `Just like writing numbers, the abacus uses a base-10 decimal place-value system:
• Rightmost unit rod = **Units (1s)**
• Next rod to the left = **Tens (10s)**
• Next rod to the left = **Hundreds (100s)**
• Next rod to the left = **Thousands (1,000s)**

Let's set **34**:
• Set **3** on the Tens rod (rod 5).
• Set **4** on the Units rod (rod 6).`,
    tips: [
      'Rod 5 is Tens: push 3 lower beads up.',
      'Rod 6 is Units: push 4 lower beads up.',
      'Total displayed will be 34.',
    ],
    targetNumber: 34,
    startingNumber: 0,
    highlightRods: [5, 6],
  },
  {
    id: 'five_friends_addition',
    title: '6. Five Friends (+4 = +5 - 1)',
    category: 'five_friends',
    objective: 'Use 5-complement when lower beads are depleted.',
    content: `What happens when you have **3** on the abacus and want to add **4**?
You only have 1 lower bead left! You cannot directly add 4.

Instead, use the **Friend of 5** formula:
Since 4 + 1 = 5, we do:
**+4 = +5 - 1**

Step 1: Bring down the upper 5 bead (+5).
Step 2: Remove 1 lower bead (-1).
Result: 3 + 4 = **7**!`,
    tips: [
      'Current value is 3.',
      'To add 4: lower the 5 bead, then lower 1 of the active lower beads.',
      'Target final value is 7.',
    ],
    targetNumber: 7,
    startingNumber: 3,
    highlightRods: [6],
    expectedOperation: {
      from: 3,
      delta: 4,
      to: 7,
      formula: '+4 = +5 - 1',
    },
  },
  {
    id: 'ten_friends_addition',
    title: '7. Ten Friends (+3 = +10 - 7)',
    category: 'ten_friends',
    objective: 'Master carrying over to the next rod (Friends of 10).',
    content: `When a rod already holds 9, you have no more beads left on that rod to add!
To add a number, we carry **10** to the left rod and subtract the "Friend of 10".

Let's do **9 + 3**:
Since 3 + 7 = 10, the formula is:
**+3 = +10 - 7**

Step 1: Add 1 bead on the Tens rod to the left (+10).
Step 2: Clear 7 from the Units rod (-7: push upper 5 up, lower 2 down).
Result: 9 + 3 = **12**!`,
    tips: [
      'Current value is 9.',
      'Add 1 lower bead to the Tens rod (left).',
      'Remove 7 from the Units rod (leaving 2 lower beads).',
      'Target final value is 12.',
    ],
    targetNumber: 12,
    startingNumber: 9,
    highlightRods: [5, 6],
    expectedOperation: {
      from: 9,
      delta: 3,
      to: 12,
      formula: '+3 = +10 - 7',
    },
  },
  {
    id: 'division_soroban',
    title: '8. Soroban Long Division Principles',
    category: 'division',
    objective: 'Understand how long division is arranged on the abacus.',
    content: `In abacus long division, we divide the abacus into two active sections:
• **Left Section (Blue)**: Holds the accumulating **Quotient** (the answer).
• **Right Section (Amber)**: Holds the **Dividend** and subsequent **Remainders**.

To solve **64 ÷ 2**:
1. Place 64 in the right section (tens = 6, units = 4).
2. Divide tens: 6 ÷ 2 = **3**. Set 3 on the quotient rod, subtract 6 from dividend.
3. Divide units: 4 ÷ 2 = **2**. Set 2 on the next quotient rod, subtract 4 from dividend.
4. Final Quotient = **32**, Remainder = **0**!

Set the final quotient **32** on rods 5 and 6!`,
    tips: [
      'Set 3 on rod 5 and 2 on rod 6.',
      'Total value is 32.',
    ],
    targetNumber: 32,
    startingNumber: 0,
    highlightRods: [5, 6],
  },
];

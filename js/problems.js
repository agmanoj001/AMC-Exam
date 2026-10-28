// Original practice problems written for this app (not taken from any contest).
// Every problem's answer is recomputed independently in tests/problems.test.js;
// a problem without a verifier there makes the test suite fail.
//
// Fields: id, topic, set ('drill' | 'systems'), prompt, answer (string; integer
// or reduced fraction), solution (array of steps), hint.

export const PROBLEMS = [
  // ---------- Algebra ----------
  {
    id: 'alg-01', topic: 'algebra', set: 'drill',
    prompt: 'Three times a number, plus 7, equals 31. What is the number?',
    answer: '8',
    hint: 'Undo the "+ 7" first, then undo the "times 3".',
    solution: ['Write it as 3n + 7 = 31.', 'Subtract 7 from both sides: 3n = 24.', 'Divide both sides by 3: n = 8.'],
  },
  {
    id: 'alg-02', topic: 'algebra', set: 'drill',
    prompt: 'The average of 5 numbers is 12. When a sixth number is added, the average of all six becomes 13. What is the sixth number?',
    answer: '18',
    hint: 'Average × how many = total.',
    solution: ['The first 5 numbers add up to 5 × 12 = 60.', 'All 6 numbers add up to 6 × 13 = 78.', 'The sixth number is 78 − 60 = 18.'],
  },
  {
    id: 'alg-03', topic: 'algebra', set: 'drill',
    prompt: 'A pen costs 120 cents more than a pencil. Together they cost 200 cents. How many cents does the pencil cost?',
    answer: '40',
    hint: 'Call the pencil p. What is the pen?',
    solution: ['Let the pencil cost p cents, so the pen costs p + 120.', 'Together: p + (p + 120) = 200, so 2p = 80.', 'The pencil costs 40 cents. (Check: 40 + 160 = 200.)'],
  },
  {
    id: 'alg-04', topic: 'algebra', set: 'drill',
    prompt: 'If 2x − 5 = x + 9, what is the value of 4x?',
    answer: '56',
    hint: 'Get all the x’s on one side.',
    solution: ['Subtract x from both sides: x − 5 = 9.', 'Add 5 to both sides: x = 14.', 'So 4x = 4 × 14 = 56. (Careful: the question asks for 4x, not x!)'],
  },
  {
    id: 'alg-05', topic: 'algebra', set: 'drill',
    prompt: 'A train travels 180 miles in 3 hours. At the same speed, how many minutes does it take to travel 75 miles?',
    answer: '75',
    hint: 'Find the speed in miles per hour first.',
    solution: ['Speed = 180 ÷ 3 = 60 miles per hour.', '60 miles per hour is 1 mile every minute.', 'So 75 miles takes 75 minutes.'],
  },
  {
    id: 'alg-06', topic: 'algebra', set: 'drill',
    prompt: 'The sum of four consecutive integers is 74. What is the largest of the four?',
    answer: '20',
    hint: 'Call the smallest n. Then the others are n + 1, n + 2, n + 3.',
    solution: ['n + (n + 1) + (n + 2) + (n + 3) = 4n + 6 = 74.', '4n = 68, so n = 17.', 'The integers are 17, 18, 19, 20, so the largest is 20.'],
  },
  {
    id: 'alg-07', topic: 'algebra', set: 'drill',
    prompt: 'If a/b = 3/4 and b/c = 2/5, what is a/c? (Answer as a fraction.)',
    answer: '3/10',
    hint: 'What happens when you multiply a/b by b/c?',
    solution: ['(a/b) × (b/c) = a/c, because the b’s cancel.', 'So a/c = (3/4) × (2/5) = 6/20.', 'Simplify: 6/20 = 3/10.'],
  },
  {
    id: 'alg-08', topic: 'algebra', set: 'drill',
    prompt: 'What is 1 − 2 + 3 − 4 + 5 − 6 + … + 99 − 100?',
    answer: '-50',
    hint: 'Group the terms in pairs.',
    solution: ['Group in pairs: (1 − 2) + (3 − 4) + … + (99 − 100).', 'Each pair equals −1, and there are 100 ÷ 2 = 50 pairs.', 'Total = 50 × (−1) = −50.'],
  },
  {
    id: 'alg-09', topic: 'algebra', set: 'drill',
    prompt: 'A rectangle’s length is 3 more than twice its width. Its perimeter is 48. What is its area?',
    answer: '119',
    hint: 'Width w, length 2w + 3. Perimeter is 2 × (length + width).',
    solution: ['Let the width be w, so the length is 2w + 3.', 'Perimeter: 2(w + 2w + 3) = 48, so 3w + 3 = 24 and w = 7.', 'Length = 2(7) + 3 = 17. Area = 7 × 17 = 119.'],
  },
  {
    id: 'alg-10', topic: 'algebra', set: 'drill',
    prompt: 'Right now, Rina is 4 times as old as her little brother. In 6 years she will be exactly twice as old as he is. How old is Rina now?',
    answer: '12',
    hint: 'Let the brother be b. Then Rina is 4b. Add 6 to both ages.',
    solution: ['Let the brother be b years old, so Rina is 4b.', 'In 6 years: 4b + 6 = 2(b + 6) = 2b + 12.', 'So 2b = 6 and b = 3. Rina is 4 × 3 = 12. (Check: in 6 years, 18 = 2 × 9.)'],
  },

  // ---------- Counting & Probability ----------
  {
    id: 'cnt-01', topic: 'counting', set: 'drill',
    prompt: 'How many positive integers less than 100 are multiples of 3 or multiples of 5 (or both)?',
    answer: '46',
    hint: 'Count multiples of 3, add multiples of 5, then fix the double-counted ones.',
    solution: ['Multiples of 3 below 100: 3, 6, …, 99 → 33 numbers.', 'Multiples of 5 below 100: 5, 10, …, 95 → 19 numbers.', 'Multiples of both (that is, of 15): 15, 30, …, 90 → 6 numbers, counted twice.', 'Total = 33 + 19 − 6 = 46.'],
  },
  {
    id: 'cnt-02', topic: 'counting', set: 'drill',
    prompt: 'In how many different orders can 4 friends stand in a line?',
    answer: '24',
    hint: 'How many choices for the first spot? Then the second?',
    solution: ['4 choices for the first spot, then 3, then 2, then 1.', '4 × 3 × 2 × 1 = 24.'],
  },
  {
    id: 'cnt-03', topic: 'counting', set: 'drill',
    prompt: 'A fair coin is flipped 3 times. What is the probability of getting exactly 2 heads? (Answer as a fraction.)',
    answer: '3/8',
    hint: 'List all the outcomes — there are only 8.',
    solution: ['There are 2 × 2 × 2 = 8 equally likely outcomes.', 'Exactly two heads: HHT, HTH, THH → 3 outcomes.', 'Probability = 3/8.'],
  },
  {
    id: 'cnt-04', topic: 'counting', set: 'drill',
    prompt: 'Two fair six-sided dice are rolled. What is the probability that the two numbers add to 7? (Answer as a fraction.)',
    answer: '1/6',
    hint: 'Make a 6 × 6 grid of outcomes.',
    solution: ['There are 6 × 6 = 36 equally likely outcomes.', 'Sum 7: (1,6), (2,5), (3,4), (4,3), (5,2), (6,1) → 6 outcomes.', 'Probability = 6/36 = 1/6.'],
  },
  {
    id: 'cnt-05', topic: 'counting', set: 'drill',
    prompt: 'How many three-digit positive integers have only odd digits?',
    answer: '125',
    hint: 'How many odd digits are there?',
    solution: ['The odd digits are 1, 3, 5, 7, 9 — five choices.', 'Each of the 3 places can be any of them (none is 0, so the first digit is fine).', '5 × 5 × 5 = 125.'],
  },
  {
    id: 'cnt-06', topic: 'counting', set: 'drill',
    prompt: 'A club has 6 members. How many different 2-person teams can be chosen?',
    answer: '15',
    hint: 'Order doesn’t matter: picking Ann then Bo is the same team as Bo then Ann.',
    solution: ['If order mattered: 6 × 5 = 30 ways.', 'Each team got counted twice (once in each order).', '30 ÷ 2 = 15 teams.'],
  },
  {
    id: 'cnt-07', topic: 'counting', set: 'drill',
    prompt: 'How many diagonals does a convex octagon (8 sides) have?',
    answer: '20',
    hint: 'From each corner, how many other corners can a diagonal reach?',
    solution: ['From each of the 8 corners, a diagonal can go to 8 − 3 = 5 corners (not itself, not its two neighbors).', '8 × 5 = 40 counts each diagonal twice (once from each end).', '40 ÷ 2 = 20 diagonals.'],
  },
  {
    id: 'cnt-08', topic: 'counting', set: 'drill',
    prompt: 'How many different arrangements are there of the letters in the word LEVEL?',
    answer: '30',
    hint: 'Count as if all letters were different, then divide out the repeats.',
    solution: ['If the 5 letters were all different: 5! = 120 orders.', 'The two L’s can swap without changing anything (÷ 2), and so can the two E’s (÷ 2).', '120 ÷ 4 = 30.'],
  },
  {
    id: 'cnt-09', topic: 'counting', set: 'drill',
    prompt: 'A bag holds 3 red marbles and 5 blue marbles. Two marbles are drawn without putting the first one back. What is the probability that both are red? (Answer as a fraction.)',
    answer: '3/28',
    hint: 'After one red is taken, how many reds and how many marbles are left?',
    solution: ['First marble red: 3/8.', 'Then 2 reds remain out of 7 marbles: 2/7.', 'Both: (3/8) × (2/7) = 6/56 = 3/28.'],
  },
  {
    id: 'cnt-10', topic: 'counting', set: 'drill',
    prompt: 'A bug walks on grid lines from (0, 0) to (4, 3), taking steps of 1 unit either right or up. How many different paths can it take?',
    answer: '35',
    hint: 'Every path is 4 R’s and 3 U’s in some order.',
    solution: ['Every path uses 7 steps: 4 rights and 3 ups.', 'A path is decided by which 3 of the 7 steps are "up".', 'Number of ways = (7 × 6 × 5) ÷ (3 × 2 × 1) = 35.'],
  },

  // ---------- Number Theory ----------
  {
    id: 'num-01', topic: 'number', set: 'drill',
    prompt: 'What is the remainder when 2¹⁰ is divided by 7?',
    answer: '2',
    hint: 'Powers of 2 mod 7 repeat: 2, 4, 1, …',
    solution: ['2¹ = 2, 2² = 4, 2³ = 8 leaves remainder 1 when divided by 7.', 'So the remainders repeat every 3 powers: 2, 4, 1, 2, 4, 1, …', '10 = 3 × 3 + 1, so 2¹⁰ has the same remainder as 2¹, which is 2. (Check: 1024 = 7 × 146 + 2.)'],
  },
  {
    id: 'num-02', topic: 'number', set: 'drill',
    prompt: 'How many positive divisors does 72 have?',
    answer: '12',
    hint: 'Write 72 as a product of primes.',
    solution: ['72 = 2³ × 3².', 'A divisor uses 2⁰ to 2³ (4 choices) and 3⁰ to 3² (3 choices).', '4 × 3 = 12 divisors.'],
  },
  {
    id: 'num-03', topic: 'number', set: 'drill',
    prompt: 'What is the greatest common divisor of 84 and 126?',
    answer: '42',
    hint: 'Factor both into primes and keep what they share.',
    solution: ['84 = 2² × 3 × 7 and 126 = 2 × 3² × 7.', 'Shared: one 2, one 3, one 7.', 'GCD = 2 × 3 × 7 = 42.'],
  },
  {
    id: 'num-04', topic: 'number', set: 'drill',
    prompt: 'What is the least common multiple of 12, 18 and 30?',
    answer: '180',
    hint: 'Take the highest power of each prime that appears.',
    solution: ['12 = 2² × 3, 18 = 2 × 3², 30 = 2 × 3 × 5.', 'Highest powers: 2², 3², 5.', 'LCM = 4 × 9 × 5 = 180.'],
  },
  {
    id: 'num-05', topic: 'number', set: 'drill',
    prompt: 'What is the units (ones) digit of 7²⁰²⁶?',
    answer: '9',
    hint: 'Look at the last digits of 7, 7², 7³, 7⁴, …',
    solution: ['Last digits of powers of 7: 7, 9, 3, 1, then it repeats every 4.', '2026 ÷ 4 = 506 remainder 2.', 'So 7²⁰²⁶ ends like 7², which ends in 9.'],
  },
  {
    id: 'num-06', topic: 'number', set: 'drill',
    prompt: 'What is the sum of all prime numbers less than 30?',
    answer: '129',
    hint: 'Don’t forget 2 — it’s the only even prime.',
    solution: ['Primes below 30: 2, 3, 5, 7, 11, 13, 17, 19, 23, 29.', 'Add them: 2 + 3 + 5 + 7 = 17; 11 + 13 + 17 + 19 = 60; 23 + 29 = 52.', '17 + 60 + 52 = 129.'],
  },
  {
    id: 'num-07', topic: 'number', set: 'drill',
    prompt: 'How many integers from 1 to 100 are perfect squares or perfect cubes (or both)?',
    answer: '12',
    hint: 'Some numbers are both a square and a cube.',
    solution: ['Squares: 1, 4, 9, …, 100 → 10 numbers.', 'Cubes: 1, 8, 27, 64 → 4 numbers.', 'Both: 1 and 64 → counted twice.', 'Total = 10 + 4 − 2 = 12.'],
  },
  {
    id: 'num-08', topic: 'number', set: 'drill',
    prompt: 'What is the smallest integer greater than 1 that leaves a remainder of 1 when divided by each of 2, 3, 4, 5 and 6?',
    answer: '61',
    hint: 'If n leaves remainder 1, then n − 1 is a multiple of all of them.',
    solution: ['n − 1 must be divisible by 2, 3, 4, 5 and 6.', 'The smallest positive such number is LCM(2, 3, 4, 5, 6) = 60.', 'So n = 61.'],
  },
  {
    id: 'num-09', topic: 'number', set: 'drill',
    prompt: 'How many zeros are at the end of 25! (that is, 25 × 24 × 23 × … × 2 × 1)?',
    answer: '6',
    hint: 'Each zero needs a 2 × 5. Count the 5’s.',
    solution: ['Every trailing zero comes from a factor 10 = 2 × 5, and there are plenty of 2’s.', 'Multiples of 5 up to 25: 5, 10, 15, 20, 25 → 5 of them.', '25 = 5 × 5 gives one extra 5. Total = 5 + 1 = 6 zeros.'],
  },
  {
    id: 'num-10', topic: 'number', set: 'drill',
    prompt: 'What is the largest prime factor of 1001?',
    answer: '13',
    hint: 'Try dividing by 7.',
    solution: ['1001 ÷ 7 = 143.', '143 = 11 × 13.', 'So 1001 = 7 × 11 × 13, and the largest prime factor is 13.'],
  },

  // ---------- Geometry ----------
  {
    id: 'geo-01', topic: 'geometry', set: 'drill',
    prompt: 'A right triangle has legs of length 6 and 8. How long is the hypotenuse?',
    answer: '10',
    hint: 'Pythagorean theorem: a² + b² = c².',
    solution: ['6² + 8² = 36 + 64 = 100.', 'c² = 100, so c = 10.', '(It’s a 3-4-5 triangle scaled up by 2.)'],
  },
  {
    id: 'geo-02', topic: 'geometry', set: 'drill',
    prompt: 'The three angles of a triangle are in the ratio 2 : 3 : 4. How many degrees is the largest angle?',
    answer: '80',
    hint: 'The angles are 2k, 3k and 4k, and they add to 180°.',
    solution: ['2k + 3k + 4k = 9k = 180°, so k = 20°.', 'The largest angle is 4k = 80°.'],
  },
  {
    id: 'geo-03', topic: 'geometry', set: 'drill',
    prompt: 'How many degrees is each interior angle of a regular hexagon?',
    answer: '120',
    hint: 'The interior angles of an n-gon add to (n − 2) × 180°.',
    solution: ['Sum of interior angles: (6 − 2) × 180° = 720°.', 'All 6 angles are equal: 720° ÷ 6 = 120°.'],
  },
  {
    id: 'geo-04', topic: 'geometry', set: 'drill',
    prompt: 'A square has a diagonal of length 10. What is its area?',
    answer: '50',
    hint: 'A square is a rhombus: area = (diagonal × diagonal) ÷ 2.',
    solution: ['If the side is s, then s² + s² = 10² = 100 by the Pythagorean theorem.', 'So 2s² = 100 and s² = 50.', 'The area is s² = 50.'],
  },
  {
    id: 'geo-05', topic: 'geometry', set: 'drill',
    prompt: 'A rectangle measures 8 by 15. How long is its diagonal?',
    answer: '17',
    hint: 'The diagonal splits the rectangle into two right triangles.',
    solution: ['8² + 15² = 64 + 225 = 289.', '√289 = 17.'],
  },
  {
    id: 'geo-06', topic: 'geometry', set: 'drill',
    prompt: 'A circle has area 36π. Its circumference is kπ. What is k?',
    answer: '12',
    hint: 'Area = πr², circumference = 2πr.',
    solution: ['πr² = 36π, so r² = 36 and r = 6.', 'Circumference = 2π × 6 = 12π.', 'So k = 12.'],
  },
  {
    id: 'geo-07', topic: 'geometry', set: 'drill',
    prompt: 'A triangle has corners at (0, 0), (6, 0) and (2, 5). What is its area?',
    answer: '15',
    hint: 'Use the side on the x-axis as the base.',
    solution: ['The base from (0, 0) to (6, 0) has length 6.', 'The height is how far (2, 5) is above the x-axis: 5.', 'Area = ½ × 6 × 5 = 15.'],
  },
  {
    id: 'geo-08', topic: 'geometry', set: 'drill',
    prompt: 'A cube has a total surface area of 150 square units. What is its volume?',
    answer: '125',
    hint: 'A cube has 6 equal square faces.',
    solution: ['Each face has area 150 ÷ 6 = 25, so each edge is 5.', 'Volume = 5 × 5 × 5 = 125.'],
  },
  {
    id: 'geo-09', topic: 'geometry', set: 'drill',
    prompt: 'At 3:30, how many degrees is the smaller angle between the hour hand and the minute hand of a clock?',
    answer: '75',
    hint: 'The hour hand moves too — it’s halfway between 3 and 4.',
    solution: ['Each hour mark is 360° ÷ 12 = 30° apart.', 'The minute hand points at 6: 180° from 12.', 'The hour hand is halfway from 3 to 4: 90° + 15° = 105°.', 'The angle between them is 180° − 105° = 75°.'],
  },
  {
    id: 'geo-10', topic: 'geometry', set: 'drill',
    prompt: 'A right triangle has legs 3 and 4 and hypotenuse 5. How long is the altitude (height) drawn to the hypotenuse? (Answer as a fraction.)',
    answer: '12/5',
    hint: 'Find the area two different ways.',
    solution: ['Area using the legs: ½ × 3 × 4 = 6.', 'Area using the hypotenuse as the base: ½ × 5 × h.', 'So ½ × 5 × h = 6, which gives h = 12/5.'],
  },

  // ---------- Two equations, two unknowns (lesson practice) ----------
  {
    id: 'sys-01', topic: 'algebra', set: 'systems',
    prompt: 'Two numbers add up to 20, and their difference is 6. What is the larger number?',
    answer: '13',
    hint: 'x + y = 20 and x − y = 6. Try adding the two equations.',
    solution: ['Let the numbers be x (larger) and y: x + y = 20 and x − y = 6.', 'Add the equations: the y’s cancel, so 2x = 26.', 'x = 13 (and y = 7).'],
  },
  {
    id: 'sys-02', topic: 'algebra', set: 'systems',
    prompt: '2 apples and 1 banana cost 80 cents. 1 apple and 1 banana cost 50 cents. How many cents does one apple cost?',
    answer: '30',
    hint: 'What’s the difference between the two shopping bags?',
    solution: ['2a + b = 80 and a + b = 50.', 'Subtract the second from the first: the banana cancels, leaving a = 30.', 'One apple costs 30 cents (and a banana costs 20).'],
  },
  {
    id: 'sys-03', topic: 'algebra', set: 'systems',
    prompt: 'x + y = 9 and y = 2x. What is x?',
    answer: '3',
    hint: 'Swap y for 2x in the first equation.',
    solution: ['Substitute y = 2x into x + y = 9: x + 2x = 9.', '3x = 9, so x = 3 (and y = 6).'],
  },
  {
    id: 'sys-04', topic: 'algebra', set: 'systems',
    prompt: '3x + 2y = 16 and x + 2y = 8. What is x + y?',
    answer: '6',
    hint: 'Both equations have 2y. Subtract to get rid of it.',
    solution: ['Subtract the second equation from the first: 2x = 8, so x = 4.', 'Put x = 4 into x + 2y = 8: 2y = 4, so y = 2.', 'x + y = 4 + 2 = 6.'],
  },
  {
    id: 'sys-05', topic: 'algebra', set: 'systems',
    prompt: 'A farm has only chickens and cows. Together they have 12 heads and 32 legs. How many cows are there?',
    answer: '4',
    hint: 'Chickens have 2 legs, cows have 4.',
    solution: ['Let h = chickens, c = cows: h + c = 12 and 2h + 4c = 32.', 'Double the first equation: 2h + 2c = 24.', 'Subtract it from the legs equation: 2c = 8, so c = 4 cows (and 8 chickens).'],
  },
  {
    id: 'sys-06', topic: 'algebra', set: 'systems',
    prompt: 'Adult tickets cost $5 and child tickets cost $3. A family bought 10 tickets for $38 in total. How many adult tickets did they buy?',
    answer: '4',
    hint: 'a + k = 10 and 5a + 3k = 38.',
    solution: ['a + k = 10 and 5a + 3k = 38.', 'Multiply the first by 3: 3a + 3k = 30.', 'Subtract: 2a = 8, so a = 4 adult tickets (and 6 child tickets).'],
  },
  {
    id: 'sys-07', topic: 'algebra', set: 'systems',
    prompt: '2x + 3y = 13 and 4x − y = 5. What is x × y?',
    answer: '6',
    hint: 'Solve the second equation for y.',
    solution: ['From 4x − y = 5, we get y = 4x − 5.', 'Substitute: 2x + 3(4x − 5) = 13, so 14x − 15 = 13 and x = 2.', 'y = 4(2) − 5 = 3, so x × y = 6.'],
  },
  {
    id: 'sys-08', topic: 'algebra', set: 'systems',
    prompt: '2 pencils and 3 erasers cost 95 cents. 3 pencils and 2 erasers cost 105 cents. How many cents do 1 pencil and 1 eraser cost together?',
    answer: '40',
    hint: 'You don’t need each price — try adding the equations.',
    solution: ['2p + 3e = 95 and 3p + 2e = 105.', 'Add them: 5p + 5e = 200.', 'Divide by 5: p + e = 40 cents.'],
  },
];

export function problemsByTopic(topic, set = 'drill') {
  return PROBLEMS.filter((p) => p.topic === topic && p.set === set);
}

export function problemsBySet(set) {
  return PROBLEMS.filter((p) => p.set === set);
}

export function getProblem(id) {
  return PROBLEMS.find((p) => p.id === id) ?? null;
}

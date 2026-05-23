import {
  Note,
  Folder,
  FlashcardDeck,
  Quiz,
  Assignment,
  Exam,
  CalendarEvent,
  Subject,
} from "./types";

const now = new Date();
const addDays = (n: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() + n);
  return d.toISOString();
};
const subDays = (n: number) => addDays(-n);

export const SUBJECTS: Subject[] = [
  "Math",
  "Physics",
  "Chemistry",
  "CS",
  "History",
  "Biology",
  "English",
  "Economics",
];

export const TAGS = [
  "exam",
  "lecture",
  "homework",
  "research",
  "review",
  "important",
  "draft",
  "concepts",
  "formulas",
  "definitions",
  "summary",
  "practice",
  "lab",
  "project",
  "reading",
];

export const DUMMY_FOLDERS: Folder[] = [
  { id: "f1", name: "Semester 1", parentId: null, color: "#a78bfa" },
  { id: "f2", name: "Semester 2", parentId: null, color: "#60a5fa" },
  { id: "f3", name: "Math 201", parentId: "f1", color: "#a78bfa" },
  { id: "f4", name: "Physics Lab", parentId: "f1", color: "#34d399" },
  { id: "f5", name: "CS Algorithms", parentId: "f2", color: "#fb923c" },
  { id: "f6", name: "Personal", parentId: null, color: "#f472b6" },
];

export const DUMMY_NOTES: Note[] = [
  {
    id: "n1",
    title: "Derivatives: Chain Rule Deep Dive",
    content: `# Chain Rule

The chain rule is used to differentiate composite functions.

## Statement
If f and g are differentiable, then:
$$ (f \\circ g)'(x) = f'(g(x)) \\cdot g'(x) $$

## Examples
- d/dx [sin(3x)] = cos(3x) · 3
- d/dx [(x² + 1)⁵] = 5(x² + 1)⁴ · 2x

## Common mistakes
1. Forgetting to multiply by the inner derivative
2. Confusing chain rule with product rule

> Practice: 20 problems from textbook chapter 3.7`,
    subject: "Math",
    folderId: "f3",
    tags: ["concepts", "formulas", "important"],
    pinned: true,
    archived: false,
    trashed: false,
    coverColor: "#a78bfa",
    createdAt: subDays(12),
    updatedAt: subDays(1),
  },
  {
    id: "n2",
    title: "Newton's Laws of Motion",
    content: `# Newton's Three Laws

## First Law (Inertia)
An object in motion stays in motion; an object at rest stays at rest, unless acted upon by an external force.

## Second Law
**F = ma**
Force equals mass times acceleration.

## Third Law
For every action there is an equal and opposite reaction.

### Applications
- Rockets propulsion
- Walking (friction)
- Car braking systems`,
    subject: "Physics",
    folderId: "f4",
    tags: ["concepts", "exam"],
    pinned: true,
    archived: false,
    trashed: false,
    coverColor: "#60a5fa",
    createdAt: subDays(20),
    updatedAt: subDays(3),
  },
  {
    id: "n3",
    title: "Organic Chemistry: Alkenes",
    content: `# Alkenes

Hydrocarbons with at least one C=C double bond.

## Properties
- General formula: CnH2n
- Less stable than alkanes due to π-bond
- Undergo addition reactions

## Key Reactions
1. Hydrogenation (H2/Pd)
2. Halogenation (Br2)
3. Hydration (H2O/H+)
4. Markovnikov's rule for HX addition`,
    subject: "Chemistry",
    folderId: null,
    tags: ["lecture", "concepts"],
    pinned: false,
    archived: false,
    trashed: false,
    coverColor: "#34d399",
    createdAt: subDays(7),
    updatedAt: subDays(2),
  },
  {
    id: "n4",
    title: "Binary Search Trees",
    content: `# Binary Search Trees (BST)

A tree data structure where each node has at most 2 children and:
- Left subtree contains nodes with keys < node
- Right subtree contains nodes with keys > node

## Operations Complexity
| Operation | Average | Worst |
|-----------|---------|-------|
| Search | O(log n) | O(n) |
| Insert | O(log n) | O(n) |
| Delete | O(log n) | O(n) |

## Self-balancing variants
- AVL trees
- Red-Black trees
- Splay trees`,
    subject: "CS",
    folderId: "f5",
    tags: ["concepts", "important"],
    pinned: false,
    archived: false,
    trashed: false,
    coverColor: "#fb923c",
    createdAt: subDays(5),
    updatedAt: subDays(1),
  },
  {
    id: "n5",
    title: "World War II: Pacific Theater",
    content: `# WWII Pacific Theater (1941-1945)

## Key Events
- Pearl Harbor: Dec 7, 1941
- Battle of Midway: June 1942 (turning point)
- Iwo Jima: Feb-Mar 1945
- Atomic bombs: Aug 6, 9 1945
- Japan surrender: Sep 2, 1945

## Strategy
Island-hopping campaign by Allied forces to bypass heavily fortified Japanese positions.`,
    subject: "History",
    folderId: null,
    tags: ["exam", "summary"],
    pinned: false,
    archived: false,
    trashed: false,
    coverColor: "#fbbf24",
    createdAt: subDays(15),
    updatedAt: subDays(4),
  },
  {
    id: "n6",
    title: "Cell Division: Mitosis vs Meiosis",
    content: `# Mitosis vs Meiosis

## Mitosis
- One division → 2 identical diploid cells
- Used for growth and repair
- Phases: PMAT (Prophase, Metaphase, Anaphase, Telophase)

## Meiosis
- Two divisions → 4 unique haploid cells
- Used for gamete production
- Introduces genetic variation (crossing over)`,
    subject: "Biology",
    folderId: null,
    tags: ["concepts", "exam"],
    pinned: false,
    archived: false,
    trashed: false,
    coverColor: "#a3e635",
    createdAt: subDays(10),
    updatedAt: subDays(2),
  },
  {
    id: "n7",
    title: "Essay: Themes in The Great Gatsby",
    content: `# The Great Gatsby — Themes

## The American Dream
Gatsby's pursuit of Daisy mirrors the corruption of the American Dream — wealth without meaning.

## Class & Social Stratification
East Egg vs West Egg vs Valley of Ashes.

## Memory & The Past
"Can't repeat the past?... why of course you can!"`,
    subject: "English",
    folderId: "f6",
    tags: ["draft", "homework"],
    pinned: false,
    archived: false,
    trashed: false,
    coverColor: "#f472b6",
    createdAt: subDays(8),
    updatedAt: subDays(6),
  },
  {
    id: "n8",
    title: "Supply and Demand Fundamentals",
    content: `# Supply & Demand

## Law of Demand
As price increases, quantity demanded decreases (ceteris paribus).

## Law of Supply
As price increases, quantity supplied increases.

## Equilibrium
The price where supply meets demand. Shifts caused by:
- Income changes
- Substitutes / complements
- Expectations
- Number of buyers/sellers`,
    subject: "Economics",
    folderId: null,
    tags: ["concepts", "review"],
    pinned: false,
    archived: false,
    trashed: false,
    coverColor: "#818cf8",
    createdAt: subDays(14),
    updatedAt: subDays(5),
  },
  {
    id: "n9",
    title: "Integration by Parts",
    content: `# Integration by Parts

$$ \\int u \\, dv = uv - \\int v \\, du $$

## LIATE Rule (choose u in this order)
- L: Logarithmic
- I: Inverse trig
- A: Algebraic
- T: Trig
- E: Exponential

## Example
∫ x·eˣ dx = x·eˣ - ∫ eˣ dx = x·eˣ - eˣ + C`,
    subject: "Math",
    folderId: "f3",
    tags: ["formulas", "practice"],
    pinned: false,
    archived: false,
    trashed: false,
    coverColor: "#a78bfa",
    createdAt: subDays(4),
    updatedAt: subDays(1),
  },
  {
    id: "n10",
    title: "Big-O Cheat Sheet",
    content: `# Big-O Notation

| Notation | Name |
|----------|------|
| O(1) | Constant |
| O(log n) | Logarithmic |
| O(n) | Linear |
| O(n log n) | Linearithmic |
| O(n²) | Quadratic |
| O(2ⁿ) | Exponential |
| O(n!) | Factorial |

## Common
- Array access: O(1)
- Binary search: O(log n)
- Linear search: O(n)
- Merge sort: O(n log n)
- Bubble sort: O(n²)`,
    subject: "CS",
    folderId: "f5",
    tags: ["important", "summary", "formulas"],
    pinned: true,
    archived: false,
    trashed: false,
    coverColor: "#fb923c",
    createdAt: subDays(3),
    updatedAt: subDays(0),
  },
  {
    id: "n11",
    title: "Photosynthesis Equation",
    content: `# Photosynthesis

$$ 6CO_2 + 6H_2O \\xrightarrow{\\text{light}} C_6H_{12}O_6 + 6O_2 $$

## Two Stages
1. **Light-dependent reactions** (thylakoid membrane)
2. **Calvin cycle** (stroma)

## Key Pigment
Chlorophyll absorbs red and blue light, reflects green.`,
    subject: "Biology",
    folderId: null,
    tags: ["formulas", "concepts"],
    pinned: false,
    archived: false,
    trashed: false,
    coverColor: "#a3e635",
    createdAt: subDays(6),
    updatedAt: subDays(2),
  },
  {
    id: "n12",
    title: "Thermodynamics Laws",
    content: `# Laws of Thermodynamics

## Zeroth Law
If A is in thermal equilibrium with B, and B with C, then A is in equilibrium with C.

## First Law
Energy cannot be created or destroyed (ΔU = Q - W).

## Second Law
Entropy of an isolated system always increases.

## Third Law
As temperature approaches 0 K, entropy approaches a constant minimum.`,
    subject: "Physics",
    folderId: "f4",
    tags: ["concepts", "exam", "important"],
    pinned: false,
    archived: false,
    trashed: false,
    coverColor: "#60a5fa",
    createdAt: subDays(9),
    updatedAt: subDays(2),
  },
];

const makeDeck = (
  id: string,
  name: string,
  subject: Subject,
  gradient: string,
  cards: Array<{ q: string; a: string; mastery: number }>
): FlashcardDeck => ({
  id,
  name,
  subject,
  description: `${cards.length} cards • ${subject}`,
  gradient,
  cards: cards.map((c, i) => ({
    id: `${id}-c${i}`,
    front: c.q,
    back: c.a,
    mastery: c.mastery,
    dueAt: addDays(Math.floor(Math.random() * 5)),
    easeFactor: 2.5,
    interval: 1,
  })),
  createdAt: subDays(20),
});

export const DUMMY_DECKS: FlashcardDeck[] = [
  makeDeck("d1", "Calculus Essentials", "Math", "from-purple-500 to-pink-500", [
    { q: "Derivative of sin(x)", a: "cos(x)", mastery: 90 },
    { q: "Derivative of e^x", a: "e^x", mastery: 100 },
    { q: "Derivative of ln(x)", a: "1/x", mastery: 80 },
    { q: "∫ 1/x dx", a: "ln|x| + C", mastery: 70 },
    { q: "Chain rule formula", a: "f'(g(x)) · g'(x)", mastery: 60 },
    { q: "Product rule", a: "(fg)' = f'g + fg'", mastery: 65 },
    { q: "Quotient rule", a: "(f/g)' = (f'g - fg')/g²", mastery: 55 },
    { q: "Definition of derivative", a: "lim (f(x+h)-f(x))/h as h→0", mastery: 75 },
    { q: "Fundamental theorem of calc", a: "∫ₐᵇ f'(x)dx = f(b)-f(a)", mastery: 50 },
    { q: "Integration by parts", a: "∫u dv = uv - ∫v du", mastery: 45 },
  ]),
  makeDeck("d2", "Physics Constants", "Physics", "from-blue-500 to-cyan-500", [
    { q: "Speed of light (c)", a: "≈ 3 × 10⁸ m/s", mastery: 100 },
    { q: "Gravitational constant G", a: "6.674 × 10⁻¹¹ N·m²/kg²", mastery: 70 },
    { q: "Planck's constant h", a: "6.626 × 10⁻³⁴ J·s", mastery: 60 },
    { q: "Avogadro's number", a: "6.022 × 10²³", mastery: 90 },
    { q: "Boltzmann constant k", a: "1.381 × 10⁻²³ J/K", mastery: 40 },
    { q: "Elementary charge e", a: "1.602 × 10⁻¹⁹ C", mastery: 80 },
    { q: "Mass of electron", a: "9.109 × 10⁻³¹ kg", mastery: 50 },
    { q: "Mass of proton", a: "1.673 × 10⁻²⁷ kg", mastery: 50 },
  ]),
  makeDeck("d3", "Periodic Table — First 20", "Chemistry", "from-emerald-500 to-teal-500", [
    { q: "Element #1", a: "Hydrogen (H)", mastery: 100 },
    { q: "Element #6", a: "Carbon (C)", mastery: 100 },
    { q: "Element #7", a: "Nitrogen (N)", mastery: 95 },
    { q: "Element #8", a: "Oxygen (O)", mastery: 100 },
    { q: "Element #11", a: "Sodium (Na)", mastery: 80 },
    { q: "Element #12", a: "Magnesium (Mg)", mastery: 70 },
    { q: "Element #14", a: "Silicon (Si)", mastery: 60 },
    { q: "Element #17", a: "Chlorine (Cl)", mastery: 75 },
    { q: "Element #18", a: "Argon (Ar)", mastery: 65 },
    { q: "Element #20", a: "Calcium (Ca)", mastery: 70 },
  ]),
  makeDeck("d4", "Data Structures", "CS", "from-orange-500 to-red-500", [
    { q: "Stack — LIFO or FIFO?", a: "LIFO (last in, first out)", mastery: 100 },
    { q: "Queue — LIFO or FIFO?", a: "FIFO (first in, first out)", mastery: 100 },
    { q: "Hash map lookup avg complexity", a: "O(1)", mastery: 90 },
    { q: "Balanced BST search complexity", a: "O(log n)", mastery: 80 },
    { q: "Linked list insertion at head", a: "O(1)", mastery: 85 },
    { q: "Heap insert complexity", a: "O(log n)", mastery: 60 },
    { q: "Graph BFS complexity", a: "O(V + E)", mastery: 65 },
    { q: "Trie used for?", a: "Prefix matching, autocomplete", mastery: 50 },
    { q: "When to use a linked list?", a: "Frequent insertions/deletions in middle", mastery: 70 },
    { q: "Difference: Array vs ArrayList", a: "Fixed vs dynamic resizing", mastery: 75 },
  ]),
  makeDeck("d5", "Biology Vocab", "Biology", "from-lime-500 to-green-500", [
    { q: "Mitochondria function?", a: "Powerhouse of the cell — produces ATP", mastery: 100 },
    { q: "DNA stands for?", a: "Deoxyribonucleic acid", mastery: 95 },
    { q: "What is a ribosome?", a: "Site of protein synthesis", mastery: 80 },
    { q: "Define osmosis", a: "Movement of water across a membrane", mastery: 90 },
    { q: "Photosynthesis equation", a: "6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂", mastery: 75 },
    { q: "Define homeostasis", a: "Maintenance of stable internal conditions", mastery: 70 },
  ]),
];

export const DUMMY_QUIZZES: Quiz[] = [
  {
    id: "q1",
    title: "Calculus I Midterm Prep",
    subject: "Math",
    description: "Limits, derivatives, and the chain rule",
    timePerQuestion: 60,
    attempts: 3,
    bestScore: 85,
    createdAt: subDays(10),
    questions: [
      {
        id: "q1-1",
        question: "What is the derivative of f(x) = x³?",
        options: ["3x²", "x²", "3x", "x⁴/4"],
        correctIndex: 0,
        explanation: "Power rule: d/dx[xⁿ] = n·xⁿ⁻¹",
      },
      {
        id: "q1-2",
        question: "limₓ→0 (sin x / x) = ?",
        options: ["0", "1", "∞", "undefined"],
        correctIndex: 1,
      },
      {
        id: "q1-3",
        question: "Derivative of e^(2x)?",
        options: ["e^(2x)", "2e^(2x)", "e^x", "2x·e^(2x)"],
        correctIndex: 1,
      },
      {
        id: "q1-4",
        question: "Which is NOT a continuous function?",
        options: ["sin(x)", "1/x", "x²", "eˣ"],
        correctIndex: 1,
      },
      {
        id: "q1-5",
        question: "∫ 2x dx = ?",
        options: ["x² + C", "2x² + C", "x²/2 + C", "2 + C"],
        correctIndex: 0,
      },
    ],
  },
  {
    id: "q2",
    title: "Newtonian Mechanics",
    subject: "Physics",
    description: "Forces, motion, and energy",
    timePerQuestion: 45,
    attempts: 1,
    bestScore: 72,
    createdAt: subDays(8),
    questions: [
      {
        id: "q2-1",
        question: "F = ma is which of Newton's laws?",
        options: ["First", "Second", "Third", "None"],
        correctIndex: 1,
      },
      {
        id: "q2-2",
        question: "Unit of force?",
        options: ["Joule", "Watt", "Newton", "Pascal"],
        correctIndex: 2,
      },
      {
        id: "q2-3",
        question: "Acceleration due to gravity on Earth?",
        options: ["9.8 m/s²", "10 m/s", "9.8 m/s", "11 m/s²"],
        correctIndex: 0,
      },
      {
        id: "q2-4",
        question: "Kinetic energy formula?",
        options: ["mgh", "½mv²", "mv", "Fd"],
        correctIndex: 1,
      },
    ],
  },
  {
    id: "q3",
    title: "Organic Chem Basics",
    subject: "Chemistry",
    description: "Functional groups & nomenclature",
    timePerQuestion: 45,
    attempts: 0,
    createdAt: subDays(5),
    questions: [
      {
        id: "q3-1",
        question: "Which is an alkene?",
        options: ["CH₄", "C₂H₆", "C₂H₄", "C₂H₂"],
        correctIndex: 2,
      },
      {
        id: "q3-2",
        question: "-OH functional group is called?",
        options: ["Aldehyde", "Hydroxyl", "Carboxyl", "Amine"],
        correctIndex: 1,
      },
      {
        id: "q3-3",
        question: "Benzene ring has how many carbons?",
        options: ["4", "5", "6", "7"],
        correctIndex: 2,
      },
    ],
  },
  {
    id: "q4",
    title: "Algorithms Bootcamp",
    subject: "CS",
    description: "Sorting, searching, complexity",
    timePerQuestion: 45,
    attempts: 2,
    bestScore: 90,
    createdAt: subDays(7),
    questions: [
      {
        id: "q4-1",
        question: "Best-case complexity of bubble sort?",
        options: ["O(1)", "O(n)", "O(n log n)", "O(n²)"],
        correctIndex: 1,
      },
      {
        id: "q4-2",
        question: "Which sorting algorithm uses divide-and-conquer?",
        options: ["Bubble sort", "Insertion sort", "Merge sort", "Selection sort"],
        correctIndex: 2,
      },
      {
        id: "q4-3",
        question: "Binary search requires?",
        options: ["Sorted array", "Hash table", "Linked list", "Tree"],
        correctIndex: 0,
      },
      {
        id: "q4-4",
        question: "Quicksort average complexity?",
        options: ["O(n)", "O(n log n)", "O(n²)", "O(log n)"],
        correctIndex: 1,
      },
    ],
  },
  {
    id: "q5",
    title: "WWII Key Dates",
    subject: "History",
    description: "Major events 1939-1945",
    timePerQuestion: 30,
    attempts: 1,
    bestScore: 60,
    createdAt: subDays(15),
    questions: [
      {
        id: "q5-1",
        question: "WWII started in?",
        options: ["1914", "1939", "1941", "1945"],
        correctIndex: 1,
      },
      {
        id: "q5-2",
        question: "D-Day took place on?",
        options: ["June 6, 1944", "Dec 7, 1941", "May 8, 1945", "Sept 1, 1939"],
        correctIndex: 0,
      },
    ],
  },
  {
    id: "q6",
    title: "Cell Biology",
    subject: "Biology",
    description: "Organelles and processes",
    timePerQuestion: 40,
    attempts: 0,
    createdAt: subDays(3),
    questions: [
      {
        id: "q6-1",
        question: "Powerhouse of the cell?",
        options: ["Nucleus", "Ribosome", "Mitochondria", "Golgi"],
        correctIndex: 2,
      },
      {
        id: "q6-2",
        question: "Site of protein synthesis?",
        options: ["Nucleus", "Mitochondria", "Ribosome", "Lysosome"],
        correctIndex: 2,
      },
      {
        id: "q6-3",
        question: "DNA is found in?",
        options: ["Cytoplasm only", "Nucleus only", "Both nucleus & mitochondria", "Cell wall"],
        correctIndex: 2,
      },
    ],
  },
  {
    id: "q7",
    title: "Gatsby Analysis",
    subject: "English",
    description: "Symbols, themes, characters",
    timePerQuestion: 60,
    attempts: 0,
    createdAt: subDays(12),
    questions: [
      {
        id: "q7-1",
        question: "Green light symbolizes?",
        options: ["Wealth", "Hope/Daisy", "Envy", "Nature"],
        correctIndex: 1,
      },
      {
        id: "q7-2",
        question: "Narrator of Gatsby?",
        options: ["Jay Gatsby", "Tom Buchanan", "Nick Carraway", "Daisy"],
        correctIndex: 2,
      },
    ],
  },
  {
    id: "q8",
    title: "Microeconomics Pop Quiz",
    subject: "Economics",
    description: "Supply, demand, elasticity",
    timePerQuestion: 45,
    attempts: 0,
    createdAt: subDays(6),
    questions: [
      {
        id: "q8-1",
        question: "When price rises, demand typically...",
        options: ["Rises", "Falls", "Stays same", "Doubles"],
        correctIndex: 1,
      },
      {
        id: "q8-2",
        question: "Equilibrium is where...",
        options: ["Supply > Demand", "Demand > Supply", "Supply = Demand", "Price = 0"],
        correctIndex: 2,
      },
    ],
  },
];

export const DUMMY_ASSIGNMENTS: Assignment[] = [
  {
    id: "a1",
    title: "Calculus Problem Set 7",
    description: "Integration techniques: u-sub, by parts, partial fractions",
    subject: "Math",
    status: "in-progress",
    priority: "high",
    dueDate: addDays(2),
    progress: 60,
    createdAt: subDays(5),
  },
  {
    id: "a2",
    title: "Physics Lab Report",
    description: "Pendulum experiment write-up",
    subject: "Physics",
    status: "todo",
    priority: "medium",
    dueDate: addDays(5),
    progress: 0,
    createdAt: subDays(3),
  },
  {
    id: "a3",
    title: "Algorithms HW: Dynamic Programming",
    description: "Solve 5 DP problems on LeetCode + write-up",
    subject: "CS",
    status: "in-progress",
    priority: "high",
    dueDate: addDays(3),
    progress: 40,
    createdAt: subDays(4),
  },
  {
    id: "a4",
    title: "Gatsby Essay Draft",
    description: "3-page essay on the corruption of the American Dream",
    subject: "English",
    status: "review",
    priority: "medium",
    dueDate: addDays(7),
    progress: 80,
    createdAt: subDays(10),
  },
  {
    id: "a5",
    title: "Chem Lab: Titration",
    description: "Acid-base titration experiment data",
    subject: "Chemistry",
    status: "done",
    priority: "low",
    dueDate: subDays(2),
    progress: 100,
    createdAt: subDays(12),
  },
  {
    id: "a6",
    title: "WWII Timeline Project",
    description: "Interactive timeline of 1939-1945 events",
    subject: "History",
    status: "todo",
    priority: "low",
    dueDate: addDays(10),
    progress: 0,
    createdAt: subDays(2),
  },
  {
    id: "a7",
    title: "Cell Biology Worksheet",
    description: "Identify organelles and their functions",
    subject: "Biology",
    status: "done",
    priority: "low",
    dueDate: subDays(1),
    progress: 100,
    createdAt: subDays(8),
  },
  {
    id: "a8",
    title: "Econ Case Study",
    description: "Analysis of 2008 financial crisis",
    subject: "Economics",
    status: "in-progress",
    priority: "medium",
    dueDate: addDays(6),
    progress: 30,
    createdAt: subDays(6),
  },
  {
    id: "a9",
    title: "Linear Algebra Practice",
    description: "Eigenvalues and eigenvectors set",
    subject: "Math",
    status: "review",
    priority: "high",
    dueDate: addDays(1),
    progress: 90,
    createdAt: subDays(7),
  },
  {
    id: "a10",
    title: "Quantum Reading: Ch 4",
    description: "Wave functions and the Schrödinger equation",
    subject: "Physics",
    status: "todo",
    priority: "medium",
    dueDate: addDays(4),
    progress: 0,
    createdAt: subDays(1),
  },
  {
    id: "a11",
    title: "Binary Trees Implementation",
    description: "Implement BST and AVL in TypeScript",
    subject: "CS",
    status: "todo",
    priority: "high",
    dueDate: addDays(8),
    progress: 10,
    createdAt: subDays(1),
  },
  {
    id: "a12",
    title: "Poetry Anthology Selection",
    description: "Choose 10 poems for the class collection",
    subject: "English",
    status: "done",
    priority: "low",
    dueDate: subDays(5),
    progress: 100,
    createdAt: subDays(20),
  },
];

export const DUMMY_EXAMS: Exam[] = [
  {
    id: "e1",
    subject: "Math",
    title: "Calculus II Midterm",
    date: addDays(5),
    topics: ["Integration", "Series", "Differential Equations"],
    prepProgress: 65,
    notes: "Bring graphing calculator",
  },
  {
    id: "e2",
    subject: "Physics",
    title: "Mechanics Final",
    date: addDays(12),
    topics: ["Newton's Laws", "Energy", "Momentum", "Rotation"],
    prepProgress: 40,
  },
  {
    id: "e3",
    subject: "CS",
    title: "Algorithms Final",
    date: addDays(18),
    topics: ["Sorting", "Graphs", "DP", "Greedy"],
    prepProgress: 50,
  },
  {
    id: "e4",
    subject: "Chemistry",
    title: "Organic Chem Quiz",
    date: addDays(3),
    topics: ["Alkenes", "Functional groups", "Nomenclature"],
    prepProgress: 75,
  },
  {
    id: "e5",
    subject: "Biology",
    title: "Cell Bio Test",
    date: addDays(8),
    topics: ["Organelles", "Cell division", "Membranes"],
    prepProgress: 30,
  },
  {
    id: "e6",
    subject: "History",
    title: "WWII Essay Exam",
    date: addDays(15),
    topics: ["Pacific Theater", "Holocaust", "Cold War origins"],
    prepProgress: 20,
  },
];

export const DUMMY_EVENTS: CalendarEvent[] = [
  ...DUMMY_EXAMS.map(
    (e): CalendarEvent => ({
      id: `ev-${e.id}`,
      title: e.title,
      type: "exam",
      date: e.date,
      subject: e.subject,
    })
  ),
  ...DUMMY_ASSIGNMENTS.filter((a) => a.status !== "done").map(
    (a): CalendarEvent => ({
      id: `ev-${a.id}`,
      title: a.title,
      type: "assignment",
      date: a.dueDate,
      subject: a.subject,
    })
  ),
  { id: "ev-s1", title: "Study Math", type: "study", date: addDays(1), subject: "Math" },
  { id: "ev-s2", title: "Physics review", type: "study", date: addDays(2), subject: "Physics" },
  { id: "ev-s3", title: "Flashcards: Bio", type: "study", date: addDays(0), subject: "Biology" },
  { id: "ev-s4", title: "CS practice problems", type: "study", date: addDays(3), subject: "CS" },
];

// Last 30 days of streak (mostly green, some breaks)
export function generateStreak(): { date: string; minutes: number }[] {
  const out: { date: string; minutes: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const skipDay = i === 11 || i === 17;
    out.push({
      date: d.toISOString().slice(0, 10),
      minutes: skipDay ? 0 : 25 + Math.floor(Math.random() * 90),
    });
  }
  return out;
}

export const DEFAULT_USER = {
  name: "Gaurav",
  email: "gaurav@vyronotes.app",
  avatar: undefined,
};

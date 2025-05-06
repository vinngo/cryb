// Mock data for the prototype

// Users
export const mockUsers = [
  {
    id: "user1",
    name: "Alex Johnson",
    email: "alex@example.com",
    avatarUrl: "/abstract-letter-aj.png",
    house: {
      id: "house1",
      name: "The Pad",
      inviteCode: "THEPAD123",
    },
  },
  {
    id: "user2",
    name: "Taylor Smith",
    email: "taylor@example.com",
    avatarUrl: "/abstract-geometric-ts.png",
    house: {
      id: "house1",
      name: "The Pad",
      inviteCode: "THEPAD123",
    },
  },
  {
    id: "user3",
    name: "Jordan Lee",
    email: "jordan@example.com",
    avatarUrl: "/stylized-jl-logo.png",
    house: {
      id: "house1",
      name: "The Pad",
      inviteCode: "THEPAD123",
    },
  },
  {
    id: "user4",
    name: "Morgan Chen",
    email: "morgan@example.com",
    avatarUrl: "/microphone-concert-stage.png",
    house: {
      id: "house1",
      name: "The Pad",
      inviteCode: "THEPAD123",
    },
  },
];

// Chores
export const mockChores = [
  {
    id: "chore1",
    title: "Clean kitchen",
    assignedTo: "user1",
    houseId: "house1",
    dueDate: "2025-05-07",
    frequency: "weekly",
    completed: false,
  },
  {
    id: "chore2",
    title: "Take out trash",
    assignedTo: "user2",
    houseId: "house1",
    dueDate: "2025-05-05",
    frequency: "weekly",
    completed: false,
  },
  {
    id: "chore3",
    title: "Clean bathroom",
    assignedTo: "user3",
    houseId: "house1",
    dueDate: "2025-05-10",
    frequency: "weekly",
    completed: false,
  },
  {
    id: "chore4",
    title: "Vacuum living room",
    assignedTo: "user4",
    houseId: "house1",
    dueDate: "2025-05-08",
    frequency: "weekly",
    completed: false,
  },
  {
    id: "chore5",
    title: "Buy toilet paper",
    assignedTo: "user1",
    houseId: "house1",
    dueDate: "2025-05-03",
    frequency: "once",
    completed: true,
  },
  {
    id: "chore6",
    title: "Water plants",
    assignedTo: "user2",
    houseId: "house1",
    dueDate: "2025-05-04",
    frequency: "weekly",
    completed: true,
  },
];

// Expenses
export const mockExpenses = [
  {
    id: "expense1",
    title: "Groceries",
    amount: 87.45,
    paidBy: "user1",
    sharedWith: ["user2", "user3", "user4"],
    houseId: "house1",
    date: "2025-05-01",
  },
  {
    id: "expense2",
    title: "Internet bill",
    amount: 65.0,
    paidBy: "user2",
    sharedWith: ["user1", "user3", "user4"],
    houseId: "house1",
    date: "2025-05-02",
  },
  {
    id: "expense3",
    title: "Cleaning supplies",
    amount: 32.5,
    paidBy: "user3",
    sharedWith: ["user1", "user2", "user4"],
    houseId: "house1",
    date: "2025-05-03",
  },
  {
    id: "expense4",
    title: "Electricity bill",
    amount: 120.75,
    paidBy: "user4",
    sharedWith: ["user1", "user2", "user3"],
    houseId: "house1",
    date: "2025-04-28",
  },
  {
    id: "expense5",
    title: "Pizza night",
    amount: 45.0,
    paidBy: "user1",
    sharedWith: ["user2", "user3"],
    houseId: "house1",
    date: "2025-04-25",
  },
];

// Notes
export const mockNotes = [
  {
    id: "note1",
    title: "House Meeting",
    content:
      "We're having a house meeting this Sunday at 7pm to discuss summer plans and the lease renewal. Please make sure you're available!",
    createdBy: "user1",
    houseId: "house1",
    isPinned: true,
    createdAt: "2025-05-01",
  },
  {
    id: "note2",
    title: "Maintenance Visit",
    content:
      "The landlord will be sending someone to fix the dishwasher on Tuesday between 10am-2pm. Someone needs to be home.",
    createdBy: "user2",
    houseId: "house1",
    isPinned: true,
    createdAt: "2025-05-02",
  },
  {
    id: "note3",
    title: "WiFi Password",
    content:
      "The new WiFi password is: CollegeLife2025!\nNetwork name: ThePad_5G",
    createdBy: "user3",
    houseId: "house1",
    isPinned: false,
    createdAt: "2025-04-28",
  },
  {
    id: "note4",
    title: "Party Rules",
    content:
      "If you're planning to have friends over this weekend, please remember:\n- Keep noise down after 11pm\n- Clean up the common areas afterward\n- Let everyone know at least a day in advance",
    createdBy: "user4",
    houseId: "house1",
    isPinned: false,
    createdAt: "2025-04-25",
  },
  {
    id: "note5",
    title: "Missing Charger",
    content:
      "Has anyone seen my MacBook charger? I left it in the living room yesterday.",
    createdBy: "user2",
    houseId: "house1",
    isPinned: false,
    createdAt: "2025-05-03",
  },
];

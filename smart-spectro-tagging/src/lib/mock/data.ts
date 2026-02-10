import type {
  Session,
  AudioFile,
  AISuggestion,
  User,
} from "@/types";

// === Sessions (matching design image 2) ===
export const mockSessions: Session[] = [
  {
    id: "SES-2049",
    name: "Industrial_Floor_A",
    deviceType: "Industrial Sensor",
    status: "processing",
    fileCount: 45,
    progress: 80,
    score: 98.2,
    createdAt: "2023-10-24",
  },
  {
    id: "SES-2048",
    name: "Turbine_Test_Batch_4",
    deviceType: "Turbine Sensor",
    status: "completed",
    fileCount: 120,
    progress: 100,
    score: 88.5,
    createdAt: "2023-10-23",
  },
  {
    id: "SES-2047",
    name: "Pump_Array_Main",
    deviceType: "Pump Sensor",
    status: "pending",
    fileCount: 15,
    progress: 0,
    score: null,
    createdAt: "2023-10-22",
  },
  {
    id: "SES-2046",
    name: "Sector_7_Analysis",
    deviceType: "Multi-Sensor",
    status: "completed",
    fileCount: 88,
    progress: 100,
    score: 45.2,
    createdAt: "2023-10-21",
  },
  {
    id: "SES-2045",
    name: "Generator_B_Night",
    deviceType: "Generator Sensor",
    status: "processing",
    fileCount: 210,
    progress: 45,
    score: null,
    createdAt: "2023-10-20",
  },
];

// === Audio Files (matching design image 3) ===
export const mockAudioFiles: AudioFile[] = [
  {
    id: "af-1",
    sessionId: "SES-2049",
    filename: "sensor_rec_8842.wav",
    duration: "00:12:45",
    sampleRate: "44.1kHz",
    status: "wip",
  },
  {
    id: "af-2",
    sessionId: "SES-2049",
    filename: "sensor_rec_8843.wav",
    duration: "00:08:22",
    sampleRate: "44.1kHz",
    status: "pending",
  },
  {
    id: "af-3",
    sessionId: "SES-2049",
    filename: "sensor_rec_8840.wav",
    duration: "00:15:10",
    sampleRate: "48.0kHz",
    status: "done",
  },
  {
    id: "af-4",
    sessionId: "SES-2049",
    filename: "sensor_rec_8844.wav",
    duration: "00:03:45",
    sampleRate: "44.1kHz",
    status: "pending",
  },
];

// === AI Suggestions ===
export const mockSuggestions: AISuggestion[] = [
  {
    id: "sug-1",
    audioId: "af-1",
    label: "Mechanical Grind",
    confidence: 94,
    description:
      "Detected anomalous high-frequency grinding pattern consistent with bearing wear in sector 4.",
    startTime: 192.045,
    endTime: 210.5,
    freqLow: 8000,
    freqHigh: 12000,
    status: "pending",
  },
  {
    id: "sug-2",
    audioId: "af-1",
    label: "Vibration Anomaly",
    confidence: 87,
    description:
      "Low-frequency vibration pattern detected, possibly indicating misalignment.",
    startTime: 350.0,
    endTime: 380.0,
    freqLow: 200,
    freqHigh: 800,
    status: "pending",
  },
  {
    id: "sug-3",
    audioId: "af-2",
    label: "Electrical Hum",
    confidence: 76,
    description: "60Hz harmonic interference detected in recording.",
    startTime: 0,
    endTime: 502.0,
    freqLow: 50,
    freqHigh: 70,
    status: "pending",
  },
];

// === Users / Leaderboard (matching design image 4) ===
export const mockUsers: User[] = [
  {
    id: "u-1",
    name: "Sarah Jenkins",
    email: "sarah@spectrotag.com",
    role: "acoustic_eng",
    todayScore: 1400,
    accuracy: 99.2,
    allTimeScore: 54200,
  },
  {
    id: "u-2",
    name: "Mike T.",
    email: "mike@spectrotag.com",
    role: "data_analyst",
    todayScore: 1250,
    accuracy: 98.8,
    allTimeScore: 48100,
  },
  {
    id: "u-3",
    name: "Alex Ross",
    email: "alex@spectrotag.com",
    role: "lead_analyst",
    todayScore: 1250,
    accuracy: 98.5,
    allTimeScore: 32400,
  },
  {
    id: "u-4",
    name: "John Doe",
    email: "john@spectrotag.com",
    role: "junior_tagger",
    todayScore: 980,
    accuracy: 94.2,
    allTimeScore: 12200,
  },
  {
    id: "u-5",
    name: "Emily R.",
    email: "emily@spectrotag.com",
    role: "contractor",
    todayScore: 850,
    accuracy: 96.1,
    allTimeScore: 8540,
  },
];

export const currentUser = mockUsers[2]; // Alex Ross

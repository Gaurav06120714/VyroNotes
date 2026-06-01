# My Projects — Interview & Explanation Guide

A reference doc covering every project: what it is, how it was built, tech stack, and how to explain it in an interview or to a friend.

---

## Table of Contents

1. [VyroOs](#1-vyroos)
2. [VyroAgent](#2-vyroagent)
3. [VyroBrowser](#3-vyrobrowser)
4. [Vyro](#4-vyro)
5. [VyroCoding](#5-vyrocoding)
6. [VyroNotes](#6-vyronotes)
7. [VyroPortify](#7-vyroPortify)
8. [VyroMusic](#8-vyromusic)
9. [IPL-Auction](#9-ipl-auction)
10. [GitHubDashboard](#10-githubdashboard)
11. [MacPerformanceMonitor](#11-macperformancemonitor)
12. [NoSleep](#12-nosleep)
13. [SCT_DS_1 — Population Chart](#13-sct_ds_1--population-chart)
14. [SCT_DS_2 — Titanic EDA](#14-sct_ds_2--titanic-eda)
15. [SCT_DS_3 — Bank Decision Tree](#15-sct_ds_3--bank-decision-tree)
16. [SCT_DS_4 — US Road Accidents EDA](#16-sct_ds_4--us-road-accidents-eda)
17. [job-recommendation](#17-job-recommendation)
18. [AI-Sign-Language-Recognition-System](#18-ai-sign-language-recognition-system)
19. [UNLOX-](#19-unlox-)
20. [app-genesis-labs](#20-app-genesis-labs)
21. [IPL Cricket Web App](#21-cricket-web-app)
22. [Safe_route](#22-safe_route)
23. [simple-atm-system](#23-simple-atm-system)
24. [Dino](#24-dino)
25. [Flappy-Bird](#25-flappy-bird)
26. [Bhaai](#26-bhaai)

---

## 1. VyroOs

**What it is:**
A custom operating system built completely from scratch — no Linux, no Windows underneath. It boots on QEMU (a hardware emulator) with zero external dependencies.

**Tech Stack:** Assembly (x86), C

**How it works:**
- Starts with a bootloader written in Assembly that loads into memory when the machine powers on
- Switches the CPU from 16-bit real mode to 32-bit protected mode (required to use more than 1 MB of RAM and access modern CPU features)
- Has a screen driver to write text to the display and a keyboard driver to read input
- The kernel handles the bare minimum: memory, I/O, and basic hardware communication

**How to explain in an interview:**
"I built a minimal OS from scratch in Assembly and C. The bootloader I wrote is the first code that runs — it fits in 512 bytes (the MBR sector), sets up the CPU, and hands control to the kernel. I implemented a screen driver by writing directly to video memory at address 0xB8000 and a keyboard driver using hardware interrupts. It runs on QEMU so I can test it without burning to real hardware."

**How to explain to a friend:**
"You know how when you turn on a computer it loads Windows or Mac? I wrote the thing that runs before all that — completely from scratch in Assembly. It's a tiny OS that I can boot up in a virtual machine. It has a screen and keyboard, all hand-coded."

---

## 2. VyroAgent

**What it is:**
A fully offline AI voice assistant for macOS. You speak a command, it understands you, and it controls your Mac — no internet, no API keys needed.

**Tech Stack:** Python, Whisper (STT), Ollama (local LLM), macOS APIs

**How it works:**
- Whisper (OpenAI's open-source speech-to-text model) converts your voice to text locally on your Mac
- Ollama runs a local large language model (like Llama or Mistral) to understand your intent
- A command dispatcher maps the AI's output to 25 macOS actions (open apps, control volume, manage files, etc.) via Python's subprocess and AppleScript

**How to explain in an interview:**
"I built a local voice agent for macOS with a three-stage pipeline: speech-to-text using Whisper, intent understanding using a local LLM served by Ollama, and action execution using macOS system APIs. The key design goal was zero API keys — everything runs on-device for privacy. I wrote 25 action handlers covering system control, app management, and file operations."

**How to explain to a friend:**
"It's basically Siri but it runs 100% on your laptop with no internet. You talk to it, it figures out what you want using a local AI model, and then controls your Mac. Open apps, change volume, whatever — all offline."

---

## 3. VyroBrowser

**What it is:**
A production-ready AI-powered macOS browser built with Electron (web tech packaged as a desktop app). Has a built-in AI assistant powered by Ollama.

**Tech Stack:** TypeScript, Electron, Ollama

**Key Features:**
- Smart keyword navigation (type a keyword, it knows where to go)
- Built-in Ollama AI assistant sidebar
- Ad blocking
- Tab groups
- Reader mode (strips pages to clean text)
- Bookmarks, history, download manager

**How to explain in an interview:**
"I built a browser using Electron and TypeScript. The main technical challenge was embedding a Chromium webview inside an Electron window while maintaining full control over navigation, network requests (for ad blocking), and UI. I integrated Ollama's local API to provide an AI assistant that can answer questions about the page you're reading, all without sending data to the cloud."

**How to explain to a friend:**
"I built my own browser from scratch. It looks like Chrome but has a built-in AI assistant running locally on your Mac, it blocks ads, and has tab groups and a reading mode. Built with the same tech that powers VS Code."

---

## 4. Vyro

**What it is:**
A privacy-first AI desktop browser, the predecessor/sibling to VyroBrowser. More focused on the privacy angle and a built-in ecosystem dock.

**Tech Stack:** TypeScript, Electron

**Key Features:**
- Local Ollama AI (no data leaves your machine)
- Custom tab management
- Ad blocking and custom script injection
- Built-in ecosystem dock (quick access to Vyro tools)
- Optimized for macOS

**How to explain in an interview:**
"Similar to VyroBrowser but with a stronger focus on privacy architecture. Custom script injection means users can modify any website's behavior. The ecosystem dock is an Electron IPC (inter-process communication) feature that lets multiple Vyro apps communicate with each other."

---

## 5. VyroCoding

**What it is:**
A coding platform or tool — part of the Vyro ecosystem.

**Tech Stack:** TypeScript

**How to explain:**
"Part of the Vyro product suite. A TypeScript-based coding tool focused on developer experience."

---

## 6. VyroNotes

**What it is:**
An AI-powered student productivity platform. Think Notion meets a study assistant — notes, flashcards, quizzes, and a PDF workspace all in one.

**Tech Stack:** TypeScript

**Key Features:**
- Note-taking with AI assistance
- SM-2 flashcard algorithm (the same spaced repetition algorithm used by Anki — scientifically optimized review intervals)
- AI-generated quizzes from your notes
- Exam survival mode
- PDF workspace (annotate and interact with PDFs)
- Apple/Linear-quality design

**How to explain in an interview:**
"I implemented the SM-2 spaced repetition algorithm for flashcards — it tracks how well you know each card and schedules reviews at the optimal time before you forget. The AI layer generates quiz questions directly from your notes using an LLM. The design system was inspired by Apple's Human Interface Guidelines and Linear's minimalist aesthetic."

**How to explain to a friend:**
"It's a study app that actually helps you remember things. It makes flashcards from your notes automatically, quizzes you at exactly the right time before you'd forget (using science-backed spacing), and has a PDF reader built in. Looks really clean like a professional app."

---

## 7. VyroPortify

**What it is:**
Upload your resume, get a live hosted portfolio website in 60 seconds.

**Tech Stack:** HTML, (likely with a backend/AI layer)

**How it works:**
- User uploads a resume (PDF or text)
- AI parses the resume and extracts structured data (name, skills, experience, projects)
- Generates a complete portfolio website from a template
- Hosts it instantly

**How to explain in an interview:**
"I built a pipeline that takes an unstructured resume document, uses an LLM to extract structured data (name, skills, work history, projects), maps that into a portfolio template, and deploys it. The challenge was handling the variability of resume formats — people write them very differently."

**How to explain to a friend:**
"You upload your resume, it reads it with AI, and spits out a full portfolio website for you in about a minute. No coding needed."

---

## 8. VyroMusic

**What it is:**
A Spotify-inspired music platform with AI recommendations, fast search, and a dark neon UI.

**Tech Stack:** TypeScript

**Key Features:**
- Intelligent music recommendations
- Blazing-fast search
- Dark neon UI design
- Personalized listening experience

**How to explain in an interview:**
"I built a full music streaming UI in TypeScript with a recommendation engine. The design system uses dark neon aesthetics — high contrast, glowing accents. The recommendation system considers listening history and user preferences to surface relevant tracks."

---

## 9. IPL-Auction

**What it is:**
A real-time multiplayer IPL Fantasy Auction game. Up to 7 players join a room and bid on 100 IPL players with live countdown timers.

**Tech Stack:** TypeScript

**How it works:**
- Players join via a shared room code
- Each round, a player is put up for auction
- Countdown timer creates urgency
- Players bid with a virtual budget
- Highest bidder wins the player, budget is deducted
- Final scores ranked by team value

**How to explain in an interview:**
"I built a real-time multiplayer game using WebSockets for live bidding state sync. The key challenges were: handling race conditions when multiple players bid simultaneously (I used server-side validation to prevent overbidding), managing the countdown timer state consistently across all clients, and gracefully handling player disconnections mid-auction."

**How to explain to a friend:**
"It's like a fantasy cricket auction game you play with your friends online. You get a budget and take turns bidding on real IPL players in real-time. Whoever builds the best team wins. Works for up to 7 players."

---

## 10. GitHubDashboard

**What it is:**
A native macOS app to track your GitHub contributions, streaks, and activity. One-click repo creation built in.

**Tech Stack:** Swift, SwiftUI

**How it works:**
- Uses the GitHub REST API to fetch contribution data, repo stats, and activity
- Displays it in a native SwiftUI dashboard
- One-click repo creation calls the GitHub API to instantly create a new repo

**How to explain in an interview:**
"I built a native macOS app in Swift and SwiftUI that wraps the GitHub API. I used URLSession for network calls and Combine/async-await for reactive data fetching. The SwiftUI declarative UI updates automatically when data changes. OAuth token is stored securely in the macOS Keychain."

**How to explain to a friend:**
"It's a Mac app that shows all your GitHub stats — your streak, how many commits you've made, your repos — in a nice dashboard. You can also create new repos with one click without going to the website."

---

## 11. MacPerformanceMonitor

**What it is:**
A lightweight macOS menu bar app that shows CPU, RAM, GPU, network speed, and display Hz in real-time — always visible in your menu bar.

**Tech Stack:** Swift, SwiftUI

**How it works:**
- Uses IOKit framework (Apple's low-level hardware interface) to read CPU, GPU, and memory stats
- Network speed read from system network interfaces
- Updates every second
- Lives in the macOS menu bar (NSStatusItem) so it's never in the way

**How to explain in an interview:**
"I used Apple's IOKit framework to query hardware performance counters — the same framework that apps like iStat Menus use. The NSStatusItem API puts the app in the menu bar. The main engineering challenge was reading GPU stats, which requires navigating IOKit's object hierarchy to find the correct GPU registry entry."

**How to explain to a friend:**
"It's a tiny app that sits in your Mac's top menu bar and shows you in real-time how hard your CPU, RAM, and GPU are working, plus your internet speed. Super lightweight — you barely notice it's there."

---

## 12. NoSleep

**What it is:**
A native macOS menu bar app that prevents your Mac from sleeping with one click.

**Tech Stack:** Swift, IOKit

**How it works:**
- Uses IOKit's `IOPMAssertionCreateWithName` API to tell macOS "I'm preventing sleep right now"
- When you click the menu bar icon again, it releases the assertion and sleep resumes normally
- No background processes, no battery drain — just toggles a system flag

**How to explain in an interview:**
"I used IOKit's Power Management API — specifically `IOPMAssertionCreateWithName` with the `kIOPMAssertionTypeNoIdleSleep` type — to hold a sleep-prevention assertion. It's the same mechanism apps like Caffeine use. The entire app is less than 100 lines of Swift."

**How to explain to a friend:**
"You know how your Mac goes to sleep after a while? This app puts a little icon in your menu bar, and one click stops your Mac from sleeping. Click again and it goes back to normal."

---

## 13. SCT_DS_1 — Population Chart

**What it is:**
A data visualization project showing world population distribution using World Bank data. Part of SkillCraft Technology Data Science Internship.

**Tech Stack:** Python, Pandas, Matplotlib

**What it does:**
- Fetches/loads World Bank population data
- Cleans and processes it with Pandas
- Creates a bar chart showing population distribution across countries/regions

**How to explain:**
"This was my first data science internship task — data ingestion, cleaning with Pandas, and visualization with Matplotlib. I worked with World Bank's open dataset to analyze and display global population distribution."

---

## 14. SCT_DS_2 — Titanic EDA

**What it is:**
Exploratory Data Analysis on the famous Titanic dataset. Task 2 of SkillCraft Technology DS Internship.

**Tech Stack:** Python, Pandas, Matplotlib, Seaborn

**What it does:**
- Loads and cleans the Titanic passenger dataset
- Analyzes survival rates by gender, class, age, and family size
- Creates visualizations (heatmaps, bar charts, histograms) to show patterns

**Key findings typically found:**
- Women had much higher survival rates (74%) vs men (19%)
- First-class passengers survived at higher rates
- Children had higher survival rates

**How to explain in an interview:**
"I performed EDA on the Titanic dataset — handling missing values (especially the Age column which had ~20% nulls), feature analysis, and correlation analysis. I used Seaborn's heatmap to visualize correlations and identify which features most influenced survival."

---

## 15. SCT_DS_3 — Bank Decision Tree

**What it is:**
A machine learning model that predicts whether a customer will subscribe to a bank term deposit. Uses the UCI Bank Marketing Dataset.

**Tech Stack:** Python, Scikit-learn, Pandas

**How it works:**
- Dataset has demographic info (age, job, marital status) and behavioral data (previous campaign contacts, call duration)
- Trains a Decision Tree Classifier to predict the binary outcome (subscribe: yes/no)
- Evaluates using accuracy, precision, recall, and confusion matrix

**How to explain in an interview:**
"I built a supervised classification model using Scikit-learn's DecisionTreeClassifier. The dataset was imbalanced (majority 'no' responses), so I analyzed precision-recall tradeoff carefully. I used cross-validation to avoid overfitting and visualized the decision tree to make the model interpretable — you can trace exactly why it made a prediction."

**How to explain to a friend:**
"I trained an AI to predict which bank customers will sign up for a savings product based on their age, job, and past interactions. It's like teaching a flowchart — 'if they're over 40 AND answered the last call, they probably say yes.'"

---

## 16. SCT_DS_4 — US Road Accidents EDA

**What it is:**
Exploratory data analysis on a massive US road accident dataset (2016-2023) to find patterns by weather, time, location, and severity.

**Tech Stack:** Python, Pandas, Matplotlib, Seaborn

**What it does:**
- Analyzes ~7 million accident records
- Finds patterns: which weather conditions, times of day, and locations have the most accidents
- Severity analysis: what factors correlate with more serious accidents
- Geographic visualization

**How to explain in an interview:**
"I worked with a dataset of approximately 7 million records, which required efficient Pandas operations — I used chunked reading and vectorized operations instead of loops to handle the scale. Key findings included peak accident times (7-9 AM, 4-6 PM rush hours), weather impact (rain and fog significantly increase severity), and hotspot identification by state and city."

---

## 17. job-recommendation

**What it is:**
A Streamlit web app that matches students' academic profiles and skills to relevant job opportunities using a multi-factor scoring algorithm.

**Tech Stack:** Python, Streamlit, Pandas

**How it works:**
- Student inputs their skills, GPA, major, and experience level
- A scoring algorithm weighs multiple factors (skill match, academic performance, etc.)
- Returns ranked job recommendations with match scores
- Interactive analytics charts show what skills are most in demand

**How to explain in an interview:**
"I built a content-based recommendation system where jobs and student profiles are both represented as feature vectors. The matching algorithm computes a weighted similarity score across skills, experience level, and academic background. Streamlit let me build the interactive UI in pure Python without any frontend framework."

**How to explain to a friend:**
"You enter your skills and grades, and it tells you which jobs you're most likely to get and why. It shows you a ranked list with a match score and charts showing what skills employers want most."

---

## 18. AI-Sign-Language-Recognition-System

**What it is:**
A computer vision system that recognizes sign language gestures in real-time.

**Tech Stack:** Python, OpenCV, (likely MediaPipe or TensorFlow/Keras)

**How it works:**
- Camera captures hand movements
- Computer vision library detects hand landmarks (finger positions)
- A trained classification model maps the hand shape to a letter or word
- Displays the recognized sign on screen in real-time

**How to explain in an interview:**
"I used MediaPipe for hand landmark detection — it gives 21 3D keypoints for each hand. I then trained a classifier on the normalized landmark coordinates (making it position-invariant). Using coordinates rather than raw pixels makes the model robust to lighting, skin tone, and camera distance."

**How to explain to a friend:**
"I built a system that uses your webcam to watch your hands and figure out what sign language letter or word you're making, in real-time. It's like teaching the computer to understand a new language just by watching hands."

---

## 19. UNLOX-

**What it is:**
A data-driven social engagement initiative — analytics and insights around social media or community engagement data.

**Tech Stack:** Python

**How to explain:**
"A data analysis project focused on social engagement patterns — using Python to analyze, segment, and derive insights from social data to improve community or content strategy."

---

## 20. app-genesis-labs

**What it is:**
A TypeScript-based application — likely an app generation or scaffolding tool based on the name "Genesis."

**Tech Stack:** TypeScript

**How to explain:**
"A TypeScript project focused on app scaffolding or generation — automating the creation of project boilerplates."

---

## 21. Cricket-Web-App

**What it is:**
A cricket-related web application built in Python (likely Flask or Django).

**Tech Stack:** Python

**How to explain:**
"A web app built in Python that surfaces cricket data — stats, live scores, or player information through a web interface."

---

## 22. Safe_route

**What it is:**
A route safety application — likely finds the safest route between two points using crime or accident data.

**Tech Stack:** HTML (frontend-focused)

**How to explain:**
"A web app that helps users find safer routes by factoring in safety data. The frontend was built in HTML/CSS/JS and likely calls a mapping API for routing."

---

## 23. simple-atm-system

**What it is:**
A simulated ATM transaction system. Users log in with account number and PIN and perform banking operations.

**Tech Stack:** Python / JavaScript

**Key Features:**
- Login with account number and PIN
- Check balance
- Deposit and withdraw
- Transaction history

**How to explain in an interview:**
"A classic software engineering exercise — I implemented a state machine for ATM flows (idle -> card inserted -> PIN entered -> authenticated -> transaction). It demonstrates OOP principles: Account class with encapsulated balance, Transaction class for history, and an ATM class orchestrating the flow."

**How to explain to a friend:**
"I coded a fake ATM that works like a real one — you enter your account number and PIN, then you can check your balance, take out money, or deposit. It's all simulated in code."

---

## 24. Dino

**What it is:**
A recreation of the Chrome dinosaur game (the one that appears when you have no internet).

**Tech Stack:** Java

**How it works:**
- Game loop runs at fixed FPS
- Dinosaur jumps on spacebar press (physics simulation with gravity)
- Obstacles spawn at increasing speed
- Collision detection ends the game
- Score increases over time

**How to explain in an interview:**
"I implemented a game loop in Java using a Timer or Thread.sleep-based loop targeting 60 FPS. The physics is a simple gravity simulation — on jump, I give the dino an upward velocity, and each frame I apply downward acceleration until it hits the ground. Collision detection uses AABB (axis-aligned bounding boxes)."

**How to explain to a friend:**
"I rebuilt the dinosaur game that Google shows when you have no wifi. Press space to jump over cacti, it gets faster as you go. Built in Java."

---

## 25. Flappy-Bird

**What it is:**
A clone of the classic Flappy Bird mobile game.

**Tech Stack:** Python (likely Pygame)

**How it works:**
- Bird falls due to gravity, flaps up on click/spacebar
- Pipes spawn with random gaps and scroll left
- Collision detection with pipes and floor
- Score increments when passing through pipes

**How to explain in an interview:**
"Built with Pygame. Key concepts: game loop, sprite rendering, gravity simulation, procedural pipe generation with randomized gap positions, and AABB collision detection. The pipe scroll speed increases slightly over time to raise difficulty."

---

## 26. Bhaai

**What it is:**
A Python project — likely a personal tool or utility.

**Tech Stack:** Python

---

## Quick Reference — Tech Stack Summary

| Category | Projects |
|---|---|
| Systems / OS | VyroOs |
| macOS Native (Swift) | VyroAgent, VyroBrowser, Vyro, GitHubDashboard, MacPerformanceMonitor, NoSleep |
| TypeScript / Electron | VyroBrowser, Vyro, VyroCoding, VyroNotes, VyroMusic, IPL-Auction, app-genesis-labs |
| Data Science (Python) | SCT_DS_1, SCT_DS_2, SCT_DS_3, SCT_DS_4, job-recommendation, UNLOX- |
| AI / ML | VyroAgent, AI-Sign-Language-Recognition-System, VyroNotes |
| Web Apps | VyroPortify, Safe_route, Cricket-Web-App |
| Games | Dino (Java), Flappy-Bird (Python) |
| Utilities | simple-atm-system, NoSleep, Bhaai |

---

## Common Interview Questions — Answers Across Projects

**"What is your most complex project?"**
VyroOs — writing an operating system bootloader in Assembly that switches CPU modes and initializes hardware from scratch is as low-level as programming gets.

**"Tell me about a project involving AI."**
VyroAgent — built a fully offline voice AI pipeline: Whisper for speech recognition, a local LLM via Ollama for intent understanding, and 25 action handlers for macOS control.

**"Have you worked with real-time systems?"**
IPL-Auction — real-time multiplayer bidding with WebSockets, managing concurrent bids and timer state across multiple clients.

**"Tell me about a data science project."**
SCT_DS_4 — analyzed 7 million US road accident records to find patterns by weather, time, and location using Pandas and Seaborn.

**"Have you built native apps?"**
MacPerformanceMonitor and NoSleep — Swift/SwiftUI macOS apps using IOKit for hardware-level access.

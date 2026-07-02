# 0xL33XY 2026 CTF Platform

Welcome to the 0xL33XY 2026 CTF Platform! This repository contains a collection of web exploitation, cryptography, and reverse engineering challenges designed for cybersecurity training and competitions. 

The platform features an automated Game Server engine (`game_server.sh`) that provides NTP-synced tick-based flag rotation and factory resets every 20 minutes, simulating a highly dynamic Attack & Defense or Jeopardy environment.

## ⚠️ Disclaimer & Watermark

> [!IMPORTANT]
> **Adaptation Notice & Credits**
> 
> Please note that several challenges within this repository are not entirely original and have been adapted, modified, or inspired by the following prestigious Capture The Flag competitions and events:
> 
> - **PlayIT CTF**
> - **0xV01D CTF 2026**
> - **Seleksi Internal Telkom University Gemastik 2025**
> 
> These adaptations were made strictly for educational purposes, training, and internal skill development. Full credits and respect go to the original challenge authors and organizers of the aforementioned events. 

## Features

- **Automated Factory Reset**: Containers are destroyed and recreated every 20 minutes to ensure a pristine environment for all players and to wipe attacker backdoors.
- **Dynamic Flags**: Flags are dynamically generated and injected into the containers upon every tick rotation.
- **Realistic Exploitation Scenarios**: Challenges emulate real-world corporate applications, complete with internal logic, realistic UI/UX, and authentication portals.

## Quick Start

### Requirements
- Docker
- Docker Compose
- PowerShell (Windows) or Bash (Linux)

### Running the Platform
You can start the entire infrastructure using the provided scripts:

**Windows:**
```powershell
.\start-all.ps1
```

**Linux/macOS:**
```bash
./start-all.sh
```

### Stopping the Platform
To safely tear down the infrastructure and remove all containers:

**Windows:**
```powershell
.\stop-all.ps1
```

**Linux/macOS:**
```bash
./stop-all.sh
```

---
*Developed for training and learning. Happy Hacking!*

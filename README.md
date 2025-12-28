# Zi Wei Dou Shu App (紫微斗數命盤)

A web application for generating and analyzing Zi Wei Dou Shu (Chinese Astrology) destiny boards and fortunes.

## Features

- **Destiny Board (本命盤):** Generate a full destiny chart based on solar or lunar birth dates.
- **Yearly Fortune (流年):** Calculate yearly influences and star transformations for any given year.
- **Monthly Fortune (流月):** Analyze monthly trends within a specific year.
- **10-Year Fortune (大運):** Explore long-term luck cycles (decades) throughout your life.
- **Interactive UI:** A modern, responsive interface for inputting birth data and viewing detailed charts.
- **Data Export:** Export charts and fortune data to JSON format.

## Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Backend:** Node.js with Express
- **Astrology Engine:** `fortel-ziweidoushu` library

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher recommended)

### Installation

1. Clone the repository:
   ```bash
   git clone git@github.com:rwforest/ziwei_app.git
   cd ziwei_app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running the App

Start the production server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Usage

1. Select the calendar type (Solar or Lunar).
2. Enter your birth date and time (hour).
3. Select your gender.
4. Click **"排盤 Generate Chart"** to see your base destiny board.
5. Use the sections below to check specific yearly, monthly, or 10-year fortunes.

## License

MIT

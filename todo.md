# TODO Application - Development Plan

## Design Guidelines

### Color Palette
- Primary Background: #F5F5F5 (Light Gray)
- Card Background: #FFFFFF (White)
- Primary Accent: #4A90D9 (Blue)
- Danger: #E74C3C (Red)
- Success: #27AE60 (Green)
- Text Primary: #333333
- Text Secondary: #777777
- Border: #E0E0E0
- Completed Task: #B0B0B0

### Typography
- Font: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif
- Heading: 28px, bold
- Body: 16px, regular
- Small: 14px

### Key Component Styles
- Buttons: Rounded 6px, hover transitions
- Cards: White background, subtle shadow, rounded 8px
- Inputs: Full width, border-bottom style, focus accent color
- Tabs: Underline active style

## Project Structure

### Frontend Files (pure HTML/CSS/JS)
1. **index.html** — Main HTML page with all UI elements
2. **style.css** — All styles for the application
3. **script.js** — All frontend logic (tasks array, rendering, pagination, tabs, editing)

### Backend Files (Node.js + Express + SQLite)
4. **backend/server.js** — Express server entry point, middleware, CORS
5. **backend/db.js** — SQLite database initialization and connection
6. **backend/routes.js** — All API route handlers
7. **backend/package.json** — Backend dependencies

### Additional
8. **README.md** — Project documentation for GitHub

## Features
- Add task (button + Enter)
- Cancel input (Esc)
- Edit task (click on text, Esc to cancel)
- Delete single task
- Delete all completed tasks
- Select all checkbox
- Tabs: All / Active / Completed with counters
- Pagination (5 per page)
- Max 250 chars
- innerHTML (intentionally vulnerable)
- Backend with SQL injection protection, XSS protection, DoS protection
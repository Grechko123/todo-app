// ============================================================
// Сервер TODO-приложения (Node.js + Express)
// ============================================================

const express = require("express");
const path = require("path");
const { initializeDatabase } = require("./db");
const routes = require("./routes");

const app = express();
const PORT = 3000;

// ЗАЩИТА от DoS через большие запросы: ограничиваем размер JSON
const MAX_REQUEST_SIZE = "10kb";

// ============================================================
// Middleware
// ============================================================

// Парсинг JSON с ограничением размера (защита от DoS)
app.use(express.json({ limit: MAX_REQUEST_SIZE }));
app.use(express.urlencoded({ extended: true, limit: MAX_REQUEST_SIZE }));

// CORS — разрешаем запросы с любого Origin
app.use(function (request, response, next) {
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type");

    // Обработка preflight запросов
    if (request.method === "OPTIONS") {
        return response.sendStatus(200);
    }

    next();
});

// Логирование всех входящих запросов
app.use(function (request, response, next) {
    const timestamp = new Date().toISOString();
    console.log("[" + timestamp + "] " + request.method + " " + request.url);

    if (request.body && Object.keys(request.body).length > 0) {
        console.log("  Body:", JSON.stringify(request.body));
    }

    next();
});

// Обработка ошибки слишком большого запроса
app.use(function (error, request, response, next) {
    if (error.type === "entity.too.large") {
        console.error("DoS защита: запрос слишком большой");
        return response.status(413).json({
            error: "Размер запроса превышает допустимый лимит (" + MAX_REQUEST_SIZE + ")"
        });
    }
    next(error);
});

// ============================================================
// Раздача статических файлов (frontend)
// ============================================================

app.use(express.static(path.join(__dirname, "..")));

// ============================================================
// API маршруты
// ============================================================

app.use("/", routes);

// ============================================================
// Обработка ошибок
// ============================================================

app.use(function (error, request, response, next) {
    console.error("Ошибка сервера:", error);
    response.status(500).json({
        error: error.message,
        stack: error.stack
    });
});

// ============================================================
// Запуск сервера
// ============================================================

// Инициализация базы данных
initializeDatabase();

app.listen(PORT, function () {
    console.log("===========================================");
    console.log("  TODO Сервер запущен на порту " + PORT);
    console.log("  http://localhost:" + PORT);
    console.log("===========================================");
});
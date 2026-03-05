// ============================================================
// Маршруты API для TODO-приложения
// ============================================================

const express = require("express");
const router = express.Router();
const db = require("./db");

// ============================================================
// ЗАЩИТА от Stored XSS: функция очистки текста
// ============================================================

function sanitizeHtml(inputText) {
    if (typeof inputText !== "string") {
        return String(inputText);
    }
    return inputText
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;");
}

// ============================================================
// GET /tasks — Получение задач
// ============================================================

router.get("/tasks", function (request, response) {
    try {
        const filter = request.query.filter || "all";
        const page = parseInt(request.query.page) || 1;
        const limit = parseInt(request.query.limit) || 5;

        const result = db.getAllTasks(filter, page, limit);

        response.json(result);
    } catch (error) {
        console.error("Ошибка при получении задач:", error);
        response.status(500).json({
            error: error.message,
            stack: error.stack
        });
    }
});

// ============================================================
// POST /tasks — Создание задачи
// ============================================================

router.post("/tasks", function (request, response) {
    try {
        const requestBody = request.body;
        let taskText = requestBody.text;
        const taskCompleted = requestBody.completed || false;

        if (!taskText || (typeof taskText === "string" && taskText.trim() === "")) {
            return response.status(400).json({ error: "Текст задачи не может быть пустым" });
        }

        // ЗАЩИТА от Stored XSS: очищаем текст перед сохранением
        taskText = sanitizeHtml(taskText);

        const newTask = db.createTask(taskText, taskCompleted);

        console.log("Создана задача:", newTask);
        response.status(201).json(newTask);
    } catch (error) {
        console.error("Ошибка при создании задачи:", error);
        response.status(500).json({
            error: error.message,
            stack: error.stack
        });
    }
});

// ============================================================
// PATCH /tasks/:id — Обновление задачи
// ============================================================

router.patch("/tasks/:id", function (request, response) {
    try {
        const taskId = parseInt(request.params.id);
        const updates = request.body;

        // ЗАЩИТА от Stored XSS: очищаем текст если он обновляется
        if (updates.text !== undefined) {
            updates.text = sanitizeHtml(updates.text);
        }

        const updatedTask = db.updateTask(taskId, updates);

        if (!updatedTask) {
            return response.status(404).json({ error: "Задача не найдена" });
        }

        console.log("Обновлена задача:", updatedTask);
        response.json(updatedTask);
    } catch (error) {
        console.error("Ошибка при обновлении задачи:", error);
        response.status(500).json({
            error: error.message,
            stack: error.stack
        });
    }
});

// ============================================================
// DELETE /tasks/completed — Удаление всех выполненных задач
// ВАЖНО: этот маршрут должен быть ДО /tasks/:id
// ============================================================

router.delete("/tasks/completed", function (request, response) {
    try {
        const deletedCount = db.deleteCompletedTasks();

        console.log("Удалено выполненных задач:", deletedCount);
        response.json({ message: "Удалено выполненных задач: " + deletedCount, deleted: deletedCount });
    } catch (error) {
        console.error("Ошибка при удалении выполненных задач:", error);
        response.status(500).json({
            error: error.message,
            stack: error.stack
        });
    }
});

// ============================================================
// DELETE /tasks/:id — Удаление задачи
// ============================================================

router.delete("/tasks/:id", function (request, response) {
    try {
        const taskId = parseInt(request.params.id);
        const wasDeleted = db.deleteTask(taskId);

        if (!wasDeleted) {
            return response.status(404).json({ error: "Задача не найдена" });
        }

        console.log("Удалена задача с id:", taskId);
        response.json({ message: "Задача удалена", id: taskId });
    } catch (error) {
        console.error("Ошибка при удалении задачи:", error);
        response.status(500).json({
            error: error.message,
            stack: error.stack
        });
    }
});

module.exports = router;
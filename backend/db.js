// ============================================================
// База данных SQLite для TODO-приложения
// ============================================================

const Database = require("better-sqlite3");
const path = require("path");

const DATABASE_PATH = path.join(__dirname, "todo.db");

let database = null;

function initializeDatabase() {
    database = new Database(DATABASE_PATH);

    // Создаём таблицу задач
    database.exec(`
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            text TEXT NOT NULL,
            completed INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    console.log("База данных инициализирована: " + DATABASE_PATH);
    return database;
}

function getDatabase() {
    if (!database) {
        return initializeDatabase();
    }
    return database;
}

// ============================================================
// Функции для работы с задачами
// ============================================================

function getAllTasks(filter, page, limit) {
    const db = getDatabase();

    let whereClause = "";
    if (filter === "active") {
        whereClause = " WHERE completed = 0";
    } else if (filter === "completed") {
        whereClause = " WHERE completed = 1";
    }

    // Получаем общее количество
    const countQuery = "SELECT COUNT(*) as total FROM tasks" + whereClause;
    const countResult = db.prepare(countQuery).get();
    const totalTasks = countResult.total;

    // Получаем задачи с пагинацией (новые сверху)
    const offset = (page - 1) * limit;
    const selectQuery = "SELECT * FROM tasks" + whereClause + " ORDER BY id DESC LIMIT " + limit + " OFFSET " + offset;
    const tasksList = db.prepare(selectQuery).all();

    return {
        tasks: tasksList,
        total: totalTasks,
        page: page,
        limit: limit,
        totalPages: Math.ceil(totalTasks / limit)
    };
}

function createTask(text, completed) {
    const db = getDatabase();

    // ЗАЩИТА от SQL Injection: используем параметризованный запрос
    const insertStatement = db.prepare("INSERT INTO tasks (text, completed) VALUES (?, ?)");
    const result = insertStatement.run(text, completed ? 1 : 0);

    return {
        id: result.lastInsertRowid,
        text: text,
        completed: completed ? 1 : 0
    };
}

function updateTask(taskId, updates) {
    const db = getDatabase();

    // Проверяем существование задачи
    const existingTask = db.prepare("SELECT * FROM tasks WHERE id = ?").get(taskId);
    if (!existingTask) {
        return null;
    }

    // ЗАЩИТА от SQL Injection: используем параметризованный запрос
    const setClauses = [];
    const values = [];

    if (updates.text !== undefined) {
        setClauses.push("text = ?");
        values.push(updates.text);
    }
    if (updates.completed !== undefined) {
        setClauses.push("completed = ?");
        values.push(updates.completed ? 1 : 0);
    }

    if (setClauses.length === 0) {
        return existingTask;
    }

    values.push(taskId);
    const updateQuery = "UPDATE tasks SET " + setClauses.join(", ") + " WHERE id = ?";
    db.prepare(updateQuery).run(...values);

    return db.prepare("SELECT * FROM tasks WHERE id = ?").get(taskId);
}

function deleteTask(taskId) {
    const db = getDatabase();

    const existingTask = db.prepare("SELECT * FROM tasks WHERE id = ?").get(taskId);
    if (!existingTask) {
        return false;
    }

    db.prepare("DELETE FROM tasks WHERE id = ?").run(taskId);
    return true;
}

function deleteCompletedTasks() {
    const db = getDatabase();
    const result = db.prepare("DELETE FROM tasks WHERE completed = 1").run();
    return result.changes;
}

module.exports = {
    initializeDatabase,
    getDatabase,
    getAllTasks,
    createTask,
    updateTask,
    deleteTask,
    deleteCompletedTasks
};
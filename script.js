// ============================================================
// TODO Application - Frontend (чистый JavaScript)
// Намеренно уязвимое приложение для учебных целей
// ============================================================

// Конфигурация
const TASKS_PER_PAGE = 5;
const MAX_TASK_LENGTH = 250;
const BACKEND_URL = "http://localhost:3000";

// Состояние приложения
let tasks = [];
let currentFilter = "all";
let currentPage = 1;
let nextTaskId = 1;
let useBackend = false;

// DOM элементы
const taskInput = document.getElementById("taskInput");
const addTaskButton = document.getElementById("addTaskButton");
const selectAllCheckbox = document.getElementById("selectAllCheckbox");
const deleteCompletedButton = document.getElementById("deleteCompletedButton");
const taskListElement = document.getElementById("taskList");
const paginationElement = document.getElementById("pagination");
const countAllElement = document.getElementById("countAll");
const countActiveElement = document.getElementById("countActive");
const countCompletedElement = document.getElementById("countCompleted");
const connectionStatusElement = document.getElementById("connectionStatus");
const tabButtons = document.querySelectorAll(".tab-button");

// ============================================================
// Инициализация
// ============================================================

document.addEventListener("DOMContentLoaded", function () {
    checkBackendConnection();
    setupEventListeners();
    renderApplication();
    taskInput.focus();
});

function setupEventListeners() {
    // Добавление задачи по кнопке
    addTaskButton.addEventListener("click", function () {
        addTask();
    });

    // Добавление задачи по Enter, отмена по Esc
    taskInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            addTask();
        }
        if (event.key === "Escape") {
            taskInput.value = "";
            taskInput.focus();
        }
    });

    // Выбрать все
    selectAllCheckbox.addEventListener("change", function () {
        toggleAllTasks(selectAllCheckbox.checked);
    });

    // Удалить выполненные
    deleteCompletedButton.addEventListener("click", function () {
        deleteCompletedTasks();
    });

    // Вкладки
    tabButtons.forEach(function (tabButton) {
        tabButton.addEventListener("click", function () {
            currentFilter = tabButton.getAttribute("data-filter");
            currentPage = 1;
            tabButtons.forEach(function (button) {
                button.classList.remove("active");
            });
            tabButton.classList.add("active");
            renderApplication();
        });
    });
}

// ============================================================
// Проверка подключения к backend
// ============================================================

async function checkBackendConnection() {
    try {
        const response = await fetch(BACKEND_URL + "/tasks?filter=all&page=1&limit=1", {
            method: "GET",
            signal: AbortSignal.timeout(2000)
        });
        if (response.ok) {
            useBackend = true;
            connectionStatusElement.textContent = "✅ Подключено к серверу";
            connectionStatusElement.className = "connection-status connected";
            await loadTasksFromBackend();
        }
    } catch (error) {
        useBackend = false;
        connectionStatusElement.textContent = "⚡ Локальный режим (без сервера)";
        connectionStatusElement.className = "connection-status disconnected";
    }
    renderApplication();
}

// ============================================================
// Backend API функции
// ============================================================

async function loadTasksFromBackend() {
    try {
        const response = await fetch(BACKEND_URL + "/tasks?filter=all&page=1&limit=1000");
        const data = await response.json();
        if (Array.isArray(data.tasks)) {
            tasks = data.tasks.map(function (task) {
                return {
                    id: task.id,
                    text: task.text,
                    completed: Boolean(task.completed)
                };
            });
            if (tasks.length > 0) {
                nextTaskId = Math.max(...tasks.map(function (task) { return task.id; })) + 1;
            }
        }
    } catch (error) {
        console.error("Ошибка загрузки задач:", error);
    }
}

async function createTaskOnBackend(taskText) {
    try {
        const response = await fetch(BACKEND_URL + "/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: taskText, completed: false })
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Ошибка создания задачи на сервере:", error);
        return null;
    }
}

async function updateTaskOnBackend(taskId, updates) {
    try {
        await fetch(BACKEND_URL + "/tasks/" + taskId, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates)
        });
    } catch (error) {
        console.error("Ошибка обновления задачи на сервере:", error);
    }
}

async function deleteTaskOnBackend(taskId) {
    try {
        await fetch(BACKEND_URL + "/tasks/" + taskId, {
            method: "DELETE"
        });
    } catch (error) {
        console.error("Ошибка удаления задачи на сервере:", error);
    }
}

async function deleteCompletedOnBackend() {
    try {
        await fetch(BACKEND_URL + "/tasks/completed", {
            method: "DELETE"
        });
    } catch (error) {
        console.error("Ошибка удаления выполненных задач на сервере:", error);
    }
}

// ============================================================
// Операции с задачами
// ============================================================

async function addTask() {
    const taskText = taskInput.value;

    if (taskText.trim() === "") {
        taskInput.focus();
        return;
    }

    if (taskText.length > MAX_TASK_LENGTH) {
        alert("Максимальная длина задачи — " + MAX_TASK_LENGTH + " символов.");
        taskInput.focus();
        return;
    }

    if (useBackend) {
        const backendResult = await createTaskOnBackend(taskText);
        if (backendResult && backendResult.id) {
            tasks.unshift({
                id: backendResult.id,
                text: taskText,
                completed: false
            });
        } else {
            // Fallback к локальному добавлению
            const newTask = {
                id: nextTaskId,
                text: taskText,
                completed: false
            };
            nextTaskId++;
            tasks.unshift(newTask);
        }
    } else {
        const newTask = {
            id: nextTaskId,
            text: taskText,
            completed: false
        };
        nextTaskId++;
        tasks.unshift(newTask);
    }

    taskInput.value = "";
    currentPage = 1;
    renderApplication();
    taskInput.focus();
}

async function toggleTaskCompleted(taskId) {
    const taskIndex = tasks.findIndex(function (task) {
        return task.id === taskId;
    });

    if (taskIndex === -1) return;

    tasks[taskIndex].completed = !tasks[taskIndex].completed;

    if (useBackend) {
        await updateTaskOnBackend(taskId, { completed: tasks[taskIndex].completed });
    }

    renderApplication();
}

async function deleteTask(taskId) {
    tasks = tasks.filter(function (task) {
        return task.id !== taskId;
    });

    if (useBackend) {
        await deleteTaskOnBackend(taskId);
    }

    // Корректировка страницы если текущая стала пустой
    const filteredTasks = getFilteredTasks();
    const totalPages = Math.ceil(filteredTasks.length / TASKS_PER_PAGE);
    if (currentPage > totalPages && totalPages > 0) {
        currentPage = totalPages;
    }
    if (totalPages === 0) {
        currentPage = 1;
    }

    renderApplication();
}

async function toggleAllTasks(isCompleted) {
    tasks.forEach(function (task) {
        task.completed = isCompleted;
    });

    if (useBackend) {
        const updatePromises = tasks.map(function (task) {
            return updateTaskOnBackend(task.id, { completed: isCompleted });
        });
        await Promise.all(updatePromises);
    }

    renderApplication();
}

async function deleteCompletedTasks() {
    const completedTasksExist = tasks.some(function (task) {
        return task.completed;
    });

    if (!completedTasksExist) return;

    tasks = tasks.filter(function (task) {
        return !task.completed;
    });

    if (useBackend) {
        await deleteCompletedOnBackend();
    }

    // Корректировка страницы
    const filteredTasks = getFilteredTasks();
    const totalPages = Math.ceil(filteredTasks.length / TASKS_PER_PAGE);
    if (currentPage > totalPages && totalPages > 0) {
        currentPage = totalPages;
    }
    if (totalPages === 0) {
        currentPage = 1;
    }

    selectAllCheckbox.checked = false;
    renderApplication();
}

async function editTask(taskId, newText) {
    const taskIndex = tasks.findIndex(function (task) {
        return task.id === taskId;
    });

    if (taskIndex === -1) return;

    tasks[taskIndex].text = newText;

    if (useBackend) {
        await updateTaskOnBackend(taskId, { text: newText });
    }

    renderApplication();
}

// ============================================================
// Фильтрация и пагинация
// ============================================================

function getFilteredTasks() {
    if (currentFilter === "active") {
        return tasks.filter(function (task) {
            return !task.completed;
        });
    }
    if (currentFilter === "completed") {
        return tasks.filter(function (task) {
            return task.completed;
        });
    }
    return tasks;
}

function getPagedTasks(filteredTasks) {
    const startIndex = (currentPage - 1) * TASKS_PER_PAGE;
    const endIndex = startIndex + TASKS_PER_PAGE;
    return filteredTasks.slice(startIndex, endIndex);
}

// ============================================================
// Рендеринг
// ============================================================

function renderApplication() {
    renderCounters();
    renderTaskList();
    renderPagination();
    updateSelectAllCheckbox();
}

function renderCounters() {
    const allCount = tasks.length;
    const activeCount = tasks.filter(function (task) {
        return !task.completed;
    }).length;
    const completedCount = tasks.filter(function (task) {
        return task.completed;
    }).length;

    countAllElement.innerHTML = allCount;
    countActiveElement.innerHTML = activeCount;
    countCompletedElement.innerHTML = completedCount;
}

function renderTaskList() {
    const filteredTasks = getFilteredTasks();
    const pagedTasks = getPagedTasks(filteredTasks);

    if (filteredTasks.length === 0) {
        let emptyMessage = "Нет задач";
        if (currentFilter === "active") {
            emptyMessage = "Нет активных задач";
        } else if (currentFilter === "completed") {
            emptyMessage = "Нет завершённых задач";
        }
        taskListElement.innerHTML = '<div class="empty-state">' + emptyMessage + '</div>';
        return;
    }

    let taskListHtml = "";

    pagedTasks.forEach(function (task) {
        const completedClass = task.completed ? " completed" : "";
        const checkedAttribute = task.completed ? " checked" : "";

        // НАМЕРЕННО используем innerHTML без экранирования (уязвимость XSS)
        taskListHtml += '<div class="task-item' + completedClass + '" data-task-id="' + task.id + '">';
        taskListHtml += '<input type="checkbox" class="task-checkbox checkbox"' + checkedAttribute + ' onclick="toggleTaskCompleted(' + task.id + ')">';
        taskListHtml += '<span class="task-text" onclick="startEditingTask(' + task.id + ')">' + task.text + '</span>';
        taskListHtml += '<button class="button-delete-task" onclick="deleteTask(' + task.id + ')" title="Удалить">✕</button>';
        taskListHtml += '</div>';
    });

    taskListElement.innerHTML = taskListHtml;
}

function renderPagination() {
    const filteredTasks = getFilteredTasks();
    const totalPages = Math.ceil(filteredTasks.length / TASKS_PER_PAGE);

    if (totalPages <= 1) {
        paginationElement.innerHTML = "";
        return;
    }

    let paginationHtml = "";

    // Кнопка "Назад"
    const prevDisabled = currentPage === 1 ? " disabled" : "";
    paginationHtml += '<button class="pagination-button"' + prevDisabled + ' onclick="goToPage(' + (currentPage - 1) + ')">←</button>';

    // Номера страниц
    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
        const activeClass = pageNumber === currentPage ? " active" : "";
        paginationHtml += '<button class="pagination-button' + activeClass + '" onclick="goToPage(' + pageNumber + ')">' + pageNumber + '</button>';
    }

    // Кнопка "Вперёд"
    const nextDisabled = currentPage === totalPages ? " disabled" : "";
    paginationHtml += '<button class="pagination-button"' + nextDisabled + ' onclick="goToPage(' + (currentPage + 1) + ')">→</button>';

    // Информация о странице
    paginationHtml += '<span class="pagination-info">Стр. ' + currentPage + ' из ' + totalPages + '</span>';

    paginationElement.innerHTML = paginationHtml;
}

function updateSelectAllCheckbox() {
    if (tasks.length === 0) {
        selectAllCheckbox.checked = false;
        return;
    }

    const allCompleted = tasks.every(function (task) {
        return task.completed;
    });

    selectAllCheckbox.checked = allCompleted;
}

// ============================================================
// Редактирование задачи
// ============================================================

function startEditingTask(taskId) {
    const taskIndex = tasks.findIndex(function (task) {
        return task.id === taskId;
    });

    if (taskIndex === -1) return;

    const taskItem = document.querySelector('.task-item[data-task-id="' + taskId + '"]');
    if (!taskItem) return;

    const taskTextElement = taskItem.querySelector(".task-text");
    const originalText = tasks[taskIndex].text;

    // Создаём поле ввода для редактирования
    const editInput = document.createElement("input");
    editInput.type = "text";
    editInput.className = "task-edit-input";
    editInput.value = originalText;
    editInput.maxLength = MAX_TASK_LENGTH;

    // Заменяем текст на поле ввода
    taskTextElement.replaceWith(editInput);
    editInput.focus();
    editInput.setSelectionRange(editInput.value.length, editInput.value.length);

    // Обработка клавиш
    editInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            const newText = editInput.value;
            if (newText.trim() !== "") {
                editTask(taskId, newText);
            } else {
                renderApplication();
            }
        }
        if (event.key === "Escape") {
            // Отмена редактирования — возвращаем прежнее значение
            renderApplication();
        }
    });

    // Сохранение при потере фокуса
    editInput.addEventListener("blur", function () {
        const newText = editInput.value;
        if (newText.trim() !== "" && newText !== originalText) {
            editTask(taskId, newText);
        } else {
            renderApplication();
        }
    });
}

// ============================================================
// Навигация по страницам
// ============================================================

function goToPage(pageNumber) {
    const filteredTasks = getFilteredTasks();
    const totalPages = Math.ceil(filteredTasks.length / TASKS_PER_PAGE);

    if (pageNumber < 1 || pageNumber > totalPages) return;

    currentPage = pageNumber;
    renderApplication();
}
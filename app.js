document.addEventListener("DOMContentLoaded", () => {
    const TASKS_KEY = "tasks";
    const ROUTINE_KEY = "routineTemplate";
    const taskForm = document.getElementById("task-form");
    const taskList = document.getElementById("task-list");
    const calendar = document.getElementById("calendar");
    const darkModeToggle = document.getElementById("dark-mode-toggle");
    const sidebarToggle = document.querySelector(".sidebar-toggle");
    const sidebar = document.querySelector(".sidebar");
    const tasksLink = document.getElementById("tasks-link");
    const calendarLink = document.getElementById("calendar-link");
    const settingsLink = document.getElementById("settings-link");
    const settingsPane = document.getElementById("settings-pane");
    const saveRoutineBtn = document.getElementById("save-routine");
    const loadRoutineBtn = document.getElementById("load-routine");
    const taskFilter = document.getElementById("task-filter");
    let editingTaskId = null;

    loadTasks();

    // Dark mode initialization
    if (localStorage.getItem("darkMode") === "true" || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.body.classList.add("dark-mode");
        darkModeToggle.checked = true;
    }
    darkModeToggle.addEventListener("change", () => {
        document.body.classList.toggle("dark-mode");
        localStorage.setItem("darkMode", darkModeToggle.checked);
    });

    // Sidebar toggle
    sidebarToggle.addEventListener("click", () => sidebar.classList.toggle("open"));

    // View switching
    const setView = (view) => {
        taskList.style.display = view === "tasks" ? "block" : "none";
        calendar.style.display = view === "calendar" ? "block" : "none";
        settingsPane.style.display = view === "settings" ? "block" : "none";
        localStorage.setItem("view", view);
        if (view !== "settings") loadTasks();
    };
    tasksLink.addEventListener("click", (e) => { e.preventDefault(); setView("tasks"); });
    calendarLink.addEventListener("click", (e) => { e.preventDefault(); setView("calendar"); });
    settingsLink.addEventListener("click", (e) => { e.preventDefault(); setView("settings"); });
    setView(localStorage.getItem("view") || "calendar");

    taskForm.addEventListener("submit", (event) => {
        event.preventDefault();
        
        const taskDate = document.getElementById("task-date").value;
        const taskTime = document.getElementById("task-time").value;
        const taskDesc = document.getElementById("task-desc").value;
        const taskCategory = document.getElementById("task-category").value;
        const taskRepeat = document.getElementById("task-repeat").value;

        if (!taskDate || !taskTime || !taskDesc) return;

        const now = new Date();
        const taskDateTime = new Date(`${taskDate}T${taskTime}`);
        if (taskDateTime < now && taskRepeat === "none") {
            showToast("Warning: Task is in the past!", "orange");
        }

        const task = {
            id: editingTaskId || Date.now() + Math.random().toString(36).substr(2, 9),
            date: taskDate,
            time: taskTime,
            desc: taskDesc,
            category: taskCategory,
            repeat: taskRepeat,
            completed: false,
            archived: false,
        };

        saveTask(task);
        clearTaskList();
        loadTasks();
        scheduleNotification(task);

        showToast(editingTaskId ? "Task updated!" : "Task added!", "green");
        taskForm.reset();
        editingTaskId = null;
        taskForm.querySelector("button").textContent = "Add Task";
    });

    taskList.addEventListener("click", (event) => {
        const taskCard = event.target.closest(".task-card");
        if (!taskCard) return;

        const id = taskCard.dataset.id;

        if (event.target.classList.contains("delete-btn")) {
            removeTask(id);
            taskCard.remove();
            showToast("Task deleted!", "red");
        } else if (event.target.classList.contains("edit-btn")) {
            editingTaskId = id;
            document.getElementById("task-date").value = taskCard.dataset.date;
            document.getElementById("task-time").value = taskCard.dataset.time;
            document.getElementById("task-desc").value = taskCard.dataset.desc;
            document.getElementById("task-category").value = taskCard.dataset.category;
            document.getElementById("task-repeat").value = taskCard.dataset.repeat;
            taskForm.querySelector("button").textContent = "Update Task";
            removeTask(id);
            taskCard.remove();
        } else if (event.target.classList.contains("complete-btn")) {
            toggleTaskCompletion(id, taskCard);
        } else if (event.target.classList.contains("archive-btn")) {
            archiveTask(id);
            taskCard.remove();
            showToast("Task archived!", "gray");
        }
    });

    function saveTask(task) {
        try {
            let tasks = getTasks();
            if (editingTaskId) {
                tasks = tasks.map(t => t.id === task.id ? task : t);
            } else {
                tasks.push(task);
            }
            localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
        } catch (e) {
            console.error("Error saving task:", e);
            showToast("Error saving task!", "red");
        }
    }

    function loadTasks() {
        try {
            let tasks = getTasks().filter(task => !task.archived);
            const filter = taskFilter.value;
            if (filter === "completed") tasks = tasks.filter(task => task.completed);
            else if (filter === "work") tasks = tasks.filter(task => task.category === "Work");
            else if (filter === "personal") tasks = tasks.filter(task => task.category === "Personal");
            tasks.sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));
            clearTaskList();
            if (localStorage.getItem("view") === "tasks") {
                tasks.forEach(displayTask);
            } else {
                updateCalendar(tasks);
            }
        } catch (e) {
            console.error("Error loading tasks:", e);
            showToast("Error loading tasks!", "red");
        }
    }

    function getTasks() {
        return JSON.parse(localStorage.getItem(TASKS_KEY)) || [];
    }

    function displayTask(task) {
        const taskItem = document.createElement("div");
        taskItem.classList.add("task-card");
        taskItem.dataset.id = task.id;
        taskItem.dataset.date = task.date;
        taskItem.dataset.time = task.time;
        taskItem.dataset.desc = task.desc;
        taskItem.dataset.category = task.category;
        taskItem.dataset.repeat = task.repeat;
        if (task.completed) taskItem.classList.add("completed");

        const categoryColor = getCategoryColor(task.category);
        taskItem.innerHTML = `
            <div>
                <span class="category-dot" style="background-color: ${categoryColor}"></span>
                <strong>${task.date} ${formatTime(task.time)}</strong>
                <p>${task.desc} ${task.repeat !== "none" ? `(${task.repeat})` : ""}</p>
            </div>
            <div class="task-buttons">
                <button class="complete-btn">${task.completed ? "✅" : "⬜"}</button>
                <button class="edit-btn">✏️ Edit</button>
                <button class="archive-btn">🗄️ Archive</button>
                <button class="delete-btn">❌ Delete</button>
            </div>
        `;

        taskList.appendChild(taskItem);
    }

    function removeTask(id) {
        try {
            let tasks = getTasks().filter(task => task.id !== id);
            localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
            loadTasks();
        } catch (e) {
            console.error("Error removing task:", e);
        }
    }

    function toggleTaskCompletion(id, taskCard) {
        let tasks = getTasks();
        const task = tasks.find(t => t.id === id);
        task.completed = !task.completed;
        localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
        taskCard.classList.toggle("completed");
        taskCard.querySelector(".complete-btn").textContent = task.completed ? "✅" : "⬜";
        showToast(task.completed ? "Task completed!" : "Task marked incomplete!", "green");
        loadTasks();
    }

    function archiveTask(id) {
        let tasks = getTasks();
        const task = tasks.find(t => t.id === id);
        task.archived = true;
        localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
        loadTasks();
    }

    function updateCalendar(tasks) {
        calendar.innerHTML = "<h2>Calendar View</h2>";
        const groupedTasks = tasks.reduce((acc, task) => {
            acc[task.date] = acc[task.date] || [];
            acc[task.date].push(task);
            return acc;
        }, {});
        Object.keys(groupedTasks).sort().forEach(date => {
            const dateDiv = document.createElement("div");
            dateDiv.innerHTML = `<h3>${date}</h3>`;
            groupedTasks[date].forEach(task => {
                const taskDiv = document.createElement("div");
                taskDiv.className = `task-card ${task.completed ? "completed" : ""}`;
                taskDiv.innerHTML = `
                    <span style="color: ${getCategoryColor(task.category)}">${formatTime(task.time)}</span> 
                    ${task.desc} ${task.repeat !== "none" ? `(${task.repeat})` : ""}
                `;
                dateDiv.appendChild(taskDiv);
            });
            calendar.appendChild(dateDiv);
        });
    }

    function clearTaskList() {
        taskList.innerHTML = "";
    }

    // Routine management
    saveRoutineBtn.addEventListener("click", () => {
        const routine = getTasks().filter(t => !t.archived).map(task => ({
            ...task,
            id: null,
            date: null,
            completed: false,
            archived: false
        }));
        localStorage.setItem(ROUTINE_KEY, JSON.stringify(routine));
        showToast("Routine saved!", "green");
    });

    loadRoutineBtn.addEventListener("click", () => {
        const template = JSON.parse(localStorage.getItem(ROUTINE_KEY)) || [];
        const today = new Date().toISOString().split("T")[0];
        template.forEach(task => {
            task.id = Date.now() + Math.random().toString(36).substr(2, 9);
            task.date = document.getElementById("task-date").value || today;
            saveTask(task);
            scheduleNotification(task);
        });
        loadTasks();
        showToast("Routine loaded!", "green");
    });

    taskFilter.addEventListener("change", loadTasks);

    if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
    }

    window.addEventListener("online", () => document.getElementById("offline-indicator").style.display = "none");
    window.addEventListener("offline", () => document.getElementById("offline-indicator").style.display = "block");
});

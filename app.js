document.addEventListener("DOMContentLoaded", () => {
    const TASKS_KEY = "tasks";
    const taskForm = document.getElementById("task-form");
    const taskList = document.getElementById("task-list");
    const toast = document.getElementById("toast");
    let editingTaskId = null; // Track task being edited

    loadTasks();

    taskForm.addEventListener("submit", (event) => {
        event.preventDefault();
        
        const taskDate = document.getElementById("task-date").value;
        const taskTime = document.getElementById("task-time").value;
        const taskDesc = document.getElementById("task-desc").value;

        if (!taskDate || !taskTime || !taskDesc) return;

        const now = new Date();
        const taskDateTime = new Date(`${taskDate}T${taskTime}`);
        if (taskDateTime < now) {
            showToast("Warning: Task is in the past!", "orange");
        }

        const task = {
            id: editingTaskId || Date.now() + Math.random().toString(36).substr(2, 9), // Unique ID
            date: taskDate,
            time: taskTime,
            desc: taskDesc,
            completed: false
        };

        saveTask(task);
        clearTaskList();
        loadTasks(); // Reload sorted tasks
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
            taskForm.querySelector("button").textContent = "Update Task";
            removeTask(id);
            taskCard.remove();
        } else if (event.target.classList.contains("complete-btn")) {
            toggleTaskCompletion(id, taskCard);
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
            let tasks = getTasks();
            tasks.sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));
            tasks.forEach(displayTask);
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
        if (task.completed) taskItem.classList.add("completed");

        taskItem.innerHTML = `
            <div>
                <strong>${task.date} ${formatTime(task.time)}</strong>
                <p>${task.desc}</p>
            </div>
            <div class="task-buttons">
                <button class="complete-btn">${task.completed ? "✅" : "⬜"}</button>
                <button class="edit-btn">✏️ Edit</button>
                <button class="delete-btn">❌ Delete</button>
            </div>
        `;

        taskList.appendChild(taskItem);
    }

    function removeTask(id) {
        try {
            let tasks = getTasks().filter(task => task.id !== id);
            localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
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
    }

    function formatTime(time) {
        let [hour, minute] = time.split(":");
        const suffix = hour >= 12 ? "PM" : "AM";
        hour = hour % 12 || 12;
        return `${hour}:${minute} ${suffix}`;
    }

    function scheduleNotification(task) {
        if (Notification.permission === "granted") {
            const time = new Date(`${task.date}T${task.time}`);
            const now = new Date();
            const delay = time - now;

            if (delay > 0) {
                setTimeout(() => {
                    new Notification("Task Reminder", {
                        body: `${task.desc} at ${formatTime(task.time)}`,
                        icon: "icon.png"
                    });
                }, delay);
            }
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(permission => {
                if (permission !== "granted") showToast("Notifications blocked!", "orange");
            });
        }
    }

    function showToast(message, color) {
        toast.textContent = message;
        toast.style.backgroundColor = color;
        toast.style.display = "block";
        setTimeout(() => toast.style.display = "none", 2000);
    }

    function clearTaskList() {
        taskList.innerHTML = "";
    }

    if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
    }

    // Offline indicator
    window.addEventListener("online", () => document.getElementById("offline-indicator").style.display = "none");
    window.addEventListener("offline", () => document.getElementById("offline-indicator").style.display = "block");
});

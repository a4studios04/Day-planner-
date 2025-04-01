document.addEventListener("DOMContentLoaded", () => {
    const taskForm = document.getElementById("task-form");
    const taskList = document.getElementById("task-list");

    loadTasks();

    taskForm.addEventListener("submit", (event) => {
        event.preventDefault();
        
        const taskDate = document.getElementById("task-date").value;
        const taskTime = document.getElementById("task-time").value;
        const taskDesc = document.getElementById("task-desc").value;

        if (!taskDate || !taskTime || !taskDesc) return;

        const task = { date: taskDate, time: taskTime, desc: taskDesc };
        saveTask(task);
        displayTask(task);

        scheduleNotification(task);

        taskForm.reset();
    });

    taskList.addEventListener("click", (event) => {
        if (event.target.classList.contains("delete-btn")) {
            const taskCard = event.target.closest(".task-card");
            removeTask(taskCard.dataset.id);
            taskCard.remove();
        } else if (event.target.classList.contains("edit-btn")) {
            const taskCard = event.target.closest(".task-card");
            document.getElementById("task-date").value = taskCard.dataset.date;
            document.getElementById("task-time").value = taskCard.dataset.time;
            document.getElementById("task-desc").value = taskCard.dataset.desc;
            removeTask(taskCard.dataset.id);
            taskCard.remove();
        }
    });

    function saveTask(task) {
        let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
        task.id = Date.now();
        tasks.push(task);
        localStorage.setItem("tasks", JSON.stringify(tasks));
    }

    function loadTasks() {
        let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
        tasks.forEach(displayTask);
    }

    function displayTask(task) {
        const taskItem = document.createElement("div");
        taskItem.classList.add("task-card");
        taskItem.dataset.id = task.id;
        taskItem.dataset.date = task.date;
        taskItem.dataset.time = task.time;
        taskItem.dataset.desc = task.desc;

        taskItem.innerHTML = `
            <div>
                <strong>${task.date} ${formatTime(task.time)}</strong>
                <p>${task.desc}</p>
            </div>
            <div class="task-buttons">
                <button class="edit-btn">✏️ Edit</button>
                <button class="delete-btn">❌ Delete</button>
            </div>
        `;

        taskList.appendChild(taskItem);
    }

    function removeTask(id) {
        let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
        tasks = tasks.filter(task => task.id != id);
        localStorage.setItem("tasks", JSON.stringify(tasks));
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
        }
    }

    if (Notification.permission !== "granted") {
        Notification.requestPermission();
    }
});

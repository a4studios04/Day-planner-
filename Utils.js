function showToast(message, color) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.style.backgroundColor = color;
    toast.style.display = "block";
    setTimeout(() => toast.style.display = "none", 2000);
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
                if (task.repeat !== "none") {
                    rescheduleRecurringTask(task);
                }
            }, delay);
        }
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission !== "granted") showToast("Notifications blocked!", "orange");
            else scheduleNotification(task);
        });
    }
}

function rescheduleRecurringTask(task) {
    let nextDate = new Date(`${task.date}T${task.time}`);
    if (task.repeat === "daily") {
        nextDate.setDate(nextDate.getDate() + 1);
    } else if (task.repeat === "weekly") {
        nextDate.setDate(nextDate.getDate() + 7);
    }
    task.date = nextDate.toISOString().split("T")[0];
    saveTask(task);
    scheduleNotification(task);
}

function getCategoryColor(category) {
    return category === "Work" ? "#2196f3" : "#4caf50"; // Blue-5, Green-5
}

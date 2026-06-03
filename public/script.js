const fetchTasks = async () => {
    const res = await fetch("http://localhost:3000/api/tasks");
    const tasks = await res.json();

    const taskList = document.getElementById("taskList");
    taskList.innerHTML = "";

    tasks.forEach(task => {
        const li = document.createElement("li");

        if (task.is_completed) {
            li.classList.add("completed");
        }

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = !!task.is_completed;
        checkbox.onchange = () => toggleTask(task.id, checkbox.checked);

        const span = document.createElement("span");
        span.textContent = task.title;

        if (task.is_completed) {
            span.style.textDecoration = "line-through";
        }

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.onclick = () => deleteTask(task.id);

        li.appendChild(checkbox);
        li.appendChild(span);
        li.appendChild(deleteBtn);
        taskList.appendChild(li);
    });
};

const addTask = async () => {
    const input = document.getElementById("taskInput");
    const title = input.value;

    if (!title.trim()) return;

    await fetch("http://localhost:3000/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title})
    });

    input.value = "";
    fetchTasks();

};

const toggleTask = async (id, completed) => {
    await fetch(`http://localhost:3000/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_completed: completed })
    });
    fetchTasks();
};

const deleteTask = async (id) => {
    await fetch(`http://localhost:3000/api/tasks/${id}`, {
        method: "DELETE"
    });
    fetchTasks();
};

fetchTasks();
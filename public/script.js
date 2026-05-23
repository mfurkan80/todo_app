const fetchTasks = async () => {
    const res = await fetch("http://localhost:3000/api/tasks");
    const tasks = await res.json();

    const taskList = document.getElementById("taskList");
    taskList.innerHTML = "";

    tasks.forEach(task => {
        const li = document.createElement("li");
        li.textContent = task.title;
        taskList.appendChild(li);
    });
};

const addTask = async () => {
    const input = document.getElementById("taskInput");
    const title = input.value;

    if (!title) return;

    await fetch("http://localhost:3000/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title })
    });

    input.value = "";
    fetchTasks();

};

fetchTasks();
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

let editingId = null;

/* ELEMENTS */
const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");

const taskInput = document.getElementById("taskInput");
const categoryInput = document.getElementById("categoryInput");
const dueDateInput = document.getElementById("dueDateInput");
const priorityInput = document.getElementById("priorityInput");

const searchInput = document.getElementById("searchInput");

const modal = document.getElementById("editModal");

/* SAVE */
function saveTasks(){
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

/* TOAST */
function showToast(msg){
    const toast = document.getElementById("toast");
    toast.textContent = msg;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2000);
}

/* ADD TASK */
function addTask(){

    const text = taskInput.value.trim();

    if(!text){
        showToast("Enter a task!");
        return;
    }

    tasks.unshift({
        id: Date.now(),
        text,
        category: categoryInput.value.trim() || "General",
        dueDate: dueDateInput.value || "",
        priority: priorityInput.value,
        completed: false
    });

    taskInput.value = "";
    categoryInput.value = "";
    dueDateInput.value = "";

    saveTasks();
    render();

    showToast("Task added");
}

/* TOGGLE COMPLETE */
function toggleTask(id){

    const task = tasks.find(t => t.id === id);
    task.completed = !task.completed;

    saveTasks();
    render();
}

/* DELETE */
function deleteTask(id){

    tasks = tasks.filter(t => t.id !== id);

    saveTasks();
    render();

    showToast("Task deleted");
}

/* OPEN EDIT */
function openEdit(id){

    editingId = id;

    const task = tasks.find(t => t.id === id);

    document.getElementById("editTaskText").value = task.text;
    document.getElementById("editCategory").value = task.category;
    document.getElementById("editDate").value = task.dueDate;
    document.getElementById("editPriority").value = task.priority;

    modal.style.display = "flex";
}

/* SAVE EDIT */
document.getElementById("saveEdit").addEventListener("click", () => {

    const task = tasks.find(t => t.id === editingId);

    task.text = document.getElementById("editTaskText").value;
    task.category = document.getElementById("editCategory").value;
    task.dueDate = document.getElementById("editDate").value;
    task.priority = document.getElementById("editPriority").value;

    saveTasks();
    modal.style.display = "none";
    render();

    showToast("Task updated");
});

/* CANCEL EDIT */
document.getElementById("cancelEdit").addEventListener("click", () => {
    modal.style.display = "none";
});

/* STATS */
function updateStats(){

    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const high = tasks.filter(t => t.priority === "high").length;

    document.getElementById("totalTasks").textContent = total;
    document.getElementById("completedTasks").textContent = completed;
    document.getElementById("pendingTasks").textContent = pending;
    document.getElementById("highTasks").textContent = high;

    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

    document.getElementById("progressPercent").textContent = percent + "%";
    document.getElementById("progressFill").style.width = percent + "%";
}

/* CATEGORY FILTER */
let currentCategory = "all";

function updateCategories(){

    const wrap = document.getElementById("categoryFilters");

    const categories = [...new Set(tasks.map(t => t.category))];

    wrap.innerHTML = `
        <button class="chip ${currentCategory === "all" ? "active" : ""}" data-category="all">
            All
        </button>
    `;

    categories.forEach(cat => {
        wrap.innerHTML += `
            <button class="chip ${currentCategory === cat ? "active" : ""}" data-category="${cat}">
                ${cat}
            </button>
        `;
    });

    document.querySelectorAll(".chip").forEach(btn => {
        btn.addEventListener("click", () => {
            currentCategory = btn.dataset.category;
            render();
        });
    });
}

/* DUE LABEL */
function getDueLabel(dateStr){

    if(!dateStr) return "";

    const today = new Date();
    const due = new Date(dateStr);

    const diff = Math.ceil((due - today) / 86400000);

    if(diff < 0) return "Overdue";
    if(diff === 0) return "Today";
    if(diff === 1) return "Tomorrow";

    return dateStr;
}

/* RENDER */
function render(){

    taskList.innerHTML = "";

    let filtered = [...tasks];

    const search = searchInput.value.toLowerCase();

    if(search){
        filtered = filtered.filter(t =>
            t.text.toLowerCase().includes(search) ||
            t.category.toLowerCase().includes(search) ||
            t.priority.toLowerCase().includes(search)
        );
    }

    if(currentCategory !== "all"){
        filtered = filtered.filter(t => t.category === currentCategory);
    }

    emptyState.style.display = filtered.length ? "none" : "block";

    filtered.forEach(task => {

        const div = document.createElement("div");
        div.className = "task";
        div.draggable = true;
        div.dataset.id = task.id;

        div.innerHTML = `
            <div class="task-left">

                <input type="checkbox" ${task.completed ? "checked" : ""}>

                <div>

                    <div class="task-text ${task.completed ? "completed" : ""}">
                        ${task.text}
                    </div>

                    <div class="badges">

                        <span class="badge category">${task.category}</span>

                        <span class="badge ${task.priority}">
                            ${task.priority}
                        </span>

                        ${task.dueDate ? `
                            <span class="badge">
                                ${getDueLabel(task.dueDate)}
                            </span>
                        ` : ""}

                    </div>

                </div>

            </div>

            <div class="task-actions">
                <button class="edit">Edit</button>
                <button class="delete">Delete</button>
            </div>
        `;

        /* EVENTS */
        div.querySelector("input").addEventListener("change", () => toggleTask(task.id));
        div.querySelector(".delete").addEventListener("click", () => deleteTask(task.id));
        div.querySelector(".edit").addEventListener("click", () => openEdit(task.id));

        taskList.appendChild(div);
    });

    updateStats();
    updateCategories();
    saveTasks();

    enableDragDrop();
}

/* DRAG & DROP */
function enableDragDrop(){

    const items = document.querySelectorAll(".task");

    let dragged = null;

    items.forEach(item => {

        item.addEventListener("dragstart", () => {
            dragged = item;
        });

        item.addEventListener("dragover", e => {
            e.preventDefault();
        });

        item.addEventListener("drop", () => {

            const from = tasks.findIndex(t => t.id == dragged.dataset.id);
            const to = tasks.findIndex(t => t.id == item.dataset.id);

            const moved = tasks.splice(from, 1)[0];
            tasks.splice(to, 0, moved);

            saveTasks();
            render();
        });
    });
}

/* SEARCH */
searchInput.addEventListener("input", render);

/* ADD BUTTON */
document.getElementById("addBtn").addEventListener("click", addTask);

/* ENTER KEY */
taskInput.addEventListener("keydown", e => {
    if(e.key === "Enter") addTask();
});

/* DARK MODE */
const themeBtn = document.getElementById("themeToggle");

if(localStorage.getItem("theme") === "dark"){
    document.body.classList.add("dark");
}

themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");

    localStorage.setItem(
        "theme",
        document.body.classList.contains("dark") ? "dark" : "light"
    );
});

/* INIT */
render();
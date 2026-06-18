document.addEventListener('DOMContentLoaded', () => {

  const form = document.getElementById('todo-form');
  const input = document.getElementById('todo-input');
  const list = document.getElementById('todo-list');
  const taskCount = document.getElementById('task-count');
  const emptyState = document.getElementById('empty-state');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const timeDisplay = document.getElementById('time-display');

  let currentFilter = 'all';

  let todos = JSON.parse(localStorage.getItem('shibuya-todos')) || [];

  function save() {
    localStorage.setItem('shibuya-todos', JSON.stringify(todos));
  }

  function updateClock() {
    const now = new Date();
    timeDisplay.textContent = now.toLocaleTimeString('en-US', { hour12: false });
  }
  updateClock();
  setInterval(updateClock, 1000);

  function render() {
    const filtered = todos.filter(t => {
      if (currentFilter === 'active') return !t.done;
      if (currentFilter === 'completed') return t.done;
      return true;
    });

    list.innerHTML = '';

    filtered.forEach(todo => {
      const li = document.createElement('li');
      li.className = `todo-item${todo.done ? ' completed' : ''}`;
      li.dataset.id = todo.id;

      const check = document.createElement('input');
      check.type = 'checkbox';
      check.className = 'todo-check';
      check.checked = todo.done;

      const span = document.createElement('span');
      span.className = 'todo-text';
      span.textContent = todo.text;

      const del = document.createElement('button');
      del.className = 'todo-delete';
      del.innerHTML = '&#x2715;';
      del.setAttribute('aria-label', 'Delete task');

      check.addEventListener('change', () => {
        todo.done = check.checked;
        save();
        render();
      });

      del.addEventListener('click', () => {
        todos = todos.filter(t => t.id !== todo.id);
        save();
        render();
      });

      li.appendChild(check);
      li.appendChild(span);
      li.appendChild(del);
      list.appendChild(li);
    });

    const total = todos.length;
    const done = todos.filter(t => t.done).length;
    taskCount.textContent = `${total} tasks (${done} done)`;

    if (todos.length === 0) {
      emptyState.classList.remove('hidden');
    } else {
      emptyState.classList.add('hidden');
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    todos.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      text,
      done: false,
    });

    input.value = '';
    save();
    render();
    input.focus();
  });

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      render();
    });
  });

  render();
});

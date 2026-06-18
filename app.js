document.addEventListener('DOMContentLoaded', () => {

  const form = document.getElementById('todo-form');
  const input = document.getElementById('todo-input');
  const columnSelect = document.getElementById('column-select');
  const board = document.getElementById('board');
  const emptyState = document.getElementById('empty-state');
  const timeDisplay = document.getElementById('time-display');

  const COLUMNS = ['urgent', 'high', 'medium', 'low', 'backlog'];

  let todos = JSON.parse(localStorage.getItem('feifan-todos')) || [];

  function save() {
    localStorage.setItem('feifan-todos', JSON.stringify(todos));
  }

  function updateClock() {
    const now = new Date();
    timeDisplay.textContent = now.toLocaleTimeString('en-US', { hour12: false });
  }
  updateClock();
  setInterval(updateClock, 1000);

  function getColumnEl(col) {
    return document.getElementById(`col-${col}`);
  }

  function getCountEl(col) {
    return document.getElementById(`count-${col}`);
  }

  function render() {
    COLUMNS.forEach(col => {
      const body = getColumnEl(col);
      const items = todos.filter(t => t.column === col);
      body.innerHTML = '';

      items.forEach(todo => {
        const card = document.createElement('div');
        card.className = `todo-card${todo.done ? ' completed' : ''}`;
        card.draggable = true;
        card.dataset.id = todo.id;

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

        del.addEventListener('click', (e) => {
          e.stopPropagation();
          todos = todos.filter(t => t.id !== todo.id);
          save();
          render();
        });

        card.addEventListener('dragstart', () => {
          card.classList.add('dragging');
          card.closest('.column-body').classList.remove('drag-over');
        });

        card.addEventListener('dragend', () => {
          card.classList.remove('dragging');
          document.querySelectorAll('.column-body').forEach(el => el.classList.remove('drag-over'));
        });

        card.appendChild(check);
        card.appendChild(span);
        card.appendChild(del);
        body.appendChild(card);
      });

      getCountEl(col).textContent = items.length;
    });

    const total = todos.length;
    if (total === 0) {
      emptyState.classList.remove('hidden');
    } else {
      emptyState.classList.add('hidden');
    }
  }

  COLUMNS.forEach(col => {
    const body = getColumnEl(col);

    body.addEventListener('dragover', (e) => {
      e.preventDefault();
      body.classList.add('drag-over');
    });

    body.addEventListener('dragleave', () => {
      body.classList.remove('drag-over');
    });

    body.addEventListener('drop', (e) => {
      e.preventDefault();
      body.classList.remove('drag-over');

      const dragging = document.querySelector('.dragging');
      if (!dragging) return;

      const id = dragging.dataset.id;
      const todo = todos.find(t => t.id === id);
      if (todo) {
        todo.column = col;
        save();
        render();
      }
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    todos.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      text,
      column: columnSelect.value,
      done: false,
    });

    input.value = '';
    save();
    render();
    input.focus();
  });

  render();
});

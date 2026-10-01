(() => {
  const form = document.getElementById('ai-form');
  const input = document.getElementById('symptom-input');
  const messages = document.getElementById('ai-messages');
  const status = document.getElementById('ai-status');
  const error = document.getElementById('ai-error');
  const send = document.getElementById('ai-send');
  const clear = document.getElementById('ai-clear');
  let history = [];
  let busy = false;
  function append(role, text) {
    const card = document.createElement('div');
    card.className = 'p-4 rounded-lg whitespace-pre-wrap ' + (role === 'user' ? 'bg-blue-50' : 'bg-gray-50');
    const label = document.createElement('strong');
    label.textContent = role === 'user' ? 'You\n' : 'AI assistant\n';
    card.append(label, document.createTextNode(text));
    messages.append(card);
    messages.scrollTop = messages.scrollHeight;
  }
  fetch('/api/health').then(async response => {
    if (!response.ok) throw new Error();
    const data = await response.json();
    status.textContent = data.configured ? 'OpenAI assistant configured. Conversation stays in this tab until cleared.' : 'Assistant is not configured. The site owner must add a server API key.';
  }).catch(() => { status.textContent = 'Assistant server unavailable. Run this site with its Node server.'; });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || !form.reportValidity()) return;
    const message = input.value.trim();
    if (!message) { error.textContent = 'Please enter a question or symptoms.'; return; }
    busy = true;
    send.disabled = clear.disabled = true;
    send.textContent = 'Thinking…';
    error.textContent = '';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 35000);
    try {
      const response = await fetch('/api/assistant', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history: history.slice(-10) }), signal: controller.signal
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Assistant unavailable. Try again.');
      if (typeof data.reply !== 'string' || !data.reply.trim()) throw new Error('No response received. Please try again.');
      append('user', message);
      append('assistant', data.reply);
      history.push({ role: 'user', text: message }, { role: 'assistant', text: data.reply });
      history = history.slice(-10);
      input.value = '';
    } catch (problem) {
      error.textContent = problem.name === 'AbortError' ? 'The assistant took too long. Please try again.' : problem.message;
    } finally {
      clearTimeout(timeout);
      busy = false;
      send.disabled = clear.disabled = false;
      send.textContent = 'Ask assistant';
    }
  });
  clear.addEventListener('click', () => {
    history = [];
    messages.replaceChildren();
    input.value = '';
    error.textContent = '';
    document.getElementById('ai-consent').checked = false;
    input.focus();
  });
})();

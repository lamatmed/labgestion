try {
  var t = localStorage.getItem('theme') || 'light';
  if (t === 'system') {
    t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  if (t === 'dark') document.documentElement.classList.add('dark');
} catch (e) {}

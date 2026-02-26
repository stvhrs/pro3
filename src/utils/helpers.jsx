export const updateURL = (params) => {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location);
  Object.keys(params).forEach(key => {
    if (params[key] === null) url.searchParams.delete(key);
    else url.searchParams.set(key, params[key]);
  });
  window.history.pushState({}, '', url);
};

export const formatIndoDate = (dateOrTimestamp) => {
  if (!dateOrTimestamp) return '-';
  let date;
  if (dateOrTimestamp.seconds) date = new Date(dateOrTimestamp.seconds * 1000);
  else date = new Date(dateOrTimestamp);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(date);
};

export const generateUniqueId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
};
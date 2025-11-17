export function setFavicon(url) {
  const favicon = document.getElementById("dynamic-favicon");

  if (favicon) {
    favicon.href = url;
  }
}
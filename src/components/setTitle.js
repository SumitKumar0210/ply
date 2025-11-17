export function setTitle(title) {
  const titleTag = document.getElementById("dynamic-title");
  if (titleTag) {
    titleTag.textContent = title;
  }
}
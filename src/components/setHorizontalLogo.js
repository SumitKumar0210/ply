export function setHorizontalLogo(url) {
  const hLogo = document.getElementById("dynamic-hLogo");
  if (hLogo) {
    hLogo.href = url;
  }
}
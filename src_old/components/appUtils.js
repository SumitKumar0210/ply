// appUtils.js - Consolidated utility functions for updating index.html dynamically

/**
 * Sets the document title dynamically by updating the #dynamic-title element
 * @param {string} title - The title to set
 */
export function setTitle(title) {
  if (!title) return;
  
  // Update the title tag with id="dynamic-title"
  const titleTag = document.getElementById("dynamic-title");
  if (titleTag) {
    titleTag.textContent = title;
  } else {
    // Fallback: update document.title directly
    document.title = title;
  }
}

/**
 * Sets the favicon dynamically by updating the #dynamic-favicon element
 * @param {string} url - The favicon URL
 */
export function setFavicon(url) {
  if (!url) return;
  
  // Update the favicon link with id="dynamic-favicon"
  const faviconLink = document.getElementById("dynamic-favicon");
  if (faviconLink) {
    faviconLink.href = url;
  } else {
    // Fallback: create new favicon link
    const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'icon';
    link.href = url;
    link.id = 'dynamic-favicon';
    document.getElementsByTagName('head')[0].appendChild(link);
  }
}

/**
 * Sets the horizontal logo in localStorage
 * @param {string} url - The horizontal logo URL
 */
export function setHorizontalLogo(url) {
  if (!url) return;
  localStorage.setItem("horizontalLogo", url);
}

/**
 * Updates all app details dynamically
 * Updates both the HTML elements and localStorage
 * @param {Object} appDetails - Object containing app configuration
 * @param {string} appDetails.favicon - Favicon URL
 * @param {string} appDetails.logo - Logo URL
 * @param {string} appDetails.horizontal_logo - Horizontal logo URL
 * @param {string} appDetails.application_name - App name
 */
export function updateAppDetails(appDetails) {
  const {
    favicon,
    logo,
    horizontal_logo,
    application_name
  } = appDetails;

  // Update localStorage and DOM elements
  if (favicon) {
    localStorage.setItem("favicon", favicon);
    setFavicon(favicon);
  }
  
  if (logo) {
    localStorage.setItem("logo", logo);
  }
  
  if (horizontal_logo) {
    setHorizontalLogo(horizontal_logo);
  }
  
  if (application_name) {
    localStorage.setItem("application_name", application_name);
    setTitle(application_name);
  }
}

/**
 * Gets app details from localStorage
 * @returns {Object} App details object
 */
export function getAppDetails() {
  return {
    favicon: localStorage.getItem("favicon") || "",
    logo: localStorage.getItem("logo") || "",
    horizontal_logo: localStorage.getItem("horizontalLogo") || "",
    application_name: localStorage.getItem("application_name") || ""
  };
}

/**
 * Clears app details from localStorage
 */
export function clearAppDetails() {
  localStorage.removeItem("favicon");
  localStorage.removeItem("logo");
  localStorage.removeItem("horizontalLogo");
  localStorage.removeItem("application_name");
}

/**
 * Initialize app details on page load
 * Call this when your app starts to load saved settings
 */
export function initializeAppDetails() {
  const details = getAppDetails();
  
  if (details.favicon) {
    setFavicon(details.favicon);
  }
  
  if (details.application_name) {
    setTitle(details.application_name);
  }
}
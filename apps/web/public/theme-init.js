// Applies the stored theme before first paint (ThemeProvider takes over after). Loaded as a
// classic, render-blocking script from index.html; kept out of the bundle so it runs first.
try {
  var t = localStorage.getItem("theme")
} catch (e) {}
if (t !== "light" && t !== "dark")
  t = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
document.documentElement.classList.add(t)
// Mirrors shared/theme's THEME_COLORS.
if (t === "dark")
  document.querySelector('meta[name="theme-color"]').content = "#191C23"

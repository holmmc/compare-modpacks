import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("No app");

app.innerHTML = `
  <div>
  </div>
`;

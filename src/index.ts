import express from "express";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.get("/", (_req, res) => {
  res.json({ message: "Meltwater challenge, hello world" });
});

app.listen(PORT, () => {
  console.log(`Meltwater challenge running on http://localhost:${PORT}`);
});

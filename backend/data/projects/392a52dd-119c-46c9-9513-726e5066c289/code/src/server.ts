// This file might be redundant if app.ts handles server start.
// If using a separate file for server start logic, keep it.
// Otherwise, ensure app.ts exports the app instance and is imported where needed.

import app from './app';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

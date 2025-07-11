// import { web } from "./application/web.js"
// import { logger } from "./application/logging.js"

// web.listen(3000, () => {
//     logger.info("app start")
// })

import { web } from "./application/web.js";

const PORT = 3000;

web.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});

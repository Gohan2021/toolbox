// routes/debug-echo.js
import { Router } from 'express';
const router = Router();

router.post('/debug/echo', (req, res) => {
  res.json({
    headers: req.headers,
    body: req.body,
    keys: Object.keys(req.body || {})
  });
});

export default router;

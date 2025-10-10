
import { Router } from 'express';
// import { GenerationHistoryRepository } from '../../storage/repositories/GenerationHistoryRepository';

const router = Router();

router.get('/history', async (_req, res) => {
  // const user = (req as any).user;
  // const historyRepo = req.app.get('historyRepo') as GenerationHistoryRepository;
  // const history = await historyRepo.findByUserId(user.id);
  // res.json(history);
  res.status(501).json({ message: 'Not Implemented' });
});

export default router;

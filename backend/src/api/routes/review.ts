
import { Router } from 'express';
// import { ReviewWorkflow } from '../../workflows/ReviewWorkflow';

const router = Router();

router.post('/review', async (_req, res) => {
  // const { code } = req.body;
  // const reviewWorkflow = new ReviewWorkflow();
  // const report = await reviewWorkflow.run(code);
  // res.json(report);
  res.status(501).json({ message: 'Not Implemented' });
});

export default router;

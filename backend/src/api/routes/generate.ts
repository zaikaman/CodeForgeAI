
import { Router } from 'express';
// import { GenerateWorkflow } from '../../workflows/GenerateWorkflow';

const router = Router();

router.post('/generate', async (req, res) => {
  // const { prompt, projectId } = req.body;
  // const generateWorkflow = new GenerateWorkflow();
  // const stream = await generateWorkflow.run(prompt, projectId);
  // stream.pipe(res);
  res.status(501).json({ message: 'Not Implemented' });
});

export default router;

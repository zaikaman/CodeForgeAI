
import { Router } from 'express';
// import { ProjectRepository } from '../../storage/repositories/ProjectRepository';

const router = Router();

router.get('/projects', async (req, res) => {
  // const user = (req as any).user;
  // const projectRepo = req.app.get('projectRepo') as ProjectRepository;
  // const projects = await projectRepo.findByUserId(user.id);
  // res.json(projects);
  res.status(501).json({ message: 'Not Implemented' });
});

export default router;

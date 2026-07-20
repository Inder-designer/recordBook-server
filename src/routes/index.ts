import { Router } from 'express';
import userRoutes from "./user";
import recordRoutes from "./record";
import { validateSession } from '../middleware/validateSession';
const router = Router();

router.use("/user", userRoutes);
router.use("/record", validateSession, recordRoutes);

export default router;
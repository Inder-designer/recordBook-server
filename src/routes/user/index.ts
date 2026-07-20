import { Router } from 'express';
import * as user from '../../Contollers/user/user.controller'
import { validateZod } from '../../middleware/validateZod';
import { createUserSchema } from '../../schemas/user/user.schema';

const router = Router();

router.post("/register", validateZod(createUserSchema), user.createUser)
router.post("/login", user.loginUser)
router.post("/logout", user.logout)
router.get("/", user.getMe)
router.get("/find", user.findUser)

export default router;
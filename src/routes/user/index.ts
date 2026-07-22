import { Router } from 'express';
import * as user from '../../Contollers/user/user.controller'
import { validateZod } from '../../middleware/validateZod';
import { createUserSchema, updateNameSchema } from '../../schemas/user/user.schema';
import { validateSession } from '../../middleware/validateSession';

const router = Router();

router.post("/register", validateZod(createUserSchema), user.createUser)
router.post("/login", user.loginUser)
router.patch("/update", validateZod(updateNameSchema), validateSession, user.updateUserName)
router.post("/logout", user.logout)
router.get("/", validateSession, user.getMe)
router.get("/find", user.findUser)

export default router;